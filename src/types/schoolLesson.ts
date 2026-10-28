export interface SchoolLessonQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface SchoolLesson {
  id?: string;
  grade: number; // 7, 8, 9, 10, 11, 12 - STRICTLY within teacher's approvedGrades!
  subject: string;
  faSubject: string;
  title: string;
  faTitle: string;
  description: string;
  faDescription?: string;

  // Content
  videoUrl?: string; // YouTube or video stream URL
  videoDurationMinutes?: number;
  textContent?: string; // Detailed lesson notes, text, or syllabus
  downloadAttachmentUrl?: string; // Worksheet or reading material
  downloadAttachmentName?: string;

  // Exercises / Practice Questions
  questions?: SchoolLessonQuestion[];

  // Teacher & Status Info
  teacherId: string;
  teacherName: string;
  teacherEmail?: string;
  status: 'draft' | 'in_review' | 'published' | 'changes_requested';
  rejectionReason?: string;
  publishedAt?: any;
  createdAt: any;
  updatedAt?: any;
}
