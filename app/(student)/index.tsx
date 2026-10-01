import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Image, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { getPublishedCourses } from '../../src/features/student/studentApi';
import { AppLogo } from '../../src/components/ui/AppLogo';
import { LanguageSwitcher } from '../../src/components/ui/LanguageSwitcher';
import { useAuth } from '../../src/features/auth/useAuth';

export default function StudentCatalogScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isPersian = i18n.language?.startsWith('fa');

  const [selectedCourseForPreview, setSelectedCourseForPreview] = useState<any | null>(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['publishedCourses'],
    queryFn: getPublishedCourses,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface-dark justify-center items-center">
        <ActivityIndicator size="large" color="#FACC15" />
      </View>
    );
  }

  return (
    <ScreenWrapper scrollable={true}>
      <View className="max-w-4xl w-full self-center flex-1 py-4">
        {/* Main Hero Header */}
        <View className="mb-6 bg-gradient-to-r from-brand-900 via-surface-card to-brand-800 p-6 md:p-8 rounded-3xl border border-brand-600/40 shadow-2xl">
          <View className="flex-row items-center justify-between flex-wrap gap-4 mb-4 border-b border-surface-border/60 pb-4">
            <AppLogo size={56} showText />
            <View className="flex-row items-center gap-3">
              <LanguageSwitcher />
              {!user && (
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/login')}
                  className="bg-brand-600 border border-gold-400/80 px-4 py-2 rounded-xl shadow"
                >
                  <Text className="text-white font-bold text-xs">{t('signIn', 'Sign In')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View className="max-w-2xl">
            <Badge
              label={isPersian ? 'انجمن کارآفرینی، آموزش و موفقیت' : 'ENTREPRENEURSHIP & EDUCATION PLATFORM'}
              variant="warning"
              className="mb-3"
            />

            <Text className="text-2xl md:text-4xl font-extrabold text-white mb-3 leading-tight">
              {isPersian
                ? 'آموزش کارآفرینی، کسب‌وکار و مهارت‌های برتر بازار کار'
                : 'Master Entrepreneurship, Business & High-Demand Skills'}
            </Text>

            <Text className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
              {isPersian
                ? 'دسترسی آزاد به کاتالوگ دوره‌های تخصصی، سرفصل‌های تعاملی، مقالات و آزمون‌های معتبر مدرک دیجیتال.'
                : 'Explore interactive courses, sample curriculum, expert insights, and verifiable digital certificates.'}
            </Text>

            <View className="flex-row flex-wrap gap-3">
              <TouchableOpacity
                onPress={() => router.push('/(student)/blog' as any)}
                className="bg-gradient-to-r from-gold-500 to-amber-600 px-5 py-3 rounded-2xl shadow-lg border border-gold-300/60"
              >
                <Text className="text-surface-dark font-extrabold text-xs tracking-wider uppercase text-center">
                  ✨ {t('blog', 'Blog & Insights')} →
                </Text>
              </TouchableOpacity>

              {!user && (
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/register')}
                  className="bg-surface-dark/90 border border-surface-border px-5 py-3 rounded-2xl"
                >
                  <Text className="text-gold-300 font-bold text-xs text-center">
                    🚀 {t('signUp', 'Create Account')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Section Header */}
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-extrabold text-white">
              {isPersian ? 'دوره‌های آموزشی برجسته' : 'Featured Courses'}
            </Text>
            <Text className="text-xs text-slate-400">
              {isPersian ? 'روی هر دوره کلیک کنید تا سرفصل‌ها و دروس را ببینید' : 'Select a course to inspect sample curriculum & lessons'}
            </Text>
          </View>
          <Badge label={`${courses.length} ${isPersian ? 'دوره' : 'Courses'}`} variant="info" />
        </View>

        {/* Course Cards List */}
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id || item.slug}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const title = isPersian && item.faTitle ? item.faTitle : item.title;
            const desc = isPersian && item.faDescription ? item.faDescription : item.description;

            return (
              <Card className="mb-5 border-surface-border bg-surface-card hover:bg-surface-hover p-5 shadow-lg">
                <View className="flex-col md:flex-row items-start md:items-center mb-4 gap-4">
                  <Image
                    source={{ uri: item.coverUrl }}
                    className="w-full md:w-32 h-36 md:h-24 rounded-2xl bg-brand-950 border border-brand-800/60"
                    resizeMode="cover"
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between flex-wrap gap-2 mb-1">
                      <Text className="text-xl font-extrabold text-white flex-1">{title}</Text>
                      <Badge label="VERIFIED CERTIFIED" variant="success" />
                    </View>
                    <Text className="text-gold-400 text-xs font-semibold mb-2">
                      Pass Threshold: {item.passPercentage}% • Exam: {item.exam?.questionCount || 10} Qs • {item.exam?.timeLimitMin || 20} min
                    </Text>
                    <Text className="text-slate-300 text-sm leading-relaxed" numberOfLines={2}>
                      {desc}
                    </Text>
                  </View>
                </View>

                {/* Sample Content Highlights */}
                {item.sampleLessons && item.sampleLessons.length > 0 && (
                  <View className="bg-surface-dark/70 p-3 rounded-xl border border-surface-border/50 mb-4">
                    <Text className="text-[11px] font-bold text-gold-400 uppercase mb-2">
                      {isPersian ? 'سرفصل نمونه دروس دوره:' : 'Sample Course Curriculum:'}
                    </Text>
                    {item.sampleLessons.slice(0, 2).map((lesson: any, i: number) => (
                      <View key={i} className="flex-row justify-between items-center py-1">
                        <Text className="text-slate-300 text-xs font-medium flex-1 mr-2" numberOfLines={1}>
                          • {lesson.title}
                        </Text>
                        <Text className="text-slate-400 text-[10px]">{lesson.duration}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View className="flex-row justify-between items-center border-t border-surface-border/60 pt-3">
                  <TouchableOpacity
                    onPress={() => setSelectedCourseForPreview(item)}
                    className="bg-surface-dark border border-gold-400/40 px-3.5 py-2 rounded-xl"
                  >
                    <Text className="text-gold-300 text-xs font-bold">
                      📋 {isPersian ? 'نمایش سرفصل‌ها' : 'Preview Curriculum'}
                    </Text>
                  </TouchableOpacity>

                  <Button
                    title={isPersian ? 'ورود به دوره →' : 'View Course →'}
                    variant="primary"
                    onPress={() => router.push(`/(student)/course/${item.id}` as any)}
                  />
                </View>
              </Card>
            );
          }}
        />

        {/* Modal / Preview Drawer for Course Curriculum */}
        {selectedCourseForPreview && (
          <Modal transparent animationType="fade" visible={!!selectedCourseForPreview}>
            <View className="flex-1 bg-black/80 justify-center items-center p-4">
              <View className="bg-surface-card border border-gold-400/60 rounded-3xl p-6 max-w-xl w-full max-h-[85vh]">
                <View className="flex-row justify-between items-start mb-4 border-b border-surface-border pb-3">
                  <View className="flex-1 mr-2">
                    <Badge label="CURRICULUM PREVIEW" variant="warning" className="mb-1" />
                    <Text className="text-xl font-bold text-white">
                      {isPersian && selectedCourseForPreview.faTitle ? selectedCourseForPreview.faTitle : selectedCourseForPreview.title}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedCourseForPreview(null)}
                    className="bg-surface-dark border border-surface-border p-2 rounded-full"
                  >
                    <Text className="text-gold-400 font-bold">✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView className="mb-4">
                  <Text className="text-slate-300 text-sm mb-4 leading-relaxed">
                    {isPersian && selectedCourseForPreview.faDescription
                      ? selectedCourseForPreview.faDescription
                      : selectedCourseForPreview.description}
                  </Text>

                  <Text className="text-base font-bold text-gold-400 mb-3">
                    {isPersian ? 'سرفصل‌های آموزشی این دوره:' : 'Course Lessons & Modules:'}
                  </Text>

                  {(selectedCourseForPreview.sampleLessons || []).map((lesson: any, idx: number) => (
                    <View key={idx} className="bg-surface-dark/80 p-3.5 rounded-xl border border-surface-border/50 mb-2.5">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-white font-bold text-sm flex-1 mr-2">{lesson.title}</Text>
                        <Text className="text-gold-400 text-xs font-semibold">{lesson.duration}</Text>
                      </View>
                      <Text className="text-slate-400 text-xs">{lesson.description}</Text>
                    </View>
                  ))}
                </ScrollView>

                <View className="flex-row justify-end gap-3 border-t border-surface-border pt-4">
                  <TouchableOpacity
                    onPress={() => setSelectedCourseForPreview(null)}
                    className="px-4 py-2.5 rounded-xl border border-surface-border"
                  >
                    <Text className="text-slate-300 font-semibold text-xs">{isPersian ? 'بستن' : 'Close'}</Text>
                  </TouchableOpacity>

                  <Button
                    title={isPersian ? 'شروع دوره' : 'Start Course Now'}
                    onPress={() => {
                      const id = selectedCourseForPreview.id;
                      setSelectedCourseForPreview(null);
                      router.push(`/(student)/course/${id}` as any);
                    }}
                  />
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </ScreenWrapper>
  );
}
