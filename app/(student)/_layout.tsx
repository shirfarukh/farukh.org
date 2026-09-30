import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Stack, useRouter, usePathname, Redirect } from 'expo-router';
import { useAuth } from '../../src/features/auth/useAuth';
import { ActivityIndicator } from 'react-native';

export default function StudentLayout() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) {
    return (
      <View className="flex-1 bg-surface-dark justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  const isWeb = Platform.OS === 'web';

  return (
    <View className="flex-1 flex-col md:flex-row bg-surface-dark">
      {/* Desktop / Web Sidebar Header */}
      {isWeb && (
        <View className="w-full md:w-64 bg-surface-card border-b md:border-b-0 md:border-r border-surface-border p-4 justify-between">
          <View>
            <Text className="text-xl font-bold text-white mb-6 tracking-wide">LEARNING APP</Text>
            
            <TouchableOpacity
              onPress={() => router.push('/(student)')}
              className={`p-3 rounded-xl mb-2 ${pathname === '/' || pathname === '/(student)' ? 'bg-brand-600' : 'bg-transparent'}`}
            >
              <Text className="text-white font-semibold">Course Catalog</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(student)/certificates' as any)}
              className={`p-3 rounded-xl mb-2 ${pathname.includes('certificates') ? 'bg-brand-600' : 'bg-transparent'}`}
            >
              <Text className="text-white font-semibold">My Certificates</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(student)/profile' as any)}
              className={`p-3 rounded-xl mb-2 ${pathname.includes('profile') ? 'bg-brand-600' : 'bg-transparent'}`}
            >
              <Text className="text-white font-semibold">Profile</Text>
            </TouchableOpacity>
          </View>

          {isAdmin && (
            <TouchableOpacity
              onPress={() => router.push('/admin' as any)}
              className="p-3 bg-amber-600/30 border border-amber-500/50 rounded-xl"
            >
              <Text className="text-amber-300 font-bold text-center">Admin Panel →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Main Content Area */}
      <View className="flex-1">
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#1E293B' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: 'bold' },
            contentStyle: { backgroundColor: '#0F172A' },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Course Catalog' }} />
          <Stack.Screen name="course/[courseId]" options={{ title: 'Course Details' }} />
          <Stack.Screen name="lesson/[courseId]/[lessonId]" options={{ title: 'Lesson Player' }} />
          <Stack.Screen name="exam/[courseId]" options={{ title: 'Final Exam' }} />
          <Stack.Screen name="certificates" options={{ title: 'My Certificates' }} />
          <Stack.Screen name="profile" options={{ title: 'Profile & Account' }} />
        </Stack>
      </View>
    </View>
  );
}
