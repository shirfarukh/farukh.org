import React from 'react';
import { View, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../features/theme/ThemeContext';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  textClassName?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'info',
  className = '',
  textClassName = '',
  style,
  textStyle,
}) => {
  const { isDark } = useTheme();

  const getContainerClasses = () => {
    switch (variant) {
      case 'success':
        return isDark
          ? 'bg-emerald-950/80 border-emerald-500/50'
          : 'bg-emerald-50 border-emerald-300';
      case 'warning':
        return isDark
          ? 'bg-amber-950/80 border-amber-500/50'
          : 'bg-amber-50 border-amber-300';
      case 'danger':
        return isDark
          ? 'bg-red-950/80 border-red-500/50'
          : 'bg-red-50 border-red-300';
      case 'info':
      default:
        return isDark
          ? 'bg-brand-950/80 border-brand-500/50'
          : 'bg-brand-50 border-brand-300';
    }
  };

  const getTextClasses = () => {
    switch (variant) {
      case 'success':
        return isDark ? 'text-emerald-300' : 'text-emerald-700';
      case 'warning':
        return isDark ? 'text-amber-300' : 'text-amber-800';
      case 'danger':
        return isDark ? 'text-red-300' : 'text-red-700';
      case 'info':
      default:
        return isDark ? 'text-brand-300' : 'text-brand-700';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success':
        return isDark ? '#6ee7b7' : '#15803d';
      case 'warning':
        return isDark ? '#fde047' : '#b45309';
      case 'danger':
        return isDark ? '#fca5a5' : '#b91c1c';
      case 'info':
      default:
        return isDark ? '#93c5fd' : '#1d4ed8';
    }
  };

  return (
    <View
      style={style}
      className={`px-2.5 py-0.5 rounded-full border align-self-start ${getContainerClasses()} ${className}`}
    >
      <Text
        style={[{ color: getTextColor() }, textStyle]}
        className={`text-[11px] font-bold tracking-wide ${getTextClasses()} ${textClassName}`}
      >
        {label}
      </Text>
    </View>
  );
};
