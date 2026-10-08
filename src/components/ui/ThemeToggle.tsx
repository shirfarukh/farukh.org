import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../../features/theme/ThemeContext';

interface ThemeToggleProps {
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 18,
  showLabel = false,
  className = '',
}) => {
  const { isDark, toggleTheme, colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.7}
      accessibilityLabel={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      accessibilityRole="button"
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
        borderColor: isDark ? 'rgba(250,204,21,0.35)' : '#CBD5E1',
        borderWidth: 1,
        borderRadius: 99,
        paddingHorizontal: showLabel ? 10 : 8,
        paddingVertical: 7,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
      className={className}
    >
      {isDark ? (
        <Sun size={size} color="#FACC15" />
      ) : (
        <Moon size={size} color="#0B25B7" />
      )}
      {showLabel && (
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: colors.text,
          }}
        >
          {isDark ? 'Light' : 'Dark'}
        </Text>
      )}
    </TouchableOpacity>
  );
};
