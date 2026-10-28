import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { useAuth } from '../../../src/features/auth/useAuth';
import { useTheme } from '../../../src/features/theme/ThemeContext';
import { TEACHER_SUBJECTS } from '../../../src/types/schoolTeacher';
import { SchoolLesson, SchoolLessonQuestion } from '../../../src/types/schoolLesson';
import {
  getTeacherSchoolLessons,
  createSchoolLesson,
  updateSchoolLesson,
  deleteSchoolLesson,
} from '../../../src/features/school/schoolLessonApi';

export default function InstructorSchoolLessonsScreen() {
  const router = useRouter();
  const { user, isAdmin, isSchoolTeacher, schoolTeacherApprovedGrades } = useAuth();
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isPersian = i18n.language?.startsWith('fa');

  // Teacher's authorized grades (if admin, all grades 7-12)
  const allowedGrades = useMemo<number[]>(() => {
    if (isAdmin) return [7, 8, 9, 10, 11, 12];
    return schoolTeacherApprovedGrades || [];
  }, [isAdmin, schoolTeacherApprovedGrades]);

  // Filters
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'in_review' | 'published' | 'changes_requested'>('all');

  // Create / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [grade, setGrade] = useState<number>(allowedGrades[0] || 7);
  const [subject, setSubject] = useState<string>(TEACHER_SUBJECTS[0].id);
  const [title, setTitle] = useState('');
  const [faTitle, setFaTitle] = useState('');
  const [description, setDescription] = useState('');
  const [faDescription, setFaDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [questions, setQuestions] = useState<SchoolLessonQuestion[]>([]);
  const [formError, setFormError] = useState('');

  // Fetch teacher's lessons
  const { data: lessons = [], isLoading, refetch } = useQuery({
    queryKey: ['teacherSchoolLessons', user?.uid],
    queryFn: () => (user?.uid ? getTeacherSchoolLessons(user.uid) : Promise.resolve([])),
    enabled: !!user?.uid,
  });

  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      if (selectedGradeFilter !== 'all' && l.grade !== selectedGradeFilter) return false;
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      return true;
    });
  }, [lessons, selectedGradeFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingLessonId(null);
    setGrade(allowedGrades[0] || 7);
    setSubject(TEACHER_SUBJECTS[0].id);
    setTitle('');
    setFaTitle('');
    setDescription('');
    setFaDescription('');
    setVideoUrl('');
    setTextContent('');
    setQuestions([]);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (lesson: SchoolLesson) => {
    setEditingLessonId(lesson.id || null);
    setGrade(lesson.grade);
    setSubject(lesson.subject);
    setTitle(lesson.title);
    setFaTitle(lesson.faTitle);
    setDescription(lesson.description);
    setFaDescription(lesson.faDescription || '');
    setVideoUrl(lesson.videoUrl || '');
    setTextContent(lesson.textContent || '');
    setQuestions(lesson.questions || []);
    setFormError('');
    setShowModal(true);
  };

  // Add Question to Quiz builder
  const addQuestion = () => {
    const newQ: SchoolLessonQuestion = {
      id: `q-${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: '',
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (idx: number, field: string, val: any) => {
    const updated = [...questions];
    if (field === 'option') {
      const optIdx = val.optIdx;
      updated[idx].options[optIdx] = val.text;
    } else {
      (updated[idx] as any)[field] = val;
    }
    setQuestions(updated);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  // Save / Submit Mutation
  const saveMutation = useMutation({
    mutationFn: async (submitForReview: boolean) => {
      setFormError('');
      if (!user) throw new Error('Not authenticated');
      if (!title.trim()) throw new Error(isPersian ? 'عنوان انگلیسی درس الزامی است.' : 'English title is required.');
      if (!faTitle.trim()) throw new Error(isPersian ? 'عنوان فارسی درس الزامی است.' : 'Persian title is required.');

      // Strict grade authorization check
      if (!isAdmin && !allowedGrades.includes(grade)) {
        throw new Error(
          isPersian
            ? `شما صلاحیت ایجاد درس در صنف ${grade} را ندارید. صنوف مجاز شما: [${allowedGrades.join(', ')}]`
            : `You are not authorized for Grade ${grade}. Your approved grades are: [${allowedGrades.join(', ')}]`
        );
      }

      const subjectObj = TEACHER_SUBJECTS.find((s) => s.id === subject) || TEACHER_SUBJECTS[0];
      const statusToSet: SchoolLesson['status'] = submitForReview ? 'in_review' : 'draft';

      const payload = {
        grade,
        subject: subjectObj.en,
        faSubject: subjectObj.fa,
        title: title.trim(),
        faTitle: faTitle.trim(),
        description: description.trim() || title.trim(),
        faDescription: faDescription.trim() || faTitle.trim(),
        videoUrl: videoUrl.trim() || undefined,
        textContent: textContent.trim() || undefined,
        questions: questions.length > 0 ? questions : undefined,
        teacherId: user.uid,
        teacherName: user.displayName || user.email || 'Teacher',
        teacherEmail: user.email || undefined,
        status: statusToSet,
      };

      if (editingLessonId) {
        await updateSchoolLesson(editingLessonId, payload, allowedGrades, isAdmin);
      } else {
        await createSchoolLesson(payload, allowedGrades, isAdmin);
      }
    },
    onSuccess: (_, submitForReview) => {
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['teacherSchoolLessons'] });
      refetch();
      const msg = submitForReview
        ? (isPersian
            ? 'درس با موفقیت جهت بررسی به ادمین ارسال شد. پس از تایید در نصاب صنف منتشر خواهد شد.'
            : 'Lesson submitted for admin review. It will be published upon approval.')
        : (isPersian ? 'درس با موفقیت به عنوان پیش‌نویس ذخیره شد.' : 'Lesson saved as draft.');

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert(isPersian ? 'موفقیت' : 'Success', msg);
      }
    },
    onError: (err: any) => {
      setFormError(err?.message || 'Failed to save lesson');
    },
  });

  const getStatusBadge = (status: SchoolLesson['status']) => {
    switch (status) {
      case 'published':
        return <Badge label="PUBLISHED" variant="success" />;
      case 'in_review':
        return <Badge label="UNDER ADMIN REVIEW" variant="warning" />;
      case 'changes_requested':
        return <Badge label="CHANGES REQ" variant="danger" />;
      case 'draft':
      default:
        return <Badge label="DRAFT" variant="info" />;
    }
  };

  return (
    <ScreenWrapper scrollable>
      <View className="max-w-6xl w-full self-center px-4 py-6 pb-28">
        {/* Header Breadcrumb */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.push('/instructor' as any)}
            style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}
          >
            <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 13 }}>
              ← {isPersian ? 'بازگشت به استودیوی مربیان' : 'Back to Instructor Studio'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-2">
            <Badge label={isAdmin ? 'ADMIN ACCESS' : 'SCHOOL TEACHER'} variant="warning" />
          </View>
        </View>

        {/* Studio Banner */}
        <View
          style={{
            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
            borderRadius: 24,
            padding: 22,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            marginBottom: 20,
          }}
        >
          <View
            style={{
              flexDirection: isPersian ? 'row-reverse' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <View style={{ flex: 1, minWidth: 260 }}>
              <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Text style={{ fontSize: 28 }}>🏫</Text>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900', textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian ? 'استودیوی تدریس مکتب آنلاین دختران' : 'Girls Online School Teacher Studio'}
                </Text>
              </View>

              <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, textAlign: isPersian ? 'right' : 'left' }}>
                {isPersian
                  ? 'ایجاد درس‌های تصویری، سرفصل‌ها، متون آموزشی و سوالات آزمون برای صنوف مورد تایید'
                  : 'Create video lessons, syllabi, reading materials, and quizzes for your approved grades'}
              </Text>

              {/* Approved Grades Alert */}
              <View
                style={{
                  flexDirection: isPersian ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
                  borderWidth: 1,
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                  alignSelf: isPersian ? 'flex-end' : 'flex-start',
                }}
              >
                <Text style={{ color: '#3B82F6', fontWeight: '800', fontSize: 12 }}>
                  {isPersian ? '🎓 صنوف دارای صلاحیت تدریس شما:' : '🎓 Your Approved Teaching Grades:'}
                </Text>
                {allowedGrades.length > 0 ? (
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {allowedGrades.map((g) => (
                      <View
                        key={g}
                        style={{
                          backgroundColor: '#3B82F6',
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 11 }}>
                          {isPersian ? `صنف ${g}` : `Grade ${g}`}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 11 }}>
                    {isPersian ? 'در انتظار تایید صلاحیت صنوف توسط ادمین' : 'Pending grade approval by administrator'}
                  </Text>
                )}
              </View>
            </View>

            {/* Create Lesson Button */}
            <TouchableOpacity
              onPress={openCreateModal}
              disabled={allowedGrades.length === 0}
              style={{
                backgroundColor: allowedGrades.length > 0 ? colors.gold : '#64748B',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                shadowColor: colors.gold,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '900', fontSize: 14 }}>
                + {isPersian ? 'ایجاد درس جدید مکتب' : 'Create School Lesson'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={{ marginBottom: 20, gap: 10 }}>
          {/* Grade Selector Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {['all', ...allowedGrades].map((g) => {
              const isSelected = selectedGradeFilter === g;
              return (
                <TouchableOpacity
                  key={String(g)}
                  onPress={() => setSelectedGradeFilter(g as any)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: isSelected ? colors.gold : colors.card,
                    borderColor: isSelected ? colors.gold : colors.cardBorder,
                    borderWidth: 1,
                    marginRight: 8,
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? (isDark ? '#0F172A' : '#FFFFFF') : colors.textSecondary,
                      fontWeight: '800',
                      fontSize: 12,
                    }}
                  >
                    {g === 'all' ? (isPersian ? 'همه صنوف تایید شده' : 'All Approved Grades') : (isPersian ? `صنف ${g}` : `Grade ${g}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Status Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {[
              { id: 'all', label: isPersian ? 'همه وضعیت‌ها' : 'All Statuses' },
              { id: 'draft', label: isPersian ? 'پیش‌نویس‌ها' : 'Drafts' },
              { id: 'in_review', label: isPersian ? 'در انتظار بررسی ادمین' : 'Under Admin Review' },
              { id: 'published', label: isPersian ? 'منتشر شده' : 'Published' },
              { id: 'changes_requested', label: isPersian ? 'نیازمند اصلاح' : 'Changes Requested' },
            ].map((st) => {
              const isSelected = statusFilter === st.id;
              return (
                <TouchableOpacity
                  key={st.id}
                  onPress={() => setStatusFilter(st.id as any)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: isSelected ? (isDark ? '#334155' : '#E2E8F0') : 'transparent',
                    borderWidth: 1,
                    borderColor: isSelected ? colors.gold : colors.cardBorder,
                    marginRight: 6,
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? colors.text : colors.textSecondary,
                      fontWeight: isSelected ? '800' : '600',
                      fontSize: 11.5,
                    }}
                  >
                    {st.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Lessons List */}
        {isLoading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : filteredLessons.length === 0 ? (
          <View
            style={{
              padding: 40,
              alignItems: 'center',
              backgroundColor: colors.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Text style={{ fontSize: 32, marginBottom: 12 }}>📚</Text>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, marginBottom: 6 }}>
              {isPersian ? 'هیچ درسی با این فیلتر یافت نشد' : 'No lessons found'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: 16 }}>
              {isPersian
                ? 'برای صنوف تایید شده خود یک درس جدید ثبت نموده و جهت انتشار برای ادمین ارسال کنید.'
                : 'Create a new lesson for your approved grades and submit it for admin review.'}
            </Text>
            {allowedGrades.length > 0 && (
              <Button title={isPersian ? '+ ایجاد اولین درس' : '+ Create First Lesson'} onPress={openCreateModal} variant="primary" />
            )}
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {filteredLessons.map((item) => (
              <Card key={item.id} className="p-5 border-surface-border bg-surface-card">
                <View
                  style={{
                    flexDirection: isPersian ? 'row-reverse' : 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: isPersian ? 'row-reverse' : 'row',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: '#3B82F6',
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 11 }}>
                          {isPersian ? `صنف ${item.grade}` : `Grade ${item.grade}`}
                        </Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: 'rgba(234, 179, 8, 0.15)',
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderWidth: 1,
                          borderColor: colors.goldBorder,
                        }}
                      >
                        <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 11 }}>
                          {isPersian ? item.faSubject : item.subject}
                        </Text>
                      </View>
                      {getStatusBadge(item.status)}
                    </View>

                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? item.faTitle : item.title}
                    </Text>
                    {item.faTitle && (
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2, textAlign: isPersian ? 'right' : 'left' }}>
                        {item.title}
                      </Text>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => openEditModal(item)}
                      style={{
                        backgroundColor: colors.cardHover,
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 12 }}>
                        ✏️ {isPersian ? 'ویرایش' : 'Edit'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 12, textAlign: isPersian ? 'right' : 'left' }} numberOfLines={2}>
                  {item.description}
                </Text>

                {item.rejectionReason && (
                  <View
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderColor: '#EF4444',
                      borderWidth: 1,
                      borderRadius: 10,
                      padding: 10,
                      marginBottom: 10,
                    }}
                  >
                    <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>
                      ⚠️ {isPersian ? 'پیام بازبینی ادمین: ' : 'Admin Feedback: '}
                      {item.rejectionReason}
                    </Text>
                  </View>
                )}

                {/* Lesson Footer Details */}
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: colors.cardBorder,
                    paddingTop: 10,
                    flexDirection: isPersian ? 'row-reverse' : 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 11.5 }}>
                    {item.questions ? `📝 ${item.questions.length} ${isPersian ? 'سوال آزمون' : 'Quiz Qs'}` : '📖 درس متنی و ویدیویی'}
                  </Text>

                  {item.status === 'draft' && (
                    <TouchableOpacity
                      onPress={() => {
                        updateSchoolLesson(item.id!, { status: 'in_review' }, allowedGrades, isAdmin).then(() => refetch());
                      }}
                      style={{
                        backgroundColor: '#3B82F6',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                        📤 {isPersian ? 'ارسال جهت بازبینی ادمین' : 'Submit for Admin Review'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Create / Edit Lesson Modal */}
        <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
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
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderRadius: 24,
                borderWidth: 1,
                borderColor: colors.goldBorder,
                width: '100%',
                maxWidth: 800,
                maxHeight: '92%',
                overflow: 'hidden',
              }}
            >
              {/* Modal Header */}
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.cardBorder,
                  flexDirection: isPersian ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#F8FAFC',
                }}
              >
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>
                  {editingLessonId
                    ? (isPersian ? 'ویرایش درس مکتب' : 'Edit School Lesson')
                    : (isPersian ? 'ایجاد درس جدید مکتب آنلاین' : 'Create New School Lesson')}
                </Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Text style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                {formError ? (
                  <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: '#EF4444', borderRadius: 10, padding: 10, marginBottom: 14 }}>
                    <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 12 }}>⚠️ {formError}</Text>
                  </View>
                ) : null}

                {/* Grade Selector - STRICTLY restricted to approvedGrades */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '800', marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian ? 'انتخاب صنف (منحصراً از میان صنوف تایید شده شما) *' : 'Select Grade (Restricted to your approved grades) *'}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {allowedGrades.map((g) => {
                      const isSelected = grade === g;
                      return (
                        <TouchableOpacity
                          key={g}
                          onPress={() => setGrade(g)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 12,
                            backgroundColor: isSelected ? '#3B82F6' : (isDark ? '#1E293B' : '#F1F5F9'),
                            borderWidth: 1,
                            borderColor: isSelected ? '#3B82F6' : colors.cardBorder,
                          }}
                        >
                          <Text style={{ color: isSelected ? '#FFFFFF' : colors.text, fontWeight: '800', fontSize: 13 }}>
                            {isSelected ? '✓ ' : ''}
                            {isPersian ? `صنف ${g}` : `Grade ${g}`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Subject Selector */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '800', marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian ? 'مضمون درس *' : 'Subject *'}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {TEACHER_SUBJECTS.map((sub) => {
                      const isSelected = subject === sub.id;
                      return (
                        <TouchableOpacity
                          key={sub.id}
                          onPress={() => setSubject(sub.id)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 10,
                            backgroundColor: isSelected ? colors.gold : (isDark ? '#1E293B' : '#F1F5F9'),
                            borderWidth: 1,
                            borderColor: isSelected ? colors.gold : colors.cardBorder,
                          }}
                        >
                          <Text style={{ color: isSelected ? (isDark ? '#0F172A' : '#FFFFFF') : colors.textSecondary, fontWeight: '700', fontSize: 11.5 }}>
                            {isPersian ? sub.fa : sub.en}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Titles */}
                <View style={{ gap: 12, marginBottom: 14 }}>
                  <View>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'عنوان درس (فارسی / دری) *' : 'Lesson Title (Persian / Dari) *'}
                    </Text>
                    <TextInput
                      value={faTitle}
                      onChangeText={setFaTitle}
                      placeholder={isPersian ? 'مثال: جلسه اول: ساختار سلول‌های حیوانی و نباتی' : 'Persian Title'}
                      placeholderTextColor="#64748B"
                      style={{
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        color: colors.text,
                        textAlign: isPersian ? 'right' : 'left',
                      }}
                    />
                  </View>

                  <View>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'عنوان درس (انگلیسی) *' : 'Lesson Title (English) *'}
                    </Text>
                    <TextInput
                      value={title}
                      onChangeText={setTitle}
                      placeholder="e.g. Lesson 1: Plant and Animal Cell Structures"
                      placeholderTextColor="#64748B"
                      style={{
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        color: colors.text,
                        textAlign: 'left',
                      }}
                    />
                  </View>
                </View>

                {/* Description & Video URL */}
                <View style={{ gap: 12, marginBottom: 14 }}>
                  <View>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'شرح مختصر و سرفصل‌های درس' : 'Short Description & Objectives'}
                    </Text>
                    <TextInput
                      value={description}
                      onChangeText={setDescription}
                      placeholder={isPersian ? 'اهداف یادگیری این درس، مفاهیم کلیدی و نکات مهم...' : 'Learning objectives...'}
                      placeholderTextColor="#64748B"
                      multiline
                      numberOfLines={3}
                      style={{
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        color: colors.text,
                        minHeight: 65,
                        textAlign: isPersian ? 'right' : 'left',
                      }}
                    />
                  </View>

                  <View>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'لینک ویدیوی تدریس (یوتیوب یا سرور ویدیو)' : 'Lesson Video Link (YouTube or Direct)'}
                    </Text>
                    <TextInput
                      value={videoUrl}
                      onChangeText={setVideoUrl}
                      placeholder="https://www.youtube.com/watch?v=..."
                      placeholderTextColor="#64748B"
                      style={{
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        color: colors.text,
                        textAlign: 'left',
                      }}
                    />
                  </View>

                  <View>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'متن کامل جزوه و یادداشت‌های درس' : 'Lesson Text & Study Notes'}
                    </Text>
                    <TextInput
                      value={textContent}
                      onChangeText={setTextContent}
                      placeholder={isPersian ? 'متن درسی، نکات تخته، تمارین حل شده و توضیحات تفصیلی...' : 'Detailed study notes...'}
                      placeholderTextColor="#64748B"
                      multiline
                      numberOfLines={5}
                      style={{
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        color: colors.text,
                        minHeight: 100,
                        textAlign: isPersian ? 'right' : 'left',
                      }}
                    />
                  </View>
                </View>

                {/* Quiz Builder */}
                <View style={{ marginBottom: 20 }}>
                  <View
                    style={{
                      flexDirection: isPersian ? 'row-reverse' : 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 13 }}>
                      {isPersian ? `سوالات آزمون پایان درس (${questions.length} سوال)` : `Lesson Quiz (${questions.length} Questions)`}
                    </Text>
                    <TouchableOpacity
                      onPress={addQuestion}
                      style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: '#3B82F6',
                        borderWidth: 1,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: '#60A5FA', fontWeight: '800', fontSize: 11.5 }}>
                        + {isPersian ? 'افزودن سوال' : 'Add Question'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {questions.map((q, qIdx) => (
                    <View
                      key={q.id}
                      style={{
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        borderRadius: 14,
                        padding: 12,
                        marginBottom: 10,
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 12 }}>
                          {isPersian ? `سوال شماره ${qIdx + 1}` : `Question ${qIdx + 1}`}
                        </Text>
                        <TouchableOpacity onPress={() => removeQuestion(qIdx)}>
                          <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 12 }}>✕ {isPersian ? 'حذف' : 'Remove'}</Text>
                        </TouchableOpacity>
                      </View>

                      <TextInput
                        value={q.question}
                        onChangeText={(txt) => updateQuestion(qIdx, 'question', txt)}
                        placeholder={isPersian ? 'متن سوال...' : 'Question text...'}
                        placeholderTextColor="#64748B"
                        style={{
                          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                          borderColor: colors.cardBorder,
                          borderWidth: 1,
                          borderRadius: 8,
                          padding: 8,
                          color: colors.text,
                          marginBottom: 8,
                          textAlign: isPersian ? 'right' : 'left',
                        }}
                      />

                      {/* 4 Options */}
                      {q.options.map((opt, optIdx) => (
                        <View key={optIdx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <TouchableOpacity
                            onPress={() => updateQuestion(qIdx, 'correctIndex', optIdx)}
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              backgroundColor: q.correctIndex === optIdx ? '#10B981' : 'transparent',
                              borderWidth: 1.5,
                              borderColor: q.correctIndex === optIdx ? '#10B981' : '#64748B',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            {q.correctIndex === optIdx && <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
                          </TouchableOpacity>
                          <TextInput
                            value={opt}
                            onChangeText={(txt) => updateQuestion(qIdx, 'option', { optIdx, text: txt })}
                            placeholder={`${isPersian ? 'گزینه' : 'Option'} ${optIdx + 1}`}
                            placeholderTextColor="#64748B"
                            style={{
                              flex: 1,
                              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                              borderColor: colors.cardBorder,
                              borderWidth: 1,
                              borderRadius: 8,
                              padding: 6,
                              color: colors.text,
                              fontSize: 12,
                              textAlign: isPersian ? 'right' : 'left',
                            }}
                          />
                        </View>
                      ))}
                    </View>
                  ))}
                </View>

                {/* Action Buttons */}
                <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => saveMutation.mutate(true)}
                    disabled={saveMutation.isPending}
                    style={{
                      flex: 1,
                      backgroundColor: '#3B82F6',
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: 'center',
                    }}
                  >
                    {saveMutation.isPending ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>
                        📤 {isPersian ? 'ارسال جهت بازبینی ادمین' : 'Submit for Admin Review'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => saveMutation.mutate(false)}
                    disabled={saveMutation.isPending}
                    style={{
                      flex: 1,
                      backgroundColor: colors.cardHover,
                      borderColor: colors.cardBorder,
                      borderWidth: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13 }}>
                      💾 {isPersian ? 'ذخیره به عنوان پیش‌نویس' : 'Save as Draft'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}
