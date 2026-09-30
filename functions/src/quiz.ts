import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { assertAuth, validateInput } from './middleware';

const SubmitQuizSchema = z.object({
  courseId: z.string(),
  lessonId: z.string(),
  answers: z.record(z.string(), z.string()), // qId -> selectedOptionId
});

export const submitLessonQuiz = onCall(async (request) => {
  const auth = assertAuth(request);
  const { courseId, lessonId, answers } = validateInput(SubmitQuizSchema, request.data);

  const db = admin.firestore();
  
  // 1. Fetch lesson details for pass percentage
  const lessonDoc = await db.collection('courses').doc(courseId).collection('lessons').doc(lessonId).get();
  if (!lessonDoc.exists) {
    throw new HttpsError('not-found', 'Lesson not found.');
  }
  const lessonData = lessonDoc.data()!;
  const quizPassPercentage = lessonData.quizPassPercentage || 70;

  // 2. Fetch answer keys
  const keysSnap = await db.collection('courses').doc(courseId).collection('lessons').doc(lessonId).collection('answerKeys').get();
  if (keysSnap.empty) {
    throw new HttpsError('failed-precondition', 'No answer keys configured for this lesson quiz.');
  }

  let correctCount = 0;
  const totalQuestions = keysSnap.docs.length;
  const feedback: Record<string, { correct: boolean; correctOptionId: string; explanation: string }> = {};

  keysSnap.docs.forEach((doc) => {
    const qId = doc.id;
    const keyData = doc.data();
    const selectedOptionId = answers[qId];
    const isCorrect = selectedOptionId === keyData.correctOptionId;

    if (isCorrect) {
      correctCount++;
    }

    feedback[qId] = {
      correct: isCorrect,
      correctOptionId: keyData.correctOptionId,
      explanation: keyData.explanation || '',
    };
  });

  const scorePercent = Math.round((correctCount / totalQuestions) * 100);
  const passed = scorePercent >= quizPassPercentage;

  // 3. Update Progress Document if passed or update highest score
  const progressRef = db.collection('progress').doc(`${auth.uid}_${courseId}`);
  const progressSnap = await progressRef.get();
  const currentProgress = progressSnap.exists ? progressSnap.data() : { uid: auth.uid, courseId, lessons: {} };

  const existingLessonProgress = currentProgress?.lessons?.[lessonId] || {};
  const isPreviouslyCompleted = existingLessonProgress.completed || false;
  const newCompletedState = isPreviouslyCompleted || passed;

  await progressRef.set({
    uid: auth.uid,
    courseId,
    lessons: {
      ...currentProgress?.lessons,
      [lessonId]: {
        videoWatched: true,
        quizScore: Math.max(existingLessonProgress.quizScore || 0, scorePercent),
        completed: newCompletedState,
        completedAt: newCompletedState ? (existingLessonProgress.completedAt || admin.firestore.FieldValue.serverTimestamp()) : null,
      },
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return {
    scorePercent,
    passed,
    quizPassPercentage,
    correctCount,
    totalQuestions,
    feedback,
  };
});
