import React, { useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { ProgressBar } from '../../../src/components/ProgressBar';
import { LessonVideo } from '../../../src/components/LessonVideo';
import { useAuth } from '../../../src/features/auth/useAuth';
import { useTheme } from '../../../src/features/theme/ThemeContext';
import {
  getCourseDetail,
  getCourseProgress,
  enrollInCourse,
  getCourseModuleExams,
  saveModuleExamResult,
  getModuleExamQuestions,
  getModuleAttemptsInfo,
  ModuleExamRecord,
} from '../../../src/features/student/studentApi';
import { getCourseModules, getCourseLessons } from '../../../src/features/admin/adminApi';
import { QuizQuestion } from '../../../src/types/quiz';

export default function StudentCourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');

  // Inline Module Exam Assessment Runner State
  const [activeExamModule, setActiveExamModule] = useState<{ id: string; title: string; order?: number; index: number } | null>(null);
  const [examQuestions, setExamQuestions] = useState<(QuizQuestion & { correctOptionId?: string; explanation?: string })[]>([]);
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examStep, setExamStep] = useState(0);
  const [isLoadingExam, setIsLoadingExam] = useState(false);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [examResult, setExamResult] = useState<{
    score: number;
    passed: boolean;
    correctCount: number;
    totalQuestions: number;
    feedback: Record<string, { correct: boolean; correctOptionId?: string; explanation?: string }>;
  } | null>(null);

  const { data: course } = useQuery({
    queryKey: ['courseDetail', courseId],
    queryFn: () => getCourseDetail(courseId!),
    enabled: !!courseId,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['courseModules', courseId],
    queryFn: () => getCourseModules(courseId!),
    enabled: !!courseId,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['courseLessons', courseId],
    queryFn: () => getCourseLessons(courseId!),
    enabled: !!courseId,
  });

  const { data: progress = {} } = useQuery({
    queryKey: ['courseProgress', user?.uid, courseId],
    queryFn: () => getCourseProgress(user!.uid, courseId!),
    enabled: !!user?.uid && !!courseId,
  });

  const { data: moduleExams = {} } = useQuery({
    queryKey: ['courseModuleExams', user?.uid, courseId],
    queryFn: () => getCourseModuleExams(user!.uid, courseId!),
    enabled: !!user?.uid && !!courseId,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (user?.uid && courseId) {
        await enrollInCourse(user.uid, courseId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseProgress', user?.uid, courseId] });
    },
  });

  const handleStartExam = async (m: { id?: string; title: string; order?: number }, index: number) => {
    const modId = m.id || `mod-${index}`;
    const examRecord = moduleExams[modId];
    const attemptInfo = getModuleAttemptsInfo(examRecord);

    if (!attemptInfo.canAttempt) {
      const msg = isPersian
        ? `محدودیت تلاش: سوالات هر ماژول حداکثر ۲ بار در هر ۲۴ ساعت قابل پاسخ‌گویی هستند. تلاش بعدی شما پس از ${attemptInfo.hoursRemaining} ساعت و ${attemptInfo.minutesRemaining} دقیقه در دسترس خواهد بود.`
        : `Attempt limit reached: Module questions have a maximum of 2 tries in every 24 hours. Your next try will unlock in ${attemptInfo.hoursRemaining}h ${attemptInfo.minutesRemaining}m.`;
      Alert.alert(isPersian ? 'محدودیت تعداد تلاش (۲۴ ساعته)' : '24-Hour Attempt Limit', msg);
      return;
    }

    setActiveExamModule({ ...m, id: modId, index });
    setExamAnswers({});
    setExamStep(0);
    setExamResult(null);
    setIsLoadingExam(true);

    try {
      const qs = await getModuleExamQuestions(courseId!, modId, course?.title, m.title);
      setExamQuestions(qs);
    } catch (err) {
      console.error('Failed to load exam questions:', err);
    } finally {
      setIsLoadingExam(false);
    }
  };

  const handleCloseInlineExam = () => {
    setActiveExamModule(null);
    setExamResult(null);
    setExamAnswers({});
    setExamStep(0);
  };

  const handleSubmitExam = async () => {
    if (!user?.uid || !courseId || !activeExamModule) return;

    const examRecord = moduleExams[activeExamModule.id];
    const attemptInfo = getModuleAttemptsInfo(examRecord);
    if (!attemptInfo.canAttempt) {
      Alert.alert(
        isPersian ? 'محدودیت تلاش' : 'Attempt Limit',
        isPersian
          ? `شما ۲ تلاش مجاز در ۲۴ ساعت را استفاده کرده‌اید.`
          : `You have reached the maximum 2 attempts in 24 hours for this module.`
      );
      return;
    }

    setIsSubmittingExam(true);

    try {
      let correct = 0;
      const feedback: Record<string, { correct: boolean; correctOptionId?: string; explanation?: string }> = {};

      examQuestions.forEach((q) => {
        const chosen = examAnswers[q.id!];
        const isCorrect = chosen === q.correctOptionId;
        if (isCorrect) correct++;
        feedback[q.id!] = {
          correct: isCorrect,
          correctOptionId: q.correctOptionId,
          explanation: q.explanation || '',
        };
      });

      const total = examQuestions.length;
      const score = total > 0 ? Math.round((correct / total) * 100) : 100;
      const passed = score >= 80;

      const currentModuleLessons = lessons.filter((l) => l.moduleId === activeExamModule.id);
      const moduleLessonIds = currentModuleLessons.map((l) => l.id!).filter(Boolean);

      // Save result and mark module as finished if score >= 80%
      await saveModuleExamResult(user.uid, courseId, activeExamModule.id, score, total, correct, moduleLessonIds);
      await queryClient.invalidateQueries({ queryKey: ['courseModuleExams', user.uid, courseId] });
      await queryClient.invalidateQueries({ queryKey: ['courseProgress', user.uid, courseId] });

      setExamResult({
        score,
        passed,
        correctCount: correct,
        totalQuestions: total,
        feedback,
      });
    } catch (err) {
      console.error('Error submitting exam:', err);
    } finally {
      setIsSubmittingExam(false);
    }
  };

  if (!course) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  // Calculate Course Progress
  const publishedLessons = lessons.filter((l) => l.status === 'published');
  const completedCount = publishedLessons.filter((l) => progress[l.id!]?.completed).length;
  const progressPercent = publishedLessons.length > 0 ? (completedCount / publishedLessons.length) * 100 : 0;
  
  // All modules passed/finished check for final exam eligibility
  const allModulesPassed = modules.length > 0 && modules.every((m) => moduleExams[m.id!]?.passed === true || moduleExams[m.id!]?.finished === true);
  const allLessonsCompleted = publishedLessons.length > 0 && completedCount === publishedLessons.length && allModulesPassed;
  const finishedModulesCount = modules.filter((m) => moduleExams[m.id!]?.finished === true || moduleExams[m.id!]?.passed === true).length;

  return (
    <ScreenWrapper>
      <View className="max-w-4xl w-full self-center">
        {/* Header Banner */}
        <Card className="mb-6">
          <Text style={{ color: colors.text }} className="text-2xl font-bold mb-2">{course.title}</Text>
          <Text style={{ color: colors.textSecondary }} className="text-sm mb-3 leading-6">{course.body || course.description}</Text>

          {course.keywords && course.keywords.length > 0 && (
            <View className="flex-row flex-wrap gap-1.5 mb-4">
              {course.keywords.map((kw, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: colors.badgeBg,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    paddingHorizontal: 10,
                    paddingVertical: 2,
                    borderRadius: 99,
                  }}
                >
                  <Text style={{ color: colors.badgeText }} className="text-xs font-semibold">#{kw}</Text>
                </View>
              ))}
            </View>
          )}

          {course.youtubeVideoId && (
            <View style={{ borderColor: colors.cardBorder }} className="mb-4 rounded-2xl overflow-hidden border">
              <LessonVideo videoId={course.youtubeVideoId} />
            </View>
          )}

          <ProgressBar progress={progressPercent} />

          <View style={{ borderTopWidth: 1, borderTopColor: colors.cardBorder }} className="flex-row justify-between items-center mt-3 pt-3">
            <Text style={{ color: colors.textSecondary }} className="text-xs">
              {completedCount} of {publishedLessons.length} lessons • {finishedModulesCount} of {modules.length} modules finished
            </Text>
            {allLessonsCompleted ? (
              <Button
                title="Take Course Final Exam →"
                variant="primary"
                onPress={() => router.push(`/(student)/exam/${courseId}` as any)}
              />
            ) : (
              <Button
                title="Enroll / Continue"
                variant="secondary"
                onPress={() => enrollMutation.mutate()}
                loading={enrollMutation.isPending}
              />
            )}
          </View>
        </Card>

        {/* Modules & Lessons Outline */}
        <View className="flex-row justify-between items-center mb-3">
          <Text style={{ color: colors.text }} className="text-xl font-bold">Course Curriculum & Assessments</Text>
          <Text style={{ color: colors.textMuted }} className="text-xs">Module exams run inline • Pass ≥80% to advance</Text>
        </View>

        {modules.map((m, mIdx) => {
          const modId = m.id || `mod-${mIdx}`;
          const moduleLessons = publishedLessons.filter((l) => l.moduleId === m.id);
          const examRecord: ModuleExamRecord | undefined = moduleExams[modId];
          const isExamActiveHere = activeExamModule?.id === modId;
          const isFinished = examRecord?.finished === true || examRecord?.passed === true;
          const attemptInfo = getModuleAttemptsInfo(examRecord);

          // Sequential Module Unlock Rule:
          // Module 0 is always unlocked.
          // Module i (i > 0) is unlocked only if Module i - 1's exam is passed/finished with >= 80%.
          const prevModule = mIdx > 0 ? modules[mIdx - 1] : null;
          const prevExam = prevModule?.id ? moduleExams[prevModule.id] : null;
          const isModuleUnlocked = mIdx === 0 || (prevExam && (prevExam.passed === true || prevExam.finished === true));

          return (
            <Card
              key={modId}
              className="mb-5"
              style={{
                opacity: isModuleUnlocked ? 1 : 0.65,
                borderColor: !isModuleUnlocked
                  ? colors.cardBorder
                  : isFinished
                  ? 'rgba(34,197,94,0.45)'
                  : isExamActiveHere
                  ? '#3B82F6'
                  : colors.cardBorder,
                borderWidth: isExamActiveHere || isFinished ? 1.5 : 1,
              }}
            >
              {/* Module Header Bar */}
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center gap-2 flex-1 mr-2">
                  {isFinished ? (
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: 'rgba(34,197,94,0.2)',
                        borderWidth: 1,
                        borderColor: '#22C55E',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#22C55E', fontWeight: '900', fontSize: 12 }}>✓</Text>
                    </View>
                  ) : null}
                  <Text style={{ color: isFinished ? '#22C55E' : colors.gold }} className="text-lg font-bold">
                    Module {m.order || mIdx + 1}: {m.title}
                  </Text>
                </View>

                {isFinished ? (
                  <Badge label={`✓ FINISHED (${examRecord?.score || 80}%)`} variant="success" />
                ) : !isModuleUnlocked ? (
                  <Badge label="LOCKED" variant="warning" />
                ) : !attemptInfo.canAttempt ? (
                  <Badge label={`COOLDOWN (${attemptInfo.hoursRemaining}h)`} variant="warning" />
                ) : examRecord ? (
                  <Badge label={`RETAKE (${attemptInfo.triesRemaining} TRY LEFT)`} variant="warning" />
                ) : (
                  <Badge label="2 TRIES / 24H" variant="info" />
                )}
              </View>

              {/* Locked Warning Banner */}
              {!isModuleUnlocked && (
                <View
                  style={{
                    backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)',
                    borderColor: 'rgba(239,68,68,0.3)',
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>🔒</Text>
                  <View className="flex-1">
                    <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 13 }}>
                      Module Locked
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                      You must pass Module {mIdx}: &quot;{prevModule?.title}&quot; exam with at least 80% to access this module.
                    </Text>
                  </View>
                </View>
              )}

              {/* Lessons List in Module */}
              <View className="mb-3">
                {moduleLessons.map((les) => {
                  const lessonProg = progress[les.id!];
                  const isCompleted = lessonProg?.completed || false;
                  const isLessonAccessible = isModuleUnlocked;

                  return (
                    <TouchableOpacity
                      key={les.id}
                      disabled={!isLessonAccessible}
                      onPress={() => router.push(`/(student)/lesson/${courseId}/${les.id}` as any)}
                      style={{
                        backgroundColor: isCompleted
                          ? colors.successBg
                          : isLessonAccessible
                          ? colors.cardHover
                          : isDark ? 'rgba(15,23,42,0.4)' : '#F1F5F9',
                        borderColor: isCompleted
                          ? colors.success
                          : colors.cardBorder,
                        borderWidth: 1,
                        padding: 14,
                        borderRadius: 14,
                        marginBottom: 10,
                        opacity: isLessonAccessible ? 1 : 0.5,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <View className="flex-1 mr-3">
                        <Text
                          style={{
                            color: isLessonAccessible ? colors.text : colors.textMuted,
                            fontWeight: '600',
                            fontSize: 15,
                          }}
                        >
                          {les.order}. {les.title}
                        </Text>
                        {lessonProg?.quizScore ? (
                          <Text style={{ color: colors.success }} className="text-xs mt-0.5 font-bold">
                            Lesson Quiz Score: {lessonProg.quizScore}%
                          </Text>
                        ) : null}
                      </View>

                      {isCompleted ? (
                        <Badge label="COMPLETED" variant="success" />
                      ) : isLessonAccessible ? (
                        <Badge label="START LESSON" variant="info" />
                      ) : (
                        <Badge label="LOCKED" variant="warning" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* MODULE EXAM — STUCK IN SAME UI (Inline Runner) */}
              {isExamActiveHere ? (
                /* 1. ACTIVE INLINE EXAM RUNNER */
                <View
                  style={{
                    backgroundColor: isDark ? 'rgba(15,23,42,0.85)' : '#F8FAFC',
                    borderColor: '#3B82F6',
                    borderWidth: 1.5,
                    borderRadius: 16,
                    padding: 16,
                    marginTop: 6,
                  }}
                >
                  {/* Top Bar with Title & Close button */}
                  <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-slate-700/50">
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center gap-2">
                        <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '700' }}>
                          MODULE {m.order || mIdx + 1} ASSESSMENT
                        </Text>
                        <Badge label="80% TO PASS" variant="warning" />
                      </View>
                      <Text style={{ color: colors.text, fontSize: 15, fontWeight: 'bold', marginTop: 2 }}>
                        {m.title}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={handleCloseInlineExam}
                      style={{
                        backgroundColor: 'rgba(148,163,184,0.15)',
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: 11 }}>
                        ✕ Fold Exam
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Loading State */}
                  {isLoadingExam ? (
                    <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="#3B82F6" />
                      <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12 }}>
                        Loading assessment questions...
                      </Text>
                    </View>
                  ) : examResult ? (
                    /* Instant Results View within same UI */
                    <View style={{ paddingVertical: 4 }}>
                      <View
                        style={{
                          backgroundColor: examResult.passed
                            ? isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)'
                            : isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
                          borderColor: examResult.passed ? '#22C55E' : '#EF4444',
                          borderWidth: 1,
                          borderRadius: 14,
                          padding: 14,
                          marginBottom: 14,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 28, marginBottom: 4 }}>
                          {examResult.passed ? '🎉' : '⚠️'}
                        </Text>
                        <Text
                          style={{
                            color: examResult.passed ? '#22C55E' : '#EF4444',
                            fontSize: 18,
                            fontWeight: 'bold',
                            marginBottom: 2,
                          }}
                        >
                          {examResult.passed ? '✓ Module Marked as Finished!' : 'Need 80% to Finish Module'}
                        </Text>
                        <Text style={{ color: colors.text, fontSize: 15, fontWeight: 'bold' }}>
                          Score: {examResult.score}% ({examResult.correctCount} of {examResult.totalQuestions} correct)
                        </Text>
                        <Text
                          style={{
                            color: colors.textSecondary,
                            fontSize: 12,
                            textAlign: 'center',
                            marginTop: 4,
                            lineHeight: 18,
                          }}
                        >
                          {examResult.passed
                            ? `✓ Outstanding! The module has been marked as FINISHED. Module ${mIdx + 2} is now unlocked right below!`
                            : `You scored ${examResult.score}%. An 80% score is required to mark this module as finished and unlock Module ${mIdx + 2}.`}
                        </Text>

                        {/* 2 Tries / 24h Status Badge */}
                        <View
                          style={{
                            marginTop: 8,
                            backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : '#FFFFFF',
                            borderColor: colors.cardBorder,
                            borderWidth: 1,
                            borderRadius: 8,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                          }}
                        >
                          <Text style={{ color: colors.gold, fontSize: 11, fontWeight: 'bold' }}>
                            {attemptInfo.triesUsed >= 2
                              ? `⏳ 2 of 2 tries used for this 24h window (Next try in ${attemptInfo.hoursRemaining}h ${attemptInfo.minutesRemaining}m)`
                              : `✓ Attempt recorded: ${attemptInfo.triesUsed} of 2 tries used in last 24h (${attemptInfo.triesRemaining} try left)`}
                          </Text>
                        </View>
                      </View>

                      {/* Question by question feedback */}
                      <View style={{ marginBottom: 14 }}>
                        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>
                          Question Breakdown & Explanations:
                        </Text>

                        {examQuestions.map((q, qIdx) => {
                          const fb = examResult.feedback[q.id!];
                          const isCorrect = fb?.correct;
                          const userChoiceId = examAnswers[q.id!];
                          const userChoice = q.options.find((o) => o.id === userChoiceId);
                          const correctChoice = q.options.find((o) => o.id === q.correctOptionId);

                          return (
                            <View
                              key={q.id || qIdx}
                              style={{
                                backgroundColor: isCorrect
                                  ? isDark ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.04)'
                                  : isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)',
                                borderColor: isCorrect ? '#22C55E' : '#EF4444',
                                borderWidth: 1,
                                borderRadius: 12,
                                padding: 12,
                                marginBottom: 8,
                              }}
                            >
                              <Text style={{ color: isCorrect ? '#22C55E' : '#EF4444', fontWeight: 'bold', fontSize: 12, marginBottom: 2 }}>
                                Q{qIdx + 1}: {isCorrect ? '✓ Correct' : '✕ Incorrect'}
                              </Text>
                              <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13, marginBottom: 6 }}>
                                {q.text}
                              </Text>
                              <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                                Your Answer: <Text style={{ color: isCorrect ? '#22C55E' : '#EF4444', fontWeight: 'bold' }}>{userChoice?.text || 'Not answered'}</Text>
                              </Text>
                              {!isCorrect && (
                                <Text style={{ color: '#22C55E', fontSize: 11, marginTop: 2 }}>
                                  Correct: <Text style={{ fontWeight: 'bold' }}>{correctChoice?.text}</Text>
                                </Text>
                              )}
                              {fb?.explanation ? (
                                <Text style={{ color: colors.textMuted, fontSize: 10, fontStyle: 'italic', marginTop: 4 }}>
                                  Explanation: {fb.explanation}
                                </Text>
                              ) : null}
                            </View>
                          );
                        })}
                      </View>

                      {/* Actions */}
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          disabled={!attemptInfo.canAttempt}
                          onPress={() => {
                            if (!attemptInfo.canAttempt) return;
                            setExamResult(null);
                            setExamAnswers({});
                            setExamStep(0);
                          }}
                          style={{
                            flex: 1,
                            backgroundColor: !attemptInfo.canAttempt
                              ? '#475569'
                              : examResult.passed ? 'rgba(148,163,184,0.2)' : '#3B82F6',
                            paddingVertical: 10,
                            borderRadius: 10,
                            alignItems: 'center',
                            opacity: !attemptInfo.canAttempt ? 0.6 : 1,
                          }}
                        >
                          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>
                            {!attemptInfo.canAttempt
                              ? `2/2 Tries Used (${attemptInfo.hoursRemaining}h wait)`
                              : examResult.passed
                              ? `Retake Questions (${attemptInfo.triesRemaining} try left) ↺`
                              : `Retake Exam (${attemptInfo.triesRemaining} Try Remaining) ↺`}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={handleCloseInlineExam}
                          style={{
                            flex: 1,
                            backgroundColor: examResult.passed ? '#22C55E' : 'rgba(148,163,184,0.15)',
                            paddingVertical: 10,
                            borderRadius: 10,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: examResult.passed ? '#FFF' : colors.text, fontWeight: 'bold', fontSize: 13 }}>
                            {examResult.passed ? 'Done (Next Module) ✓' : 'Close Review'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : examQuestions.length === 0 ? (
                    <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                        No questions available for this module exam.
                      </Text>
                    </View>
                  ) : (
                    /* Live Question Stepper */
                    <View>
                      <View className="flex-row justify-between items-center mb-2">
                        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                          QUESTION {examStep + 1} OF {examQuestions.length}
                        </Text>
                        <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '700' }}>
                          Passing Grade: 80%
                        </Text>
                      </View>

                      <ProgressBar progress={((examStep + 1) / examQuestions.length) * 100} />

                      {(() => {
                        const curQ = examQuestions[examStep];
                        if (!curQ) return null;
                        const selectedOptId = examAnswers[curQ.id!];

                        return (
                          <View style={{ marginTop: 14 }}>
                            <Text style={{ color: colors.text, fontSize: 15, fontWeight: 'bold', marginBottom: 14, lineHeight: 22 }}>
                              {curQ.text}
                            </Text>

                            <View style={{ gap: 8, marginBottom: 18 }}>
                              {curQ.options.map((opt, optIdx) => {
                                const isSelected = selectedOptId === opt.id;
                                const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                                const letter = letters[optIdx] || `${optIdx + 1}`;

                                return (
                                  <TouchableOpacity
                                    key={opt.id}
                                    onPress={() => {
                                      setExamAnswers((prev) => ({
                                        ...prev,
                                        [curQ.id!]: opt.id,
                                      }));
                                    }}
                                    activeOpacity={0.8}
                                    style={{
                                      backgroundColor: isSelected
                                        ? 'rgba(59,130,246,0.18)'
                                        : isDark ? 'rgba(30,41,59,0.7)' : '#F1F5F9',
                                      borderColor: isSelected ? '#3B82F6' : colors.cardBorder,
                                      borderWidth: isSelected ? 2 : 1,
                                      borderRadius: 12,
                                      padding: 12,
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: 10,
                                    }}
                                  >
                                    <View
                                      style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 12,
                                        backgroundColor: isSelected ? '#3B82F6' : 'rgba(148,163,184,0.2)',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                      }}
                                    >
                                      <Text style={{ color: isSelected ? '#FFF' : colors.textSecondary, fontWeight: 'bold', fontSize: 11 }}>
                                        {letter}
                                      </Text>
                                    </View>
                                    <Text
                                      style={{
                                        color: isSelected ? colors.text : colors.textSecondary,
                                        fontWeight: isSelected ? '700' : '500',
                                        fontSize: 13,
                                        flex: 1,
                                      }}
                                    >
                                      {opt.text}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>

                            {/* Stepper Buttons */}
                            <View className="flex-row justify-between items-center gap-2">
                              <TouchableOpacity
                                disabled={examStep === 0}
                                onPress={() => setExamStep((s) => Math.max(0, s - 1))}
                                style={{
                                  paddingHorizontal: 14,
                                  paddingVertical: 9,
                                  borderRadius: 10,
                                  backgroundColor: examStep === 0 ? 'transparent' : 'rgba(148,163,184,0.15)',
                                  opacity: examStep === 0 ? 0.3 : 1,
                                }}
                              >
                                <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 12 }}>
                                  ← Previous
                                </Text>
                              </TouchableOpacity>

                              {examStep < examQuestions.length - 1 ? (
                                <TouchableOpacity
                                  onPress={() => setExamStep((s) => s + 1)}
                                  style={{
                                    backgroundColor: '#3B82F6',
                                    paddingHorizontal: 18,
                                    paddingVertical: 9,
                                    borderRadius: 10,
                                  }}
                                >
                                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>
                                    Next Question →
                                  </Text>
                                </TouchableOpacity>
                              ) : (
                                <TouchableOpacity
                                  disabled={isSubmittingExam}
                                  onPress={handleSubmitExam}
                                  style={{
                                    backgroundColor: '#22C55E',
                                    paddingHorizontal: 20,
                                    paddingVertical: 9,
                                    borderRadius: 10,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                  }}
                                >
                                  {isSubmittingExam ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                  ) : (
                                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>
                                      Submit Exam (Evaluate 80%) ✓
                                    </Text>
                                  )}
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        );
                      })()}
                    </View>
                  )}
                </View>
              ) : (
                /* 2. COLLAPSED SUMMARY VIEW (When not actively taking) */
                <View
                  style={{
                    backgroundColor: isFinished
                      ? isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.06)'
                      : examRecord
                      ? isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.06)'
                      : isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.06)',
                    borderColor: isFinished
                      ? '#22C55E'
                      : examRecord
                      ? '#F59E0B'
                      : isDark ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.3)',
                    borderWidth: 1.5,
                    borderRadius: 16,
                    padding: 14,
                    marginTop: 4,
                  }}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-row items-center gap-2 flex-1 mr-2">
                      <Text style={{ fontSize: 18 }}>
                        {isFinished ? '🏆' : examRecord ? '⚠️' : '📝'}
                      </Text>
                      <View className="flex-1">
                        <Text
                          style={{
                            color: colors.text,
                            fontWeight: 'bold',
                            fontSize: 15,
                          }}
                        >
                          Module {m.order || mIdx + 1} Assessment Exam
                        </Text>
                        <Text
                          style={{
                            color: isFinished
                              ? '#22C55E'
                              : examRecord
                              ? '#F59E0B'
                              : colors.textSecondary,
                            fontSize: 12,
                            marginTop: 2,
                          }}
                        >
                          {isFinished
                            ? `✓ Module Finished (Passed with ${examRecord?.score || 80}%)! Threshold (80%) achieved.`
                            : examRecord
                            ? `Score: ${examRecord.score}% — You must score at least 80% to finish this module and unlock Module ${mIdx + 2}.`
                            : `Answer questions right here. Pass with ≥80% to mark module as finished and unlock Module ${mIdx + 2}.`}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-col items-end gap-1">
                      {isFinished ? (
                        <View className="bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/40">
                          <Text className="text-emerald-400 text-xs font-bold">✓ FINISHED</Text>
                        </View>
                      ) : (
                        <View className="bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/40">
                          <Text className="text-amber-400 text-xs font-bold">80% REQ</Text>
                        </View>
                      )}
                      <View
                        style={{
                          backgroundColor: attemptInfo.canAttempt
                            ? 'rgba(59,130,246,0.15)'
                            : 'rgba(239,68,68,0.15)',
                          borderColor: attemptInfo.canAttempt
                            ? 'rgba(59,130,246,0.3)'
                            : 'rgba(239,68,68,0.3)',
                          borderWidth: 1,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            color: attemptInfo.canAttempt ? '#3B82F6' : '#EF4444',
                            fontSize: 10,
                            fontWeight: 'bold',
                          }}
                        >
                          {attemptInfo.triesUsed}/2 TRIES (24H)
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Cooldown or remaining tries warning */}
                  {!attemptInfo.canAttempt ? (
                    <View
                      style={{
                        backgroundColor: 'rgba(239,68,68,0.12)',
                        borderColor: '#EF4444',
                        borderWidth: 1,
                        borderRadius: 10,
                        padding: 10,
                        marginTop: 6,
                        marginBottom: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>⏳</Text>
                      <View className="flex-1">
                        <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 12 }}>
                          24-Hour Limit Reached (2 / 2 Tries Used)
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 1 }}>
                          Questions allow 2 tries in every 24 hours. Next try available in {attemptInfo.hoursRemaining}h {attemptInfo.minutesRemaining}m.
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  <View className="mt-2 flex-row justify-between items-center">
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                      {attemptInfo.canAttempt
                        ? `2 tries per 24 hours (${attemptInfo.triesRemaining} available)`
                        : `Cooldown active`}
                    </Text>

                    <TouchableOpacity
                      disabled={!isModuleUnlocked || !attemptInfo.canAttempt}
                      onPress={() => handleStartExam(m, mIdx)}
                      style={{
                        backgroundColor: !isModuleUnlocked || !attemptInfo.canAttempt
                          ? '#475569'
                          : isFinished
                          ? 'rgba(34,197,94,0.2)'
                          : '#3B82F6',
                        borderColor: !attemptInfo.canAttempt
                          ? '#64748B'
                          : isFinished
                          ? '#22C55E'
                          : '#3B82F6',
                        borderWidth: 1,
                        paddingHorizontal: 16,
                        paddingVertical: 9,
                        borderRadius: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        opacity: (!isModuleUnlocked || !attemptInfo.canAttempt) ? 0.7 : 1,
                      }}
                    >
                      <Text
                        style={{
                          color: !attemptInfo.canAttempt
                            ? '#E2E8F0'
                            : isFinished
                            ? '#22C55E'
                            : '#FFF',
                          fontWeight: 'bold',
                          fontSize: 13,
                        }}
                      >
                        {!isModuleUnlocked
                          ? '🔒 Locked'
                          : !attemptInfo.canAttempt
                          ? `⏳ Cooldown (${attemptInfo.hoursRemaining}h ${attemptInfo.minutesRemaining}m)`
                          : isFinished
                          ? 'Retake Assessment ↺'
                          : examRecord
                          ? 'Retake Exam (Need 80%) →'
                          : 'Answer Module Questions →'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Card>
          );
        })}

        {/* 3. SEPARATED COURSE FINAL EXAM CARD */}
        <Card
          className="mb-8 p-5"
          style={{
            borderColor: allLessonsCompleted ? colors.gold : colors.cardBorder,
            borderWidth: 1.5,
            backgroundColor: isDark ? 'rgba(30,41,59,0.7)' : '#F8FAFC',
          }}
        >
          <View className="flex-row items-center gap-3 mb-2">
            <Text style={{ fontSize: 26 }}>🎓</Text>
            <View className="flex-1 mr-2">
              <View className="flex-row items-center gap-2">
                <Text style={{ color: colors.text, fontSize: 17, fontWeight: 'bold' }}>
                  Course Final Certification Exam
                </Text>
                <Badge
                  label={allLessonsCompleted ? 'READY' : 'LOCKED'}
                  variant={allLessonsCompleted ? 'success' : 'warning'}
                />
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
                {allLessonsCompleted
                  ? 'All module assessments passed with ≥80%! You are qualified to take the comprehensive final exam.'
                  : 'Separated final exam. Complete all lessons and pass every module assessment with ≥80% to access.'}
              </Text>
            </View>
          </View>

          <View className="mt-3 flex-row justify-end">
            <Button
              title={allLessonsCompleted ? 'Take Course Final Exam →' : '🔒 Final Exam Locked (Pass All Modules)'}
              variant={allLessonsCompleted ? 'primary' : 'outline'}
              disabled={!allLessonsCompleted}
              onPress={() => router.push(`/(student)/exam/${courseId}` as any)}
            />
          </View>
        </Card>
      </View>
    </ScreenWrapper>
  );
}
