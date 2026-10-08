import React from 'react';
import { View, Text, FlatList, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
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
  const { colors } = useTheme();
  const router = useRouter();

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

  return (
    <ScreenWrapper scrollable={false}>
      <View className="max-w-4xl w-full self-center flex-1">
        <View className="mb-6">
          <Text style={{ color: colors.text }} className="text-2xl font-bold mb-1">My Certificates</Text>
          <Text style={{ color: colors.textSecondary }} className="text-sm">Download and verify your official course certificates</Text>
        </View>

        {certificates.length === 0 ? (
          <Card>
            <Text style={{ color: colors.text }} className="font-bold text-base mb-1">No Certificates Issued Yet</Text>
            <Text style={{ color: colors.textSecondary }} className="text-sm">
              Complete all lessons in a course and score 80% or higher on the final exam to earn your certificate.
            </Text>
          </Card>
        ) : (
          <FlatList
            data={certificates}
            keyExtractor={(item) => item.id!}
            renderItem={({ item }) => {
              const storageBucket = Constants.expoConfig?.extra?.firebaseStorageBucket || 'demo-learning-app.appspot.com';
              const storageUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(item.pdfPath)}?alt=media`;

              return (
                <Card>
                  <View className="flex-row justify-between items-start mb-2">
                    <Text style={{ color: colors.text }} className="text-xl font-bold flex-1 mr-2">{item.courseTitle}</Text>
                    <Badge label={item.revoked ? 'REVOKED' : 'VERIFIED'} variant={item.revoked ? 'danger' : 'success'} />
                  </View>

                  <Text style={{ color: colors.textSecondary }} className="text-sm mb-1">
                    Student: <Text style={{ color: colors.text, fontWeight: '700' }}>{item.studentName}</Text>
                  </Text>
                  <Text style={{ color: colors.textMuted }} className="text-xs mb-4">
                    Score: {item.scorePercent}%  •  Issued: {formatDate(item.issuedAt)}  •  ID: {item.id}
                  </Text>

                  <View style={{ borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: 12, flexDirection: 'row', gap: 12 }}>
                    <Button
                      title="Download PDF Certificate"
                      variant="primary"
                      onPress={() => Linking.openURL(storageUrl)}
                    />
                    <Button
                      title="Public Verification"
                      variant="outline"
                      onPress={() => router.push(`/verify/${item.id}` as any)}
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
