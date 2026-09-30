import React from 'react';
import { View, TouchableOpacity } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  className = '',
}) => {
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        className={`bg-surface-card border border-surface-border p-4 rounded-2xl mb-4 ${className}`}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={`bg-surface-card border border-surface-border p-4 rounded-2xl mb-4 ${className}`}>
      {children}
    </View>
  );
};
