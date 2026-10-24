import { z } from 'zod';

export const AuditLogActionEnum = z.enum([
  'instructor_approved',
  'instructor_rejected',
  'instructor_suspended',
  'course_publish_approved',
  'course_changes_requested',
  'course_rejected',
  'course_archived',
  'course_deleted',
  'course_ownership_transferred',
  'course_unpublished',
]);

export type AuditLogAction = z.infer<typeof AuditLogActionEnum>;

export const AuditLogSchema = z.object({
  id: z.string().optional(),
  action: AuditLogActionEnum,
  actorId: z.string(),
  actorEmail: z.string().optional(),
  actorRole: z.enum(['admin', 'system']).default('admin'),
  targetId: z.string(),
  targetType: z.enum(['user', 'course', 'reviewRequest', 'instructorApplication']),
  details: z.record(z.any()).default({}),
  timestamp: z.any().optional(),
});

export type AuditLogEntry = z.infer<typeof AuditLogSchema>;
