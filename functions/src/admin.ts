import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { assertAdmin, validateInput } from './middleware';

const ImportQuestionsSchema = z.object({
  courseId: z.string(),
  type: z.enum(['lessonQuiz', 'finalExam']),
  lessonId: z.string().optional(),
  questions: z.array(z.object({
    text: z.string(),
    options: z.array(z.object({ id: z.string(), text: z.string() })),
    correctOptionId: z.string(),
    explanation: z.string().default(''),
  })),
});

export const importQuestions = onCall(async (request) => {
  assertAdmin(request);
  const data = validateInput(ImportQuestionsSchema, request.data);
  const db = admin.firestore();

  const batch = db.batch();

  if (data.type === 'lessonQuiz') {
    if (!data.lessonId) {
      throw new HttpsError('invalid-argument', 'lessonId is required for lessonQuiz type.');
    }
    const lessonRef = db.collection('courses').doc(data.courseId).collection('lessons').doc(data.lessonId);
    
    data.questions.forEach((q, idx) => {
      const qRef = lessonRef.collection('questions').doc();
      batch.set(qRef, {
        text: q.text,
        options: q.options,
        order: idx + 1,
      });

      const keyRef = lessonRef.collection('answerKeys').doc(qRef.id);
      batch.set(keyRef, {
        correctOptionId: q.correctOptionId,
        explanation: q.explanation,
      });
    });
  } else {
    const examRef = db.collection('courses').doc(data.courseId);
    data.questions.forEach((q) => {
      const qRef = examRef.collection('examQuestions').doc();
      batch.set(qRef, {
        text: q.text,
        options: q.options,
      });

      const keyRef = examRef.collection('examKeys').doc(qRef.id);
      batch.set(keyRef, {
        correctOptionId: q.correctOptionId,
        explanation: q.explanation,
      });
    });
  }

  await batch.commit();
  return { success: true, count: data.questions.length };
});

const ResetProgressSchema = z.object({
  uid: z.string(),
  courseId: z.string(),
});

export const resetStudentProgress = onCall(async (request) => {
  assertAdmin(request);
  const { uid, courseId } = validateInput(ResetProgressSchema, request.data);
  const db = admin.firestore();

  await db.collection('progress').doc(`${uid}_${courseId}`).delete();
  await db.collection('enrollments').doc(`${uid}_${courseId}`).delete();

  return { success: true };
});

const DisableUserSchema = z.object({
  uid: z.string(),
  disabled: z.boolean(),
});

export const disableUser = onCall(async (request) => {
  assertAdmin(request);
  const { uid, disabled } = validateInput(DisableUserSchema, request.data);

  await admin.auth().updateUser(uid, { disabled });
  await admin.firestore().collection('users').doc(uid).update({ disabled });

  return { success: true, uid, disabled };
});
