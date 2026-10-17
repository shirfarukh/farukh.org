import React from 'react';
import { View, Image, Text } from 'react-native';
import { useTheme } from '../../features/theme/ThemeContext';

interface AppLogoProps {
  size?: number;
  showText?: boolean;
  textClassName?: string;
  className?: string;
}

export function AppLogo({
  size = 48,
  showText = false,
  textClassName = 'text-xl font-extrabold tracking-wider',
  className = '',
}: AppLogoProps) {
  const { colors, isDark } = useTheme();
  const logoSource = require('../../../assets/logo.png');

  // Strip hardcoded text-white if present to respect dynamic day/night theme
  const safeTextClassName = textClassName.replace(/\btext-white\b/g, '').trim();

  return (
    <View className={`flex-row items-center gap-3 ${className}`}>
      <View className="relative justify-center items-center rounded-full p-[2px] bg-gradient-to-r from-gold-400 to-brand-500 shadow-md">
        <Image
          source={logoSource}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="contain"
        />
      </View>
      {showText && (
        <View className="justify-center">
          <Text
            className={safeTextClassName || 'text-xl font-extrabold tracking-wider'}
            style={{ color: colors.text }}
          >
            FARUKH<Text style={{ color: colors.gold }}>.ORG</Text>
          </Text>
          <Text
            className="text-[11px] font-semibold tracking-tight"
            style={{ color: colors.gold }}
          >
            Entrepreneurship & Education
          </Text>
        </View>
      )}
    </View>
  );
}
