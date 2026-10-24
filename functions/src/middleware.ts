import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';

export function assertAuth(request: CallableRequest) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  return request.auth;
}

export function assertAdmin(request: CallableRequest) {
  const auth = assertAuth(request);
  if (!auth.token || auth.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Admin privileges are required to perform this action.');
  }
  return auth;
}

export function assertInstructor(request: CallableRequest) {
  const auth = assertAuth(request);
  if (
    !auth.token ||
    (auth.token.admin !== true &&
     auth.token.instructor !== true &&
     auth.token.role !== 'instructor')
  ) {
    throw new HttpsError('permission-denied', 'Instructor or Admin privileges are required to perform this action.');
  }
  return auth;
}

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new HttpsError('invalid-argument', `Invalid request data: ${result.error.message}`);
  }
  return result.data;
}
