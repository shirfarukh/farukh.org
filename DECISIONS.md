# Architecture & Technical Decisions Log

This document records sensible architectural decisions made during the development of the Learning App (Expo + Firebase).

## Decision Log

### 1. Unified Modular Firebase JS SDK v10+ across Platforms
- **Context**: The app targets iOS, Android, and Web from a single codebase and needs to run smoothly in Expo Go as well as web builds.
- **Decision**: Use `@firebase/app`, `@firebase/auth`, `@firebase/firestore`, `@firebase/storage`, and `@firebase/functions` (Firebase JS SDK v10+ modular) instead of `react-native-firebase`.
- **Impact**: Ensures 100% code shareability across Web, iOS, Android, and Expo dev builds without native link dependencies.

### 2. Platform-Specific Video Player Architecture
- **Context**: Native mobile apps perform best with native YouTube iframe bridge components (`react-native-youtube-iframe`), while Web requires a sandboxed HTML `<iframe>` targeting the YouTube IFrame API.
- **Decision**: Implemented `<LessonVideo />` with platform split (`LessonVideo.native.tsx` and `LessonVideo.web.tsx`).
- **Impact**: Clean cross-platform abstraction without platform check hacks in render methods.

### 3. Server-Side Graded Exam & Quiz Submissions
- **Context**: Answer keys must never be readable by student clients to prevent cheating via inspect element or network proxies.
- **Decision**: Answer keys reside under `answerKeys` and `examKeys` subcollections accessible exclusively by Admin role rules and Cloud Functions. All grading, score calculation, timer enforcement, and certificate issuing occur via Firebase 2nd-gen Cloud Functions (`submitLessonQuiz`, `submitFinalExam`, `issueCertificate`).
- **Impact**: High security integrity, instant feedback to students after submission, zero leak of correct options to client network traffic.

### 4. Custom Claims Role Enforcement
- **Context**: Client-side Firestore document fields like `role: "admin"` can be spoofed by malicious requests.
- **Decision**: Enforce roles strictly via Auth Custom Claims (`token.admin == true`), set only by `setUserRole` Cloud Function or `scripts/make-admin.ts`.
- **Impact**: Unforgeable role security at both API and Firestore Rules levels.

### 5. PDF Generation & QR Verification
- **Context**: Certificates must be downloadable PDFs with public verification capabilities.
- **Decision**: Generate PDFs server-side in Cloud Functions using `pdf-lib` and `qrcode`, store in Firebase Storage (`certificates/{certificateId}.pdf`), and expose a public verification route `/verify/[certificateId]` backed by `verifyCertificate` callable function.
- **Impact**: Tamper-proof certificates with instant visual & digital verification.
