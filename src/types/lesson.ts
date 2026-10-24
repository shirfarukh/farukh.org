import { z } from 'zod';

export const LessonSchema = z.object({
  id: z.string().optional(),
  moduleId: z.string(),
  title: z.string().min(2),
  order: z.number().default(0),
  introMarkdown: z.string().min(5),
  youtubeVideoId: z.string().min(5),
  durationSec: z.number().default(300),
  quizPassPercentage: z.number().min(1).max(100).default(70),
  status: z.enum(['draft', 'published']).default('published'),
  pdfUrl: z.string().optional(),
  pdfName: z.string().optional(),
});

export type Lesson = z.infer<typeof LessonSchema>;

export const LessonProgressSchema = z.object({
  videoWatched: z.boolean().default(false),
  quizScore: z.number().default(0),
  completed: z.boolean().default(false),
  completedAt: z.any().optional(),
});

export type LessonProgress = z.infer<typeof LessonProgressSchema>;
