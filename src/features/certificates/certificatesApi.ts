import {
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  orderBy,
  onSnapshot,
} from '@firebase/firestore';
import { httpsCallable } from '@firebase/functions';
import { db, functions } from '../../lib/firebase';
import { Certificate, CertificateTemplate } from '../../types/certificate';

export async function getUserCertificates(uid: string): Promise<Certificate[]> {
  const q = query(
    collection(db, 'certificates'),
    where('uid', '==', uid),
    orderBy('issuedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, certificateId: d.id, ...d.data() } as Certificate));
}

export function listenToCertificate(
  certificateId: string,
  onUpdate: (cert: Certificate | null) => void,
  onError?: (err: Error) => void
) {
  const ref = doc(db, 'certificates', certificateId);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onUpdate({ id: snap.id, certificateId: snap.id, ...snap.data() } as Certificate);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

export async function issueCertificateCallable(params: {
  attemptId: string;
  nameEn: string;
  nameFa: string;
}) {
  const fn = httpsCallable<
    { attemptId: string; nameEn: string; nameFa: string },
    {
      certificateId: string;
      status: 'generating' | 'ready' | 'failed';
      pdfPath?: string;
      jpgPath?: string;
      nameEn: string;
      nameFa: string;
      isExisting?: boolean;
    }
  >(functions, 'issueCertificate');

  const res = await fn(params);
  return res.data;
}

export async function verifyCertificateCallable(certificateId: string) {
  const fn = httpsCallable<{ certificateId: string }, {
    certificateId: string;
    valid: boolean;
    revoked: boolean;
    revokedReason: string | null;
    nameEn: string;
    nameFa: string;
    courseTitleEn: string;
    courseTitleFa: string;
    dateGregorian: string;
    dateJalali: string;
    scorePercent: number;
    status: string;
    pdfPath?: string;
    jpgPath?: string;
  }>(functions, 'verifyCertificate');

  const res = await fn({ certificateId });
  return res.data;
}

// Admin: Revoke Certificate
export async function adminRevokeCertificateCallable(certificateId: string, reason?: string) {
  const fn = httpsCallable(functions, 'adminRevokeCertificate');
  const res = await fn({ certificateId, reason });
  return res.data;
}

// Admin: Reissue Certificate
export async function adminReissueCertificateCallable(certificateId: string) {
  const fn = httpsCallable(functions, 'adminReissueCertificate');
  const res = await fn({ certificateId });
  return res.data;
}

// Admin: Save Certificate Template
export async function adminSaveCertificateTemplateCallable(courseId: string, template: Partial<CertificateTemplate>) {
  const fn = httpsCallable(functions, 'adminSaveCertificateTemplate');
  const res = await fn({ courseId, template });
  return res.data;
}

// Admin: Get All Certificates
export async function getAllCertificates(): Promise<Certificate[]> {
  const q = query(collection(db, 'certificates'), orderBy('issuedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, certificateId: d.id, ...d.data() } as Certificate));
}

// Get Course Certificate Template
export async function getCourseCertificateTemplate(courseId: string): Promise<CertificateTemplate | null> {
  const ref = doc(db, 'courses', courseId, 'certificateTemplate', 'default');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as CertificateTemplate;
  }
  return null;
}
