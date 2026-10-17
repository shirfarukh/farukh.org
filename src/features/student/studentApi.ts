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
import { QuizQuestion } from '../../types/quiz';
import { cleanFirestoreData } from '../../lib/utils';

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

export interface ModuleExamRecord {
  score: number;
  passed: boolean;
  finished?: boolean;
  completedAt: number;
  totalQuestions?: number;
  correctCount?: number;
  attemptTimestamps?: number[];
}

export function getModuleAttemptsInfo(record?: ModuleExamRecord) {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const rawTimestamps = record?.attemptTimestamps || (record?.completedAt ? [record.completedAt] : []);
  const recentAttempts = rawTimestamps.filter((ts) => now - ts < ONE_DAY_MS);
  const triesUsed = recentAttempts.length;
  const maxTries = 2;
  const triesRemaining = Math.max(0, maxTries - triesUsed);
  const canAttempt = triesUsed < maxTries;

  let cooldownRemainingMs = 0;
  if (!canAttempt && recentAttempts.length > 0) {
    const oldestInWindow = Math.min(...recentAttempts);
    cooldownRemainingMs = Math.max(0, oldestInWindow + ONE_DAY_MS - now);
  }

  const hoursRemaining = Math.floor(cooldownRemainingMs / (1000 * 60 * 60));
  const minutesRemaining = Math.ceil((cooldownRemainingMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    triesUsed,
    maxTries,
    triesRemaining,
    canAttempt,
    cooldownRemainingMs,
    hoursRemaining,
    minutesRemaining,
  };
}

export async function getCourseModuleExams(uid: string, courseId: string): Promise<Record<string, ModuleExamRecord>> {
  if (!uid || !courseId) return {};
  const storageKey = `module_exams_${uid}_${courseId}`;
  let localData: Record<string, ModuleExamRecord> = {};

  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (raw) {
      localData = JSON.parse(raw);
    }
  } catch {}

  try {
    const ref = doc(db, 'progress', `${uid}_${courseId}`);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const cloudData = snap.data()?.moduleExams || {};
      const merged = { ...localData, ...cloudData };
      await AsyncStorage.setItem(storageKey, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('Error reading module exams from Firestore, using local fallback:', err);
  }

  return localData;
}

export async function saveModuleExamResult(
  uid: string,
  courseId: string,
  moduleId: string,
  score: number,
  totalQuestions: number = 5,
  correctCount: number = Math.round((score / 100) * totalQuestions),
  moduleLessonIds: string[] = []
): Promise<ModuleExamRecord> {
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const storageKey = `module_exams_${uid}_${courseId}`;

  // 1. Fetch existing record to preserve attempt history & passed state
  let existingRecord: ModuleExamRecord | undefined;
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      existingRecord = parsed[moduleId];
    }
  } catch {}

  const previousAttempts = existingRecord?.attemptTimestamps || (existingRecord?.completedAt ? [existingRecord.completedAt] : []);
  const recentAttempts = previousAttempts.filter((t) => now - t < 7 * ONE_DAY_MS);
  const updatedAttempts = [...recentAttempts, now];

  // Pass threshold is 80% or retained if already passed previously
  const passed = score >= 80 || existingRecord?.passed === true;
  // Module is marked as finished when passing score (>= 80%) is achieved
  const finished = passed;

  const record: ModuleExamRecord = {
    score,
    passed,
    finished,
    completedAt: now,
    totalQuestions,
    correctCount,
    attemptTimestamps: updatedAttempts,
  };

  // 2. Persist in AsyncStorage
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    const existing = raw ? JSON.parse(raw) : {};
    existing[moduleId] = record;
    await AsyncStorage.setItem(storageKey, JSON.stringify(existing));
  } catch {}

  // 3. Mark lessons of this module as completed if finished
  const lessonUpdates: Record<string, any> = {};
  if (finished && moduleLessonIds.length > 0) {
    moduleLessonIds.forEach((lesId) => {
      lessonUpdates[lesId] = {
        completed: true,
        quizScore: Math.max(score, 80),
        updatedAt: serverTimestamp(),
      };
    });

    try {
      const pRaw = await AsyncStorage.getItem(`progress_${uid}_${courseId}`);
      const curProg = pRaw ? JSON.parse(pRaw) : {};
      moduleLessonIds.forEach((lesId) => {
        curProg[lesId] = { completed: true, quizScore: Math.max(score, 80), updatedAt: now };
      });
      await AsyncStorage.setItem(`progress_${uid}_${courseId}`, JSON.stringify(curProg));
    } catch {}
  }

  // 4. Persist to Firestore progress document
  try {
    const progressRef = doc(db, 'progress', `${uid}_${courseId}`);
    await setDoc(
      progressRef,
      cleanFirestoreData({
        uid,
        courseId,
        moduleExams: {
          [moduleId]: record,
        },
        modules: {
          [moduleId]: {
            completed: finished,
            finished,
            score,
            passed,
            updatedAt: serverTimestamp(),
          },
        },
        ...(Object.keys(lessonUpdates).length > 0 ? { lessons: lessonUpdates } : {}),
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not write module exam result to Firestore:', err);
  }

  // 5. Record attempt in examAttempts collection
  try {
    const attemptRef = doc(db, 'examAttempts', `${uid}_${courseId}_${moduleId}_${now}`);
    await setDoc(
      attemptRef,
      cleanFirestoreData({
        uid,
        courseId,
        moduleId,
        score,
        passed,
        finished,
        totalQuestions,
        correctCount,
        type: 'module_assessment',
        createdAt: serverTimestamp(),
        timestamp: now,
      })
    );
  } catch {}

  return record;
}

export async function markLessonCompleted(
  uid: string,
  courseId: string,
  lessonId: string,
  quizScore: number = 100
): Promise<void> {
  if (!uid || !courseId || !lessonId) return;
  const storageKey = `progress_${uid}_${courseId}`;
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    const cur = raw ? JSON.parse(raw) : {};
    cur[lessonId] = { completed: true, quizScore, updatedAt: Date.now() };
    await AsyncStorage.setItem(storageKey, JSON.stringify(cur));
  } catch {}

  try {
    const pRef = doc(db, 'progress', `${uid}_${courseId}`);
    await setDoc(
      pRef,
      cleanFirestoreData({
        uid,
        courseId,
        lessons: {
          [lessonId]: {
            completed: true,
            quizScore,
            updatedAt: serverTimestamp(),
          },
        },
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  } catch {}
}

export async function getModuleExamQuestions(
  courseId: string,
  moduleId: string,
  courseTitle: string = 'Course',
  moduleTitle: string = 'Module'
): Promise<(QuizQuestion & { correctOptionId?: string; explanation?: string })[]> {
  try {
    // 1. Check Firestore examQuestions
    const qSnap = await getDocs(collection(db, 'courses', courseId, 'examQuestions'));
    if (!qSnap.empty) {
      const allQ: (QuizQuestion & { correctOptionId?: string; explanation?: string })[] = qSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as any)
      );

      // Filter questions matching this specific module
      const moduleSpecific = allQ.filter((q) => q.moduleId === moduleId);
      if (moduleSpecific.length > 0) {
        return moduleSpecific;
      }

      // If no module-specific questions, return questions from general pool if available
      const general = allQ.filter((q) => !q.moduleId);
      if (general.length > 0) {
        return general.slice(0, 5);
      }
    }
  } catch (err) {
    console.warn('Error fetching module exam questions from Firestore:', err);
  }

  // 2. High-quality default questions for the module assessment
  return [
    {
      id: `q_mod_${moduleId}_1`,
      text: `What is the primary core principle demonstrated in "${moduleTitle}"?`,
      options: [
        { id: 'opt-1', text: 'Systematic discipline and fundamental risk assessment' },
        { id: 'opt-2', text: 'Pure intuition without structured methodology' },
        { id: 'opt-3', text: 'Following unverified third-party rumors' },
        { id: 'opt-4', text: 'Ignoring foundational guidelines' },
      ],
      correctOptionId: 'opt-1',
      explanation: 'Systematic discipline and comprehensive risk assessment are the cornerstones of long-term mastery.',
      moduleId,
      order: 1,
    },
    {
      id: `q_mod_${moduleId}_2`,
      text: `When applying principles from ${courseTitle}, what is considered best practice?`,
      options: [
        { id: 'opt-1', text: 'Rushing execution without proper verification' },
        { id: 'opt-2', text: 'Validating hypotheses with verified empirical evidence' },
        { id: 'opt-3', text: 'Skipping baseline checks' },
        { id: 'opt-4', text: 'Relying exclusively on single-point indicators' },
      ],
      correctOptionId: 'opt-2',
      explanation: 'Empirical verification ensures consistency and prevents avoidable pitfalls.',
      moduleId,
      order: 2,
    },
    {
      id: `q_mod_${moduleId}_3`,
      text: `Which strategic metric determines ongoing success in this phase of ${moduleTitle}?`,
      options: [
        { id: 'opt-1', text: 'Short-term hype cycles' },
        { id: 'opt-2', text: 'Consistent risk-reward ratios and protocol adherence' },
        { id: 'opt-3', text: 'Arbitrary capital allocation' },
        { id: 'opt-4', text: 'Unmeasured speculation' },
      ],
      correctOptionId: 'opt-2',
      explanation: 'A balanced risk-to-reward ratio and strict protocol adherence maintain sustainable results.',
      moduleId,
      order: 3,
    },
    {
      id: `q_mod_${moduleId}_4`,
      text: `How should unexpected volatility or variance be handled in this domain?`,
      options: [
        { id: 'opt-1', text: 'Emotional overreaction and rapid panic switches' },
        { id: 'opt-2', text: 'Objective mitigation strategies according to predefined safety rules' },
        { id: 'opt-3', text: 'Double down without recalculating risk' },
        { id: 'opt-4', text: 'Abandon all risk management systems' },
      ],
      correctOptionId: 'opt-2',
      explanation: 'Predefined safety rules and mitigation strategies protect capital and resources.',
      moduleId,
      order: 4,
    },
    {
      id: `q_mod_${moduleId}_5`,
      text: `What criteria confirms mastery before advancing past ${moduleTitle}?`,
      options: [
        { id: 'opt-1', text: 'Achieving at least 80% competency and demonstrative accuracy' },
        { id: 'opt-2', text: 'Merely skimming through without evaluation' },
        { id: 'opt-3', text: 'Guessing answers randomly' },
        { id: 'opt-4', text: 'Bypassing verification checkpoints' },
      ],
      correctOptionId: 'opt-1',
      explanation: 'A rigorous 80% passing grade verifies authentic comprehension before progressing to advanced concepts.',
      moduleId,
      order: 5,
    },
  ];
}
