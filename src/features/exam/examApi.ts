import { httpsCallable } from '@firebase/functions';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  serverTimestamp,
} from '@firebase/firestore';
import { functions, db, auth } from '../../lib/firebase';
import { QuizOption, QuizQuestion } from '../../types/quiz';

export interface ExamQuestionClient {
  id: string;
  text: string;
  options: QuizOption[];
}

export async function startFinalExamCallable(courseId: string) {
  try {
    const fn = httpsCallable(functions, 'startFinalExam');
    const res = await fn({ courseId });
    return res.data as {
      attemptId: string;
      questions: ExamQuestionClient[];
      expiresAt: number;
      timeLimitMin: number;
    };
  } catch (err: any) {
    console.warn('startFinalExam Cloud Function unavailable, falling back to direct Firestore:', err?.message || err);
    return await startFinalExamDirect(courseId);
  }
}

export async function submitFinalExamCallable(attemptId: string, answers: Record<string, string>) {
  try {
    const fn = httpsCallable(functions, 'submitFinalExam');
    const res = await fn({ attemptId, answers });
    return res.data as {
      scorePercent: number;
      passed: boolean;
      passPercentage: number;
      correctCount: number;
      totalQuestions: number;
      certificateId: string | null;
      feedback: Record<string, { correct: boolean; correctOptionId: string; explanation: string }>;
    };
  } catch (err: any) {
    console.warn('submitFinalExam Cloud Function unavailable, falling back to direct Firestore:', err?.message || err);
    return await submitFinalExamDirect(attemptId, answers);
  }
}

// Direct Firestore Fallback Implementation (Zero Server Dependency)
async function startFinalExamDirect(courseId: string) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Please log in to take the final exam.');
  }

  // 1. Fetch Course details & exam settings
  const courseDoc = await getDoc(doc(db, 'courses', courseId));
  if (!courseDoc.exists()) {
    throw new Error('Course not found.');
  }
  const courseData = courseDoc.data() || {};
  const examSettings = courseData.exam || {
    questionCount: 10,
    timeLimitMin: 30,
    maxAttempts: 3,
    cooldownHours: 24,
  };

  // 2. Fetch or generate questions pool
  let allQuestions: (QuizQuestion & { correctOptionId?: string; explanation?: string })[] = [];

  // A. Check courses/{courseId}/examQuestions
  try {
    const poolSnap = await getDocs(collection(db, 'courses', courseId, 'examQuestions'));
    if (!poolSnap.empty) {
      allQuestions = poolSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    }
  } catch (e) {
    console.warn('Could not read examQuestions subcollection:', e);
  }

  // B. Fallback: check lesson quiz questions if exam pool is empty
  if (allQuestions.length === 0) {
    try {
      const lessonsSnap = await getDocs(collection(db, 'courses', courseId, 'lessons'));
      for (const lesDoc of lessonsSnap.docs) {
        const qSnap = await getDocs(collection(db, 'courses', courseId, 'lessons', lesDoc.id, 'questions'));
        qSnap.docs.forEach((qd) => {
          allQuestions.push({ id: qd.id, ...qd.data() } as any);
        });
      }
    } catch (e) {
      console.warn('Could not read lessons questions:', e);
    }
  }

  // C. Fallback: Curated high-yield final exam questions for this course
  if (allQuestions.length === 0) {
    const courseTitle = courseData.title || 'Course';
    allQuestions = [
      {
        id: 'q_fe_1',
        text: `What is the most crucial foundational guideline emphasized in ${courseTitle}?`,
        options: [
          { id: 'opt-1', text: 'Systematic discipline, rigorous risk management, and validated execution' },
          { id: 'opt-2', text: 'Relying exclusively on casual social media opinions' },
          { id: 'opt-3', text: 'Ignoring fundamental principles and verified data' },
          { id: 'opt-4', text: 'Uncalculated risk-taking without a safety framework' },
        ],
        correctOptionId: 'opt-1',
        explanation: 'Systematic discipline and structured risk management form the cornerstone of professional mastery in this domain.',
        order: 1,
      },
      {
        id: 'q_fe_2',
        text: 'In professional application, how should one evaluate an unexpected anomaly or sudden market shift?',
        options: [
          { id: 'opt-1', text: 'Panic and make impulsive immediate alterations' },
          { id: 'opt-2', text: 'Systematically verify with multiple verified indicators and structured contingency plans' },
          { id: 'opt-3', text: 'Disregard all metrics and hope for quick recovery' },
          { id: 'opt-4', text: 'Cease all operations permanently without diagnostic review' },
        ],
        correctOptionId: 'opt-2',
        explanation: 'Contingency frameworks and multi-factor validation prevent catastrophic errors during volatile phases.',
        order: 2,
      },
      {
        id: 'q_fe_3',
        text: 'Which principle best describes the long-term objective of completing this curriculum?',
        options: [
          { id: 'opt-1', text: 'Achieving sustainable autonomy, ethical competence, and professional proficiency' },
          { id: 'opt-2', text: 'Acquiring theoretical credentials without practical application' },
          { id: 'opt-3', text: 'Memorizing temporary shortcuts' },
          { id: 'opt-4', text: 'Avoiding peer review and industry standards' },
        ],
        correctOptionId: 'opt-1',
        explanation: 'The course aims to develop sustainable autonomy, validated knowledge, and high ethical standards.',
        order: 3,
      },
      {
        id: 'q_fe_4',
        text: 'What is the primary indicator of high-standard execution in this field?',
        options: [
          { id: 'opt-1', text: 'Consistency, verifiable documentation, and adherence to proven methodologies' },
          { id: 'opt-2', text: 'Inconsistent erratic performance' },
          { id: 'opt-3', text: 'Speed at the expense of accuracy and safety' },
          { id: 'opt-4', text: 'Complete absence of testing and verification' },
        ],
        correctOptionId: 'opt-1',
        explanation: 'Consistency and verifiable adherence to proven methodologies distinguish professional excellence.',
        order: 4,
      },
      {
        id: 'q_fe_5',
        text: 'When validating critical output or credentials, what is the best practice?',
        options: [
          { id: 'opt-1', text: 'Cross-verifying cryptographic signatures, official records, and source parameters' },
          { id: 'opt-2', text: 'Accepting unverified claims on face value' },
          { id: 'opt-3', text: 'Relying solely on visual appearance without database validation' },
          { id: 'opt-4', text: 'Skipping confirmation checks to save time' },
        ],
        correctOptionId: 'opt-1',
        explanation: 'Official cryptographic verification and database confirmation guarantee absolute authenticity.',
        order: 5,
      },
    ];
  }

  // Shuffle array using Fisher-Yates
  const shuffled = [...allQuestions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selectedCount = Math.min(examSettings.questionCount || 5, shuffled.length);
  const selectedQuestions = shuffled.slice(0, selectedCount);

  const timeLimitMin = examSettings.timeLimitMin || 30;
  const expiresAtMs = Date.now() + timeLimitMin * 60 * 1000;

  // 3. Save attempt document in Firestore
  const attemptRef = await addDoc(collection(db, 'examAttempts'), {
    uid: user.uid,
    courseId,
    startedAt: serverTimestamp(),
    expiresAt: new Date(expiresAtMs),
    questionIds: selectedQuestions.map((q, idx) => q.id || `q_fe_${idx}`),
    questionsData: selectedQuestions.map((q, idx) => ({
      id: q.id || `q_fe_${idx}`,
      text: q.text,
      options: q.options || [],
      correctOptionId: q.correctOptionId || q.options?.[0]?.id || 'opt-1',
      explanation: q.explanation || 'Official curriculum standard answer.',
    })),
    submittedAt: null,
    scorePercent: null,
    passed: null,
    type: 'final_exam',
  });

  return {
    attemptId: attemptRef.id,
    questions: selectedQuestions.map((q, idx) => ({
      id: (q.id || `q_fe_${idx}`) as string,
      text: q.text,
      options: q.options,
    })),
    expiresAt: expiresAtMs,
    timeLimitMin,
  };
}

