import React, { useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { Badge } from '../../../src/components/ui/Badge';
import { useAuth } from '../../../src/features/auth/useAuth';
import { useTheme } from '../../../src/features/theme/ThemeContext';
import { ReviewRequest, ReviewComment } from '../../../src/types/review';
import {
  getReviewRequests,
  adminReviewCourseCallable,
} from '../../../src/features/instructor/instructorApi';
import { doc, updateDoc, arrayUnion } from '@firebase/firestore';
import { db } from '../../../src/lib/firebase';

export default function AdminCourseReviewQueueScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isPersian = i18n.language?.startsWith('fa');

  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'changes_requested' | 'rejected'>('pending');

  // Decision Modal
  const [selectedReq, setSelectedReq] = useState<ReviewRequest | null>(null);
  const [decisionType, setDecisionType] = useState<'approve' | 'request_changes' | 'reject'>('approve');
  const [decisionComment, setDecisionComment] = useState('');

  // Comment Thread Reply
  const [activeCommentReqId, setActiveCommentReqId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['adminReviewRequests'],
    queryFn: getReviewRequests,
  });

  const filteredRequests = requests.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedReq) return;
      return await adminReviewCourseCallable({
        courseId: selectedReq.courseId,
        decision: decisionType,
        isRevision: selectedReq.type === 'revision',
        comment: decisionComment.trim() || undefined,
      });
    },
    onSuccess: () => {
      setSelectedReq(null);
      setDecisionComment('');
      queryClient.invalidateQueries({ queryKey: ['adminReviewRequests'] });
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      Alert.alert('Decision Recorded', 'The review decision was executed and the course updated.');
      refetch();
    },
    onError: (err: any) => {
      Alert.alert('Review Action Failed', err?.message || 'Failed to process decision');
    },
  });

  const sendCommentMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!newCommentText.trim() || !user) return;
      const ref = doc(db, 'reviewRequests', requestId);
      const newComment: ReviewComment = {
        id: `comment_${Date.now()}`,
        authorId: user.uid,
        authorName: user.displayName || 'Academic Admin',
        authorRole: 'admin',
        text: newCommentText.trim(),
        createdAt: new Date().toISOString(),
      };
      await updateDoc(ref, {
        comments: arrayUnion(newComment),
      });
    },
    onSuccess: () => {
      setNewCommentText('');
      setActiveCommentReqId(null);
      refetch();
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge label="APPROVED" variant="success" />;
      case 'changes_requested':
        return <Badge label="CHANGES REQ" variant="warning" />;
      case 'rejected':
        return <Badge label="REJECTED" variant="danger" />;
      case 'pending':
      default:
        return <Badge label="PENDING" variant="warning" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'publish':
        return <Badge label="NEW PUBLISH" variant="info" />;
      case 'revision':
        return <Badge label="REVISION DRAFT" variant="info" />;
      case 'archive':
        return <Badge label="ARCHIVE REQ" variant="warning" />;
      case 'delete':
        return <Badge label="DELETE REQ" variant="danger" />;
      default:
        return <Badge label={type.toUpperCase()} variant="info" />;
    }
  };

  return (
    <ScreenWrapper scrollable>
      <View className="max-w-5xl w-full self-center px-4 py-6 pb-28">
        {/* Header Breadcrumb & Actions */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.push('/admin' as any)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 13 }}>
              ← {isPersian ? 'بازگشت به پنل مدیریت' : 'Back to Admin'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => refetch()} style={{ padding: 6 }}>
            <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 13 }}>
              🔄 {isPersian ? 'بروزرسانی' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 }}>
            {isPersian ? 'صف بازبینی آکادمیک دوره‌ها' : 'Course Review & Revision Queue'}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
            {isPersian
              ? 'تأیید انتشار دوره‌های جدید، ادغام پیش‌نویس‌های اصلاحی با نسخه زنده و مدیریت درخواست‌های بایگانی'
              : 'Review course submissions, merge staged revisions to live courses, and evaluate archive requests'}
          </Text>
        </View>

        {/* Filter Pills */}
        <View className="flex-row flex-wrap gap-2 mb-6">
          {[
            { id: 'pending', label: 'Pending Review' },
            { id: 'approved', label: 'Approved & Merged' },
            { id: 'changes_requested', label: 'Changes Requested' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'all', label: 'All Requests' },
          ].map((f) => {
            const active = filter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id as any)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: active ? colors.gold : isDark ? '#1E293B' : '#F1F5F9',
                  borderWidth: 1,
                  borderColor: active ? colors.gold : colors.cardBorder,
                }}
              >
                <Text
                  style={{
                    color: active ? (isDark ? '#0F172A' : '#FFFFFF') : colors.text,
                    fontSize: 12,
                    fontWeight: active ? '800' : '600',
                  }}
                >
                  {f.label} ({requests.filter((r) => (f.id === 'all' ? true : r.status === f.id)).length})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Requests List */}
        {isLoading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : filteredRequests.length === 0 ? (
          <Card style={{ padding: 32, alignItems: 'center', borderRadius: 20 }}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>📋</Text>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>
              No review requests in this queue
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
              When instructors submit courses or draft revisions for review, they will appear here.
            </Text>
          </Card>
        ) : (
          <View className="gap-5">
            {filteredRequests.map((req) => (
              <Card
                key={req.id}
                style={{
                  padding: 20,
                  borderRadius: 20,
                  borderColor: req.status === 'pending' ? colors.goldBorder : colors.cardBorder,
                  borderWidth: 1.5,
                }}
              >
                {/* Header */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    {getTypeBadge(req.type)}
                    {getStatusBadge(req.status)}
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    Course ID: {req.courseId}
                  </Text>
                </View>

                {/* Pre-flight Quality Checklist */}
                {req.checklist && (
                  <View
                    style={{
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      borderRadius: 14,
                      padding: 12,
                      marginBottom: 14,
                      gap: 6,
                    }}
                  >
                    <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>
                      Automated Quality Verification:
                    </Text>
                    <View className="flex-row flex-wrap gap-4 pt-1">
                      <Text style={{ color: req.checklist.enFaComplete ? colors.success : colors.danger, fontSize: 12, fontWeight: '700' }}>
                        {req.checklist.enFaComplete ? '✓' : '✗'} Bilingual Complete (EN+FA)
                      </Text>
                      <Text style={{ color: req.checklist.validYouTube ? colors.success : colors.danger, fontSize: 12, fontWeight: '700' }}>
                        {req.checklist.validYouTube ? '✓' : '✗'} YouTube Stream Valid
                      </Text>
                      <Text style={{ color: req.checklist.allLessonsHaveQuiz ? colors.success : colors.danger, fontSize: 12, fontWeight: '700' }}>
                        {req.checklist.allLessonsHaveQuiz ? '✓' : '✗'} Lesson Quizzes
                      </Text>
                      <Text style={{ color: req.checklist.finalExamPoolValid ? colors.success : colors.danger, fontSize: 12, fontWeight: '700' }}>
                        {req.checklist.finalExamPoolValid ? '✓' : '✗'} Exam Pool
                      </Text>
                    </View>
                  </View>
                )}

                {/* Discussion Thread */}
                {req.comments && req.comments.length > 0 && (
                  <View className="gap-2 mb-4">
                    <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                      Comments & Communication:
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
                            {c.authorRole === 'admin' ? '🛡️ Admin' : '👨‍🏫 Instructor'} ({c.authorName})
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

                {/* Comment Reply Form */}
                {activeCommentReqId === req.id ? (
                  <View style={{ borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: 10, marginBottom: 12 }}>
                    <Input
                      label="Add Comment to Discussion"
                      placeholder="Type feedback, suggestions, or questions for instructor..."
                      value={newCommentText}
                      onChangeText={setNewCommentText}
                      multiline
                      numberOfLines={2}
                    />
                    <View className="flex-row justify-end gap-2 mt-2">
                      <Button
                        title="Cancel"
                        variant="secondary"
                        onPress={() => {
                          setActiveCommentReqId(null);
                          setNewCommentText('');
                        }}
                      />
                      <Button
                        title={sendCommentMutation.isPending ? 'Sending...' : 'Post Comment'}
                        onPress={() => req.id && sendCommentMutation.mutate(req.id)}
                        loading={sendCommentMutation.isPending}
                        disabled={!newCommentText.trim()}
                      />
                    </View>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-between pt-1 pb-3">
                    <TouchableOpacity
                      onPress={() => router.push(`/admin/courses/${req.courseId}` as any)}
                    >
                      <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 12 }}>
                        🔍 Inspect Course Content in Studio →
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        if (req.id) setActiveCommentReqId(req.id);
                        setNewCommentText('');
                      }}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                      }}
                    >
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>
                        💬 Add Comment
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Decision Actions */}
                <View className="flex-row flex-wrap justify-end gap-2 pt-2 border-t border-slate-700/50">
                  {req.status !== 'approved' && (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedReq(req);
                        setDecisionType('approve');
                        setDecisionComment('');
                      }}
                      style={{
                        backgroundColor: colors.success,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                        ✓ {req.type === 'revision' ? 'Approve & Merge Revision' : 'Approve & Publish Live'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {req.status === 'pending' && (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedReq(req);
                        setDecisionType('request_changes');
                        setDecisionComment('');
                      }}
                      style={{
                        backgroundColor: '#F59E0B',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                        ✏️ Request Changes
                      </Text>
                    </TouchableOpacity>
                  )}

                  {req.status !== 'rejected' && (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedReq(req);
                        setDecisionType('reject');
                        setDecisionComment('');
                      }}
                      style={{
                        backgroundColor: isDark ? '#334155' : '#E2E8F0',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: colors.danger, fontWeight: '800', fontSize: 12 }}>
                        ✕ Reject
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Modal: Decision Confirm */}
        <Modal
          visible={!!selectedReq}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedReq(null)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 16,
            }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 24,
                width: '100%',
                maxWidth: 500,
                padding: 24,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 6 }}>
                {decisionType === 'approve'
                  ? selectedReq?.type === 'revision' ? 'Approve & Merge Draft Revision' : 'Approve & Publish Course'
                  : decisionType === 'request_changes'
                  ? 'Request Revisions from Instructor'
                  : 'Reject Course Submission'}
              </Text>

              <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 16, lineHeight: 18 }}>
                {decisionType === 'approve' && selectedReq?.type === 'revision'
                  ? 'Approving will trigger an atomic batched merge copying all updated modules, lessons, and quizzes from the draft to the live course, making changes immediately visible to enrolled students.'
                  : decisionType === 'approve'
                  ? 'Approving will change course status to published, listing it in the student catalog.'
                  : decisionType === 'request_changes'
                  ? 'Explain what the instructor needs to modify before this course can be approved.'
                  : 'Specify why this submission is rejected.'}
              </Text>

              <Input
                label="Review Note / Feedback (Optional for approve, required for changes)"
                placeholder="Add explanation or comments for instructor..."
                value={decisionComment}
                onChangeText={setDecisionComment}
                multiline
                numberOfLines={3}
              />

              <View className="flex-row justify-end gap-3 mt-4">
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setSelectedReq(null)}
                />
                <Button
                  title={reviewMutation.isPending ? 'Executing...' : 'Confirm Decision'}
                  variant={decisionType === 'approve' ? 'primary' : 'danger'}
                  onPress={() => reviewMutation.mutate()}
                  loading={reviewMutation.isPending}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}
