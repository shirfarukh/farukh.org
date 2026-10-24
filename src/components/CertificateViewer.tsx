import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Platform, TouchableOpacity, Linking, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../features/theme/ThemeContext';
import { Certificate } from '../types/certificate';

interface CertificateViewerProps {
  certificate: {
    id?: string;
    certificateId?: string;
    nameEn?: string;
    nameFa?: string;
    courseTitleEn?: string;
    courseTitleFa?: string;
    courseTitle?: string;
    dateGregorian?: string;
    dateJalali?: string;
    qrCodeUrl?: string;
    bgImageUrl?: string;
    [key: string]: any;
  };
  onPrint?: () => void;
  showActions?: boolean;
}

export function CertificateViewer({ certificate, onPrint, showActions = true }: CertificateViewerProps) {
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');
  const { width: windowWidth } = useWindowDimensions();

  // Aspect ratio of the official certificate template: 960 x 717
  const aspectRatio = 960 / 717;
  // Calculate container width: full width up to max 840px
  const containerWidth = Math.min(windowWidth - 32, 840);
  const scale = containerWidth / 960;

  const certId = certificate.certificateId || certificate.id || 'FARUKH-CERT';
  const verifyUrl = `https://farukh.org/verify/${certId}`;
  const qrUrl =
    certificate.qrCodeUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      verifyUrl
    )}&color=0-0-0&bgcolor=255-255-255&qzone=1`;

  const dateText = [certificate.dateGregorian, certificate.dateJalali].filter(Boolean).join(' / ');

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <View style={styles.outerContainer}>
      {/* ─── CERTIFICATE CANVAS (LANDSCAPE 960x717) ─── */}
      <View
        id="certificate-print-area"
        style={[
          styles.certWrapper,
          {
            width: containerWidth,
            height: containerWidth / aspectRatio,
            borderColor: colors.gold,
            shadowColor: colors.gold,
          },
        ]}
      >
        {/* Background Image Template */}
        <Image
          source={
            certificate.bgImageUrl
              ? { uri: certificate.bgImageUrl }
              : require('../../assets/certificate-template-default.jpg')
          }
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {/* 1. Persian Recipient Name */}
        {certificate.nameFa ? (
          <View
            style={[
              styles.fieldBox,
              {
                top: '38.5%',
                left: '50.0%',
                width: '20.0%',
                height: '3.6%',
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: Platform.OS === 'web' ? 'Vazirmatn, sans-serif' : 'System',
                fontWeight: '800',
                fontSize: Math.max(9, Math.round(15 * scale)),
                color: '#0b1a30',
                textAlign: 'center',
                writingDirection: 'rtl',
              }}
            >
              {certificate.nameFa}
            </Text>
          </View>
        ) : null}

        {/* 2. Persian Course Title */}
        {certificate.courseTitleFa ? (
          <View
            style={[
              styles.fieldBox,
              {
                top: '45.0%',
                left: '42.0%',
                width: '32.0%',
                height: '3.6%',
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: Platform.OS === 'web' ? 'Vazirmatn, sans-serif' : 'System',
                fontWeight: '700',
                fontSize: Math.max(8, Math.round(13 * scale)),
                color: '#0b1a30',
                textAlign: 'center',
                writingDirection: 'rtl',
              }}
            >
              {certificate.courseTitleFa}
            </Text>
          </View>
        ) : null}

        {/* 3. English Recipient Name */}
        {certificate.nameEn ? (
          <View
            style={[
              styles.fieldBox,
              {
                top: '66.8%',
                left: '42.0%',
                width: '33.0%',
                height: '3.8%',
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: Platform.OS === 'web' ? "'Playfair Display', Georgia, serif" : 'System',
                fontWeight: '700',
                fontStyle: 'italic',
                fontSize: Math.max(9, Math.round(15 * scale)),
                color: '#0b1a30',
                textAlign: 'center',
              }}
            >
              {certificate.nameEn}
            </Text>
          </View>
        ) : null}

        {/* 4. English Course Title */}
        {certificate.courseTitleEn || certificate.courseTitle ? (
          <View
            style={[
              styles.fieldBox,
              {
                top: '72.8%',
                left: '55.5%',
                width: '23.0%',
                height: '3.6%',
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: Platform.OS === 'web' ? 'Inter, sans-serif' : 'System',
                fontWeight: '700',
                fontSize: Math.max(8, Math.round(12 * scale)),
                color: '#0b1a30',
                textAlign: 'center',
              }}
            >
              {certificate.courseTitleEn || certificate.courseTitle}
            </Text>
          </View>
        ) : null}

        {/* 5. Date (Gregorian / Jalali) */}
        {dateText ? (
          <View
            style={[
              styles.fieldBox,
              {
                top: '91.0%',
                left: '45.0%',
                width: '13.0%',
                height: '3.2%',
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: Platform.OS === 'web' ? 'Inter, sans-serif' : 'System',
                fontWeight: '700',
                fontSize: Math.max(6, Math.round(8 * scale)),
                color: '#0f172a',
                textAlign: 'center',
              }}
            >
              {dateText}
            </Text>
          </View>
        ) : null}

        {/* 6. SCANNABLE QR CODE (CLEARLY VISIBLE IN SOLID BLACK DIRECTLY IN DESIGNATED QR BOX) */}
        <View
          style={[
            styles.fieldBox,
            {
              top: '80.5%',
              left: '17.8%',
              width: '6.2%',
              height: '9.8%',
              backgroundColor: '#FFFFFF',
              borderRadius: 2,
              padding: 1,
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
        >
          <Image
            source={{ uri: qrUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </View>

        {/* 7. Certificate ID */}
        <View
          style={[
            styles.fieldBox,
            {
              top: '91.8%',
              left: '16.5%',
              width: '8.8%',
              height: '2.4%',
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
        >
          <Text
            numberOfLines={1}
            style={{
              fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
              fontWeight: '700',
              fontSize: Math.max(5, Math.round(6.5 * scale)),
              color: '#1e293b',
              textAlign: 'center',
              letterSpacing: 0.2,
            }}
          >
            {certId}
          </Text>
        </View>
      </View>

      {/* ─── ACTION BUTTONS (PRINT / VERIFY) ─── */}
      {showActions && (
        <View style={styles.actionRow}>
          {Platform.OS === 'web' && (
            <TouchableOpacity
              onPress={handlePrint}
              style={[styles.actionBtn, { backgroundColor: colors.gold }]}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnTextDark}>
                {isPersian ? 'چاپ یا ذخیره تصدیق‌نامه 🖨️' : 'Print / Save Certificate 🖨️'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => Linking.openURL(verifyUrl)}
            style={[
              styles.actionBtn,
              {
                backgroundColor: 'transparent',
                borderWidth: 1.5,
                borderColor: colors.gold,
              },
            ]}
            activeOpacity={0.85}
          >
            <Text style={[styles.actionBtnText, { color: colors.gold }]}>
              {isPersian ? 'صفحه استعلام و اصالت‌سنجی رسمی →' : 'Public Verification Page →'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
  },
  certWrapper: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    backgroundColor: '#0c162d',
  },
  fieldBox: {
    position: 'absolute',
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  actionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontWeight: '700',
    fontSize: 13,
  },
  actionBtnTextDark: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 13,
  },
});
