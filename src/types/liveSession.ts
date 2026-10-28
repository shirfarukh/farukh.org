import { z } from 'zod';

export const LiveSessionStatusSchema = z.enum(['scheduled', 'live', 'completed', 'cancelled']);
export type LiveSessionStatus = z.infer<typeof LiveSessionStatusSchema>;

export const LiveSessionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  faTitle: z.string().optional(),
  description: z.string().default(''),
  faDescription: z.string().optional(),
  courseId: z.string().optional(),
  courseTitle: z.string().optional(),
  category: z.string().optional(),
  instructorId: z.string(),
  instructorName: z.string(),
  instructorEmail: z.string().optional(),
  targetType: z.enum(['course', 'school_class', 'general']).default('course'),
  schoolGrade: z.number().min(7).max(12).optional(),
  schoolGradeLabel: z.string().optional(),
  hasCalendarEvent: z.boolean().default(true),
  scheduledStartTime: z.string(), // ISO string (e.g. 2026-10-25T14:00:00.000Z)
  scheduledEndTime: z.string(),   // ISO string (e.g. 2026-10-25T15:00:00.000Z)
  durationMin: z.number().min(15).max(300).default(60),
  meetUrl: z.string().default(''),
  status: LiveSessionStatusSchema.default('scheduled'),
  attendeeUids: z.array(z.string()).default([]),
  attendeeCount: z.number().default(0),
  recordingUrl: z.string().url().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export type LiveSession = z.infer<typeof LiveSessionSchema>;
