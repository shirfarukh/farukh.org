import { useEffect } from 'react';
import { rtdb, auth } from '../lib/firebase';
import { setupPresence } from '../lib/rtdbApi';
import { useAuthStore } from '../features/auth/authStore';

/**
 * Automatically manages the authenticated user's realtime presence in RTDB.
 *
 * Usage: call this hook once at a high-level component (e.g. RootLayoutNav).
 * It connects to Firebase RTDB via the .info/connected reference and:
 *   - Sets the user online when they connect
 *   - Uses onDisconnect() to mark them offline when the connection drops
 */
export function usePresence() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;

    const cleanup = setupPresence(rtdb, auth, user);
    return cleanup;
  }, [user]);
}
