import admin from 'firebase-admin';

// Connect to emulator or real project
if (process.env.FIRESTORE_EMULATOR_HOST === undefined) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
}

const firebaseAdmin = (admin as any).default || admin;

if (!firebaseAdmin.apps?.length) {
  firebaseAdmin.initializeApp({ projectId: 'demo-learning-app' });
}

async function makeAdmin(email: string) {
  try {
    const user = await firebaseAdmin.auth().getUserByEmail(email);
    await firebaseAdmin.auth().setCustomUserClaims(user.uid, { admin: true });

    await firebaseAdmin.firestore().collection('users').doc(user.uid).set({
      role: 'admin',
      updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`Successfully granted admin privileges to ${email} (UID: ${user.uid})`);
  } catch (error: any) {
    console.error('Error promoting admin user:', error.message);
  }
}

const targetEmail = process.argv[2] || 'admin@example.com';
makeAdmin(targetEmail);
