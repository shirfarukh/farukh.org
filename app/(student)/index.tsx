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
  Linking,
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
  getCourseModuleExams,
} from '../../src/features/student/studentApi';
import { getCourseModules } from '../../src/features/admin/adminApi';
import { getUserCertificates } from '../../src/features/certificates/certificatesApi';
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
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.82)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(250,204,21,0.25)' : 'rgba(226, 232, 240, 0.85)',
        padding: 18,
        shadowColor: colors.gold,
        shadowOpacity: isDark ? 0.12 : 0.05,
        shadowRadius: 16,
        elevation: 5,
        ...(Platform.OS === 'web'
          ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }
          : {}) as any,
      }}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <Image
            source={{ uri: item.coverUrl }}
            style={{ width: 100, height: 80, borderRadius: 16, backgroundColor: colors.bg, aspectRatio: 5 / 4 }}
            resizeMode="cover"
          />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  backgroundColor: colors.goldBg,
                  borderRadius: 99,
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
                    borderRadius: 99,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    flexDirection: isPersian ? 'row-reverse' : 'row',
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
        borderRadius: 24,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(59,130,246,0.25)' : colors.cardBorder,
        padding: 26,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: isDark ? 0.2 : 0.04,
        shadowRadius: 16,
        elevation: 3,
      }}
    >
      {/* Top Bar - Clean & Minimalist (No logo, just preferences & Sign In) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginBottom: 22,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.headerBorder,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <HeaderPreferences compact />
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>
              {t('signIn', 'Sign In')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Slogan Badge */}
      <View
        style={{
          alignSelf: 'flex-start',
          backgroundColor: colors.goldBg,
          borderWidth: 1,
          borderColor: colors.goldBorder,
          borderRadius: 99,
          paddingHorizontal: 14,
          paddingVertical: 5,
          marginBottom: 14,
        }}
      >
        <Text
          style={{
            color: colors.gold,
            fontWeight: '900',
            fontSize: 12,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}
        >
          {isPersian ? '✨ رایگان و معتبر' : '✨ Free and Valid'}
        </Text>
      </View>

      {/* Slogan & Core Pillars Headline */}
      <Text
        style={{
          color: colors.text,
          fontWeight: '900',
          fontSize: 28,
          lineHeight: 38,
          marginBottom: 16,
        }}
      >
        {isPersian
          ? 'کارآفرینی، زبان‌ها، هوش مصنوعی و اخلاق'
          : 'Entrepreneurship, Languages, AI and Moral'}
      </Text>

      {/* Pillars Pills */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {[
          { label: isPersian ? 'کارآفرینی' : 'Entrepreneurship', icon: '💼' },
          { label: isPersian ? 'زبان‌ها' : 'Languages', icon: '🌍' },
          { label: isPersian ? 'هوش مصنوعی' : 'AI', icon: '🤖' },
          { label: isPersian ? 'اخلاق' : 'Moral', icon: '⚖️' },
        ].map((item) => (
          <View
            key={item.label}
            style={{
              backgroundColor: colors.cardHover,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 12 }}>{item.icon}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
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
            🚀 {t('signUp', 'Sign Up')}
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
            💬 {t('community', 'Community')}
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

// ─── Default Language and Afghanistan School Grades Tracks ─────────────────────
const DEFAULT_LANGUAGE_COURSE: any = {
  id: 'lang-english-pro',
  title: 'Practical English for Careers & Tech',
  faTitle: 'انگلیسی کاربردی برای کار و فناوری',
  slug: 'lang-english-pro',
  category: 'Languages',
  description: 'Master practical speaking, technical vocabulary, resume building, and job interview fluency.',
  faDescription: 'مکالمه روان، واژگان فنی، ایمیل‌نگاری تجاری و آمادگی مصاحبه‌های استخدامی بین‌المللی.',
  coverUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&auto=format&fit=crop',
  passPercentage: 80,
  exam: { questionCount: 10, timeLimitMin: 25, maxAttempts: 3, cooldownHours: 24 },
  lessonCount: 8,
  status: 'published',
  ownerName: 'Faculty of Modern Languages',
  instructorBio: 'Certified language educator focused on practical spoken fluency and corporate communication.',
  sampleLessons: [
    { title: '1. Technical Vocabulary & Daily Conversations', duration: '20m', description: 'Essential phrases for modern workplace collaboration.' },
    { title: '2. Professional Email & Proposal Writing', duration: '25m', description: 'Crafting clear, confident business communications.' },
  ],
};

const SCHOOL_CLASSES_TRACKS = [
  {
    grade: 7,
    en: 'Grade 7: Secondary Core',
    fa: 'صنف هفتم (دوره متوسطه اول)',
    subjectsEn: 'Algebra, Biology, World Geography, History, Dari, Pashto, English',
    subjectsFa: 'الجبر، بیولوژی، جغرافیای جهان، تاریخ، ادبیات، پشتو، انگلیسی',
  },
  {
    grade: 8,
    en: 'Grade 8: Sciences & Math',
    fa: 'صنف هشتم (علوم پایه و ریاضیات)',
    subjectsEn: 'Geometry, Physics Basics, Chemistry, Biology, Dari, English',
    subjectsFa: 'هندسه، فیزیک مقدماتی، کیمیا، بیولوژی گیاهی، ادبیات، انگلیسی',
  },
  {
    grade: 9,
    en: 'Grade 9: Middle School Graduation',
    fa: 'صنف نهم (فراغت مقطع متوسطه)',
    subjectsEn: 'Advanced Algebra, Newtonian Mechanics, Chemical Bonds, Anatomy, Literature',
    subjectsFa: 'الجبر پیشرفته، مکانیک نیوتنی، پیوندهای کیمیاوی، آناتومی انسان، ادبیات',
  },
  {
    grade: 10,
    en: 'Grade 10: Senior High School (Lycee)',
    fa: 'صنف دهم (دوره عالی و لیسه)',
    subjectsEn: 'Trigonometry, Vector Physics, Inorganic Chemistry, Cell Biology, CS Basics',
    subjectsFa: 'مثلثات، فیزیک برداری، کیمیای غیرعضوی، بیولوژی سلولی، مبانی کامپیوتر',
  },
  {
    grade: 11,
    en: 'Grade 11: Pre-Diploma Track',
    fa: 'صنف یازدهم (پیش‌دانشگاهی و علوم تخصصی)',
    subjectsEn: 'Pre-Calculus, Electromagnetism, Organic Chemistry, Genetics, Dari, English',
    subjectsFa: 'حسابان و حد، الکترومقناطیس، کیمیای عضوی (کاربن)، ژنتیک، ادبیات',
  },
  {
    grade: 12,
    en: 'Grade 12: High School Diploma & Kankor',
    fa: 'صنف دوازدهم (دیپلوم بکلوریا و آمادگی کانکور)',
    subjectsEn: 'Calculus, Nuclear & Atomic Physics, Chemistry Review, Biology, Kankor Prep',
    subjectsFa: 'دیفرانسیل و انتگرال، فیزیک اتومی و هسته‌ای، کیمیای جامع، آمادگی کانکور',
  },
];

const BUILTIN_COURSES: any[] = [DEFAULT_LANGUAGE_COURSE];

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
  const [activeCatalogSection, setActiveCatalogSection] = useState<'all' | 'professional' | 'languages' | 'school_classes'>('all');
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

  // Fetch real module-based progress for enrolled courses
  const { data: coursesProgressMap = {} } = useQuery({
    queryKey: ['allCoursesProgress', user?.uid, enrolledCourseIds, certificates.length],
    queryFn: async () => {
      if (!user?.uid || enrolledCourseIds.length === 0) return {};
      const map: Record<string, number> = {};
      await Promise.all(
        enrolledCourseIds.map(async (cid) => {
          try {
            // Check if certificate exists (100% complete)
            const hasCert = certificates.some((crt) => crt.courseId === cid);
            if (hasCert) {
              map[cid] = 100;
              return;
            }
            // Check module exams
            const modExams = await getCourseModuleExams(user.uid, cid);
            const mods = await getCourseModules(cid);
            if (mods.length > 0) {
              const finished = mods.filter((m) => modExams[m.id!]?.finished === true || modExams[m.id!]?.passed === true).length;
              map[cid] = Math.min(100, Math.round((finished / mods.length) * 100));
            } else {
              map[cid] = 0;
            }
          } catch {
            map[cid] = 0;
          }
        })
      );
      return map;
    },
    enabled: !!user?.uid && enrolledCourseIds.length > 0,
  });

  // Language Course detector
  const isLanguageCourse = (c: any) => {
    if (!c) return false;
    const cat = (c.category || '').toLowerCase();
    const title = (c.title || '').toLowerCase();
    const faTitle = (c.faTitle || '').toLowerCase();
    return (
      cat === 'languages' ||
      cat.includes('lang') ||
      title.includes('english') ||
      title.includes('language') ||
      faTitle.includes('انگلیسی') ||
      faTitle.includes('زبان')
    );
  };

  // School Grade Course detector
  const isSchoolGradeCourse = (c: any) => {
    if (!c) return false;
    const cat = (c.category || '').toLowerCase();
    const title = (c.title || '').toLowerCase();
    const faTitle = (c.faTitle || '').toLowerCase();
    return (
      cat === 'school grades' ||
      cat.includes('school') ||
      cat.includes('grade') ||
      title.includes('grade') ||
      title.includes('school') ||
      faTitle.includes('صنف') ||
      faTitle.includes('مکتب')
    );
  };

  // Professional Training Course: All courses except Languages and School Grades
  const isProfessionalCourse = (c: any) => {
    return !isLanguageCourse(c) && !isSchoolGradeCourse(c);
  };

  // Merge Firestore courses with built-in Language courses (excluding any school grade tracks)
  const allAvailableCourses = React.useMemo(() => {
    const list = [...courses];
    for (const b of BUILTIN_COURSES) {
      if (!list.some((c) => c.id === b.id || (c as any).slug === b.slug)) {
        list.push(b as any);
      }
    }
    return list.filter((c) => !isSchoolGradeCourse(c));
  }, [courses]);

  // Registered courses for this logged-in user with real module progress
  const enrolledCourses = allAvailableCourses
    .filter((c) => c.id && enrolledCourseIds.includes(c.id))
    .map((c) => ({
      ...c,
      _progress: certificates.some((crt) => crt.courseId === c.id)
        ? 100
        : coursesProgressMap[c.id!] ?? 0,
    }));

  const professionalCourses = allAvailableCourses.filter(isProfessionalCourse);
  const languageCourses = allAvailableCourses.filter(isLanguageCourse);

  // Sub-filtering for Professional Training
  const filteredProfessionalCourses = selectedCategory === 'All'
    ? professionalCourses
    : professionalCourses.filter((c) => (c as any).category === selectedCategory);

  // Category counts for Professional subcategory bar
  const professionalCategoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { All: professionalCourses.length };
    for (const c of professionalCourses) {
      const cat = (c as any).category;
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    }
    return counts;
  }, [professionalCourses]);

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

        {/* ── Reusable Course Card Renderer ── */}
        {(() => {
          return null;
        })()}



        {/* ── Catalog Master Section ── */}
        <View style={{ marginBottom: 16 }}>
          <View
            style={{
              flexDirection: isPersian ? 'row-reverse' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <View>
              <Text
                style={{
                  color: colors.text,
                  fontWeight: '900',
                  fontSize: 20,
                  textAlign: isPersian ? 'right' : 'left',
                }}
              >
                {isPersian ? 'کاتالوگ دوره‌های آموزشی' : 'Course Catalog'}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  marginTop: 2,
                  textAlign: isPersian ? 'right' : 'left',
                }}
              >
                {isPersian
                  ? 'آموزش‌های تخصصی، فناوری، کسب‌وکار و زبان‌ها'
                  : 'Professional training, technology, business, and language courses'}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: isDark ? 'rgba(250, 204, 21, 0.12)' : 'rgba(250, 204, 21, 0.18)',
                borderWidth: 1,
                borderColor: colors.goldBorder,
                borderRadius: 99,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 11 }}>
                {allAvailableCourses.length} {isPersian ? 'دوره آموزشی' : 'Courses'}
              </Text>
            </View>
          </View>

          {/* ── Course Catalog Segmented Tab Bar ── */}
          <View
            style={{
              flexDirection: isPersian ? 'row-reverse' : 'row',
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(241, 245, 249, 0.85)',
              borderRadius: 18,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.9)',
              padding: 4,
              marginBottom: 16,
              gap: 4,
              ...(Platform.OS === 'web'
                ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }
                : {}) as any,
            }}
          >
            {[
              { id: 'all', en: 'All Courses', fa: 'همه دوره‌ها' },
              { id: 'professional', en: 'Professional Training', fa: 'آموزش‌های تخصصی' },
              { id: 'languages', en: 'Languages', fa: 'آموزش زبان‌ها' },
              { id: 'school_classes', en: 'School Classes (7-12)', fa: 'صنوف مکتب (۷-۱۲)' },
            ].map((tab) => {
              const isActive = activeCatalogSection === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveCatalogSection(tab.id as any)}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 6,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isActive
                      ? (isDark ? 'rgba(250, 204, 21, 0.18)' : '#FFFFFF')
                      : 'transparent',
                    borderWidth: isActive ? 1 : 0,
                    borderColor: isActive ? colors.goldBorder : 'transparent',
                    shadowColor: isActive ? '#000' : 'transparent',
                    shadowOpacity: isActive ? 0.06 : 0,
                    shadowRadius: 4,
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? (isDark ? colors.gold : '#0F172A') : colors.textSecondary,
                      fontWeight: isActive ? '800' : '600',
                      fontSize: 11.5,
                      textAlign: 'center',
                    }}
                    numberOfLines={1}
                  >
                    {isPersian ? tab.fa : tab.en}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── SECTION 1: PROFESSIONAL TRAINING ── */}
        {(activeCatalogSection === 'all' || activeCatalogSection === 'professional') && (
          <View style={{ marginBottom: 32 }}>
            <View
              style={{
                flexDirection: isPersian ? 'row-reverse' : 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
                paddingBottom: 8,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.cardBorder,
              }}
            >
              <View>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18, textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian ? 'آموزش‌های تخصصی و حرفه‌ای' : 'Professional Training'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2, textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian
                    ? 'مهارت‌های تخصصی بازار کار، برنامه‌نویسی، هوش مصنوعی و کسب‌وکار'
                    : 'Industry tracks in software engineering, AI, and digital business'}
                </Text>
              </View>
              <View style={{ backgroundColor: colors.cardHover, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.cardBorder }}>
                <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 11 }}>
                  {filteredProfessionalCourses.length} {isPersian ? 'دوره' : 'Tracks'}
                </Text>
              </View>
            </View>

            {/* Sub-filter if focused on Professional */}
            {activeCatalogSection === 'professional' && (
              <View style={{ marginBottom: 14 }}>
                <CatalogCategoryBar
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  isPersian={isPersian}
                  categoryCounts={professionalCategoryCounts}
                />
              </View>
            )}

            {filteredProfessionalCourses.length > 0 ? (
              filteredProfessionalCourses.map((item) => {
                const title = isPersian && item.faTitle ? item.faTitle : item.title;
                const desc = isPersian && item.faDescription ? item.faDescription : item.description;
                const isEnrollingThis = enrollMutation.isPending && enrollMutation.variables === item.id;
                const isEnrolled = !!(item.id && enrolledCourseIds.includes(item.id));

                return (
                  <View
                    key={item.id || item.slug}
                    style={{
                      marginBottom: 20,
                      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.48)' : 'rgba(255, 255, 255, 0.82)',
                      borderRadius: 26,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(250, 204, 21, 0.22)' : 'rgba(226, 232, 240, 0.85)',
                      overflow: 'hidden',
                      shadowColor: '#000',
                      shadowOpacity: isDark ? 0.25 : 0.06,
                      shadowOffset: { width: 0, height: 6 },
                      shadowRadius: 18,
                      elevation: 5,
                      ...(Platform.OS === 'web'
                        ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }
                        : {}) as any,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: isPersian ? 'row-reverse' : 'row',
                        padding: 12,
                        gap: 12,
                        height: 195,
                      }}
                    >
                      <View
                        style={{
                          flex: 1,
                          borderRadius: 18,
                          overflow: 'hidden',
                          position: 'relative',
                          backgroundColor: colors.bg,
                          borderWidth: 1,
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        }}
                      >
                        <Image
                          source={{
                            uri:
                              item.coverUrl ||
                              (item.youtubeVideoId
                                ? `https://img.youtube.com/vi/${item.youtubeVideoId}/hqdefault.jpg`
                                : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop'),
                          }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                        <View
                          style={{
                            position: 'absolute',
                            top: 8,
                            left: isPersian ? undefined : 8,
                            right: isPersian ? 8 : undefined,
                            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.85)',
                            borderRadius: 99,
                            paddingHorizontal: 8,
                            paddingVertical: 3.5,
                            borderWidth: 1,
                            borderColor: 'rgba(250, 204, 21, 0.4)',
                            ...(Platform.OS === 'web'
                              ? { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }
                              : {}) as any,
                          }}
                        >
                          <Text style={{ color: colors.gold, fontSize: 8.5, fontWeight: '800', letterSpacing: 0.5 }}>
                            CERTIFIED
                          </Text>
                        </View>
                        {item.category && (
                          <View
                            style={{
                              position: 'absolute',
                              bottom: 8,
                              left: isPersian ? undefined : 8,
                              right: isPersian ? 8 : undefined,
                              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.85)',
                              borderRadius: 99,
                              paddingHorizontal: 8,
                              paddingVertical: 3.5,
                              borderWidth: 1,
                              borderColor: 'rgba(250, 204, 21, 0.35)',
                              ...(Platform.OS === 'web'
                                ? { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }
                                : {}) as any,
                            }}
                          >
                            <Text style={{ color: colors.gold, fontSize: 8.5, fontWeight: '800' }}>
                              {item.category}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View
                        style={{
                          flex: 1,
                          borderRadius: 18,
                          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(248, 250, 252, 0.75)',
                          borderWidth: 1,
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.85)',
                          padding: 12,
                          justifyContent: 'space-between',
                          ...(Platform.OS === 'web'
                            ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }
                            : {}) as any,
                        }}
                      >
                        <View>
                          <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <View
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: isDark ? 'rgba(250, 204, 21, 0.15)' : 'rgba(250, 204, 21, 0.2)',
                                borderWidth: 1,
                                borderColor: colors.goldBorder,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '800' }}>
                                {(item.ownerName || 'F').charAt(0)}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: colors.gold, fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, textAlign: isPersian ? 'right' : 'left' }}>
                                {isPersian ? 'مدرس دوره' : 'INSTRUCTOR'}
                              </Text>
                              <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800', textAlign: isPersian ? 'right' : 'left' }} numberOfLines={1}>
                                {item.ownerName || (isPersian ? 'استاد فرخ' : 'Farukh Faculty')}
                              </Text>
                            </View>
                          </View>
                          <Text style={{ color: colors.textSecondary, fontSize: 10, lineHeight: 15, fontStyle: 'italic', textAlign: isPersian ? 'right' : 'left' }} numberOfLines={4}>
                            "{item.instructorBio || item.ownerBio || (isPersian
                              ? 'مدرس ارشد با تمرکز بر انتقال مهارت‌های عملی و هدایت پروژه‌های کاربردی.'
                              : 'Faculty mentor focused on practical skills and guided student execution.')}"
                          </Text>
                        </View>
                        <View
                          style={{
                            alignSelf: isPersian ? 'flex-end' : 'flex-start',
                            backgroundColor: isDark ? 'rgba(250, 204, 21, 0.1)' : 'rgba(250, 204, 21, 0.15)',
                            borderWidth: 1,
                            borderColor: colors.goldBorder,
                            borderRadius: 99,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                          }}
                        >
                          <Text style={{ color: colors.gold, fontSize: 8.5, fontWeight: '800' }}>
                            {isPersian ? 'استاد تأیید شده' : 'Verified Faculty'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 }}>
                      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17, marginBottom: 6, lineHeight: 24, textAlign: isPersian ? 'right' : 'left' }}>
                        {title}
                      </Text>
                      <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                        <View style={{ backgroundColor: isDark ? 'rgba(250, 204, 21, 0.08)' : 'rgba(250, 204, 21, 0.12)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.goldBorder }}>
                          <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '700' }}>
                            Pass {item.passPercentage || 80}% • {item.exam?.questionCount || 10} Qs • {item.exam?.timeLimitMin || 20}m exam
                          </Text>
                        </View>
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 14, textAlign: isPersian ? 'right' : 'left' }} numberOfLines={2}>
                        {desc}
                      </Text>

                      {item.sampleLessons && item.sampleLessons.length > 0 && (
                        <View style={{ backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(241, 245, 249, 0.65)', borderRadius: 16, borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(226, 232, 240, 0.8)', padding: 12, marginBottom: 14 }}>
                          <Text style={{ color: colors.gold, fontSize: 10, fontWeight: '800', marginBottom: 8, letterSpacing: 0.8, textAlign: isPersian ? 'right' : 'left' }}>
                            {isPersian ? 'نمونه سرفصل‌های دوره:' : 'CURRICULUM MODULES:'}
                          </Text>
                          {item.sampleLessons.slice(0, 2).map((lesson: any, i: number) => (
                            <View key={i} style={{ flexDirection: isPersian ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                              <Text style={{ color: colors.text, fontSize: 12, flex: 1, marginHorizontal: 6, textAlign: isPersian ? 'right' : 'left' }} numberOfLines={1}>
                                • {lesson.title}
                              </Text>
                              <Text style={{ color: colors.textMuted, fontSize: 11 }}>{lesson.duration}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', gap: 10 }}>
                        <TouchableOpacity
                          onPress={() => setSelectedCourseForPreview(item)}
                          activeOpacity={0.8}
                          style={{
                            flex: 1,
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                            borderWidth: 1,
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                            borderRadius: 14,
                            paddingVertical: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>
                            {isPersian ? 'نمایش سرفصل‌ها' : 'Preview'}
                          </Text>
                        </TouchableOpacity>

                        {user ? (
                          isEnrolled ? (
                            <TouchableOpacity
                              onPress={() => router.push(`/(student)/course/${item.id}` as any)}
                              activeOpacity={0.85}
                              style={{ flex: 1.3, backgroundColor: colors.gold, borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                                {isPersian ? 'ادامه دوره' : 'Continue Course'}
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              disabled={isEnrollingThis}
                              onPress={() => item.id && enrollMutation.mutate(item.id)}
                              activeOpacity={0.85}
                              style={{ flex: 1.3, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
                            >
                              {isEnrollingThis ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                                  {isPersian ? 'ثبت‌نام در دوره' : 'Register for Course'}
                                </Text>
                              )}
                            </TouchableOpacity>
                          )
                        ) : (
                          <TouchableOpacity
                            onPress={() => router.push('/(auth)/login')}
                            activeOpacity={0.85}
                            style={{ flex: 1.3, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                              {isPersian ? 'ورود برای ثبت‌نام' : 'Sign in to Register'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={{ backgroundColor: colors.cardHover, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  {isPersian ? 'دوره‌ای در این دسته‌بندی یافت نشد.' : 'No courses found in this category.'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── SECTION 2: LANGUAGES ── */}
        {(activeCatalogSection === 'all' || activeCatalogSection === 'languages') && (
          <View style={{ marginBottom: 32 }}>
            <View
              style={{
                flexDirection: isPersian ? 'row-reverse' : 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
                paddingBottom: 8,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.cardBorder,
              }}
            >
              <View>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18, textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian ? 'آموزش زبان‌ها' : 'Languages'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2, textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian
                    ? 'مکالمه کاربردی، نگارش تجاری و اصطلاحات تخصصی'
                    : 'Practical conversation, technical fluency, and business communication'}
                </Text>
              </View>
              <View style={{ backgroundColor: colors.cardHover, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.cardBorder }}>
                <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 11 }}>
                  {languageCourses.length} {isPersian ? 'دوره' : 'Tracks'}
                </Text>
              </View>
            </View>

            {languageCourses.map((item) => {
              const title = isPersian && item.faTitle ? item.faTitle : item.title;
              const desc = isPersian && item.faDescription ? item.faDescription : item.description;
              const isEnrollingThis = enrollMutation.isPending && enrollMutation.variables === item.id;
              const isEnrolled = !!(item.id && enrolledCourseIds.includes(item.id));

              return (
                <View
                  key={item.id || item.slug}
                  style={{
                    marginBottom: 20,
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.48)' : 'rgba(255, 255, 255, 0.82)',
                    borderRadius: 26,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(250, 204, 21, 0.22)' : 'rgba(226, 232, 240, 0.85)',
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOpacity: isDark ? 0.25 : 0.06,
                    shadowOffset: { width: 0, height: 6 },
                    shadowRadius: 18,
                    elevation: 5,
                    ...(Platform.OS === 'web'
                      ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }
                      : {}) as any,
                  }}
                >
                  <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', padding: 12, gap: 12, height: 195 }}>
                    <View style={{ flex: 1, borderRadius: 18, overflow: 'hidden', position: 'relative', backgroundColor: colors.bg, borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }}>
                      <Image source={{ uri: item.coverUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      <View style={{ position: 'absolute', top: 8, left: isPersian ? undefined : 8, right: isPersian ? 8 : undefined, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.85)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3.5, borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.4)' }}>
                        <Text style={{ color: colors.gold, fontSize: 8.5, fontWeight: '800', letterSpacing: 0.5 }}>CERTIFIED</Text>
                      </View>
                      <View style={{ position: 'absolute', bottom: 8, left: isPersian ? undefined : 8, right: isPersian ? 8 : undefined, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.85)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3.5, borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.35)' }}>
                        <Text style={{ color: colors.gold, fontSize: 8.5, fontWeight: '800' }}>{item.category}</Text>
                      </View>
                    </View>

                    <View style={{ flex: 1, borderRadius: 18, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(248, 250, 252, 0.75)', borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.85)', padding: 12, justifyContent: 'space-between' }}>
                      <View>
                        <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(250, 204, 21, 0.15)' : 'rgba(250, 204, 21, 0.2)', borderWidth: 1, borderColor: colors.goldBorder, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '800' }}>{(item.ownerName || 'F').charAt(0)}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.gold, fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, textAlign: isPersian ? 'right' : 'left' }}>
                              {isPersian ? 'مدرس دوره' : 'INSTRUCTOR'}
                            </Text>
                            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800', textAlign: isPersian ? 'right' : 'left' }} numberOfLines={1}>
                              {item.ownerName || (isPersian ? 'دپارتمان زبان' : 'Language Faculty')}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ color: colors.textSecondary, fontSize: 10, lineHeight: 15, fontStyle: 'italic', textAlign: isPersian ? 'right' : 'left' }} numberOfLines={4}>
                          "{item.instructorBio || (isPersian ? 'آموزش تخصصی زبان کاربردی برای مکالمه، تجارت و ارتباطات بین‌المللی.' : 'Expert language educator focused on practical career communication.')}"
                        </Text>
                      </View>
                      <View style={{ alignSelf: isPersian ? 'flex-end' : 'flex-start', backgroundColor: isDark ? 'rgba(250, 204, 21, 0.1)' : 'rgba(250, 204, 21, 0.15)', borderWidth: 1, borderColor: colors.goldBorder, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: colors.gold, fontSize: 8.5, fontWeight: '800' }}>{isPersian ? 'استاد تأیید شده' : 'Verified Faculty'}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 }}>
                    <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17, marginBottom: 6, lineHeight: 24, textAlign: isPersian ? 'right' : 'left' }}>
                      {title}
                    </Text>
                    <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                      <View style={{ backgroundColor: isDark ? 'rgba(250, 204, 21, 0.08)' : 'rgba(250, 204, 21, 0.12)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.goldBorder }}>
                        <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '700' }}>
                          Pass {item.passPercentage || 80}% • {item.exam?.questionCount || 10} Qs • {item.exam?.timeLimitMin || 25}m exam
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 14, textAlign: isPersian ? 'right' : 'left' }} numberOfLines={2}>
                      {desc}
                    </Text>

                    {item.sampleLessons && item.sampleLessons.length > 0 && (
                      <View style={{ backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(241, 245, 249, 0.65)', borderRadius: 16, borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(226, 232, 240, 0.8)', padding: 12, marginBottom: 14 }}>
                        <Text style={{ color: colors.gold, fontSize: 10, fontWeight: '800', marginBottom: 8, letterSpacing: 0.8, textAlign: isPersian ? 'right' : 'left' }}>
                          {isPersian ? 'نمونه سرفصل‌های دوره:' : 'CURRICULUM MODULES:'}
                        </Text>
                        {item.sampleLessons.slice(0, 2).map((lesson: any, i: number) => (
                          <View key={i} style={{ flexDirection: isPersian ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                            <Text style={{ color: colors.text, fontSize: 12, flex: 1, marginHorizontal: 6, textAlign: isPersian ? 'right' : 'left' }} numberOfLines={1}>
                              • {lesson.title}
                            </Text>
                            <Text style={{ color: colors.textMuted, fontSize: 11 }}>{lesson.duration}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', gap: 10 }}>
                      <TouchableOpacity
                        onPress={() => setSelectedCourseForPreview(item)}
                        activeOpacity={0.8}
                        style={{ flex: 1, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)', borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)', borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>{isPersian ? 'نمایش سرفصل‌ها' : 'Preview'}</Text>
                      </TouchableOpacity>

                      {user ? (
                        isEnrolled ? (
                          <TouchableOpacity
                            onPress={() => router.push(`/(student)/course/${item.id}` as any)}
                            activeOpacity={0.85}
                            style={{ flex: 1.3, backgroundColor: colors.gold, borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '800', fontSize: 12 }}>{isPersian ? 'ادامه دوره' : 'Continue Course'}</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            disabled={isEnrollingThis}
                            onPress={() => item.id && enrollMutation.mutate(item.id)}
                            activeOpacity={0.85}
                            style={{ flex: 1.3, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
                          >
                            {isEnrollingThis ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{isPersian ? 'ثبت‌نام در دوره' : 'Register for Course'}</Text>}
                          </TouchableOpacity>
                        )
                      ) : (
                        <TouchableOpacity
                          onPress={() => router.push('/(auth)/login')}
                          activeOpacity={0.85}
                          style={{ flex: 1.3, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{isPersian ? 'ورود برای ثبت‌نام' : 'Sign in to Register'}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── SECTION 3: ACADEMIC SCHOOL CLASSES (GRADES 7–12) ── */}
        {(activeCatalogSection === 'all' || activeCatalogSection === 'school_classes') && (
          <View
            style={{
              marginBottom: 32,
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.55)' : 'rgba(255, 255, 255, 0.88)',
              borderRadius: 26,
              borderWidth: 1.5,
              borderColor: colors.goldBorder,
              padding: 22,
              shadowColor: '#000',
              shadowOpacity: isDark ? 0.3 : 0.08,
              shadowOffset: { width: 0, height: 6 },
              shadowRadius: 18,
              elevation: 5,
              ...(Platform.OS === 'web'
                ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }
                : {}) as any,
            }}
          >
            <View
              style={{
                flexDirection: isPersian ? 'row-reverse' : 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.cardBorder,
              }}
            >
              <View>
                <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={{ fontSize: 18 }}>🎓</Text>
                  <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                    {isPersian ? 'نصاب رسمی مضامین مکتب • صنوف ۷ الی ۱۲' : 'ACADEMIC SCHOOL CURRICULUM • GRADES 7 TO 12'}
                  </Text>
                </View>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 19, textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian ? 'صنوف درسی مکتب (صنف هفتم الی دوازدهم)' : 'Academic School Classes (Grades 7–12)'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12.5, marginTop: 3, textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian
                    ? 'برنامه درسی و کتب آموزشی رسمی دوره متوسطه، لیسه و آمادگی کانکور'
                    : 'Official secondary and high school curriculum matched to national academic textbooks'}
                </Text>
              </View>
              <View style={{ backgroundColor: isDark ? 'rgba(250, 204, 21, 0.15)' : 'rgba(250, 204, 21, 0.22)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: colors.goldBorder }}>
                <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 11.5 }}>
                  {isPersian ? 'صنوف ۷ تا ۱۲' : 'Grades 7 – 12'}
                </Text>
              </View>
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 21, marginBottom: 16, textAlign: isPersian ? 'right' : 'left' }}>
              {isPersian
                ? 'دسترسی کامل به کتب، مضامین و سرفصل‌های درسی رسمی وزارت معارف از صنف هفتم تا دوازدهم با دسته‌بندی موضوعی، نمونه دروس، و برنامه‌ریزی تقویم درسی.'
                : 'Full access to official academic curriculum and textbooks from Grade 7 to Grade 12, covering mathematics, sciences, languages, and university entrance examination preparation.'}
            </Text>

            {/* Grid of the 6 Academic Classes (7 to 12) */}
            <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
              {SCHOOL_CLASSES_TRACKS.map((gItem) => (
                <TouchableOpacity
                  key={gItem.grade}
                  onPress={() => router.push({ pathname: '/(student)/school', params: { grade: `${gItem.grade}` } } as any)}
                  activeOpacity={0.8}
                  style={{
                    flexBasis: Platform.OS === 'web' ? '31%' : '47%',
                    flexGrow: 1,
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.85)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(250, 204, 21, 0.2)' : 'rgba(226, 232, 240, 0.9)',
                    borderRadius: 16,
                    padding: 12,
                  }}
                >
                  <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: isDark ? 'rgba(250, 204, 21, 0.15)' : 'rgba(250, 204, 21, 0.22)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.goldBorder }}>
                      <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '800' }}>{gItem.grade}</Text>
                    </View>
                    <Text style={{ color: colors.gold, fontSize: 10, fontWeight: '700' }}>
                      {isPersian ? 'نصاب رسمی' : 'Official'}
                    </Text>
                  </View>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13, marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian ? gItem.fa : gItem.en}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 10.5, lineHeight: 15, textAlign: isPersian ? 'right' : 'left' }} numberOfLines={2}>
                    {isPersian ? gItem.subjectsFa : gItem.subjectsEn}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons: Apply Online & View Full School Portal */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              <TouchableOpacity
                onPress={() => router.push('/(student)/apply' as any)}
                activeOpacity={0.85}
                style={{
                  backgroundColor: colors.gold,
                  borderRadius: 16,
                  paddingVertical: 14,
                  paddingHorizontal: 22,
                  flexDirection: isPersian ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  shadowColor: colors.gold,
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                }}
              >
                <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '900', fontSize: 13.5 }}>
                  📝 {isPersian ? 'ثبت‌نام آنلاین در مکتب (فورم پذیرش)' : 'Apply for School Admission'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(student)/school' as any)}
                activeOpacity={0.85}
                style={{
                  backgroundColor: colors.cardHover,
                  borderColor: colors.cardBorder,
                  borderWidth: 1.5,
                  borderRadius: 16,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  flexDirection: isPersian ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13.5 }}>
                  {isPersian ? 'مشاهده نصاب و صنوف مکتب (۷-۱۲) ←' : 'View Full Curriculum (Grades 7–12) →'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View
              style={{
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(250,204,21,0.35)' : 'rgba(226, 232, 240, 0.9)',
                borderRadius: 28,
                padding: 24,
                width: '100%',
                maxWidth: 520,
                maxHeight: '85%',
                shadowColor: '#000',
                shadowOpacity: 0.35,
                shadowOffset: { width: 0, height: 10 },
                shadowRadius: 28,
                elevation: 10,
                ...(Platform.OS === 'web'
                  ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }
                  : {}) as any,
              }}
            >
              <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : colors.cardBorder }}>
                <View style={{ flex: 1, marginHorizontal: 8 }}>
                  <View style={{ backgroundColor: colors.goldBg, borderWidth: 1, borderColor: colors.goldBorder, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, alignSelf: isPersian ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                    <Text style={{ color: colors.gold, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }}>CURRICULUM PREVIEW</Text>
                  </View>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, lineHeight: 22, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian && selectedCourseForPreview.faTitle ? selectedCourseForPreview.faTitle : selectedCourseForPreview.title}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedCourseForPreview(null)}
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.cardHover, borderWidth: 1, borderColor: colors.cardBorder, padding: 8, borderRadius: 99 }}
                >
                  <Text style={{ color: colors.textSecondary, fontWeight: '800', fontSize: 14 }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 14, textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian && selectedCourseForPreview.faDescription ? selectedCourseForPreview.faDescription : selectedCourseForPreview.description}
                </Text>

                {/* Instructor Card in Preview */}
                <View
                  style={{
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.55)' : 'rgba(248, 250, 252, 0.8)',
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(250, 204, 21, 0.2)' : 'rgba(226, 232, 240, 0.8)',
                    padding: 14,
                    marginBottom: 16,
                    flexDirection: isPersian ? 'row-reverse' : 'row',
                    gap: 12,
                    alignItems: 'center',
                    ...(Platform.OS === 'web'
                      ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }
                      : {}) as any,
                  }}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      backgroundColor: isDark ? 'rgba(250, 204, 21, 0.15)' : 'rgba(250, 204, 21, 0.2)',
                      borderWidth: 1,
                      borderColor: colors.goldBorder,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>👨‍🏫</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.gold, fontSize: 8.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'مدرس دوره' : 'COURSE INSTRUCTOR'}
                    </Text>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800', textAlign: isPersian ? 'right' : 'left' }}>
                      {selectedCourseForPreview.ownerName || (isPersian ? 'استاد فرخ' : 'Farukh Faculty')}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 3, lineHeight: 16, fontStyle: 'italic', textAlign: isPersian ? 'right' : 'left' }}>
                      "{selectedCourseForPreview.instructorBio || selectedCourseForPreview.ownerBio || (isPersian
                        ? 'مدرس و پژوهشگر ارشد با سابقه تدریس تخصصی و توانمندسازی دانش‌آموزان در این رشته علمی.'
                        : 'Certified educator dedicated to practical, high-impact skill-building and student mentorship.')}"
                    </Text>
                  </View>
                </View>

                <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 13, marginBottom: 12, textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian ? 'سرفصل‌های آموزشی و مباحث دوره:' : 'Course Lessons & Modules:'}
                </Text>

                {selectedCourseForPreview.sampleLessons && selectedCourseForPreview.sampleLessons.length > 0 ? (
                  selectedCourseForPreview.sampleLessons.map((lesson: any, idx: number) => (
                    <View
                      key={idx}
                      style={{
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(248, 250, 252, 0.75)',
                        padding: 14,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(226, 232, 240, 0.8)',
                        marginBottom: 8,
                      }}
                    >
                      <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13, flex: 1, marginHorizontal: 6, textAlign: isPersian ? 'right' : 'left' }}>{lesson.title}</Text>
                        <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '700' }}>{lesson.duration}</Text>
                      </View>
                      <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: isPersian ? 'right' : 'left' }}>{lesson.description}</Text>
                    </View>
                  ))
                ) : (
                  <View
                    style={{
                      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(248, 250, 252, 0.75)',
                      padding: 14,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(226, 232, 240, 0.8)',
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 22, textAlign: isPersian ? 'right' : 'left' }}>
                      {selectedCourseForPreview.body || selectedCourseForPreview.description || (isPersian ? 'محتوای آموزشی به زودی بارگذاری می‌شود.' : 'Course content will be uploaded soon.')}
                    </Text>
                  </View>
                )}
              </ScrollView>

              <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', gap: 10, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : colors.cardBorder, paddingTop: 16 }}>
                <TouchableOpacity
                  onPress={() => setSelectedCourseForPreview(null)}
                  activeOpacity={0.8}
                  style={{ flex: 1, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, paddingVertical: 12, alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                >
                  <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 13 }}>{isPersian ? 'بستن' : 'Close'}</Text>
                </TouchableOpacity>

                {enrolledCourseIds.includes(selectedCourseForPreview.id) ? (
                  <TouchableOpacity
                    onPress={() => {
                      const id = selectedCourseForPreview.id;
                      setSelectedCourseForPreview(null);
                      router.push(`/(student)/course/${id}` as any);
                    }}
                    activeOpacity={0.85}
                    style={{
                      flex: 2,
                      backgroundColor: colors.gold,
                      borderRadius: 14,
                      paddingVertical: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                      {isPersian ? 'ورود به دوره' : 'Continue Course'}
                    </Text>
                  </TouchableOpacity>
                ) : (
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
                    activeOpacity={0.85}
                    style={{
                      flex: 2,
                      backgroundColor: colors.primary,
                      borderRadius: 14,
                      paddingVertical: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: colors.primary,
                      shadowOpacity: 0.25,
                      shadowRadius: 8,
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>
                      {user
                        ? (isPersian ? 'ثبت‌نام و ورود به دوره →' : 'Register & Enter Course →')
                        : '🔒 Sign in to Register'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScreenWrapper>
  );
}
