import { z } from 'zod';

export interface CertificateFieldConfig {
  id: 'nameEn' | 'nameFa' | 'courseEn' | 'courseFa' | 'date' | 'qr' | 'certificateId';
  label: string;
  top: number; // percentage from top (e.g. 26.8)
  left: number; // percentage from left (e.g. 42.0)
  width: number; // percentage width (e.g. 25.5)
  height: number; // percentage height (e.g. 4.0)
  fontSize: number; // in px at 1920x1434 reference
  fontFamily: string;
  fontWeight: string;
  fontStyle?: 'normal' | 'italic';
  color: string;
  textAlign: 'center' | 'left' | 'right';
  direction: 'ltr' | 'rtl';
}

export interface CertificateTemplate {
  id: string;
  courseId?: string;
  backgroundUrl: string; // URL or storage path or base64
  aspectRatio: number; // default 1.3389
  width: number; // reference 1920
  height: number; // reference 1434
  fields: CertificateFieldConfig[];
  updatedAt?: any;
}

export const DEFAULT_CERTIFICATE_FIELDS: CertificateFieldConfig[] = [
  {
    id: 'nameFa',
    label: 'Full Name (Persian)',
    top: 26.8,
    left: 42.0,
    width: 25.5,
    height: 4.0,
    fontSize: 32,
    fontFamily: 'Vazirmatn, sans-serif',
    fontWeight: '800',
    color: '#0b1a30',
    textAlign: 'center',
    direction: 'rtl',
  },
  {
    id: 'courseFa',
    label: 'Course Title (Persian)',
    top: 32.5,
    left: 10.5,
    width: 58.0,
    height: 3.8,
    fontSize: 26,
    fontFamily: 'Vazirmatn, sans-serif',
    fontWeight: '700',
    color: '#0b1a30',
    textAlign: 'center',
    direction: 'rtl',
  },
  {
    id: 'nameEn',
    label: 'Full Name (English)',
    top: 54.8,
    left: 28.0,
    width: 50.0,
    height: 4.0,
    fontSize: 34,
    fontFamily: "'Playfair Display', serif",
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#0b1a30',
    textAlign: 'center',
    direction: 'ltr',
  },
  {
    id: 'courseEn',
    label: 'Course Title (English)',
    top: 60.8,
    left: 48.5,
    width: 41.0,
    height: 4.0,
    fontSize: 25,
    fontFamily: "'Inter', sans-serif",
    fontWeight: '700',
    color: '#0b1a30',
    textAlign: 'center',
    direction: 'ltr',
  },
  {
    id: 'date',
    label: 'Completion Date',
    top: 81.8,
    left: 31.0,
    width: 14.0,
    height: 3.0,
    fontSize: 14,
    fontFamily: "'Inter', 'Vazirmatn', sans-serif",
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    direction: 'ltr',
  },
  {
    id: 'qr',
    label: 'Verification QR Code',
    top: 73.1,
    left: 15.6,
    width: 7.2,
    height: 9.7,
    fontSize: 0,
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    color: '#000000',
    textAlign: 'center',
    direction: 'ltr',
  },
  {
    id: 'certificateId',
    label: 'Certificate ID',
    top: 89.2,
    left: 11.0,
    width: 16.5,
    height: 2.5,
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    direction: 'ltr',
  },
];

export const CertificateSchema = z.object({
  id: z.string().optional(),
  certificateId: z.string().optional(),
  uid: z.string(),
  courseId: z.string(),
  attemptId: z.string().optional(),
  nameEn: z.string(),
  nameFa: z.string(),
  studentName: z.string().optional(),
  courseTitle: z.string().optional(),
  courseTitleEn: z.string().optional(),
  courseTitleFa: z.string().optional(),
  scorePercent: z.number(),
  issuedAt: z.any(),
  dateGregorian: z.string().optional(),
  dateJalali: z.string().optional(),
  templateId: z.string().default('default'),
  status: z.enum(['generating', 'ready', 'failed']).default('generating'),
  pdfPath: z.string().optional(),
  jpgPath: z.string().optional(),
  qrCodeUrl: z.string().optional(),
  revoked: z.boolean().default(false),
  revokedAt: z.any().optional(),
  revokedReason: z.string().optional(),
});

export type Certificate = z.infer<typeof CertificateSchema>;
