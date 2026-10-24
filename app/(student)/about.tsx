import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { useAuth } from '../../src/features/auth/useAuth';
import { useTheme } from '../../src/features/theme/ThemeContext';
import { getInstructorApplication } from '../../src/features/instructor/instructorApi';
import { submitContactMessage } from '../../src/features/contact/contactApi';

export default function AboutScreen() {
  const router = useRouter();
  const { user, isInstructor, isAdmin } = useAuth();
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');

  // Contact form state
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subjectCategory, setSubjectCategory] = useState<string>('General Inquiry');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if current user has an instructor application
  const { data: existingApp } = useQuery({
    queryKey: ['instructorApplication', user?.uid],
    queryFn: () => (user?.uid ? getInstructorApplication(user.uid) : Promise.resolve(null)),
    enabled: !!user?.uid,
  });

  const subjectOptions = [
    { id: 'General Inquiry', en: 'General Inquiry', fa: 'پرسش عمومی' },
    { id: 'Course Support', en: 'Course Support', fa: 'پشتیبانی دوره' },
    { id: 'Instructor Program', en: 'Instructor Program', fa: 'همکاری در تدریس' },
    { id: 'Partnership', en: 'Partnership & Ventures', fa: 'همکاری و سرمایه‌گذاری' },
    { id: 'Technical Issue', en: 'Technical Issue', fa: 'مشکل فنی و سیستم' },
  ];

  const handleSubmitContact = async () => {
    setErrorMessage(null);
    if (!name.trim()) {
      setErrorMessage(isPersian ? 'لطفاً نام خود را وارد فرمایید.' : 'Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage(
        isPersian
          ? 'لطفاً یک آدرس ایمیل معتبر وارد نمایید.'
          : 'Please enter a valid email address.'
      );
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setErrorMessage(
        isPersian
          ? 'پیام شما باید حداقل ۱۰ کاراکتر باشد.'
          : 'Your message should be at least 10 characters long.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await submitContactMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subjectCategory,
        message: message.trim(),
        userId: user?.uid || null,
      });

      setSubmitSuccess(true);
      setMessage('');
      if (Platform.OS !== 'web') {
        Alert.alert(
          isPersian ? 'پیام ثبت شد' : 'Message Sent',
          isPersian
            ? 'پیام شما با موفقیت دریافت شد. به زودی با شما تماس می‌گیریم.'
            : 'Thank you! Your message has been received. Our team will contact you shortly.'
        );
      }
    } catch (err: any) {
      console.error('Failed to submit contact message:', err);
      setErrorMessage(
        isPersian
          ? 'خطا در ارسال پیام. لطفاً دوباره تلاش فرمایید.'
          : 'Failed to send message. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const glassCardStyle = {
    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.48)' : 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(250, 204, 21, 0.22)' : 'rgba(226, 232, 240, 0.85)',
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.25 : 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 4,
    ...(Platform.OS === 'web'
      ? { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }
      : {}) as any,
  };

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48, maxWidth: 960, alignSelf: 'center', width: '100%' }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero / About Mission Banner ── */}
        <View
          style={{
            ...glassCardStyle,
            paddingVertical: 32,
            paddingHorizontal: 24,
            alignItems: 'center',
            borderColor: isDark ? 'rgba(250, 204, 21, 0.35)' : 'rgba(226, 232, 240, 0.95)',
          }}
        >
          {/* Badge */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: isDark ? 'rgba(250, 204, 21, 0.12)' : 'rgba(250, 204, 21, 0.2)',
              borderWidth: 1,
              borderColor: colors.goldBorder,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 99,
              marginBottom: 14,
            }}
          >
            <Text style={{ fontSize: 13 }}>🏛️</Text>
            <Text
              style={{
                color: colors.gold,
                fontSize: 11,
                fontWeight: '900',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              {isPersian ? 'آکادمی و بنیاد فرخ • FARUKH.ORG' : 'FARUKH.ORG • ACADEMY & VENTURES'}
            </Text>
          </View>

          <Text
            style={{
              color: colors.text,
              fontSize: 26,
              fontWeight: '900',
              textAlign: 'center',
              lineHeight: 34,
              marginBottom: 12,
              maxWidth: 720,
            }}
          >
            {isPersian
              ? 'آموزش تخصصی، کارآفرینی و مهارت‌های آینده'
              : 'Empowering Next-Gen Leaders, Creators & Entrepreneurs'}
          </Text>

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 14,
              lineHeight: 24,
              textAlign: 'center',
              maxWidth: 700,
              marginBottom: 24,
            }}
          >
            {isPersian
              ? 'بنیاد فرخ یک زیست‌بوم آموزشی باز و پیشرو است که با تمرکز بر مهارت‌های کاربردی بازار کار، برنامه‌نویسی، هوش مصنوعی و اقتصاد دیجیتال، یادگیری تعاملی را همراه با گواهی‌نامه‌های معتبر و قابل استعلام در اختیار دانش‌پژوهان قرار می‌دهد.'
              : 'FARUKH.ORG is an elite open learning ecosystem dedicated to practical, high-income skills in software engineering, AI systems, and digital ventures. Every course features hands-on projects, rigorous exams, and verifiable digital certificates.'}
          </Text>

          {/* Quick Metrics / Stats Grid */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 12,
              width: '100%',
            }}
          >
            {[
              {
                icon: '🎯',
                title: isPersian ? '۱۰۰٪ پروژه‌محور' : '100% Practical',
                desc: isPersian ? 'بدون اتلاف وقت و تئوری محض' : 'No fluff, hands-on only',
              },
              {
                icon: '📜',
                title: isPersian ? 'مدارک معتبر و آنلاین' : 'Verifiable Credentials',
                desc: isPersian ? 'استعلام فوری با شناسه QR' : 'Instant digital verification',
              },
              {
                icon: '👨‍🏫',
                title: isPersian ? 'اساتید متخصص' : 'Verified Faculty',
                desc: isPersian ? 'آموزش توسط فعالان بازار' : 'Real-world practitioner mentors',
              },
              {
                icon: '🌐',
                title: isPersian ? 'دسترسی همگانی' : 'Open Access',
                desc: isPersian ? 'فراگیری در هر زمان و مکان' : 'Study anywhere, anytime',
              },
            ].map((stat, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(248, 250, 252, 0.8)',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.85)',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  minWidth: 150,
                  flex: 1,
                  maxWidth: 220,
                  ...(Platform.OS === 'web'
                    ? { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }
                    : {}) as any,
                }}
              >
                <Text style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</Text>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13, textAlign: 'center' }}>
                  {stat.title}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 2 }}>
                  {stat.desc}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── SECTION 1: ABOUT FOUNDERS ── */}
        <View style={glassCardStyle}>
          <View
            style={{
              flexDirection: isPersian ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
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
              <Text style={{ fontSize: 18 }}>👨‍💼</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.gold,
                  fontSize: 10,
                  fontWeight: '800',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  textAlign: isPersian ? 'right' : 'left',
                }}
              >
                {isPersian ? 'رهبری و ارکان بنیاد' : 'LEADERSHIP & VISION'}
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: '900',
                  textAlign: isPersian ? 'right' : 'left',
                }}
              >
                {isPersian ? 'درباره بنیان‌گذاران فرخ' : 'About the Founders'}
              </Text>
            </View>
          </View>

          {/* Lead Founder Spotlight Card */}
          <View
            style={{
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.85)',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(250, 204, 21, 0.25)' : 'rgba(226, 232, 240, 0.9)',
              padding: 18,
              marginBottom: 16,
              ...(Platform.OS === 'web'
                ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }
                : {}) as any,
            }}
          >
            <View
              style={{
                flexDirection: isPersian ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 16,
                marginBottom: 14,
                flexWrap: 'wrap',
              }}
            >
              {/* Founder Avatar */}
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: colors.goldBg,
                  borderWidth: 2,
                  borderColor: colors.gold,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: colors.gold,
                  shadowOpacity: 0.35,
                  shadowRadius: 10,
                  elevation: 6,
                }}
              >
                <Text style={{ fontSize: 34 }}>👨‍🏫</Text>
              </View>

              <View style={{ flex: 1, minWidth: 200 }}>
                <View
                  style={{
                    flexDirection: isPersian ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 18,
                      fontWeight: '900',
                      textAlign: isPersian ? 'right' : 'left',
                    }}
                  >
                    {isPersian ? 'استاد شیر فرخ' : 'Shir Farukh'}
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.goldBg,
                      borderWidth: 1,
                      borderColor: colors.goldBorder,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 99,
                    }}
                  >
                    <Text style={{ color: colors.gold, fontSize: 10, fontWeight: '800' }}>
                      {isPersian ? 'بنیان‌گذار' : 'FOUNDER'}
                    </Text>
                  </View>
                </View>

                <Text
                  style={{
                    color: colors.gold,
                    fontSize: 12,
                    fontWeight: '700',
                    marginBottom: 4,
                    textAlign: isPersian ? 'right' : 'left',
                  }}
                >
                  {isPersian
                    ? 'بنیان‌گذار، معمار سیستم و مدرس ارشد فناوری و کسب‌وکار'
                    : 'Founder, Lead System Architect & Senior Tech Educator'}
                </Text>

                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 11,
                    textAlign: isPersian ? 'right' : 'left',
                  }}
                >
                  {isPersian
                    ? 'بیش از یک دهه تجربه در توسعه نرم‌افزار، هوش مصنوعی و آموزش کارآفرینی'
                    : '10+ years driving software innovation, enterprise AI architectures & tech mentorship'}
                </Text>
              </View>
            </View>

            {/* Founder Narrative */}
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 13,
                lineHeight: 22,
                marginBottom: 14,
                textAlign: isPersian ? 'right' : 'left',
              }}
            >
              {isPersian
                ? 'استاد شیر فرخ با باور عمیق به اینکه آموزش کاربردی و دسترسی به دانش پیشرفته فناوری نباید به دانشگاه‌های پرهزینه محدود بماند، بنیاد و آکادمی FARUKH.ORG را تأسیس نمود. هدف بنیاد، حذف موانع سنتی یادگیری و توانمندسازی افراد برای تبدیل دانش به پروژه‌های عملیاتی، کسب درآمد دلاری و توسعه کارآفرینی مستقل است.'
                : 'Shir Farukh established FARUKH.ORG out of a resolute conviction: transformative education in software engineering, applied AI, and modern entrepreneurship must be merit-driven and accessible to every motivated learner. By replacing theoretical busywork with project-driven mastery, FARUKH.ORG bridges the divide between education and market leadership.'}
            </Text>

            {/* Founder Quote */}
            <View
              style={{
                backgroundColor: isDark ? 'rgba(250, 204, 21, 0.08)' : 'rgba(250, 204, 21, 0.12)',
                borderRadius: 14,
                borderLeftWidth: isPersian ? 0 : 4,
                borderRightWidth: isPersian ? 4 : 0,
                borderColor: colors.gold,
                padding: 12,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontSize: 12,
                  fontStyle: 'italic',
                  lineHeight: 19,
                  textAlign: isPersian ? 'right' : 'left',
                }}
              >
                {isPersian
                  ? '«آموزش واقعی زمانی ارزش پیدا می‌کند که به خلق یک اثر، راه‌اندازی یک پروژه و استقلال مالی منتهی شود. هدف ما در فرخ، ساختن نسلی از ارزش‌آفرینان توانمند است.»'
                  : '"True education only earns its worth when it yields tangible creation, autonomous skill mastery, and economic independence. At FARUKH.ORG, we build the builders."'}
              </Text>
            </View>
          </View>

          {/* Academic Pillars */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {[
              {
                icon: '⚡',
                title: isPersian ? 'صداقت علمی و محتوای به‌روز' : 'Curriculum Excellence',
                desc: isPersian
                  ? 'تمامی سرفصل‌ها مستقیماً بر اساس جدیدترین ابزارهای صنعت جهانی تدوین می‌شوند.'
                  : 'Syllabi engineered in sync with modern tech stacks and high-demand commercial patterns.',
              },
              {
                icon: '🤝',
                title: isPersian ? 'جامعه و مربی‌گری پایدار' : 'Unbroken Mentorship',
                desc: isPersian
                  ? 'ارتباط مستمر مدرسان با دانش‌پژوهان از طریق تالار گفت‌وگو و بررسی گام‌به‌گام پروژه‌ها.'
                  : 'Direct interaction between faculty and students via community threads and code reviews.',
              },
            ].map((pillar, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  minWidth: 240,
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(241, 245, 249, 0.7)',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(226, 232, 240, 0.75)',
                  padding: 12,
                }}
              >
                <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={{ fontSize: 16 }}>{pillar.icon}</Text>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13, textAlign: isPersian ? 'right' : 'left' }}>
                    {pillar.title}
                  </Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 11.5, lineHeight: 18, textAlign: isPersian ? 'right' : 'left' }}>
                  {pillar.desc}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── SECTION 2: REQUEST FOR INSTRUCTOR ── */}
        <View
          style={{
            ...glassCardStyle,
            borderColor: isDark ? 'rgba(250, 204, 21, 0.35)' : 'rgba(250, 204, 21, 0.45)',
          }}
        >
          <View
            style={{
              flexDirection: isPersian ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
            }}
          >
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
              <Text style={{ fontSize: 18 }}>🎓</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.gold,
                  fontSize: 10,
                  fontWeight: '800',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  textAlign: isPersian ? 'right' : 'left',
                }}
              >
                {isPersian ? 'دعوت به همکاری اساتید و مدرسان' : 'FACULTY PARTNERSHIP PROGRAM'}
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: '900',
                  textAlign: isPersian ? 'right' : 'left',
                }}
              >
                {isPersian ? 'مدرس آکادمی فرخ شوید' : 'Request to Become an Instructor'}
              </Text>
            </View>
          </View>

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13,
              lineHeight: 22,
              marginBottom: 16,
              textAlign: isPersian ? 'right' : 'left',
            }}
          >
            {isPersian
              ? 'اگر در حوزه‌های برنامه‌نویسی، هوش مصنوعی، فناوری‌های مدرن، کسب‌وکار یا تحلیل بازارهای مالی تخصص دارید، می‌توانید با تدریس در آکادمی فرخ به هزاران دانش‌پژوه مشتاق آموزش دهید و اعتبار علمی خود را گسترش دهید.'
              : 'Are you an expert in computer science, enterprise AI, digital ventures, or financial engineering? Join our faculty to deliver world-class courses, mentor ambitious students, and expand your professional reach.'}
          </Text>

          {/* Instructor Benefits Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
            {[
              {
                icon: '🛠️',
                title: isPersian ? 'استودیو اختصاصی دوره' : 'Instructor Studio',
                desc: isPersian ? 'مدیریت سرفصل‌ها، آزمون‌ها و ویدیوها' : 'Complete course creation & quiz suite',
              },
              {
                icon: '📜',
                title: isPersian ? 'صدور مدارک رسمی' : 'Accredited Certificates',
                desc: isPersian ? 'گواهی دیجیتال به نام شما و آکادمی' : 'Verifiable digital certificates for students',
              },
              {
                icon: '⭐',
                title: isPersian ? 'نشان استاد تأیید شده' : 'Verified Faculty Badge',
                desc: isPersian ? 'نمایش پروفایل، بیوگرافی و رزومه' : 'Custom bio & faculty recognition on catalog',
              },
            ].map((b, idx) => (
              <View
                key={idx}
                style={{
                  flex: 1,
                  minWidth: 160,
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.75)',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(226, 232, 240, 0.8)',
                  padding: 12,
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>{b.icon}</Text>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 12, textAlign: isPersian ? 'right' : 'left' }}>
                  {b.title}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 10.5, lineHeight: 15, marginTop: 2, textAlign: isPersian ? 'right' : 'left' }}>
                  {b.desc}
                </Text>
              </View>
            ))}
          </View>

          {/* Dynamic Instructor State Card */}
          <View
            style={{
              backgroundColor: isDark ? 'rgba(250, 204, 21, 0.08)' : 'rgba(250, 204, 21, 0.12)',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.goldBorder,
              padding: 16,
              alignItems: 'center',
            }}
          >
            {isInstructor ? (
              <View style={{ alignItems: 'center', width: '100%' }}>
                <Text style={{ fontSize: 28, marginBottom: 6 }}>🎉</Text>
                <Text style={{ color: colors.gold, fontWeight: '900', fontSize: 15, marginBottom: 4 }}>
                  {isPersian ? 'شما عضو تأیید شده هیئت علمی هستید' : 'You are an Active Verified Instructor'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: 14 }}>
                  {isPersian
                    ? 'از پنل اختصاصی مدرسان می‌توانید دوره‌های خود را ایجاد، ویرایش و برای بازبینی ارسال فرمایید.'
                    : 'Access your Instructor Studio to create new drafts, configure quizzes, and manage courses.'}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/instructor' as any)}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: colors.gold,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    shadowColor: colors.gold,
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                  }}
                >
                  <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '900', fontSize: 13 }}>
                    🚀 {isPersian ? 'ورود به پنل استودیو مدرس' : 'Open Instructor Studio'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : existingApp ? (
              <View style={{ alignItems: 'center', width: '100%' }}>
                <View
                  style={{
                    backgroundColor: colors.goldBg,
                    borderWidth: 1,
                    borderColor: colors.goldBorder,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 99,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '800' }}>
                    {isPersian ? `وضعیت درخواست: ${existingApp.status}` : `Application Status: ${existingApp.status.toUpperCase()}`}
                  </Text>
                </View>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14, marginBottom: 4, textAlign: 'center' }}>
                  {isPersian ? 'درخواست تدریس شما ثبت شده است' : 'Your Instructor Application is on File'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: 14 }}>
                  {isPersian
                    ? 'می‌توانید رزومه، بیوگرافی و اطلاعات درخواست خود را مشاهده یا به‌روزرسانی فرمایید.'
                    : 'You can review or update your submitted credentials and course proposals anytime.'}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(student)/become-instructor' as any)}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 14,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>
                    📝 {isPersian ? 'مشاهده و ویرایش درخواست تدریس' : 'View / Edit Application'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ alignItems: 'center', width: '100%' }}>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14, marginBottom: 4, textAlign: 'center' }}>
                  {isPersian ? 'مراحل ثبت درخواست تدریس' : 'Start Your Teaching Journey'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: 14, maxWidth: 520 }}>
                  {isPersian
                    ? 'فرم کوتاه درخواست را همراه با تخصص‌ها، لینک نمونه تدریس و بیوگرافی کوتاه ارسال فرمایید. تیم ارزیابی فرخ حداکثر طی ۴۸ ساعت نتیجه را اعلام خواهد کرد.'
                    : 'Submit your teaching application with your background, language proficiency, and sample syllabus outline. Our academic review board responds within 48 hours.'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (!user) {
                      router.push('/(auth)/login');
                    } else {
                      router.push('/(student)/become-instructor' as any);
                    }
                  }}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 28,
                    paddingVertical: 12,
                    borderRadius: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>
                    ✍️ {user ? (isPersian ? 'تکمیل فرم درخواست تدریس' : 'Apply to Become an Instructor') : (isPersian ? 'ورود به حساب برای درخواست تدریس' : 'Sign in to Apply as Instructor')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* ── SECTION 3: CONTACT US FORM ── */}
        <View style={glassCardStyle}>
          <View
            style={{
              flexDirection: isPersian ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
            }}
          >
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
              <Text style={{ fontSize: 18 }}>✉️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.gold,
                  fontSize: 10,
                  fontWeight: '800',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  textAlign: isPersian ? 'right' : 'left',
                }}
              >
                {isPersian ? 'ارتباط مستقیم و پشتیبانی' : 'SUPPORT & INQUIRIES'}
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: '900',
                  textAlign: isPersian ? 'right' : 'left',
                }}
              >
                {isPersian ? 'فرم تماس با ما' : 'Contact Us'}
              </Text>
            </View>
          </View>

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13,
              lineHeight: 22,
              marginBottom: 20,
              textAlign: isPersian ? 'right' : 'left',
            }}
          >
            {isPersian
              ? 'پیشنهادات، سؤالات درباره دوره‌ها، درخواست‌های همکاری و یا مشکلات فنی خود را از طریق فرم زیر ارسال فرمایید. تیم پشتیبانی فرخ در اولین فرصت پاسخگوی شما خواهد بود.'
              : 'Have questions regarding our curriculum, enterprise partnerships, or technical questions? Fill in the form below and our team will get back to you promptly.'}
          </Text>

          {/* Success Banner */}
          {submitSuccess && (
            <View
              style={{
                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.12)',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#22C55E',
                padding: 16,
                marginBottom: 20,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 24, marginBottom: 4 }}>✅</Text>
              <Text style={{ color: '#22C55E', fontWeight: '800', fontSize: 14, textAlign: 'center' }}>
                {isPersian ? 'پیام شما با موفقیت ثبت شد!' : 'Message Sent Successfully!'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                {isPersian
                  ? 'از پیام شما سپاسگزاریم. پاسخ در اسرع وقت به ایمیل شما ارسال خواهد شد.'
                  : 'Thank you for reaching out. We will respond to your email as soon as possible.'}
              </Text>
              <TouchableOpacity
                onPress={() => setSubmitSuccess(false)}
                style={{ marginTop: 10, paddingVertical: 4, paddingHorizontal: 12 }}
              >
                <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 12 }}>
                  {isPersian ? 'ارسال پیام دیگر' : 'Send Another Message'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <View
              style={{
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#EF4444',
                padding: 12,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700', textAlign: isPersian ? 'right' : 'left' }}>
                ⚠️ {errorMessage}
              </Text>
            </View>
          )}

          {!submitSuccess && (
            <View>
              {/* Name & Email Row */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                <View style={{ flex: 1, minWidth: 240 }}>
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian ? 'نام و نام خانوادگی:' : 'Your Name:'}
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={isPersian ? 'مثال: علی رضایی' : 'e.g. Alex Johnson'}
                    placeholderTextColor={colors.textMuted}
                    style={{
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.9)',
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      color: colors.text,
                      fontSize: 13,
                      textAlign: isPersian ? 'right' : 'left',
                    }}
                  />
                </View>

                <View style={{ flex: 1, minWidth: 240 }}>
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian ? 'آدرس ایمیل:' : 'Email Address:'}
                  </Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="name@example.com"
                    placeholderTextColor={colors.textMuted}
                    style={{
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.9)',
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      color: colors.text,
                      fontSize: 13,
                      textAlign: 'left',
                    }}
                  />
                </View>
              </View>

              {/* Subject Category Selector */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian ? 'موضوع پیام:' : 'Subject Category:'}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {subjectOptions.map((opt) => {
                    const isSelected = subjectCategory === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => setSubjectCategory(opt.id)}
                        activeOpacity={0.8}
                        style={{
                          backgroundColor: isSelected
                            ? colors.goldBg
                            : isDark
                            ? 'rgba(15, 23, 42, 0.5)'
                            : 'rgba(248, 250, 252, 0.8)',
                          borderWidth: 1,
                          borderColor: isSelected ? colors.gold : colors.cardBorder,
                          borderRadius: 99,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                        }}
                      >
                        <Text
                          style={{
                            color: isSelected ? colors.gold : colors.textSecondary,
                            fontWeight: isSelected ? '800' : '600',
                            fontSize: 12,
                          }}
                        >
                          {isPersian ? opt.fa : opt.en}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Message Multiline Input */}
              <View style={{ marginBottom: 18 }}>
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian ? 'متن پیام:' : 'Your Message:'}
                </Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder={
                    isPersian
                      ? 'سؤال، دیدگاه یا درخواست خود را به تفصیل بنویسید...'
                      : 'Write your questions, ideas or feedback here...'
                  }
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  style={{
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.9)',
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    borderRadius: 14,
                    padding: 14,
                    color: colors.text,
                    fontSize: 13,
                    minHeight: 120,
                    textAlign: isPersian ? 'right' : 'left',
                  }}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmitContact}
                disabled={isSubmitting}
                activeOpacity={0.85}
                style={{
                  backgroundColor: colors.gold,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  shadowColor: colors.gold,
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={isDark ? '#0F172A' : '#FFFFFF'} />
                ) : (
                  <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '900', fontSize: 14 }}>
                    ✉️ {isPersian ? 'ارسال پیام به تیم فرخ' : 'Send Message to Team'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Direct Support Info Box */}
          <View
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.cardBorder,
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 16 }}>📧</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                {isPersian ? 'ایمیل رسمی:' : 'Direct Email:'}{' '}
                <Text style={{ color: colors.gold, fontWeight: '700' }}>info@farukh.org</Text>
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(student)/community' as any)}
              style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ fontSize: 14 }}>💬</Text>
              <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '700' }}>
                {isPersian ? 'ورود به تالار گفت‌وگوی جامعه →' : 'Visit Community Forum →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
