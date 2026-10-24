import { z } from 'zod';

export const ReviewCommentSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  authorRole: z.enum(['admin', 'instructor']),
  text: z.string().min(1).max(2000),
  createdAt: z.any().optional(),
});

export type ReviewComment = z.infer<typeof ReviewCommentSchema>;

export const ReviewChecklistSchema = z.object({
  enFaComplete: z.boolean().default(false),
  validYouTube: z.boolean().default(false),
  allLessonsHaveQuiz: z.boolean().default(false),
  finalExamPoolValid: z.boolean().default(false),
});

export type ReviewChecklist = z.infer<typeof ReviewChecklistSchema>;

export const ReviewRequestSchema = z.object({
  id: z.string().optional(),
  courseId: z.string(),
  courseTitle: z.string(),
  instructorId: z.string(),
  instructorName: z.string(),
  instructorEmail: z.string().optional(),
  type: z.enum(['publish', 'revision', 'archive', 'delete']).default('publish'),
  status: z.enum(['pending', 'in_review', 'approved', 'changes_requested', 'rejected']).default('pending'),
  checklist: ReviewChecklistSchema,
  comments: z.array(ReviewCommentSchema).default([]),
  diffSummary: z.record(z.any()).optional(),
  submittedAt: z.any().optional(),
  reviewedAt: z.any().optional(),
  reviewedBy: z.string().optional(),
});

export type ReviewRequest = z.infer<typeof ReviewRequestSchema>;
