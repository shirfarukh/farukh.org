import { z } from 'zod';

export const CertificateSchema = z.object({
  id: z.string().optional(),
  uid: z.string(),
  courseId: z.string(),
  studentName: z.string(),
  courseTitle: z.string(),
  scorePercent: z.number(),
  issuedAt: z.any(),
  pdfPath: z.string(),
  revoked: z.boolean().default(false),
});

export type Certificate = z.infer<typeof CertificateSchema>;
