import React from 'react';
import { View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../features/theme/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  className = '',
  style,
}) => {
  const { colors } = useTheme();

  const baseStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[baseStyle, style]}
        className={className}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[baseStyle, style]} className={className}>
      {children}
    </View>
  );
};
