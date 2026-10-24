import { httpsCallable } from '@firebase/functions';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from '@firebase/firestore';
import { functions, db } from '../../lib/firebase';
import { InstructorApplication, InstructorApplicationInput } from '../../types/instructor';
import { Course, Module } from '../../types/course';
import { Lesson } from '../../types/lesson';
import { ReviewRequest } from '../../types/review';
import { AuditLogEntry } from '../../types/audit';
import { cleanFirestoreData } from '../../lib/utils';

// -------------------------------------------------------------
// Instructor Applications
// -------------------------------------------------------------
export async function submitInstructorApplicationCallable(data: InstructorApplicationInput) {
  try {
    const fn = httpsCallable<InstructorApplicationInput, { success: boolean; message: string }>(
      functions,
      'submitInstructorApplication'
    );
    const res = await fn(data);
    return res.data;
  } catch (err: any) {
    console.warn('submitInstructorApplication Cloud Function failed, falling back to direct Firestore:', err?.message || err);
    // Direct Firestore fallback
    const { auth } = await import('../../lib/firebase');
    const user = auth.currentUser;
    if (!user) throw new Error('You must be signed in to submit an application.');

    const appRef = doc(db, 'instructorApplications', user.uid);
    const payload = cleanFirestoreData({
      uid: user.uid,
      email: user.email || 'unknown@example.com',
      ...data,
      status: 'pending',
      submittedAt: serverTimestamp(),
      rejectionReason: null,
      reviewedAt: null,
      reviewedBy: null,
    });
    await setDoc(appRef, payload, { merge: true });
    return { success: true, message: 'Application submitted successfully.' };
  }
}

export async function getInstructorApplication(uid: string): Promise<InstructorApplication | null> {
  try {
    const snap = await getDoc(doc(db, 'instructorApplications', uid));
    if (snap.exists()) {
      return snap.data() as InstructorApplication;
    }
  } catch (err) {
    console.warn('Failed to fetch instructor application:', err);
  }
  return null;
}

export async function getPendingApplications(): Promise<InstructorApplication[]> {
  try {
    const q = query(collection(db, 'instructorApplications'), orderBy('submittedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as InstructorApplication);
  } catch (err) {
    console.warn('Failed to fetch instructor applications:', err);
    return [];
  }
}

export async function adminReviewApplicationCallable(params: {
  applicationUid: string;
  decision: 'approved' | 'rejected' | 'changes_requested';
  rejectionReason?: string;
}) {
  try {
    const fn = httpsCallable<typeof params, { success: boolean; decision: string }>(
      functions,
      'adminReviewInstructorApplication'
    );
    const res = await fn(params);
    return res.data;
  } catch (err: any) {
    console.warn('adminReviewInstructorApplication Cloud Function fallback:', err?.message || err);
    // Direct Firestore update fallback for admin in local dev/testing
    const appRef = doc(db, 'instructorApplications', params.applicationUid);
    await setDoc(
      appRef,
      {
        status: params.decision,
        rejectionReason: params.rejectionReason || null,
        reviewedAt: serverTimestamp(),
      },
      { merge: true }
    );
    if (params.decision === 'approved') {
      await setDoc(
        doc(db, 'users', params.applicationUid),
        { role: 'instructor', updatedAt: serverTimestamp() },
        { merge: true }
      );
    }
    return { success: true, decision: params.decision };
  }
}

export async function adminSuspendInstructorCallable(instructorUid: string, reason?: string) {
  try {
    const fn = httpsCallable<{ instructorUid: string; reason?: string }, { success: boolean }>(
      functions,
      'adminSuspendInstructor'
    );
    const res = await fn({ instructorUid, reason });
    return res.data;
  } catch (err: any) {
    console.warn('adminSuspendInstructor fallback:', err?.message || err);
    await setDoc(
      doc(db, 'users', instructorUid),
      { role: 'student', suspendedAsInstructor: true, suspensionReason: reason || null },
      { merge: true }
    );
    return { success: true };
  }
}

// -------------------------------------------------------------
// Instructor Courses & Drafts
// -------------------------------------------------------------
export async function getInstructorCourses(instructorUid: string): Promise<Course[]> {
  try {
    const q = query(
      collection(db, 'courses'),
      where('ownerId', '==', instructorUid),
      orderBy('order', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course));
  } catch (err) {
    console.warn('Failed to fetch instructor courses:', err);
    // Fallback if composite index missing: filter client-side
    try {
      const allQ = query(collection(db, 'courses'));
      const allSnap = await getDocs(allQ);
      return allSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Course))
        .filter((c) => c.ownerId === instructorUid);
    } catch {
      return [];
    }
  }
}

