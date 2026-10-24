import React, { useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Badge } from '../../src/components/ui/Badge';
import { useAuth } from '../../src/features/auth/useAuth';
import { useTheme } from '../../src/features/theme/ThemeContext';
import { ReviewRequest, ReviewComment } from '../../src/types/review';
import { getInstructorReviewRequests } from '../../src/features/instructor/instructorApi';
import { doc, updateDoc, arrayUnion, serverTimestamp } from '@firebase/firestore';
import { db } from '../../src/lib/firebase';

export default function InstructorReviewRequestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isPersian = i18n.language?.startsWith('fa');

  const [activeReplyRequestId, setActiveReplyRequestId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['instructorReviewRequests', user?.uid],
    queryFn: () => (user?.uid ? getInstructorReviewRequests(user.uid) : Promise.resolve([])),
    enabled: !!user?.uid,
  });

  const sendCommentMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!replyText.trim() || !user) return;
      const ref = doc(db, 'reviewRequests', requestId);
      const newComment: ReviewComment = {
        id: `comment_${Date.now()}`,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Instructor',
        authorRole: 'instructor',
        text: replyText.trim(),
        createdAt: new Date().toISOString(),
      };
      await updateDoc(ref, {
        comments: arrayUnion(newComment),
      });
    },
    onSuccess: () => {
      setReplyText('');
      setActiveReplyRequestId(null);
      refetch();
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge label={isPersian ? 'تأیید شده' : 'APPROVED'} variant="success" />;
      case 'changes_requested':
        return <Badge label={isPersian ? 'نیاز به اصلاح' : 'CHANGES REQ'} variant="warning" />;
      case 'rejected':
        return <Badge label={isPersian ? 'رد شده' : 'REJECTED'} variant="danger" />;
      case 'pending':
      default:
        return <Badge label={isPersian ? 'در انتظار بررسی' : 'PENDING'} variant="warning" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'publish':
        return <Badge label="PUBLISH" variant="info" />;
      case 'revision':
        return <Badge label="REVISION" variant="info" />;
      case 'archive':
        return <Badge label="ARCHIVE" variant="warning" />;
      case 'delete':
        return <Badge label="DELETE" variant="danger" />;
      default:
        return <Badge label={type.toUpperCase()} variant="info" />;
    }
  };

  return (
    <ScreenWrapper scrollable>
      <View className="max-w-4xl w-full self-center px-4 py-6 pb-28">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>
              {isPersian ? 'درخواست‌های بررسی و بازخورد' : 'Review Requests & Discussions'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              {isPersian
                ? 'پیگیری وضعیت انتشار، بازبینی سرفصل‌ها و گفتگو با ناظران آکادمیک'
                : 'Track course submissions, revision feedback, and chat with academic reviewers'}
            </Text>
          </View>

          <TouchableOpacity onPress={() => refetch()} style={{ padding: 8 }}>
            <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 13 }}>
              🔄 {isPersian ? 'بروزرسانی' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : requests.length === 0 ? (
          <Card style={{ padding: 32, alignItems: 'center', borderRadius: 20 }}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>📋</Text>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', textAlign: 'center' }}>
              {isPersian ? 'هیچ درخواستی ثبت نشده است' : 'No review requests yet'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 18 }}>
              {isPersian
                ? 'هنگامی که دوره‌ای را برای انتشار یا بازبینی ارسال نمایید، تاریخچه و بازخوردهای آن در اینجا نمایش داده می‌شود.'
                : 'When you submit a course or revision for review, the discussion thread will appear here.'}
            </Text>
            <Button
              title={isPersian ? 'بازگشت به دوره‌ها' : 'View My Courses'}
              onPress={() => router.push('/instructor' as any)}
            />
          </Card>
        ) : (
          <View className="gap-5">
            {requests.map((req) => (
              <Card
                key={req.id}
                style={{
                  padding: 18,
                  borderRadius: 18,
                  borderColor: req.status === 'changes_requested' ? '#F59E0B' : colors.cardBorder,
                  borderWidth: 1.5,
                }}
              >
                {/* Header Row */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    {getTypeBadge(req.type)}
                    {getStatusBadge(req.status)}
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                    Course ID: {req.courseId}
                  </Text>
                </View>

                {/* Pre-flight checklist outcome */}
                {req.checklist && (
                  <View
                    style={{
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      borderRadius: 12,
                      padding: 10,
                      marginBottom: 12,
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <Text style={{ color: req.checklist.enFaComplete ? colors.success : colors.danger, fontSize: 11, fontWeight: '700' }}>
                      {req.checklist.enFaComplete ? '✓' : '✗'} Bilingual Title & Desc
                    </Text>
                    <Text style={{ color: req.checklist.validYouTube ? colors.success : colors.danger, fontSize: 11, fontWeight: '700' }}>
                      {req.checklist.validYouTube ? '✓' : '✗'} Valid Video
                    </Text>
                    <Text style={{ color: req.checklist.allLessonsHaveQuiz ? colors.success : colors.danger, fontSize: 11, fontWeight: '700' }}>
                      {req.checklist.allLessonsHaveQuiz ? '✓' : '✗'} Quizzes Checked
                    </Text>
                  </View>
                )}

                {/* Comments Thread */}
                {req.comments && req.comments.length > 0 && (
                  <View className="gap-2 mb-3">
                    <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                      {isPersian ? 'گفتگو و نظرات بررسی:' : 'Review Discussion:'}
                    </Text>
                    {req.comments.map((c) => (
                      <View
                        key={c.id}
                        style={{
                          backgroundColor: c.authorRole === 'admin'
                            ? isDark ? 'rgba(234, 179, 8, 0.1)' : '#FEF3C7'
                            : isDark ? '#0F172A' : '#FFFFFF',
                          borderColor: c.authorRole === 'admin' ? colors.goldBorder : colors.cardBorder,
                          borderWidth: 1,
                          borderRadius: 12,
                          padding: 10,
                        }}
                      >
                        <View className="flex-row items-center justify-between mb-1">
                          <Text style={{ color: c.authorRole === 'admin' ? colors.gold : colors.text, fontWeight: '800', fontSize: 12 }}>
                            {c.authorRole === 'admin' ? '🛡️ Academic Reviewer' : '👨‍🏫 Instructor'} ({c.authorName})
                          </Text>
                          <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                          </Text>
                        </View>
                        <Text style={{ color: colors.text, fontSize: 13, lineHeight: 18 }}>
                          {c.text}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Reply Input or Button */}
                {activeReplyRequestId === req.id ? (
                  <View style={{ borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: 10 }}>
                    <Input
                      label={isPersian ? 'ارسال پاسخ یا توضیح به ناظر' : 'Reply to Academic Reviewer'}
                      placeholder="Write your response or clarification..."
                      value={replyText}
                      onChangeText={setReplyText}
                      multiline
                      numberOfLines={2}
                    />
                    <View className="flex-row justify-end gap-2 mt-2">
                      <Button
                        title="Cancel"
                        variant="secondary"
                        onPress={() => {
                          setActiveReplyRequestId(null);
                          setReplyText('');
                        }}
                      />
                      <Button
                        title={sendCommentMutation.isPending ? 'Sending...' : 'Send Reply'}
                        onPress={() => req.id && sendCommentMutation.mutate(req.id)}
                        loading={sendCommentMutation.isPending}
                        disabled={!replyText.trim()}
                      />
                    </View>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-between pt-2">
                    <TouchableOpacity
                      onPress={() => router.push(`/instructor/courses/${req.courseId}` as any)}
                    >
                      <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 12 }}>
                        ✏️ {isPersian ? 'مشاهده و ویرایش دوره' : 'Open Course Editor'} →
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        if (req.id) setActiveReplyRequestId(req.id);
                        setReplyText('');
                      }}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                      }}
                    >
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>
                        💬 {isPersian ? 'پاسخ دادن' : 'Reply'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}
