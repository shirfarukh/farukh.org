import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { LiveSession } from '../../types/liveSession';

const LIVE_SESSIONS_COLLECTION = 'liveSessions';

/**
 * Fetch all upcoming or active live sessions, optionally filtered by courseId.
 */
export async function getUpcomingLiveSessions(courseId?: string): Promise<LiveSession[]> {
  try {
    const colRef = collection(db, LIVE_SESSIONS_COLLECTION);
    let q;
    if (courseId) {
      q = query(
        colRef,
        where('courseId', '==', courseId),
        where('status', 'in', ['scheduled', 'live']),
        orderBy('scheduledStartTime', 'asc')
      );
    } else {
      q = query(
        colRef,
        where('status', 'in', ['scheduled', 'live']),
        orderBy('scheduledStartTime', 'asc')
      );
    }

    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as LiveSession[];
  } catch (err) {
    console.error('Failed to get upcoming live sessions:', err);
    // Fallback without composite index if necessary
    try {
      const snap = await getDocs(collection(db, LIVE_SESSIONS_COLLECTION));
      const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as LiveSession[];
      return sessions
        .filter((s) => s.status === 'scheduled' || s.status === 'live')
        .sort((a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime());
    } catch {
      return [];
    }
  }
}

/**
 * Fetch all live sessions created by a specific instructor.
 */
export async function getInstructorLiveSessions(instructorId: string): Promise<LiveSession[]> {
  try {
    const q = query(
      collection(db, LIVE_SESSIONS_COLLECTION),
      where('instructorId', '==', instructorId),
      orderBy('scheduledStartTime', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as LiveSession[];
  } catch (err) {
    console.error('Failed to get instructor live sessions:', err);
    try {
      const snap = await getDocs(collection(db, LIVE_SESSIONS_COLLECTION));
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s: any) => s.instructorId === instructorId) as LiveSession[];
    } catch {
      return [];
    }
  }
}

/**
 * Fetch all sessions for Admin view.
 */
export async function getAllLiveSessions(): Promise<LiveSession[]> {
  try {
    const q = query(collection(db, LIVE_SESSIONS_COLLECTION), orderBy('scheduledStartTime', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as LiveSession[];
  } catch (err) {
    console.error('Failed to get all live sessions:', err);
    const snap = await getDocs(collection(db, LIVE_SESSIONS_COLLECTION));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as LiveSession[];
  }
}

/**
 * Create a new live session with Google Meet link.
 */
export async function createLiveSession(
  sessionData: Omit<LiveSession, 'id' | 'createdAt' | 'updatedAt' | 'attendeeUids' | 'attendeeCount'>
): Promise<string> {
  const colRef = collection(db, LIVE_SESSIONS_COLLECTION);
  const docRef = await addDoc(colRef, {
    ...sessionData,
    attendeeUids: [],
    attendeeCount: 0,
    status: sessionData.status || 'scheduled',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Update an existing live session.
 */
export async function updateLiveSession(
  sessionId: string,
  updates: Partial<LiveSession>
): Promise<void> {
  const docRef = doc(db, LIVE_SESSIONS_COLLECTION, sessionId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a live session.
 */
export async function deleteLiveSession(sessionId: string): Promise<void> {
  const docRef = doc(db, LIVE_SESSIONS_COLLECTION, sessionId);
  await deleteDoc(docRef);
}

/**
 * Toggle RSVP for a live session.
 */
export async function toggleRsvpLiveSession(
  sessionId: string,
  userId: string,
  currentlyAttending: boolean
): Promise<void> {
  const docRef = doc(db, LIVE_SESSIONS_COLLECTION, sessionId);
  if (currentlyAttending) {
    await updateDoc(docRef, {
      attendeeUids: arrayRemove(userId),
      attendeeCount: increment(-1),
    });
  } else {
    await updateDoc(docRef, {
      attendeeUids: arrayUnion(userId),
      attendeeCount: increment(1),
    });
  }
}
