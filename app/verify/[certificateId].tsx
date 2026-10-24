import React, { useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { AppLogo } from '../../src/components/ui/AppLogo';
import { CertificateViewer } from '../../src/components/CertificateViewer';
import { useTheme } from '../../src/features/theme/ThemeContext';
import { verifyCertificateCallable } from '../../src/features/certificates/certificatesApi';

export default function VerifyCertificateScreen() {
  const { certificateId } = useLocalSearchParams<{ certificateId: string }>();
  const { colors, isDark } = useTheme();
  const [lang, setLang] = useState<'en' | 'fa'>('en');
  const isPersian = lang === 'fa';

  const { data: cert, isLoading, error } = useQuery({
    queryKey: ['verifyCertificate', certificateId],
    queryFn: () => verifyCertificateCallable(certificateId!),
    enabled: !!certificateId,
    retry: 1,
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 13 }}>
          Verifying certificate authenticity...
        </Text>
      </View>
    );
  }

  if (error || !cert) {
    return (
      <ScreenWrapper>
        <View className="max-w-xl w-full self-center my-auto p-4">
          <Card className="border-red-800 bg-red-950/60 p-6">
            <View className="flex-row items-center gap-3 mb-3">
              <Text style={{ fontSize: 28 }}>✕</Text>
              <Text className="text-2xl font-bold text-red-400">
                {isPersian ? 'گواهینامه نامعتبر است' : 'Invalid Certificate'}
              </Text>
            </View>
            <Text className="text-slate-300 text-sm leading-6 mb-4">
              {isPersian
                ? `شناسه گواهینامه درخواستی (${certificateId}) در سوابق سیستم ثبت نشده یا نامعتبر می‌باشد.`
                : `The requested certificate ID (${certificateId}) could not be verified or does not exist in the official records.`}
            </Text>
            <TouchableOpacity
              onPress={() => setLang(isPersian ? 'en' : 'fa')}
              style={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(255,255,255,0.1)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: colors.gold, fontSize: 12, fontWeight: 'bold' }}>
                {isPersian ? 'Switch to English' : 'تغییر به فارسی'}
              </Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScreenWrapper>
    );
  }

  const isRevoked = cert.revoked === true || !cert.valid;

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ paddingVertical: 24 }} className="max-w-3xl w-full self-center px-4">
        {/* Top Header with Language Switcher */}
        <View className="flex-row justify-between items-center mb-6">
          <AppLogo size={42} />
          <TouchableOpacity
            onPress={() => setLang(isPersian ? 'en' : 'fa')}
            style={{
              backgroundColor: isDark ? 'rgba(30,41,59,0.8)' : '#F1F5F9',
              borderColor: colors.cardBorder,
              borderWidth: 1,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 14 }}>🌐</Text>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: 'bold' }}>
              {isPersian ? 'English Version' : 'نسخه فارسی'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Verification Card */}
        <Card
          style={{
            borderColor: isRevoked ? '#EF4444' : colors.gold,
            borderWidth: 2,
            backgroundColor: isDark ? 'rgba(15,23,42,0.85)' : '#FFFFFF',
          }}
          className="p-6 md:p-8"
        >
          {/* Header Bar */}
          <View className="flex-row justify-between items-start mb-6 pb-4 border-b border-slate-700/40">
            <View className="flex-1 mr-3">
              <Text style={{ color: colors.gold }} className="text-xs font-bold uppercase tracking-wider mb-1">
                {isPersian ? 'سیستم استعلام رسمی FARUKH.ORG و AECCI' : 'Official Verification System • FARUKH.ORG & AECCI'}
              </Text>
              <Text style={{ color: colors.text }} className="text-2xl font-bold">
                {isPersian ? 'تاییدیه اصالت گواهینامه' : 'Certificate of Achievement'}
              </Text>
            </View>
            <Badge
              label={isRevoked ? (isPersian ? 'باطل شده / REVOKED' : 'REVOKED') : (isPersian ? 'معتبر و تایید شده ✓' : 'OFFICIALLY VERIFIED ✓')}
              variant={isRevoked ? 'danger' : 'success'}
            />
          </View>

          {/* Revocation Alert if revoked */}
          {isRevoked && (
            <View className="bg-red-950/60 border border-red-700 p-4 rounded-xl mb-6 flex-row items-center gap-3">
              <Text style={{ fontSize: 24 }}>⚠️</Text>
              <View className="flex-1">
                <Text className="text-red-300 font-bold text-sm">
                  {isPersian ? 'این گواهینامه باطل گردیده است' : 'This Certificate Has Been Revoked'}
                </Text>
                <Text className="text-slate-300 text-xs mt-1">
                  {cert.revokedReason || (isPersian ? 'این مدرک از درجه اعتبار ساقط می‌باشد.' : 'This credential is no longer valid.')}
                </Text>
              </View>
            </View>
          )}

          {/* Public Snapshot Fields (Only Names, Course, Date, ID) */}
          <View className="space-y-4 mb-6">
            {/* Student Name */}
            <View
              style={{
                backgroundColor: isDark ? 'rgba(30,41,59,0.5)' : '#F8FAFC',
                borderColor: colors.cardBorder,
                borderWidth: 1,
                borderRadius: 14,
                padding: 14,
              }}
            >
              <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-1">
                {isPersian ? 'نام و تخلص صاحب گواهینامه (دانشجو)' : 'Certified Student (Recipient)'}
              </Text>
              <View className="flex-row justify-between items-center">
                <Text style={{ color: colors.text }} className="text-lg font-bold">
                  {cert.nameEn}
                </Text>
                {cert.nameFa ? (
                  <Text style={{ color: colors.gold, writingDirection: 'rtl', textAlign: 'right' }} className="text-lg font-bold">
                    {cert.nameFa}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Course Title */}
            <View
              style={{
                backgroundColor: isDark ? 'rgba(30,41,59,0.5)' : '#F8FAFC',
                borderColor: colors.cardBorder,
                borderWidth: 1,
                borderRadius: 14,
                padding: 14,
              }}
            >
              <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-1">
                {isPersian ? 'دوره آموزشی به پایان رسیده' : 'Completed Course'}
              </Text>
              <Text style={{ color: colors.text }} className="text-lg font-bold">
                {cert.courseTitleEn}
              </Text>
              {cert.courseTitleFa && cert.courseTitleFa !== cert.courseTitleEn ? (
                <Text style={{ color: colors.gold, writingDirection: 'rtl', textAlign: 'right' }} className="text-base font-semibold mt-0.5">
                  {cert.courseTitleFa}
                </Text>
              ) : null}
            </View>

            {/* Dates & Certificate ID Grid */}
            <View className="flex-row flex-wrap gap-3 pt-2">
              <View
                style={{
                  flex: 1,
                  minWidth: 140,
                  backgroundColor: isDark ? 'rgba(30,41,59,0.5)' : '#F8FAFC',
                  borderColor: colors.cardBorder,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold">
                  {isPersian ? 'تاریخ صدور میلادی' : 'Date (Gregorian)'}
                </Text>
                <Text style={{ color: colors.text }} className="text-sm font-bold mt-1">
                  {cert.dateGregorian || 'Official Date'}
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  minWidth: 140,
                  backgroundColor: isDark ? 'rgba(30,41,59,0.5)' : '#F8FAFC',
                  borderColor: colors.cardBorder,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold text-right">
                  {isPersian ? 'تاریخ خورشیدی (جلالی)' : 'Date (Solar Hijri)'}
                </Text>
                <Text style={{ color: colors.gold, writingDirection: 'rtl', textAlign: 'right' }} className="text-sm font-bold mt-1 text-right">
                  {cert.dateJalali || '—'}
                </Text>
              </View>

              <View
                style={{
                  width: '100%',
                  backgroundColor: isDark ? 'rgba(30,41,59,0.5)' : '#F8FAFC',
                  borderColor: colors.cardBorder,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold">
                  {isPersian ? 'شناسه یکتا و غیرقابل جعل گواهینامه' : 'Unguessable Unique Certificate ID'}
                </Text>
                <Text style={{ color: colors.text }} className="text-sm font-mono font-bold mt-1">
                  {cert.certificateId}
                </Text>
              </View>
            </View>
          </View>

          {/* Visual Certificate Graphic with Official Template & Black QR Code */}
          <CertificateViewer certificate={cert} />

          {/* Accreditation Footer */}
          <View
            style={{
              backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : '#F1F5F9',
              borderColor: colors.cardBorder,
              borderWidth: 1,
              borderRadius: 14,
              padding: 14,
              marginBottom: 16,
            }}
            className="flex-row items-center gap-3"
          >
            <Text style={{ fontSize: 24 }}>🏛️</Text>
            <View className="flex-1">
              <Text style={{ color: colors.text }} className="text-xs font-bold">
                {isPersian
                  ? 'اعتباردهی شده توسط اتاق تجارت و سرمایه‌گذاری افغانستان در اروپا (AECCI)'
                  : 'Accredited by Afghanistan Europe Chamber of Commerce & Investment (AECCI)'}
              </Text>
              <Text style={{ color: colors.textMuted }} className="text-xs mt-0.5">
                BCE 1029334636 • FARUKH.ORG Global Education Platform
              </Text>
            </View>
          </View>

          {Platform.OS === 'web' && (
            <TouchableOpacity
              onPress={() => window.print()}
              style={{
                backgroundColor: colors.gold,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#0F172A', fontWeight: 'bold', fontSize: 14 }}>
                {isPersian ? 'چاپ یا دریافت نسخه رسمی گواهینامه 🖨️' : 'Print / Download Official Certificate 🖨️'}
              </Text>
            </TouchableOpacity>
          )}
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}
