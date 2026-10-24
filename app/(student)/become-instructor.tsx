import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { useAuth } from '../../src/features/auth/useAuth';
import { useTheme } from '../../src/features/theme/ThemeContext';
import { COURSE_CATEGORIES } from '../../src/types/course';
import { TEACHING_LANGUAGES, InstructorApplicationInputSchema } from '../../src/types/instructor';
import { getInstructorApplication, submitInstructorApplicationCallable } from '../../src/features/instructor/instructorApi';

export default function BecomeInstructorScreen() {
  const router = useRouter();
  const { user, isInstructor, isAdmin } = useAuth();
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isPersian = i18n.language?.startsWith('fa');

  // Form states
  const [nameEn, setNameEn] = useState(user?.displayName || '');
  const [nameFa, setNameFa] = useState('');
  const [bio, setBio] = useState('');
  const [shortBio, setShortBio] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [teachingLanguages, setTeachingLanguages] = useState<string[]>(['fa']);
  const [portfolioLink, setPortfolioLink] = useState('');
  const [youtubeChannel, setYoutubeChannel] = useState('');
  const [sampleCourseIdea, setSampleCourseIdea] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch existing application if user is logged in
  const { data: existingApp, isLoading: loadingApp, refetch } = useQuery({
    queryKey: ['instructorApplication', user?.uid],
    queryFn: () => (user?.uid ? getInstructorApplication(user.uid) : Promise.resolve(null)),
    enabled: !!user?.uid,
  });

  // Pre-fill form if existing application had changes requested
  useEffect(() => {
    if (existingApp) {
      if (existingApp.nameEn) setNameEn(existingApp.nameEn);
      if (existingApp.nameFa) setNameFa(existingApp.nameFa);
      if (existingApp.bio) setBio(existingApp.bio);
      if (existingApp.shortBio) setShortBio(existingApp.shortBio);
      if (existingApp.expertise?.length) setExpertise(existingApp.expertise);
      if (existingApp.teachingLanguages?.length) setTeachingLanguages(existingApp.teachingLanguages);
      if (existingApp.portfolioLinks?.[0]) setPortfolioLink(existingApp.portfolioLinks[0]);
      if (existingApp.youtubeChannel) setYoutubeChannel(existingApp.youtubeChannel);
      if (existingApp.sampleCourseIdea) setSampleCourseIdea(existingApp.sampleCourseIdea);
    }
  }, [existingApp]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      setValidationError(null);
      const effectiveShortBio = shortBio.trim() || (bio.trim().length > 150 ? bio.trim().slice(0, 147) + '...' : bio.trim());
      const payload = {
        nameEn: nameEn.trim(),
        nameFa: nameFa.trim(),
        bio: bio.trim(),
        shortBio: effectiveShortBio,
        expertise,
        teachingLanguages,
        portfolioLinks: portfolioLink.trim() ? [portfolioLink.trim()] : [],
        youtubeChannel: youtubeChannel.trim() || undefined,
        sampleCourseIdea: sampleCourseIdea.trim(),
        acceptedTerms,
      };

      const parsed = InstructorApplicationInputSchema.safeParse(payload);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0]?.message || 'Please check form fields';
        throw new Error(firstIssue);
      }

      return await submitInstructorApplicationCallable(parsed.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructorApplication', user?.uid] });
      refetch();
    },
    onError: (err: any) => {
      setValidationError(err?.message || 'Failed to submit application');
    },
  });

  const toggleExpertise = (cat: string) => {
    setExpertise((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleLanguage = (code: string) => {
    setTeachingLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  if (!user) {
    return (
      <ScreenWrapper scrollable>
        <View className="max-w-xl w-full self-center px-4 py-12 items-center">
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🎓</Text>
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 }}>
            {isPersian ? 'ورود به حساب کاربری' : 'Sign In Required'}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
            {isPersian
              ? 'جهت ارسال درخواست مربی‌گری، لطفاً ابتدا وارد حساب کاربری خود شوید یا حساب جدید بسازید.'
              : 'Please sign in or create an account to apply as an instructor on FARUKH.ORG.'}
          </Text>
          <Button
            title={isPersian ? 'ورود به حساب کاربری' : 'Sign In'}
            onPress={() => router.push('/(auth)/login')}
          />
        </View>
      </ScreenWrapper>
    );
  }

  if (isInstructor) {
    return (
      <ScreenWrapper scrollable>
        <View className="max-w-xl w-full self-center px-4 py-12 items-center">
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: colors.successBg,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: colors.success,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 36 }}>✅</Text>
          </View>
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 }}>
            {isPersian ? 'شما مربی تأیید شده هستید!' : 'You Are an Approved Instructor!'}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
            {isPersian
              ? 'حساب شما دارای دسترسی کامل برای ایجاد دوره‌ها، مدیریت سرفصل‌ها و مشاهده بازخوردهای آکادمیک است.'
              : 'Your instructor account is active. You can create courses, build lessons, quizzes, and publish to students worldwide.'}
          </Text>
          <Button
            title={isPersian ? 'ورود به پنل مربیگری →' : 'Go to Instructor Portal →'}
            onPress={() => router.push('/instructor' as any)}
          />
        </View>
      </ScreenWrapper>
    );
  }

  // Calculate 30-day cooldown if rejected
  let isCooldownActive = false;
  let cooldownDaysLeft = 0;
  if (existingApp?.status === 'rejected' && existingApp.reviewedAt) {
    const reviewedTime = typeof existingApp.reviewedAt.toDate === 'function'
      ? existingApp.reviewedAt.toDate().getTime()
      : new Date(existingApp.reviewedAt).getTime();
    const cooldownPeriod = 30 * 24 * 60 * 60 * 1000;
    const diff = Date.now() - reviewedTime;
    if (diff < cooldownPeriod) {
      isCooldownActive = true;
      cooldownDaysLeft = Math.ceil((cooldownPeriod - diff) / (24 * 60 * 60 * 1000));
    }
  }

  return (
    <ScreenWrapper scrollable>
      <View className="max-w-2xl w-full self-center px-4 py-6 pb-28">
        {/* Header Hero */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: colors.gold, fontSize: 14, fontWeight: '700' }}>
              ← {isPersian ? 'بازگشت به پروفایل' : 'Back to Profile'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center justify-between">
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 }}>
                {isPersian ? 'درخواست مربی‌گری در فرخ' : 'Become an Instructor'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                {isPersian
                  ? 'دانش خود را به اشتراک بگذارید، دوره‌های رایگان یا معتبر بسازید و نسل آینده را توانمند سازید.'
                  : 'Teach, inspire, and build the future of education with FARUKH.ORG.'}
              </Text>
            </View>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: colors.goldBg,
                borderWidth: 1.5,
                borderColor: colors.goldBorder,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 26 }}>🎓</Text>
            </View>
          </View>
        </View>

        {loadingApp ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : existingApp?.status === 'pending' ? (
          /* PENDING REVIEW STATE */
          <Card style={{ padding: 22, borderColor: colors.goldBorder, borderWidth: 1.5, borderRadius: 20 }}>
            <View className="items-center mb-4">
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.goldBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 28 }}>⏳</Text>
              </View>
              <Badge label={isPersian ? 'در حال بررسی آکادمیک' : 'Under Academic Review'} variant="warning" />
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 12, textAlign: 'center' }}>
                {isPersian ? 'درخواست شما دریافت شد' : 'Application Submitted'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
                {isPersian
                  ? 'تیم نظارت آموزشی FARUKH.ORG مشخصات، رزومه و ایده دوره شما را بررسی می‌نماید. معمولاً فرآیند بررسی ظرف ۲۴ الی ۴۸ ساعت کاری تکمیل می‌گردد.'
                  : 'Our academic review committee is reviewing your credentials and sample course proposal. You will receive notification within 24-48 business hours.'}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                gap: 8,
              }}
            >
              <View className="flex-row justify-between">
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{isPersian ? 'نام متقاضی:' : 'Applicant:'}</Text>
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
                  {existingApp.nameEn} ({existingApp.nameFa})
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{isPersian ? 'حوزه‌های تخصصی:' : 'Expertise:'}</Text>
                <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '700' }}>
                  {existingApp.expertise?.join(', ')}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{isPersian ? 'زبان‌های تدریس:' : 'Languages:'}</Text>
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>
                  {existingApp.teachingLanguages?.join(', ').toUpperCase()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => refetch()}
              style={{
                marginTop: 18,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 13 }}>
                🔄 {isPersian ? 'بروزرسانی وضعیت' : 'Check Status Again'}
              </Text>
            </TouchableOpacity>
          </Card>
        ) : (
          /* FORM OR RE-SUBMISSION VIEW */
          <View>
            {/* If application was rejected with cooldown */}
            {existingApp?.status === 'rejected' && (
              <Card
                style={{
                  backgroundColor: colors.dangerBg,
                  borderColor: colors.danger,
                  borderWidth: 1,
                  padding: 16,
                  borderRadius: 16,
                  marginBottom: 16,
                }}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <Text style={{ fontSize: 16 }}>⚠️</Text>
                  <Text style={{ color: colors.danger, fontWeight: '800', fontSize: 14 }}>
                    {isPersian ? 'درخواست قبلی تأیید نشد' : 'Previous Application Not Approved'}
                  </Text>
                </View>
                {existingApp.rejectionReason && (
                  <Text style={{ color: colors.text, fontSize: 13, marginBottom: 8 }}>
                    {isPersian ? 'دلیل عدم تأیید: ' : 'Feedback: '}
                    <Text style={{ fontWeight: '600' }}>{existingApp.rejectionReason}</Text>
                  </Text>
                )}
                {isCooldownActive ? (
                  <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '700' }}>
                    ⏳ {isPersian
                      ? `دوره انتظار فعال است: ${cooldownDaysLeft} روز تا امکان ارسال درخواست مجدد.`
                      : `Cooldown period active: ${cooldownDaysLeft} days remaining before you can re-apply.`}
                  </Text>
                ) : (
                  <Text style={{ color: colors.success, fontSize: 12, fontWeight: '700' }}>
                    ✅ {isPersian ? 'دوره انتظار به پایان رسیده است؛ می‌توانید مجدداً درخواست دهید.' : 'Cooldown period has elapsed. You may now submit an updated application.'}
                  </Text>
                )}
              </Card>
            )}

            {/* If changes requested */}
            {existingApp?.status === 'changes_requested' && (
              <Card
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  borderColor: '#F59E0B',
                  borderWidth: 1,
                  padding: 16,
                  borderRadius: 16,
                  marginBottom: 16,
                }}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <Text style={{ fontSize: 16 }}>✏️</Text>
                  <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: 14 }}>
                    {isPersian ? 'نیاز به اصلاح مدارک و اطلاعات' : 'Changes Requested by Admin'}
                  </Text>
                </View>
                {existingApp.rejectionReason && (
                  <Text style={{ color: colors.text, fontSize: 13, marginBottom: 4 }}>
                    {existingApp.rejectionReason}
                  </Text>
                )}
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {isPersian
                    ? 'لطفاً موارد فوق را بررسی کرده و فرم زیر را بروزرسانی فرمایید.'
                    : 'Please review the requested changes and re-submit your updated application below.'}
                </Text>
              </Card>
            )}

            {validationError ? (
              <View
                style={{
                  backgroundColor: colors.dangerBg,
                  borderColor: colors.danger,
                  borderWidth: 1,
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '700' }}>
                  ⚠️ {validationError}
                </Text>
              </View>
            ) : null}

            <Card style={{ padding: 18, borderRadius: 20, marginBottom: 16 }}>
              <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 12 }}>
                1. {isPersian ? 'مشخصات هویتی و حرفه‌ای' : 'Personal & Professional Details'}
              </Text>

              <Input
                label={isPersian ? 'نام کامل به انگلیسی (جهت صدور گواهینامه)' : 'Full Legal Name (English)'}
                placeholder="e.g. Ahmad Rezaei"
                value={nameEn}
                onChangeText={setNameEn}
              />

              <Input
                label={isPersian ? 'نام کامل به فارسی / دری' : 'Full Name (Persian / Dari)'}
                placeholder="مثلاً: احمد رضایی"
                value={nameFa}
                onChangeText={setNameFa}
              />

              <Input
                label={isPersian ? 'بیوگرافی و سوابق حرفه‌ای (حداقل ۳۰ حرف)' : 'Professional Bio (Min 30 chars)'}
                placeholder={isPersian ? 'درباره سوابق تدریس، تحصیلات و تخصص‌های خود بنویسید...' : 'Share your background, teaching experience, and credentials...'}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
              />

              <Input
                label={isPersian ? 'بیوگرافی کوتاه مدرس برای کاتالوگ دوره‌ها (نمایش در کارت دوره)' : 'Short Teacher Bio for Course Cards (Catalogue Display)'}
                placeholder={isPersian ? 'خلاصه‌ای کوتاه (۱ تا ۲ جمله) که در کنار عکس دوره در کاتالوگ نمایش داده می‌شود...' : 'A brief 1-2 sentence summary displayed next to course cover image in catalogue...'}
                value={shortBio}
                onChangeText={setShortBio}
                multiline
                numberOfLines={2}
              />
            </Card>

            <Card style={{ padding: 18, borderRadius: 20, marginBottom: 16 }}>
              <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 12 }}>
                2. {isPersian ? 'حوزه‌های تدریس و زبان‌ها' : 'Teaching Expertise & Languages'}
              </Text>

              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>
                {isPersian ? 'حوزه تخصص دوره‌ها (حداقل یک مورد):' : 'Subject Categories (Select at least one):'}
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {COURSE_CATEGORIES.map((cat) => {
                  const selected = expertise.includes(cat);
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => toggleExpertise(cat)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 12,
                        backgroundColor: selected ? colors.gold : isDark ? '#1E293B' : '#F1F5F9',
                        borderWidth: 1,
                        borderColor: selected ? colors.gold : colors.cardBorder,
                      }}
                    >
                      <Text
                        style={{
                          color: selected ? (isDark ? '#0F172A' : '#FFFFFF') : colors.text,
                          fontWeight: selected ? '800' : '600',
                          fontSize: 12,
                        }}
                      >
                        {cat} {selected ? '✓' : '+'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>
                {isPersian ? 'زبان‌های تدریس:' : 'Teaching Languages:'}
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-2">
                {TEACHING_LANGUAGES.map((lang) => {
                  const selected = teachingLanguages.includes(lang.code);
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      onPress={() => toggleLanguage(lang.code)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 12,
                        backgroundColor: selected ? colors.primary : isDark ? '#1E293B' : '#F1F5F9',
                        borderWidth: 1,
                        borderColor: selected ? colors.gold : colors.cardBorder,
                      }}
                    >
                      <Text
                        style={{
                          color: selected ? '#FFFFFF' : colors.text,
                          fontWeight: selected ? '800' : '600',
                          fontSize: 12,
                        }}
                      >
                        {lang.labelEn} {selected ? '✓' : '+'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>

            <Card style={{ padding: 18, borderRadius: 20, marginBottom: 16 }}>
              <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 12 }}>
                3. {isPersian ? 'لینک‌ها و ایده دوره آزمایشی' : 'Links & Course Proposal'}
              </Text>

              <Input
                label={isPersian ? 'لینک رزومه یا لینکدین / وبسایت' : 'Portfolio / LinkedIn / Website URL'}
                placeholder="https://linkedin.com/in/username"
                value={portfolioLink}
                onChangeText={setPortfolioLink}
                autoCapitalize="none"
              />

              <Input
                label={isPersian ? 'کانال یوتیوب یا نمونه تدریس ویدیویی (اختیاری)' : 'YouTube Channel or Sample Video URL (Optional)'}
                placeholder="https://youtube.com/@channel or video URL"
                value={youtubeChannel}
                onChangeText={setYoutubeChannel}
                autoCapitalize="none"
              />

              <Input
                label={isPersian ? 'طرح و ایده اولیه اولین دوره شما (حداقل ۲۰ حرف)' : 'Proposed First Course Idea (Min 20 chars)'}
                placeholder={isPersian ? 'عنوان و رئوس مطالبی که قصد دارید تدریس فرمایید را شرح دهید...' : 'Briefly describe the title, target audience, and outline of your proposed course...'}
                value={sampleCourseIdea}
                onChangeText={setSampleCourseIdea}
                multiline
                numberOfLines={3}
              />
            </Card>

            {/* Terms and Acceptance */}
            <TouchableOpacity
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#F8FAFC',
                borderWidth: 1,
                borderColor: acceptedTerms ? colors.gold : colors.cardBorder,
                borderRadius: 16,
                padding: 14,
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: acceptedTerms ? colors.gold : colors.textSecondary,
                  backgroundColor: acceptedTerms ? colors.gold : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 2,
                }}
              >
                {acceptedTerms && <Text style={{ color: '#0F172A', fontWeight: '900', fontSize: 12 }}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>
                  {isPersian ? 'تعهد به کیفیت آکادمیک و حق مؤلف' : 'Academic Standards & Copyright Agreement'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4, lineHeight: 16 }}>
                  {isPersian
                    ? 'اینجانب تأیید می‌کنم که محتوای دوره‌ها اصیل و غیرکپی‌برداری است، سوالات و آزمون‌ها با استانداردهای FARUKH.ORG تدوین خواهد شد و از اطلاعات محرمانه دانش‌آموزان محافظت می‌گردد.'
                    : 'I agree that all course materials will be original, adhere to FARUKH.ORG educational guidelines, respect intellectual property, and protect student privacy.'}
                </Text>
              </View>
            </TouchableOpacity>

            <Button
              title={
                submitMutation.isPending
                  ? isPersian ? 'در حال ثبت درخواست...' : 'Submitting Application...'
                  : isPersian ? 'ارسال درخواست مربی‌گری 🚀' : 'Submit Application 🚀'
              }
              onPress={() => submitMutation.mutate()}
              loading={submitMutation.isPending}
              disabled={isCooldownActive || submitMutation.isPending}
            />
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}
