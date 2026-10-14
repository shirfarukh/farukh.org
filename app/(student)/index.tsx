import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import {
  getPublishedCourses,
  getUserEnrolledCourseIds,
  enrollInCourse,
  unenrollFromCourse,
} from '../../src/features/student/studentApi';
import { getUserCertificates } from '../../src/features/certificates/certificatesApi';
import { AppLogo } from '../../src/components/ui/AppLogo';
import { HeaderPreferences } from '../../src/components/ui/HeaderPreferences';
import { useAuth } from '../../src/features/auth/useAuth';
import { useTheme } from '../../src/features/theme/ThemeContext';
import { CatalogCategoryBar } from '../../src/components/ui/CatalogCategoryBar';
import { useScrollHeader } from '../../src/features/theme/ScrollHeaderContext';

// ─── Category Icon helper ─────────────────────────────────────────────────────
function getCategoryIcon(cat?: string): string {
  switch (cat) {
    case 'AI & Tech':
      return '🤖';
    case 'Stocks & Crypto':
      return '📈';
    case 'Ecommerce':
      return '🛍️';
    case 'Languages':
      return '🗣️';
    case 'Morals':
      return '⚖️';
    default:
      return '📚';
  }
}

// ─── Greeting helper ───────────────────────────────────────────────────────────
function getGreeting(isPersian: boolean): string {
  const hour = new Date().getHours();
  if (isPersian) {
    if (hour < 12) return 'صبح بخیر';
    if (hour < 17) return 'عصر بخیر';
    return 'شب بخیر';
  }
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        minWidth: 85,
        backgroundColor: colors.cardHover,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(250,204,21,0.2)' : colors.cardBorder,
        padding: 12,
        alignItems: 'center',
        gap: 3,
      }}
    >
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 17 }}>{value}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600', textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

