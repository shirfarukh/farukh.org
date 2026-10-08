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
import { useTheme } from '../../src/features/theme/ThemeContext';
import { ThemeToggle } from '../../src/components/ui/ThemeToggle';
import { doc, setDoc } from '@firebase/firestore';
import { db } from '../../src/lib/firebase';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const { colors, isDark } = useTheme();
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
          <Text style={{ color: colors.text }} className="text-2xl font-bold">Profile Settings</Text>
          <Badge label={isAdmin ? 'ADMIN' : 'STUDENT'} variant={isAdmin ? 'warning' : 'info'} />
        </View>

        {message ? (
          <View
            style={{
              backgroundColor: colors.successBg,
              borderColor: colors.success,
              borderWidth: 1,
              padding: 14,
              borderRadius: 14,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: colors.success, fontSize: 13, fontWeight: '600' }}>{message}</Text>
          </View>
        ) : null}

        <Card>
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

          {/* Appearance / Theme setting row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: colors.cardBorder,
              marginTop: 4,
              marginBottom: 16,
            }}
          >
            <View>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
                Appearance / ظاهر
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                {isDark ? 'Dark Theme (فعال)' : 'Light Theme (فعال)'}
              </Text>
            </View>
            <ThemeToggle showLabel />
          </View>

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
