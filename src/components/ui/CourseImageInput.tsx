import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { useTheme } from '../../features/theme/ThemeContext';

interface CourseImageInputProps {
  value: string;
  onChangeImage: (url: string) => void;
  label?: string;
}

export const CourseImageInput: React.FC<CourseImageInputProps> = ({
  value,
  onChangeImage,
  label = 'Course Cover Image (Upload or Paste Link)',
}) => {
  const { colors, isDark } = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  const handlePickFile = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadMessage('Uploading image to Firebase Storage...');
        setImageLoadError(false);

        try {
          const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const fileRef = storageRef(storage, `covers/${Date.now()}_${cleanName}`);
          
          await uploadBytes(fileRef, file);
          const downloadUrl = await getDownloadURL(fileRef);
          
          onChangeImage(downloadUrl);
          setUploadMessage('✓ Uploaded successfully to Firebase Storage!');
          setTimeout(() => setUploadMessage(null), 4000);
        } catch (storageErr) {
          console.warn('Direct Firebase Storage upload failed, converting to local data URI fallback:', storageErr);
          // Fallback to FileReader Data URL so upload never fails for the user
          try {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              onChangeImage(dataUrl);
              setUploadMessage('✓ Image loaded successfully!');
              setTimeout(() => setUploadMessage(null), 4000);
            };
            reader.readAsDataURL(file);
          } catch (readerErr) {
            console.error('FileReader fallback failed:', readerErr);
            setUploadMessage('Failed to process image file.');
            setTimeout(() => setUploadMessage(null), 4000);
          }
        } finally {
          setIsUploading(false);
        }
      };
      input.click();
    } else {
      setUploadMessage('File upload dialog is available on web. On mobile, please enter an image URL.');
      setTimeout(() => setUploadMessage(null), 4000);
    }
  };

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={{ color: colors.textSecondary, fontWeight: '600', marginBottom: 8, fontSize: 13 }}>
          {label}
        </Text>
      )}

      {/* Action Bar: Upload Button & Direct URL Input */}
      <View style={{ gap: 10, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={handlePickFile}
            disabled={isUploading}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.12)',
              borderWidth: 1,
              borderColor: '#3B82F6',
              paddingHorizontal: 16,
              paddingVertical: 11,
              borderRadius: 12,
              gap: 8,
            }}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Text style={{ fontSize: 15 }}>📤</Text>
            )}
            <Text style={{ color: '#3B82F6', fontWeight: '700', fontSize: 13 }}>
              {isUploading ? 'Uploading...' : 'Upload Image File'}
            </Text>
          </TouchableOpacity>

          {value ? (
            <TouchableOpacity
              onPress={() => onChangeImage('')}
              style={{
                backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.4)',
                paddingHorizontal: 12,
                paddingVertical: 11,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 12 }}>✕ Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Direct URL / Link Input */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            paddingHorizontal: 12,
          }}
        >
          <Text style={{ fontSize: 14, marginRight: 8 }}>🔗</Text>
          <TextInput
            value={value}
            onChangeText={(txt) => {
              setImageLoadError(false);
              onChangeImage(txt);
            }}
            placeholder="Or paste direct image URL (https://...)"
            placeholderTextColor={colors.textMuted}
            style={{
              flex: 1,
              color: colors.text,
              paddingVertical: 10,
              fontSize: 13,
            }}
          />
        </View>
      </View>

      {/* Upload Feedback */}
      {uploadMessage && (
        <View
          style={{
            backgroundColor: uploadMessage.startsWith('✓') ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            borderColor: uploadMessage.startsWith('✓') ? '#22C55E' : '#EF4444',
            borderWidth: 1,
            borderRadius: 10,
            padding: 8,
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              color: uploadMessage.startsWith('✓') ? '#22C55E' : '#EF4444',
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            {uploadMessage}
          </Text>
        </View>
      )}

      {/* Live Preview Card */}
      {value ? (
        <View
          style={{
            borderRadius: 14,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.cardBorder,
            backgroundColor: colors.cardHover,
            marginTop: 4,
          }}
        >
          <Image
            source={{ uri: value }}
            style={{ width: '100%', height: 160 }}
            resizeMode="cover"
            onError={() => setImageLoadError(true)}
          />
          <View
            style={{
              padding: 8,
              backgroundColor: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(241,245,249,0.9)',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 11 }} numberOfLines={1}>
              {imageLoadError ? '⚠️ Image failed to load, check URL' : '✓ Live Cover Preview'}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 10 }}>
              {value.startsWith('data:') ? 'Local file' : value.slice(0, 35) + '...'}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
};
