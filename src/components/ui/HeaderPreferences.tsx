import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Globe } from 'lucide-react-native';
import { useTheme } from '../../features/theme/ThemeContext';

interface HeaderPreferencesProps {
  compact?: boolean;
  className?: string;
}

/**
 * A unified, space-optimized pill group that combines Language Switching and Theme Toggling.
 * Resolves header crowding on mobile and small screens.
 */
export const HeaderPreferences: React.FC<HeaderPreferencesProps> = ({
  compact = false,
  className = '',
}) => {
  const { i18n } = useTranslation();
  const { isDark, toggleTheme, colors } = useTheme();
  const isPersian = (i18n.language || 'en').startsWith('fa');

  const toggleLanguage = () => {
    i18n.changeLanguage(isPersian ? 'en' : 'fa');
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(15,23,42,0.75)' : 'rgba(241,245,249,0.9)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(203,213,225,0.8)',
        borderRadius: 99,
        padding: 3,
        gap: 3,
      }}
      className={className}
    >
      {/* Language Switch Button */}
      <TouchableOpacity
        onPress={toggleLanguage}
        activeOpacity={0.7}
        accessibilityLabel={isPersian ? 'Switch to English' : 'تغییر زبان به فارسی'}
        accessibilityRole="button"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: compact ? 8 : 10,
          paddingVertical: 5,
          borderRadius: 99,
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.95)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(250,204,21,0.25)' : 'rgba(11,37,183,0.15)',
        }}
      >
        <Text style={{ fontSize: 12 }}>{isPersian ? '🇦🇫' : '🇺🇸'}</Text>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: colors.text,
          }}
        >
          {isPersian ? 'FA' : 'EN'}
        </Text>
      </TouchableOpacity>

      {/* Divider */}
      <View
        style={{
          width: 1,
          height: 14,
          backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
        }}
      />

      {/* Theme Toggle Button */}
      <TouchableOpacity
        onPress={toggleTheme}
        activeOpacity={0.7}
        accessibilityLabel={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        accessibilityRole="button"
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 7,
          paddingVertical: 5,
          borderRadius: 99,
          backgroundColor: isDark ? 'rgba(250,204,21,0.12)' : 'rgba(11,37,183,0.08)',
        }}
      >
        {isDark ? (
          <Sun size={15} color="#FACC15" />
        ) : (
          <Moon size={15} color="#0B25B7" />
        )}
      </TouchableOpacity>
    </View>
  );
};
