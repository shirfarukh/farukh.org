import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Badge } from '../../src/components/ui/Badge';
import { AppLogo } from '../../src/components/ui/AppLogo';
import { LanguageSwitcher } from '../../src/components/ui/LanguageSwitcher';
import {
  getAdminCourses,
  createOrUpdateCourse,
  deleteCourse,
  toggleCourseVisibility,
  toggleCourseUnfinished,
} from '../../src/features/admin/adminApi';
import { extractYouTubeId } from '../../src/lib/utils';
import { CategorySelector } from '../../src/components/ui/CategorySelector';
import { CourseImageInput } from '../../src/components/ui/CourseImageInput';
import { getPendingApplications, getReviewRequests } from '../../src/features/instructor/instructorApi';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [faTitle, setFaTitle] = useState('');
  const [category, setCategory] = useState<string>('Stocks & Crypto');
  const [coverUrl, setCoverUrl] = useState('');
  const [instructorBio, setInstructorBio] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [isUnfinished, setIsUnfinished] = useState(false);
  const [formError, setFormError] = useState('');
  const [createdSuccessId, setCreatedSuccessId] = useState<string | null>(null);

  const detectedYouTubeId = extractYouTubeId(youtubeUrl);
  const keywordsList = keywordsInput
    .split(/[,،]+/)
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['adminCourses'],
    queryFn: getAdminCourses,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['adminInstructorApplications'],
    queryFn: getPendingApplications,
  });

  const { data: reviewRequests = [] } = useQuery({
    queryKey: ['adminReviewRequests'],
    queryFn: getReviewRequests,
  });

  const pendingAppsCount = applications.filter((a) => a.status === 'pending').length;
  const pendingReviewsCount = reviewRequests.filter((r) => r.status === 'pending').length;

  const createMutation = useMutation({
    mutationFn: async () => {
      setFormError('');
      if (!title.trim()) {
        throw new Error(isPersian ? 'لطفاً عنوان دوره را وارد کنید.' : 'Please enter a course title.');
      }

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || `course-${Date.now()}`;

      const videoId = detectedYouTubeId || (youtubeUrl.trim().length === 11 ? youtubeUrl.trim() : undefined);

      const newId = await createOrUpdateCourse({
        title: title.trim(),
        faTitle: faTitle.trim() || undefined,
        slug,
        category: category || 'Stocks & Crypto',
        coverUrl: coverUrl.trim() || undefined,
        description: description.trim() || (body.trim() ? body.trim().slice(0, 160) + '...' : title.trim()),
        body: body.trim() || undefined,
        keywords: keywordsList,
        youtubeUrl: youtubeUrl.trim() || undefined,
        youtubeVideoId: videoId,
        instructorBio: instructorBio.trim() || undefined,
        ownerBio: instructorBio.trim() || undefined,
        status,
        isUnfinished,
        passPercentage: 80,
        exam: { questionCount: 10, timeLimitMin: 30, maxAttempts: 3, cooldownHours: 24 },
        order: courses.length + 1,
      });

      return newId;
    },
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      setCreatedSuccessId(newId);
      setTitle('');
      setFaTitle('');
      setCategory('Stocks & Crypto');
      setCoverUrl('');
      setInstructorBio('');
      setDescription('');
      setBody('');
      setKeywordsInput('');
      setYoutubeUrl('');
      setStatus('published');
      setIsUnfinished(false);
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create course');
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      await toggleCourseVisibility(id, currentStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
    },
  });

  const toggleUnfinishedMutation = useMutation({
    mutationFn: async ({ id, currentIsUnfinished }: { id: string; currentIsUnfinished: boolean }) => {
      await toggleCourseUnfinished(id, currentIsUnfinished);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteCourse(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
    },
  });

  const handleDeleteCourse = (id: string, courseTitle: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to delete "${courseTitle}"? This cannot be undone.`)) {
        deleteMutation.mutate(id);
      }
    } else {
      Alert.alert(
        'Delete Course',
        `Are you sure you want to delete "${courseTitle}"? This will permanently remove the course and its contents.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
        ]
      );
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView className="flex-1 py-4 max-w-4xl w-full self-center">
        {/* Admin Header Banner */}
        <View className="mb-6 bg-gradient-to-r from-brand-900 via-surface-card to-brand-800 p-6 rounded-3xl border border-gold-400/40 shadow-xl flex-row justify-between items-center flex-wrap gap-4">
          <View className="flex-1 min-w-[240px]">
            <View className="flex-row items-center gap-2 mb-2">
              <Badge label="ADMIN CONTROL CENTER" variant="warning" />
              <AppLogo size={36} />
            </View>
            <Text className="text-2xl font-extrabold text-white mb-1">
              {isPersian ? 'داشبورد مدیریت دوره‌ها و محتوا' : 'Admin Control Panel'}
            </Text>
            <Text className="text-slate-300 text-xs">
              {isPersian ? 'مدیریت دوره‌ها، ایجاد محتوای جدید، سرفصل‌ها و استعلام گواهی‌نامه‌ها' : 'Create courses, edit lessons, manage question banks, and oversee students.'}
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            <LanguageSwitcher />
            <TouchableOpacity
              onPress={() => router.push('/(student)')}
              className="bg-surface-dark border border-surface-border px-3.5 py-2 rounded-xl"
            >
              <Text className="text-gold-300 font-bold text-xs">
                ← {isPersian ? 'بازگشت به سایت' : 'Exit Admin'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions & Add Course Banner */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-1 mr-3">
            <Text className="text-xl font-bold text-white">
              {isPersian ? 'دوره‌های موجود' : 'Active Courses'}
            </Text>
            <Text className="text-xs text-slate-400">
              {isPersian ? 'دوره‌ها را مدیریت کنید یا دوره جدید ایجاد نمایید' : 'Manage existing courses or create a new course for students'}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => router.push('/admin/certificates' as any)}
              style={{
                backgroundColor: '#1E293B',
                borderColor: '#3B82F6',
                borderWidth: 1,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#60A5FA', fontWeight: '800', fontSize: 13 }}>
                🎓 {isPersian ? 'تصدیق‌نامه‌ها' : 'Certificates'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/admin/instructor-applications' as any)}
              style={{
                backgroundColor: '#1E293B',
                borderColor: pendingAppsCount > 0 ? '#F59E0B' : '#334155',
                borderWidth: 1,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Text style={{ color: '#FCD34D', fontWeight: '800', fontSize: 13 }}>
                👨‍🏫 {isPersian ? 'متقاضیان مربی‌گری' : 'Instructor Apps'}
              </Text>
              {pendingAppsCount > 0 && (
                <View style={{ backgroundColor: '#F59E0B', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 }}>
                  <Text style={{ color: '#0F172A', fontWeight: '900', fontSize: 11 }}>{pendingAppsCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/admin/reviews' as any)}
              style={{
                backgroundColor: '#1E293B',
                borderColor: pendingReviewsCount > 0 ? '#10B981' : '#334155',
                borderWidth: 1,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Text style={{ color: '#34D399', fontWeight: '800', fontSize: 13 }}>
                📋 {isPersian ? 'صف بازبینی دوره‌ها' : 'Course Reviews'}
              </Text>
              {pendingReviewsCount > 0 && (
                <View style={{ backgroundColor: '#10B981', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 }}>
                  <Text style={{ color: '#0F172A', fontWeight: '900', fontSize: 11 }}>{pendingReviewsCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/admin/blog' as any)}
              style={{
                backgroundColor: '#1E293B',
                borderColor: '#FACC15',
                borderWidth: 1,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FACC15', fontWeight: '800', fontSize: 13 }}>
                ✍️ {isPersian ? 'وبلاگ' : 'Blog'}
              </Text>
            </TouchableOpacity>

            <Button
              title={showCreate ? (isPersian ? 'بستن فرم' : 'Close Form') : (isPersian ? '+ ایجاد دوره جدید' : '+ Add Course')}
              variant={showCreate ? 'secondary' : 'primary'}
              onPress={() => {
                setShowCreate(!showCreate);
                if (createdSuccessId) setCreatedSuccessId(null);
              }}
              className="shadow-lg shadow-brand-900"
            />
          </View>
        </View>

        {/* Creation Success Banner */}
        {createdSuccessId && (
          <Card className="mb-6 border-emerald-500/80 bg-emerald-950/30 p-5">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl">🎉</Text>
                <View>
                  <Text className="text-emerald-400 font-extrabold text-base">
                    {isPersian ? 'دوره با موفقیت در پایگاه داده ایجاد شد!' : 'Course successfully created in database!'}
                  </Text>
                  <Text className="text-slate-300 text-xs mt-0.5">
                    {isPersian ? 'اکنون می‌توانید سرفصل‌ها، ویدیوهای هر درس و سوالات آزمون را تنظیم کنید.' : 'You can now add modules, lessons, and exam pool questions.'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setCreatedSuccessId(null)}>
                <Text className="text-slate-400 font-bold text-sm">✕</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-3 mt-1">
              <Button
                title={isPersian ? 'تنظیم سرفصل‌ها و درس‌ها →' : 'Edit Curriculum & Lessons →'}
                onPress={() => router.push(`/admin/courses/${createdSuccessId}` as any)}
                variant="primary"
                className="flex-1"
              />
              <Button
                title={isPersian ? 'ایجاد یک دوره دیگر' : 'Add Another Course'}
                onPress={() => {
                  setCreatedSuccessId(null);
                  setShowCreate(true);
                }}
                variant="secondary"
              />
            </View>
          </Card>
        )}

        {/* Add Course Form Card */}
        {showCreate && (
          <Card className="mb-6 border-gold-400 bg-surface-card p-6 shadow-2xl">
            <View className="flex-row items-center justify-between mb-4 border-b border-surface-border pb-3">
              <View>
                <Text className="text-lg font-extrabold text-white">
                  ✨ {isPersian ? 'ایجاد دوره جدید' : 'Create New Course'}
                </Text>
                <Text className="text-slate-400 text-xs">
                  {isPersian ? 'اطلاعات، متن، کلیدواژه‌ها و لینک یوتیوب دوره را وارد نمایید' : 'Enter course title, body content, keywords, and optional YouTube link'}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Badge label={status.toUpperCase()} variant={status === 'published' ? 'success' : 'warning'} />
                {isUnfinished && <Badge label="UNFINISHED" variant="warning" />}
              </View>
            </View>

            {formError ? (
              <View className="mb-4 p-3 bg-red-950/60 border border-red-700/60 rounded-xl">
                <Text className="text-red-300 text-xs font-semibold">{formError}</Text>
              </View>
            ) : null}

            {/* Visibility Status Selection */}
            <View className="mb-4">
              <Text className="text-white text-xs font-bold mb-2">
                {isPersian ? 'وضعیت انتشار و دیداری (مخفی یا عمومی)' : 'Visibility Status (Hide / Unhide)'}
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setStatus('published')}
                  className={`flex-1 py-2.5 px-3 rounded-xl border items-center ${
                    status === 'published'
                      ? 'bg-emerald-950/80 border-emerald-500'
                      : 'bg-surface-dark border-surface-border'
                  }`}
                >
                  <Text className={`text-xs font-bold ${status === 'published' ? 'text-emerald-300' : 'text-slate-400'}`}>
                    ✓ {isPersian ? 'منتشر شده (قابل مشاهده دانشجویان)' : 'Published (Visible to Students)'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setStatus('draft')}
                  className={`flex-1 py-2.5 px-3 rounded-xl border items-center ${
                    status === 'draft'
                      ? 'bg-amber-950/80 border-amber-500'
                      : 'bg-surface-dark border-surface-border'
                  }`}
                >
                  <Text className={`text-xs font-bold ${status === 'draft' ? 'text-amber-300' : 'text-slate-400'}`}>
                    👁️ {isPersian ? 'مخفی / پیش‌نویس (فقط ادمین)' : 'Hidden / Draft (Admin Only)'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Unfinished Course Toggle */}
            <TouchableOpacity
              onPress={() => setIsUnfinished(!isUnfinished)}
              className={`mb-4 p-3.5 rounded-xl border flex-row items-center gap-3 ${
                isUnfinished
                  ? 'bg-amber-950/60 border-amber-500/70'
                  : 'bg-surface-dark border-surface-border'
              }`}
            >
              <View
                className={`w-6 h-6 rounded-md items-center justify-center border ${
                  isUnfinished
                    ? 'bg-amber-500 border-amber-400'
                    : 'border-slate-600 bg-surface-card'
                }`}
              >
                {isUnfinished && <Text className="text-black font-extrabold text-xs">✓</Text>}
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-xs">
                  {isPersian
                    ? 'علامت‌گذاری به عنوان دوره تکمیل‌نشده (عدم صدور تصدیق‌نامه)'
                    : 'Mark as Unfinished Course (Block Certificate Issuance)'}
                </Text>
                <Text className="text-slate-400 text-[11px] mt-0.5">
                  {isPersian
                    ? 'دانشجویان می‌توانند درس‌های بارگذاری شده را مطالعه کنند، اما تا زمان تکمیل نهایی، تصدیق‌نامه صادر نمی‌گردد.'
                    : 'Students can study released lessons, but certificates will NOT be issued until marked complete.'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Title Inputs */}
            <View className="mb-1">
              <Input
                label={isPersian ? 'عنوان دوره (انگلیسی) *' : 'Course Title *'}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Artificial Intelligence & Prompt Engineering"
              />
            </View>

            <View className="mb-1">
              <Input
                label={isPersian ? 'عنوان دوره (فارسی)' : 'Course Title (Persian / Alternative)'}
                value={faTitle}
                onChangeText={setFaTitle}
                placeholder="مثال: هوش مصنوعی و مهندسی پرامپت"
              />
            </View>

            {/* Category Selector (Stocks & Crypto, Ecommerce, Languages, Morals) */}
            <CategorySelector
              selectedCategory={category}
              onSelectCategory={setCategory}
              isPersian={isPersian}
              label={isPersian ? 'دسته‌بندی دوره *' : 'Course Category *'}
            />

            {/* Course Cover / Feature Image Input */}
            <CourseImageInput
              value={coverUrl}
              onChangeImage={setCoverUrl}
              label={isPersian ? 'تصویر کاور / شاخص دوره (آپلود یا لینک تصویر)' : 'Course Feature Image (Upload or Link Image)'}
            />

            {/* Description / Summary */}
            <View className="mb-1">
              <Input
                label={isPersian ? 'خلاصه دوره' : 'Short Description / Summary'}
                value={description}
                onChangeText={setDescription}
                placeholder="A concise 1-2 sentence overview of the course..."
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Course Body */}
            <View className="mb-1">
              <Input
                label={isPersian ? 'متن و سرفصل‌های اصلی دوره (Body)' : 'Course Body & Detailed Syllabus'}
                value={body}
                onChangeText={setBody}
                placeholder="Detailed curriculum overview, prerequisites, target audience, and key concepts covered..."
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Teacher Short Bio */}
            <View className="mb-2">
              <Input
                label={isPersian ? 'بیوگرافی کوتاه مدرس (نمایش در نیمه دوم باکس کاتالوگ)' : 'Teacher Short Bio (Displayed on the other half of Catalogue Box)'}
                value={instructorBio}
                onChangeText={setInstructorBio}
                placeholder="1-2 sentences about teacher credentials..."
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Keywords */}
            <View className="mb-2">
              <Input
                label={isPersian ? 'کلیدواژه‌های دوره (با کاما جدا کنید)' : 'Course Keywords / Tags (comma-separated)'}
                value={keywordsInput}
                onChangeText={setKeywordsInput}
                placeholder="e.g. AI, Deep Learning, Python, Automation"
              />
              {keywordsList.length > 0 && (
                <View className="flex-row flex-wrap gap-1.5 mt-1.5 mb-2">
                  {keywordsList.map((kw, idx) => (
                    <View key={idx} className="bg-brand-900/60 border border-brand-500/40 px-2.5 py-1 rounded-full">
                      <Text className="text-brand-300 text-[11px] font-semibold">#{kw}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* YouTube Link */}
            <View className="mb-4">
              <Input
                label={isPersian ? 'لینک یا شناسه ویدیوی یوتیوب (اختیاری)' : 'YouTube Video Link (Optional)'}
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
                placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              />
              {detectedYouTubeId ? (
                <View className="mt-2 p-3 bg-surface-dark/90 rounded-xl border border-emerald-500/50 flex-row items-center gap-3">
                  <Image
                    source={{ uri: `https://img.youtube.com/vi/${detectedYouTubeId}/mqdefault.jpg` }}
                    style={{ width: 80, height: 48, borderRadius: 8 }}
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-emerald-400 font-bold text-xs">✓ Valid YouTube Video</Text>
                    </View>
                    <Text className="text-slate-400 text-[11px]">ID: {detectedYouTubeId}</Text>
                  </View>
                </View>
              ) : youtubeUrl.trim().length > 0 ? (
                <Text className="text-amber-400 text-[11px] mt-1">
                  ⚠️ Enter a full YouTube URL or valid 11-character video ID
                </Text>
              ) : null}
            </View>

            <View className="flex-row gap-3">
              <Button
                title={isPersian ? 'ذخیره و انتشار دوره در پایگاه داده' : 'Save Course to Firebase'}
                onPress={() => createMutation.mutate()}
                loading={createMutation.isPending}
                className="flex-1"
              />
              <Button
                title={isPersian ? 'انصراف' : 'Cancel'}
                variant="outline"
                onPress={() => setShowCreate(false)}
              />
            </View>
          </Card>
        )}

        {/* Metrics Grid */}
        <View className="flex-row flex-wrap justify-between mb-6">
          <View className="w-[48%] md:w-[23%] bg-surface-card border border-surface-border p-4 rounded-2xl mb-3">
            <Text className="text-slate-400 text-xs font-medium mb-1">Total Courses</Text>
            <Text className="text-3xl font-extrabold text-gold-400">{courses.length}</Text>
          </View>
          <View className="w-[48%] md:w-[23%] bg-surface-card border border-surface-border p-4 rounded-2xl mb-3">
            <Text className="text-slate-400 text-xs font-medium mb-1">Active Students</Text>
            <Text className="text-3xl font-extrabold text-brand-400">24</Text>
          </View>
          <View className="w-[48%] md:w-[23%] bg-surface-card border border-surface-border p-4 rounded-2xl mb-3">
            <Text className="text-slate-400 text-xs font-medium mb-1">Certificates Issued</Text>
            <Text className="text-3xl font-extrabold text-emerald-400">18</Text>
          </View>
          <View className="w-[48%] md:w-[23%] bg-surface-card border border-surface-border p-4 rounded-2xl mb-3">
            <Text className="text-slate-400 text-xs font-medium mb-1">Pass Rate</Text>
            <Text className="text-3xl font-extrabold text-amber-400">92%</Text>
          </View>
        </View>

        {/* Course List */}
        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#FACC15" />
          </View>
        ) : (
          <View>
            {courses.map((item) => (
              <Card
                key={item.id || item.slug}
                onPress={() => router.push(`/admin/courses/${item.id}` as any)}
                className="mb-4 border-surface-border bg-surface-card hover:bg-surface-hover p-5"
              >
                <View className="flex-row gap-4 items-start mb-2">
                  {item.coverUrl ? (
                    <Image
                      source={{ uri: item.coverUrl }}
                      style={{ width: 115, height: 92, borderRadius: 12, backgroundColor: '#1E293B', aspectRatio: 5 / 4 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 115,
                        height: 92,
                        borderRadius: 12,
                        backgroundColor: '#1E293B',
                        borderWidth: 1,
                        borderColor: '#334155',
                        justifyContent: 'center',
                        alignItems: 'center',
                        aspectRatio: 5 / 4,
                      }}
                    >
                      <Text style={{ fontSize: 26 }}>📚</Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start mb-1">
                      <View className="flex-1 mr-2">
                        <Text className="text-lg font-bold text-white mb-0.5">
                          {isPersian && item.faTitle ? item.faTitle : item.title}
                        </Text>
                        {item.faTitle && (
                          <Text className="text-slate-400 text-xs">
                            {item.title}
                          </Text>
                        )}
                      </View>
                      <View className="flex-row gap-1.5 items-center flex-wrap">
                        {item.category && (
                          <View className="bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 rounded-md">
                            <Text className="text-amber-300 text-[10px] font-bold">{item.category}</Text>
                          </View>
                        )}
                        {item.status === 'published' ? (
                          <Badge label="PUBLISHED" variant="success" />
                        ) : (
                          <Badge label="HIDDEN (DRAFT)" variant="warning" />
                        )}
                        {item.isUnfinished ? (
                          <Badge label="⏳ UNFINISHED (NO CERT)" variant="warning" />
                        ) : (
                          <Badge label="🎓 COMPLETE" variant="success" />
                        )}
                        {item.youtubeVideoId && (
                          <Badge label="📺 YouTube" variant="danger" />
                        )}
                      </View>
                    </View>

                    <Text className="text-slate-300 text-sm mb-2" numberOfLines={2}>
                      {item.body ? item.body : (isPersian && item.faDescription ? item.faDescription : item.description)}
                    </Text>

                    {/* Keywords positioned next to the thumbnail */}
                    {item.keywords && item.keywords.length > 0 && (
                      <View className="flex-row flex-wrap gap-1.5 mt-1 mb-1">
                        {item.keywords.map((kw, i) => (
                          <Text key={i} className="text-brand-300 text-[10px] bg-brand-950/80 border border-brand-800/60 px-2 py-0.5 rounded-md font-medium">
                            #{kw}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Course Action Toolbar */}
                <View className="border-t border-surface-border/60 pt-3 mt-1 flex-row justify-between items-center flex-wrap gap-2">
                  <Text className="text-xs text-gold-400 font-semibold">
                    Pass: {item.passPercentage || 80}% • Exam: {item.exam?.questionCount || 10} Qs
                  </Text>

                  <View className="flex-row items-center gap-1.5 flex-wrap">
                    {/* Hide / Unhide button */}
                    <TouchableOpacity
                      onPress={() => item.id && toggleVisibilityMutation.mutate({ id: item.id, currentStatus: item.status || 'published' })}
                      disabled={toggleVisibilityMutation.isPending}
                      className={`px-2.5 py-1.5 rounded-lg border flex-row items-center gap-1 ${
                        item.status === 'published'
                          ? 'bg-surface-dark border-slate-700'
                          : 'bg-emerald-950/80 border-emerald-500/60'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${item.status === 'published' ? 'text-slate-300' : 'text-emerald-300'}`}>
                        {item.status === 'published'
                          ? (isPersian ? '👁️ مخفی' : '👁️ Hide')
                          : (isPersian ? '👁️ انتشار' : '👁️ Publish')}
                      </Text>
                    </TouchableOpacity>

                    {/* Mark Unfinished / Complete */}
                    <TouchableOpacity
                      onPress={() => item.id && toggleUnfinishedMutation.mutate({ id: item.id, currentIsUnfinished: !!item.isUnfinished })}
                      disabled={toggleUnfinishedMutation.isPending}
                      className={`px-2.5 py-1.5 rounded-lg border flex-row items-center gap-1 ${
                        item.isUnfinished
                          ? 'bg-emerald-950/80 border-emerald-500/60'
                          : 'bg-amber-950/80 border-amber-500/60'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${item.isUnfinished ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {item.isUnfinished
                          ? (isPersian ? '✓ تکمیل شد' : '✓ Mark Complete')
                          : (isPersian ? '⏳ ناتمام' : '⏳ Mark Unfinished')}
                      </Text>
                    </TouchableOpacity>

                    {/* Edit Lessons & Exam */}
                    <TouchableOpacity
                      onPress={() => router.push(`/admin/courses/${item.id}` as any)}
                      className="px-2.5 py-1.5 rounded-lg bg-brand-900/60 border border-brand-500/40 flex-row items-center gap-1"
                    >
                      <Text className="text-xs font-bold text-brand-300">
                        ✎ {isPersian ? 'ویرایش محتوا و سوالات' : 'Edit Lessons & Exam'}
                      </Text>
                    </TouchableOpacity>

                    {/* Delete Course */}
                    <TouchableOpacity
                      onPress={() => item.id && handleDeleteCourse(item.id, item.title)}
                      disabled={deleteMutation.isPending}
                      className="px-2.5 py-1.5 rounded-lg bg-red-950/60 border border-red-700/60 flex-row items-center gap-1"
                    >
                      <Text className="text-xs font-bold text-red-300">
                        🗑️ {isPersian ? 'حذف' : 'Delete'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Management Quick Links */}
        <Text className="text-lg font-bold text-white mb-3 mt-4">
          {isPersian ? 'سایر بخش‌های مدیریت' : 'Additional Management'}
        </Text>

        <Card onPress={() => router.push('/admin/blog' as any)} className="mb-4 border-amber-500/40">
          <View className="flex-row justify-between items-center">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center gap-2 mb-1">
                <Text style={{ fontSize: 18 }}>✍️</Text>
                <Text className="text-white text-base font-bold">
                  {isPersian ? 'استودیو نگارش و انتشار وبلاگ' : 'Blog & Articles Publishing Studio'}
                </Text>
                <Badge label="PUBLISH" variant="warning" />
              </View>
              <Text className="text-slate-400 text-xs mt-0.5">
                {isPersian
                  ? 'نگارش مقالات جدید، انتخاب دسته‌بندی و انتشار مستقیم در صفحه وبلاگ دانشجویان'
                  : 'Write and publish new articles, select academy categories, and manage blog insights live'}
              </Text>
            </View>
            <Text className="text-gold-400 text-lg font-bold">→</Text>
          </View>
        </Card>

        <Card onPress={() => router.push('/admin/students')} className="mb-4">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white text-base font-bold">Student Roster & CSV Import</Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                Bulk import student accounts, reset course attempts, and view user metrics
              </Text>
            </View>
            <Text className="text-gold-400 text-lg font-bold">→</Text>
          </View>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}
