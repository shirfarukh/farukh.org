import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { useTheme } from '../../../src/features/theme/ThemeContext';
import { SchoolLesson } from '../../../src/types/schoolLesson';
import {
  getPendingSchoolLessons,
  reviewSchoolLesson,
} from '../../../src/features/school/schoolLessonApi';

export default function AdminSchoolLessonsReviewScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState<Record<string, string>>({});

  const { data: pendingLessons = [], isLoading, refetch } = useQuery({
    queryKey: ['adminPendingSchoolLessons'],
    queryFn: getPendingSchoolLessons,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      rejectionReason,
    }: {
      id: string;
      status: 'published' | 'changes_requested' | 'draft';
      rejectionReason?: string;
    }) => {
      await reviewSchoolLesson(id, status, rejectionReason);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminPendingSchoolLessons'] });
      refetch();
      const msg =
        variables.status === 'published'
          ? (isPersian ? 'درس با موفقیت تایید و در صنف منتشر گردید.' : 'Lesson approved and published to grade.')
          : (isPersian ? 'بازخورد به آموزگار ارسال شد.' : 'Feedback sent to teacher.');

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert(isPersian ? 'موفقیت' : 'Success', msg);
      }
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message || 'Failed to update lesson');
    },
  });

  return (
    <ScreenWrapper scrollable>
      <View className="max-w-6xl w-full self-center px-4 py-6 pb-28">
        {/* Breadcrumb */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.push('/admin' as any)}
            style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}
          >
            <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 13 }}>
              ← {isPersian ? 'بازگشت به کنترل پنل ادمین' : 'Back to Admin Control Panel'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => refetch()}
            style={{
              backgroundColor: colors.cardHover,
              borderColor: colors.cardBorder,
              borderWidth: 1,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 12 }}>
              🔄 {isPersian ? 'تازه سازی' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Text style={{ fontSize: 28 }}>📝</Text>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900', textAlign: isPersian ? 'right' : 'left' }}>
              {isPersian ? 'صف بازبینی و تایید درس‌های مکتب دختران' : 'School Lessons Review Queue'}
            </Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: isPersian ? 'right' : 'left' }}>
            {isPersian
              ? `درس‌های ارسال شده توسط آموزگاران مکتب پیش از انتشار در نصاب بررسی و تایید می‌شوند (${pendingLessons.length} درس در صف بررسی)`
              : `Review lessons submitted by teachers before publishing them into grade syllabi (${pendingLessons.length} in queue)`}
          </Text>
        </View>

        {/* Lessons List */}
        {isLoading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : pendingLessons.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center', backgroundColor: colors.card, borderRadius: 20 }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>✓</Text>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, marginBottom: 6 }}>
              {isPersian ? 'تمام درس‌ها بررسی شده‌اند' : 'All lessons reviewed'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              {isPersian ? 'در حال حاضر هیچ درسی در صف انتظار بازبینی وجود ندارد.' : 'No school lessons currently awaiting review.'}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {pendingLessons.map((item) => {
              const isExpanded = expandedId === item.id;
              const feedback = feedbackNotes[item.id!] || '';

              return (
                <Card key={item.id} className="p-5 border-surface-border bg-surface-card">
                  <View
                    style={{
                      flexDirection: isPersian ? 'row-reverse' : 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 10,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <View
                          style={{
                            backgroundColor: '#3B82F6',
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 11 }}>
                            {isPersian ? `صنف ${item.grade}` : `Grade ${item.grade}`}
                          </Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: 'rgba(234, 179, 8, 0.15)',
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderWidth: 1,
                            borderColor: colors.goldBorder,
                          }}
                        >
                          <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 11 }}>
                            {isPersian ? item.faSubject : item.subject}
                          </Text>
                        </View>
                        <Badge label="IN REVIEW" variant="warning" />
                      </View>

                      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900', textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? item.faTitle : item.title}
                      </Text>
                      {item.faTitle && (
                        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2, textAlign: isPersian ? 'right' : 'left' }}>
                          {item.title}
                        </Text>
                      )}
                      <Text style={{ color: colors.gold, fontSize: 11.5, marginTop: 4, fontWeight: '700', textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? 'آموزگار: ' : 'Teacher: '}{item.teacherName} {item.teacherEmail ? `(${item.teacherEmail})` : ''}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => setExpandedId(isExpanded ? null : item.id!)}
                      style={{
                        backgroundColor: colors.cardHover,
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 12 }}>
                        {isExpanded ? (isPersian ? 'بستن جزئیات ▲' : 'Close ▲') : (isPersian ? 'بررسی محتوای درس ▼' : 'Inspect Lesson ▼')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 12, textAlign: isPersian ? 'right' : 'left' }}>
                    {item.description}
                  </Text>

                  {/* Expanded Lesson View */}
                  {isExpanded && (
                    <View
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: colors.cardBorder,
                        paddingTop: 14,
                        marginTop: 6,
                        gap: 12,
                      }}
                    >
                      {item.videoUrl && (
                        <View style={{ backgroundColor: isDark ? '#1E293B' : '#F1F5F9', padding: 10, borderRadius: 10 }}>
                          <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '700' }}>
                            {isPersian ? 'لینک ویدیو:' : 'Video Link:'}
                          </Text>
                          <Text style={{ color: colors.text, fontSize: 12 }}>{item.videoUrl}</Text>
                        </View>
                      )}

                      {item.textContent && (
                        <View>
                          <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '800', marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                            {isPersian ? 'متن و جزوه درسی:' : 'Lesson Study Notes:'}
                          </Text>
                          <Text style={{ color: colors.text, fontSize: 12.5, lineHeight: 20, textAlign: isPersian ? 'right' : 'left' }}>
                            {item.textContent}
                          </Text>
                        </View>
                      )}

                      {item.questions && item.questions.length > 0 && (
                        <View>
                          <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '800', marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                            {isPersian ? `سوالات آزمون درس (${item.questions.length} سوال):` : `Quiz Questions (${item.questions.length}):`}
                          </Text>
                          {item.questions.map((q, idx) => (
                            <View key={q.id} style={{ backgroundColor: isDark ? '#1E293B' : '#F1F5F9', padding: 10, borderRadius: 10, marginBottom: 6 }}>
                              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 12, marginBottom: 4 }}>
                                {idx + 1}. {q.question}
                              </Text>
                              <Text style={{ color: '#10B981', fontSize: 11.5, fontWeight: '700' }}>
                                ✓ {isPersian ? 'پاسخ صحیح: ' : 'Correct: '}{q.options[q.correctIndex]}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Feedback Notes Input */}
                      <View>
                        <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                          {isPersian ? 'یادداشت یا دلیل اصلاحیه (اختیاری در صورت رد یا درخواست تغییر):' : 'Feedback Notes (for changes requested):'}
                        </Text>
                        <TextInput
                          value={feedback}
                          onChangeText={(txt) => setFeedbackNotes({ ...feedbackNotes, [item.id!]: txt })}
                          placeholder={isPersian ? 'توضیحات لازم به آموزگار جهت اصلاح درس...' : 'Feedback to teacher...'}
                          placeholderTextColor="#64748B"
                          style={{
                            backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                            borderColor: colors.cardBorder,
                            borderWidth: 1,
                            borderRadius: 10,
                            padding: 10,
                            color: colors.text,
                            fontSize: 12,
                            textAlign: isPersian ? 'right' : 'left',
                          }}
                        />
                      </View>

                      {/* Action Buttons */}
                      <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', gap: 10, marginTop: 6 }}>
                        <TouchableOpacity
                          onPress={() => reviewMutation.mutate({ id: item.id!, status: 'published' })}
                          disabled={reviewMutation.isPending}
                          style={{
                            flex: 1,
                            backgroundColor: '#10B981',
                            paddingVertical: 10,
                            borderRadius: 10,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>
                            ✓ {isPersian ? 'تایید و انتشار فوری در صنف' : 'Approve & Publish to Grade'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => reviewMutation.mutate({ id: item.id!, status: 'changes_requested', rejectionReason: feedback })}
                          disabled={reviewMutation.isPending}
                          style={{
                            backgroundColor: '#F59E0B',
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 10,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>
                            ⚠️ {isPersian ? 'درخواست اصلاحات' : 'Request Changes'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => reviewMutation.mutate({ id: item.id!, status: 'draft', rejectionReason: feedback })}
                          disabled={reviewMutation.isPending}
                          style={{
                            backgroundColor: '#EF4444',
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 10,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>
                            ✕ {isPersian ? 'بازگرداندن به پیش‌نویس' : 'Return to Draft'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </Card>
              );
            })}
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}