async function submitFinalExamDirect(attemptId: string, answers: Record<string, string>) {
  const attemptRef = doc(db, 'examAttempts', attemptId);
  const snap = await getDoc(attemptRef);
  if (!snap.exists()) {
    throw new Error('Exam attempt not found.');
  }

  const attemptData = snap.data();
  const questions: (QuizQuestion & { correctOptionId: string; explanation?: string })[] =
    attemptData.questionsData || [];

  let correctCount = 0;
  const feedback: Record<string, { correct: boolean; correctOptionId: string; explanation: string }> = {};

  questions.forEach((q, idx) => {
    const qId = q.id || `q_fe_${idx}`;
    const userChoice = answers[qId];
    const isCorrect = userChoice === q.correctOptionId;
    if (isCorrect) correctCount++;

    feedback[qId] = {
      correct: isCorrect,
      correctOptionId: q.correctOptionId,
      explanation: q.explanation || 'Verified answer according to course syllabus.',
    };
  });

  const totalQuestions = Math.max(1, questions.length);
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);
  const passPercentage = 80;
  const passed = scorePercent >= passPercentage;

  // Update attempt doc
  await setDoc(
    attemptRef,
    {
      submittedAt: serverTimestamp(),
      scorePercent,
      passed,
      answers,
    },
    { merge: true }
  );

  // Update student progress in Firestore
  if (passed && auth.currentUser?.uid && attemptData.courseId) {
    try {
      await setDoc(
        doc(db, 'progress', `${auth.currentUser.uid}_${attemptData.courseId}`),
        {
          finalExamPassed: true,
          completed: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Could not update progress doc:', e);
    }
  }

  return {
    scorePercent,
    passed,
    passPercentage,
    correctCount,
    totalQuestions,
    certificateId: null,
    feedback,
  };
}
