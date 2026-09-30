import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/features/auth/useAuth';
import { View, ActivityIndicator } from 'react-native';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 bg-surface-dark justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(student)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0F172A' } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
