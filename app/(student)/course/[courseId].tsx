import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from '../../../src/features/student/studentApi';
import { getCourseModules, getCourseLessons } from '../../../src/features/admin/adminApi';

export default function StudentCourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
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
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.gold} />
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
        <Card>
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
        <Text style={{ color: colors.text }} className="text-xl font-bold mb-3">Course Curriculum</Text>

        {modules.map((m) => {
          const moduleLessons = publishedLessons.filter((l) => l.moduleId === m.id);

          return (
            <Card key={m.id}>
              <Text style={{ color: colors.gold }} className="text-lg font-bold mb-3">{m.title}</Text>

              {moduleLessons.map((les) => {
                const lessonProg = progress[les.id!];
                const isCompleted = lessonProg?.completed || false;

                // Sequential Unlock Logic:
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
                    style={{
                      backgroundColor: isCompleted
                        ? colors.successBg
                        : isUnlocked
                        ? colors.cardHover
                        : isDark ? 'rgba(15,23,42,0.4)' : '#F1F5F9',
                      borderColor: isCompleted
                        ? colors.success
                        : colors.cardBorder,
                      borderWidth: 1,
                      padding: 14,
                      borderRadius: 14,
                      marginBottom: 10,
                      opacity: isUnlocked ? 1 : 0.6,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View className="flex-1 mr-3">
                      <Text
                        style={{
                          color: isUnlocked ? colors.text : colors.textMuted,
                          fontWeight: '600',
                          fontSize: 15,
                        }}
                      >
                        {les.order}. {les.title}
                      </Text>
                      {lessonProg?.quizScore ? (
                        <Text style={{ color: colors.success }} className="text-xs mt-0.5 font-bold">
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
