import { z } from 'zod';

export const TEACHER_SUBJECTS = [
  { id: 'english', en: 'English Language', fa: 'زبان انگلیسی' },
  { id: 'mathematics', en: 'Mathematics & Algebra', fa: 'ریاضیات و الجبر' },
  { id: 'general_science', en: 'General Science', fa: 'ساینس عمومی' },
  { id: 'biology', en: 'Biology & Health Sciences', fa: 'بیولوژی و علوم صحی' },
  { id: 'chemistry', en: 'Chemistry', fa: 'کیمیا' },
  { id: 'physics', en: 'Physics', fa: 'فیزیک' },
  { id: 'social_studies', en: 'Social Studies & Geography', fa: 'علوم اجتماعی، تاریخ و جغرافیا' },
  { id: 'dari_pashto', en: 'Dari / Pashto Literature', fa: 'ادبیات دری و پشتو' },
  { id: 'coding_cs', en: 'Computer Science & Coding', fa: 'علوم کامپیوتر و برنامه‌نویسی' },
  { id: 'ai_future_tech', en: 'AI & Digital Skills', fa: 'هوش مصنوعی و مهارت‌های دیجیتال' },
  { id: 'life_skills', en: 'Life Skills & Leadership', fa: 'مهارت‌های زندگی و رهبری' },
] as const;

export interface SchoolTeacherApplication {
  id?: string;
  referenceNumber: string; // e.g. FOE-TCH-12345
  userId?: string;

  // Personal Info
  fullName: string;
  gender: 'female' | 'male' | 'other';
  email: string;
  phone: string; // WhatsApp / Phone
  province: string;
  cityOrDistrict?: string;
  educationLevel: 'bachelors' | 'masters' | 'phd' | 'teacher_training' | 'other';
  fieldOfStudy: string;

  // GIRLS SCHOOL TEACHING EXPERIENCE (Mandatory / Insisted on)
  hasGirlsSchoolExperience: boolean; // Must be true!
  girlsSchoolName: string; // Name of Afghan girls' school/high school
  yearsOfExperience: number; // e.g. 3, 5, 10
  pastSubjectsTaught: string; // Subjects taught in girls' school
  experienceDetails: string; // Detailed description of teaching history, school administration or verification notes

  // Target Grades to Teach (Grades 7 to 12)
  requestedGrades: number[]; // e.g. [7, 8, 9] or [10, 11, 12]
  primarySubject: string;
  secondarySubjects?: string[];

  // Readiness & Motivation
  onlineTeachingExperience?: string;
  hasLaptopAndInternet: boolean;
  motivationStatement: string;
  resumeOrDocsUrl?: string;

  // Review & Approval State
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'need_info';
  approvedGrades: number[]; // Grades the admin approved them to create lessons for!
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: any;
  updatedAt?: any;
}
