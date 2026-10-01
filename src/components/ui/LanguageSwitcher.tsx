import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const toggleLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <View className={`flex-row items-center bg-surface-dark border border-gold-400/40 rounded-full p-1 shadow-md ${className}`}>
      <TouchableOpacity
        onPress={() => toggleLanguage('en')}
        className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 ${
          currentLang.startsWith('en')
            ? 'bg-brand-600 border border-gold-400/80 shadow'
            : 'bg-transparent'
        }`}
      >
        <Text className="text-xs">🇬🇧</Text>
        <Text
          className={`text-xs font-bold ${
            currentLang.startsWith('en') ? 'text-white' : 'text-slate-300'
          }`}
        >
          EN
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => toggleLanguage('fa')}
        className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 ${
          currentLang.startsWith('fa')
            ? 'bg-brand-600 border border-gold-400/80 shadow'
            : 'bg-transparent'
        }`}
      >
        <Text className="text-xs">🇮🇷</Text>
        <Text
          className={`text-xs font-bold ${
            currentLang.startsWith('fa') ? 'text-gold-300' : 'text-slate-300'
          }`}
        >
          فارسی
        </Text>
      </TouchableOpacity>
    </View>
  );
}
