import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { Badge } from '../../../src/components/ui/Badge';
import {
  getAdminCourses,
  createOrUpdateCourse,
  deleteCourse,
  toggleCourseVisibility,
  toggleCourseUnfinished,
} from '../../../src/features/admin/adminApi';
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
  const [instructorBio, setInstructorBio] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [isUnfinished, setIsUnfinished] = useState(false);
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
        instructorBio: instructorBio.trim() || undefined,
        ownerBio: instructorBio.trim() || undefined,
        status,
        isUnfinished,
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
      setInstructorBio('');
      setDescription('');
      setBody('');
      setKeywordsInput('');
      setYoutubeUrl('');
      setStatus('published');
      setIsUnfinished(false);
      setFormError('');
      router.push(`/admin/courses/${newId}` as any);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create course');
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      await toggleCourseVisibility(id, currentStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
    },
  });

  const toggleUnfinishedMutation = useMutation({
    mutationFn: async ({ id, currentIsUnfinished }: { id: string; currentIsUnfinished: boolean }) => {
      await toggleCourseUnfinished(id, currentIsUnfinished);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteCourse(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
    },
  });

  const handleDeleteCourse = (id: string, courseTitle: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to delete "${courseTitle}"? This cannot be undone.`)) {
        deleteMutation.mutate(id);
      }
    } else {
      Alert.alert(
        'Delete Course',
        `Are you sure you want to delete "${courseTitle}"? This will permanently remove the course and its contents.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
        ]
      );
    }
  };

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
                  <Text className="text-xs text-slate-400">Manage courses, visibility, completion status, and lessons</Text>
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
                    <View className="flex-row items-center gap-1.5">
                      <Badge label={status.toUpperCase()} variant={status === 'published' ? 'success' : 'warning'} />
                      {isUnfinished && <Badge label="UNFINISHED" variant="warning" />}
                    </View>
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

                  {/* Visibility & Status Setting */}
                  <View className="mb-4">
                    <Text className="text-white text-xs font-bold mb-2">Visibility Status</Text>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => setStatus('published')}
                        className={`flex-1 py-2.5 px-3 rounded-xl border items-center ${
                          status === 'published'
                            ? 'bg-emerald-950/80 border-emerald-500'
                            : 'bg-surface-dark border-surface-border'
                        }`}
                      >
                        <Text className={`text-xs font-bold ${status === 'published' ? 'text-emerald-300' : 'text-slate-400'}`}>
                          ✓ Published (Visible to Students)
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setStatus('draft')}
                        className={`flex-1 py-2.5 px-3 rounded-xl border items-center ${
                          status === 'draft'
                            ? 'bg-amber-950/80 border-amber-500'
                            : 'bg-surface-dark border-surface-border'
                        }`}
                      >
                        <Text className={`text-xs font-bold ${status === 'draft' ? 'text-amber-300' : 'text-slate-400'}`}>
                          👁️ Hidden / Draft (Admin Only)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Unfinished Course Toggle */}
                  <TouchableOpacity
                    onPress={() => setIsUnfinished(!isUnfinished)}
                    className={`mb-4 p-3.5 rounded-xl border flex-row items-center gap-3 ${
                      isUnfinished
                        ? 'bg-amber-950/60 border-amber-500/70'
                        : 'bg-surface-dark border-surface-border'
                    }`}
                  >
                    <View
                      className={`w-6 h-6 rounded-md items-center justify-center border ${
                        isUnfinished
                          ? 'bg-amber-500 border-amber-400'
                          : 'border-slate-600 bg-surface-card'
                      }`}
                    >
                      {isUnfinished && <Text className="text-black font-extrabold text-xs">✓</Text>}
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-xs">
                        Mark as Unfinished Course (Block Certificate Issuance)
                      </Text>
                      <Text className="text-slate-400 text-[11px] mt-0.5">
                        Students can study released lessons, but certificates will NOT be issued until marked complete.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Category Selector */}
                  <CategorySelector
                    selectedCategory={category}
                    onSelectCategory={setCategory}
                    label="Course Category *"
                  />

                  {/* Course Cover Image */}
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

                  <Input
                    label="Teacher Short Bio (Displayed on the other half of Catalogue Box)"
                    value={instructorBio}
                    onChangeText={setInstructorBio}
                    placeholder="1-2 sentences about teacher credentials..."
                    multiline
                    numberOfLines={2}
                  />

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
            <Card className="mb-4 p-4">
              <View className="flex-row gap-4 items-start mb-3">
                <TouchableOpacity onPress={() => router.push(`/admin/courses/${item.id}` as any)}>
                  {item.coverUrl ? (
                    <Image
                      source={{ uri: item.coverUrl }}
                      style={{ width: 115, height: 92, borderRadius: 12, backgroundColor: '#1E293B', aspectRatio: 5 / 4 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 115,
                        height: 92,
                        borderRadius: 12,
                        backgroundColor: '#1E293B',
                        borderWidth: 1,
                        borderColor: '#334155',
                        justifyContent: 'center',
                        alignItems: 'center',
                        aspectRatio: 5 / 4,
                      }}
                    >
                      <Text style={{ fontSize: 26 }}>📚</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View className="flex-1">
                  <View className="flex-row justify-between items-start mb-1 flex-wrap gap-1">
                    <TouchableOpacity
                      onPress={() => router.push(`/admin/courses/${item.id}` as any)}
                      className="flex-1 mr-2"
                    >
                      <Text className="text-lg font-bold text-white">{item.title}</Text>
                    </TouchableOpacity>

                    <View className="flex-row gap-1.5 items-center flex-wrap">
                      {item.category && (
                        <View className="bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 rounded-md">
                          <Text className="text-amber-300 text-[10px] font-bold">{item.category}</Text>
                        </View>
                      )}
                      {item.status === 'published' ? (
                        <Badge label="PUBLISHED" variant="success" />
                      ) : (
                        <Badge label="HIDDEN (DRAFT)" variant="warning" />
                      )}
                      {item.isUnfinished ? (
                        <Badge label="⏳ UNFINISHED (NO CERT)" variant="warning" />
                      ) : (
                        <Badge label="🎓 COMPLETE" variant="success" />
                      )}
                      {item.youtubeVideoId && <Badge label="📺 YouTube" variant="danger" />}
                    </View>
                  </View>

                  <Text className="text-slate-400 text-sm mb-2" numberOfLines={2}>
                    {item.body || item.description}
                  </Text>

                  {/* Keywords */}
                  {item.keywords && item.keywords.length > 0 && (
                    <View className="flex-row flex-wrap gap-1.5 mt-1 mb-1">
                      {item.keywords.map((kw, idx) => (
                        <Text key={idx} className="text-brand-300 text-[10px] bg-brand-950/80 border border-brand-800/60 px-2 py-0.5 rounded-md font-medium">
                          #{kw}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Action Toolbar */}
              <View className="border-t border-surface-border pt-3 mt-1 flex-row justify-between items-center flex-wrap gap-2">
                <Text className="text-xs text-slate-400">
                  Lessons: {item.lessonCount || 0} • Pass: {item.passPercentage || 80}%
                </Text>

                <View className="flex-row items-center gap-2 flex-wrap">
                  {/* Hide / Unhide button */}
                  <TouchableOpacity
                    onPress={() => item.id && toggleVisibilityMutation.mutate({ id: item.id, currentStatus: item.status || 'published' })}
                    disabled={toggleVisibilityMutation.isPending}
                    className={`px-3 py-1.5 rounded-lg border flex-row items-center gap-1.5 ${
                      item.status === 'published'
                        ? 'bg-surface-dark border-slate-700'
                        : 'bg-emerald-950/80 border-emerald-500/60'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${item.status === 'published' ? 'text-slate-300' : 'text-emerald-300'}`}>
                      {item.status === 'published' ? '👁️ Hide' : '👁️ Publish'}
                    </Text>
                  </TouchableOpacity>

                  {/* Mark Unfinished / Complete */}
                  <TouchableOpacity
                    onPress={() => item.id && toggleUnfinishedMutation.mutate({ id: item.id, currentIsUnfinished: !!item.isUnfinished })}
                    disabled={toggleUnfinishedMutation.isPending}
                    className={`px-3 py-1.5 rounded-lg border flex-row items-center gap-1.5 ${
                      item.isUnfinished
                        ? 'bg-emerald-950/80 border-emerald-500/60'
                        : 'bg-amber-950/80 border-amber-500/60'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${item.isUnfinished ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {item.isUnfinished ? '✓ Mark Complete' : '⏳ Mark Unfinished'}
                    </Text>
                  </TouchableOpacity>

                  {/* Edit Course */}
                  <TouchableOpacity
                    onPress={() => router.push(`/admin/courses/${item.id}` as any)}
                    className="px-3 py-1.5 rounded-lg bg-brand-900/60 border border-brand-500/40 flex-row items-center gap-1"
                  >
                    <Text className="text-xs font-bold text-brand-300">✎ Edit</Text>
                  </TouchableOpacity>

                  {/* Delete Course */}
                  <TouchableOpacity
                    onPress={() => item.id && handleDeleteCourse(item.id, item.title)}
                    disabled={deleteMutation.isPending}
                    className="px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-700/60 flex-row items-center gap-1"
                  >
                    <Text className="text-xs font-bold text-red-300">🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
        />
      </View>
    </ScreenWrapper>
  );
}
