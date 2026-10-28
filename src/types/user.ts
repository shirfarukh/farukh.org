import { z } from 'zod';

export const UserProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().min(1),
  photoURL: z.string().optional(),
  createdAt: z.any().optional(),
  disabled: z.boolean().default(false),
  approvedSchoolGrades: z.array(z.number()).default([]),
  isSchoolTeacher: z.boolean().default(false),
  schoolTeacherApprovedGrades: z.array(z.number()).default([]),
  schoolTeacherStatus: z.string().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export type UserRole = 'student' | 'admin';
