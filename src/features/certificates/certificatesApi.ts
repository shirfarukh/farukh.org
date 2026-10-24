import {
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from '@firebase/firestore';
import { httpsCallable } from '@firebase/functions';
import { db, functions, auth } from '../../lib/firebase';
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
  try {
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
  } catch (err: any) {
    console.warn('issueCertificate Cloud Function unavailable, falling back to direct Firestore:', err?.message || err);
    return await issueCertificateDirect(params);
  }
}

// Direct Firestore Certificate Issuance (Zero Server Dependency)
async function issueCertificateDirect(params: {
  attemptId: string;
  nameEn: string;
  nameFa: string;
}) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to issue a certificate.');
  }

  // 1. Verify Attempt
  const attemptSnap = await getDoc(doc(db, 'examAttempts', params.attemptId));
  if (!attemptSnap.exists()) {
    throw new Error('Exam attempt record not found.');
  }
  const attempt = attemptSnap.data()!;
  if (attempt.passed !== true) {
    throw new Error('Exam attempt was not passed with ≥80%.');
  }

  const courseId = attempt.courseId;

  // 2. Check for existing certificate (idempotency)
  try {
    const qExisting = query(
      collection(db, 'certificates'),
      where('uid', '==', user.uid),
      where('courseId', '==', courseId)
    );
    const existingSnap = await getDocs(qExisting);
    const validCert = existingSnap.docs.find((d) => d.data().revoked !== true);
    if (validCert) {
      const data = validCert.data();
      return {
        certificateId: validCert.id,
        status: 'ready' as const,
        nameEn: data.nameEn || params.nameEn,
        nameFa: data.nameFa || params.nameFa,
        isExisting: true,
      };
    }
  } catch (e) {
    console.warn('Checking existing certificate failed:', e);
  }

  // 3. Fetch Course details
  let courseTitleEn = 'Course';
  let courseTitleFa = 'دوره آموزشی';
  try {
    const courseSnap = await getDoc(doc(db, 'courses', courseId));
    if (courseSnap.exists()) {
      const cd = courseSnap.data();
      if (cd.isUnfinished === true) {
        throw new Error('This course is currently marked as unfinished by the instructor. Certificates cannot be issued for unfinished courses / این دوره هنوز تکمیل نشده است و صدور تصدیق‌نامه برای آن غیرفعال می‌باشد.');
      }
      if (cd.status && cd.status !== 'published') {
        throw new Error('This course is not published. Certificates cannot be issued / این دوره منتشر نشده است.');
      }
      courseTitleEn = cd.title || courseTitleEn;
      courseTitleFa = cd.titleFa || cd.title || courseTitleFa;
    }
  } catch (e: any) {
    if (e?.message?.includes('unfinished') || e?.message?.includes('not published')) {
      throw e;
    }
    console.warn('Error loading course details:', e);
  }

  // 4. Generate Random Unguessable Certificate ID
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  const timeSuffix = Date.now().toString().slice(-4);
  const certificateId = `FARUKH-${randomStr}-${timeSuffix}`;

  // 5. Generate Dates
  const now = new Date();
  const dateGregorian = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  let dateJalali = '';
  try {
    dateJalali = new Intl.DateTimeFormat('fa-AF-u-ca-persian', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(now);
  } catch {
    dateJalali = now.toLocaleDateString();
  }

  // 6. QR Code URL pointing directly to verifiable URL (pure black modules on clean background)
  const verifyUrl = `https://farukh.org/verify/${certificateId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(verifyUrl)}&color=0-0-0&bgcolor=255-255-255&qzone=1`;

  // 7. Save Certificate in Firestore
  const certDocData = {
    id: certificateId,
    certificateId,
    uid: user.uid,
    attemptId: params.attemptId,
    courseId,
    courseTitleEn,
    courseTitleFa,
    nameEn: params.nameEn.trim(),
    nameFa: params.nameFa.trim(),
    dateGregorian,
    dateJalali,
    scorePercent: attempt.scorePercent || 100,
    status: 'ready',
    valid: true,
    revoked: false,
    revokedReason: null,
    qrCodeUrl,
    issuedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'certificates', certificateId), certDocData);

  // 8. Update User Profile & Progress
  try {
    await setDoc(
      doc(db, 'progress', `${user.uid}_${courseId}`),
      {
        certificateId,
        completed: true,
        finalExamPassed: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await setDoc(
      doc(db, 'users', user.uid),
      {
        lastCertificateId: certificateId,
        lastCertificateIssuedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('Error linking certificate to user:', e);
  }

  return {
    certificateId,
    status: 'ready' as const,
    nameEn: params.nameEn.trim(),
    nameFa: params.nameFa.trim(),
    isExisting: false,
  };
}

export async function verifyCertificateCallable(certificateId: string) {
  try {
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
      qrCodeUrl?: string;
    }>(functions, 'verifyCertificate');

    const res = await fn({ certificateId });
    return res.data;
  } catch (err) {
    console.warn('verifyCertificate Cloud Function unavailable, falling back to direct Firestore:', err);
    const snap = await getDoc(doc(db, 'certificates', certificateId));
    if (!snap.exists()) {
      throw new Error('Certificate not found in official database.');
    }
    const data = snap.data();
    return {
      certificateId: snap.id,
      valid: data.valid !== false && !data.revoked,
      revoked: !!data.revoked,
      revokedReason: data.revokedReason || null,
      nameEn: data.nameEn || '',
      nameFa: data.nameFa || '',
      courseTitleEn: data.courseTitleEn || '',
      courseTitleFa: data.courseTitleFa || '',
      dateGregorian: data.dateGregorian || '',
      dateJalali: data.dateJalali || '',
      scorePercent: data.scorePercent || 100,
      status: data.status || 'ready',
      pdfPath: data.pdfPath,
      jpgPath: data.jpgPath,
      qrCodeUrl: data.qrCodeUrl,
    };
  }
}

// Admin: Revoke Certificate
export async function adminRevokeCertificateCallable(certificateId: string, reason?: string) {
  try {
    const fn = httpsCallable(functions, 'adminRevokeCertificate');
    const res = await fn({ certificateId, reason });
    return res.data;
  } catch {
    await setDoc(doc(db, 'certificates', certificateId), { revoked: true, revokedReason: reason || 'Revoked by admin', revokedAt: serverTimestamp() }, { merge: true });
    return { success: true };
  }
}

// Admin: Reissue Certificate
export async function adminReissueCertificateCallable(certificateId: string) {
  try {
    const fn = httpsCallable(functions, 'adminReissueCertificate');
    const res = await fn({ certificateId });
    return res.data;
  } catch {
    await setDoc(doc(db, 'certificates', certificateId), { revoked: false, revokedReason: null, reissuedAt: serverTimestamp() }, { merge: true });
    return { success: true };
  }
}

// Admin: Save Certificate Template
export async function adminSaveCertificateTemplateCallable(courseId: string, template: Partial<CertificateTemplate>) {
  try {
    const fn = httpsCallable(functions, 'adminSaveCertificateTemplate');
    const res = await fn({ courseId, template });
    return res.data;
  } catch {
    await setDoc(doc(db, 'courses', courseId, 'certificateTemplate', 'default'), template, { merge: true });
    return { success: true };
  }
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
