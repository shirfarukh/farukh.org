import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
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
  createModule,
  createOrUpdateLesson,
  saveExamQuestion,
  deleteExamQuestion,
  getExamQuestions,
} from '../../../src/features/admin/adminApi';
import { parseBulkQuestions } from '../../../src/features/admin/csvImport';
import { extractYouTubeId } from '../../../src/lib/utils';
import { Image, TouchableOpacity, Platform } from 'react-native';
import { CategorySelector } from '../../../src/components/ui/CategorySelector';
import { CourseImageInput } from '../../../src/components/ui/CourseImageInput';

export default function AdminCourseEditScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
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
  const [saveCourseSuccess, setSaveCourseSuccess] = useState(false);

  // Lesson Form State
  const [lessonTitle, setLessonTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [introMarkdown, setIntroMarkdown] = useState('');

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
      const vId = extractYouTubeId(youtubeUrl) || 'REPLACE_ME';
      await createOrUpdateLesson(courseId, {
        moduleId,
        title: lessonTitle,
        introMarkdown: introMarkdown || 'Introductory content for this lesson.',
        youtubeVideoId: vId,
        durationSec: 300,
        quizPassPercentage: 70,
        status: 'published',
        order: lessons.length + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLessons', courseId] });
      setShowAddLesson(null);
      setLessonTitle('');
      setYoutubeUrl('');
      setIntroMarkdown('');
    },
  });

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
                  <Badge label={course.status?.toUpperCase() || 'PUBLISHED'} variant="success" />
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

            <Button
              title={isEditingCourse ? 'Close' : '✎ Edit Course Info'}
              variant={isEditingCourse ? 'secondary' : 'outline'}
              onPress={() => setIsEditingCourse(!isEditingCourse)}
            />
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
                label="Course Body & Detailed Syllabus"
                value={editBody}
                onChangeText={setEditBody}
                placeholder="Full course content..."
                multiline
                numberOfLines={4}
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
                  <Text className="text-white font-semibold mb-2">New Lesson</Text>
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
                  <Button
                    title="Save Lesson"
                    onPress={() => addLessonMutation.mutate(m.id!)}
                    loading={addLessonMutation.isPending}
                  />
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
                      <Text className="text-xs text-slate-400">YouTube ID: {les.youtubeVideoId}</Text>
                    </View>
                    <Badge label="PUBLISHED" variant="success" />
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
