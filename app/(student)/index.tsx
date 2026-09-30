import React from 'react';
import { View, Text, FlatList, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { getPublishedCourses } from '../../src/features/student/studentApi';

export default function StudentCatalogScreen() {
  const router = useRouter();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['publishedCourses'],
    queryFn: getPublishedCourses,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface-dark justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScreenWrapper scrollable={false}>
      <View className="max-w-4xl w-full self-center flex-1">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-white mb-1">Explore Courses</Text>
          <Text className="text-slate-400 text-sm">Interactive video lessons with instant quizzes and certified exams</Text>
        </View>

        <FlatList
          data={courses}
          keyExtractor={(item) => item.id || item.slug}
          renderItem={({ item }) => (
            <Card onPress={() => router.push(`/(student)/course/${item.id}` as any)}>
              <View className="flex-row items-center mb-3">
                <Image
                  source={{ uri: item.coverUrl }}
                  className="w-16 h-16 rounded-xl bg-slate-800 mr-4"
                />
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-bold text-white flex-1 mr-2">{item.title}</Text>
                    <Badge label="PUBLISHED" variant="info" />
                  </View>
                  <Text className="text-slate-400 text-xs mt-1">
                    Pass Threshold: {item.passPercentage}%  •  Exam Pool: {item.exam?.questionCount || 10} Qs
                  </Text>
                </View>
              </View>

              <Text className="text-slate-300 text-sm mb-4" numberOfLines={2}>
                {item.description}
              </Text>

              <View className="flex-row justify-between items-center border-t border-surface-border pt-3">
                <Text className="text-xs text-slate-400">Lessons: {item.lessonCount || 6}</Text>
                <Button
                  title="View Course →"
                  variant="primary"
                  onPress={() => router.push(`/(student)/course/${item.id}` as any)}
                />
              </View>
            </Card>
          )}
        />
      </View>
    </ScreenWrapper>
  );
}
