import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { storage } from '../../lib/firebase';
import { useTheme } from '../../features/theme/ThemeContext';

interface CourseImageInputProps {
  value: string;
  onChangeImage: (url: string) => void;
  label?: string;
}

// Client-side image optimizer for Web to avoid Firestore document size limits & provide instant rendering
const readAndOptimizeWebImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        resolve('');
        return;
      }
      // If smaller than 200KB, use directly
      if (file.size < 200 * 1024) {
        resolve(result);
        return;
      }
      try {
        const img = new (window as any).Image();
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimized = canvas.toDataURL('image/jpeg', 0.85);
            resolve(optimized);
            return;
          }
          resolve(result);
        };
        img.onerror = () => resolve(result);
        img.src = result;
      } catch {
        resolve(result);
      }
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

export const CourseImageInput: React.FC<CourseImageInputProps> = ({
  value,
  onChangeImage,
  label = 'Course Cover Image (Upload or Paste Link)',
}) => {
  const { colors, isDark } = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  const handlePickFile = async () => {
    setImageLoadError(false);

    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadMessage('Processing image...');

        try {
          // 1. Read and optimize image locally first for INSTANT preview & fallback
          const localDataUrl = await readAndOptimizeWebImage(file);
          if (localDataUrl) {
            onChangeImage(localDataUrl);
          }

          // 2. Attempt background upload to Firebase Storage with strict 4s timeout
          setUploadMessage('Syncing image...');
          const cleanName = (file.name || 'cover.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
          const fileRef = storageRef(storage, `covers/${Date.now()}_${cleanName}`);

          const uploadPromise = uploadBytes(fileRef, file);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Storage upload timeout')), 4000)
          );

          try {
            await Promise.race([uploadPromise, timeoutPromise]);
            const downloadUrl = await getDownloadURL(fileRef);
            onChangeImage(downloadUrl);
            setUploadMessage('✓ Uploaded to Cloud Storage!');
          } catch (cloudErr) {
            // If cloud storage is not yet provisioned or network takes too long, local optimized image is already saved!
            console.log('Using optimized local image (Cloud storage unavailable or timed out):', cloudErr);
            setUploadMessage('✓ Image ready & applied!');
          }
        } catch (err: any) {
          console.error('Failed to load image:', err);
          setUploadMessage('⚠️ Failed to load image. Please try pasting a direct image link.');
        } finally {
          setIsUploading(false);
          setTimeout(() => setUploadMessage(null), 4000);
        }
      };
      input.click();
    } else {
      // Native Mobile (Expo Go on iOS/Android)
      try {
        setIsUploading(true);
        setUploadMessage('Selecting image...');

        const result = await DocumentPicker.getDocumentAsync({
          type: ['image/*'],
          copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
          setIsUploading(false);
          setUploadMessage(null);
          return;
        }

        const asset = result.assets[0];
        setUploadMessage('Loading image...');

        // Read base64
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const mime = asset.mimeType || 'image/jpeg';
        const dataUrl = `data:${mime};base64,${base64}`;

        // Immediately apply image
        onChangeImage(dataUrl);

        // Attempt Firebase Storage upload in background if possible
        try {
          const cleanName = (asset.name || 'cover.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
          const fileRef = storageRef(storage, `covers/${Date.now()}_${cleanName}`);
          
          const response = await fetch(asset.uri);
          const blob = await response.blob();

          const uploadPromise = uploadBytes(fileRef, blob);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Storage upload timeout')), 4000)
          );

          await Promise.race([uploadPromise, timeoutPromise]);
          const downloadUrl = await getDownloadURL(fileRef);
          onChangeImage(downloadUrl);
          setUploadMessage('✓ Uploaded to Cloud Storage!');
        } catch {
          setUploadMessage('✓ Image ready & applied!');
        }
      } catch (err: any) {
        console.error('Mobile image pick error:', err);
        setUploadMessage('⚠️ Could not open file selector.');
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadMessage(null), 4000);
      }
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
              opacity: isUploading ? 0.7 : 1,
            }}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Text style={{ fontSize: 15 }}>📤</Text>
            )}
            <Text style={{ color: '#3B82F6', fontWeight: '700', fontSize: 13 }}>
              {isUploading ? 'Processing...' : 'Upload Image File'}
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
