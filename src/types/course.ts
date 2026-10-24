import { z } from 'zod';

export const ExamSettingsSchema = z.object({
  questionCount: z.number().min(1).default(10),
  timeLimitMin: z.number().min(1).default(30),
  maxAttempts: z.number().min(1).default(3),
  cooldownHours: z.number().min(0).default(24),
});

export const COURSE_CATEGORIES = [
  'AI & Tech',
  'Stocks & Crypto',
  'Ecommerce',
  'Languages',
  'Morals',
  'School Grades',
] as const;

export type CourseCategory = typeof COURSE_CATEGORIES[number];

export const CourseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  slug: z.string().min(2),
  category: z.string().optional(),
  description: z.string().default(''),
  body: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  youtubeUrl: z.string().optional(),
  youtubeVideoId: z.string().optional(),
  coverUrl: z.string().default('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop'),
  status: z.enum(['draft', 'in_review', 'published', 'changes_requested', 'rejected', 'archived']).default('published'),
  isUnfinished: z.boolean().default(false),
  ownerId: z.string().optional(),
  ownerName: z.string().optional(),
  instructorBio: z.string().optional(),
  ownerBio: z.string().optional(),
  isArchived: z.boolean().default(false),
  hasDraftRevision: z.boolean().default(false),
  publishedAt: z.any().optional(),
  order: z.number().default(0),
  passPercentage: z.number().min(1).max(100).default(80),
  exam: ExamSettingsSchema,
  lessonCount: z.number().default(0),
  faTitle: z.string().optional(),
  faDescription: z.string().optional(),
  grade: z.number().optional(),
  subjects: z.array(z.string()).optional(),
  sampleLessons: z.array(z.object({
    title: z.string(),
    duration: z.string(),
    description: z.string(),
  })).optional(),
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
