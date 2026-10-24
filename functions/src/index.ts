import * as admin from 'firebase-admin';

admin.initializeApp();

export { setUserRole } from './auth';
export { submitLessonQuiz } from './quiz';
export { startFinalExam, submitFinalExam } from './exam';
export {
  issueCertificate,
  verifyCertificate,
  adminRevokeCertificate,
  adminReissueCertificate,
  adminSaveCertificateTemplate,
} from './certificates';
export { importQuestions, resetStudentProgress, disableUser } from './admin';
export {
  submitInstructorApplication,
  adminReviewInstructorApplication,
  adminSuspendInstructor,
} from './instructor';
export {
  submitCourseReviewRequest,
  adminReviewCourse,
  requestCourseArchiveOrDelete,
  adminTransferCourseOwnership,
  adminUnpublishCourse,
} from './courseReview';
