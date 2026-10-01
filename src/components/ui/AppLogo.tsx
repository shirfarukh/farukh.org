import React from 'react';
import { View, Image, Text } from 'react-native';

interface AppLogoProps {
  size?: number;
  showText?: boolean;
  textClassName?: string;
  className?: string;
}

export function AppLogo({
  size = 48,
  showText = false,
  textClassName = 'text-xl font-extrabold text-white tracking-wider',
  className = '',
}: AppLogoProps) {
  const logoSource = require('../../../assets/logo.png');

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
          <Text className={textClassName}>
            FARUKH<Text className="text-gold-400">.ORG</Text>
          </Text>
          <Text className="text-[11px] text-gold-400 font-semibold tracking-tight">
            Entrepreneurship & Education
          </Text>
        </View>
      )}
    </View>
  );
}
