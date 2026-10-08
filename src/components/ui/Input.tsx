import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { useTheme } from '../../features/theme/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  style,
  ...props
}) => {
  const { colors } = useTheme();

  return (
    <View className="mb-4 w-full">
      {label && (
        <Text style={{ color: colors.textSecondary, fontWeight: '600', marginBottom: 6, fontSize: 13 }}>
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.danger : colors.cardBorder,
            borderWidth: 1,
            color: colors.text,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 14,
            fontSize: 15,
          },
          style,
        ]}
        {...props}
      />
      {error && (
        <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4, fontWeight: '500' }}>{error}</Text>
      )}
    </View>
  );
};
