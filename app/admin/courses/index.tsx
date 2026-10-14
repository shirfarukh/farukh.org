import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { Badge } from '../../../src/components/ui/Badge';
import { getAdminCourses, createOrUpdateCourse } from '../../../src/features/admin/adminApi';
import { extractYouTubeId } from '../../../src/lib/utils';
import { CategorySelector } from '../../../src/components/ui/CategorySelector';
import { CourseImageInput } from '../../../src/components/ui/CourseImageInput';

export default function AdminCoursesListScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Stocks & Crypto');
  const [coverUrl, setCoverUrl] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [formError, setFormError] = useState('');

  const detectedYouTubeId = extractYouTubeId(youtubeUrl);
  const keywordsList = keywordsInput
    .split(/[,،]+/)
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['adminCourses'],
    queryFn: getAdminCourses,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      setFormError('');
      if (!title.trim()) {
        throw new Error('Please enter a course title.');
      }
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || `course-${Date.now()}`;

      const videoId = detectedYouTubeId || (youtubeUrl.trim().length === 11 ? youtubeUrl.trim() : undefined);

      const newId = await createOrUpdateCourse({
        title: title.trim(),
        slug,
        category: category || 'Stocks & Crypto',
        coverUrl: coverUrl.trim() || undefined,
        description: description.trim() || (body.trim() ? body.trim().slice(0, 160) + '...' : title.trim()),
        body: body.trim() || undefined,
        keywords: keywordsList,
        youtubeUrl: youtubeUrl.trim() || undefined,
        youtubeVideoId: videoId,
        status: 'published',
        passPercentage: 80,
        exam: { questionCount: 10, timeLimitMin: 30, maxAttempts: 3, cooldownHours: 24 },
        order: courses.length + 1,
      });
      return newId;
    },
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      setShowCreate(false);
      setTitle('');
      setCategory('Stocks & Crypto');
      setCoverUrl('');
      setDescription('');
      setBody('');
      setKeywordsInput('');
      setYoutubeUrl('');
      setFormError('');
      router.push(`/admin/courses/${newId}` as any);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create course');
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
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id || item.slug}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
          contentContainerStyle={{ paddingBottom: 60 }}
          ListHeaderComponent={
            <>
              <View className="flex-row justify-between items-center mb-6">
                <View>
                  <Text className="text-xl font-bold text-white">Courses Catalog</Text>
                  <Text className="text-xs text-slate-400">All courses stored in Firebase database</Text>
                </View>
                <Button
                  title={showCreate ? 'Cancel' : '+ Add Course'}
                  variant={showCreate ? 'secondary' : 'primary'}
                  onPress={() => setShowCreate(!showCreate)}
                />
              </View>

              {showCreate && (
                <Card className="mb-6 border-brand-500 bg-surface-card p-5">
                  <View className="flex-row items-center justify-between mb-4 border-b border-surface-border pb-3">
                    <Text className="text-lg font-bold text-white">Create New Course</Text>
                    <Badge label="PUBLISHED" variant="success" />
                  </View>

                  {formError ? (
                    <View className="mb-4 p-3 bg-red-950/60 border border-red-700/60 rounded-xl">
                      <Text className="text-red-300 text-xs font-semibold">{formError}</Text>
                    </View>
                  ) : null}

                  <Input
                    label="Course Title *"
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Artificial Intelligence & Prompt Engineering"
                  />

                  {/* Category Selector (Stocks & Crypto, Ecommerce, Languages, Morals) */}
                  <CategorySelector
                    selectedCategory={category}
                    onSelectCategory={setCategory}
                    label="Course Category *"
                  />

                  {/* Course Cover Image (Upload or Link) */}
                  <CourseImageInput
                    value={coverUrl}
                    onChangeImage={setCoverUrl}
                    label="Course Cover Image (Upload or Link Image)"
                  />

                  <Input
                    label="Short Summary / Description"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Concise overview of the course..."
                    multiline
                    numberOfLines={2}
                  />
                  <Input
                    label="Course Body & Detailed Syllabus"
                    value={body}
                    onChangeText={setBody}
                    placeholder="Full curriculum text, topics covered, prerequisites..."
                    multiline
                    numberOfLines={4}
                  />
                  <Input
                    label="Keywords / Tags (comma-separated)"
                    value={keywordsInput}
                    onChangeText={setKeywordsInput}
                    placeholder="e.g. AI, Python, LLM, OpenAI"
                  />
                  {keywordsList.length > 0 && (
                    <View className="flex-row flex-wrap gap-1.5 mb-3">
                      {keywordsList.map((kw, idx) => (
                        <View key={idx} className="bg-brand-900/60 border border-brand-500/40 px-2.5 py-1 rounded-full">
                          <Text className="text-brand-300 text-[11px] font-semibold">#{kw}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <Input
                    label="YouTube Video Link (Optional)"
                    value={youtubeUrl}
                    onChangeText={setYoutubeUrl}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  {detectedYouTubeId ? (
                    <View className="mb-4 p-3 bg-surface-dark rounded-xl border border-emerald-500/50 flex-row items-center gap-3">
                      <Image
                        source={{ uri: `https://img.youtube.com/vi/${detectedYouTubeId}/mqdefault.jpg` }}
                        style={{ width: 80, height: 48, borderRadius: 8 }}
                      />
                      <View className="flex-1">
                        <Text className="text-emerald-400 font-bold text-xs">✓ Valid YouTube Video</Text>
                        <Text className="text-slate-400 text-[11px]">ID: {detectedYouTubeId}</Text>
                      </View>
                    </View>
                  ) : null}

                  <Button
                    title="Save & Create in Firebase"
                    onPress={() => createMutation.mutate()}
                    loading={createMutation.isPending}
                  />
                </Card>
              )}
            </>
          }
          renderItem={({ item }) => (
            <Card onPress={() => router.push(`/admin/courses/${item.id}` as any)} className="mb-4">
              <View className="flex-row gap-3 items-start">
                {item.coverUrl ? (
                  <Image
                    source={{ uri: item.coverUrl }}
                    style={{ width: 70, height: 70, borderRadius: 12, backgroundColor: '#1E293B' }}
                    resizeMode="cover"
                  />
                ) : null}
                <View className="flex-1">
                  <View className="flex-row justify-between items-start mb-1">
                    <Text className="text-lg font-bold text-white flex-1 mr-2">{item.title}</Text>
                    <View className="flex-row gap-1.5 items-center">
                      {item.category && (
                        <View className="bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 rounded-md">
                          <Text className="text-amber-300 text-[10px] font-bold">{item.category}</Text>
                        </View>
                      )}
                      {item.youtubeVideoId && <Badge label="📺 YouTube" variant="danger" />}
                      <Badge label={item.status.toUpperCase()} variant={item.status === 'published' ? 'success' : 'warning'} />
                    </View>
                  </View>
                  <Text className="text-slate-400 text-sm mb-2" numberOfLines={2}>
                    {item.body || item.description}
                  </Text>
                </View>
              </View>

              {item.keywords && item.keywords.length > 0 && (
                <View className="flex-row flex-wrap gap-1.5 mb-2 mt-2">
                  {item.keywords.map((kw, idx) => (
                    <Text key={idx} className="text-brand-300 text-[10px] bg-brand-950/80 border border-brand-800/60 px-2 py-0.5 rounded-md font-medium">
                      #{kw}
                    </Text>
                  ))}
                </View>
              )}
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
