import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SchoolApplication } from '../../types/schoolApplication';

export async function submitSchoolApplication(
  data: Omit<SchoolApplication, 'id' | 'referenceNumber' | 'createdAt' | 'status'>
): Promise<{ id: string; referenceNumber: string }> {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const referenceNumber = `FOE-2026-${randomSuffix}`;

  const payload: Record<string, any> = {
    referenceNumber,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Strip all undefined properties so Firestore addDoc never throws "Unsupported field value: undefined"
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && value !== '') {
      payload[key] = value;
    }
  }

  // Ensure mandatory string and number fields exist
  payload.studentFullName = String(data.studentFullName || '');
  payload.guardianFullName = String(data.guardianFullName || '');
  payload.guardianPhone = String(data.guardianPhone || '');
  payload.targetGrade = Number(data.targetGrade || 7);

  const docRef = await addDoc(collection(db, 'schoolApplications'), payload);
  return { id: docRef.id, referenceNumber };
}

export async function getSchoolApplications(): Promise<SchoolApplication[]> {
  try {
    const snap = await getDocs(collection(db, 'schoolApplications'));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SchoolApplication));
    list.sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });
    return list;
  } catch (err) {
    console.error('Failed to get school applications:', err);
    return [];
  }
}

export async function getUserSchoolApplications(
  userId?: string,
  userEmail?: string,
  referenceNumber?: string
): Promise<SchoolApplication[]> {
  if (!userId && !userEmail && !referenceNumber) return [];
  try {
    const appsMap = new Map<string, SchoolApplication>();

    if (userId) {
      try {
        const q1 = query(collection(db, 'schoolApplications'), where('userId', '==', userId));
        const snap1 = await getDocs(q1);
        snap1.forEach((d) => appsMap.set(d.id, { id: d.id, ...d.data() } as SchoolApplication));
      } catch (e) {
        console.warn('Failed querying by userId:', e);
      }
    }

    if (userEmail) {
      try {
        const q2 = query(collection(db, 'schoolApplications'), where('studentEmail', '==', userEmail));
        const snap2 = await getDocs(q2);
        snap2.forEach((d) => appsMap.set(d.id, { id: d.id, ...d.data() } as SchoolApplication));
      } catch (e) {
        console.warn('Failed querying by studentEmail:', e);
      }

      // If userEmail is a generated student ID email (e.g. FOE-2026-XXXX@student.farukh.org)
      const potentialRef = userEmail.split('@')[0].toUpperCase();
      if (potentialRef.startsWith('FOE-') || potentialRef.startsWith('ADS-')) {
        try {
          const qRef = query(collection(db, 'schoolApplications'), where('referenceNumber', '==', potentialRef));
          const snapRef = await getDocs(qRef);
          snapRef.forEach((d) => appsMap.set(d.id, { id: d.id, ...d.data() } as SchoolApplication));
        } catch (e) {
          console.warn('Failed querying by derived referenceNumber:', e);
        }
      }
    }

    if (referenceNumber) {
      try {
        const cleanRef = referenceNumber.trim().toUpperCase();
        const q3 = query(collection(db, 'schoolApplications'), where('referenceNumber', '==', cleanRef));
        const snap3 = await getDocs(q3);
        snap3.forEach((d) => appsMap.set(d.id, { id: d.id, ...d.data() } as SchoolApplication));
      } catch (e) {
        console.warn('Failed querying by explicit referenceNumber:', e);
      }
    }

    return Array.from(appsMap.values());
  } catch (err) {
    console.error('Failed to get user school applications:', err);
    return [];
  }
}

export async function updateSchoolApplicationStatus(
  applicationId: string,
  status: SchoolApplication['status'],
  adminNotes?: string,
  userId?: string,
  targetGrade?: number
): Promise<void> {
  const ref = doc(db, 'schoolApplications', applicationId);
  
  let effectiveUserId = userId;
  let effectiveTargetGrade = targetGrade;

  if (!effectiveUserId || !effectiveTargetGrade) {
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data();
        if (!effectiveUserId && d.userId) effectiveUserId = d.userId;
        if (!effectiveTargetGrade && d.targetGrade) effectiveTargetGrade = Number(d.targetGrade);
      }
    } catch (e) {
      console.warn('Failed to read application data for update:', e);
    }
  }

  await updateDoc(ref, {
    status,
    ...(adminNotes !== undefined ? { adminNotes } : {}),
    updatedAt: serverTimestamp(),
  });

  // Ensure student user gets access ONLY to the single requested grade
  if (effectiveUserId && effectiveTargetGrade) {
    try {
      const userRef = doc(db, 'users', effectiveUserId);
      if (status === 'accepted') {
        // Grant strictly the requested grade (overriding any multi-grade bleed)
        await setDoc(userRef, {
          approvedSchoolGrades: [effectiveTargetGrade],
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } else if (status === 'rejected' || status === 'need_info') {
        // If rejected or need info, revoke access to this grade
        await updateDoc(userRef, {
          approvedSchoolGrades: arrayRemove(effectiveTargetGrade),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.warn('Failed to update approvedSchoolGrades on user doc:', e);
    }
  }
}
