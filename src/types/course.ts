import { z } from 'zod';

export const ExamSettingsSchema = z.object({
  questionCount: z.number().min(1).default(10),
  timeLimitMin: z.number().min(1).default(30),
  maxAttempts: z.number().min(1).default(3),
  cooldownHours: z.number().min(0).default(24),
});

export const CourseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().min(10),
  coverUrl: z.string().default('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  order: z.number().default(0),
  passPercentage: z.number().min(1).max(100).default(80),
  exam: ExamSettingsSchema,
  lessonCount: z.number().default(0),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export type ExamSettings = z.infer<typeof ExamSettingsSchema>;
export type Course = z.infer<typeof CourseSchema>;

export const ModuleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  order: z.number().default(0),
});

export type Module = z.infer<typeof ModuleSchema>;