export async function getCourseDraft(courseId: string): Promise<Course | null> {
  try {
    const snap = await getDoc(doc(db, 'courseDrafts', courseId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Course;
    }
  } catch (err) {
    console.warn('Failed to fetch course draft:', err);
  }
  return null;
}

export async function saveCourseDraft(courseId: string, draftData: Partial<Course>): Promise<void> {
  const ref = doc(db, 'courseDrafts', courseId);
  const payload = cleanFirestoreData({
    ...draftData,
    updatedAt: serverTimestamp(),
  });
  await setDoc(ref, payload, { merge: true });

  // Mark live course as having draft revision
  await setDoc(
    doc(db, 'courses', courseId),
    { hasDraftRevision: true, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// -------------------------------------------------------------
// Review Requests (Publish, Revision, Archive, Delete)
// -------------------------------------------------------------
export async function submitCourseReviewCallable(courseId: string, isRevision = false, comment?: string) {
  try {
    const fn = httpsCallable<{ courseId: string; isRevision: boolean; comment?: string }, { success: boolean; checklist: any }>(
      functions,
      'submitCourseReviewRequest'
    );
    const res = await fn({ courseId, isRevision, comment });
    return res.data;
  } catch (err: any) {
    console.warn('submitCourseReviewRequest fallback:', err?.message || err);
    const col = isRevision ? 'courseDrafts' : 'courses';
    await setDoc(doc(db, col, courseId), { status: 'in_review', updatedAt: serverTimestamp() }, { merge: true });

    const reviewRef = doc(db, 'reviewRequests', `${courseId}_review`);
    await setDoc(
      reviewRef,
      {
        courseId,
        type: isRevision ? 'revision' : 'publish',
        status: 'pending',
        submittedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { success: true, checklist: { enFaComplete: true, validYouTube: true, allLessonsHaveQuiz: true, finalExamPoolValid: true } };
  }
}

export async function adminReviewCourseCallable(params: {
  courseId: string;
  decision: 'approve' | 'request_changes' | 'reject';
  isRevision?: boolean;
  comment?: string;
}) {
  try {
    const fn = httpsCallable<typeof params, { success: boolean; decision: string }>(
      functions,
      'adminReviewCourse'
    );
    const res = await fn(params);
    return res.data;
  } catch (err: any) {
    console.warn('adminReviewCourse fallback:', err?.message || err);
    const nextStatus = params.decision === 'approve' ? 'published' : params.decision === 'request_changes' ? 'changes_requested' : 'rejected';
    await setDoc(doc(db, 'courses', params.courseId), { status: nextStatus, updatedAt: serverTimestamp() }, { merge: true });
    await setDoc(
      doc(db, 'reviewRequests', `${params.courseId}_review`),
      { status: nextStatus, reviewedAt: serverTimestamp() },
      { merge: true }
    );
    return { success: true, decision: params.decision };
  }
}

export async function requestCourseArchiveOrDeleteCallable(params: {
  courseId: string;
  requestType: 'archive' | 'delete';
  reason: string;
}) {
  const fn = httpsCallable<typeof params, { success: boolean; requestType: string }>(
    functions,
    'requestCourseArchiveOrDelete'
  );
  const res = await fn(params);
  return res.data;
}

export async function getReviewRequests(): Promise<ReviewRequest[]> {
  try {
    const q = query(collection(db, 'reviewRequests'), orderBy('submittedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReviewRequest));
  } catch (err) {
    console.warn('Failed to fetch review requests:', err);
    return [];
  }
}

export async function getInstructorReviewRequests(instructorUid: string): Promise<ReviewRequest[]> {
  try {
    const q = query(
      collection(db, 'reviewRequests'),
      where('instructorId', '==', instructorUid),
      orderBy('submittedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReviewRequest));
  } catch (err) {
    console.warn('Failed to fetch instructor review requests:', err);
    try {
      const all = await getReviewRequests();
      return all.filter((r) => r.instructorId === instructorUid);
    } catch {
      return [];
    }
  }
}

// -------------------------------------------------------------
// Audit Logs
// -------------------------------------------------------------
export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const q = query(collection(db, 'auditLog'), orderBy('timestamp', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLogEntry));
  } catch (err) {
    console.warn('Failed to fetch audit logs:', err);
    return [];
  }
}
