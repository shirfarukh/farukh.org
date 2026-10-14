import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { updateProfile } from '@firebase/auth';
import { useQuery } from '@tanstack/react-query';
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
import { getUserCertificates } from '../../src/features/certificates/certificatesApi';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const isPersian = i18n.language === 'fa';
  const setUser = useAuthStore((s) => s.setUser);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch user's certificates to display inside profile
  const { data: certificates = [], isLoading: loadingCerts } = useQuery({
    queryKey: ['userCertificates', user?.uid],
    queryFn: () => (user?.uid ? getUserCertificates(user.uid) : Promise.resolve([])),
    enabled: !!user?.uid,
  });

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
      setMessage(isPersian ? 'پروفایل با موفقیت بروزرسانی شد!' : 'Profile updated successfully!');
    } catch {
      setMessage(isPersian ? 'خطا در بروزرسانی پروفایل.' : 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScreenWrapper scrollable={true} edgeTop={false}>
      <View className="max-w-md w-full self-center px-4 py-6 pb-20">
        {/* Profile Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>
              {isPersian ? 'پروفایل کاربری' : 'Profile & Account'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              {user?.email}
            </Text>
          </View>
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

        {/* 🎓 MY CERTIFICATES SECTION INSIDE USER PROFILE */}
        <Card
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.75)' : '#FFFFFF',
            borderColor: colors.goldBorder,
            borderWidth: 1.5,
            padding: 18,
            marginBottom: 18,
            borderRadius: 20,
          }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2.5">
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.goldBg,
                  borderWidth: 1,
                  borderColor: colors.goldBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 20 }}>🎓</Text>
              </View>
              <View>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>
                  {isPersian ? 'گواهینامه‌های من' : 'My Certificates'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {loadingCerts
                    ? 'Loading...'
                    : certificates.length > 0
                    ? `${certificates.length} ${isPersian ? 'مدرک رسمی ثبت شده' : 'verified certificates earned'}`
                    : isPersian
                    ? 'هنوز مدرکی صادر نشده است'
                    : 'No certificates issued yet'}
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: certificates.length > 0 ? colors.gold : isDark ? '#334155' : '#E2E8F0',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  color: certificates.length > 0 ? (isDark ? '#0F172A' : '#FFFFFF') : colors.textSecondary,
                  fontSize: 12,
                  fontWeight: '800',
                }}
              >
                {certificates.length} 🏆
              </Text>
            </View>
          </View>

          {/* Certificate details or encouraging prompt */}
          {certificates.length > 0 ? (
            <View className="mb-3 gap-2">
              {certificates.slice(0, 2).map((cert) => (
                <View
                  key={cert.id}
                  style={{
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.cardBorder,
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                    📜 {cert.courseTitle}
                  </Text>
                  <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                    {cert.scorePercent}% Score • ID: {cert.id?.slice(0, 8)}...
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                lineHeight: 18,
                marginBottom: 12,
              }}
            >
              {isPersian
                ? 'با اتمام تمام دروس و کسب نمره ۸۰٪ یا بالاتر در آزمون نهایی هر دوره، گواهی‌نامه رسمی و قابل استعلام خود را دریافت کنید.'
                : 'Complete all lessons in a course and achieve 80%+ on the final exam to earn your verifiable digital certificate.'}
            </Text>
          )}

          {/* Action button to open full certificates page */}
          <TouchableOpacity
            onPress={() => router.push('/(student)/certificates' as any)}
            style={{
              backgroundColor: colors.gold,
              borderRadius: 12,
              paddingVertical: 10,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Text
              style={{
                color: isDark ? '#0F172A' : '#FFFFFF',
                fontWeight: '800',
                fontSize: 13,
              }}
            >
              🎓 {isPersian ? 'مشاهده و دانلود مدارک' : 'View & Download Certificates'} →
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Profile Settings Card */}
        <Card style={{ marginBottom: 16 }}>
          <Input
            label={isPersian ? 'آدرس ایمیل (غیرقابل ویرایش)' : 'Email Address (Read-only)'}
            value={user?.email || ''}
            editable={false}
          />

          <Input
            label={isPersian ? 'نام نمایشی' : 'Display Name'}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={isPersian ? 'نام شما' : 'Your Name'}
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
            title={isPersian ? 'بروزرسانی مشخصات' : 'Update Profile'}
            onPress={handleSave}
            loading={loading}
          />
        </Card>

        <Button
          title={isPersian ? 'خروج از حساب' : 'Sign Out'}
          variant="danger"
          onPress={handleLogout}
        />
      </View>
    </ScreenWrapper>
  );
}
