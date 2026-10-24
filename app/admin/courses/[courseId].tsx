import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { Badge } from '../../../src/components/ui/Badge';
import {
  getAdminCourses,
  createOrUpdateCourse,
  getCourseModules,
  getCourseLessons,
  deleteCourse,
  createModule,
  createOrUpdateLesson,
  deleteLesson,
  saveExamQuestion,
  deleteExamQuestion,
  getExamQuestions,
} from '../../../src/features/admin/adminApi';
import { parseBulkQuestions } from '../../../src/features/admin/csvImport';
import { extractYouTubeId } from '../../../src/lib/utils';
import { Image, TouchableOpacity, Platform, Linking, Alert } from 'react-native';
import { CategorySelector } from '../../../src/components/ui/CategorySelector';
import { CourseImageInput } from '../../../src/components/ui/CourseImageInput';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../src/lib/firebase';
import { Lesson } from '../../../src/types/lesson';

export default function AdminCourseEditScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [showAddLesson, setShowAddLesson] = useState<string | null>(null);

  // Course Details Edit State
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<string>('Stocks & Crypto');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editKeywords, setEditKeywords] = useState('');
  const [editYouTubeUrl, setEditYouTubeUrl] = useState('');
  const [editInstructorBio, setEditInstructorBio] = useState('');
  const [editStatus, setEditStatus] = useState<'published' | 'draft' | 'in_review' | 'changes_requested' | 'rejected' | 'archived'>('published');
  const [editIsUnfinished, setEditIsUnfinished] = useState(false);
  const [editPassPercentage, setEditPassPercentage] = useState('80');
  const [saveCourseSuccess, setSaveCourseSuccess] = useState(false);

  // Lesson Form State
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [introMarkdown, setIntroMarkdown] = useState('');
  const [lessonPdfUrl, setLessonPdfUrl] = useState('');
  const [lessonPdfName, setLessonPdfName] = useState('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // Bulk Import State
  const [showBulkExam, setShowBulkExam] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkImportTargetModule, setBulkImportTargetModule] = useState('course_exam');
  const [pickedFileName, setPickedFileName] = useState<string | null>(null);
  const [bulkImportError, setBulkImportError] = useState<string | null>(null);

  // Manual Question State
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualText, setManualText] = useState('');
  const [manualOpt1, setManualOpt1] = useState('');
  const [manualOpt2, setManualOpt2] = useState('');
  const [manualOpt3, setManualOpt3] = useState('');
  const [manualOpt4, setManualOpt4] = useState('');
  const [manualCorrectOpt, setManualCorrectOpt] = useState('opt-1');
  const [manualExplanation, setManualExplanation] = useState('');
  const [manualTargetModule, setManualTargetModule] = useState('course_exam');
  const [manualError, setManualError] = useState<string | null>(null);

  // Question Filter
  const [questionFilter, setQuestionFilter] = useState<string>('all');

  const { data: courses = [] } = useQuery({
    queryKey: ['adminCourses'],
    queryFn: getAdminCourses,
  });
  const course = courses.find((c) => c.id === courseId);

  // Initialize edit fields when course is loaded or toggled
  React.useEffect(() => {
    if (course) {
      setEditTitle(course.title || '');
      setEditCategory(course.category || 'Stocks & Crypto');
      setEditCoverUrl(course.coverUrl || '');
      setEditBody(course.body || course.description || '');
      setEditKeywords(course.keywords ? course.keywords.join(', ') : '');
      setEditYouTubeUrl(course.youtubeUrl || (course.youtubeVideoId ? `https://www.youtube.com/watch?v=${course.youtubeVideoId}` : ''));
      setEditInstructorBio(course.instructorBio || (course as any).ownerBio || '');
      setEditStatus(course.status || 'published');
      setEditIsUnfinished(!!course.isUnfinished);
      setEditPassPercentage(course.passPercentage ? String(course.passPercentage) : '80');
    }
  }, [course?.id, isEditingCourse]);

  const { data: modules = [] } = useQuery({
    queryKey: ['adminModules', courseId],
    queryFn: () => getCourseModules(courseId!),
    enabled: !!courseId,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['adminLessons', courseId],
    queryFn: () => getCourseLessons(courseId!),
    enabled: !!courseId,
  });

  const { data: examQuestions = [] } = useQuery({
    queryKey: ['adminExamQuestions', courseId],
    queryFn: () => getExamQuestions(courseId!),
    enabled: !!courseId,
  });

  const addModuleMutation = useMutation({
    mutationFn: async () => {
      if (!courseId || !newModuleTitle) return;
      await createModule(courseId, newModuleTitle, modules.length + 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminModules', courseId] });
      setNewModuleTitle('');
    },
  });

  const addLessonMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      if (!courseId) return;
      const vId = extractYouTubeId(youtubeUrl) || youtubeUrl || 'REPLACE_ME';
      const payload: Partial<Lesson> = {
        moduleId,
        title: lessonTitle,
        introMarkdown: introMarkdown || 'Introductory content for this lesson.',
        youtubeVideoId: vId,
        durationSec: 300,
        quizPassPercentage: 70,
        status: 'published',
        order: editingLessonId
          ? lessons.find((l) => l.id === editingLessonId)?.order || lessons.length
          : lessons.length + 1,
        pdfUrl: lessonPdfUrl.trim() || undefined,
        pdfName: lessonPdfName.trim() || undefined,
      };

      await createOrUpdateLesson(courseId, payload, editingLessonId || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLessons', courseId] });
      setShowAddLesson(null);
      setEditingLessonId(null);
      setLessonTitle('');
      setYoutubeUrl('');
      setIntroMarkdown('');
      setLessonPdfUrl('');
      setLessonPdfName('');
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!courseId) return;
      await deleteLesson(courseId, lessonId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLessons', courseId] });
      setShowAddLesson(null);
      setEditingLessonId(null);
      setLessonTitle('');
      setYoutubeUrl('');
      setIntroMarkdown('');
      setLessonPdfUrl('');
      setLessonPdfName('');
    },
  });

  const handlePickPdfFile = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf,.pdf';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;

        setIsUploadingPdf(true);
        const fileName = file.name || 'lesson_note.pdf';
        setLessonPdfName(fileName);

        try {
          const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
          const fileRef = storageRef(storage, `lessons/${courseId}/notes/${Date.now()}_${cleanName}`);
          await uploadBytes(fileRef, file);
          const downloadUrl = await getDownloadURL(fileRef);
          setLessonPdfUrl(downloadUrl);
        } catch (err) {
          console.error('Failed to upload PDF, fallback to local reader:', err);
          const reader = new FileReader();
          reader.onload = () => {
            setLessonPdfUrl(reader.result as string);
          };
          reader.readAsDataURL(file);
        } finally {
          setIsUploadingPdf(false);
        }
      };
      input.click();
    }
  };

  const handlePickQuestionFile = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,.json,text/csv,application/json,text/plain';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        setPickedFileName(file.name);
        setBulkImportError(null);
        const reader = new FileReader();
        reader.onload = () => {
          const content = reader.result as string;
          setBulkText(content);
        };
        reader.onerror = () => {
          setBulkImportError('Failed to read selected file.');
        };
        reader.readAsText(file);
      };
      input.click();
    } else {
      setBulkImportError('File browser is supported on web browsers. On mobile, paste CSV or JSON below.');
    }
  };

  const handleInsertTemplate = () => {
    const template = `Question,Option 1,Option 2,Option 3,Option 4,Correct Index,Explanation
"What is the key indicator for long-term consistency?","Emotional trading","Disciplined risk management","Chasing quick pumps","Ignoring stop losses",2,"Disciplined risk management guarantees capital preservation."
"Which metric should be calculated before every trade?","Social media sentiment","Risk-to-Reward ratio","Random gut feeling","News headlines",2,"Risk-to-Reward ratio ensures positive expected value over time."
"What defines a high-probability market structure?","Higher highs and higher lows","Unpredictable random jumps","Sudden panic candles","Undefined chop",1,"Consecutive higher highs and higher lows indicate a healthy uptrend."`;
    setBulkText(template);
    setPickedFileName('sample_template.csv');
    setBulkImportError(null);
  };

  const bulkImportExamMutation = useMutation({
    mutationFn: async () => {
      if (!courseId || !bulkText.trim()) return;
      const format = bulkText.trim().startsWith('[') ? 'json' : 'csv';
      const targetMod = bulkImportTargetModule === 'course_exam' ? null : bulkImportTargetModule || null;
      const parsed = parseBulkQuestions(bulkText, format, targetMod);
      if (parsed.length === 0) {
        throw new Error('No valid questions found in file or text.');
      }
      for (const q of parsed) {
        await saveExamQuestion(courseId, {
          text: q.text,
          options: q.options,
          correctOptionId: q.correctOptionId,
          explanation: q.explanation,
          moduleId: q.moduleId || targetMod,
        });
      }
      return parsed.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminExamQuestions', courseId] });
      setShowBulkExam(false);
      setBulkText('');
      setPickedFileName(null);
      setBulkImportError(null);
    },
    onError: (err: any) => {
      setBulkImportError(err.message || 'Failed to parse and import questions.');
    },
  });

  const addManualQuestionMutation = useMutation({
    mutationFn: async () => {
      if (!courseId) return;
      if (!manualText.trim()) throw new Error('Please enter question text.');
      if (!manualOpt1.trim() || !manualOpt2.trim()) throw new Error('Please enter at least Option 1 and Option 2.');

      const options = [
        { id: 'opt-1', text: manualOpt1.trim() },
        { id: 'opt-2', text: manualOpt2.trim() },
        { id: 'opt-3', text: manualOpt3.trim() },
        { id: 'opt-4', text: manualOpt4.trim() },
      ].filter((o) => o.text.length > 0);

      const targetMod = manualTargetModule === 'course_exam' ? null : manualTargetModule || null;

      await saveExamQuestion(courseId, {
        text: manualText.trim(),
        options,
        correctOptionId: manualCorrectOpt,
        explanation: manualExplanation.trim(),
        moduleId: targetMod,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminExamQuestions', courseId] });
      setShowAddManual(false);
      setManualText('');
      setManualOpt1('');
      setManualOpt2('');
      setManualOpt3('');
      setManualOpt4('');
      setManualExplanation('');
      setManualError(null);
    },
    onError: (err: any) => {
      setManualError(err.message || 'Failed to save question.');
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      if (!courseId) return;
      await deleteExamQuestion(courseId, questionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminExamQuestions', courseId] });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async () => {
      if (!courseId || !editTitle.trim()) return;
      const detectedVid = extractYouTubeId(editYouTubeUrl);
      const vid = detectedVid || (editYouTubeUrl.trim().length === 11 ? editYouTubeUrl.trim() : undefined);
      const kwList = editKeywords
        .split(/[,،]+/)
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      await createOrUpdateCourse(
        {
          title: editTitle.trim(),
          category: editCategory || 'Stocks & Crypto',
          coverUrl: editCoverUrl.trim() || undefined,
          description: editBody.trim() ? editBody.trim().slice(0, 160) + '...' : editTitle.trim(),
          body: editBody.trim() || undefined,
          keywords: kwList,
          youtubeUrl: editYouTubeUrl.trim() || undefined,
          youtubeVideoId: vid,
          instructorBio: editInstructorBio.trim() || undefined,
          ownerBio: editInstructorBio.trim() || undefined,
          status: editStatus,
          isUnfinished: editIsUnfinished,
          passPercentage: parseInt(editPassPercentage, 10) || 80,
        },
        courseId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      setSaveCourseSuccess(true);
      setTimeout(() => setSaveCourseSuccess(false), 3000);
      setIsEditingCourse(false);
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async () => {
      if (!courseId || !course) return;
      const next = course.status === 'published' ? 'draft' : 'published';
      await createOrUpdateCourse({ status: next as any }, courseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
    },
  });

  const toggleUnfinishedMutation = useMutation({
    mutationFn: async () => {
      if (!courseId || !course) return;
      await createOrUpdateCourse({ isUnfinished: !course.isUnfinished }, courseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async () => {
      if (!courseId) return;
      await deleteCourse(courseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      router.replace('/admin/courses');
    },
  });

  const handleDeleteCourse = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to delete "${course?.title}"? This cannot be undone.`)) {
        deleteCourseMutation.mutate();
      }
    } else {
      Alert.alert(
        'Delete Course',
        `Are you sure you want to delete "${course?.title}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete Course', style: 'destructive', onPress: () => deleteCourseMutation.mutate() },
        ]
      );
    }
  };

  if (!course) {
    return (
      <View className="flex-1 bg-surface-dark justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const detectedEditVid = extractYouTubeId(editYouTubeUrl);

  return (
    <ScreenWrapper>
      <View className="max-w-4xl w-full self-center">
        {/* Course Header Banner */}
        <Card className="mb-6 border-brand-500/60 bg-surface-card p-5">
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-row gap-4 flex-1 mr-3 items-start">
              {course.coverUrl ? (
                <Image
                  source={{ uri: course.coverUrl }}
                  style={{ width: 120, height: 96, borderRadius: 14, backgroundColor: '#1E293B', aspectRatio: 5 / 4 }}
                  resizeMode="cover"
                />
              ) : null}
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-1 flex-wrap">
                  <Text className="text-2xl font-bold text-white">{course.title}</Text>
                  {course.category && (
                    <View className="bg-amber-950/80 border border-amber-500/50 px-2.5 py-0.5 rounded-full">
                      <Text className="text-amber-300 text-xs font-bold">{course.category}</Text>
                    </View>
                  )}
                  {course.status === 'published' ? (
                    <Badge label="PUBLISHED" variant="success" />
                  ) : (
                    <Badge label="HIDDEN (DRAFT)" variant="warning" />
                  )}
                  {course.isUnfinished ? (
                    <Badge label="⏳ UNFINISHED (NO CERT)" variant="warning" />
                  ) : (
                    <Badge label="🎓 COMPLETE" variant="success" />
                  )}
                  <Badge label={`PASS: ${course.passPercentage || 80}%`} variant="info" />
                </View>
                <Text className="text-slate-300 text-sm mt-1 mb-2">{course.body || course.description}</Text>

                {/* Keywords positioned next to the thumbnail */}
                {course.keywords && course.keywords.length > 0 && (
                  <View className="flex-row flex-wrap gap-1.5 items-center mt-1">
                    {course.keywords.map((kw, i) => (
                      <View key={i} className="bg-brand-950/80 border border-brand-800/60 px-2.5 py-0.5 rounded-full">
                        <Text className="text-brand-300 text-xs">#{kw}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View className="flex-row items-center gap-2 flex-wrap">
              {/* Quick Hide/Unhide */}
              <TouchableOpacity
                onPress={() => toggleVisibilityMutation.mutate()}
                disabled={toggleVisibilityMutation.isPending}
                className={`px-3 py-2 rounded-xl border flex-row items-center gap-1.5 ${
                  course.status === 'published'
                    ? 'bg-surface-dark border-slate-700'
                    : 'bg-emerald-950/80 border-emerald-500/60'
                }`}
              >
                <Text className={`text-xs font-bold ${course.status === 'published' ? 'text-slate-300' : 'text-emerald-300'}`}>
                  {course.status === 'published' ? '👁️ Hide Course' : '👁️ Publish Course'}
                </Text>
              </TouchableOpacity>

              {/* Quick Mark Unfinished */}
              <TouchableOpacity
                onPress={() => toggleUnfinishedMutation.mutate()}
                disabled={toggleUnfinishedMutation.isPending}
                className={`px-3 py-2 rounded-xl border flex-row items-center gap-1.5 ${
                  course.isUnfinished
                    ? 'bg-emerald-950/80 border-emerald-500/60'
                    : 'bg-amber-950/80 border-amber-500/60'
                }`}
              >
                <Text className={`text-xs font-bold ${course.isUnfinished ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {course.isUnfinished ? '✓ Mark Complete' : '⏳ Mark Unfinished'}
                </Text>
              </TouchableOpacity>

              <Button
                title="🎨 Certificate Template"
                variant="outline"
                onPress={() => router.push(`/admin/courses/${courseId}/certificate-template` as any)}
              />
              <Button
                title={isEditingCourse ? 'Close' : '✎ Edit Course Info'}
                variant={isEditingCourse ? 'secondary' : 'outline'}
                onPress={() => setIsEditingCourse(!isEditingCourse)}
              />
              <TouchableOpacity
                onPress={handleDeleteCourse}
                disabled={deleteCourseMutation.isPending}
                className="px-3 py-2 rounded-xl bg-red-950/60 border border-red-700/60 flex-row items-center gap-1"
              >
                <Text className="text-xs font-bold text-red-300">🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* YouTube Preview Badge if present */}
          {course.youtubeVideoId && (
            <View className="flex-row flex-wrap gap-2 items-center pt-2 border-t border-surface-border">
              <View className="flex-row items-center gap-1.5 bg-red-950/60 border border-red-800/80 px-2.5 py-1 rounded-lg">
                <Text className="text-red-300 text-xs font-semibold">📺 YouTube: {course.youtubeVideoId}</Text>
              </View>
            </View>
          )}

          {saveCourseSuccess && (
            <View className="mt-3 p-2.5 bg-emerald-950/60 border border-emerald-500/60 rounded-xl">
              <Text className="text-emerald-300 text-xs font-bold">✓ Course details updated in Firebase!</Text>
            </View>
          )}

          {/* Inline Edit Form */}
          {isEditingCourse && (
            <View className="mt-4 pt-4 border-t border-surface-border">
              <Text className="text-white font-bold text-base mb-3">Edit Course Information</Text>

              {/* Visibility Status Selection */}
              <View className="mb-4">
                <Text className="text-white text-xs font-bold mb-2">Visibility Status (Hide / Unhide)</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setEditStatus('published')}
                    className={`flex-1 py-2.5 px-3 rounded-xl border items-center ${
                      editStatus === 'published'
                        ? 'bg-emerald-950/80 border-emerald-500'
                        : 'bg-surface-dark border-surface-border'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${editStatus === 'published' ? 'text-emerald-300' : 'text-slate-400'}`}>
                      ✓ Published (Visible to Students)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setEditStatus('draft')}
                    className={`flex-1 py-2.5 px-3 rounded-xl border items-center ${
                      editStatus === 'draft'
                        ? 'bg-amber-950/80 border-amber-500'
                        : 'bg-surface-dark border-surface-border'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${editStatus === 'draft' ? 'text-amber-300' : 'text-slate-400'}`}>
                      👁️ Hidden / Draft (Admin Only)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Unfinished Course Toggle */}
              <TouchableOpacity
                onPress={() => setEditIsUnfinished(!editIsUnfinished)}
                className={`mb-4 p-3.5 rounded-xl border flex-row items-center gap-3 ${
                  editIsUnfinished
                    ? 'bg-amber-950/60 border-amber-500/70'
                    : 'bg-surface-dark border-surface-border'
                }`}
              >
                <View
                  className={`w-6 h-6 rounded-md items-center justify-center border ${
                    editIsUnfinished
                      ? 'bg-amber-500 border-amber-400'
                      : 'border-slate-600 bg-surface-card'
                  }`}
                >
                  {editIsUnfinished && <Text className="text-black font-extrabold text-xs">✓</Text>}
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-xs">
                    Mark as Unfinished Course (Block Certificate Issuance)
                  </Text>
                  <Text className="text-slate-400 text-[11px] mt-0.5">
                    Students can view and practice released lessons, but no certificates will be issued until marked complete.
                  </Text>
                </View>
              </TouchableOpacity>

              <Input
                label="Course Title"
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Course title..."
              />

              {/* Category Selector (Stocks & Crypto, Ecommerce, Languages, Morals) */}
              <CategorySelector
                selectedCategory={editCategory}
                onSelectCategory={setEditCategory}
                label="Course Category *"
              />

              {/* Course Cover Image (Upload or Link) */}
              <CourseImageInput
                value={editCoverUrl}
                onChangeImage={setEditCoverUrl}
                label="Course Cover Image (Upload or Link Image)"
              />

              <Input
                label="Pass Percentage Required for Certificate (Default: 80%)"
                value={editPassPercentage}
                onChangeText={setEditPassPercentage}
                placeholder="80"
                keyboardType="numeric"
              />

              <Input
                label="Course Body & Detailed Syllabus"
                value={editBody}
                onChangeText={setEditBody}
                placeholder="Full course content..."
                multiline
                numberOfLines={4}
              />
              <Input
                label="Teacher Short Bio (Displayed on the other half of Catalogue Box)"
                value={editInstructorBio}
                onChangeText={setEditInstructorBio}
                placeholder="1-2 sentences about teacher credentials..."
                multiline
                numberOfLines={2}
              />
              <Input
                label="Keywords / Tags (comma-separated)"
                value={editKeywords}
                onChangeText={setEditKeywords}
                placeholder="e.g. AI, React, Architecture"
              />
              <Input
                label="YouTube Video Link (Optional)"
                value={editYouTubeUrl}
                onChangeText={setEditYouTubeUrl}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              {detectedEditVid && (
                <View className="mb-3 p-2 bg-surface-dark rounded-xl border border-emerald-500/50 flex-row items-center gap-3">
                  <Image
                    source={{ uri: `https://img.youtube.com/vi/${detectedEditVid}/mqdefault.jpg` }}
                    style={{ width: 70, height: 42, borderRadius: 6 }}
                  />
                  <Text className="text-emerald-400 text-xs font-semibold">Valid Video ID: {detectedEditVid}</Text>
                </View>
              )}
              <View className="flex-row gap-2 mt-2">
                <Button
                  title="Save Changes to Firebase"
                  onPress={() => updateCourseMutation.mutate()}
                  loading={updateCourseMutation.isPending}
                  className="flex-1"
                />
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setIsEditingCourse(false)}
                />
              </View>

              {/* Danger Zone */}
              <View className="mt-6 pt-4 border-t border-red-900/40">
                <Text className="text-red-400 font-bold text-xs mb-2">Danger Zone</Text>
                <TouchableOpacity
                  onPress={handleDeleteCourse}
                  disabled={deleteCourseMutation.isPending}
                  className="p-3 rounded-xl bg-red-950/50 border border-red-800/60 flex-row justify-between items-center"
                >
                  <View>
                    <Text className="text-red-300 font-bold text-xs">Delete Entire Course</Text>
                    <Text className="text-slate-400 text-[11px]">Permanently removes this course, modules, lessons and question bank</Text>
                  </View>
                  <Text className="text-red-400 font-bold text-xs">🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Card>

        {/* Modules & Lessons Section */}
        <Text className="text-xl font-bold text-white mb-3">Modules & Lessons</Text>

        {modules.map((m, mIdx) => {
          const moduleLessons = lessons.filter((l) => l.moduleId === m.id);
          const moduleExamQuestions = examQuestions.filter((q) => q.moduleId === m.id);
          const isAdding = showAddLesson === m.id;

          return (
            <Card key={m.id} className="mb-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-bold text-brand-400">
                  Module {m.order || mIdx + 1}: {m.title}
                </Text>
                <Button
                  title={isAdding ? 'Cancel' : '+ Add Lesson'}
                  variant="outline"
                  onPress={() => setShowAddLesson(isAdding ? null : m.id!)}
                />
              </View>

              {isAdding && (
                <View className="bg-slate-900/90 p-4 rounded-xl mb-4 border border-surface-border">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-white font-semibold">
                      {editingLessonId ? '✏️ Edit Lesson' : '➕ New Lesson'}
                    </Text>
                    {editingLessonId && (
                      <TouchableOpacity
                        onPress={() => {
                          if (Platform.OS === 'web') {
                            if (window.confirm('Are you sure you want to delete this lesson?')) {
                              deleteLessonMutation.mutate(editingLessonId);
                            }
                          } else {
                            Alert.alert('Delete Lesson', 'Are you sure?', [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Delete', style: 'destructive', onPress: () => deleteLessonMutation.mutate(editingLessonId) },
                            ]);
                          }
                        }}
                        className="bg-red-600/30 border border-red-500/50 px-2.5 py-1 rounded"
                      >
                        <Text className="text-red-300 text-xs font-bold">🗑️ Delete Lesson</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Input
                    label="Lesson Title"
                    value={lessonTitle}
                    onChangeText={setLessonTitle}
                    placeholder="e.g. Introduction to Blockchain"
                  />
                  <Input
                    label="YouTube URL or Video ID"
                    value={youtubeUrl}
                    onChangeText={setYoutubeUrl}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <Input
                    label="Intro Markdown Text"
                    value={introMarkdown}
                    onChangeText={setIntroMarkdown}
                    placeholder="Markdown formatted text..."
                    multiline
                    numberOfLines={3}
                  />

                  {/* PDF Attachment Section */}
                  <View className="mb-4 p-3 bg-slate-950/70 rounded-xl border border-slate-700">
                    <Text className="text-white font-semibold text-xs mb-1">
                      📄 Lesson PDF Note / Study Guide (Optional)
                    </Text>
                    <Text className="text-slate-400 text-[11px] mb-3 leading-4">
                      Attach a PDF document (summary, slides, cheat sheet) for students to download and study.
                    </Text>

                    {lessonPdfUrl ? (
                      <View className="flex-row items-center justify-between p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-lg mb-3">
                        <View className="flex-row items-center gap-2 flex-1 mr-2">
                          <Text style={{ fontSize: 18 }}>📄</Text>
                          <View className="flex-1">
                            <Text className="text-emerald-300 font-semibold text-xs" numberOfLines={1}>
                              {lessonPdfName || 'Attached PDF Document'}
                            </Text>
                            <Text className="text-slate-400 text-[10px]" numberOfLines={1}>
                              {lessonPdfUrl.startsWith('data:') ? 'Base64 document attached' : lessonPdfUrl}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row gap-2">
                          <TouchableOpacity
                            onPress={() => {
                              if (Platform.OS === 'web') window.open(lessonPdfUrl, '_blank');
                              else Linking.openURL(lessonPdfUrl);
                            }}
                            className="bg-blue-600 px-2.5 py-1 rounded"
                          >
                            <Text className="text-white text-xs font-bold">View</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              setLessonPdfUrl('');
                              setLessonPdfName('');
                            }}
                            className="bg-red-600 px-2.5 py-1 rounded"
                          >
                            <Text className="text-white text-xs font-bold">Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}

                    <View className="flex-row gap-2 items-center flex-wrap">
                      <Button
                        title={isUploadingPdf ? 'Uploading PDF...' : '📁 Upload PDF File'}
                        variant="secondary"
                        onPress={handlePickPdfFile}
                        disabled={isUploadingPdf}
                      />
                      <Text className="text-slate-500 text-xs">or enter direct link:</Text>
                    </View>

                    <Input
                      value={lessonPdfUrl.startsWith('data:') ? '[Uploaded PDF File]' : lessonPdfUrl}
                      onChangeText={(val) => {
                        setLessonPdfUrl(val);
                        if (val && !lessonPdfName) {
                          setLessonPdfName('Lesson_Notes.pdf');
                        }
                      }}
                      placeholder="https://.../notes.pdf"
                      className="mt-2"
                    />
                  </View>

                  <View className="flex-row gap-2 justify-end">
                    <Button
                      title="Cancel"
                      variant="outline"
                      onPress={() => {
                        setShowAddLesson(null);
                        setEditingLessonId(null);
                        setLessonTitle('');
                        setYoutubeUrl('');
                        setIntroMarkdown('');
                        setLessonPdfUrl('');
                        setLessonPdfName('');
                      }}
                    />
                    <Button
                      title={editingLessonId ? 'Update Lesson' : 'Save Lesson'}
                      onPress={() => addLessonMutation.mutate(m.id!)}
                      loading={addLessonMutation.isPending}
                    />
                  </View>
                </View>
              )}

              {moduleLessons.length === 0 ? (
                <Text className="text-slate-500 text-sm italic mb-2">No lessons added yet.</Text>
              ) : (
                moduleLessons.map((les) => (
                  <View
                    key={les.id}
                    className="p-3 bg-slate-800/80 rounded-xl mb-2 flex-row justify-between items-center border border-slate-700"
                  >
                    <View className="flex-1 mr-2">
                      <Text className="text-white font-semibold text-base">{les.title}</Text>
                      <View className="flex-row items-center gap-3 mt-1 flex-wrap">
                        <Text className="text-xs text-slate-400">YouTube ID: {les.youtubeVideoId}</Text>
                        {les.pdfUrl ? (
                          <TouchableOpacity
                            onPress={() => {
                              if (Platform.OS === 'web') window.open(les.pdfUrl, '_blank');
                              else Linking.openURL(les.pdfUrl!);
                            }}
                            className="flex-row items-center gap-1 bg-red-950/60 border border-red-500/40 px-2 py-0.5 rounded"
                          >
                            <Text style={{ fontSize: 10 }}>📄</Text>
                            <Text className="text-red-300 text-[10px] font-bold">
                              PDF: {les.pdfName || 'Download Note'}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <Text className="text-slate-500 text-[10px] italic">No PDF note</Text>
                        )}
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <TouchableOpacity
                        onPress={() => {
                          setShowAddLesson(m.id!);
                          setEditingLessonId(les.id || null);
                          setLessonTitle(les.title);
                          setYoutubeUrl(les.youtubeVideoId ? `https://www.youtube.com/watch?v=${les.youtubeVideoId}` : '');
                          setIntroMarkdown(les.introMarkdown || '');
                          setLessonPdfUrl(les.pdfUrl || '');
                          setLessonPdfName(les.pdfName || '');
                        }}
                        className="bg-slate-700 hover:bg-slate-600 px-2.5 py-1 rounded border border-slate-600"
                      >
                        <Text className="text-white text-xs font-semibold">✏️ Edit</Text>
                      </TouchableOpacity>
                      <Badge label="PUBLISHED" variant="success" />
                    </View>
                  </View>
                ))
              )}

              {/* Module Exam Stuck at Same UI */}
              <View className="mt-3 pt-3 border-t border-slate-700/60">
                <View className="flex-row justify-between items-center mb-2 flex-wrap gap-2">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-amber-400 font-bold text-sm">
                      📝 Module {m.order || mIdx + 1} Assessment ({moduleExamQuestions.length} Questions)
                    </Text>
                    <View className="bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                      <Text className="text-amber-300 text-[10px] font-bold">80% PASS REQ</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      setManualTargetModule(m.id!);
                      setShowAddManual(true);
                    }}
                    style={{
                      backgroundColor: 'rgba(245,158,11,0.15)',
                      borderColor: '#F59E0B',
                      borderWidth: 1,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '700' }}>
                      + Add Question to Module
                    </Text>
                  </TouchableOpacity>
                </View>

                {moduleExamQuestions.length === 0 ? (
                  <Text className="text-slate-500 text-xs italic">
                    No custom questions added. High-yield default assessment questions are active for student 80% passing evaluation.
                  </Text>
                ) : (
                  <View className="gap-1.5 mt-1">
                    {moduleExamQuestions.map((mq, mqIdx) => (
                      <View
                        key={mq.id || mqIdx}
                        className="p-2.5 bg-slate-900/70 rounded-lg border border-slate-800 flex-row justify-between items-center"
                      >
                        <View className="flex-1 mr-2">
                          <Text className="text-white text-xs font-semibold" numberOfLines={1}>
                            {mqIdx + 1}. {mq.text}
                          </Text>
                          <Text className="text-emerald-400 text-[11px] font-medium">
                            ✓ Correct: {mq.options.find((o) => o.id === (mq as any).correctOptionId)?.text || 'Option 1'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            if (mq.id) deleteQuestionMutation.mutate(mq.id);
                          }}
                          style={{ padding: 4 }}
                        >
                          <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: 'bold' }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </Card>
          );
        })}

        {/* Add Module */}
        <Card className="mb-6">
          <Text className="text-base font-bold text-white mb-2">Add New Module</Text>
          <View className="flex-row items-center space-x-2">
            <View className="flex-1">
              <Input
                value={newModuleTitle}
                onChangeText={setNewModuleTitle}
                placeholder="Module title (e.g. Module 1: Fundamentals)"
              />
            </View>
            <Button
              title="Add"
              onPress={() => addModuleMutation.mutate()}
              loading={addModuleMutation.isPending}
              className="ml-2 mb-4"
            />
          </View>
        </Card>

        {/* Course Final Exam Pool (Separated) */}
        <View className="flex-row justify-between items-center mb-4 flex-wrap gap-2">
          <View>
            <Text className="text-xl font-bold text-white">Course Final Exam Pool (Separated)</Text>
            <Text className="text-xs text-slate-400">
              {examQuestions.filter(q => !q.moduleId).length} final certification questions ({examQuestions.length} total) • Separated from module exams
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Button
              title={showAddManual ? 'Cancel' : '+ Add Question'}
              variant={showAddManual ? 'outline' : 'secondary'}
              onPress={() => {
                setShowAddManual(!showAddManual);
                if (showBulkExam) setShowBulkExam(false);
              }}
            />
            <Button
              title={showBulkExam ? 'Cancel' : '📁 Browse / Import'}
              variant={showBulkExam ? 'outline' : 'primary'}
              onPress={() => {
                setShowBulkExam(!showBulkExam);
                if (showAddManual) setShowAddManual(false);
              }}
            />
          </View>
        </View>

        {/* 1. Bulk File Import Card */}
        {showBulkExam && (
          <Card className="mb-6 border-brand-500 bg-surface-card p-5">
            <Text className="text-base font-bold text-white mb-1">Import Questions (CSV or JSON)</Text>
            <Text className="text-xs text-slate-400 mb-3 leading-5">
              Select a .csv or .json file from your computer or paste questions. Supported CSV columns: Question Text, Option 1, Option 2, Option 3, Option 4, CorrectIndex (1-4), Explanation.
            </Text>

            {/* File Pick & Template Action Bar */}
            <View className="flex-row gap-3 mb-4 flex-wrap">
              <TouchableOpacity
                onPress={handlePickQuestionFile}
                activeOpacity={0.8}
                style={{
                  backgroundColor: 'rgba(59,130,246,0.18)',
                  borderColor: '#3B82F6',
                  borderWidth: 1,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 16 }}>📂</Text>
                <Text style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: 13 }}>Browse File from Device</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleInsertTemplate}
                activeOpacity={0.8}
                style={{
                  backgroundColor: 'rgba(148,163,184,0.12)',
                  borderColor: 'rgba(148,163,184,0.3)',
                  borderWidth: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 14 }}>📋</Text>
                <Text style={{ color: '#94A3B8', fontWeight: '600', fontSize: 13 }}>Insert Sample CSV</Text>
              </TouchableOpacity>
            </View>

            {pickedFileName && (
              <View className="mb-3 p-2.5 bg-blue-950/60 border border-blue-500/50 rounded-xl flex-row justify-between items-center">
                <Text className="text-blue-300 text-xs font-semibold">✓ Selected file: {pickedFileName}</Text>
                <TouchableOpacity onPress={() => { setPickedFileName(null); setBulkText(''); }}>
                  <Text className="text-slate-400 text-xs">Clear</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Target Destination Selector */}
            <View className="mb-3">
              <Text className="text-xs font-semibold text-slate-300 mb-2">Assign Questions To:</Text>
              <View className="flex-row flex-wrap gap-2">
                <TouchableOpacity
                  onPress={() => setBulkImportTargetModule('course_exam')}
                  style={{
                    backgroundColor: bulkImportTargetModule === 'course_exam' ? '#3B82F6' : 'rgba(30,41,59,0.8)',
                    borderColor: bulkImportTargetModule === 'course_exam' ? '#60A5FA' : '#334155',
                    borderWidth: 1,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 99,
                  }}
                >
                  <Text style={{ color: bulkImportTargetModule === 'course_exam' ? '#FFF' : '#94A3B8', fontSize: 12, fontWeight: '700' }}>
                    🎓 Course Final Exam (All Modules)
                  </Text>
                </TouchableOpacity>

                {modules.map((m, idx) => {
                  const isSel = bulkImportTargetModule === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => setBulkImportTargetModule(m.id!)}
                      style={{
                        backgroundColor: isSel ? '#F59E0B' : 'rgba(30,41,59,0.8)',
                        borderColor: isSel ? '#FBBF24' : '#334155',
                        borderWidth: 1,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 99,
                      }}
                    >
                      <Text style={{ color: isSel ? '#000' : '#94A3B8', fontSize: 12, fontWeight: isSel ? '800' : '600' }}>
                        Module {m.order || idx + 1}: {m.title.length > 20 ? m.title.slice(0, 18) + '...' : m.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Input
              value={bulkText}
              onChangeText={setBulkText}
              placeholder="Or paste CSV rows or JSON array directly here..."
              multiline
              numberOfLines={6}
            />

            {bulkImportError && (
              <View className="mb-3 p-2 bg-red-950/60 border border-red-500/50 rounded-lg">
                <Text className="text-red-300 text-xs">{bulkImportError}</Text>
              </View>
            )}

            <Button
              title="Import Questions to Exam Pool"
              onPress={() => bulkImportExamMutation.mutate()}
              loading={bulkImportExamMutation.isPending}
            />
          </Card>
        )}

        {/* 2. Manual Question Creation Card */}
        {showAddManual && (
          <Card className="mb-6 border-amber-500 bg-surface-card p-5">
            <Text className="text-base font-bold text-white mb-1">Add Question Manually</Text>
            <Text className="text-xs text-slate-400 mb-4">
              Create an individual question, set 4 choices, select the correct answer, and specify its target assessment.
            </Text>

            {/* Target Assessment Destination */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-slate-300 mb-2">Target Assessment Destination *</Text>
              <View className="flex-row flex-wrap gap-2">
                <TouchableOpacity
                  onPress={() => setManualTargetModule('course_exam')}
                  style={{
                    backgroundColor: manualTargetModule === 'course_exam' ? '#3B82F6' : 'rgba(30,41,59,0.8)',
                    borderColor: manualTargetModule === 'course_exam' ? '#60A5FA' : '#334155',
                    borderWidth: 1,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 99,
                  }}
                >
                  <Text style={{ color: manualTargetModule === 'course_exam' ? '#FFF' : '#94A3B8', fontSize: 12, fontWeight: '700' }}>
                    🎓 Course Final Exam
                  </Text>
                </TouchableOpacity>

                {modules.map((m, idx) => {
                  const isSel = manualTargetModule === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => setManualTargetModule(m.id!)}
                      style={{
                        backgroundColor: isSel ? '#F59E0B' : 'rgba(30,41,59,0.8)',
                        borderColor: isSel ? '#FBBF24' : '#334155',
                        borderWidth: 1,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 99,
                      }}
                    >
                      <Text style={{ color: isSel ? '#000' : '#94A3B8', fontSize: 12, fontWeight: isSel ? '800' : '600' }}>
                        Module {m.order || idx + 1}: {m.title.length > 20 ? m.title.slice(0, 18) + '...' : m.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Input
              label="Question Prompt / Text *"
              value={manualText}
              onChangeText={setManualText}
              placeholder="e.g. What is the fundamental requirement before scaling an order?"
              multiline
              numberOfLines={2}
            />

            <View className="grid grid-cols-1 gap-2 mb-2">
              <Input
                label="Option 1 (A) *"
                value={manualOpt1}
                onChangeText={setManualOpt1}
                placeholder="First answer choice..."
              />
              <Input
                label="Option 2 (B) *"
                value={manualOpt2}
                onChangeText={setManualOpt2}
                placeholder="Second answer choice..."
              />
              <Input
                label="Option 3 (C) (Optional)"
                value={manualOpt3}
                onChangeText={setManualOpt3}
                placeholder="Third answer choice..."
              />
              <Input
                label="Option 4 (D) (Optional)"
                value={manualOpt4}
                onChangeText={setManualOpt4}
                placeholder="Fourth answer choice..."
              />
            </View>

            {/* Correct Choice Radio Selector */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-slate-300 mb-2">Select Which Option is Correct *</Text>
              <View className="flex-row gap-2 flex-wrap">
                {[
                  { id: 'opt-1', label: 'Option 1 (A)' },
                  { id: 'opt-2', label: 'Option 2 (B)' },
                  { id: 'opt-3', label: 'Option 3 (C)' },
                  { id: 'opt-4', label: 'Option 4 (D)' },
                ].map((opt) => {
                  const isCorrect = manualCorrectOpt === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setManualCorrectOpt(opt.id)}
                      style={{
                        backgroundColor: isCorrect ? 'rgba(34,197,94,0.2)' : 'rgba(30,41,59,0.8)',
                        borderColor: isCorrect ? '#22C55E' : '#334155',
                        borderWidth: 1.5,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Text style={{ fontSize: 13 }}>{isCorrect ? '✓' : '○'}</Text>
                      <Text style={{ color: isCorrect ? '#22C55E' : '#94A3B8', fontWeight: isCorrect ? '700' : '500', fontSize: 12 }}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Input
              label="Explanation (Shown after answering)"
              value={manualExplanation}
              onChangeText={setManualExplanation}
              placeholder="Explain why this option is correct..."
            />

            {manualError && (
              <View className="mb-3 p-2 bg-red-950/60 border border-red-500/50 rounded-lg">
                <Text className="text-red-300 text-xs">{manualError}</Text>
              </View>
            )}

            <Button
              title="Save Question to Exam Pool"
              onPress={() => addManualQuestionMutation.mutate()}
              loading={addManualQuestionMutation.isPending}
            />
          </Card>
        )}

        {/* 3. Questions Filter & List */}
        <View className="mb-3">
          <View className="flex-row gap-2 flex-wrap items-center">
            <Text className="text-xs text-slate-400 font-semibold mr-1">Filter:</Text>
            <TouchableOpacity
              onPress={() => setQuestionFilter('all')}
              style={{
                backgroundColor: questionFilter === 'all' ? '#3B82F6' : 'rgba(30,41,59,0.8)',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 99,
              }}
            >
              <Text style={{ color: questionFilter === 'all' ? '#FFF' : '#94A3B8', fontSize: 11, fontWeight: '700' }}>
                All ({examQuestions.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setQuestionFilter('final')}
              style={{
                backgroundColor: questionFilter === 'final' ? '#3B82F6' : 'rgba(30,41,59,0.8)',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 99,
              }}
            >
              <Text style={{ color: questionFilter === 'final' ? '#FFF' : '#94A3B8', fontSize: 11, fontWeight: '700' }}>
                Final Exam Only ({examQuestions.filter((q) => !q.moduleId).length})
              </Text>
            </TouchableOpacity>

            {modules.map((m, idx) => {
              const count = examQuestions.filter((q) => q.moduleId === m.id).length;
              const isSel = questionFilter === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setQuestionFilter(m.id!)}
                  style={{
                    backgroundColor: isSel ? '#F59E0B' : 'rgba(30,41,59,0.8)',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 99,
                  }}
                >
                  <Text style={{ color: isSel ? '#000' : '#94A3B8', fontSize: 11, fontWeight: isSel ? '800' : '600' }}>
                    Module {m.order || idx + 1} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Questions List */}
        {examQuestions.length === 0 ? (
          <Card className="p-6 items-center justify-center border-dashed border-slate-700">
            <Text className="text-slate-400 text-sm mb-2">No exam questions added yet.</Text>
            <Text className="text-slate-500 text-xs text-center max-w-sm mb-4">
              Click &quot;Browse / Import&quot; to pick a CSV/JSON file from your computer or &quot;+ Add Question&quot; to create one manually.
            </Text>
          </Card>
        ) : (
          <View className="gap-3">
            {examQuestions
              .filter((q) => {
                if (questionFilter === 'all') return true;
                if (questionFilter === 'final') return !q.moduleId;
                return q.moduleId === questionFilter;
              })
              .map((q, idx) => {
                const targetMod = modules.find((m) => m.id === q.moduleId);
                return (
                  <View
                    key={q.id || idx}
                    className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800"
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-row items-center gap-2 flex-wrap flex-1 mr-2">
                        <View
                          style={{
                            backgroundColor: q.moduleId ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                            borderColor: q.moduleId ? '#F59E0B' : '#3B82F6',
                            borderWidth: 1,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: q.moduleId ? '#FBBF24' : '#60A5FA',
                              fontSize: 10,
                              fontWeight: '700',
                            }}
                          >
                            {targetMod ? `Module ${targetMod.order || ''}: ${targetMod.title}` : '🎓 Course Final Exam'}
                          </Text>
                        </View>
                        <Text className="text-slate-500 text-xs">#{idx + 1}</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          if (q.id) deleteQuestionMutation.mutate(q.id);
                        }}
                        style={{
                          backgroundColor: 'rgba(239,68,68,0.15)',
                          borderWidth: 1,
                          borderColor: 'rgba(239,68,68,0.4)',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700' }}>✕ Delete</Text>
                      </TouchableOpacity>
                    </View>

                    <Text className="text-white font-semibold text-sm mb-3">{q.text}</Text>

                    <View className="gap-1.5 mb-2">
                      {q.options.map((opt) => {
                        const isCorrect = (q as any).correctOptionId === opt.id;
                        return (
                          <View
                            key={opt.id}
                            style={{
                              backgroundColor: isCorrect ? 'rgba(34,197,94,0.15)' : 'rgba(30,41,59,0.5)',
                              borderColor: isCorrect ? '#22C55E' : 'rgba(51,65,85,0.5)',
                              borderWidth: 1,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 8,
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ color: isCorrect ? '#4ADE80' : '#CBD5E1', fontSize: 12 }}>
                              {opt.text}
                            </Text>
                            {isCorrect && (
                              <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '700' }}>✓ Correct</Text>
                            )}
                          </View>
                        );
                      })}
                    </View>

                    {(q as any).explanation ? (
                      <Text className="text-xs text-slate-400 italic">
                        Explanation: {(q as any).explanation}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}
