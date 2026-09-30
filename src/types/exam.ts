import { z } from 'zod';
import { QuizOptionSchema } from './quiz';

export const ExamQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  options: z.array(QuizOptionSchema),
});

export const ExamAttemptSchema = z.object({
  id: z.string().optional(),
  uid: z.string(),
  courseId: z.string(),
  startedAt: z.any(),
  submittedAt: z.any().optional(),
  scorePercent: z.number().optional(),
  passed: z.boolean().optional(),
  questionIds: z.array(z.string()),
  expiresAt: z.any(),
});

export type ExamQuestion = z.infer<typeof ExamQuestionSchema>;
export type ExamAttempt = z.infer<typeof ExamAttemptSchema>;
