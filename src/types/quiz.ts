import { z } from 'zod';

export const QuizOptionSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
});

export const QuizQuestionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(5),
  options: z.array(QuizOptionSchema).min(2).max(6),
  order: z.number().default(0),
});

export const AnswerKeySchema = z.object({
  qId: z.string(),
  correctOptionId: z.string(),
  explanation: z.string(),
});

export type QuizOption = z.infer<typeof QuizOptionSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type AnswerKey = z.infer<typeof AnswerKeySchema>;
