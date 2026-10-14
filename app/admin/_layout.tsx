import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/features/auth/useAuth';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <View className="flex-1 bg-surface-dark justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!user || !isAdmin) {
    return <Redirect href="/(student)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1E293B' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: '#0F172A' },
        headerRight: () => (
          <TouchableOpacity onPress={() => router.replace('/(student)')} className="mr-2">
            <Text className="text-brand-400 font-semibold text-sm">Exit Admin</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="blog/index" options={{ title: 'Blog & Articles Studio' }} />
      <Stack.Screen name="courses/index" options={{ title: 'Manage Courses' }} />
      <Stack.Screen name="courses/[courseId]" options={{ title: 'Edit Course' }} />
    </Stack>
  );
}
