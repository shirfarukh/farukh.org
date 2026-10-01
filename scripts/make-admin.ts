import * as admin from 'firebase-admin';

// Connect to emulator or real project
if (process.env.FIRESTORE_EMULATOR_HOST === undefined) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
}

if (!admin.apps?.length) {
  admin.initializeApp({ projectId: 'demo-learning-app' });
}

async function makeAdmin(email: string) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    await admin.firestore().collection('users').doc(user.uid).set({
      role: 'admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`Successfully granted admin privileges to ${email} (UID: ${user.uid})`);
  } catch (error: any) {
    console.error('Error promoting admin user:', error.message);
  }
}

const targetEmail = process.argv[2] || 'admin@example.com';
makeAdmin(targetEmail);
