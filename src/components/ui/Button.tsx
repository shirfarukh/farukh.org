import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-slate-700 text-white border-transparent';
      case 'danger':
        return 'bg-red-600 text-white border-transparent';
      case 'outline':
        return 'bg-transparent border border-brand-500 text-brand-500';
      case 'primary':
      default:
        return 'bg-brand-600 text-white border-transparent';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className={`px-5 py-3.5 rounded-xl flex-row justify-center items-center ${getVariantStyles()} ${
        disabled ? 'opacity-50' : 'opacity-100'
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" className="mr-2" />
      ) : null}
      <Text className="text-white font-semibold text-center text-base">
        {title}
      </Text>
    </TouchableOpacity>
  );
};
