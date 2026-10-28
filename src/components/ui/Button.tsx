import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleProp, ViewStyle, Platform } from 'react-native';
import { scalePresets } from '../../theme/motion';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'subtle';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  style,
  icon,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-slate-800 text-white border border-slate-700/60 shadow-sm';
      case 'danger':
        return 'bg-rose-600 text-white border-transparent shadow-sm';
      case 'outline':
        return 'bg-transparent border border-blue-500/40 text-blue-500';
      case 'subtle':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'primary':
      default:
        return 'bg-blue-600 text-white border-transparent shadow-sm shadow-blue-500/20';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          transform: [{ scale: pressed && !disabled ? scalePresets.pressScaleButton : 1 }],
          opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
          ...(Platform.OS === 'web'
            ? ({
                transition: 'transform 140ms cubic-bezier(0.23, 1, 0.32, 1), opacity 140ms ease',
                cursor: disabled ? 'not-allowed' : 'pointer',
              } as any)
            : {}),
        },
        style,
      ]}
      className={`px-5 py-3.5 rounded-xl flex-row justify-center items-center ${getVariantStyles()} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" className="mr-2" size="small" />
      ) : icon ? (
        <span style={{ display: 'inline-flex', marginRight: 8 }}>{icon}</span>
      ) : null}
      <Text className="text-white font-semibold text-center text-base tracking-wide">
        {title}
      </Text>
    </Pressable>
  );
};
