import React from 'react';
import { View, Pressable, StyleProp, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../../features/theme/ThemeContext';
import { scalePresets } from '../../theme/motion';

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
  const { colors, isDark } = useTheme();

  const baseStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    borderWidth: 1,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    // Layered subtle elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.25 : 0.05,
    shadowRadius: 8,
    elevation: 2,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          baseStyle,
          {
            transform: [{ scale: pressed ? scalePresets.pressScaleCard : 1 }],
            opacity: pressed ? 0.94 : 1,
            ...(Platform.OS === 'web'
              ? ({
                  transition: 'transform 140ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 140ms ease',
                  cursor: 'pointer',
                } as any)
              : {}),
          },
          style,
        ]}
        className={className}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[baseStyle, style]} className={className}>
      {children}
    </View>
  );
};
