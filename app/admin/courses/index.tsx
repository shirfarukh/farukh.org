import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { Badge } from '../../../src/components/ui/Badge';
import { getAdminCourses, createOrUpdateCourse } from '../../../src/features/admin/adminApi';

export default function AdminCoursesListScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['adminCourses'],
    queryFn: getAdminCourses,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await createOrUpdateCourse({
        title,
        slug,
        description,
        status: 'published',
        passPercentage: 80,
        exam: { questionCount: 10, timeLimitMin: 30, maxAttempts: 3, cooldownHours: 24 },
        order: courses.length + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      setShowCreate(false);
      setTitle('');
      setDescription('');
    },
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
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xl font-bold text-white">Courses Catalog</Text>
          <Button
            title={showCreate ? 'Cancel' : '+ New Course'}
            variant={showCreate ? 'secondary' : 'primary'}
            onPress={() => setShowCreate(!showCreate)}
          />
        </View>

        {showCreate && (
          <Card className="mb-6 border-brand-500">
            <Text className="text-lg font-bold text-white mb-4">Create New Course</Text>
            <Input
              label="Course Title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Web3 & Smart Contracts"
            />
            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Detailed description of the course..."
              multiline
              numberOfLines={3}
            />
            <Button
              title="Save & Publish Course"
              onPress={() => createMutation.mutate()}
              loading={createMutation.isPending}
            />
          </Card>
        )}

        <FlatList
          data={courses}
          keyExtractor={(item) => item.id || item.slug}
          renderItem={({ item }) => (
            <Card onPress={() => router.push(`/admin/courses/${item.id}` as any)}>
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-lg font-bold text-white flex-1 mr-2">{item.title}</Text>
                <Badge label={item.status.toUpperCase()} variant={item.status === 'published' ? 'success' : 'warning'} />
              </View>
              <Text className="text-slate-400 text-sm mb-3" numberOfLines={2}>
                {item.description}
              </Text>
              <View className="flex-row justify-between items-center border-t border-surface-border pt-3">
                <Text className="text-xs text-slate-400">Lessons: {item.lessonCount || 0}</Text>
                <Text className="text-xs text-brand-400 font-semibold">Edit Content & Settings →</Text>
              </View>
            </Card>
          )}
        />
      </View>
    </ScreenWrapper>
  );
}
