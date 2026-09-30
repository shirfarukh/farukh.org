import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { assertAuth, validateInput } from './middleware';
import { issueCertificateInternal } from './certificates';

const StartExamSchema = z.object({
  courseId: z.string(),
});

const SubmitExamSchema = z.object({
  attemptId: z.string(),
  answers: z.record(z.string(), z.string()), // qId -> selectedOptionId
});

export const startFinalExam = onCall(async (request) => {
  const auth = assertAuth(request);
  const { courseId } = validateInput(StartExamSchema, request.data);

  const db = admin.firestore();

  // 1. Check course & settings
  const courseDoc = await db.collection('courses').doc(courseId).get();
  if (!courseDoc.exists) {
    throw new HttpsError('not-found', 'Course not found.');
  }
  const courseData = courseDoc.data()!;
  const examSettings = courseData.exam || { questionCount: 10, timeLimitMin: 30, maxAttempts: 3, cooldownHours: 24 };

  // 2. Check lesson completion prerequisite
  const lessonsSnap = await db.collection('courses').doc(courseId).collection('lessons').where('status', '==', 'published').get();
  const progressDoc = await db.collection('progress').doc(`${auth.uid}_${courseId}`).get();
  const progressData = (progressDoc.exists ? progressDoc.data() : { lessons: {} }) || { lessons: {} };

  const uncompleted = lessonsSnap.docs.filter(doc => !progressData.lessons?.[doc.id]?.completed);
  if (uncompleted.length > 0) {
    throw new HttpsError('failed-precondition', `You must complete all published lessons before taking the final exam. (${uncompleted.length} remaining)`);
  }

  // 3. Check existing attempts & cooldown
  const attemptsSnap = await db.collection('examAttempts')
    .where('uid', '==', auth.uid)
    .where('courseId', '==', courseId)
    .orderBy('startedAt', 'desc')
    .get();

  const attempts = attemptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
  const passedAttempt = attempts.find(a => a.passed === true);
  if (passedAttempt) {
    throw new HttpsError('already-exists', 'You have already passed the final exam for this course!');
  }

  if (attempts.length >= examSettings.maxAttempts) {
    throw new HttpsError('resource-exhausted', `Maximum exam attempts reached (${examSettings.maxAttempts}). Contact support.`);
  }

  if (attempts.length > 0) {
    const lastAttempt = attempts[0];
    if (lastAttempt.submittedAt) {
      const cooldownMs = examSettings.cooldownHours * 60 * 60 * 1000;
      const lastTime = lastAttempt.submittedAt.toMillis ? lastAttempt.submittedAt.toMillis() : new Date(lastAttempt.submittedAt).getTime();
      const elapsed = Date.now() - lastTime;
      if (elapsed < cooldownMs) {
        const remainingHours = Math.ceil((cooldownMs - elapsed) / (1000 * 60 * 60));
        throw new HttpsError('failed-precondition', `Cooldown period active. Please wait ${remainingHours} hours before retrying.`);
      }
    }
  }

  // 4. Fetch Question Pool and randomly sample N questions
  const poolSnap = await db.collection('courses').doc(courseId).collection('examQuestions').get();
  if (poolSnap.empty) {
    throw new HttpsError('failed-precondition', 'Exam question pool is empty. Please contact an admin.');
  }

  const allQuestions = poolSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      text: data.text,
      options: data.options || [],
    };
  });

  // Shuffle array using Fisher-Yates
  for (let i = allQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
  }

  const selectedQuestions = allQuestions.slice(0, Math.min(examSettings.questionCount, allQuestions.length));
  const questionIds = selectedQuestions.map(q => q.id);

  const expiresAtMs = Date.now() + (examSettings.timeLimitMin * 60 * 1000);
  const expiresAt = admin.firestore.Timestamp.fromMillis(expiresAtMs);

  // 5. Create Exam Attempt doc
  const attemptRef = await db.collection('examAttempts').add({
    uid: auth.uid,
    courseId,
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt,
    questionIds,
    submittedAt: null,
    scorePercent: null,
    passed: null,
  });

  return {
    attemptId: attemptRef.id,
    questions: selectedQuestions,
    expiresAt: expiresAtMs,
    timeLimitMin: examSettings.timeLimitMin,
  };
});

export const submitFinalExam = onCall(async (request) => {
  const auth = assertAuth(request);
  const { attemptId, answers } = validateInput(SubmitExamSchema, request.data);

  const db = admin.firestore();

  // 1. Retrieve attempt doc
  const attemptRef = db.collection('examAttempts').doc(attemptId);
  const attemptSnap = await attemptRef.get();
  if (!attemptSnap.exists) {
    throw new HttpsError('not-found', 'Exam attempt not found.');
  }
  const attemptData = attemptSnap.data()!;

  if (attemptData.uid !== auth.uid) {
    throw new HttpsError('permission-denied', 'Unauthorized access to exam attempt.');
  }

  if (attemptData.submittedAt) {
    throw new HttpsError('already-exists', 'This exam attempt has already been submitted.');
  }

  // 2. Check expiration (allowing 60s buffer for network latency)
  const now = Date.now();
  const expiresAtMs = attemptData.expiresAt.toMillis ? attemptData.expiresAt.toMillis() : new Date(attemptData.expiresAt).getTime();
  if (now > expiresAtMs + 60000) {
    await attemptRef.update({
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      scorePercent: 0,
      passed: false,
    });
    throw new HttpsError('deadline-exceeded', 'Exam time limit exceeded. Attempt failed.');
  }

  // 3. Fetch Course for passPercentage
  const courseDoc = await db.collection('courses').doc(attemptData.courseId).get();
  const courseData = courseDoc.data()!;
  const passPercentage = courseData.passPercentage || 80;

  // 4. Grade against examKeys
  const questionIds: string[] = attemptData.questionIds || [];
  let correctCount = 0;
  const feedback: Record<string, { correct: boolean; correctOptionId: string; explanation: string }> = {};

  for (const qId of questionIds) {
    const keyDoc = await db.collection('courses').doc(attemptData.courseId).collection('examKeys').doc(qId).get();
    if (keyDoc.exists) {
      const keyData = keyDoc.data()!;
      const selectedOptionId = answers[qId];
      const isCorrect = selectedOptionId === keyData.correctOptionId;
      if (isCorrect) correctCount++;
      feedback[qId] = {
        correct: isCorrect,
        correctOptionId: keyData.correctOptionId,
        explanation: keyData.explanation || '',
      };
    }
  }

  const scorePercent = Math.round((correctCount / questionIds.length) * 100);
  const passed = scorePercent >= passPercentage;

  // 5. Update attempt doc
  await attemptRef.update({
    submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    scorePercent,
    passed,
  });

  let certificateId: string | null = null;
  if (passed) {
    const cert = await issueCertificateInternal(auth.uid, attemptData.courseId, scorePercent);
    certificateId = cert.certificateId;
  }

  return {
    scorePercent,
    passed,
    passPercentage,
    correctCount,
    totalQuestions: questionIds.length,
    certificateId,
    feedback,
  };
});
