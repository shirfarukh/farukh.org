import React from 'react';
import { View, Text, FlatList, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { useAuth } from '../../src/features/auth/useAuth';
import { useTheme } from '../../src/features/theme/ThemeContext';
import { getUserCertificates } from '../../src/features/certificates/certificatesApi';
import { formatDate } from '../../src/lib/utils';

export default function MyCertificatesScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['userCertificates', user?.uid],
    queryFn: () => getUserCertificates(user!.uid),
    enabled: !!user?.uid,
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  const storageBucket = Constants.expoConfig?.extra?.firebaseStorageBucket || 'farukh-org.firebasestorage.app';

  return (
    <ScreenWrapper scrollable={false}>
      <View className="max-w-4xl w-full self-center flex-1">
        <View className="mb-6">
          <Text style={{ color: colors.text }} className="text-2xl font-bold mb-1">
            {isPersian ? 'گواهینامه‌های رسمی من' : 'My Certificates'}
          </Text>
          <Text style={{ color: colors.textSecondary }} className="text-sm">
            {isPersian
              ? 'دانلود تصدیق‌نامه رسمی معتبر AECCI و مشاهده استعلام عمومی'
              : 'Download accredited course certificates and view public verification records'}
          </Text>
        </View>

        {certificates.length === 0 ? (
          <Card>
            <Text style={{ color: colors.text }} className="font-bold text-base mb-1">
              {isPersian ? 'تاکنون هیچ گواهینامه‌ای صادر نشده است' : 'No Certificates Issued Yet'}
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-sm">
              {isPersian
                ? 'تمام درس‌های یک دوره را تکمیل نموده و در امتحان نهایی حداقل ۸۰٪ کسب کنید تا تصدیق‌نامه رسمی شما صادر گردد.'
                : 'Complete all lessons in a course and score 80% or higher on the final exam to earn your certificate.'}
            </Text>
          </Card>
        ) : (
          <FlatList
            data={certificates}
            keyExtractor={(item) => item.certificateId || item.id!}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => {
              const certId = item.certificateId || item.id!;
              const pdfUrl = item.pdfPath
                ? `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(item.pdfPath)}?alt=media`
                : null;
              const jpgUrl = item.jpgPath
                ? `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(item.jpgPath)}?alt=media`
                : null;

              return (
                <Card
                  style={{
                    borderColor: item.revoked ? '#EF4444' : colors.cardBorder,
                    borderWidth: 1.5,
                  }}
                  className="mb-4"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 mr-2">
                      <Text style={{ color: colors.text }} className="text-xl font-bold">
                        {item.courseTitleEn || item.courseTitle}
                      </Text>
                      {item.courseTitleFa && item.courseTitleFa !== item.courseTitleEn ? (
                        <Text style={{ color: colors.gold, writingDirection: 'rtl', textAlign: 'right' }} className="text-sm font-semibold mt-0.5">
                          {item.courseTitleFa}
                        </Text>
                      ) : null}
                    </View>
                    <Badge
                      label={item.revoked ? (isPersian ? 'باطل شده' : 'REVOKED') : (isPersian ? 'معتبر و تایید شده ✓' : 'VERIFIED ✓')}
                      variant={item.revoked ? 'danger' : 'success'}
                    />
                  </View>

                  <View className="space-y-1 mb-3">
                    <Text style={{ color: colors.textSecondary }} className="text-sm">
                      {isPersian ? 'صاحب گواهینامه:' : 'Student:'}{' '}
                      <Text style={{ color: colors.text, fontWeight: '700' }}>
                        {item.nameEn || item.studentName}
                        {item.nameFa ? ` (${item.nameFa})` : ''}
                      </Text>
                    </Text>
                    <Text style={{ color: colors.textMuted }} className="text-xs">
                      Score: {item.scorePercent}% •{' '}
                      {item.dateGregorian || formatDate(item.issuedAt)}
                      {item.dateJalali ? ` / ${item.dateJalali}` : ''} • ID: {certId}
                    </Text>
                  </View>

                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: colors.cardBorder,
                      paddingTop: 12,
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    {pdfUrl && !item.revoked && (
                      <Button
                        title={isPersian ? 'دانلود PDF' : 'Download PDF'}
                        variant="primary"
                        onPress={() => Linking.openURL(pdfUrl)}
                      />
                    )}
                    {jpgUrl && !item.revoked && (
                      <Button
                        title={isPersian ? 'دانلود تصویر JPG' : 'Download JPG'}
                        variant="outline"
                        onPress={() => Linking.openURL(jpgUrl)}
                      />
                    )}
                    <Button
                      title={isPersian ? 'استعلام عمومی' : 'Public Verification'}
                      variant="secondary"
                      onPress={() => router.push(`/verify/${certId}` as any)}
                    />
                  </View>
                </Card>
              );
            }}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
