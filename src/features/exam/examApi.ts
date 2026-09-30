import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';
import { QuizOption } from '../../types/quiz';

export interface ExamQuestionClient {
  id: string;
  text: string;
  options: QuizOption[];
}

export async function startFinalExamCallable(courseId: string) {
  const fn = httpsCallable(functions, 'startFinalExam');
  const res = await fn({ courseId });
  return res.data as {
    attemptId: string;
    questions: ExamQuestionClient[];
    expiresAt: number;
    timeLimitMin: number;
  };
}

export async function submitFinalExamCallable(attemptId: string, answers: Record<string, string>) {
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
}
