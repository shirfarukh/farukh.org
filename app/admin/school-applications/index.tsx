import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/features/theme/ThemeContext';
import {
  getSchoolApplications,
  updateSchoolApplicationStatus,
} from '../../../src/features/school/schoolApplicationApi';
import { SchoolApplication } from '../../../src/types/schoolApplication';

export default function AdminSchoolApplicationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');

  const [selectedGradeFilter, setSelectedGradeFilter] = useState<number | 'all'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  const { data: applications = [], isLoading, refetch } = useQuery({
    queryKey: ['adminSchoolApplications'],
    queryFn: getSchoolApplications,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      userId,
      targetGrade,
    }: {
      id: string;
      status: SchoolApplication['status'];
      userId?: string;
      targetGrade?: number;
    }) => {
      await updateSchoolApplicationStatus(id, status, undefined, userId, targetGrade);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSchoolApplications'] });
      const msg = isPersian ? 'وضعیت درخواست با موفقیت به‌روزرسانی شد و دسترسی به مواد صنف اعطا گردید.' : 'Application status updated and grade access granted.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert(isPersian ? 'موفقیت' : 'Success', msg);
      }
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to update status';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Error', msg);
      }
    },
  });

  const filteredApps = applications.filter((app) => {
    if (selectedGradeFilter !== 'all' && app.targetGrade !== selectedGradeFilter) return false;
    if (selectedStatusFilter !== 'all' && app.status !== selectedStatusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: SchoolApplication['status']) => {
    switch (status) {
      case 'accepted':
        return { label: isPersian ? 'پذیرفته شده' : 'Accepted', bg: 'rgba(34, 197, 94, 0.15)', text: '#22C55E' };
      case 'reviewing':
        return { label: isPersian ? 'در حال بررسی' : 'Under Review', bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6' };
      case 'rejected':
        return { label: isPersian ? 'رد شده' : 'Declined', bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444' };
      case 'need_info':
        return { label: isPersian ? 'نیازمند اسناد' : 'Need Info', bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B' };
      default:
        return { label: isPersian ? 'در انتظار بررسی' : 'Pending', bg: 'rgba(234, 179, 8, 0.15)', text: '#EAB308' };
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingTop: Platform.OS === 'web' ? 24 : 60,
          paddingBottom: 80,
          maxWidth: 1000,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900' }}>
              {isPersian ? 'مدیریت درخواست‌های ثبت‌نام مکتب دختران' : 'Girl School Student Applications'}
            </Text>
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
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {isPersian
              ? `مجموع درخواست‌های ثبت‌شده: ${applications.length} مورد (صنوف ۷ تا ۱۲ - نصاب بین‌المللی آنلاین FOE)`
              : `Total applications received: ${applications.length} (Grades 7 to 12 - FOE Online Curriculum)`}
          </Text>
        </View>

        {/* Filter Pills */}
        <View style={{ marginBottom: 20, gap: 10 }}>
          {/* Grade Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {['all', 7, 8, 9, 10, 11, 12].map((g) => {
              const isSelected = selectedGradeFilter === g;
              return (
                <TouchableOpacity
                  key={String(g)}
                  onPress={() => setSelectedGradeFilter(g as any)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 10,
                    backgroundColor: isSelected ? colors.gold : colors.card,
                    borderColor: isSelected ? colors.gold : colors.cardBorder,
                    borderWidth: 1,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: isSelected ? (isDark ? '#0F172A' : '#FFFFFF') : colors.textSecondary, fontWeight: '800', fontSize: 12 }}>
                    {g === 'all' ? (isPersian ? 'همه صنوف' : 'All Grades') : (isPersian ? `صنف ${g}` : `Grade ${g}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Status Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {[
              { id: 'all', label: isPersian ? 'همه وضعیت‌ها' : 'All Statuses' },
              { id: 'pending', label: isPersian ? 'در انتظار' : 'Pending' },
              { id: 'reviewing', label: isPersian ? 'در حال بررسی' : 'Under Review' },
              { id: 'accepted', label: isPersian ? 'پذیرفته شده' : 'Accepted' },
              { id: 'need_info', label: isPersian ? 'نیازمند اسناد' : 'Need Info' },
              { id: 'rejected', label: isPersian ? 'رد شده' : 'Declined' },
            ].map((st) => {
              const isSelected = selectedStatusFilter === st.id;
              return (
                <TouchableOpacity
                  key={st.id}
                  onPress={() => setSelectedStatusFilter(st.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: isSelected ? colors.goldBg : colors.cardHover,
                    borderColor: isSelected ? colors.gold : colors.cardBorder,
                    borderWidth: 1,
                    marginRight: 6,
                  }}
                >
                  <Text style={{ color: isSelected ? colors.gold : colors.textSecondary, fontWeight: '700', fontSize: 11.5 }}>
                    {st.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Applications List */}
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : filteredApps.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 40,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Text style={{ fontSize: 44, marginBottom: 12 }}>📋</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 4 }}>
              {isPersian ? 'هیچ درخواستی با این فیلتر یافت نشد' : 'No Applications Found'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              {isPersian ? 'فیلترهای صنف یا وضعیت را تغییر دهید.' : 'Try adjusting the filters.'}
            </Text>
          </View>
        ) : (
          filteredApps.map((app) => {
            const isExpanded = expandedAppId === app.id;
            const badge = getStatusBadge(app.status);

            return (
              <View
                key={app.id}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  padding: 18,
                  marginBottom: 14,
                }}
              >
                {/* Header Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 11.5 }}>
                        {app.referenceNumber}
                      </Text>
                      <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ color: '#60A5FA', fontSize: 11, fontWeight: '800' }}>
                          🎓 {isPersian ? `صنف ${app.targetGrade}` : `Grade ${app.targetGrade}`}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>
                      {app.studentFullName}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {app.province} • {app.district}
                    </Text>
                  </View>

                  <View
                    style={{
                      backgroundColor: badge.bg,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: badge.text, fontWeight: '800', fontSize: 11.5 }}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {/* Quick Info Grid */}
                <View
                  style={{
                    backgroundColor: colors.cardHover,
                    borderRadius: 12,
                    padding: 12,
                    marginVertical: 8,
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 12,
                    justifyContent: 'space-between',
                  }}
                >
                  <View>
                    <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>{isPersian ? 'سرپرست:' : 'Guardian:'}</Text>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
                      {app.guardianFullName} ({app.guardianRelation})
                    </Text>
                  </View>

                  <View>
                    <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>{isPersian ? 'تماس سرپرست:' : 'Guardian Phone:'}</Text>
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${app.guardianPhone}`)}>
                      <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '800' }}>
                        📞 {app.guardianPhone}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View>
                    <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>{isPersian ? 'تاریخ تولد:' : 'DOB:'}</Text>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
                      {app.dateOfBirth}
                    </Text>
                  </View>

                  <View>
                    <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>{isPersian ? 'اسناد تحصیلی:' : 'Documents:'}</Text>
                    <Text style={{ color: app.hasDocumentsNow ? colors.success : colors.gold, fontSize: 12, fontWeight: '700' }}>
                      {app.hasDocumentsNow ? '✓ Available' : '⏳ Pending'}
                    </Text>
                  </View>
                </View>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={{ marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.cardBorder, gap: 8 }}>
                    {app.studentPhone && (
                      <Text style={{ color: colors.text, fontSize: 12 }}>
                        📱 <Text style={{ color: colors.textMuted }}>{isPersian ? 'تماس شاگرد:' : 'Student Phone:'}</Text> {app.studentPhone}
                      </Text>
                    )}
                    {app.studentEmail && (
                      <Text style={{ color: colors.text, fontSize: 12 }}>
                        ✉️ <Text style={{ color: colors.textMuted }}>{isPersian ? 'ایمیل:' : 'Email:'}</Text> {app.studentEmail}
                      </Text>
                    )}
                    {app.fatherName && (
                      <Text style={{ color: colors.text, fontSize: 12 }}>
                        👨 <Text style={{ color: colors.textMuted }}>{isPersian ? 'نام پدر:' : 'Father:'}</Text> {app.fatherName}
                      </Text>
                    )}
                    {app.previousSchoolName && (
                      <Text style={{ color: colors.text, fontSize: 12 }}>
                        🏫 <Text style={{ color: colors.textMuted }}>{isPersian ? 'مکتب قبلی:' : 'Previous School:'}</Text> {app.previousSchoolName} (Last completed: Grade {app.lastCompletedGrade})
                      </Text>
                    )}
                    <Text style={{ color: colors.text, fontSize: 12 }}>
                      🌐 <Text style={{ color: colors.textMuted }}>{isPersian ? 'زبان و انترنت:' : 'Lang & Internet:'}</Text> {app.primaryLanguage} • {app.internetAccess} • Device: {app.deviceType}
                    </Text>
                    {app.tazkiraUrl && (
                      <TouchableOpacity onPress={() => Linking.openURL(app.tazkiraUrl!)}>
                        <Text style={{ color: '#60A5FA', fontSize: 12, fontWeight: '700' }}>
                          📄 View Tazkira / ID: {app.tazkiraUrl}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {app.transcriptUrl && (
                      <TouchableOpacity onPress={() => Linking.openURL(app.transcriptUrl!)}>
                        <Text style={{ color: '#60A5FA', fontSize: 12, fontWeight: '700' }}>
                          📑 View Transcript: {app.transcriptUrl}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {app.documentNotes && (
                      <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontStyle: 'italic' }}>
                        Note: {app.documentNotes}
                      </Text>
                    )}
                  </View>
                )}

                {/* Footer Controls: Toggle Details & Change Status */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.cardBorder }}>
                  <TouchableOpacity onPress={() => setExpandedAppId(isExpanded ? null : app.id!)}>
                    <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 12 }}>
                      {isExpanded ? (isPersian ? '▲ بستن جزئیات' : '▲ Less') : (isPersian ? '▼ مشاهده کامل جزئیات' : '▼ Full Details')}
                    </Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() =>
                        updateStatusMutation.mutate({
                          id: app.id!,
                          status: 'accepted',
                          userId: app.userId,
                          targetGrade: app.targetGrade,
                        })
                      }
                      style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: '#22C55E', fontWeight: '800', fontSize: 11 }}>
                        ✓ {isPersian ? 'تأیید و اعطای دسترسی' : 'Approve & Grant Access'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => updateStatusMutation.mutate({ id: app.id!, status: 'need_info' })}
                      style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: 11 }}>
                        ⏳ {isPersian ? 'نیاز اسناد' : 'Need Info'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => updateStatusMutation.mutate({ id: app.id!, status: 'rejected' })}
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 11 }}>
                        ✗ {isPersian ? 'رد' : 'Decline'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
