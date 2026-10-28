import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter, usePathname, Redirect } from 'expo-router';
import { useAuth } from '../../src/features/auth/useAuth';
import { useTheme } from '../../src/features/theme/ThemeContext';
import { AppLogo } from '../../src/components/ui/AppLogo';
import { Badge } from '../../src/components/ui/Badge';
import { ThemeToggle } from '../../src/components/ui/ThemeToggle';
import { useTranslation } from 'react-i18next';

export default function InstructorLayout() {
  const { user, isInstructor, isAdmin, loading, logout } = useAuth();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (!user || (!isInstructor && !isAdmin)) {
    return <Redirect href="/(student)" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Top Instructor Header */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.headerBorder,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.push('/instructor' as any)}>
            <AppLogo size={36} showText={false} />
          </TouchableOpacity>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>
                {isPersian ? 'استودیوی مربیان' : 'Instructor Studio'}
              </Text>
              <Badge label="INSTRUCTOR" variant="success" />
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
              {user.displayName || user.email}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ThemeToggle />

          {/* Quick exit to Student Catalog */}
          <TouchableOpacity
            onPress={() => router.replace('/(student)' as any)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 12 }}>
              🎓 {isPersian ? 'نمای دانش‌آموز' : 'Student View'}
            </Text>
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity
              onPress={() => router.push('/admin' as any)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
                backgroundColor: colors.goldBg,
                borderWidth: 1,
                borderColor: colors.goldBorder,
              }}
            >
              <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 12 }}>
                ⚡ Admin
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Navigation Sub-Tabs */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.headerBorder,
          flexDirection: 'row',
          paddingHorizontal: 16,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.push('/instructor' as any)}
          style={{
            paddingVertical: 10,
            borderBottomWidth: pathname === '/instructor' ? 2 : 0,
            borderBottomColor: colors.gold,
          }}
        >
          <Text
            style={{
              color: pathname === '/instructor' ? colors.gold : colors.textSecondary,
              fontWeight: pathname === '/instructor' ? '800' : '600',
              fontSize: 13,
            }}
          >
            📚 {isPersian ? 'دوره‌های من' : 'My Courses'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/instructor/school-lessons' as any)}
          style={{
            paddingVertical: 10,
            borderBottomWidth: pathname.includes('/school-lessons') ? 2 : 0,
            borderBottomColor: colors.gold,
          }}
        >
          <Text
            style={{
              color: pathname.includes('/school-lessons') ? colors.gold : colors.textSecondary,
              fontWeight: pathname.includes('/school-lessons') ? '800' : '600',
              fontSize: 13,
            }}
          >
            🏫 {isPersian ? 'درس‌های مکتب' : 'School Lessons'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/instructor/requests' as any)}
          style={{
            paddingVertical: 10,
            borderBottomWidth: pathname === '/instructor/requests' ? 2 : 0,
            borderBottomColor: colors.gold,
          }}
        >
          <Text
            style={{
              color: pathname === '/instructor/requests' ? colors.gold : colors.textSecondary,
              fontWeight: pathname === '/instructor/requests' ? '800' : '600',
              fontSize: 13,
            }}
          >
            📋 {isPersian ? 'درخواست‌های بررسی' : 'Review Requests'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stack Content */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="courses/[courseId]" />
        <Stack.Screen name="school-lessons/index" />
        <Stack.Screen name="requests" />
        <Stack.Screen name="live/index" />
      </Stack>
    </View>
  );
}
