import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, Image, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Badge } from '../../src/components/ui/Badge';
import { useAuth } from '../../src/features/auth/useAuth';
import { useTheme } from '../../src/features/theme/ThemeContext';
import { COURSE_CATEGORIES, Course } from '../../src/types/course';
import { getInstructorCourses } from '../../src/features/instructor/instructorApi';
import { collection, addDoc, serverTimestamp } from '@firebase/firestore';
import { db } from '../../src/lib/firebase';
import { cleanFirestoreData, extractYouTubeId } from '../../src/lib/utils';
import { CategorySelector } from '../../src/components/ui/CategorySelector';
import { CourseImageInput } from '../../src/components/ui/CourseImageInput';

export default function InstructorDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isPersian = i18n.language?.startsWith('fa');

  // Filter state
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'draft' | 'in_review' | 'published' | 'changes_requested' | 'archived'>('all');

  // Create course modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [faTitle, setFaTitle] = useState('');
  const [category, setCategory] = useState<string>('AI & Tech');
  const [description, setDescription] = useState('');
  const [faDescription, setFaDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [instructorBio, setInstructorBio] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch courses owned by current instructor
  const { data: courses = [], isLoading, refetch } = useQuery({
    queryKey: ['instructorCourses', user?.uid],
    queryFn: () => (user?.uid ? getInstructorCourses(user.uid) : Promise.resolve([])),
    enabled: !!user?.uid,
  });

  // Calculate aggregate metrics (zero student PII)
  const metrics = useMemo(() => {
    const total = courses.length;
    const published = courses.filter((c) => c.status === 'published' && !c.isArchived).length;
    const inReview = courses.filter((c) => c.status === 'in_review').length;
    const drafts = courses.filter((c) => c.status === 'draft' || c.status === 'changes_requested').length;
    return { total, published, inReview, drafts };
  }, [courses]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    if (selectedFilter === 'all') return courses;
    if (selectedFilter === 'archived') return courses.filter((c) => c.isArchived);
    return courses.filter((c) => c.status === selectedFilter && !c.isArchived);
  }, [courses, selectedFilter]);

  // Create course mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      setFormError('');
      if (!user) throw new Error('Not authenticated');
      if (!title.trim()) throw new Error('Course English title is required');
      if (!faTitle.trim()) throw new Error('Course Persian title is required');

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || `course-${Date.now()}`;

      const videoId = extractYouTubeId(youtubeUrl);

      const coursePayload = cleanFirestoreData({
        title: title.trim(),
        faTitle: faTitle.trim(),
        slug,
        category: category || 'AI & Tech',
        coverUrl: coverUrl.trim() || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop',
        description: description.trim() || title.trim(),
        faDescription: faDescription.trim() || faTitle.trim(),
        youtubeUrl: youtubeUrl.trim() || undefined,
        youtubeVideoId: videoId || undefined,
        instructorBio: instructorBio.trim() || undefined,
        ownerBio: instructorBio.trim() || undefined,
        status: 'draft', // Instructors always start in draft
        ownerId: user.uid,
        ownerName: user.displayName || user.email || 'Instructor',
        isArchived: false,
        hasDraftRevision: false,
        isUnfinished: false,
        passPercentage: 80,
        exam: { questionCount: 10, timeLimitMin: 30, maxAttempts: 3, cooldownHours: 24 },
        order: courses.length + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const docRef = await addDoc(collection(db, 'courses'), coursePayload);
      return docRef.id;
    },
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: ['instructorCourses', user?.uid] });
      setShowCreateModal(false);
      setTitle('');
      setFaTitle('');
      setDescription('');
      setFaDescription('');
      setCoverUrl('');
      setYoutubeUrl('');
      setInstructorBio('');
      setFormError('');
      router.push(`/instructor/courses/${newId}` as any);
    },
    onError: (err: any) => {
      setFormError(err?.message || 'Failed to create course');
    },
  });

  const getStatusBadge = (course: Course) => {
    if (course.isArchived) {
      return <Badge label={isPersian ? 'بایگانی شده' : 'ARCHIVED'} variant="info" />;
    }
    switch (course.status) {
      case 'published':
        return <Badge label={isPersian ? 'منتشر شده' : 'PUBLISHED'} variant="success" />;
      case 'in_review':
        return <Badge label={isPersian ? 'در حال بررسی' : 'IN REVIEW'} variant="warning" />;
      case 'changes_requested':
        return <Badge label={isPersian ? 'نیاز به اصلاح' : 'CHANGES REQ'} variant="warning" />;
      case 'rejected':
        return <Badge label={isPersian ? 'رد شده' : 'REJECTED'} variant="danger" />;
      case 'draft':
      default:
        return <Badge label={isPersian ? 'پیش‌نویس' : 'DRAFT'} variant="info" />;
    }
  };

  return (
    <ScreenWrapper scrollable>
      <View className="max-w-6xl w-full self-center px-4 py-6 pb-28">
        {/* Header Hero & Action Bar */}
        <View className="flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <View>
            <Text style={{ color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 }}>
              {isPersian ? 'استودیوی دوره‌های شما' : 'Instructor Studio'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              {isPersian
                ? 'ایجاد دوره‌ها، طراحی سرفصل‌ها و آزمون‌ها. محتوای شما پس از بررسی آکادمیک منتشر می‌شود.'
                : 'Create courses, curate lessons & quizzes. Submissions are reviewed by our academic board.'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={{
              backgroundColor: colors.gold,
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              shadowColor: colors.gold,
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 16 }}>✨</Text>
            <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
              {isPersian ? 'ایجاد دوره جدید' : 'Create New Course'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Aggregated Analytics Cards (Zero Student PII) */}
        <View className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card style={{ padding: 14, borderRadius: 16 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
              {isPersian ? 'کل دوره‌ها' : 'Total Courses'}
            </Text>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 4 }}>
              {metrics.total}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>
              {isPersian ? 'دوره‌های ساخته شده' : 'Created in workspace'}
            </Text>
          </Card>

          <Card style={{ padding: 14, borderRadius: 16 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
              {isPersian ? 'منتشر شده' : 'Published'}
            </Text>
            <Text style={{ color: colors.success, fontSize: 24, fontWeight: '900', marginTop: 4 }}>
              {metrics.published}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>
              {isPersian ? 'فعال در کاتالوگ' : 'Live on catalog'}
            </Text>
          </Card>

          <Card style={{ padding: 14, borderRadius: 16 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
              {isPersian ? 'در حال بررسی' : 'Under Review'}
            </Text>
            <Text style={{ color: colors.gold, fontSize: 24, fontWeight: '900', marginTop: 4 }}>
              {metrics.inReview}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>
              {isPersian ? 'در صف نظارت آکادمیک' : 'In review queue'}
            </Text>
          </Card>

          <Card style={{ padding: 14, borderRadius: 16 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
              {isPersian ? 'پیش‌نویس / نیاز اصلاح' : 'Drafts & Actions'}
            </Text>
            <Text style={{ color: colors.primary, fontSize: 24, fontWeight: '900', marginTop: 4 }}>
              {metrics.drafts}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>
              {isPersian ? 'در انتظار تکمیل مربی' : 'Work in progress'}
            </Text>
          </Card>
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          <View className="flex-row gap-2">
            {[
              { id: 'all', label: isPersian ? 'همه دوره‌ها' : 'All Courses' },
              { id: 'published', label: isPersian ? 'منتشر شده' : 'Published' },
              { id: 'in_review', label: isPersian ? 'در حال بررسی' : 'In Review' },
              { id: 'changes_requested', label: isPersian ? 'نیاز به اصلاح' : 'Changes Requested' },
              { id: 'draft', label: isPersian ? 'پیش‌نویس' : 'Drafts' },
              { id: 'archived', label: isPersian ? 'بایگانی' : 'Archived' },
            ].map((f) => {
              const active = selectedFilter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setSelectedFilter(f.id as any)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 12,
                    backgroundColor: active ? colors.gold : isDark ? '#1E293B' : '#F1F5F9',
                    borderWidth: 1,
                    borderColor: active ? colors.gold : colors.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      color: active ? (isDark ? '#0F172A' : '#FFFFFF') : colors.text,
                      fontSize: 12,
                      fontWeight: active ? '800' : '600',
                    }}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Courses List */}
        {isLoading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : filteredCourses.length === 0 ? (
          <Card style={{ padding: 32, alignItems: 'center', borderRadius: 20 }}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>📚</Text>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', textAlign: 'center' }}>
              {selectedFilter === 'all'
                ? isPersian ? 'هنوز دوره‌ای ایجاد نکرده‌اید' : 'No courses created yet'
                : isPersian ? 'هیچ دوره‌ای در این دسته‌بندی یافت نشد' : 'No courses match this filter'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 20 }}>
              {isPersian
                ? 'با کلیک روی دکمه زیر می‌توانید اولین دوره آموزشی خود را ثبت کنید.'
                : 'Start creating engaging video lessons and quizzes for your students.'}
            </Text>
            {selectedFilter === 'all' && (
              <Button
                title={isPersian ? 'ایجاد اولین دوره 🚀' : 'Create First Course 🚀'}
                onPress={() => setShowCreateModal(true)}
              />
            )}
          </Card>
        ) : (
          <View className="gap-4">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                style={{
                  padding: 16,
                  borderRadius: 18,
                  borderColor: course.hasDraftRevision ? colors.goldBorder : colors.cardBorder,
                  borderWidth: 1.5,
                }}
              >
                <View className="flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Left: Thumbnail & Details */}
                  <View className="flex-row items-start gap-4 flex-1">
                    <Image
                      source={{ uri: course.coverUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800' }}
                      style={{ width: 80, height: 60, borderRadius: 10, backgroundColor: '#334155' }}
                      resizeMode="cover"
                    />
                    <View className="flex-1">
                      <View className="flex-row flex-wrap items-center gap-2 mb-1">
                        {getStatusBadge(course)}
                        {course.hasDraftRevision && (
                          <Badge label={isPersian ? 'پیش‌نویس اصلاحی فعال' : 'REVISION IN DRAFT'} variant="info" />
                        )}
                        <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '700' }}>
                          {course.category}
                        </Text>
                      </View>

                      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>
                        {course.title}
                      </Text>
                      {course.faTitle && (
                        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                          {course.faTitle}
                        </Text>
                      )}

                      <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>
                        Slug: /{course.slug} • Pass: {course.passPercentage}%
                      </Text>
                    </View>
                  </View>

                  {/* Right: Actions */}
                  <View className="flex-row items-center gap-2 w-full md:w-auto justify-end">
                    <TouchableOpacity
                      onPress={() => router.push(`/instructor/courses/${course.id}` as any)}
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                        ✏️ {isPersian ? 'ویرایش سرفصل‌ها' : 'Edit Curriculum'}
                      </Text>
                    </TouchableOpacity>

                    {course.status === 'published' && (
                      <TouchableOpacity
                        onPress={() => router.push(`/course/${course.id}` as any)}
                        style={{
                          backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                          paddingHorizontal: 12,
                          paddingVertical: 9,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                        }}
                      >
                        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
                          👁️ {isPersian ? 'مشاهده زنده' : 'View Live'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Modal: Create Course */}
        <Modal
          visible={showCreateModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 16,
            }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 24,
                width: '100%',
                maxWidth: 600,
                maxHeight: '90%',
                padding: 24,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900' }}>
                  {isPersian ? 'ایجاد دوره جدید' : 'Create New Course'}
                </Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Text style={{ color: colors.textSecondary, fontSize: 18, fontWeight: '800' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {formError ? (
                  <View
                    style={{
                      backgroundColor: colors.dangerBg,
                      borderColor: colors.danger,
                      borderWidth: 1,
                      padding: 10,
                      borderRadius: 12,
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '700' }}>
                      ⚠️ {formError}
                    </Text>
                  </View>
                ) : null}

                <Input
                  label={isPersian ? 'عنوان دوره (انگلیسی)' : 'Course Title (English)'}
                  placeholder="e.g. Master Artificial Intelligence with Python"
                  value={title}
                  onChangeText={setTitle}
                />

                <Input
                  label={isPersian ? 'عنوان دوره (فارسی / دری)' : 'Course Title (Persian / Dari)'}
                  placeholder="مثلاً: دوره جامع هوش مصنوعی با پایتون"
                  value={faTitle}
                  onChangeText={setFaTitle}
                />

                <CategorySelector
                  selectedCategory={category}
                  onSelectCategory={setCategory}
                  isPersian={isPersian}
                />

                <CourseImageInput
                  label={isPersian ? 'تصویر کاور دوره' : 'Course Cover Image'}
                  value={coverUrl}
                  onChangeImage={setCoverUrl}
                />

                <Input
                  label={isPersian ? 'توضیحات کوتاه (انگلیسی)' : 'Short Description (English)'}
                  placeholder="Summary of skills learned..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />

                <Input
                  label={isPersian ? 'توضیحات کوتاه (فارسی)' : 'Short Description (Persian)'}
                  placeholder="خلاصه‌ای از آنچه دانش‌آموز در این دوره فرا می‌گیرد..."
                  value={faDescription}
                  onChangeText={setFaDescription}
                  multiline
                  numberOfLines={3}
                />

                <Input
                  label={isPersian ? 'لینک ویدیو معرفی یا پیش‌نمایش یوتیوب' : 'YouTube Intro Video URL'}
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChangeText={setYoutubeUrl}
                  autoCapitalize="none"
                />

                <Input
                  label={isPersian ? 'بیوگرافی کوتاه مدرس (نمایش در کاتالوگ)' : 'Teacher Short Bio (Catalogue Display)'}
                  placeholder={isPersian ? 'متن کوتاهی درباره سابقه و تخصص شما که در کاتالوگ در کنار عکس دوره قرار می‌گیرد...' : 'Brief bio displayed alongside the course image in the catalogue...'}
                  value={instructorBio}
                  onChangeText={setInstructorBio}
                  multiline
                  numberOfLines={2}
                />

                <View className="flex-row justify-end gap-3 mt-4">
                  <Button
                    title={isPersian ? 'انصراف' : 'Cancel'}
                    variant="secondary"
                    onPress={() => setShowCreateModal(false)}
                  />
                  <Button
                    title={
                      createMutation.isPending
                        ? isPersian ? 'در حال ایجاد...' : 'Creating...'
                        : isPersian ? 'ثبت و شروع ساخت دوره' : 'Create & Edit Course'
                    }
                    onPress={() => createMutation.mutate()}
                    loading={createMutation.isPending}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}
