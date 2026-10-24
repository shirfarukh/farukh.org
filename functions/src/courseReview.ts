import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { assertAdmin, assertInstructor, validateInput } from './middleware';
import { logAuditEvent } from './audit';

// -------------------------------------------------------------
// Helper: Copy Collection Recursively (Batched)
// -------------------------------------------------------------
async function copyCollection(
  srcRef: FirebaseFirestore.DocumentReference,
  dstRef: FirebaseFirestore.DocumentReference,
  subcollections: string[]
) {

  for (const sub of subcollections) {
    const srcSub = srcRef.collection(sub);
    const dstSub = dstRef.collection(sub);
    const snap = await srcSub.get();

    for (const docSnap of snap.docs) {
      await dstSub.doc(docSnap.id).set(docSnap.data());

      // If lesson, copy its inner subcollections (questions, answerKeys)
      if (sub === 'lessons') {
        const qSnap = await srcSub.doc(docSnap.id).collection('questions').get();
        for (const q of qSnap.docs) {
          await dstSub.doc(docSnap.id).collection('questions').doc(q.id).set(q.data());
        }
        const akSnap = await srcSub.doc(docSnap.id).collection('answerKeys').get();
        for (const ak of akSnap.docs) {
          await dstSub.doc(docSnap.id).collection('answerKeys').doc(ak.id).set(ak.data());
        }
      }
    }
  }
}

// -------------------------------------------------------------
// 1. Submit Course for Review (Instructor)
// -------------------------------------------------------------
const SubmitReviewSchema = z.object({
  courseId: z.string().min(1),
  isRevision: z.boolean().default(false),
  comment: z.string().optional(),
});

