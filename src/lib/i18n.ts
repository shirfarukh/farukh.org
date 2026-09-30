import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      welcome: 'Welcome back',
      catalog: 'Course Catalog',
      myCertificates: 'My Certificates',
      profile: 'Profile',
      adminDashboard: 'Admin Dashboard',
      enroll: 'Enroll Now',
      continue: 'Continue Course',
      startQuiz: 'Start Quiz',
      submitQuiz: 'Submit Quiz',
      startExam: 'Start Final Exam',
      submitExam: 'Submit Final Exam',
      passed: 'Passed',
      failed: 'Failed',
      viewCertificate: 'View Certificate',
      downloadCertificate: 'Download Certificate',
      verifyCertificate: 'Verify Certificate',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
