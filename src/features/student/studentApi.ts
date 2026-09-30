import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../lib/firebase';
import { Course } from '../../types/course';
import { LessonProgress } from '../../types/lesson';

export async function getPublishedCourses(): Promise<Course[]> {
  const q = query(collection(db, 'courses'), where('status', '==', 'published'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course));
}

export async function getCourseDetail(courseId: string): Promise<Course | null> {
  const ref = doc(db, 'courses', courseId);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Course) : null;
}

export async function getCourseProgress(uid: string, courseId: string): Promise<Record<string, LessonProgress>> {
  const ref = doc(db, 'progress', `${uid}_${courseId}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return {};
  return snap.data()?.lessons || {};
}

export async function enrollInCourse(uid: string, courseId: string): Promise<void> {
  const ref = doc(db, 'enrollments', `${uid}_${courseId}`);
  await setDoc(ref, {
    uid,
    courseId,
    startedAt: serverTimestamp(),
    status: 'enrolled',
  }, { merge: true });
}

export async function submitQuizCallable(courseId: string, lessonId: string, answers: Record<string, string>) {
  const fn = httpsCallable(functions, 'submitLessonQuiz');
  const res = await fn({ courseId, lessonId, answers });
  return res.data as {
    scorePercent: number;
    passed: boolean;
    quizPassPercentage: number;
    correctCount: number;
    totalQuestions: number;
    feedback: Record<string, { correct: boolean; correctOptionId: string; explanation: string }>;
  };
}
