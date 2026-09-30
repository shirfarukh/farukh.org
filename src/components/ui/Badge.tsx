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
        return 'bg-emerald-950/80 border-emerald-700 text-emerald-300';
      case 'warning':
        return 'bg-amber-950/80 border-amber-700 text-amber-300';
      case 'danger':
        return 'bg-red-950/80 border-red-700 text-red-300';
      case 'info':
      default:
        return 'bg-blue-950/80 border-blue-700 text-blue-300';
    }
  };

  return (
    <View className={`px-2.5 py-1 rounded-full border border-opacity-40 align-self-start ${getBadgeStyle()} ${className}`}>
      <Text className="text-xs font-semibold">{label}</Text>
    </View>
  );
};
