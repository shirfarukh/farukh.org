import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { View, ActivityIndicator } from 'react-native';
import { queryClient } from '../src/lib/queryClient';
import { useAuth } from '../src/features/auth/useAuth';
import { usePresence } from '../src/hooks/usePresence';
import { ThemeProvider, useTheme } from '../src/features/theme/ThemeContext';
import '../src/lib/i18n';
import '../global.css';

function RootLayoutNav() {
  const { user, isAdmin, isInstructor, loading } = useAuth();
  const { colors } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  // Start RTDB presence tracking when user is authenticated
  usePresence();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === 'admin';
    const inInstructorGroup = segments[0] === 'instructor';

    if (!user && (inAdminGroup || inInstructorGroup)) {
      router.replace('/(auth)/login');
    } else if (user && inAdminGroup && !isAdmin) {
      router.replace('/(student)');
    } else if (user && inInstructorGroup && !isInstructor && !isAdmin) {
      router.replace('/(student)');
    }
  }, [user, isAdmin, isInstructor, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(student)" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="instructor" />
      <Stack.Screen
        name="verify/[certificateId]"
        options={{
          title: 'Verify Certificate',
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

