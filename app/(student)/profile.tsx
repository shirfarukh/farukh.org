import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { updateProfile } from 'firebase/auth';
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
import { doc, setDoc, getDoc } from '@firebase/firestore';
import { db } from '../../src/lib/firebase';
import { getUserCertificates } from '../../src/features/certificates/certificatesApi';
import { getInstructorApplication } from '../../src/features/instructor/instructorApi';
import { getUserSchoolApplications } from '../../src/features/school/schoolApplicationApi';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAdmin, isInstructor, role, instructorMode, setInstructorMode, logout } = useAuth();
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

  // Fetch instructor application if student
  const { data: instructorApp } = useQuery({
    queryKey: ['instructorApplication', user?.uid],
    queryFn: () => (user?.uid ? getInstructorApplication(user.uid) : Promise.resolve(null)),
    enabled: !!user?.uid && !isAdmin && !isInstructor,
  });

  // Fetch school applications & user profile for approved grades
  const { data: userApplications = [] } = useQuery({
    queryKey: ['userSchoolApplications', user?.uid, user?.email],
    queryFn: () => getUserSchoolApplications(user?.uid, user?.email || undefined),
    enabled: !!(user?.uid || user?.email),
  });

  const { data: userDocData } = useQuery({
    queryKey: ['userProfileDoc', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        return snap.exists() ? snap.data() : null;
      } catch {
        return null;
      }
    },
    enabled: !!user?.uid,
  });

  const approvedSchoolGrades = React.useMemo(() => {
    const set = new Set<number>();
    userApplications.forEach((app) => {
      if (app.status === 'accepted' && app.targetGrade) {
        set.add(Number(app.targetGrade));
      }
    });
    if (set.size === 0 && userDocData?.approvedSchoolGrades && Array.isArray(userDocData.approvedSchoolGrades)) {
      const explicitRequested = userDocData?.targetGrade || userDocData?.schoolGrade || userDocData?.requestedGrade;
      if (explicitRequested && userDocData.approvedSchoolGrades.includes(Number(explicitRequested))) {
        set.add(Number(explicitRequested));
      } else if (userDocData.approvedSchoolGrades.length > 0) {
        set.add(Number(userDocData.approvedSchoolGrades[0]));
      }
    }
    return Array.from(set);
  }, [userDocData, userApplications]);

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
          <Badge
            label={isAdmin ? 'ADMIN' : isInstructor ? 'INSTRUCTOR' : 'STUDENT'}
            variant={isAdmin ? 'warning' : isInstructor ? 'success' : 'info'}
          />
        </View>

        {/* 🎓 ENROLLED SCHOOL GRADES (FOR ACCEPTED STUDENTS) */}
        {approvedSchoolGrades.length > 0 && (
          <Card
            style={{
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
              borderColor: isDark ? '#10B981' : '#A7F3D0',
              borderWidth: 1.5,
              padding: 16,
              marginBottom: 18,
              borderRadius: 20,
            }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2.5">
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: isDark ? '#065F46' : '#D1FAE5',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 18 }}>🎓</Text>
                </View>
                <View>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>
                    {isPersian ? 'صنف رسمی مکتب (شمولیت تأیید شده)' : 'Enrolled School Grade (Approved)'}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                    {isPersian ? 'دسترسی کامل به کتب، دروس و ویدیوها فعال است' : 'Full access to curriculum materials active'}
                  </Text>
                </View>
              </View>
              <Badge label={isPersian ? 'تأیید شده' : 'APPROVED'} variant="success" />
            </View>

            <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {approvedSchoolGrades.map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => router.push({ pathname: '/(student)/school', params: { grade: String(g) } } as any)}
                  style={{
                    backgroundColor: '#10B981',
                    borderRadius: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                    flexDirection: isPersian ? 'row-reverse' : 'row',
                    gap: 6,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                    📚 {isPersian ? `ورود به صنف ${g} و مشاهده مواد درسی` : `Enter Grade ${g} Class`} →
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* 🎓 INSTRUCTOR PORTAL CARD (FOR INSTRUCTORS & ADMINS) */}
        {(isInstructor || isAdmin) && (
          <Card
            style={{
              backgroundColor: isDark ? 'rgba(30, 58, 138, 0.25)' : '#EFF6FF',
              borderColor: isDark ? '#3B82F6' : '#BFDBFE',
              borderWidth: 1.5,
              padding: 16,
              marginBottom: 18,
              borderRadius: 20,
            }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2.5">
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: isDark ? '#1E3A8A' : '#DBEAFE',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 18 }}>👨‍🏫</Text>
                </View>
                <View>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>
                    {isPersian ? 'پنل مربیگری و ساخت دوره' : 'Instructor Workspace'}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                    {isPersian ? 'مدیریت دوره‌ها، سرفصل‌ها و آزمون‌ها' : 'Manage your courses, drafts & student metrics'}
                  </Text>
                </View>
              </View>
              <Badge label={isPersian ? 'فعال' : 'ACTIVE'} variant="success" />
            </View>

            <TouchableOpacity
              onPress={() => router.push('/instructor' as any)}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 10,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                🚀 {isPersian ? 'ورود به پنل مربیگری' : 'Open Instructor Portal'} →
              </Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* 🚀 BECOME AN INSTRUCTOR CARD (FOR STUDENTS) */}
        {!isAdmin && !isInstructor && (
          <Card
            style={{
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.75)' : '#FFFFFF',
              borderColor: instructorApp?.status === 'pending'
                ? colors.goldBorder
                : instructorApp?.status === 'changes_requested'
                ? '#F59E0B'
                : colors.cardBorder,
              borderWidth: 1.5,
              padding: 16,
              marginBottom: 18,
              borderRadius: 20,
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2.5">
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: colors.goldBg,
                    borderWidth: 1,
                    borderColor: colors.goldBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 18 }}>✨</Text>
                </View>
                <View>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>
                    {isPersian ? 'مربی شوید و تدریس کنید' : 'Become an Instructor'}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                    {instructorApp?.status === 'pending'
                      ? isPersian ? 'درخواست شما در حال بررسی آکادمیک است' : 'Application under academic review'
                      : instructorApp?.status === 'changes_requested'
                      ? isPersian ? 'نیاز به بازنگری مدارک' : 'Action needed on application'
                      : isPersian ? 'دانش خود را با هزاران دانش‌آموز به اشتراک بگذارید' : 'Teach courses & inspire students'}
                  </Text>
                </View>
              </View>

              {instructorApp && (
                <Badge
                  label={
                    instructorApp.status === 'pending'
                      ? 'IN REVIEW'
                      : instructorApp.status === 'changes_requested'
                      ? 'ACTION REQ'
                      : 'APPLIED'
                  }
                  variant={instructorApp.status === 'pending' ? 'warning' : 'info'}
                />
              )}
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(student)/become-instructor' as any)}
              style={{
                marginTop: 8,
                backgroundColor: isDark ? '#334155' : '#F1F5F9',
                borderRadius: 12,
                paddingVertical: 9,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>
                {instructorApp?.status === 'pending'
                  ? isPersian ? 'مشاهده جزئیات درخواست ⏳' : 'View Application Status ⏳'
                  : instructorApp?.status === 'changes_requested'
                  ? isPersian ? 'اصلاح و ارسال مجدد ✏️' : 'Update Application ✏️'
                  : isPersian ? 'تکمیل فرم درخواست مربی‌گری 🚀' : 'Apply to Teach 🚀'}
              </Text>
            </TouchableOpacity>
          </Card>
        )}

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

          {certificates.length > 0 ? (
            <View
              style={{
                backgroundColor: 'rgba(245,158,11,0.08)',
                borderColor: '#F59E0B',
                borderWidth: 1,
                borderRadius: 14,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <View className="flex-row items-center gap-2 mb-2">
                <Text style={{ fontSize: 16 }}>🔒</Text>
                <Text style={{ color: '#F59E0B', fontWeight: 'bold', fontSize: 13 }}>
                  {isPersian ? 'نام رسمی قفل شده است (گواهینامه صادر شده)' : 'Official Name Locked (Certificate Issued)'}
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 8 }}>
                {isPersian
                  ? 'به دلیل صدور تصدیق‌نامه رسمی، نام و تخلص شما قفل گردیده و جهت جلوگیری از هرگونه جعل قابل ویرایش نمی‌باشد.'
                  : 'Your legal name is permanently locked to prevent credential forgery because you have official certificates issued.'}
              </Text>
              <View className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
                  {certificates[0]?.nameEn || displayName}
                  {certificates[0]?.nameFa ? ` • ${certificates[0]?.nameFa}` : ''}
                </Text>
              </View>
            </View>
          ) : (
            <Input
              label={isPersian ? 'نام نمایشی' : 'Display Name'}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={isPersian ? 'نام شما' : 'Your Name'}
            />
          )}

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

          {certificates.length === 0 && (
            <Button
              title={isPersian ? 'بروزرسانی مشخصات' : 'Update Profile'}
              onPress={handleSave}
              loading={loading}
            />
          )}
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
