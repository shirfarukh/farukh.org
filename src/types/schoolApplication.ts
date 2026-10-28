import { z } from 'zod';

export const AFGHAN_PROVINCES = [
  'کابل (Kabul)',
  'هرات (Herat)',
  'بلخ (Balkh - مزار شریف)',
  'قندهار (Kandahar)',
  'ننگرهار (Nangarhar - جلال‌آباد)',
  'بدخشان (Badakhshan)',
  'بامیان (Bamyan)',
  'دایکندی (Daykundi)',
  'غزنی (Ghazni)',
  'تخار (Takhar)',
  'بغلان (Baghlan)',
  'پروان (Parwan)',
  'کندز (Kunduz)',
  'فراه (Farah)',
  'هلمند (Helmand)',
  'بادغیس (Badghis)',
  'فاریاب (Faryab)',
  'جوزجان (Jawzjan)',
  'سرپل (Sar-e Pol)',
  'سمنگان (Samangan)',
  'غور (Ghor)',
  'پکتیا (Paktia)',
  'پکتیکا (Paktika)',
  'خوست (Khost)',
  'لغمان (Laghman)',
  'کنر (Kunar)',
  'نورستان (Nuristan)',
  'پنجشیر (Panjshir)',
  'کاپیسا (Kapisa)',
  'لوگر (Logar)',
  'میدان وردک (Maidan Wardak)',
  'زابل (Zabul)',
  'ارزگان (Uruzgan)',
  'نیمروز (Nimruz)',
  'خارج از کشور / مهاجر در ایران (Refugee in Iran)',
  'خارج از کشور / مهاجر در پاکستان (Refugee in Pakistan)',
  'سایر کشورهای مهاجرت (Other International)',
] as const;

export const GUARDIAN_RELATIONS = [
  { id: 'father', fa: 'پدر', en: 'Father' },
  { id: 'mother', fa: 'مادر', en: 'Mother' },
  { id: 'brother', fa: 'برادر', en: 'Brother' },
  { id: 'sister', fa: 'خواهر', en: 'Sister' },
  { id: 'uncle', fa: 'کاکا / ماما', en: 'Uncle' },
  { id: 'legal_guardian', fa: 'سرپرست قانونی / سایر', en: 'Legal Guardian / Other' },
] as const;

export interface SchoolApplication {
  id?: string;
  referenceNumber: string;
  userId?: string;

  // Student Info
  studentFullName: string;
  dateOfBirth: string; // YYYY-MM-DD or solar
  fatherName?: string;
  motherName?: string;
  studentEmail?: string;
  studentPhone?: string;
  nationalIdNumber?: string;

  // Guardian Info
  guardianFullName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianEmail?: string;
  guardianJob?: string;

  // Location
  province: string;
  district: string;
  currentAddress?: string;
  displacementStatus: 'resident' | 'idp' | 'refugee_abroad';

  // Academic
  targetGrade: number; // 7 to 12
  lastCompletedGrade: number; // 6 to 11
  previousSchoolName?: string;
  primaryLanguage: 'dari' | 'pashto' | 'uzbeki' | 'other';
  internetAccess: 'daily' | 'several_days_a_week' | 'limited';
  deviceType: 'smartphone' | 'tablet' | 'computer' | 'shared_family';

  // Documents
  tazkiraUrl?: string;
  tazkiraFileName?: string;
  transcriptUrl?: string;
  transcriptFileName?: string;
  studentPhotoUrl?: string;
  hasDocumentsNow: boolean;
  documentNotes?: string;

  // Security & Submission
  declarationAgreed: boolean;
  privacyConsent: boolean;
  studentPassword?: string;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'need_info';
  adminNotes?: string;
  createdAt: any;
  updatedAt?: any;
}
