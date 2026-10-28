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
import { SchoolTeacherApplication } from '../../../src/types/schoolTeacher';
import {
  getSchoolTeacherApplications,
  updateSchoolTeacherApplicationStatus,
} from '../../../src/features/school/schoolTeacherApi';

export default function AdminSchoolTeacherApplicationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');

  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Approval state for selected application
  const [approvedGradesState, setApprovedGradesState] = useState<Record<string, number[]>>({});
  const [adminNotesState, setAdminNotesState] = useState<Record<string, string>>({});

  const { data: applications = [], isLoading, refetch } = useQuery({
    queryKey: ['adminSchoolTeacherApplications'],
    queryFn: getSchoolTeacherApplications,
  });

  const filteredApps = applications.filter((app) => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });

  const toggleGradeForApp = (appId: string, grade: number, defaultGrades: number[]) => {
    const current = approvedGradesState[appId] || defaultGrades || [7, 8];
    const updated = current.includes(grade)
      ? current.filter((g) => g !== grade)
      : [...current, grade].sort((a, b) => a - b);
    setApprovedGradesState({ ...approvedGradesState, [appId]: updated });
  };

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      approvedGrades,
      adminNotes,
      userId,
    }: {
      id: string;
      status: SchoolTeacherApplication['status'];
      approvedGrades?: number[];
      adminNotes?: string;
      userId?: string;
    }) => {
      await updateSchoolTeacherApplicationStatus(id, status, approvedGrades, adminNotes, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSchoolTeacherApplications'] });
      refetch();
      const msg = isPersian ? 'وضعیت متقاضی تدریس با موفقیت به‌روزرسانی شد.' : 'Teacher application updated successfully.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert(isPersian ? 'موفقیت' : 'Success', msg);
      }
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message || 'Failed to update application');
    },
  });

  const getStatusBadge = (status: SchoolTeacherApplication['status']) => {
    switch (status) {
      case 'approved':
        return <Badge label="APPROVED" variant="success" />;
      case 'reviewing':
        return <Badge label="UNDER REVIEW" variant="warning" />;
      case 'rejected':
        return <Badge label="REJECTED" variant="danger" />;
      case 'need_info':
        return <Badge label="NEED INFO" variant="warning" />;
      case 'pending':
      default:
        return <Badge label="PENDING" variant="warning" />;
    }
  };

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

        {/* Header Title */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Text style={{ fontSize: 28 }}>👩‍🏫</Text>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900', textAlign: isPersian ? 'right' : 'left' }}>
              {isPersian ? 'مدیریت متقاضیان تدریس مکتب دختران' : 'Girls Online School Teacher Applications'}
            </Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: isPersian ? 'right' : 'left' }}>
            {isPersian
              ? `بررسی اسناد و سوابق تدریس در مکاتب دخترانه و اعطای صلاحیت تدریس در صنوف مجاز (${applications.length} متقاضی)`
              : `Review girls' school credentials and assign authorized teaching grades (${applications.length} applicants)`}
          </Text>
        </View>

        {/* Filter Tabs */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {[
            { id: 'pending', label: isPersian ? 'در انتظار بررسی' : 'Pending' },
            { id: 'approved', label: isPersian ? 'پذیرفته شده' : 'Approved' },
            { id: 'reviewing', label: isPersian ? 'در حال بررسی' : 'Reviewing' },
            { id: 'need_info', label: isPersian ? 'نیازمند اسناد' : 'Need Info' },
            { id: 'rejected', label: isPersian ? 'رد شده' : 'Rejected' },
            { id: 'all', label: isPersian ? 'همه متقاضیان' : 'All' },
          ].map((st) => {
            const isSelected = statusFilter === st.id;
            return (
              <TouchableOpacity
                key={st.id}
                onPress={() => setStatusFilter(st.id)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: isSelected ? colors.gold : colors.card,
                  borderColor: isSelected ? colors.gold : colors.cardBorder,
                  borderWidth: 1,
                }}
              >
                <Text
                  style={{
                    color: isSelected ? (isDark ? '#0F172A' : '#FFFFFF') : colors.textSecondary,
                    fontWeight: '800',
                    fontSize: 12,
                  }}
                >
                  {st.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Applications List */}
        {isLoading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : filteredApps.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center', backgroundColor: colors.card, borderRadius: 20 }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>📋</Text>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>
              {isPersian ? 'هیچ درخواستی در این بخش موجود نیست' : 'No applications found'}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {filteredApps.map((app) => {
              const isExpanded = expandedId === app.id;
              const currentGrades = approvedGradesState[app.id!] || app.approvedGrades || app.requestedGrades || [7, 8];
              const notes = adminNotesState[app.id!] ?? (app.adminNotes || '');

              return (
                <Card key={app.id} className="p-5 border-surface-border bg-surface-card">
                  {/* Top Summary */}
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
                        <Text style={{ color: colors.text, fontSize: 17, fontWeight: '900' }}>
                          {app.fullName}
                        </Text>
                        {getStatusBadge(app.status)}
                      </View>

                      <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '700', textAlign: isPersian ? 'right' : 'left' }}>
                        {app.fieldOfStudy} • {app.province} • {app.phone}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? 'کد رهگیری: ' : 'Ref: '}{app.referenceNumber} • {app.email}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => setExpandedId(isExpanded ? null : app.id!)}
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
                        {isExpanded ? (isPersian ? 'بستن جزئیات ▲' : 'Close ▲') : (isPersian ? 'بررسی سوابق مکتب ▼' : 'Review Credentials ▼')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Highlight: Girls' School Teaching Experience (INSISTED ON) */}
                  <View
                    style={{
                      backgroundColor: isDark ? 'rgba(234, 179, 8, 0.1)' : '#FEF3C7',
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(234, 179, 8, 0.3)',
                      marginBottom: 10,
                    }}
                  >
                    <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Text style={{ fontSize: 16 }}>⭐</Text>
                      <Text style={{ color: '#F59E0B', fontWeight: '900', fontSize: 12.5 }}>
                        {isPersian ? 'سابقه تدریس در مکتب دخترانه (اعتبارسنجی):' : 'Girls’ School Experience:'}
                      </Text>
                      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 12.5 }}>
                        {app.girlsSchoolName}
                      </Text>
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? `مدت زمان: ${app.yearsOfExperience} سال • مضامین تدریس شده: ${app.pastSubjectsTaught}` : `${app.yearsOfExperience} years experience • Subjects: ${app.pastSubjectsTaught}`}
                    </Text>
                  </View>

                  {/* Expanded Detail Panel */}
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
                      {/* Detailed Description */}
                      <View>
                        <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '800', marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                          {isPersian ? 'شرح تجارب و سوابق تدریس مکتب:' : 'Teaching Experience Details:'}
                        </Text>
                        <Text style={{ color: colors.text, fontSize: 12.5, lineHeight: 20, textAlign: isPersian ? 'right' : 'left' }}>
                          {app.experienceDetails}
                        </Text>
                      </View>

                      {app.motivationStatement ? (
                        <View>
                          <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '800', marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                            {isPersian ? 'انگیزه‌نامه و آمادگی تدریس مجازی:' : 'Motivation & Statement:'}
                          </Text>
                          <Text style={{ color: colors.text, fontSize: 12.5, lineHeight: 20, textAlign: isPersian ? 'right' : 'left' }}>
                            {app.motivationStatement}
                          </Text>
                        </View>
                      ) : null}

                      {/* Grade Authorization Manager (Admin specifies allowed grades!) */}
                      <View
                        style={{
                          backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                          padding: 14,
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                        }}
                      >
                        <Text style={{ color: colors.gold, fontSize: 13, fontWeight: '900', marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                          {isPersian ? 'صنوف مجاز برای اعطای صلاحیت تدریس:' : 'Authorized Teaching Grades to Assign:'}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 10, textAlign: isPersian ? 'right' : 'left' }}>
                          {isPersian
                            ? 'آموزگار تنها در صنوف علامت‌زده شده زیر دسترسی ایجاد و ویرایش درس‌های مکتب را خواهد داشت.'
                            : 'The teacher will ONLY be able to create lessons in the grades checked below.'}
                        </Text>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {[7, 8, 9, 10, 11, 12].map((g) => {
                            const isChecked = currentGrades.includes(g);
                            return (
                              <TouchableOpacity
                                key={g}
                                onPress={() => toggleGradeForApp(app.id!, g, app.requestedGrades || [7, 8])}
                                style={{
                                  paddingHorizontal: 14,
                                  paddingVertical: 8,
                                  borderRadius: 10,
                                  backgroundColor: isChecked ? '#3B82F6' : (isDark ? '#0F172A' : '#FFFFFF'),
                                  borderWidth: 1,
                                  borderColor: isChecked ? '#3B82F6' : colors.cardBorder,
                                }}
                              >
                                <Text style={{ color: isChecked ? '#FFFFFF' : colors.text, fontWeight: '800', fontSize: 12 }}>
                                  {isChecked ? '✓ ' : ''}
                                  {isPersian ? `صنف ${g}` : `Grade ${g}`}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {/* Admin Notes */}
                      <View>
                        <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                          {isPersian ? 'یادداشت یا توضیحات ادمین:' : 'Admin Notes:'}
                        </Text>
                        <TextInput
                          value={notes}
                          onChangeText={(txt) => setAdminNotesState({ ...adminNotesState, [app.id!]: txt })}
                          placeholder={isPersian ? 'توضیحات تایید، شرایط یا مدارک مورد نیاز...' : 'Notes...'}
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

                      {/* Decision Buttons */}
                      <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', gap: 10, marginTop: 4 }}>
                        <TouchableOpacity
                          onPress={() =>
                            updateMutation.mutate({
                              id: app.id!,
                              status: 'approved',
                              approvedGrades: currentGrades,
                              adminNotes: notes,
                              userId: app.userId,
                            })
                          }
                          disabled={updateMutation.isPending}
                          style={{
                            flex: 1,
                            backgroundColor: '#10B981',
                            paddingVertical: 10,
                            borderRadius: 10,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>
                            ✓ {isPersian ? 'تایید و اعطای صلاحیت تدریس' : 'Approve & Assign Grades'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            updateMutation.mutate({
                              id: app.id!,
                              status: 'need_info',
                              adminNotes: notes,
                              userId: app.userId,
                            })
                          }
                          disabled={updateMutation.isPending}
                          style={{
                            backgroundColor: '#F59E0B',
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 10,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>
                            ⚠️ {isPersian ? 'نیازمند مدارک' : 'Need Info'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            updateMutation.mutate({
                              id: app.id!,
                              status: 'rejected',
                              adminNotes: notes,
                              userId: app.userId,
                            })
                          }
                          disabled={updateMutation.isPending}
                          style={{
                            backgroundColor: '#EF4444',
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 10,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>
                            ✕ {isPersian ? 'رد' : 'Reject'}
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
