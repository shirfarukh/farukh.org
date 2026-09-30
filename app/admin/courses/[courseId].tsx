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
  getCourseModules,
  getCourseLessons,
  createModule,
  createOrUpdateLesson,
  saveExamQuestion,
  getExamQuestions,
} from '../../../src/features/admin/adminApi';
import { parseBulkQuestions } from '../../../src/features/admin/csvImport';
import { extractYouTubeId } from '../../../src/lib/utils';

export default function AdminCourseEditScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const queryClient = useQueryClient();

  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [showAddLesson, setShowAddLesson] = useState<string | null>(null);

  // Lesson Form State
  const [lessonTitle, setLessonTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [introMarkdown, setIntroMarkdown] = useState('');

  // Bulk Import State
  const [showBulkExam, setShowBulkExam] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const { data: courses = [] } = useQuery({
    queryKey: ['adminCourses'],
    queryFn: getAdminCourses,
  });
  const course = courses.find((c) => c.id === courseId);

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

  const bulkImportExamMutation = useMutation({
    mutationFn: async () => {
      if (!courseId || !bulkText) return;
      const parsed = parseBulkQuestions(bulkText, bulkText.trim().startsWith('[') ? 'json' : 'csv');
      for (const q of parsed) {
        await saveExamQuestion(courseId, q);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminExamQuestions', courseId] });
      setShowBulkExam(false);
      setBulkText('');
    },
  });

  if (!course) {
    return (
      <View className="flex-1 bg-surface-dark justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScreenWrapper>
      <View className="max-w-4xl w-full self-center">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-white">{course.title}</Text>
          <Text className="text-slate-400 text-sm mt-1">{course.description}</Text>
        </View>

        {/* Modules & Lessons Section */}
        <Text className="text-xl font-bold text-white mb-3">Modules & Lessons</Text>

        {modules.map((m) => {
          const moduleLessons = lessons.filter((l) => l.moduleId === m.id);
          const isAdding = showAddLesson === m.id;

          return (
            <Card key={m.id} className="mb-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-bold text-brand-400">{m.title}</Text>
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
                <Text className="text-slate-500 text-sm italic">No lessons added yet.</Text>
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

        {/* Exam Question Pool Management */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-xl font-bold text-white">Final Exam Pool ({examQuestions.length} questions)</Text>
          <Button
            title={showBulkExam ? 'Cancel' : 'Bulk Import'}
            variant="outline"
            onPress={() => setShowBulkExam(!showBulkExam)}
          />
        </View>

        {showBulkExam && (
          <Card className="mb-6 border-brand-500">
            <Text className="text-base font-bold text-white mb-2">Bulk Import Questions (CSV or JSON)</Text>
            <Text className="text-xs text-slate-400 mb-3">
              CSV Format: Question Text, Option 1, Option 2, Option 3, Option 4, CorrectIndex (1-4), Explanation
            </Text>
            <Input
              value={bulkText}
              onChangeText={setBulkText}
              placeholder="Paste CSV or JSON array here..."
              multiline
              numberOfLines={6}
            />
            <Button
              title="Import Questions to Exam Pool"
              onPress={() => bulkImportExamMutation.mutate()}
              loading={bulkImportExamMutation.isPending}
            />
          </Card>
        )}
      </View>
    </ScreenWrapper>
  );
}
