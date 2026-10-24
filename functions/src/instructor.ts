import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { assertAuth, assertAdmin, validateInput } from './middleware';
import { logAuditEvent } from './audit';

const SubmitApplicationSchema = z.object({
  nameEn: z.string().min(2).max(60),
  nameFa: z.string().min(2).max(60),
  bio: z.string().min(30).max(1000),
  shortBio: z.string().max(250).optional(),
  expertise: z.array(z.string()).min(1),
  teachingLanguages: z.array(z.string()).min(1),
  portfolioLinks: z.array(z.string()).default([]),
  youtubeChannel: z.string().optional(),
  sampleCourseIdea: z.string().min(20).max(1000),
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: 'Must accept terms',
  }),
});

export const submitInstructorApplication = onCall(async (request) => {
  const auth = assertAuth(request);
  const data = validateInput(SubmitApplicationSchema, request.data);
  const db = admin.firestore();

  const appRef = db.collection('instructorApplications').doc(auth.uid);
  const existingDoc = await appRef.get();

  if (existingDoc.exists) {
    const existing = existingDoc.data()!;
    if (existing.status === 'pending') {
      throw new HttpsError('failed-precondition', 'You already have an active application under review / شما در حال حاضر یک درخواست در حال بررسی دارید.');
    }
    if (existing.status === 'approved') {
      throw new HttpsError('failed-precondition', 'You are already an approved instructor / شما در حال حاضر به عنوان مدرس تایید شده‌اید.');
    }
    // Check 30-day cooldown on rejection
    if (existing.status === 'rejected' && existing.reviewedAt) {
      const reviewedDate = existing.reviewedAt.toDate ? existing.reviewedAt.toDate() : new Date(existing.reviewedAt);
      const cooldownMs = 30 * 24 * 60 * 60 * 1000; // 30 days
      const elapsed = Date.now() - reviewedDate.getTime();
      if (elapsed < cooldownMs) {
        const daysLeft = Math.ceil((cooldownMs - elapsed) / (24 * 60 * 60 * 1000));
        throw new HttpsError(
          'failed-precondition',
          `You can reapply in ${daysLeft} days / شما می‌توانید پس از ${daysLeft} روز مجدداً درخواست دهید.`
        );
      }
    }
  }

  // Get user details
  const userDoc = await db.collection('users').doc(auth.uid).get();
  const email = userDoc.exists && userDoc.data()?.email ? userDoc.data()?.email : auth.token.email || 'unknown@example.com';

  const applicationPayload = {
    uid: auth.uid,
    email,
    ...data,
    status: 'pending',
    rejectionReason: null,
    submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
  };

  await appRef.set(applicationPayload, { merge: true });

  return { success: true, message: 'Application submitted for review successfully.' };
});

const ReviewApplicationSchema = z.object({
  applicationUid: z.string().min(1),
  decision: z.enum(['approved', 'rejected', 'changes_requested']),
  rejectionReason: z.string().optional(),
});

export const adminReviewInstructorApplication = onCall(async (request) => {
  const adminAuth = assertAdmin(request);
  const { applicationUid, decision, rejectionReason } = validateInput(ReviewApplicationSchema, request.data);
  const db = admin.firestore();

  const appRef = db.collection('instructorApplications').doc(applicationUid);
  const appDoc = await appRef.get();
  if (!appDoc.exists) {
    throw new HttpsError('not-found', 'Instructor application not found.');
  }

  const appData = appDoc.data()!;

  if (decision === 'approved') {
    // 1. Set Custom User Claim
    const userRecord = await admin.auth().getUser(applicationUid);
    const existingClaims = userRecord.customClaims || {};
    await admin.auth().setCustomUserClaims(applicationUid, {
      ...existingClaims,
      instructor: true,
      role: 'instructor',
    });

    // 2. Update Firestore User Document
    await db.collection('users').doc(applicationUid).set(
      {
        role: 'instructor',
        shortBio: appData.shortBio || (appData.bio ? appData.bio.slice(0, 150) : null),
        instructorApprovedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 3. Update Application Status
    await appRef.update({
      status: 'approved',
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: adminAuth.uid,
      rejectionReason: null,
    });

    // 4. Log Audit Event
    await logAuditEvent({
      action: 'instructor_approved',
      actorId: adminAuth.uid,
      actorEmail: adminAuth.token.email,
      targetId: applicationUid,
      targetType: 'instructorApplication',
      details: {
        applicantEmail: appData.email,
        nameEn: appData.nameEn,
        nameFa: appData.nameFa,
      },
    });

    return { success: true, decision: 'approved', uid: applicationUid };
  } else if (decision === 'rejected') {
    await appRef.update({
      status: 'rejected',
      rejectionReason: rejectionReason || 'Your application did not meet our current requirements.',
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: adminAuth.uid,
    });

    await logAuditEvent({
      action: 'instructor_rejected',
      actorId: adminAuth.uid,
      actorEmail: adminAuth.token.email,
      targetId: applicationUid,
      targetType: 'instructorApplication',
      details: {
        reason: rejectionReason,
        applicantEmail: appData.email,
      },
    });

    return { success: true, decision: 'rejected', uid: applicationUid };
  } else {
    // changes_requested
    await appRef.update({
      status: 'changes_requested',
      rejectionReason: rejectionReason || 'Please provide more details on your portfolio and course ideas.',
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: adminAuth.uid,
    });

    return { success: true, decision: 'changes_requested', uid: applicationUid };
  }
});

const SuspendInstructorSchema = z.object({
  instructorUid: z.string().min(1),
  reason: z.string().optional(),
});

export const adminSuspendInstructor = onCall(async (request) => {
  const adminAuth = assertAdmin(request);
  const { instructorUid, reason } = validateInput(SuspendInstructorSchema, request.data);
  const db = admin.firestore();

  // Revoke claim
  const userRecord = await admin.auth().getUser(instructorUid);
  const existingClaims = userRecord.customClaims || {};
  await admin.auth().setCustomUserClaims(instructorUid, {
    ...existingClaims,
    instructor: false,
    role: 'student',
  });

  // Update user document
  await db.collection('users').doc(instructorUid).set(
    {
      role: 'student',
      suspendedAsInstructor: true,
      suspensionReason: reason || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await logAuditEvent({
    action: 'instructor_suspended',
    actorId: adminAuth.uid,
    actorEmail: adminAuth.token.email,
    targetId: instructorUid,
    targetType: 'user',
    details: { reason },
  });

  return { success: true, suspended: true, uid: instructorUid };
});
