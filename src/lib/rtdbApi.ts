import { ref, onValue, set, onDisconnect, serverTimestamp, off, Database } from '@firebase/database';
import { Auth, User } from '@firebase/auth';

/**
 * Sets up an online/offline presence system for a user.
 * Writes to /presence/{uid} and /onlineUsers/{uid} in RTDB.
 * Automatically removes the /onlineUsers entry on disconnect.
 *
 * @param rtdb - Firebase Realtime Database instance
 * @param auth - Firebase Auth instance
 * @param user - The currently authenticated user
 * @returns cleanup function
 */
export function setupPresence(rtdb: Database, auth: Auth, user: User): () => void {
  const uid = user.uid;
  const presenceRef = ref(rtdb, `presence/${uid}`);
  const onlineUserRef = ref(rtdb, `onlineUsers/${uid}`);
  const connectedRef = ref(rtdb, '.info/connected');

  const unsubscribe = onValue(connectedRef, (snap) => {
    if (snap.val() === false) return;

    // When disconnected, remove from onlineUsers and mark offline
    onDisconnect(onlineUserRef).remove();
    onDisconnect(presenceRef).set({
      online: false,
      lastSeen: serverTimestamp(),
      displayName: user.displayName || user.email || uid,
    });

    // Mark as online now
    set(onlineUserRef, {
      uid,
      displayName: user.displayName || user.email || uid,
      joinedAt: serverTimestamp(),
    });

    set(presenceRef, {
      online: true,
      lastSeen: serverTimestamp(),
      displayName: user.displayName || user.email || uid,
    });
  });

  return () => {
    off(connectedRef);
    unsubscribe();
  };
}

/**
 * Reads the current presence data for a user once.
 */
export function getUserPresenceRef(rtdb: Database, uid: string) {
  return ref(rtdb, `presence/${uid}`);
}

/**
 * Reads the list of all currently online users.
 */
export function getOnlineUsersRef(rtdb: Database) {
  return ref(rtdb, 'onlineUsers');
}
