import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/features/auth/useAuth';
import { AppLogo } from '../../src/components/ui/AppLogo';
import { HeaderPreferences } from '../../src/components/ui/HeaderPreferences';
import { useTheme } from '../../src/features/theme/ThemeContext';

export default function StudentLayout() {
  const { user, isAdmin, loading, logout } = useAuth();
  const { isDark, colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');
  const username = user?.email ? user.email.split('@')[0] : (user?.displayName || 'Student');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  const isWeb = Platform.OS === 'web';

  const navItems = [
    { label: t('catalog', 'Course Catalog'), path: '/(student)', icon: '📚' },
    { label: t('blog', 'Blog & Insights'), path: '/(student)/blog', icon: '✍️' },
    { label: t('myCertificates', 'My Certificates'), path: '/(student)/certificates', icon: '🎓', protected: true },
    { label: t('profile', 'Profile & Account'), path: '/(student)/profile', icon: '👤', protected: true },
  ];

  const isCurrentActive = (targetPath: string) => {
    if (targetPath === '/(student)') {
      return pathname === '/' || pathname === '/(student)';
    }
    return pathname.includes(targetPath.replace('/(student)/', ''));
  };

  const handleNavClick = (item: { path: string; protected?: boolean }) => {
    if (item.protected && !user) {
      router.push('/(auth)/login');
      return;
    }
    router.push(item.path as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} className="flex-col md:flex-row">
      {/* Desktop / Web Left Sidebar */}
      {isWeb && (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRightWidth: 1,
            borderRightColor: colors.headerBorder,
          }}
          className="hidden md:flex w-72 p-5 justify-between"
        >
          <View>
            <TouchableOpacity onPress={() => router.push('/(student)')} className="mb-5">
              <AppLogo size={46} showText />
            </TouchableOpacity>

            {/* Language & Theme Controls Group */}
            <View
              style={{
                backgroundColor: colors.cardHover,
                borderColor: colors.cardBorder,
                borderWidth: 1,
                borderRadius: 16,
                padding: 10,
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                  paddingHorizontal: 4,
                }}
              >
                {isPersian ? 'تنظیمات و زبان' : 'PREFERENCES'}
              </Text>
              <HeaderPreferences />
            </View>

            <View className="mb-2">
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                  paddingHorizontal: 8,
                }}
              >
                {isPersian ? 'منوی اصلی' : 'MAIN MENU'}
              </Text>
              {navItems.map((item) => {
                const active = isCurrentActive(item.path);
                return (
                  <TouchableOpacity
                    key={item.path}
                    onPress={() => handleNavClick(item)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      borderRadius: 14,
                      marginBottom: 6,
                      backgroundColor: active
                        ? isDark
                          ? '#1D4ED8'
                          : '#EFF6FF'
                        : 'transparent',
                      borderWidth: 1,
                      borderColor: active
                        ? isDark
                          ? colors.gold
                          : '#BFDBFE'
                        : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: active ? '700' : '600',
                        color: active
                          ? isDark
                            ? '#FFFFFF'
                            : colors.primary
                          : colors.textSecondary,
                      }}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: colors.headerBorder, paddingTop: 16, gap: 8 }}>
            {user ? (
              <>
                {isAdmin && (
                  <TouchableOpacity
                    onPress={() => router.push('/admin' as any)}
                    style={{
                      padding: 12,
                      backgroundColor: colors.goldBg,
                      borderWidth: 1,
                      borderColor: colors.goldBorder,
                      borderRadius: 14,
                      marginBottom: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 13 }}>⚡ Admin Dashboard</Text>
                    <Text style={{ color: colors.gold, fontWeight: '900' }}>→</Text>
                  </TouchableOpacity>
                )}
                <View
                  style={{
                    padding: 14,
                    backgroundColor: colors.cardHover,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    gap: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: colors.primary,
                        borderWidth: 1.5,
                        borderColor: colors.gold,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>
                        {username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600' }}>
                        {isPersian ? 'خوش آمدید' : 'Welcome,'}
                      </Text>
                      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13 }} numberOfLines={1}>
                        {username}
                      </Text>
                      <Text style={{ color: colors.gold, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>
                        {isAdmin ? 'Admin' : 'Student'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={logout}
                    style={{
                      padding: 8,
                      backgroundColor: colors.dangerBg,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colors.danger,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '700' }}>
                      🚪 {isPersian ? 'خروج از حساب' : 'Log Out'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/login')}
                  style={{
                    padding: 12,
                    backgroundColor: colors.primary,
                    borderRadius: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{t('signIn', 'Sign In')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/register')}
                  style={{
                    padding: 11,
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    borderRadius: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>{t('signUp', 'Sign Up')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Mobile Top Header Bar - Optimized & Decluttered */}
      <View className="flex-1 flex-col">
        <View
          style={{
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.headerBorder,
          }}
          className="md:hidden flex-row items-center justify-between px-3 py-2.5"
        >
          <TouchableOpacity onPress={() => router.push('/(student)')}>
            <AppLogo size={34} showText />
          </TouchableOpacity>

          {/* Grouped, Space-Optimized Header Actions */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {/* Unified Language & Theme Pill */}
            <HeaderPreferences compact />

            {/* Collapsed Menu Drawer Toggle */}
            <TouchableOpacity
              onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
              accessibilityLabel="Toggle Menu"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.cardHover,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.gold, fontWeight: '900', fontSize: 16 }}>
                {mobileMenuOpen ? '✕' : '☰'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mobile Slide-out Menu Drawer */}
        {mobileMenuOpen && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderBottomWidth: 1,
              borderBottomColor: colors.headerBorder,
              padding: 16,
              zIndex: 50,
            }}
            className="md:hidden shadow-2xl"
          >
            {user ? (
              <View
                style={{
                  padding: 12,
                  backgroundColor: colors.cardHover,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  borderRadius: 14,
                  marginBottom: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>
                    {username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                    {isPersian ? 'خوش آمدید' : 'Welcome,'}
                  </Text>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13 }} numberOfLines={1}>
                    {username}
                  </Text>
                </View>
                <Text style={{ color: colors.gold, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>
                  {isAdmin ? 'Admin' : 'Student'}
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                <TouchableOpacity
                  onPress={() => {
                    setMobileMenuOpen(false);
                    router.push('/(auth)/login');
                  }}
                  style={{
                    flex: 1,
                    padding: 10,
                    backgroundColor: colors.primary,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{t('signIn', 'Sign In')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setMobileMenuOpen(false);
                    router.push('/(auth)/register');
                  }}
                  style={{
                    flex: 1,
                    padding: 10,
                    backgroundColor: colors.cardHover,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>{t('signUp', 'Sign Up')}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View className="mb-3">
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                {isPersian ? 'صفحات برنامه' : 'NAVIGATION'}
              </Text>
              {navItems.map((item) => {
                const active = isCurrentActive(item.path);
                return (
                  <TouchableOpacity
                    key={item.path}
                    onPress={() => {
                      setMobileMenuOpen(false);
                      handleNavClick(item);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      borderRadius: 12,
                      marginBottom: 6,
                      backgroundColor: active
                        ? isDark
                          ? '#1D4ED8'
                          : '#EFF6FF'
                        : 'transparent',
                      borderWidth: 1,
                      borderColor: active
                        ? isDark
                          ? colors.gold
                          : '#BFDBFE'
                        : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: active ? '700' : '600',
                        color: active
                          ? isDark
                            ? '#FFFFFF'
                            : colors.primary
                          : colors.textSecondary,
                      }}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {user && (
              <>
                {isAdmin && (
                  <TouchableOpacity
                    onPress={() => {
                      setMobileMenuOpen(false);
                      router.push('/admin' as any);
                    }}
                    style={{
                      padding: 12,
                      backgroundColor: colors.goldBg,
                      borderWidth: 1,
                      borderColor: colors.goldBorder,
                      borderRadius: 12,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: colors.gold, fontWeight: '800', textAlign: 'center', fontSize: 13 }}>
                      ⚡ Admin Panel →
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  style={{
                    padding: 10,
                    backgroundColor: colors.dangerBg,
                    borderWidth: 1,
                    borderColor: colors.danger,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6,
                  }}
                >
                  <Text style={{ color: colors.danger, fontWeight: '700', fontSize: 12 }}>
                    🚪 {isPersian ? 'خروج از حساب' : 'Log Out'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Main Screen Content */}
        <View className="flex-1" style={isWeb ? ({ flex: 1, overflowY: 'auto' } as any) : { flex: 1 }}>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: 'bold' },
              contentStyle: { backgroundColor: colors.bg },
              headerRight: () => (
                <View style={{ marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <HeaderPreferences compact />
                </View>
              ),
            }}
          >
            <Stack.Screen name="index" options={{ title: 'FARUKH.ORG' }} />
            <Stack.Screen name="blog/index" options={{ title: 'Insights & Blog' }} />
            <Stack.Screen name="blog/[blogId]" options={{ title: 'Article' }} />
            <Stack.Screen name="course/[courseId]" options={{ title: 'Course Details' }} />
            <Stack.Screen name="lesson/[courseId]/[lessonId]" options={{ title: 'Lesson Player' }} />
            <Stack.Screen name="exam/[courseId]" options={{ title: 'Final Exam' }} />
            <Stack.Screen name="certificates" options={{ title: 'My Certificates' }} />
            <Stack.Screen name="profile" options={{ title: 'Profile & Account' }} />
          </Stack>
        </View>

        {/* Mobile Bottom Navigation Bar */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.headerBorder,
          }}
          className="md:hidden flex-row justify-around py-2 px-1"
        >
          {navItems.map((item) => {
            const active = isCurrentActive(item.path);
            return (
              <TouchableOpacity
                key={item.path}
                onPress={() => handleNavClick(item)}
                className="items-center py-1 px-3"
              >
                <Text style={{ fontSize: 18, marginBottom: 2, opacity: active ? 1 : 0.7 }}>
                  {item.icon}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: active ? '800' : '600',
                    color: active ? colors.gold : colors.textSecondary,
                  }}
                >
                  {item.label.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
