import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Course, Module } from '../../types/course';
import { Lesson } from '../../types/lesson';
import { QuizQuestion } from '../../types/quiz';

// Courses CRUD
export async function getAdminCourses(): Promise<Course[]> {
  const q = query(collection(db, 'courses'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course));
}

export async function createOrUpdateCourse(courseData: Partial<Course>, courseId?: string): Promise<string> {
  const ref = courseId ? doc(db, 'courses', courseId) : doc(collection(db, 'courses'));
  const payload = {
    ...courseData,
    updatedAt: serverTimestamp(),
    ...(courseId ? {} : { createdAt: serverTimestamp() }),
  };
  await setDoc(ref, payload, { merge: true });
  return ref.id;
}

// Modules & Lessons
export async function getCourseModules(courseId: string): Promise<Module[]> {
  const q = query(collection(db, 'courses', courseId, 'modules'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Module));
}

export async function createModule(courseId: string, title: string, order: number): Promise<string> {
  const ref = doc(collection(db, 'courses', courseId, 'modules'));
  await setDoc(ref, { title, order });
  return ref.id;
}

export async function getCourseLessons(courseId: string): Promise<Lesson[]> {
  const q = query(collection(db, 'courses', courseId, 'lessons'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Lesson));
}

export async function createOrUpdateLesson(
  courseId: string,
  lessonData: Partial<Lesson>,
  lessonId?: string
): Promise<string> {
  const ref = lessonId
    ? doc(db, 'courses', courseId, 'lessons', lessonId)
    : doc(collection(db, 'courses', courseId, 'lessons'));
  await setDoc(ref, lessonData, { merge: true });
  return ref.id;
}

// Lesson Quiz Questions & Answer Keys
export async function getLessonQuestions(courseId: string, lessonId: string): Promise<QuizQuestion[]> {
  const q = query(collection(db, 'courses', courseId, 'lessons', lessonId, 'questions'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuizQuestion));
}

export async function saveLessonQuestion(
  courseId: string,
  lessonId: string,
  question: { text: string; options: { id: string; text: string }[]; correctOptionId: string; explanation: string },
  questionId?: string
): Promise<string> {
  const qRef = questionId
    ? doc(db, 'courses', courseId, 'lessons', lessonId, 'questions', questionId)
    : doc(collection(db, 'courses', courseId, 'lessons', lessonId, 'questions'));

  const keyRef = doc(db, 'courses', courseId, 'lessons', lessonId, 'answerKeys', qRef.id);

  await setDoc(qRef, {
    text: question.text,
    options: question.options,
    order: Date.now(),
  });

  await setDoc(keyRef, {
    correctOptionId: question.correctOptionId,
    explanation: question.explanation,
  });

  return qRef.id;
}

export async function deleteLessonQuestion(courseId: string, lessonId: string, questionId: string): Promise<void> {
  await deleteDoc(doc(db, 'courses', courseId, 'lessons', lessonId, 'questions', questionId));
  await deleteDoc(doc(db, 'courses', courseId, 'lessons', lessonId, 'answerKeys', questionId));
}

// Exam Question Pool
export async function getExamQuestions(courseId: string): Promise<QuizQuestion[]> {
  const snap = await getDocs(collection(db, 'courses', courseId, 'examQuestions'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuizQuestion));
}

export async function saveExamQuestion(
  courseId: string,
  question: { text: string; options: { id: string; text: string }[]; correctOptionId: string; explanation: string },
  questionId?: string
): Promise<string> {
  const qRef = questionId
    ? doc(db, 'courses', courseId, 'examQuestions', questionId)
    : doc(collection(db, 'courses', courseId, 'examQuestions'));

  const keyRef = doc(db, 'courses', courseId, 'examKeys', qRef.id);

  await setDoc(qRef, {
    text: question.text,
    options: question.options,
  });

  await setDoc(keyRef, {
    correctOptionId: question.correctOptionId,
    explanation: question.explanation,
  });

  return qRef.id;
}
