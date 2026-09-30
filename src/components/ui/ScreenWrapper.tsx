import React from 'react';
import { View, SafeAreaView, ScrollView } from 'react-native';
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
  return (
    <SafeAreaView className="flex-1 bg-surface-dark">
      <StatusBar style="light" />
      {scrollable ? (
        <ScrollView
          className={`flex-1 px-4 py-4 ${className}`}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View className={`flex-1 px-4 py-4 ${className}`}>{children}</View>
      )}
    </SafeAreaView>
  );
};
