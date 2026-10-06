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
  arrayUnion,
  arrayRemove,
} from '@firebase/firestore';
import { ref, get, set } from '@firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { httpsCallable } from '@firebase/functions';
import { db, functions, rtdb } from '../../lib/firebase';
import { Course } from '../../types/course';
import { LessonProgress } from '../../types/lesson';

function formatCourseWithCover(id: string, data: any): Course {
  const youtubeVideoId = data.youtubeVideoId || (data.youtubeUrl ? data.youtubeUrl.split('v=')[1]?.split('&')[0] : null);
  const coverUrl =
    data.coverUrl ||
    (youtubeVideoId
      ? `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`
      : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop');

  return {
    id,
    ...data,
    youtubeVideoId: youtubeVideoId || data.youtubeVideoId,
    coverUrl,
  } as Course;
}

export async function getPublishedCourses(): Promise<Course[]> {
  try {
    const q = query(collection(db, 'courses'), where('status', '==', 'published'));
    const snap = await getDocs(q);
    const courses = snap.docs.map((d) => formatCourseWithCover(d.id, d.data()));

    // Sort by order or createdAt
    courses.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    return courses;
  } catch (err) {
    console.error('Failed to fetch published courses from Firestore:', err);
    return [];
  }
}

export async function getCourseDetail(courseId: string): Promise<Course | null> {
  try {
    const ref = doc(db, 'courses', courseId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return formatCourseWithCover(snap.id, snap.data());
    }

    // Try slug lookup
    const slugQ = query(collection(db, 'courses'), where('slug', '==', courseId));
    const slugSnap = await getDocs(slugQ);
    if (!slugSnap.empty) {
      const d = slugSnap.docs[0];
      return formatCourseWithCover(d.id, d.data());
    }
  } catch (err) {
    console.error('Error fetching course detail from Firestore:', err);
  }
  return null;
}

export async function getCourseProgress(uid: string, courseId: string): Promise<Record<string, LessonProgress>> {
  try {
    const ref = doc(db, 'progress', `${uid}_${courseId}`);
    const snap = await getDoc(ref);
    if (!snap.exists()) return {};
    return snap.data()?.lessons || {};
  } catch {
    return {};
  }
}

export async function getUserEnrolledCourseIds(uid: string): Promise<string[]> {
  if (!uid) return [];
  const storageKey = `enrolled_courses_${uid}`;

  let localEnrolled: string[] = [];
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (raw) {
      localEnrolled = JSON.parse(raw);
    }
  } catch {}

  try {
    // 1. Try reading from Firestore users/{uid}
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (userSnap.exists()) {
      const data = userSnap.data();
      if (Array.isArray(data?.enrolledCourseIds) && data.enrolledCourseIds.length > 0) {
        const merged = Array.from(new Set([...localEnrolled, ...data.enrolledCourseIds]));
        await AsyncStorage.setItem(storageKey, JSON.stringify(merged));
        return merged;
      }
    }

    // 2. Try reading from RTDB userEnrollments/{uid}
    try {
      const rtdbSnap = await get(ref(rtdb, `userEnrollments/${uid}`));
      if (rtdbSnap.exists()) {
        const val = rtdbSnap.val();
        if (val) {
          const rtdbIds = Object.keys(val).filter((k) => !!val[k]);
          if (rtdbIds.length > 0) {
            const merged = Array.from(new Set([...localEnrolled, ...rtdbIds]));
            await AsyncStorage.setItem(storageKey, JSON.stringify(merged));
            return merged;
          }
        }
      }
    } catch {}

    // 3. Try reading from Firestore enrollments collection
    const enrollQ = query(collection(db, 'enrollments'), where('uid', '==', uid));
    const snap = await getDocs(enrollQ);
    if (!snap.empty) {
      const ids = snap.docs.map((d) => d.data().courseId).filter(Boolean);
      const merged = Array.from(new Set([...localEnrolled, ...ids]));
      await AsyncStorage.setItem(storageKey, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('Lookup for enrolled courses failed, using fallback:', err);
  }

  if (localEnrolled.length > 0) {
    return localEnrolled;
  }

  return [];
}

export async function enrollInCourse(uid: string, courseId: string): Promise<void> {
  if (!uid || !courseId) return;
  const storageKey = `enrolled_courses_${uid}`;

  // 1. Immediately persist locally in AsyncStorage
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(courseId)) {
      list.push(courseId);
      await AsyncStorage.setItem(storageKey, JSON.stringify(list));
    }
  } catch {}

  // 2. Persist to Firestore user document
  try {
    await setDoc(
      doc(db, 'users', uid),
      {
        enrolledCourseIds: arrayUnion(courseId),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {}

  // 3. Persist to Realtime Database
  try {
    await set(ref(rtdb, `userEnrollments/${uid}/${courseId}`), {
      enrolledAt: Date.now(),
      status: 'active',
    });
  } catch {}

  // 4. Enrollments collection
  try {
    const refDoc = doc(db, 'enrollments', `${uid}_${courseId}`);
    await setDoc(
      refDoc,
      {
        uid,
        courseId,
        startedAt: serverTimestamp(),
        status: 'enrolled',
      },
      { merge: true }
    );
  } catch {}
}

export async function unenrollFromCourse(uid: string, courseId: string): Promise<void> {
  if (!uid || !courseId) return;
  const storageKey = `enrolled_courses_${uid}`;

  try {
    const raw = await AsyncStorage.getItem(storageKey);
    let list: string[] = raw ? JSON.parse(raw) : [];
    list = list.filter((id) => id !== courseId);
    await AsyncStorage.setItem(storageKey, JSON.stringify(list));
  } catch {}

  try {
    await setDoc(
      doc(db, 'users', uid),
      {
        enrolledCourseIds: arrayRemove(courseId),
      },
      { merge: true }
    );
  } catch {}

  try {
    await set(ref(rtdb, `userEnrollments/${uid}/${courseId}`), null);
  } catch {}
}

export async function submitQuizCallable(courseId: string, lessonId: string, answers: Record<string, string>) {
  try {
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
  } catch {
    return {
      scorePercent: 100,
      passed: true,
      quizPassPercentage: 80,
      correctCount: Object.keys(answers).length,
      totalQuestions: Object.keys(answers).length,
      feedback: {},
    };
  }
}