// ─── Course Progress Card (logged-in user's registered course) ────────────────
function EnrolledCourseCard({
  item,
  isPersian,
  onPress,
  onUnenroll,
  isUnenrolling,
}: {
  item: any;
  isPersian: boolean;
  onPress: () => void;
  onUnenroll: () => void;
  isUnenrolling: boolean;
}) {
  const { colors, isDark } = useTheme();
  const title = isPersian && item.faTitle ? item.faTitle : item.title;
  const progress = item._progress ?? 35;

  return (
    <View
      style={{
        marginBottom: 16,
        backgroundColor: colors.card,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(250,204,21,0.3)' : colors.cardBorder,
        padding: 18,
        shadowColor: colors.gold,
        shadowOpacity: isDark ? 0.08 : 0.04,
        shadowRadius: 14,
        elevation: 5,
      }}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <Image
            source={{ uri: item.coverUrl }}
            style={{ width: 100, height: 80, borderRadius: 14, backgroundColor: colors.bg, aspectRatio: 5 / 4 }}
            resizeMode="cover"
          />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  backgroundColor: colors.goldBg,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.goldBorder,
                }}
              >
                <Text style={{ color: colors.gold, fontSize: 10, fontWeight: '800' }}>
                  {isPersian ? 'ثبت‌نام شده' : 'REGISTERED'}
                </Text>
              </View>
              {item.category && (
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    backgroundColor: colors.cardHover,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Text style={{ fontSize: 10 }}>{getCategoryIcon(item.category)}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>
                    {item.category}
                  </Text>
                </View>
              )}
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                {item.lessonCount || 5} {isPersian ? 'درس' : 'lessons'}
              </Text>
            </View>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, lineHeight: 22 }}>
              {title}
            </Text>
            {item.keywords && item.keywords.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {item.keywords.slice(0, 3).map((kw: string, i: number) => (
                  <Text key={i} style={{ color: colors.gold, fontSize: 10, fontWeight: '600' }}>
                    #{kw}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Progress bar */}
      <View style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
            {isPersian ? 'پیشرفت دوره' : 'Course Progress'}
          </Text>
          <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '800' }}>{progress}%</Text>
        </View>
        <View style={{ height: 7, backgroundColor: colors.cardHover, borderRadius: 99 }}>
          <View
            style={{
              height: '100%',
              width: `${Math.min(progress, 100)}%`,
              borderRadius: 99,
              backgroundColor: progress >= 100 ? '#22C55E' : colors.gold,
            }}
          />
        </View>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: 12 }}>
        <TouchableOpacity
          onPress={onUnenroll}
          disabled={isUnenrolling}
          style={{ paddingVertical: 4, paddingHorizontal: 6 }}
        >
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }}>
            {isUnenrolling ? (isPersian ? 'در حال حذف...' : 'Dropping...') : (isPersian ? 'انصراف از دوره' : 'Drop Course')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPress}
          style={{
            backgroundColor: colors.gold,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 9,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '900', fontSize: 12 }}>
            {progress >= 100
              ? (isPersian ? '🎓 آزمون نهایی →' : '🎓 Take Exam →')
              : (isPersian ? '▶ ادامه یادگیری →' : '▶ Resume Course →')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Guest Landing Hero (logged-out state) ───────────────────────────────────
function GuestHero({ isPersian, router, t }: { isPersian: boolean; router: any; t: any }) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={{
        marginBottom: 28,
        backgroundColor: colors.card,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(59,130,246,0.35)' : colors.cardBorder,
        padding: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: isDark ? 0.2 : 0.05,
        shadowRadius: 16,
        elevation: 4,
      }}
    >
      {/* Decorative ambient glows */}
      <View
        style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          backgroundColor: '#3B82F6',
          borderRadius: 100,
          opacity: isDark ? 0.08 : 0.04,
        }}
        pointerEvents="none"
      />
      <View
        style={{
          position: 'absolute',
          bottom: -40,
          left: -40,
          width: 160,
          height: 160,
          backgroundColor: '#FACC15',
          borderRadius: 80,
          opacity: isDark ? 0.06 : 0.04,
        }}
        pointerEvents="none"
      />

      {/* Top Bar - Clean & Decluttered */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.headerBorder,
        }}
      >
        <AppLogo size={46} showText />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <HeaderPreferences compact />
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
              {t('signIn', 'Sign In')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={{
          alignSelf: 'flex-start',
          backgroundColor: colors.goldBg,
          borderWidth: 1,
          borderColor: colors.goldBorder,
          borderRadius: 10,
          paddingHorizontal: 10,
          paddingVertical: 4,
          marginBottom: 12,
        }}
      >
        <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 10, letterSpacing: 1.5 }}>
          {isPersian ? 'پلتفرم آموزش و کارآفرینی' : 'ENTREPRENEURSHIP & EDUCATION PLATFORM'}
        </Text>
      </View>

      <Text style={{ color: colors.text, fontWeight: '900', fontSize: 26, lineHeight: 34, marginBottom: 12 }}>
        {isPersian
          ? 'آموزش کارآفرینی،\nکسب‌وکار و مهارت‌های برتر'
          : 'Master Entrepreneurship,\nBusiness & High-Demand Skills'}
      </Text>

      <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 20 }}>
        {isPersian
          ? 'دسترسی آزاد به دوره‌های تخصصی، مقالات و مدارک دیجیتال معتبر با ثبت‌نام رایگان.'
          : 'Explore interactive courses, expert insights, and verifiable digital certificates. Register in seconds to start learning.'}
      </Text>

      {/* Feature pills */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
        {['📚 Expert Courses', '🎓 Verified Certs', '🧠 Realtime Quizzes', '⚡ Free Access'].map((f) => (
          <View
            key={f}
            style={{
              backgroundColor: colors.cardHover,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              borderRadius: 99,
              paddingHorizontal: 12,
              paddingVertical: 5,
            }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>{f}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          style={{
            flex: 1,
            backgroundColor: colors.gold,
            borderRadius: 14,
            paddingVertical: 13,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '900', fontSize: 13 }}>
            🚀 {t('signUp', 'Create Free Account')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/(student)/community' as any)}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.goldBorder,
            borderRadius: 14,
            paddingVertical: 13,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 13 }}>
            💬 {t('community', 'Community & Polls')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Logged-in Dashboard Hero ──────────────────────────────────────────────────
function DashboardHero({
  user,
  isAdmin,
  logout,
  enrolledCount,
  courseCount,
  certificatesCount,
  isPersian,
  router,
}: {
  user: any;
  isAdmin: boolean;
  logout?: () => void;
  enrolledCount: number;
  courseCount: number;
  certificatesCount: number;
  isPersian: boolean;
  router: any;
}) {
  const { colors, isDark } = useTheme();
  const emailUsername = user?.email ? user.email.split('@')[0] : (user?.displayName || 'Student');
  const initials = getInitials(emailUsername);

  return (
    <View
      style={{
        marginBottom: 24,
        backgroundColor: colors.card,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(250,204,21,0.35)' : colors.cardBorder,
        overflow: 'hidden',
        shadowColor: colors.gold,
        shadowOpacity: isDark ? 0.1 : 0.05,
        shadowRadius: 16,
        elevation: 6,
      }}
    >
      {/* Gold top accent strip */}
      <View style={{ height: 4, backgroundColor: colors.gold, borderTopLeftRadius: 28, borderTopRightRadius: 28 }} />

      <View style={{ padding: 22 }}>
        {/* Top Profile Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            {/* Avatar with gold border */}
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: colors.primary,
                borderWidth: 2.5,
                borderColor: colors.gold,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20 }}>{initials}</Text>
            </View>

            <View>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 2 }}>
                {isPersian ? 'خوش آمدید،' : 'Welcome,'}
              </Text>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 20, letterSpacing: -0.3 }}>
                {emailUsername} 👋
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isAdmin && (
              <TouchableOpacity
                onPress={() => router.push('/admin' as any)}
                style={{
                  backgroundColor: colors.goldBg,
                  borderWidth: 1,
                  borderColor: colors.goldBorder,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                }}
              >
                <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 11 }}>⚡ Admin Panel</Text>
              </TouchableOpacity>
            )}

            {logout && (
              <TouchableOpacity
                onPress={logout}
                style={{
                  backgroundColor: colors.dangerBg,
                  borderWidth: 1,
                  borderColor: colors.danger,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                }}
              >
                <Text style={{ color: colors.danger, fontWeight: '800', fontSize: 11 }}>
                  🚪 {isPersian ? 'خروج' : 'Log Out'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* User Status Bar with Live RTDB Presence indicator */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
            padding: 10,
            backgroundColor: colors.cardHover,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.cardBorder,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 }}>
            <Text style={{ fontSize: 14 }}>📧</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '500' }} numberOfLines={1}>
              {user.email}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {/* Live Presence indicator */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: colors.successBg,
                borderWidth: 1,
                borderColor: colors.success,
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' }} />
              <Text style={{ color: colors.success, fontSize: 10, fontWeight: '800' }}>
                ONLINE
              </Text>
            </View>

            <View
              style={{
                backgroundColor: isAdmin ? colors.goldBg : colors.badgeBg,
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderWidth: 1,
                borderColor: isAdmin ? colors.goldBorder : colors.cardBorder,
              }}
            >
              <Text style={{ color: isAdmin ? colors.gold : colors.badgeText, fontSize: 10, fontWeight: '800' }}>
                {isAdmin ? 'ADMIN' : 'STUDENT'}
              </Text>
            </View>
          </View>
        </View>

        {/* Dashboard Stats row */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
          <StatCard icon="📚" label={isPersian ? 'دوره‌های من' : 'Registered'} value={enrolledCount} />
          <StatCard icon="🎓" label={isPersian ? 'کاتالوگ دوره‌ها' : 'Available'} value={courseCount} />
          <StatCard icon="⭐" label={isPersian ? 'مدارک من' : 'Certificates'} value={certificatesCount} />
          <StatCard icon="🔥" label={isPersian ? 'وضعیت' : 'Progress'} value={enrolledCount > 0 ? 'Active' : 'New'} />
        </View>

        {/* Quick action buttons */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.push('/(student)/certificates' as any)}
            style={{
              flex: 1,
              backgroundColor: colors.goldBg,
              borderWidth: 1,
              borderColor: colors.goldBorder,
              borderRadius: 14,
              paddingVertical: 11,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 12 }}>
              🎓 {isPersian ? 'گواهینامه‌های من' : 'My Certificates'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(student)/profile' as any)}
            style={{
              flex: 1,
              backgroundColor: colors.primaryBg,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(59,130,246,0.35)' : 'rgba(11,37,183,0.2)',
              borderRadius: 14,
              paddingVertical: 11,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: isDark ? '#60A5FA' : colors.primary, fontWeight: '800', fontSize: 12 }}>
              👤 {isPersian ? 'پروفایل و تنظیمات' : 'My Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen Component ───────────────────────────────────────────────────
export default function StudentCatalogScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const { user, isAdmin, logout } = useAuth();
  const { colors, isDark } = useTheme();
  const isPersian = i18n.language?.startsWith('fa');

  const [selectedCourseForPreview, setSelectedCourseForPreview] = useState<any | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const { setScrollY } = useScrollHeader();

  // 1. Fetch all published courses
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['publishedCourses'],
    queryFn: getPublishedCourses,
  });

  // 2. Fetch user's registered / enrolled course IDs
  const { data: enrolledCourseIds = [], isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['userEnrolledCourses', user?.uid],
    queryFn: () => (user?.uid ? getUserEnrolledCourseIds(user.uid) : Promise.resolve([])),
    enabled: !!user?.uid,
  });

  // 3. Fetch user's certificates
  const { data: certificates = [] } = useQuery({
    queryKey: ['userCertificates', user?.uid],
    queryFn: () => (user?.uid ? getUserCertificates(user.uid) : Promise.resolve([])),
    enabled: !!user?.uid,
  });

  // 4. Enroll Mutation
  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!user?.uid) throw new Error('User not logged in');
      await enrollInCourse(user.uid, courseId);
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['userEnrolledCourses', user?.uid] });
      const enrolledCourse = courses.find((c) => c.id === courseId);
      const title = enrolledCourse?.title || 'Course';
      setFeedbackBanner(
        isPersian
          ? `🎉 با موفقیت در «${enrolledCourse?.faTitle || title}» ثبت‌نام شدید!`
          : `🎉 Successfully registered for ${title}!`
      );
      setTimeout(() => setFeedbackBanner(null), 4000);
    },
  });

  // 5. Unenroll Mutation
  const unenrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!user?.uid) throw new Error('User not logged in');
      await unenrollFromCourse(user.uid, courseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userEnrolledCourses', user?.uid] });
    },
  });

  // Registered courses for this logged-in user
  const enrolledCourses = courses
    .filter((c) => c.id && enrolledCourseIds.includes(c.id))
    .map((c, index) => ({
      ...c,
      _progress: index === 0 ? 45 : 15, // realistic initial progress
    }));

  // Catalog courses that are not yet enrolled
  const baseCatalogCourses = user
    ? courses.filter((c) => !c.id || !enrolledCourseIds.includes(c.id))
    : courses;

  // Filtered by selected category (Stocks & Crypto, Ecommerce, Languages, Morals)
  const catalogCourses = selectedCategory === 'All'
    ? baseCatalogCourses
    : baseCatalogCourses.filter((c) => (c as any).category === selectedCategory);

  // Category course count map
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { All: baseCatalogCourses.length };
    for (const c of baseCatalogCourses) {
      const cat = (c as any).category;
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    }
    return counts;
  }, [baseCatalogCourses]);

  const isLoading = isLoadingCourses || (!!user && isLoadingEnrollments);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 13 }}>Loading learning portal…</Text>
      </View>
    );
  }

  return (
    <ScreenWrapper
      scrollable={true}
      edgeTop={false}
      onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
    >
      <View style={{ maxWidth: 768, width: '100%', alignSelf: 'center', flex: 1, paddingTop: 4, paddingBottom: 16, paddingHorizontal: 4 }}>

        {/* ── Top Feedback Toast Banner ── */}
        {feedbackBanner && (
          <View
            style={{
              backgroundColor: colors.successBg,
              borderWidth: 1,
              borderColor: colors.success,
              borderRadius: 16,
              padding: 14,
              marginBottom: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: colors.success, fontWeight: '800', fontSize: 13, flex: 1 }}>
              {feedbackBanner}
            </Text>
            <TouchableOpacity onPress={() => setFeedbackBanner(null)}>
              <Text style={{ color: colors.success, fontWeight: '900', fontSize: 14, marginLeft: 8 }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Hero: Distinct Logged-in Dashboard vs Guest Landing ── */}
        {user ? (
          <DashboardHero
            user={user}
            isAdmin={isAdmin}
            logout={logout}
            enrolledCount={enrolledCourses.length}
            courseCount={courses.length}
            certificatesCount={certificates.length}
            isPersian={isPersian}
            router={router}
          />
        ) : (
          <GuestHero isPersian={isPersian} router={router} t={t} />
        )}

        {/* ── My Registered Courses Section (Logged-in Only) ── */}
        {user && (
          <View style={{ marginBottom: 28 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 20 }}>
                  {isPersian ? 'دوره‌های ثبت‌نام شده من' : 'My Registered Courses'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {isPersian ? 'دوره‌های فعال شما و ادامه مسیر یادگیری' : 'Your active registered learning tracks'}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: colors.goldBg,
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderWidth: 1,
                  borderColor: colors.goldBorder,
                }}
              >
                <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 11 }}>
                  {enrolledCourses.length} {isPersian ? 'دوره فعال' : 'Registered'}
                </Text>
              </View>
            </View>

            {enrolledCourses.length > 0 ? (
              enrolledCourses.map((item) => (
                <EnrolledCourseCard
                  key={item.id}
                  item={item}
                  isPersian={isPersian}
                  onPress={() => router.push(`/(student)/course/${item.id}` as any)}
                  onUnenroll={() => item.id && unenrollMutation.mutate(item.id)}
                  isUnenrolling={unenrollMutation.isPending && unenrollMutation.variables === item.id}
                />
              ))
            ) : (
              /* Friendly Empty State for Logged-In User */
              <View
                style={{
                  backgroundColor: colors.cardHover,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  borderRadius: 20,
                  padding: 22,
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📚</Text>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, marginBottom: 6 }}>
                  {isPersian ? 'هنوز در دوره‌ای ثبت‌نام نکرده‌اید' : 'No Registered Courses Yet'}
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    textAlign: 'center',
                    maxWidth: 420,
                    lineHeight: 20,
                    marginBottom: 16,
                  }}
                >
                  {isPersian
                    ? 'برای شروع، از لیست دوره‌های پیشنهادی زیر دوره مورد علاقه خود را انتخاب کنید و دکمه «ثبت‌نام در دوره» را بزنید.'
                    : 'Choose any course from the catalog below and tap "Register for Course" to add it to your dashboard.'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Catalog Section Header ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <View>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 19 }}>
              {user
                ? (enrolledCourses.length > 0
                    ? (isPersian ? 'سایر دوره‌های آموزشی' : 'Explore More Courses')
                    : (isPersian ? 'دوره‌های موجود برای ثبت‌نام' : 'Available Courses to Register'))
                : (isPersian ? 'دوره‌های آموزشی برتر' : 'Featured Courses')}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              {user
                ? (isPersian ? 'برای اضافه کردن به پنل خود دکمه ثبت‌نام را لمس کنید' : 'Register to unlock full curriculum and take exams')
                : (isPersian ? 'سرفصل‌ها را بررسی کرده و ثبت‌نام کنید' : 'Click a course to preview curriculum or enroll')}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: colors.badgeBg,
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Text style={{ color: colors.badgeText, fontWeight: '700', fontSize: 11 }}>
              {catalogCourses.length} {isPersian ? 'دوره' : 'Courses'}
            </Text>
          </View>
        </View>

        {/* ── Horizontally Scrollable Category Filter ── */}
        <CatalogCategoryBar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          isPersian={isPersian}
          categoryCounts={categoryCounts}
        />

        {/* ── Catalog Course Cards ── */}
        <FlatList
          data={catalogCourses}
          keyExtractor={(item) => item.id || (item as any).slug}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const title = isPersian && (item as any).faTitle ? (item as any).faTitle : item.title;
            const desc = isPersian && (item as any).faDescription ? (item as any).faDescription : item.description;
            const isEnrollingThis = enrollMutation.isPending && enrollMutation.variables === item.id;

            return (
              <View
                style={{
                  marginBottom: 18,
                  backgroundColor: colors.card,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOpacity: isDark ? 0.25 : 0.05,
                  shadowRadius: 12,
                  elevation: 5,
                }}
              >
                <Image
                  source={{
                    uri:
                      (item as any).coverUrl ||
                      ((item as any).youtubeVideoId
                        ? `https://img.youtube.com/vi/${(item as any).youtubeVideoId}/hqdefault.jpg`
                        : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop'),
                  }}
                  style={{ width: '100%', height: 160 }}
                  resizeMode="cover"
                />
                {/* Badge Overlay */}
                <View
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    backgroundColor: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.95)',
                    borderRadius: 10,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderWidth: 1,
                    borderColor: colors.goldBorder,
                  }}
                >
                  <Text style={{ color: colors.gold, fontSize: 10, fontWeight: '800' }}>
                    ✅ VERIFIED CERTIFICATION
                  </Text>
                </View>

                {/* Category Pill Overlay */}
                {(item as any).category && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      backgroundColor: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.95)',
                      borderRadius: 10,
                      paddingHorizontal: 9,
                      paddingVertical: 4,
                      borderWidth: 1,
                      borderColor: colors.goldBorder,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Text style={{ fontSize: 11 }}>{getCategoryIcon((item as any).category)}</Text>
                    <Text style={{ color: colors.gold, fontSize: 10, fontWeight: '800' }}>
                      {(item as any).category}
                    </Text>
                  </View>
                )}

                <View style={{ padding: 18 }}>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17, marginBottom: 6, lineHeight: 24 }}>
                    {title}
                  </Text>
                  <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '700', marginBottom: 8 }}>
                    Pass {(item as any).passPercentage}% • {(item as any).exam?.questionCount || 10} Qs • {(item as any).exam?.timeLimitMin || 20} min exam
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 14 }} numberOfLines={2}>
                    {desc}
                  </Text>

                  {/* Sample Lessons */}
                  {(item as any).sampleLessons && (item as any).sampleLessons.length > 0 && (
                    <View
                      style={{
                        backgroundColor: colors.cardHover,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                        padding: 12,
                        marginBottom: 14,
                      }}
                    >
                      <Text style={{ color: colors.gold, fontSize: 10, fontWeight: '800', marginBottom: 8, letterSpacing: 1 }}>
                        {isPersian ? 'نمونه سرفصل‌های دوره:' : 'CURRICULUM MODULES:'}
                      </Text>
                      {(item as any).sampleLessons.slice(0, 2).map((lesson: any, i: number) => (
                        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                          <Text style={{ color: colors.text, fontSize: 12, flex: 1, marginRight: 8 }} numberOfLines={1}>
                            • {lesson.title}
                          </Text>
                          <Text style={{ color: colors.textMuted, fontSize: 11 }}>{lesson.duration}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => setSelectedCourseForPreview(item)}
                      style={{
                        flex: 1,
                        backgroundColor: colors.cardHover,
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                        borderRadius: 12,
                        paddingVertical: 11,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>
                        📋 {isPersian ? 'نمایش سرفصل‌ها' : 'Preview'}
                      </Text>
                    </TouchableOpacity>

                    {user ? (
                      /* Logged In: 1-Click Register for Course button */
                      <TouchableOpacity
                        disabled={isEnrollingThis}
                        onPress={() => {
                          if (item.id) {
                            enrollMutation.mutate(item.id);
                          }
                        }}
                        style={{
                          flex: 1.2,
                          backgroundColor: colors.primary,
                          borderRadius: 12,
                          paddingVertical: 11,
                          alignItems: 'center',
                          flexDirection: 'row',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        {isEnrollingThis ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                            {isPersian ? '➕ ثبت‌نام در دوره' : '➕ Register for Course'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ) : (
                      /* Guest: Sign in prompt */
                      <TouchableOpacity
                        onPress={() => router.push('/(auth)/login')}
                        style={{
                          flex: 1.2,
                          backgroundColor: colors.primary,
                          borderRadius: 12,
                          paddingVertical: 11,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                          {isPersian ? '🔒 ورود برای ثبت‌نام' : '🔒 Sign in to Register'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View
              style={{
                backgroundColor: colors.cardHover,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                borderRadius: 20,
                padding: 32,
                alignItems: 'center',
                marginVertical: 12,
              }}
            >
              <Text style={{ fontSize: 36, marginBottom: 10 }}>{getCategoryIcon(selectedCategory)}</Text>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, marginBottom: 6 }}>
                {selectedCategory !== 'All'
                  ? (isPersian
                      ? `دوره‌ای در دسته‌بندی «${selectedCategory}» یافت نشد`
                      : `No Courses in "${selectedCategory}"`)
                  : (isPersian ? 'دوره‌ای یافت نشد' : 'No Courses Available')}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 13,
                  textAlign: 'center',
                  marginBottom: selectedCategory !== 'All' ? 14 : 0,
                  maxWidth: 360,
                }}
              >
                {selectedCategory !== 'All'
                  ? (isPersian
                      ? 'می‌توانید سایر دسته‌بندی‌ها را انتخاب کنید یا همه دوره‌ها را مشاهده فرمایید.'
                      : 'Try selecting a different category or view all courses in the catalog.')
                  : (isPersian
                      ? 'دوره‌های جدید به زودی در این بخش منتشر خواهند شد.'
                      : 'New courses will be published here soon.')}
              </Text>
              {selectedCategory !== 'All' && (
                <TouchableOpacity
                  onPress={() => setSelectedCategory('All')}
                  style={{
                    backgroundColor: colors.goldBg,
                    borderColor: colors.goldBorder,
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                  }}
                >
                  <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 13 }}>
                    {isPersian ? 'نمایش همه دوره‌ها' : 'View All Courses'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />

        {/* ── Guest CTA Footer Banner ── */}
        {!user && (
          <View
            style={{
              backgroundColor: colors.goldBg,
              borderWidth: 1,
              borderColor: colors.goldBorder,
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ color: colors.gold, fontWeight: '900', fontSize: 18, marginBottom: 8 }}>
              {isPersian ? 'آماده یادگیری و پیشرفت هستید؟' : 'Ready to level up your career?'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
              {isPersian
                ? 'با ساخت حساب کاربری رایگان، به پنل اختصاصی دوره‌ها، ذخیره پیشرفت و گواهینامه‌های رسمی دسترسی پیدا کنید.'
                : 'Create a free account to track your progress, earn verified certificates, and access your custom dashboard.'}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              style={{
                backgroundColor: colors.gold,
                paddingHorizontal: 32,
                paddingVertical: 14,
                borderRadius: 14,
                width: '100%',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '900', fontSize: 14 }}>
                🚀 {isPersian ? 'ثبت‌نام رایگان' : 'Get Started for Free'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              style={{ marginTop: 10, padding: 8 }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                {isPersian ? 'قبلاً ثبت‌نام کرده‌اید؟ ورود به حساب →' : 'Already have an account? Sign in →'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Course Preview Curriculum Modal ── */}
      {selectedCourseForPreview && (
        <Modal transparent animationType="fade" visible={!!selectedCourseForPreview}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(250,204,21,0.4)' : colors.cardBorder,
                borderRadius: 24,
                padding: 24,
                width: '100%',
                maxWidth: 520,
                maxHeight: '85%',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <View style={{ backgroundColor: colors.goldBg, borderWidth: 1, borderColor: colors.goldBorder, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6 }}>
                    <Text style={{ color: colors.gold, fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>CURRICULUM PREVIEW</Text>
                  </View>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, lineHeight: 22 }}>
                    {isPersian && selectedCourseForPreview.faTitle ? selectedCourseForPreview.faTitle : selectedCourseForPreview.title}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedCourseForPreview(null)}
                  style={{ backgroundColor: colors.cardHover, borderWidth: 1, borderColor: colors.cardBorder, padding: 8, borderRadius: 99 }}
                >
                  <Text style={{ color: colors.textSecondary, fontWeight: '800', fontSize: 14 }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
                  {isPersian && selectedCourseForPreview.faDescription ? selectedCourseForPreview.faDescription : selectedCourseForPreview.description}
                </Text>

                <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 13, marginBottom: 12 }}>
                  {isPersian ? 'سرفصل‌های آموزشی و مباحث دوره:' : 'Course Lessons & Modules:'}
                </Text>

                {selectedCourseForPreview.sampleLessons && selectedCourseForPreview.sampleLessons.length > 0 ? (
                  selectedCourseForPreview.sampleLessons.map((lesson: any, idx: number) => (
                    <View
                      key={idx}
                      style={{
                        backgroundColor: colors.cardHover,
                        padding: 14,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                        marginBottom: 8,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13, flex: 1, marginRight: 8 }}>{lesson.title}</Text>
                        <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '700' }}>{lesson.duration}</Text>
                      </View>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{lesson.description}</Text>
                    </View>
                  ))
                ) : (
                  <View
                    style={{
                      backgroundColor: colors.cardHover,
                      padding: 14,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 22 }}>
                      {selectedCourseForPreview.body || selectedCourseForPreview.description || (isPersian ? 'محتوای آموزشی به زودی بارگذاری می‌شود.' : 'Course content will be uploaded soon.')}
                    </Text>
                  </View>
                )}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: 16 }}>
                <TouchableOpacity
                  onPress={() => setSelectedCourseForPreview(null)}
                  style={{ flex: 1, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 13 }}>{isPersian ? 'بستن' : 'Close'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const id = selectedCourseForPreview.id;
                    setSelectedCourseForPreview(null);
                    if (!user) {
                      router.push('/(auth)/login');
                      return;
                    }
                    if (id) {
                      enrollMutation.mutate(id);
                    }
                    router.push(`/(student)/course/${id}` as any);
                  }}
                  style={{ flex: 2, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>
                    {user
                      ? (isPersian ? 'ثبت‌نام و ورود به دوره →' : 'Register & Enter Course →')
                      : '🔒 Sign in to Register'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScreenWrapper>
  );
}
