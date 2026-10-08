import React from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../features/theme/ThemeContext';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  className?: string;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  scrollable = true,
  className = '',
}) => {
  const isWeb = Platform.OS === 'web';
  const { isDark, colors } = useTheme();

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.bg },
        isWeb ? ({ overflowY: 'auto' } as any) : undefined,
      ]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {scrollable ? (
        <ScrollView
          className={`flex-1 px-4 py-4 ${className}`}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View
          className={`flex-1 px-4 py-4 ${className}`}
          style={isWeb ? ({ flex: 1, overflowY: 'auto' } as any) : { flex: 1 }}
        >
          {children}
        </View>
      )}
    </SafeAreaView>
  );
};
