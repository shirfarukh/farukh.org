import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ScreenWrapper } from '../../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../../src/components/ui/Card';
import { Button } from '../../../../src/components/ui/Button';
import { useTheme } from '../../../../src/features/theme/ThemeContext';
import {
  getCourseCertificateTemplate,
  adminSaveCertificateTemplateCallable,
} from '../../../../src/features/certificates/certificatesApi';
import { getAdminCourses } from '../../../../src/features/admin/adminApi';
import {
  DEFAULT_CERTIFICATE_FIELDS,
  CertificateFieldConfig,
} from '../../../../src/types/certificate';

export default function CertificateTemplateEditorScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [bgUrl, setBgUrl] = useState('');
  const [fields, setFields] = useState<CertificateFieldConfig[]>(DEFAULT_CERTIFICATE_FIELDS);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('nameEn');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Fetch course info
  const { data: courses = [] } = useQuery({
    queryKey: ['adminCourses'],
    queryFn: getAdminCourses,
  });
  const course = courses.find((c) => c.id === courseId);

  // Fetch existing template if any
  const { data: existingTemplate, isLoading } = useQuery({
    queryKey: ['courseCertificateTemplate', courseId],
    queryFn: () => (courseId ? getCourseCertificateTemplate(courseId) : null),
    enabled: !!courseId,
  });

  useEffect(() => {
    if (existingTemplate) {
      if (existingTemplate.backgroundUrl) setBgUrl(existingTemplate.backgroundUrl);
      if (existingTemplate.fields && Array.isArray(existingTemplate.fields) && existingTemplate.fields.length > 0) {
        setFields(existingTemplate.fields);
      }
    }
  }, [existingTemplate]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!courseId) return;
      setSaveError('');
      setSaveSuccess(false);
      return await adminSaveCertificateTemplateCallable(courseId, {
        backgroundUrl: bgUrl.trim(),
        fields,
      });
    },
    onSuccess: () => {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    },
    onError: (err: any) => {
      setSaveError(err.message || 'Failed to save certificate template.');
    },
  });

  const selectedField = fields.find((f) => f.id === selectedFieldId) || fields[0];

  const updateSelectedField = (patch: Partial<CertificateFieldConfig>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === selectedFieldId ? { ...f, ...patch } : f))
    );
  };

  const handleResetToDefault = () => {
    setFields(DEFAULT_CERTIFICATE_FIELDS);
    setBgUrl('');
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <ScreenWrapper scrollable={true}>
      <View className="max-w-6xl w-full self-center px-4 py-4 pb-24">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={() => router.push(`/admin/courses/${courseId}` as any)}>
                <Text style={{ color: colors.gold, fontSize: 18, fontWeight: 'bold' }}>← Back to Course</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>
                Certificate Template Editor
              </Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
              Customizing certificate background and typography layout for: <Text style={{ color: colors.text, fontWeight: '700' }}>{course?.title || courseId}</Text>
            </Text>
          </View>

          <View className="flex-row gap-3">
            <Button
              title="Reset Default AECCI"
              variant="outline"
              onPress={handleResetToDefault}
            />
            <Button
              title="Save Template ✓"
              variant="primary"
              loading={saveMutation.isPending}
              onPress={() => saveMutation.mutate()}
            />
          </View>
        </View>

        {saveSuccess && (
          <View className="p-3 mb-4 rounded-xl bg-emerald-950/60 border border-emerald-500">
            <Text className="text-emerald-400 font-bold text-sm">✓ Template successfully saved for this course!</Text>
          </View>
        )}

        {saveError ? (
          <View className="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-800">
            <Text className="text-red-300 font-bold text-sm">{saveError}</Text>
          </View>
        ) : null}

        {/* 1. Background URL Input */}
        <Card className="mb-6">
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: 'bold', marginBottom: 2 }}>
            Custom Certificate Background Image (JPG)
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
            Leave blank to use the official default AECCI / FARUKH.ORG template, or provide a URL/Storage link to a custom course certificate.
          </Text>
          <TextInput
            value={bgUrl}
            onChangeText={setBgUrl}
            placeholder="https://.../certificate-background.jpg (optional)"
            placeholderTextColor={colors.textMuted}
            style={{
              backgroundColor: isDark ? 'rgba(15,23,42,0.8)' : '#F8FAFC',
              color: colors.text,
              borderColor: colors.cardBorder,
              borderWidth: 1,
              borderRadius: 10,
              padding: 10,
              fontSize: 13,
            }}
          />
        </Card>

        {/* 2. LIVE INTERACTIVE CANVAS PREVIEW */}
        <Card className="mb-6 p-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
              Live Certificate Layout Preview (Percentage Coordinates)
            </Text>
            <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '600' }}>
              Aspect Ratio 4:3 (Landscape)
            </Text>
          </View>

          {/* Canvas Box */}
          <View
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: 1.3389,
              backgroundColor: '#0b1329',
              borderRadius: 12,
              overflow: 'hidden',
              borderColor: colors.cardBorder,
              borderWidth: 1.5,
            }}
          >
            {/* Background image preview */}
            <Image
              source={
                bgUrl.trim()
                  ? { uri: bgUrl.trim() }
                  : require('../../../../assets/certificate-template-default.jpg')
              }
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
              }}
              resizeMode="cover"
            />

            {/* Render Field Boxes */}
            {fields.map((f) => {
              const isSelected = f.id === selectedFieldId;
              let sampleText = '';
              if (f.id === 'nameFa') sampleText = 'شیر فرخ';
              else if (f.id === 'courseFa') sampleText = course?.faTitle || 'هوش مصنوعی و تجارت الکترونیک';
              else if (f.id === 'nameEn') sampleText = 'Shir Farukh';
              else if (f.id === 'courseEn') sampleText = course?.title || 'Artificial Intelligence Mastery';
              else if (f.id === 'date') sampleText = '17 Oct 2026 / ۲۵ میزان ۱۴۰۵';
              else if (f.id === 'certificateId') sampleText = 'ID: cert_sample123';
              else if (f.id === 'qr') sampleText = '📱 [QR]';

              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setSelectedFieldId(f.id)}
                  style={{
                    position: 'absolute',
                    top: `${f.top}%`,
                    left: `${f.left}%`,
                    width: `${f.width}%`,
                    height: `${f.height}%`,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? '#F59E0B' : 'rgba(59,130,246,0.5)',
                    backgroundColor: isSelected ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.1)',
                    borderRadius: 4,
                    justifyContent: 'center',
                    alignItems: f.textAlign === 'center' ? 'center' : f.textAlign === 'right' ? 'flex-end' : 'flex-start',
                    paddingHorizontal: 4,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color: f.color || '#000000',
                      fontSize: Math.max(9, Math.round(f.fontSize * 0.45)), // scale down for preview
                      fontWeight: (f.fontWeight as any) || 'bold',
                      fontStyle: (f.fontStyle as any) || 'normal',
                      textAlign: f.textAlign as any,
                    }}
                  >
                    {sampleText}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* 3. FIELD PROPERTIES EDITOR */}
        <Card>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
            Edit Field Properties
          </Text>

          {/* Field Selection Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 my-3">
            {fields.map((f) => {
              const isSelected = f.id === selectedFieldId;
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setSelectedFieldId(f.id)}
                  style={{
                    backgroundColor: isSelected ? colors.gold : isDark ? 'rgba(30,41,59,0.8)' : '#F1F5F9',
                    borderColor: isSelected ? colors.gold : colors.cardBorder,
                    borderWidth: 1,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? '#0F172A' : colors.text,
                      fontWeight: 'bold',
                      fontSize: 12,
                    }}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Controls Grid */}
          <View className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            {/* Top % */}
            <View>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>
                Top Position: {selectedField.top}%
              </Text>
              <TextInput
                keyboardType="numeric"
                value={String(selectedField.top)}
                onChangeText={(v) => updateSelectedField({ top: parseFloat(v) || 0 })}
                style={{
                  backgroundColor: isDark ? 'rgba(15,23,42,0.8)' : '#F8FAFC',
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  borderRadius: 8,
                  padding: 8,
                  fontSize: 13,
                }}
              />
            </View>

            {/* Left % */}
            <View>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>
                Left Position: {selectedField.left}%
              </Text>
              <TextInput
                keyboardType="numeric"
                value={String(selectedField.left)}
                onChangeText={(v) => updateSelectedField({ left: parseFloat(v) || 0 })}
                style={{
                  backgroundColor: isDark ? 'rgba(15,23,42,0.8)' : '#F8FAFC',
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  borderRadius: 8,
                  padding: 8,
                  fontSize: 13,
                }}
              />
            </View>

            {/* Width % */}
            <View>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>
                Width: {selectedField.width}%
              </Text>
              <TextInput
                keyboardType="numeric"
                value={String(selectedField.width)}
                onChangeText={(v) => updateSelectedField({ width: parseFloat(v) || 0 })}
                style={{
                  backgroundColor: isDark ? 'rgba(15,23,42,0.8)' : '#F8FAFC',
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  borderRadius: 8,
                  padding: 8,
                  fontSize: 13,
                }}
              />
            </View>

            {/* Height % */}
            <View>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>
                Height: {selectedField.height}%
              </Text>
              <TextInput
                keyboardType="numeric"
                value={String(selectedField.height)}
                onChangeText={(v) => updateSelectedField({ height: parseFloat(v) || 0 })}
                style={{
                  backgroundColor: isDark ? 'rgba(15,23,42,0.8)' : '#F8FAFC',
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  borderRadius: 8,
                  padding: 8,
                  fontSize: 13,
                }}
              />
            </View>

            {/* Font Size (px) */}
            <View>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>
                Font Size: {selectedField.fontSize}px
              </Text>
              <TextInput
                keyboardType="numeric"
                value={String(selectedField.fontSize)}
                onChangeText={(v) => updateSelectedField({ fontSize: parseInt(v, 10) || 12 })}
                style={{
                  backgroundColor: isDark ? 'rgba(15,23,42,0.8)' : '#F8FAFC',
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  borderRadius: 8,
                  padding: 8,
                  fontSize: 13,
                }}
              />
            </View>

            {/* Font Color */}
            <View>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>
                Text Color (HEX)
              </Text>
              <TextInput
                value={selectedField.color}
                onChangeText={(v) => updateSelectedField({ color: v })}
                style={{
                  backgroundColor: isDark ? 'rgba(15,23,42,0.8)' : '#F8FAFC',
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  borderRadius: 8,
                  padding: 8,
                  fontSize: 13,
                }}
              />
            </View>

            {/* Alignment */}
            <View>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>
                Alignment
              </Text>
              <View className="flex-row gap-1">
                {(['left', 'center', 'right'] as const).map((al) => (
                  <TouchableOpacity
                    key={al}
                    onPress={() => updateSelectedField({ textAlign: al })}
                    style={{
                      flex: 1,
                      backgroundColor: selectedField.textAlign === al ? colors.gold : 'rgba(148,163,184,0.15)',
                      paddingVertical: 8,
                      borderRadius: 6,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: selectedField.textAlign === al ? '#0F172A' : colors.text,
                        fontWeight: 'bold',
                        fontSize: 11,
                      }}
                    >
                      {al}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Card>
      </View>
    </ScreenWrapper>
  );
}
