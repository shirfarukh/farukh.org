import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { ProgressBar } from '../../../src/components/ProgressBar';
import { useAuth } from '../../../src/features/auth/useAuth';
import {
  getCourseDetail,
  getCourseProgress,
  enrollInCourse,
} from '../../../src/features/student/studentApi';
import { getCourseModules, getCourseLessons } from '../../../src/features/admin/adminApi';

export default function StudentCourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  if (!course) {
    return (
      <View className="flex-1 bg-surface-dark justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Calculate Course Progress
  const publishedLessons = lessons.filter((l) => l.status === 'published');
  const completedCount = publishedLessons.filter((l) => progress[l.id!]?.completed).length;
  const progressPercent = publishedLessons.length > 0 ? (completedCount / publishedLessons.length) * 100 : 0;
  const allLessonsCompleted = publishedLessons.length > 0 && completedCount === publishedLessons.length;

  return (
    <ScreenWrapper>
      <View className="max-w-4xl w-full self-center">
        {/* Header Banner */}
        <Card className="mb-6 border-brand-500">
          <Text className="text-2xl font-bold text-white mb-2">{course.title}</Text>
          <Text className="text-slate-300 text-sm mb-4 leading-6">{course.description}</Text>

          <ProgressBar progress={progressPercent} />

          <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-surface-border">
            <Text className="text-xs text-slate-400">
              {completedCount} of {publishedLessons.length} lessons completed
            </Text>
            {allLessonsCompleted ? (
              <Button
                title="Take Final Exam →"
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
        <Text className="text-xl font-bold text-white mb-3">Course Curriculum</Text>

        {modules.map((m) => {
          const moduleLessons = publishedLessons.filter((l) => l.moduleId === m.id);

          return (
            <Card key={m.id} className="mb-4">
              <Text className="text-lg font-bold text-brand-400 mb-3">{m.title}</Text>

              {moduleLessons.map((les, index) => {
                const lessonProg = progress[les.id!];
                const isCompleted = lessonProg?.completed || false;

                // Sequential Unlock Logic:
                // Global Lesson 0 is unlocked. Lesson N is unlocked if Lesson N-1 in publishedLessons is completed.
                const globalIndex = publishedLessons.findIndex((l) => l.id === les.id);
                let isUnlocked = globalIndex === 0;
                if (globalIndex > 0) {
                  const prevLesson = publishedLessons[globalIndex - 1];
                  isUnlocked = progress[prevLesson.id!]?.completed || false;
                }

                return (
                  <TouchableOpacity
                    key={les.id}
                    disabled={!isUnlocked}
                    onPress={() => router.push(`/(student)/lesson/${courseId}/${les.id}` as any)}
                    className={`p-3.5 rounded-xl mb-2.5 flex-row justify-between items-center border ${
                      isCompleted
                        ? 'bg-emerald-950/30 border-emerald-800/60'
                        : isUnlocked
                        ? 'bg-slate-800 border-surface-border'
                        : 'bg-slate-900/60 border-slate-800 opacity-60'
                    }`}
                  >
                    <View className="flex-1 mr-3">
                      <Text
                        className={`font-semibold text-base ${
                          isUnlocked ? 'text-white' : 'text-slate-500'
                        }`}
                      >
                        {les.order}. {les.title}
                      </Text>
                      {lessonProg?.quizScore ? (
                        <Text className="text-xs text-emerald-400 mt-0.5">
                          Best Score: {lessonProg.quizScore}%
                        </Text>
                      ) : null}
                    </View>

                    {isCompleted ? (
                      <Badge label="COMPLETED" variant="success" />
                    ) : isUnlocked ? (
                      <Badge label="UNLOCKED" variant="info" />
                    ) : (
                      <Badge label="LOCKED" variant="warning" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </Card>
          );
        })}
      </View>
    </ScreenWrapper>
  );
}
