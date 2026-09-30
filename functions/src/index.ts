import * as admin from 'firebase-admin';

admin.initializeApp();

export { setUserRole } from './auth';
export { submitLessonQuiz } from './quiz';
export { startFinalExam, submitFinalExam } from './exam';
export { verifyCertificate } from './certificates';
export { importQuestions, resetStudentProgress, disableUser } from './admin';
