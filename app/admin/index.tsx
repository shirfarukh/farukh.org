import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Badge } from '../../src/components/ui/Badge';
import { AppLogo } from '../../src/components/ui/AppLogo';
import { LanguageSwitcher } from '../../src/components/ui/LanguageSwitcher';
import { getAdminCourses, createOrUpdateCourse } from '../../src/features/admin/adminApi';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [faTitle, setFaTitle] = useState('');
  const [faDescription, setFaDescription] = useState('');

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
        faTitle: faTitle || title,
        faDescription: faDescription || description,
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
      setFaTitle('');
      setFaDescription('');
    },
  });

  return (
    <ScreenWrapper>
      <ScrollView className="flex-1 py-4 max-w-4xl w-full self-center">
        {/* Admin Header Banner */}
        <View className="mb-6 bg-gradient-to-r from-brand-900 via-surface-card to-brand-800 p-6 rounded-3xl border border-gold-400/40 shadow-xl flex-row justify-between items-center flex-wrap gap-4">
          <View className="flex-1 min-w-[240px]">
            <View className="flex-row items-center gap-2 mb-2">
              <Badge label="ADMIN CONTROL CENTER" variant="warning" />
              <AppLogo size={36} />
            </View>
            <Text className="text-2xl font-extrabold text-white mb-1">
              {isPersian ? 'داشبورد مدیریت دوره‌ها و محتوا' : 'Admin Control Panel'}
            </Text>
            <Text className="text-slate-300 text-xs">
              {isPersian ? 'مدیریت دوره‌ها، ایجاد محتوای جدید، سرفصل‌ها و استعلام گواهی‌نامه‌ها' : 'Create courses, edit lessons, manage question banks, and oversee students.'}
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            <LanguageSwitcher />
            <TouchableOpacity
              onPress={() => router.push('/(student)')}
              className="bg-surface-dark border border-surface-border px-3.5 py-2 rounded-xl"
            >
              <Text className="text-gold-300 font-bold text-xs">
                ← {isPersian ? 'بازگشت به سایت' : 'Exit Admin'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions & Add Course Banner */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-xl font-bold text-white">
              {isPersian ? 'دوره‌های موجود' : 'Active Courses'}
            </Text>
            <Text className="text-xs text-slate-400">
              {isPersian ? 'جهت ویرایش روی هر دوره کلیک کنید' : 'Click any course to edit lessons, modules, and exam questions'}
            </Text>
          </View>

          <Button
            title={showCreate ? (isPersian ? 'انصراف' : 'Cancel') : (isPersian ? '+ افزودن دوره جدید' : '+ Add New Course')}
            variant={showCreate ? 'secondary' : 'primary'}
            onPress={() => setShowCreate(!showCreate)}
            className="shadow-lg shadow-brand-900"
          />
        </View>

        {/* Add Course Form Card */}
        {showCreate && (
          <Card className="mb-6 border-gold-400 bg-surface-card p-6">
            <View className="flex-row items-center justify-between mb-4 border-b border-surface-border pb-3">
              <Text className="text-lg font-extrabold text-white">
                ✨ {isPersian ? 'ایجاد دوره جدید' : 'Create New Course'}
              </Text>
              <Badge label="PUBLISHED" variant="success" />
            </View>

            <Input
              label={isPersian ? 'عنوان انگلیسی دوره' : 'Course Title (English)'}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Executive Entrepreneurship & Growth Strategy"
            />

            <Input
              label={isPersian ? 'عنوان فارسی دوره' : 'Course Title (Persian)'}
              value={faTitle}
              onChangeText={setFaTitle}
              placeholder="مثال: آموزش جامع توسعه کسب‌وکار و کارآفرینی"
            />

            <Input
              label={isPersian ? 'توضیحات انگلیسی دوره' : 'Description (English)'}
              value={description}
              onChangeText={setDescription}
              placeholder="Detailed course description..."
              multiline
              numberOfLines={2}
            />

            <Input
              label={isPersian ? 'توضیحات فارسی دوره' : 'Description (Persian)'}
              value={faDescription}
              onChangeText={setFaDescription}
              placeholder="توضیحات جامع درباره سرفصل‌ها و هدف دوره..."
              multiline
              numberOfLines={2}
            />

            <Button
              title={isPersian ? 'ذخیره و انتشار دوره' : 'Save & Publish Course'}
              onPress={() => createMutation.mutate()}
              loading={createMutation.isPending}
              className="mt-2"
            />
          </Card>
        )}

        {/* Metrics Grid */}
        <View className="flex-row flex-wrap justify-between mb-6">
          <View className="w-[48%] md:w-[23%] bg-surface-card border border-surface-border p-4 rounded-2xl mb-3">
            <Text className="text-slate-400 text-xs font-medium mb-1">Total Courses</Text>
            <Text className="text-3xl font-extrabold text-gold-400">{courses.length}</Text>
          </View>
          <View className="w-[48%] md:w-[23%] bg-surface-card border border-surface-border p-4 rounded-2xl mb-3">
            <Text className="text-slate-400 text-xs font-medium mb-1">Active Students</Text>
            <Text className="text-3xl font-extrabold text-brand-400">24</Text>
          </View>
          <View className="w-[48%] md:w-[23%] bg-surface-card border border-surface-border p-4 rounded-2xl mb-3">
            <Text className="text-slate-400 text-xs font-medium mb-1">Certificates Issued</Text>
            <Text className="text-3xl font-extrabold text-emerald-400">18</Text>
          </View>
          <View className="w-[48%] md:w-[23%] bg-surface-card border border-surface-border p-4 rounded-2xl mb-3">
            <Text className="text-slate-400 text-xs font-medium mb-1">Pass Rate</Text>
            <Text className="text-3xl font-extrabold text-amber-400">92%</Text>
          </View>
        </View>

        {/* Course List */}
        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#FACC15" />
          </View>
        ) : (
          <View>
            {courses.map((item) => (
              <Card
                key={item.id || item.slug}
                onPress={() => router.push(`/admin/courses/${item.id}` as any)}
                className="mb-4 border-surface-border bg-surface-card hover:bg-surface-hover p-5"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 mr-2">
                    <Text className="text-lg font-bold text-white mb-0.5">
                      {isPersian && item.faTitle ? item.faTitle : item.title}
                    </Text>
                    <Text className="text-slate-400 text-xs">
                      {item.title}
                    </Text>
                  </View>
                  <Badge label={item.status.toUpperCase()} variant={item.status === 'published' ? 'success' : 'warning'} />
                </View>

                <Text className="text-slate-300 text-sm mb-3" numberOfLines={2}>
                  {isPersian && item.faDescription ? item.faDescription : item.description}
                </Text>

                <View className="flex-row justify-between items-center border-t border-surface-border/60 pt-3">
                  <Text className="text-xs text-gold-400 font-semibold">
                    Pass: {item.passPercentage}% • Exam: {item.exam?.questionCount || 10} Qs
                  </Text>
                  <Text className="text-xs text-brand-400 font-bold">
                    {isPersian ? 'ویرایش محتوا و سوالات →' : 'Edit Lessons & Exam →'}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Management Quick Links */}
        <Text className="text-lg font-bold text-white mb-3 mt-4">
          {isPersian ? 'سایر بخش‌های مدیریت' : 'Additional Management'}
        </Text>

        <Card onPress={() => router.push('/admin/students')} className="mb-4">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white text-base font-bold">Student Roster & CSV Import</Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                Bulk import student accounts, reset course attempts, and view user metrics
              </Text>
            </View>
            <Text className="text-gold-400 text-lg font-bold">→</Text>
          </View>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}
