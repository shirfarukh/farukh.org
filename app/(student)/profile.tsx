import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { updateProfile } from '@firebase/auth';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Badge } from '../../src/components/ui/Badge';
import { useAuth } from '../../src/features/auth/useAuth';
import { useAuthStore } from '../../src/features/auth/authStore';
import { doc, setDoc } from '@firebase/firestore';
import { db } from '../../src/lib/firebase';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setMessage('');
    try {
      await updateProfile(user, { displayName });
      // Update local store
      setUser({ ...user, displayName }, isAdmin);
      // Update Firestore user document
      try {
        await setDoc(doc(db, 'users', user.uid), { displayName }, { merge: true });
      } catch {}
      setMessage('Profile updated successfully!');
    } catch {
      setMessage('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScreenWrapper>
      <View className="max-w-md w-full self-center py-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-white">Profile Settings</Text>
          <Badge label={isAdmin ? 'ADMIN' : 'STUDENT'} variant={isAdmin ? 'warning' : 'info'} />
        </View>

        {message ? (
          <View className="bg-emerald-950/60 border border-emerald-800 p-3.5 rounded-xl mb-4">
            <Text className="text-emerald-300 text-sm font-medium">{message}</Text>
          </View>
        ) : null}

        <Card className="mb-6 border-surface-border">
          <Input
            label="Email Address (Read-only)"
            value={user?.email || ''}
            editable={false}
          />

          <Input
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your Name"
          />

          <Button
            title="Update Profile"
            onPress={handleSave}
            loading={loading}
          />
        </Card>

        <Button
          title="Sign Out"
          variant="danger"
          onPress={handleLogout}
        />
      </View>
    </ScreenWrapper>
  );
}
