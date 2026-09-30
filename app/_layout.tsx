import React from 'react';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/lib/queryClient';
import '../src/lib/i18n';
import '../global.css';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0F172A' } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="verify/[certificateId]" options={{ title: 'Verify Certificate', headerShown: true, headerStyle: { backgroundColor: '#1E293B' }, headerTintColor: '#FFF' }} />
      </Stack>
    </QueryClientProvider>
  );
}
