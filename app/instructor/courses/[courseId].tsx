import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  serverTimestamp,
} from '@firebase/firestore';
import { db } from '../../../src/lib/firebase';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { Badge } from '../../../src/components/ui/Badge';
import { CategorySelector } from '../../../src/components/ui/CategorySelector';
import { CourseImageInput } from '../../../src/components/ui/CourseImageInput';
import { useAuth } from '../../../src/features/auth/useAuth';
import { useTheme } from '../../../src/features/theme/ThemeContext';
import { Course, COURSE_CATEGORIES, Module } from '../../../src/types/course';
import { Lesson } from '../../../src/types/lesson';
import { cleanFirestoreData, extractYouTubeId } from '../../../src/lib/utils';
import {
  submitCourseReviewCallable,
  requestCourseArchiveOrDeleteCallable,
} from '../../../src/features/instructor/instructorApi';

export default function InstructorCourseEditScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isPersian = i18n.language?.startsWith('fa');

  // Course Details State
  const [title, setTitle] = useState('');
  const [faTitle, setFaTitle] = useState('');
  const [category, setCategory] = useState<string>('AI & Tech');
  const [description, setDescription] = useState('');
  const [faDescription, setFaDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [instructorBio, setInstructorBio] = useState('');
  const [passPercentage, setPassPercentage] = useState('80');

  // Module & Lesson State
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDuration, setLessonDuration] = useState('10:00');
  const [lessonYoutubeUrl, setLessonYoutubeUrl] = useState('');
  const [lessonContent, setLessonContent] = useState('');

  // Lesson Quiz inside Lesson Form
  const [quizQuestionText, setQuizQuestionText] = useState('');
  const [quizOpt1, setQuizOpt1] = useState('');
  const [quizOpt2, setQuizOpt2] = useState('');
  const [quizOpt3, setQuizOpt3] = useState('');
  const [quizOpt4, setQuizOpt4] = useState('');
  const [quizCorrect, setQuizCorrect] = useState<'1' | '2' | '3' | '4'>('1');

  // Review & Archive Modals
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveAction, setArchiveAction] = useState<'archive' | 'delete'>('archive');
  const [archiveReason, setArchiveReason] = useState('');

  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // 1. Fetch Live Course
  const { data: liveCourse, isLoading: loadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const snap = await getDoc(doc(db, 'courses', courseId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Course;
    },
    enabled: !!courseId,
  });

  const isLivePublished = liveCourse?.status === 'published';
  const effectiveCol = isLivePublished ? 'courseDrafts' : 'courses';

  // 2. Fetch Draft Course if live is published
  const { data: draftCourse, isLoading: loadingDraft } = useQuery({
    queryKey: ['courseDraft', courseId],
    queryFn: async () => {
      if (!courseId || !isLivePublished) return null;
      const snap = await getDoc(doc(db, 'courseDrafts', courseId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Course;
      }
      return null;
    },
    enabled: !!courseId && isLivePublished,
  });

  // Effective course object being edited
  const activeCourse = (isLivePublished ? draftCourse : liveCourse) || liveCourse;

  // Initialize form fields
  useEffect(() => {
    if (activeCourse) {
      setTitle(activeCourse.title || '');
      setFaTitle(activeCourse.faTitle || '');
      setCategory(activeCourse.category || 'AI & Tech');
      setDescription(activeCourse.description || '');
      setFaDescription(activeCourse.faDescription || '');
      setCoverUrl(activeCourse.coverUrl || '');
      setYoutubeUrl(activeCourse.youtubeUrl || (activeCourse.youtubeVideoId ? `https://www.youtube.com/watch?v=${activeCourse.youtubeVideoId}` : ''));
      setInstructorBio(activeCourse.instructorBio || (activeCourse as any).ownerBio || '');
      setPassPercentage(activeCourse.passPercentage ? String(activeCourse.passPercentage) : '80');
    }
  }, [activeCourse]);

  // 3. Fetch Modules
  const { data: modules = [], refetch: refetchModules } = useQuery({
    queryKey: ['instructorModules', effectiveCol, courseId],
    queryFn: async () => {
      if (!courseId) return [];
      let q = query(collection(db, effectiveCol, courseId, 'modules'), orderBy('order', 'asc'));
      let snap = await getDocs(q);
      // Fallback: If draft modules empty and published, read from live
      if (snap.empty && isLivePublished) {
        q = query(collection(db, 'courses', courseId, 'modules'), orderBy('order', 'asc'));
        snap = await getDocs(q);
      }
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Module));
    },
    enabled: !!courseId,
  });

  // 4. Fetch Lessons
  const { data: lessons = [], refetch: refetchLessons } = useQuery({
    queryKey: ['instructorLessons', effectiveCol, courseId],
    queryFn: async () => {
      if (!courseId) return [];
      let q = query(collection(db, effectiveCol, courseId, 'lessons'), orderBy('order', 'asc'));
      let snap = await getDocs(q);
      if (snap.empty && isLivePublished) {
        q = query(collection(db, 'courses', courseId, 'lessons'), orderBy('order', 'asc'));
        snap = await getDocs(q);
      }
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Lesson));
    },
    enabled: !!courseId,
  });

  // Pre-flight checks
  const checklist = useMemo(() => {
    const hasEnTitle = title.trim().length >= 2;
    const hasFaTitle = faTitle.trim().length >= 2;
    const hasEnDesc = description.trim().length >= 10;
    const hasFaDesc = faDescription.trim().length >= 10;
    const validVideo = !!extractYouTubeId(youtubeUrl);
    const hasModules = modules.length >= 1;
    const hasLessons = lessons.length >= 1;
    const readyForReview = hasEnTitle && hasFaTitle && hasEnDesc && hasFaDesc && validVideo && hasModules && hasLessons;
    return {
      hasEnTitle,
      hasFaTitle,
      hasEnDesc,
      hasFaDesc,
      validVideo,
      hasModules,
      hasLessons,
      readyForReview,
    };
  }, [title, faTitle, description, faDescription, youtubeUrl, modules, lessons]);

  // Save General Details Mutation
  const saveDetailsMutation = useMutation({
    mutationFn: async () => {
      if (!courseId || !user) return;
      const videoId = extractYouTubeId(youtubeUrl);
      const payload = cleanFirestoreData({
        title: title.trim(),
        faTitle: faTitle.trim(),
        category,
        description: description.trim(),
        faDescription: faDescription.trim(),
        coverUrl: coverUrl.trim(),
        youtubeUrl: youtubeUrl.trim(),
        youtubeVideoId: videoId,
        instructorBio: instructorBio.trim() || undefined,
        ownerBio: instructorBio.trim() || undefined,
        passPercentage: parseInt(passPercentage, 10) || 80,
        ownerId: activeCourse?.ownerId || user.uid,
        updatedAt: serverTimestamp(),
      });

      if (isLivePublished) {
        // Save to courseDrafts
        await setDoc(doc(db, 'courseDrafts', courseId), payload, { merge: true });
        await setDoc(doc(db, 'courses', courseId), { hasDraftRevision: true, updatedAt: serverTimestamp() }, { merge: true });
      } else {
        await setDoc(doc(db, 'courses', courseId), payload, { merge: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courseDraft', courseId] });
      setStatusMessage({ text: isPersian ? 'اطلاعات با موفقیت ذخیره شد!' : 'Course details saved successfully!', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    },
    onError: (err: any) => {
      setStatusMessage({ text: err?.message || 'Failed to save', type: 'error' });
    },
  });

  // Add Module Mutation
  const addModuleMutation = useMutation({
    mutationFn: async () => {
      if (!courseId || !newModuleTitle.trim()) return;
      const colRef = collection(db, effectiveCol, courseId, 'modules');
      await addDoc(colRef, {
        title: newModuleTitle.trim(),
        order: modules.length + 1,
        createdAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      setNewModuleTitle('');
      refetchModules();
    },
  });

  // Add Lesson Mutation
  const addLessonMutation = useMutation({
    mutationFn: async () => {
      if (!courseId || !targetModuleId || !lessonTitle.trim()) {
        throw new Error('Please enter lesson title and select a module.');
      }
      const videoId = extractYouTubeId(lessonYoutubeUrl);
      const lessonPayload = cleanFirestoreData({
        moduleId: targetModuleId,
        title: lessonTitle.trim(),
        introMarkdown: lessonContent.trim() || lessonTitle.trim(),
        youtubeVideoId: videoId || 'dQw4w9WgXcQ',
        durationSec: 600,
        quizPassPercentage: 70,
        status: 'published',
        order: lessons.filter((l) => l.moduleId === targetModuleId).length + 1,
        createdAt: serverTimestamp(),
      });

      const lessonDoc = await addDoc(collection(db, effectiveCol, courseId, 'lessons'), lessonPayload);

      // If quiz question provided, save question and answerKey
      if (quizQuestionText.trim() && quizOpt1.trim() && quizOpt2.trim()) {
        const qRef = doc(collection(db, effectiveCol, courseId, 'lessons', lessonDoc.id, 'questions'));
        await setDoc(qRef, {
          text: quizQuestionText.trim(),
          options: [
            { id: '1', text: quizOpt1.trim() },
            { id: '2', text: quizOpt2.trim() },
            ...(quizOpt3.trim() ? [{ id: '3', text: quizOpt3.trim() }] : []),
            ...(quizOpt4.trim() ? [{ id: '4', text: quizOpt4.trim() }] : []),
          ],
          explanation: 'Standard review question',
          order: 1,
        });

        const keyRef = doc(db, effectiveCol, courseId, 'lessons', lessonDoc.id, 'answerKeys', qRef.id);
        await setDoc(keyRef, { correctOptionId: quizCorrect });
      }
    },
    onSuccess: () => {
      setShowLessonModal(false);
      setLessonTitle('');
      setLessonYoutubeUrl('');
      setLessonContent('');
      setQuizQuestionText('');
      setQuizOpt1('');
      setQuizOpt2('');
      setQuizOpt3('');
      setQuizOpt4('');
      refetchLessons();
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message || 'Failed to add lesson');
    },
  });

  // Delete Lesson
  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!courseId) return;
      await deleteDoc(doc(db, effectiveCol, courseId, 'lessons', lessonId));
    },
    onSuccess: () => refetchLessons(),
  });

  // Submit for Review Mutation
  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!courseId) return;
      // Pre-save details
      await saveDetailsMutation.mutateAsync();
      return await submitCourseReviewCallable(courseId, isLivePublished, reviewNote);
    },
    onSuccess: () => {
      setShowReviewModal(false);
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['instructorCourses'] });
      Alert.alert(
        isPersian ? 'ارسال موفق' : 'Submitted for Review',
        isPersian
          ? 'دوره شما با موفقیت به صف بازبینی آکادمیک فرستاده شد.'
          : 'Your course has been submitted to the academic review queue.'
      );
    },
    onError: (err: any) => {
      Alert.alert('Submission Error', err?.message || 'Failed to submit review');
    },
  });

  // Request Archive or Delete Mutation
  const requestArchiveMutation = useMutation({
    mutationFn: async () => {
      if (!courseId) return;
      if (!archiveReason.trim()) throw new Error('Please state a reason for this request.');
      return await requestCourseArchiveOrDeleteCallable({
        courseId,
        requestType: archiveAction,
        reason: archiveReason.trim(),
      });
    },
    onSuccess: (res) => {
      setShowArchiveModal(false);
      setArchiveReason('');
      Alert.alert(
        'Request Submitted',
        archiveAction === 'delete'
          ? 'Deletion request submitted to admin.'
          : 'Course archive request submitted to admin.'
      );
    },
    onError: (err: any) => {
      Alert.alert('Request Failed', err?.message || 'Failed to submit request');
    },
  });

  if (loadingCourse || loadingDraft) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (!liveCourse) {
    return (
      <ScreenWrapper>
        <View className="py-20 items-center">
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>
            Course Not Found
          </Text>
          <Button title="← Return to Dashboard" onPress={() => router.replace('/instructor' as any)} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollable>
      <View className="max-w-5xl w-full self-center px-4 py-6 pb-32">
        {/* Header Breadcrumb & Status */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.push('/instructor' as any)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 13 }}>
              ← {isPersian ? 'بازگشت به دوره‌ها' : 'Back to Courses'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-2">
            <Badge
              label={
                liveCourse.status === 'published'
                  ? 'LIVE PUBLISHED'
                  : liveCourse.status === 'in_review'
                  ? 'IN REVIEW'
                  : liveCourse.status === 'changes_requested'
                  ? 'CHANGES REQ'
                  : 'DRAFT'
              }
              variant={liveCourse.status === 'published' ? 'success' : 'warning'}
            />
          </View>
        </View>

        {/* Live Published Draft Revision Staging Banner */}
        {isLivePublished && (
          <Card
            style={{
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
              borderColor: isDark ? '#3B82F6' : '#93C5FD',
              borderWidth: 1.5,
              padding: 16,
              borderRadius: 16,
              marginBottom: 16,
            }}
          >
            <View className="flex-row items-center gap-2 mb-1">
              <Text style={{ fontSize: 18 }}>🛡️</Text>
              <Text style={{ color: isDark ? '#60A5FA' : '#1D4ED8', fontWeight: '800', fontSize: 14 }}>
                {isPersian ? 'ویرایش پیش‌نویس بازبینی (نسخه زنده محافظت شده)' : 'Editing Revision Draft (Live Course Isolated)'}
              </Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
              {isPersian
                ? 'این دوره در حال حاضر برای دانش‌آموزان زنده است. تمام تغییرات شما در پیش‌نویس ذخیره می‌شود و پس از تأیید مدیر به صورت یکپارچه منتشر خواهد شد.'
                : 'This course is currently live. All your edits are staged safely in an isolated draft. Students will continue seeing the active version until your revision is approved.'}
            </Text>
          </Card>
        )}

        {statusMessage && (
          <View
            style={{
              backgroundColor: statusMessage.type === 'success' ? colors.successBg : colors.dangerBg,
              borderColor: statusMessage.type === 'success' ? colors.success : colors.danger,
              borderWidth: 1,
              padding: 12,
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: statusMessage.type === 'success' ? colors.success : colors.danger,
                fontSize: 13,
                fontWeight: '700',
              }}
            >
              {statusMessage.text}
            </Text>
          </View>
        )}

        {/* 1. General Settings Card */}
        <Card style={{ padding: 20, borderRadius: 20, marginBottom: 18 }}>
          <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 14 }}>
            1. {isPersian ? 'مشخصات عمومی دوره' : 'Course Details & Identity'}
          </Text>

          <Input
            label={isPersian ? 'عنوان انگلیسی دوره' : 'English Title'}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Master Artificial Intelligence"
          />

          <Input
            label={isPersian ? 'عنوان فارسی دوره' : 'Persian Title'}
            value={faTitle}
            onChangeText={setFaTitle}
            placeholder="مثلاً: دوره جامع هوش مصنوعی"
          />

          <CategorySelector
            selectedCategory={category}
            onSelectCategory={setCategory}
            isPersian={isPersian}
          />

          <CourseImageInput
            label={isPersian ? 'تصویر کاور دوره' : 'Cover Image URL'}
            value={coverUrl}
            onChangeImage={setCoverUrl}
          />

          <Input
            label={isPersian ? 'لینک پیش‌نمایش ویدیویی یوتیوب' : 'YouTube Intro / Preview Video'}
            value={youtubeUrl}
            onChangeText={setYoutubeUrl}
            placeholder="https://www.youtube.com/watch?v=..."
            autoCapitalize="none"
          />

          <Input
            label={isPersian ? 'توضیحات کوتاه (انگلیسی)' : 'English Description'}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <Input
            label={isPersian ? 'توضیحات کوتاه (فارسی)' : 'Persian Description'}
            value={faDescription}
            onChangeText={setFaDescription}
            multiline
            numberOfLines={3}
          />

          <Input
            label={isPersian ? 'بیوگرافی کوتاه مدرس برای این دوره (نمایش در کاتالوگ)' : 'Teacher Short Bio for this Course (Catalogue Display)'}
            placeholder={isPersian ? 'متن کوتاهی درباره شما که در نیمه دوم باکس دوره در کنار تصویر نمایش داده می‌شود...' : 'Short bio displayed on the other half of the course box next to the image...'}
            value={instructorBio}
            onChangeText={setInstructorBio}
            multiline
            numberOfLines={2}
          />

          <View className="flex-row justify-end mt-2">
            <Button
              title={saveDetailsMutation.isPending ? 'Saving...' : isPersian ? 'ذخیره تغییرات مشخصات' : 'Save Details'}
              onPress={() => saveDetailsMutation.mutate()}
              loading={saveDetailsMutation.isPending}
            />
          </View>
        </Card>

        {/* 2. Modules & Lessons Curriculum Card */}
        <Card style={{ padding: 20, borderRadius: 20, marginBottom: 18 }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }}>
              2. {isPersian ? 'سرفصل‌ها و درس‌ها' : 'Curriculum & Video Lessons'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              {modules.length} {isPersian ? 'فصل' : 'modules'} • {lessons.length} {isPersian ? 'درس' : 'lessons'}
            </Text>
          </View>

          {/* Add Module Input */}
          <View className="flex-row items-center gap-2 mb-6">
            <View style={{ flex: 1 }}>
              <Input
                label=""
                placeholder={isPersian ? 'عنوان فصل جدید (مثلاً: مقدمه و نصب ابزارها)...' : 'New module title (e.g. Introduction & Setup)...'}
                value={newModuleTitle}
                onChangeText={setNewModuleTitle}
              />
            </View>
            <Button
              title={isPersian ? '+ ایجاد فصل' : '+ Add Module'}
              onPress={() => addModuleMutation.mutate()}
              loading={addModuleMutation.isPending}
              disabled={!newModuleTitle.trim()}
            />
          </View>

          {/* Module List */}
          {modules.length === 0 ? (
            <View className="py-8 items-center bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {isPersian ? 'هنوز هیچ فصلی اضافه نشده است. ابتدا یک فصل اضافه کنید.' : 'No modules created yet. Add a module to begin.'}
              </Text>
            </View>
          ) : (
            <View className="gap-6">
              {modules.map((mod, idx) => {
                const moduleLessons = lessons.filter((l) => l.moduleId === mod.id);
                return (
                  <View
                    key={mod.id}
                    style={{
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      padding: 16,
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center gap-2">
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: colors.goldBg,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 12 }}>
                            {idx + 1}
                          </Text>
                        </View>
                        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>
                          {mod.title}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          setTargetModuleId(mod.id!);
                          setShowLessonModal(true);
                        }}
                        style={{
                          backgroundColor: colors.primary,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 11 }}>
                          + {isPersian ? 'افزودن درس' : 'Add Lesson'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Lessons list inside module */}
                    {moduleLessons.length === 0 ? (
                      <Text style={{ color: colors.textMuted, fontSize: 12, fontStyle: 'italic', paddingLeft: 8 }}>
                        {isPersian ? 'هیچ درسی در این فصل وجود ندارد.' : 'No lessons in this module yet.'}
                      </Text>
                    ) : (
                      <View className="gap-2">
                        {moduleLessons.map((l, lIdx) => (
                          <View
                            key={l.id}
                            style={{
                              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                              borderRadius: 10,
                              borderWidth: 1,
                              borderColor: colors.cardBorder,
                              padding: 10,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <View className="flex-row items-center gap-2 flex-1">
                              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>
                                #{lIdx + 1}
                              </Text>
                              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                                {l.title}
                              </Text>
                              <Badge label={l.durationSec ? `${Math.round(l.durationSec / 60)} min` : '10 min'} variant="info" />
                              {l.youtubeVideoId && (
                                <Text style={{ color: colors.gold, fontSize: 11 }}>▶ YouTube</Text>
                              )}
                            </View>

                            <TouchableOpacity
                              onPress={() => deleteLessonMutation.mutate(l.id!)}
                              style={{ padding: 4 }}
                            >
                              <Text style={{ color: colors.danger, fontSize: 13 }}>🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        {/* 3. Pre-Flight Checklist & Submission */}
        <Card
          style={{
            padding: 20,
            borderRadius: 20,
            borderColor: checklist.readyForReview ? colors.success : colors.goldBorder,
            borderWidth: 1.5,
            marginBottom: 20,
          }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }}>
              3. {isPersian ? 'چک‌لیست کنترل کیفیت پیش از ارسال' : 'Pre-Flight Quality Checklist'}
            </Text>
            <Badge
              label={checklist.readyForReview ? 'READY' : 'INCOMPLETE'}
              variant={checklist.readyForReview ? 'success' : 'warning'}
            />
          </View>

          <View className="gap-2 mb-4">
            <View className="flex-row items-center gap-2">
              <Text style={{ color: checklist.hasEnTitle && checklist.hasFaTitle ? colors.success : colors.danger }}>
                {checklist.hasEnTitle && checklist.hasFaTitle ? '✓' : '✗'}
              </Text>
              <Text style={{ color: colors.text, fontSize: 13 }}>
                {isPersian ? 'عنوان کامل به هر دو زبان انگلیسی و فارسی' : 'Complete title in both English & Persian'}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Text style={{ color: checklist.hasEnDesc && checklist.hasFaDesc ? colors.success : colors.danger }}>
                {checklist.hasEnDesc && checklist.hasFaDesc ? '✓' : '✗'}
              </Text>
              <Text style={{ color: colors.text, fontSize: 13 }}>
                {isPersian ? 'توضیحات و سرفصل‌ها به هر دو زبان' : 'Course description in both languages'}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Text style={{ color: checklist.validVideo ? colors.success : colors.danger }}>
                {checklist.validVideo ? '✓' : '✗'}
              </Text>
              <Text style={{ color: colors.text, fontSize: 13 }}>
                {isPersian ? 'لینک معتبر ویدیوی یوتیوب' : 'Valid YouTube video stream URL'}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Text style={{ color: checklist.hasModules && checklist.hasLessons ? colors.success : colors.danger }}>
                {checklist.hasModules && checklist.hasLessons ? '✓' : '✗'}
              </Text>
              <Text style={{ color: colors.text, fontSize: 13 }}>
                {isPersian ? 'حداقل یک فصل دارای درس ویدیویی' : 'At least one module with video lessons'}
              </Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-3">
            <Button
              title={
                submitReviewMutation.isPending
                  ? 'Submitting...'
                  : isPersian ? 'ارسال جهت بررسی آکادمیک 🚀' : 'Submit for Academic Review 🚀'
              }
              onPress={() => setShowReviewModal(true)}
              disabled={!checklist.readyForReview || submitReviewMutation.isPending}
              loading={submitReviewMutation.isPending}
            />

            <Button
              title={isPersian ? 'درخواست بایگانی / حذف' : 'Request Archive / Delete'}
              variant="secondary"
              onPress={() => setShowArchiveModal(true)}
            />
          </View>
        </Card>

        {/* Modal: Add Lesson */}
        <Modal
          visible={showLessonModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLessonModal(false)}
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
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>
                  {isPersian ? 'افزودن درس جدید' : 'Add New Lesson'}
                </Text>
                <TouchableOpacity onPress={() => setShowLessonModal(false)}>
                  <Text style={{ color: colors.textSecondary, fontSize: 18 }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Input
                  label={isPersian ? 'عنوان درس' : 'Lesson Title'}
                  placeholder="e.g. Setting up Python Environment"
                  value={lessonTitle}
                  onChangeText={setLessonTitle}
                />

                <Input
                  label={isPersian ? 'مدت زمان (دقیقه)' : 'Estimated Duration (e.g. 12:45)'}
                  placeholder="12:30"
                  value={lessonDuration}
                  onChangeText={setLessonDuration}
                />

                <Input
                  label={isPersian ? 'لینک ویدیوی یوتیوب' : 'YouTube Video URL'}
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={lessonYoutubeUrl}
                  onChangeText={setLessonYoutubeUrl}
                  autoCapitalize="none"
                />

                <Input
                  label={isPersian ? 'متن و نکات آموزشی درس (مارک‌داون)' : 'Lesson Notes (Markdown)'}
                  placeholder="Key summary points and code samples..."
                  value={lessonContent}
                  onChangeText={setLessonContent}
                  multiline
                  numberOfLines={3}
                />

                {/* Optional Quiz Question for this Lesson */}
                <View style={{ borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: 14, marginTop: 8 }}>
                  <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 13, marginBottom: 8 }}>
                    {isPersian ? 'سوال تستی تثبیت یادگیری این درس (اختیاری اما توصیه شده)' : 'Lesson Quiz Question (Recommended)'}
                  </Text>

                  <Input
                    label={isPersian ? 'متن سوال' : 'Question Prompt'}
                    placeholder="e.g. What is the primary purpose of..."
                    value={quizQuestionText}
                    onChangeText={setQuizQuestionText}
                  />

                  <Input
                    label="Option 1"
                    placeholder="First option"
                    value={quizOpt1}
                    onChangeText={setQuizOpt1}
                  />

                  <Input
                    label="Option 2"
                    placeholder="Second option"
                    value={quizOpt2}
                    onChangeText={setQuizOpt2}
                  />

                  <Input
                    label="Option 3 (Optional)"
                    placeholder="Third option"
                    value={quizOpt3}
                    onChangeText={setQuizOpt3}
                  />

                  <Input
                    label="Option 4 (Optional)"
                    placeholder="Fourth option"
                    value={quizOpt4}
                    onChangeText={setQuizOpt4}
                  />

                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
                    Correct Option:
                  </Text>
                  <View className="flex-row gap-3 mb-4">
                    {(['1', '2', '3', '4'] as const).map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => setQuizCorrect(opt)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: quizCorrect === opt ? colors.success : colors.cardBorder,
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                          Opt {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="flex-row justify-end gap-3 mt-4">
                  <Button
                    title="Cancel"
                    variant="secondary"
                    onPress={() => setShowLessonModal(false)}
                  />
                  <Button
                    title={addLessonMutation.isPending ? 'Saving...' : 'Add Lesson'}
                    onPress={() => addLessonMutation.mutate()}
                    loading={addLessonMutation.isPending}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal: Confirm Submit for Review */}
        <Modal
          visible={showReviewModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowReviewModal(false)}
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
                maxWidth: 500,
                padding: 24,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 8 }}>
                {isPersian ? 'ارسال دوره جهت بررسی آکادمیک' : 'Submit Course for Academic Review'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 16, lineHeight: 20 }}>
                {isPersian
                  ? 'تیم آموزش FARUKH.ORG کیفیت ویدیوها، صحت سوالات و استاندارد محتوا را ارزیابی خواهد کرد.'
                  : 'Our academic board will review your course structure, video links, and quiz standards.'}
              </Text>

              <Input
                label={isPersian ? 'یادداشت به تیم بررسی (اختیاری)' : 'Notes for Academic Reviewer (Optional)'}
                placeholder="Mention recent updates, key topics, or instructions..."
                value={reviewNote}
                onChangeText={setReviewNote}
                multiline
                numberOfLines={3}
              />

              <View className="flex-row justify-end gap-3 mt-4">
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setShowReviewModal(false)}
                />
                <Button
                  title={submitReviewMutation.isPending ? 'Submitting...' : 'Confirm Submission'}
                  onPress={() => submitReviewMutation.mutate()}
                  loading={submitReviewMutation.isPending}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal: Request Archive / Delete */}
        <Modal
          visible={showArchiveModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowArchiveModal(false)}
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
                maxWidth: 500,
                padding: 24,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 8 }}>
                {isPersian ? 'درخواست بایگانی یا حذف دوره' : 'Request Course Archive / Deletion'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 14 }}>
                {isPersian
                  ? 'توجه: دوره‌هایی که دانش‌آموز ثبت‌نامی یا گواهینامه صادرشده دارند فقط قابل بایگانی هستند و حذف دائمی نمی‌شوند.'
                  : 'Important: Courses with existing student enrollments or issued certificates can only be archived, not hard-deleted.'}
              </Text>

              <View className="flex-row gap-3 mb-4">
                <TouchableOpacity
                  onPress={() => setArchiveAction('archive')}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 12,
                    backgroundColor: archiveAction === 'archive' ? colors.gold : isDark ? '#1E293B' : '#F1F5F9',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: archiveAction === 'archive' ? '#0F172A' : colors.text, fontWeight: '800', fontSize: 13 }}>
                    📦 {isPersian ? 'بایگانی (توصیه شده)' : 'Archive (Preferred)'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setArchiveAction('delete')}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 12,
                    backgroundColor: archiveAction === 'delete' ? colors.danger : isDark ? '#1E293B' : '#F1F5F9',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: archiveAction === 'delete' ? '#FFFFFF' : colors.text, fontWeight: '800', fontSize: 13 }}>
                    🗑️ {isPersian ? 'حذف دائمی' : 'Hard Delete'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Input
                label={isPersian ? 'علت درخواست' : 'Reason for Request (Required)'}
                placeholder="Explain why you wish to archive or remove this course..."
                value={archiveReason}
                onChangeText={setArchiveReason}
                multiline
                numberOfLines={3}
              />

              <View className="flex-row justify-end gap-3 mt-4">
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setShowArchiveModal(false)}
                />
                <Button
                  title={requestArchiveMutation.isPending ? 'Sending...' : 'Send Request'}
                  variant="danger"
                  onPress={() => requestArchiveMutation.mutate()}
                  loading={requestArchiveMutation.isPending}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}
