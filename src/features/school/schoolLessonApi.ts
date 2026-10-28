import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from '@firebase/firestore';
import { db } from '../../lib/firebase';
import { SchoolLesson } from '../../types/schoolLesson';
import { cleanFirestoreData, extractYouTubeId } from '../../lib/utils';

export async function getSchoolLessonsByGrade(grade: number): Promise<SchoolLesson[]> {
  try {
    const q = query(
      collection(db, 'schoolLessons'),
      where('grade', '==', grade),
      where('status', '==', 'published')
    );
    const snap = await getDocs(q);
    const lessons = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SchoolLesson[];
    return lessons.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
  } catch (err) {
    console.warn(`Error getting lessons for grade ${grade}:`, err);
    return [];
  }
}

export async function getTeacherSchoolLessons(teacherId: string): Promise<SchoolLesson[]> {
  try {
    const q = query(
      collection(db, 'schoolLessons'),
      where('teacherId', '==', teacherId)
    );
    const snap = await getDocs(q);
    const lessons = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SchoolLesson[];
    return lessons.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
  } catch (err) {
    console.warn(`Error getting teacher lessons:`, err);
    return [];
  }
}

export async function getPendingSchoolLessons(): Promise<SchoolLesson[]> {
  try {
    const q = query(
      collection(db, 'schoolLessons'),
      where('status', '==', 'in_review')
    );
    const snap = await getDocs(q);
    const lessons = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SchoolLesson[];
    return lessons.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
  } catch (err) {
    console.warn(`Error getting pending review lessons:`, err);
    return [];
  }
}

export async function createSchoolLesson(
  lesson: Omit<SchoolLesson, 'id' | 'createdAt' | 'status' | 'publishedAt'> & { status?: SchoolLesson['status'] },
  teacherApprovedGrades: number[],
  isAdmin: boolean = false
): Promise<string> {
  // Validate teacher grade authority
  if (!isAdmin && !teacherApprovedGrades.includes(lesson.grade)) {
    throw new Error(
      `Access denied: You are only permitted to create lessons for your approved grades (${teacherApprovedGrades.join(', ')}). Grade ${lesson.grade} is not authorized.`
    );
  }

  const payload = cleanFirestoreData({
    ...lesson,
    status: lesson.status || 'draft',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const docRef = await addDoc(collection(db, 'schoolLessons'), payload);
  return docRef.id;
}

export async function updateSchoolLesson(
  id: string,
  lesson: Partial<SchoolLesson>,
  teacherApprovedGrades?: number[],
  isAdmin: boolean = false
): Promise<void> {
  if (!isAdmin && lesson.grade !== undefined && teacherApprovedGrades) {
    if (!teacherApprovedGrades.includes(lesson.grade)) {
      throw new Error(
        `Unauthorized grade modification: You can only publish lessons in your approved grades (${teacherApprovedGrades.join(', ')}).`
      );
    }
  }

  const docRef = doc(db, 'schoolLessons', id);
  const payload = cleanFirestoreData({
    ...lesson,
    updatedAt: serverTimestamp(),
  });

  await updateDoc(docRef, payload);
}

export async function reviewSchoolLesson(
  id: string,
  status: 'published' | 'changes_requested' | 'draft',
  rejectionReason?: string
): Promise<void> {
  const docRef = doc(db, 'schoolLessons', id);
  const payload: any = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (status === 'published') {
    payload.publishedAt = serverTimestamp();
    payload.rejectionReason = null;
  } else if (rejectionReason !== undefined) {
    payload.rejectionReason = rejectionReason;
  }

  await updateDoc(docRef, payload);
}

export async function deleteSchoolLesson(id: string): Promise<void> {
  await deleteDoc(doc(db, 'schoolLessons', id));
}
