import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
} from '@firebase/firestore';
import { db } from '../../lib/firebase';
import { SchoolTeacherApplication } from '../../types/schoolTeacher';
import { cleanFirestoreData } from '../../lib/utils';

export async function submitSchoolTeacherApplication(
  data: Omit<SchoolTeacherApplication, 'id' | 'createdAt' | 'status' | 'approvedGrades' | 'referenceNumber'> & {
    referenceNumber?: string;
  }
): Promise<{ id: string; referenceNumber: string }> {
  // Generate distinct teacher application reference
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const refNum = data.referenceNumber || `FOE-TCH-${randomSuffix}`;

  const payload = cleanFirestoreData({
    ...data,
    referenceNumber: refNum,
    status: 'pending',
    approvedGrades: [],
    createdAt: serverTimestamp(),
  });

  const docRef = await addDoc(collection(db, 'schoolTeacherApplications'), payload);

  // If userId is provided, also record the pending state on the user doc
  if (data.userId) {
    try {
      const userRef = doc(db, 'users', data.userId);
      await updateDoc(userRef, {
        schoolTeacherApplicationId: docRef.id,
        schoolTeacherStatus: 'pending',
      });
    } catch (e) {
      console.warn('Could not update user doc with teacher application ref:', e);
    }
  }

  return { id: docRef.id, referenceNumber: refNum };
}

export async function getSchoolTeacherApplications(): Promise<SchoolTeacherApplication[]> {
  try {
    const q = query(collection(db, 'schoolTeacherApplications'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as SchoolTeacherApplication[];
  } catch (err) {
    console.warn('Fallback getting teacher applications without order:', err);
    const snapshot = await getDocs(collection(db, 'schoolTeacherApplications'));
    const items = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as SchoolTeacherApplication[];
    return items.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
  }
}

export async function updateSchoolTeacherApplicationStatus(
  id: string,
  status: SchoolTeacherApplication['status'],
  approvedGrades?: number[],
  adminNotes?: string,
  userId?: string
): Promise<void> {
  const docRef = doc(db, 'schoolTeacherApplications', id);
  const updateData: any = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (approvedGrades !== undefined) {
    updateData.approvedGrades = approvedGrades;
  }
  if (adminNotes !== undefined) {
    updateData.adminNotes = adminNotes;
  }

  await updateDoc(docRef, updateData);

  // If approved and userId exists, update user permissions in users collection
  if (userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const isApproved = status === 'approved';
      await setDoc(
        userRef,
        {
          isSchoolTeacher: isApproved,
          schoolTeacherApprovedGrades: isApproved ? (approvedGrades || []) : [],
          schoolTeacherStatus: status,
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Failed to update user profile with teacher permissions:', e);
    }
  }
}

export async function getUserTeacherApplication(userId: string): Promise<SchoolTeacherApplication | null> {
  try {
    const q = query(
      collection(db, 'schoolTeacherApplications'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as SchoolTeacherApplication;
  } catch {
    return null;
  }
}
