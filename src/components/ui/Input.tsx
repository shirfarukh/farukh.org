import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <View className="mb-4 w-full">
      {label && (
        <Text className="text-slate-300 font-medium mb-1.5 text-sm">
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor="#64748B"
        className={`bg-surface-card border ${
          error ? 'border-red-500' : 'border-surface-border'
        } text-white px-4 py-3 rounded-xl text-base focus:border-brand-500 ${className}`}
        {...props}
      />
      {error && (
        <Text className="text-red-400 text-xs mt-1 font-medium">{error}</Text>
      )}
    </View>
  );
};