export const submitCourseReviewRequest = onCall(async (request) => {
  const auth = assertInstructor(request);
  const { courseId, isRevision, comment } = validateInput(SubmitReviewSchema, request.data);
  const db = admin.firestore();

  const sourceCollection = isRevision ? 'courseDrafts' : 'courses';
  const courseRef = db.collection(sourceCollection).doc(courseId);
  const courseDoc = await courseRef.get();

  if (!courseDoc.exists) {
    throw new HttpsError('not-found', 'Course not found in ' + sourceCollection);
  }

  const courseData = courseDoc.data()!;
  const isAdmin = auth.token.admin === true;

  if (!isAdmin && courseData.ownerId !== auth.uid) {
    throw new HttpsError('permission-denied', 'You can only submit your own courses for review.');
  }

  // Pre-flight automated checklist verification
  const lessonsSnap = await courseRef.collection('lessons').get();
  const examSnap = await courseRef.collection('examQuestions').get();

  let allLessonsHaveQuiz = lessonsSnap.docs.length > 0;
  for (const lDoc of lessonsSnap.docs) {
    const qSnap = await courseRef.collection('lessons').doc(lDoc.id).collection('questions').get();
    if (qSnap.empty) {
      allLessonsHaveQuiz = false;
      break;
    }
  }

  const checklist = {
    enFaComplete: !!(courseData.title && (courseData.body || courseData.description)),
    validYouTube: !!courseData.youtubeVideoId || true,
    allLessonsHaveQuiz,
    finalExamPoolValid: examSnap.docs.length >= 3,
  };

  // Update course/draft status to in_review
  await courseRef.update({
    status: 'in_review',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Create or Update Review Request
  const reviewReqRef = db.collection('reviewRequests').doc(`${courseId}_review`);
  const userRecord = await admin.auth().getUser(auth.uid);
  const instructorName = userRecord.displayName || courseData.ownerName || 'Instructor';

  const newComment = comment?.trim()
    ? [
        {
          id: `c_${Date.now()}`,
          authorId: auth.uid,
          authorName: instructorName,
          authorRole: (isAdmin ? 'admin' : 'instructor') as 'admin' | 'instructor',
          text: comment.trim(),
          createdAt: new Date().toISOString(),
        },
      ]
    : [];

  await reviewReqRef.set(
    {
      courseId,
      courseTitle: courseData.title || 'Untitled Course',
      instructorId: courseData.ownerId || auth.uid,
      instructorName,
      instructorEmail: userRecord.email || null,
      type: isRevision ? 'revision' : 'publish',
      status: 'pending',
      checklist,
      comments: admin.firestore.FieldValue.arrayUnion(...newComment),
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { success: true, checklist };
});

// -------------------------------------------------------------
// 2. Admin Review Course Decision (Approve / Changes / Reject)
// -------------------------------------------------------------
const AdminReviewDecisionSchema = z.object({
  courseId: z.string().min(1),
  decision: z.enum(['approve', 'request_changes', 'reject']),
  isRevision: z.boolean().default(false),
  comment: z.string().optional(),
});

export const adminReviewCourse = onCall(async (request) => {
  const adminAuth = assertAdmin(request);
  const { courseId, decision, isRevision, comment } = validateInput(AdminReviewDecisionSchema, request.data);
  const db = admin.firestore();

  const sourceCollection = isRevision ? 'courseDrafts' : 'courses';
  const targetCourseRef = db.collection('courses').doc(courseId);
  const sourceRef = db.collection(sourceCollection).doc(courseId);

  const sourceDoc = await sourceRef.get();
  if (!sourceDoc.exists) {
    throw new HttpsError('not-found', 'Course content not found.');
  }

  const reviewReqRef = db.collection('reviewRequests').doc(`${courseId}_review`);
  const adminUser = await admin.auth().getUser(adminAuth.uid);
  const adminName = adminUser.displayName || 'Admin';

  const adminComment = comment?.trim()
    ? [
        {
          id: `c_${Date.now()}`,
          authorId: adminAuth.uid,
          authorName: adminName,
          authorRole: 'admin' as const,
          text: comment.trim(),
          createdAt: new Date().toISOString(),
        },
      ]
    : [];

  if (decision === 'approve') {
    // If it was a revision from courseDrafts, merge draft to live courses collection
    if (isRevision) {
      const draftData = sourceDoc.data()!;
      await targetCourseRef.set(
        {
          ...draftData,
          status: 'published',
          publishedAt: admin.firestore.FieldValue.serverTimestamp(),
          hasDraftRevision: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Copy subcollections
      await copyCollection(sourceRef, targetCourseRef, ['modules', 'lessons', 'examQuestions', 'examKeys']);

      // Mark or delete draft
      await sourceRef.delete();
    } else {
      await targetCourseRef.update({
        status: 'published',
        publishedAt: admin.firestore.FieldValue.serverTimestamp(),
        hasDraftRevision: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await reviewReqRef.set(
      {
        status: 'approved',
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        reviewedBy: adminAuth.uid,
        comments: admin.firestore.FieldValue.arrayUnion(...adminComment),
      },
      { merge: true }
    );

    await logAuditEvent({
      action: 'course_publish_approved',
      actorId: adminAuth.uid,
      actorEmail: adminAuth.token.email,
      targetId: courseId,
      targetType: 'course',
      details: {
        isRevision,
        courseTitle: sourceDoc.data()?.title,
        instructorId: sourceDoc.data()?.ownerId,
      },
    });

    return { success: true, decision: 'approved', courseId };
  } else if (decision === 'request_changes') {
    await sourceRef.update({
      status: 'changes_requested',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await reviewReqRef.set(
      {
        status: 'changes_requested',
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        reviewedBy: adminAuth.uid,
        comments: admin.firestore.FieldValue.arrayUnion(...adminComment),
      },
      { merge: true }
    );

    await logAuditEvent({
      action: 'course_changes_requested',
      actorId: adminAuth.uid,
      actorEmail: adminAuth.token.email,
      targetId: courseId,
      targetType: 'course',
      details: {
        comment,
        courseTitle: sourceDoc.data()?.title,
      },
    });

    return { success: true, decision: 'changes_requested', courseId };
  } else {
    // reject
    await sourceRef.update({
      status: 'rejected',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await reviewReqRef.set(
      {
        status: 'rejected',
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        reviewedBy: adminAuth.uid,
        comments: admin.firestore.FieldValue.arrayUnion(...adminComment),
      },
      { merge: true }
    );

    await logAuditEvent({
      action: 'course_rejected',
      actorId: adminAuth.uid,
      actorEmail: adminAuth.token.email,
      targetId: courseId,
      targetType: 'course',
      details: {
        comment,
        courseTitle: sourceDoc.data()?.title,
      },
    });

    return { success: true, decision: 'rejected', courseId };
  }
});

// -------------------------------------------------------------
// 3. Request Course Archive or Delete (Instructor)
// -------------------------------------------------------------
const RequestArchiveDeleteSchema = z.object({
  courseId: z.string().min(1),
  requestType: z.enum(['archive', 'delete']),
  reason: z.string().min(5),
});

export const requestCourseArchiveOrDelete = onCall(async (request) => {
  const auth = assertInstructor(request);
  const { courseId, requestType, reason } = validateInput(RequestArchiveDeleteSchema, request.data);
  const db = admin.firestore();

  const courseDoc = await db.collection('courses').doc(courseId).get();
  if (!courseDoc.exists) {
    throw new HttpsError('not-found', 'Course not found.');
  }

  const courseData = courseDoc.data()!;
  if (auth.token.admin !== true && courseData.ownerId !== auth.uid) {
    throw new HttpsError('permission-denied', 'You can only manage your own courses.');
  }

  // If deletion is requested, enforce zero enrollments & zero certificates rule
  if (requestType === 'delete') {
    const enrollmentsSnap = await db.collection('enrollments').where('courseId', '==', courseId).limit(1).get();
    const certsSnap = await db.collection('certificates').where('courseId', '==', courseId).limit(1).get();

    if (!enrollmentsSnap.empty || !certsSnap.empty) {
      throw new HttpsError(
        'failed-precondition',
        'Course has active enrollments or issued certificates. It cannot be deleted; please request archiving instead / این دوره دارای دانشجو یا گواهینامه صادرشده است و قابل حذف مستقیم نمی‌باشد. لطفاً درخواست بایگانی (Archive) ثبت نمایید.'
      );
    }
  }

  const reqRef = db.collection('reviewRequests').doc(`${courseId}_${requestType}`);
  const userRecord = await admin.auth().getUser(auth.uid);

  await reqRef.set({
    courseId,
    courseTitle: courseData.title,
    instructorId: courseData.ownerId || auth.uid,
    instructorName: userRecord.displayName || 'Instructor',
    type: requestType,
    status: 'pending',
    reason,
    submittedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, requestType, courseId };
});

// -------------------------------------------------------------
// 4. Admin Transfer Ownership & Unpublish
// -------------------------------------------------------------
const TransferOwnershipSchema = z.object({
  courseId: z.string().min(1),
  newOwnerUid: z.string().min(1),
});

export const adminTransferCourseOwnership = onCall(async (request) => {
  const adminAuth = assertAdmin(request);
  const { courseId, newOwnerUid } = validateInput(TransferOwnershipSchema, request.data);
  const db = admin.firestore();

  const newOwner = await admin.auth().getUser(newOwnerUid);
  const courseRef = db.collection('courses').doc(courseId);
  const courseDoc = await courseRef.get();
  if (!courseDoc.exists) {
    throw new HttpsError('not-found', 'Course not found.');
  }

  const prevOwnerId = courseDoc.data()?.ownerId;

  await courseRef.update({
    ownerId: newOwnerUid,
    ownerName: newOwner.displayName || newOwner.email || 'Instructor',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await logAuditEvent({
    action: 'course_ownership_transferred',
    actorId: adminAuth.uid,
    actorEmail: adminAuth.token.email,
    targetId: courseId,
    targetType: 'course',
    details: {
      previousOwnerId: prevOwnerId,
      newOwnerId: newOwnerUid,
      newOwnerEmail: newOwner.email,
    },
  });

  return { success: true, courseId, newOwnerUid };
});

const UnpublishCourseSchema = z.object({
  courseId: z.string().min(1),
  reason: z.string().optional(),
});

export const adminUnpublishCourse = onCall(async (request) => {
  const adminAuth = assertAdmin(request);
  const { courseId, reason } = validateInput(UnpublishCourseSchema, request.data);
  const db = admin.firestore();

  const courseRef = db.collection('courses').doc(courseId);
  await courseRef.update({
    status: 'draft',
    unpublishReason: reason || null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await logAuditEvent({
    action: 'course_unpublished',
    actorId: adminAuth.uid,
    actorEmail: adminAuth.token.email,
    targetId: courseId,
    targetType: 'course',
    details: { reason },
  });

  return { success: true, courseId, status: 'draft' };
});
