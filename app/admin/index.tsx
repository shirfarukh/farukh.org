import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
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
import { getAdminCourses, createOrUpdateCourse, deleteCourse } from '../../src/features/admin/adminApi';
import { extractYouTubeId } from '../../src/lib/utils';
import { CategorySelector } from '../../src/components/ui/CategorySelector';
import { CourseImageInput } from '../../src/components/ui/CourseImageInput';

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
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
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
        status: 'published',
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
      setDescription('');
      setBody('');
      setKeywordsInput('');
      setYoutubeUrl('');
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create course');
    },
  });

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
              onPress={() => router.push('/admin/blog' as any)}
              style={{
                backgroundColor: '#1E293B',
                borderColor: '#FACC15',
                borderWidth: 1,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FACC15', fontWeight: '800', fontSize: 13 }}>
                ✍️ {isPersian ? 'استودیو وبلاگ' : 'Blog Studio'}
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
              <Badge label="STATUS: PUBLISHED" variant="success" />
            </View>

            {formError ? (
              <View className="mb-4 p-3 bg-red-950/60 border border-red-700/60 rounded-xl">
                <Text className="text-red-300 text-xs font-semibold">{formError}</Text>
              </View>
            ) : null}

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
                        {item.youtubeVideoId && (
                          <Badge label="📺 YouTube" variant="danger" />
                        )}
                        <Badge label={item.status.toUpperCase()} variant={item.status === 'published' ? 'success' : 'warning'} />
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

                <View className="flex-row justify-between items-center border-t border-surface-border/60 pt-3">
                  <Text className="text-xs text-gold-400 font-semibold">
                    Pass: {item.passPercentage}% • Exam: {item.exam?.questionCount || 10} Qs
                  </Text>
                  <Text className="text-xs text-brand-400 font-bold">
                    {isPersian ? 'ویرایش محتوا و سوالات →' : 'Edit Lessons & Exam →'}
                  </Text>
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
