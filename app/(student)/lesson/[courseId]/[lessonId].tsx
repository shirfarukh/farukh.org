import React, { useState } from 'react';
import { View, Text, ActivityIndicator, Platform, Linking, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Markdown from 'react-native-markdown-display';
import { ScreenWrapper } from '../../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../../src/components/ui/Card';
import { Button } from '../../../../src/components/ui/Button';
import { Badge } from '../../../../src/components/ui/Badge';
import { QuizCard } from '../../../../src/components/QuizCard';
import { LessonVideo } from '../../../../src/components/LessonVideo';
import { getCourseLessons, getLessonQuestions } from '../../../../src/features/admin/adminApi';
import { submitQuizCallable } from '../../../../src/features/student/studentApi';

export default function StudentLessonScreen() {
  const { courseId, lessonId } = useLocalSearchParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [videoWatched, setVideoWatched] = useState(false);

  const { data: lessons = [] } = useQuery({
    queryKey: ['courseLessons', courseId],
    queryFn: () => getCourseLessons(courseId!),
    enabled: !!courseId,
  });
  const lesson = lessons.find((l) => l.id === lessonId);

  const { data: questions = [] } = useQuery({
    queryKey: ['lessonQuestions', courseId, lessonId],
    queryFn: () => getLessonQuestions(courseId!, lessonId!),
    enabled: !!courseId && !!lessonId,
  });

  const quizMutation = useMutation({
    mutationFn: async () => {
      if (!courseId || !lessonId) return;
      return await submitQuizCallable(courseId, lessonId, answers);
    },
    onSuccess: (res) => {
      if (res) {
        queryClient.invalidateQueries({ queryKey: ['courseProgress'] });
      }
    },
  });

  if (!lesson) {
    return (
      <View className="flex-1 bg-surface-dark justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const result = quizMutation.data;

  return (
    <ScreenWrapper>
      <View className="max-w-3xl w-full self-center pb-12">
        {/* Lesson Header */}
        <Text className="text-2xl font-bold text-white mb-2">{lesson.title}</Text>

        {/* Lesson PDF Download Section (If Available) */}
        {lesson.pdfUrl ? (
          <Card
            className="mb-5 p-4"
            style={{
              borderColor: '#3B82F6',
              borderWidth: 1.5,
              backgroundColor: 'rgba(59,130,246,0.08)',
            }}
          >
            <View className="flex-row items-center justify-between flex-wrap gap-3">
              <View className="flex-row items-center gap-3 flex-1 min-w-[220px]">
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: 'rgba(239,68,68,0.15)',
                    borderWidth: 1,
                    borderColor: 'rgba(239,68,68,0.3)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 22 }}>📄</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-white font-bold text-base" numberOfLines={1}>
                      {lesson.pdfName || 'Lesson Study Guide & Notes.pdf'}
                    </Text>
                    <Badge label="PDF NOTE" variant="warning" />
                  </View>
                  <Text className="text-slate-400 text-xs mt-0.5">
                    Official lesson notes provided by instructor for offline reading & study.
                  </Text>
                </View>
              </View>

              <Button
                title="Download PDF Note 📥"
                variant="primary"
                onPress={() => {
                  if (Platform.OS === 'web') {
                    window.open(lesson.pdfUrl, '_blank');
                  } else {
                    Linking.openURL(lesson.pdfUrl!);
                  }
                }}
              />
            </View>
          </Card>
        ) : null}

        {/* 1. Intro Markdown Text */}
        <Card className="mb-6">
          <Text className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-2">Lesson Overview</Text>
          <Markdown
            style={{
              body: { color: '#E2E8F0', fontSize: 16, lineHeight: 24 },
              heading1: { color: '#FFFFFF', fontWeight: 'bold' },
              heading2: { color: '#3B82F6', fontWeight: 'bold' },
              paragraph: { marginBottom: 12 },
            }}
          >
            {lesson.introMarkdown}
          </Markdown>
        </Card>

        {/* 2. YouTube Video Player */}
        <Text className="text-xl font-bold text-white mb-2">Video Lesson</Text>
        <LessonVideo
          videoId={lesson.youtubeVideoId}
          onWatchedThresholdReached={() => setVideoWatched(true)}
        />

        {/* 3. Lesson Quiz Section */}
        <Text className="text-xl font-bold text-white mb-4 mt-6">Lesson Quiz</Text>

        {questions.length === 0 ? (
          <Card>
            <Text className="text-slate-400 text-sm">No quiz questions configured for this lesson.</Text>
          </Card>
        ) : (
          questions.map((q, idx) => (
            <QuizCard
              key={q.id}
              questionNumber={idx + 1}
              totalQuestions={questions.length}
              questionText={q.text}
              options={q.options}
              selectedOptionId={answers[q.id!]}
              onSelectOption={(optId) => setAnswers({ ...answers, [q.id!]: optId })}
              feedback={result?.feedback?.[q.id!]}
              disabled={quizMutation.isPending || !!result}
            />
          ))
        )}

        {/* Result & Actions */}
        {result ? (
          <Card className={`mb-6 border ${result.passed ? 'border-emerald-500 bg-emerald-950/40' : 'border-red-500 bg-red-950/40'}`}>
            <Text className={`text-xl font-bold mb-1 ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.passed ? 'Quiz Passed!' : 'Quiz Failed'}
            </Text>
            <Text className="text-slate-300 text-base mb-4">
              Your Score: {result.scorePercent}% (Required: {result.quizPassPercentage}%)
            </Text>
            <Button
              title="Back to Course Outline"
              onPress={() => router.replace(`/(student)/course/${courseId}` as any)}
            />
          </Card>
        ) : questions.length > 0 ? (
          <Button
            title="Submit Quiz Answers"
            onPress={() => quizMutation.mutate()}
            loading={quizMutation.isPending}
            disabled={!videoWatched && Platform.OS !== 'web'}
          />
        ) : (
          <Button
            title="Continue Course"
            onPress={() => router.replace(`/(student)/course/${courseId}` as any)}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
