import { z } from 'zod';
import { COURSE_CATEGORIES } from './course';

export const TEACHING_LANGUAGES = [
  { code: 'fa', labelEn: 'Persian / Dari (فارسی / دری)' },
  { code: 'en', labelEn: 'English' },
  { code: 'ps', labelEn: 'Pashto (پښتو)' },
  { code: 'ar', labelEn: 'Arabic (العربية)' },
] as const;

export const InstructorApplicationSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  nameEn: z.string().min(2, 'English name must be at least 2 characters').max(60),
  nameFa: z.string().min(2, 'Persian name must be at least 2 characters').max(60),
  bio: z.string().min(30, 'Professional bio must be at least 30 characters').max(1000),
  shortBio: z.string().max(250).optional(),
  expertise: z.array(z.string()).min(1, 'Please select at least one area of expertise'),
  teachingLanguages: z.array(z.string()).min(1, 'Please select at least one teaching language'),
  portfolioLinks: z.array(z.string()).default([]),
  youtubeChannel: z.string().optional(),
  sampleCourseIdea: z.string().min(20, 'Please describe a sample course idea (min 20 characters)').max(1000),
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept instructor terms and copyright policy',
  }),
  status: z.enum(['pending', 'approved', 'rejected', 'changes_requested']).default('pending'),
  rejectionReason: z.string().optional(),
  submittedAt: z.any().optional(),
  reviewedAt: z.any().optional(),
  reviewedBy: z.string().optional(),
});

export type InstructorApplication = z.infer<typeof InstructorApplicationSchema>;

export const InstructorApplicationInputSchema = InstructorApplicationSchema.omit({
  uid: true,
  email: true,
  status: true,
  rejectionReason: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedBy: true,
});

export type InstructorApplicationInput = z.infer<typeof InstructorApplicationInputSchema>;
