import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../lib/firebase';
import { Certificate } from '../../types/certificate';

export async function getUserCertificates(uid: string): Promise<Certificate[]> {
  const q = query(
    collection(db, 'certificates'),
    where('uid', '==', uid),
    orderBy('issuedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Certificate));
}

export async function verifyCertificateCallable(certificateId: string) {
  const fn = httpsCallable(functions, 'verifyCertificate');
  const res = await fn({ certificateId });
  return res.data as {
    certificateId: string;
    studentName: string;
    courseTitle: string;
    scorePercent: number;
    issuedAt: any;
    revoked: boolean;
    pdfPath: string;
  };
}
