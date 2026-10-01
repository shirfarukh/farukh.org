import React from 'react';
import { View, Text, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { verifyCertificateCallable } from '../../src/features/certificates/certificatesApi';
import { formatDate } from '../../src/lib/utils';
import { AppLogo } from '../../src/components/ui/AppLogo';

export default function VerifyCertificateScreen() {
  const { certificateId } = useLocalSearchParams<{ certificateId: string }>();

  const { data: cert, isLoading, error } = useQuery({
    queryKey: ['verifyCertificate', certificateId],
    queryFn: () => verifyCertificateCallable(certificateId!),
    enabled: !!certificateId,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface-dark justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (error || !cert) {
    return (
      <ScreenWrapper>
        <View className="max-w-xl w-full self-center my-auto">
          <Card className="border-red-800 bg-red-950/60 p-6">
            <Text className="text-2xl font-bold text-red-400 mb-2">Invalid Certificate</Text>
            <Text className="text-slate-300 text-base">
              The requested certificate ID ({certificateId}) could not be verified or does not exist.
            </Text>
          </Card>
        </View>
      </ScreenWrapper>
    );
  }

  const storageBucket = Constants.expoConfig?.extra?.firebaseStorageBucket || 'demo-learning-app.appspot.com';
  const pdfUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(cert.pdfPath)}?alt=media`;

  return (
    <ScreenWrapper>
      <View className="max-w-2xl w-full self-center my-8">
        <Card className="border-brand-500 p-8">
          <View className="flex-row justify-between items-center mb-6 border-b border-surface-border pb-4">
            <View className="flex-row items-center gap-4">
              <AppLogo size={56} />
              <View>
                <Text className="text-xs font-bold text-brand-400 tracking-wider uppercase mb-1">FARUKH.ORG Official Verification</Text>
                <Text className="text-2xl font-bold text-white">Certificate of Achievement</Text>
              </View>
            </View>
            <Badge
              label={cert.revoked ? 'REVOKED' : 'OFFICIALLY VERIFIED'}
              variant={cert.revoked ? 'danger' : 'success'}
            />
          </View>

          <View className="space-y-4 mb-8">
            <View>
              <Text className="text-xs text-slate-400">Recipient Student</Text>
              <Text className="text-xl font-bold text-white">{cert.studentName}</Text>
            </View>

            <View>
              <Text className="text-xs text-slate-400">Course Passed</Text>
              <Text className="text-lg font-semibold text-brand-300">{cert.courseTitle}</Text>
            </View>

            <View className="flex-row justify-between pt-2">
              <View>
                <Text className="text-xs text-slate-400">Final Score</Text>
                <Text className="text-base font-bold text-emerald-400">{cert.scorePercent}%</Text>
              </View>

              <View>
                <Text className="text-xs text-slate-400">Issue Date</Text>
                <Text className="text-base font-semibold text-slate-200">{formatDate(cert.issuedAt)}</Text>
              </View>

              <View>
                <Text className="text-xs text-slate-400">Certificate ID</Text>
                <Text className="text-base font-mono text-slate-400">{cert.certificateId.slice(0, 10)}...</Text>
              </View>
            </View>
          </View>

          {!cert.revoked && (
            <Button
              title="Download Certified PDF Copy"
              onPress={() => Linking.openURL(pdfUrl)}
            />
          )}
        </Card>
      </View>
    </ScreenWrapper>
  );
}
