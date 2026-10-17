import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Modal,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { useTheme } from '../../../src/features/theme/ThemeContext';
import {
  getAllCertificates,
  adminRevokeCertificateCallable,
  adminReissueCertificateCallable,
} from '../../../src/features/certificates/certificatesApi';
import { formatDate } from '../../../src/lib/utils';
import { Certificate } from '../../../src/types/certificate';

export default function AdminCertificatesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'revoked'>('all');
  const [revokeModalCert, setRevokeModalCert] = useState<Certificate | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['adminAllCertificates'],
    queryFn: getAllCertificates,
  });

  const revokeMutation = useMutation({
    mutationFn: async () => {
      if (!revokeModalCert) return;
      const certId = revokeModalCert.certificateId || revokeModalCert.id!;
      return await adminRevokeCertificateCallable(certId, revokeReason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllCertificates'] });
      setRevokeModalCert(null);
      setRevokeReason('');
    },
  });

  const reissueMutation = useMutation({
    mutationFn: async (certId: string) => {
      return await adminReissueCertificateCallable(certId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllCertificates'] });
    },
  });

  const filteredCerts = certificates.filter((c) => {
    const certId = c.certificateId || c.id || '';
    const q = search.toLowerCase();
    const matchSearch =
      certId.toLowerCase().includes(q) ||
      (c.nameEn && c.nameEn.toLowerCase().includes(q)) ||
      (c.nameFa && c.nameFa.toLowerCase().includes(q)) ||
      (c.courseTitleEn && c.courseTitleEn.toLowerCase().includes(q)) ||
      (c.studentName && c.studentName.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (filterStatus === 'verified') return !c.revoked;
    if (filterStatus === 'revoked') return !!c.revoked;
    return true;
  });

  const storageBucket = Constants.expoConfig?.extra?.firebaseStorageBucket || 'farukh-org.firebasestorage.app';

  return (
    <ScreenWrapper scrollable={false}>
      <View className="max-w-6xl w-full self-center flex-1 px-4 py-4">
        {/* Top Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={() => router.push('/admin')}>
                <Text style={{ color: colors.gold, fontSize: 18, fontWeight: 'bold' }}>← Admin</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>
                {isPersian ? 'مدیریت تصدیق‌نامه‌ها' : 'Certificates Management'}
              </Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
              Total Issued: {certificates.length} • Active: {certificates.filter((c) => !c.revoked).length} • Revoked: {certificates.filter((c) => c.revoked).length}
            </Text>
          </View>
        </View>

        {/* Filter & Search Bar */}
        <View className="flex-row flex-wrap gap-3 mb-6 items-center">
          <View className="flex-1 min-w-[240px]">
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by student name, course, or certificate ID..."
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: isDark ? 'rgba(30,41,59,0.8)' : '#FFFFFF',
                color: colors.text,
                borderColor: colors.cardBorder,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontSize: 14,
              }}
            />
          </View>

          <View className="flex-row gap-2">
            {(['all', 'verified', 'revoked'] as const).map((st) => (
              <TouchableOpacity
                key={st}
                onPress={() => setFilterStatus(st)}
                style={{
                  backgroundColor: filterStatus === st ? colors.gold : isDark ? 'rgba(30,41,59,0.8)' : '#F1F5F9',
                  borderColor: filterStatus === st ? colors.gold : colors.cardBorder,
                  borderWidth: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    color: filterStatus === st ? '#0F172A' : colors.text,
                    fontWeight: 'bold',
                    fontSize: 12,
                    textTransform: 'uppercase',
                  }}
                >
                  {st}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Certificates List */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : filteredCerts.length === 0 ? (
          <Card>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: 20 }}>
              No certificates found matching your query.
            </Text>
          </Card>
        ) : (
          <FlatList
            data={filteredCerts}
            keyExtractor={(item) => item.certificateId || item.id!}
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={({ item }) => {
              const certId = item.certificateId || item.id!;
              const isRevoked = !!item.revoked;
              const pdfUrl = item.pdfPath
                ? `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(item.pdfPath)}?alt=media`
                : null;
              const jpgUrl = item.jpgPath
                ? `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(item.jpgPath)}?alt=media`
                : null;

              return (
                <Card
                  style={{
                    borderColor: isRevoked ? '#EF4444' : colors.cardBorder,
                    borderWidth: 1.5,
                  }}
                  className="mb-4"
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '700' }}>
                          ID: {certId}
                        </Text>
                        <Badge
                          label={isRevoked ? 'REVOKED' : 'VALID'}
                          variant={isRevoked ? 'danger' : 'success'}
                        />
                      </View>
                      <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>
                        {item.courseTitleEn || item.courseTitle}
                      </Text>
                    </View>

                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                      {item.dateGregorian || formatDate(item.issuedAt)}
                    </Text>
                  </View>

                  {/* Student Names & Details */}
                  <View
                    style={{
                      backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : '#F8FAFC',
                      padding: 12,
                      borderRadius: 12,
                      marginBottom: 12,
                    }}
                  >
                    <View className="flex-row justify-between items-center mb-1">
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>English Name:</Text>
                      <Text style={{ color: colors.text, fontSize: 14, fontWeight: 'bold' }}>
                        {item.nameEn || item.studentName}
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Persian Name:</Text>
                      <Text style={{ color: colors.gold, fontSize: 14, fontWeight: 'bold', writingDirection: 'rtl', textAlign: 'right' }}>
                        {item.nameFa || '—'}
                      </Text>
                    </View>
                  </View>

                  {/* Revoke reason if revoked */}
                  {isRevoked && item.revokedReason && (
                    <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>
                      Revocation Reason: {item.revokedReason}
                    </Text>
                  )}

                  {/* Actions */}
                  <View className="flex-row flex-wrap gap-2 pt-2 border-t border-slate-700/30 items-center justify-between">
                    <View className="flex-row flex-wrap gap-2">
                      {pdfUrl && (
                        <Button
                          title="PDF"
                          variant="outline"
                          onPress={() => Linking.openURL(pdfUrl)}
                        />
                      )}
                      {jpgUrl && (
                        <Button
                          title="JPG"
                          variant="outline"
                          onPress={() => Linking.openURL(jpgUrl)}
                        />
                      )}
                      <Button
                        title="Verify Page ↗"
                        variant="secondary"
                        onPress={() => router.push(`/verify/${certId}` as any)}
                      />
                    </View>

                    <View>
                      {isRevoked ? (
                        <Button
                          title="Reissue / Restore"
                          variant="primary"
                          loading={reissueMutation.isPending}
                          onPress={() => reissueMutation.mutate(certId)}
                        />
                      ) : (
                        <Button
                          title="Revoke Certificate"
                          variant="danger"
                          onPress={() => setRevokeModalCert(item)}
                        />
                      )}
                    </View>
                  </View>
                </Card>
              );
            }}
          />
        )}
      </View>

      {/* REVOKE REASON MODAL */}
      <Modal
        visible={!!revokeModalCert}
        transparent
        animationType="fade"
        onRequestClose={() => setRevokeModalCert(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.75)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: '#EF4444',
              borderWidth: 2,
              borderRadius: 20,
              maxWidth: 480,
              width: '100%',
              padding: 20,
            }}
          >
            <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
              Revoke Certificate
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 14 }}>
              Are you sure you want to revoke certificate {revokeModalCert?.certificateId || revokeModalCert?.id}?
              The public verification page will immediately reflect the revoked status.
            </Text>

            <TextInput
              value={revokeReason}
              onChangeText={setRevokeReason}
              placeholder="Reason for revocation (e.g. academic integrity, requested re-issue)..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: isDark ? 'rgba(15,23,42,0.8)' : '#F8FAFC',
                color: colors.text,
                borderColor: colors.cardBorder,
                borderWidth: 1,
                borderRadius: 10,
                padding: 12,
                fontSize: 13,
                marginBottom: 16,
                textAlignVertical: 'top',
              }}
            />

            <View className="flex-row justify-end gap-3">
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setRevokeModalCert(null)}
              />
              <Button
                title="Confirm Revocation"
                variant="danger"
                loading={revokeMutation.isPending}
                onPress={() => revokeMutation.mutate()}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
