import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../features/theme/ThemeContext';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation();
  const { isDark } = useTheme();
  const currentLang = i18n.language || 'en';

  const toggleLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? '#030819' : '#FFFFFF',
        borderColor: isDark ? 'rgba(250,204,21,0.35)' : '#E2E8F0',
        borderWidth: 1,
        borderRadius: 99,
        padding: 3,
        shadowColor: '#000',
        shadowOpacity: isDark ? 0.3 : 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
      className={className}
    >
      <TouchableOpacity
        onPress={() => toggleLanguage('en')}
        activeOpacity={0.7}
        style={{
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 99,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: currentLang.startsWith('en')
            ? (isDark ? '#0B25B7' : '#2563EB')
            : 'transparent',
          borderWidth: currentLang.startsWith('en') ? 1 : 0,
          borderColor: isDark ? 'rgba(250,204,21,0.6)' : 'rgba(37,99,235,0.4)',
        }}
      >
        <Text style={{ fontSize: 12 }}>🇺🇸</Text>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: currentLang.startsWith('en')
              ? '#FFFFFF'
              : (isDark ? '#94A3B8' : '#64748B'),
          }}
        >
          EN
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => toggleLanguage('fa')}
        activeOpacity={0.7}
        style={{
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 99,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: currentLang.startsWith('fa')
            ? (isDark ? '#0B25B7' : '#2563EB')
            : 'transparent',
          borderWidth: currentLang.startsWith('fa') ? 1 : 0,
          borderColor: isDark ? 'rgba(250,204,21,0.6)' : 'rgba(37,99,235,0.4)',
        }}
      >
        <Text style={{ fontSize: 12 }}>🇦🇫</Text>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: currentLang.startsWith('fa')
              ? '#FFFFFF'
              : (isDark ? '#94A3B8' : '#64748B'),
          }}
        >
          فارسی
        </Text>
      </TouchableOpacity>
    </View>
  );
}
