# Production-Ready Learning Application (Expo + Firebase)

A multi-platform course-learning platform for **iOS, Android, and Web** built from a single unified codebase.

Students read introductory text, watch YouTube-hosted video lessons, answer instant-feedback multiple-choice quizzes, unlock lessons sequentially, and complete a server-graded final exam to earn a verifiable **PDF Certificate with QR verification**.

---

## Technical Stack & Architecture

- **Frontend**: Expo SDK 51, React Native 0.74, TypeScript (Strict), Expo Router (file-based routing targeting iOS, Android, and Web).
- **Backend Services**: Firebase Modular JS SDK v10+ (Authentication, Firestore Database, Storage, 2nd Gen Cloud Functions, Hosting).
- **State Management**: TanStack Query (v5) + Zustand for auth session persistence.
- **Styling**: NativeWind (Tailwind CSS v3 for React Native) with custom design system tokens.
- **Video Player**: Native iframe bridge (`react-native-youtube-iframe`) on iOS/Android, sandboxed HTML `<iframe>` on Web via `<LessonVideo />`.
- **Certificate Engine**: Server-side PDF generation (`pdf-lib` + `qrcode`) executed inside 2nd Gen Firebase Cloud Functions, stored in Firebase Storage.
- **Security & Quality**: Firestore & Storage Security Rules, `@firebase/rules-unit-testing`, ESLint, Prettier, Firebase Local Emulator Suite.

---

## Getting Started & Local Development

### 1. Prerequisites
- Node.js `v20+`
- npm `v10+`
- Java Development Kit (JDK 17+) for Firebase Local Emulator Suite

### 2. Installation
```bash
# Clone repository and install dependencies
npm install --legacy-peer-deps

# Install Cloud Functions dependencies
cd functions && npm install && npm run build && cd ..
```

### 3. Environment Variables Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` configuration for local development:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=demo-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-learning-app.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=demo-learning-app
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-learning-app.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
EXPO_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:1234567890
EXPO_PUBLIC_USE_EMULATORS=true
```

### 4. Running the Firebase Emulator Suite
Start local emulators (Auth, Firestore, Functions, Storage, Hosting UI):
```bash
npm run emulators
```
*Emulator Suite UI will be accessible at: `http://localhost:4000`*

### 5. Seeding Database & Promoting Admin
In a separate terminal window, seed initial courses and accounts:
```bash
# Seed Cryptocurrency and AI courses + question banks
npm run seed

# Promote user to Admin role
npm run make-admin -- admin@example.com
```

### 6. Launching the App
```bash
# Launch Web App
npm run web

# Launch iOS Simulator
npm run ios

# Launch Android Emulator
npm run android
```

---

## Testing & Quality Commands

```bash
# TypeScript strict type checking (App + Functions)
npm run type-check

# ESLint code linting
npm run lint

# Prettier format check
npm run format

# Run Firestore Security Rules tests
npm run test:rules
```

---

## How to Add a New Course (Pure Content Task - Zero Code Changes)

Adding a new course requires **zero code modifications**. Admins can add courses either via the built-in Admin Panel UI or via Firestore Admin SDK / bulk imports.

### Method A: Via Admin Panel UI (`/admin`)
1. Log in with an account that has `admin` custom claim (`admin@example.com`).
2. Navigate to **Admin Panel** $\rightarrow$ **Manage Courses** $\rightarrow$ **+ New Course**.
3. Fill in title, description, cover image URL, and pass percentage ($80\%$).
4. Open the created course and click **Add New Module** (e.g. *Module 1: Fundamentals*).
5. Under the module, click **+ Add Lesson**:
   - Provide Lesson Title, Intro Markdown text, and YouTube video link.
   - The system automatically parses the `videoId`.
6. Use **Bulk Import** (JSON/CSV) to upload question banks for lesson quizzes and final exam pools.
7. Click **Publish Course**. The course instantly appears in the student catalog.

### Method B: Via Bulk CSV / JSON Import
CSV Format for Question Import:
```csv
Question Text, Option 1, Option 2, Option 3, Option 4, CorrectIndex (1-4), Explanation
"What is a smart contract?", "Self-executing code on blockchain", "A paper contract", "A legal law", "A database query", 1, "Smart contracts execute automatically when conditions are met."
```

---

## Production Deployment

### 1. Firebase Project Setup & Blaze Plan
1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Email/Password** in Firebase Authentication.
3. Upgrade Firebase project to the **Blaze (Pay as you go)** plan (required for Node 20 2nd Gen Cloud Functions).

### 2. Deployment Commands
```bash
# Deploy Cloud Functions
npm run deploy:functions

# Deploy Firestore & Storage Security Rules
npm run deploy:rules

# Export Web Build & Deploy to Firebase Hosting
npm run deploy:web
```

---

## License & Author
Built with Expo, React Native, and Firebase. All rights reserved.
