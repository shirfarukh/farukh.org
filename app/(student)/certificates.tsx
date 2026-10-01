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
import { getUserCertificates } from '../../src/features/certificates/certificatesApi';
import { formatDate } from '../../src/lib/utils';

export default function MyCertificatesScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['userCertificates', user?.uid],
    queryFn: () => getUserCertificates(user!.uid),
    enabled: !!user?.uid,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface-dark justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScreenWrapper scrollable={false}>
      <View className="max-w-4xl w-full self-center flex-1">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-white mb-1">My Certificates</Text>
          <Text className="text-slate-400 text-sm">Download and verify your official course certificates</Text>
        </View>

        {certificates.length === 0 ? (
          <Card>
            <Text className="text-slate-300 font-medium text-base mb-1">No Certificates Issued Yet</Text>
            <Text className="text-slate-400 text-sm">
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
                <Card className="mb-4 border-brand-500">
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-xl font-bold text-white flex-1 mr-2">{item.courseTitle}</Text>
                    <Badge label={item.revoked ? 'REVOKED' : 'VERIFIED'} variant={item.revoked ? 'danger' : 'success'} />
                  </View>

                  <Text className="text-slate-300 text-sm mb-1">
                    Student: <Text className="font-semibold text-white">{item.studentName}</Text>
                  </Text>
                  <Text className="text-slate-400 text-xs mb-4">
                    Score: {item.scorePercent}%  •  Issued: {formatDate(item.issuedAt)}  •  ID: {item.id}
                  </Text>

                  <View className="flex-row space-x-3 pt-3 border-t border-surface-border">
                    <Button
                      title="Download PDF Certificate"
                      variant="primary"
                      onPress={() => Linking.openURL(storageUrl)}
                      className="mr-3"
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
