import React from 'react';
import { View, SafeAreaView, ScrollView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

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

  return (
    <SafeAreaView
      className="flex-1 bg-surface-dark"
      style={isWeb ? ({ flex: 1, overflowY: 'auto' } as any) : { flex: 1 }}
    >
      <StatusBar style="light" />
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
