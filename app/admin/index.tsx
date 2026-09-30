import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';

export default function AdminDashboardScreen() {
  const router = useRouter();

  return (
    <ScreenWrapper>
      <View className="max-w-4xl w-full self-center">
        <Text className="text-2xl font-bold text-white mb-6">Platform Overview</Text>

        {/* Metrics Grid */}
        <View className="flex-row flex-wrap justify-between mb-6">
          <View className="w-[48%] bg-surface-card border border-surface-border p-4 rounded-2xl mb-4">
            <Text className="text-slate-400 text-xs font-medium mb-1">Total Courses</Text>
            <Text className="text-3xl font-bold text-white">2</Text>
          </View>
          <View className="w-[48%] bg-surface-card border border-surface-border p-4 rounded-2xl mb-4">
            <Text className="text-slate-400 text-xs font-medium mb-1">Active Students</Text>
            <Text className="text-3xl font-bold text-brand-400">12</Text>
          </View>
          <View className="w-[48%] bg-surface-card border border-surface-border p-4 rounded-2xl mb-4">
            <Text className="text-slate-400 text-xs font-medium mb-1">Certificates Issued</Text>
            <Text className="text-3xl font-bold text-emerald-400">8</Text>
          </View>
          <View className="w-[48%] bg-surface-card border border-surface-border p-4 rounded-2xl mb-4">
            <Text className="text-slate-400 text-xs font-medium mb-1">Exam Pass Rate</Text>
            <Text className="text-3xl font-bold text-amber-400">85%</Text>
          </View>
        </View>

        {/* Quick Navigation Cards */}
        <Text className="text-lg font-semibold text-white mb-3">Management</Text>

        <Card onPress={() => router.push('/admin/courses')}>
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white text-lg font-bold">Course & Content Management</Text>
              <Text className="text-slate-400 text-sm mt-0.5">
                Create, edit modules, lessons, YouTube links, and question banks
              </Text>
            </View>
            <Text className="text-brand-400 text-xl font-bold">→</Text>
          </View>
        </Card>
      </View>
    </ScreenWrapper>
  );
}
