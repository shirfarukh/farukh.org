import * as admin from 'firebase-admin';

export interface AuditParams {
  action:
    | 'instructor_approved'
    | 'instructor_rejected'
    | 'instructor_suspended'
    | 'course_publish_approved'
    | 'course_changes_requested'
    | 'course_rejected'
    | 'course_archived'
    | 'course_deleted'
    | 'course_ownership_transferred'
    | 'course_unpublished';
  actorId: string;
  actorEmail?: string;
  actorRole?: 'admin' | 'system';
  targetId: string;
  targetType: 'user' | 'course' | 'reviewRequest' | 'instructorApplication';
  details?: Record<string, any>;
}

export async function logAuditEvent(params: AuditParams): Promise<string> {
  const db = admin.firestore();
  const docRef = db.collection('auditLog').doc();
  await docRef.set({
    id: docRef.id,
    action: params.action,
    actorId: params.actorId,
    actorEmail: params.actorEmail || null,
    actorRole: params.actorRole || 'admin',
    targetId: params.targetId,
    targetType: params.targetType,
    details: params.details || {},
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  return docRef.id;
}
