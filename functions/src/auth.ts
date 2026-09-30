import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { assertAdmin, validateInput } from './middleware';

const SetUserRoleSchema = z.object({
  uid: z.string(),
  role: z.enum(['student', 'admin']),
});

export const setUserRole = onCall(async (request) => {
  assertAdmin(request);
  const { uid, role } = validateInput(SetUserRoleSchema, request.data);

  const isAdmin = role === 'admin';
  await admin.auth().setCustomUserClaims(uid, { admin: isAdmin });
  
  await admin.firestore().collection('users').doc(uid).set({
    role,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return { success: true, uid, role };
});
