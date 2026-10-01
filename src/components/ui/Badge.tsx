import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'info',
  className = '',
}) => {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300';
      case 'warning':
        return 'bg-gold-950/90 border-gold-400/80 text-gold-300';
      case 'danger':
        return 'bg-red-950/90 border-red-500/60 text-red-300';
      case 'info':
      default:
        return 'bg-brand-950/90 border-brand-500/60 text-brand-300';
    }
  };

  return (
    <View className={`px-3 py-1 rounded-full border align-self-start ${getBadgeStyle()} ${className}`}>
      <Text className="text-[11px] font-bold tracking-wide">{label}</Text>
    </View>
  );
};
