import React, { useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { Badge } from '../../../src/components/ui/Badge';
import { useTheme } from '../../../src/features/theme/ThemeContext';
import { InstructorApplication } from '../../../src/types/instructor';
import {
  getPendingApplications,
  adminReviewApplicationCallable,
  adminSuspendInstructorCallable,
} from '../../../src/features/instructor/instructorApi';

export default function AdminInstructorApplicationsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isPersian = i18n.language?.startsWith('fa');

  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'changes_requested' | 'rejected'>('pending');

  // Decision Modal State
  const [selectedApp, setSelectedApp] = useState<InstructorApplication | null>(null);
  const [decisionType, setDecisionType] = useState<'approved' | 'changes_requested' | 'rejected' | 'suspend'>('approved');
  const [decisionReason, setDecisionReason] = useState('');

  const { data: applications = [], isLoading, refetch } = useQuery({
    queryKey: ['adminInstructorApplications'],
    queryFn: getPendingApplications,
  });

  const filteredApps = applications.filter((app) => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedApp) return;
      if (decisionType === 'suspend') {
        return await adminSuspendInstructorCallable(selectedApp.uid, decisionReason.trim());
      }
      return await adminReviewApplicationCallable({
        applicationUid: selectedApp.uid,
        decision: decisionType,
        rejectionReason: decisionReason.trim() || undefined,
      });
    },
    onSuccess: () => {
      setSelectedApp(null);
      setDecisionReason('');
      queryClient.invalidateQueries({ queryKey: ['adminInstructorApplications'] });
      Alert.alert('Decision Recorded', 'The application decision was processed successfully.');
      refetch();
    },
    onError: (err: any) => {
      Alert.alert('Action Error', err?.message || 'Failed to record decision');
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
            {isPersian ? 'صف متقاضیان مربی‌گری' : 'Instructor Applications Queue'}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
            {isPersian
              ? 'بررسی صلاحیت‌های علمی، اعطای دسترسی به استودیوی مربیان و مدیریت تعلیق حساب‌ها'
              : 'Review instructor applications, grant custom claims, request info, or suspend instructors'}
          </Text>
        </View>

        {/* Filter Pills */}
        <View className="flex-row flex-wrap gap-2 mb-6">
          {[
            { id: 'pending', label: 'Pending Review' },
            { id: 'approved', label: 'Approved Instructors' },
            { id: 'changes_requested', label: 'Changes Requested' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'all', label: 'All Applications' },
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
                  {f.label} ({applications.filter((a) => (f.id === 'all' ? true : a.status === f.id)).length})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Applications List */}
        {isLoading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : filteredApps.length === 0 ? (
          <Card style={{ padding: 32, alignItems: 'center', borderRadius: 20 }}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>👨‍🏫</Text>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>
              No applications match this filter
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
              When students apply to become instructors, they will appear here.
            </Text>
          </Card>
        ) : (
          <View className="gap-5">
            {filteredApps.map((app) => (
              <Card
                key={app.uid}
                style={{
                  padding: 20,
                  borderRadius: 20,
                  borderColor: app.status === 'pending' ? colors.goldBorder : colors.cardBorder,
                  borderWidth: 1.5,
                }}
              >
                {/* Header Info */}
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <View className="flex-row items-center gap-2">
                      <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>
                        {app.nameEn}
                      </Text>
                      {app.nameFa && (
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                          • {app.nameFa}
                        </Text>
                      )}
                    </View>
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                      {app.email} • UID: {app.uid.slice(0, 10)}...
                    </Text>
                  </View>

                  {getStatusBadge(app.status)}
                </View>

                {/* Bio & Details */}
                <View
                  style={{
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 14,
                    gap: 8,
                  }}
                >
                  <View>
                    <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>
                      Professional Bio:
                    </Text>
                    <Text style={{ color: colors.text, fontSize: 13, marginTop: 2, lineHeight: 18 }}>
                      {app.bio}
                    </Text>
                  </View>

                  <View className="flex-row flex-wrap gap-4 pt-2">
                    <View>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                        Expertise Areas:
                      </Text>
                      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>
                        {app.expertise?.join(', ')}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                        Teaching Languages:
                      </Text>
                      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>
                        {app.teachingLanguages?.join(', ').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {app.sampleCourseIdea && (
                    <View className="pt-2">
                      <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>
                        Proposed Course Idea:
                      </Text>
                      <Text style={{ color: colors.text, fontSize: 13, marginTop: 2, lineHeight: 18 }}>
                        {app.sampleCourseIdea}
                      </Text>
                    </View>
                  )}

                  {/* External links */}
                  <View className="flex-row flex-wrap gap-3 pt-2">
                    {app.portfolioLinks?.[0] && (
                      <TouchableOpacity onPress={() => Linking.openURL(app.portfolioLinks[0])}>
                        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>
                          🔗 Portfolio / LinkedIn ↗
                        </Text>
                      </TouchableOpacity>
                    )}
                    {app.youtubeChannel && (
                      <TouchableOpacity onPress={() => Linking.openURL(app.youtubeChannel!)}>
                        <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '700' }}>
                          ▶ YouTube Channel ↗
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {app.rejectionReason && (
                    <View className="pt-2 border-t border-slate-700/50">
                      <Text style={{ color: colors.danger, fontSize: 11, fontWeight: '800' }}>
                        Admin Feedback Note:
                      </Text>
                      <Text style={{ color: colors.text, fontSize: 12, marginTop: 2 }}>
                        {app.rejectionReason}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View className="flex-row flex-wrap justify-end gap-2">
                  {app.status !== 'approved' && (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedApp(app);
                        setDecisionType('approved');
                        setDecisionReason('');
                      }}
                      style={{
                        backgroundColor: colors.success,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                        ✓ Approve Application
                      </Text>
                    </TouchableOpacity>
                  )}

                  {app.status === 'pending' && (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedApp(app);
                        setDecisionType('changes_requested');
                        setDecisionReason('');
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

                  {app.status !== 'rejected' && (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedApp(app);
                        setDecisionType('rejected');
                        setDecisionReason('');
                      }}
                      style={{
                        backgroundColor: isDark ? '#334155' : '#E2E8F0',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: colors.danger, fontWeight: '800', fontSize: 12 }}>
                        ✕ Reject (30-day cooldown)
                      </Text>
                    </TouchableOpacity>
                  )}

                  {app.status === 'approved' && (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedApp(app);
                        setDecisionType('suspend');
                        setDecisionReason('');
                      }}
                      style={{
                        backgroundColor: colors.dangerBg,
                        borderColor: colors.danger,
                        borderWidth: 1,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: colors.danger, fontWeight: '800', fontSize: 12 }}>
                        🛑 Suspend Instructor
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
          visible={!!selectedApp}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedApp(null)}
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
                {decisionType === 'approved'
                  ? 'Approve Instructor Application'
                  : decisionType === 'changes_requested'
                  ? 'Request Changes from Applicant'
                  : decisionType === 'suspend'
                  ? 'Suspend Instructor Role'
                  : 'Reject Application'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 16, lineHeight: 18 }}>
                {decisionType === 'approved'
                  ? `This will assign the 'instructor' custom claim to ${selectedApp?.nameEn} and grant immediate access to the Instructor Studio.`
                  : decisionType === 'changes_requested'
                  ? `Provide specific instructions for ${selectedApp?.nameEn} so they can update their application.`
                  : decisionType === 'suspend'
                  ? `This will revoke ${selectedApp?.nameEn}'s instructor privileges and revert them to a regular student account.`
                  : `Rejecting will initiate a 30-day cooldown before ${selectedApp?.nameEn} can re-apply.`}
              </Text>

              {decisionType !== 'approved' && (
                <Input
                  label="Feedback / Reason Note (Required)"
                  placeholder="State the reason or required modifications..."
                  value={decisionReason}
                  onChangeText={setDecisionReason}
                  multiline
                  numberOfLines={3}
                />
              )}

              <View className="flex-row justify-end gap-3 mt-4">
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setSelectedApp(null)}
                />
                <Button
                  title={reviewMutation.isPending ? 'Processing...' : 'Confirm Decision'}
                  variant={decisionType === 'approved' ? 'primary' : 'danger'}
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
