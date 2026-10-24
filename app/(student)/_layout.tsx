import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, ActivityIndicator, Image } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/features/auth/useAuth';
import { AppLogo } from '../../src/components/ui/AppLogo';
import { HeaderPreferences } from '../../src/components/ui/HeaderPreferences';
import { useTheme } from '../../src/features/theme/ThemeContext';
import { ScrollHeaderProvider, useScrollHeader } from '../../src/features/theme/ScrollHeaderContext';

export default function StudentLayout() {
  return (
    <ScrollHeaderProvider>
      <StudentLayoutContent />
    </ScrollHeaderProvider>
  );
}

function StudentLayoutContent() {
  const { user, isAdmin, isInstructor, loading, logout } = useAuth();
  const { isDark, colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { scrollY } = useScrollHeader();
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
    { label: isPersian ? 'دوره‌های آموزشی' : 'Courses', path: '/(student)', icon: '📚' },
    {
      label: isPersian ? 'مکتب رسمی دختران' : 'Girls Academic School',
      path: '/(student)/school',
      icon: '🎓',
      special: true,
      badge: isPersian ? 'صنوف ۷-۱۲' : 'Grades 7–12',
    },
    { label: t('community', 'Community'), path: '/(student)/community', icon: '💬' },
    { label: t('blog', 'Blog & Insights'), path: '/(student)/blog', icon: '✍️' },
    { label: t('about', 'About Us'), path: '/(student)/about', icon: '🏛️' },
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
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
                      {item.special && (
                        <View
                          style={{
                            backgroundColor: isDark ? 'rgba(250, 204, 21, 0.15)' : 'rgba(250, 204, 21, 0.2)',
                            borderColor: colors.goldBorder,
                            borderWidth: 1,
                            borderRadius: 99,
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                          }}
                        >
                          <Text style={{ color: colors.gold, fontSize: 9.5, fontWeight: '800' }}>
                            {isPersian ? 'اختصاصی' : 'SPECIAL'}
                          </Text>
                        </View>
                      )}
                    </View>
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
                {(isInstructor || isAdmin) && (
                  <TouchableOpacity
                    onPress={() => router.push('/instructor' as any)}
                    style={{
                      padding: 12,
                      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                      borderWidth: 1,
                      borderColor: isDark ? '#3B82F6' : '#93C5FD',
                      borderRadius: 14,
                      marginBottom: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ color: isDark ? '#60A5FA' : '#1D4ED8', fontWeight: '800', fontSize: 13 }}>
                      🎓 {isPersian ? 'پنل مربیگری' : 'Instructor Portal'}
                    </Text>
                    <Text style={{ color: isDark ? '#60A5FA' : '#1D4ED8', fontWeight: '900' }}>→</Text>
                  </TouchableOpacity>
                )}
                {!isAdmin && !isInstructor && (
                  <TouchableOpacity
                    onPress={() => router.push('/(student)/become-instructor' as any)}
                    style={{
                      padding: 10,
                      backgroundColor: colors.cardHover,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      borderRadius: 14,
                      marginBottom: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>
                      ✨ {isPersian ? 'مربی شوید' : 'Teach on FARUKH'}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>→</Text>
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

      {/* Mobile Suspended Glassy Header & Content */}
      <View className="flex-1 flex-col">
        {/* Suspended Glassy Header - Merged Logo & Language/Theme Bar */}
        <View
          style={{
            position: 'absolute',
            top: Math.max(insets.top, 8) + 6,
            left: 12,
            right: 12,
            zIndex: 50,
            height: 52,
            borderRadius: 99,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            backgroundColor: isDark
              ? `rgba(15, 23, 42, ${(0.88 - Math.min(Math.max(scrollY / 120, 0), 1) * 0.53).toFixed(2)})`
              : `rgba(255, 255, 255, ${(0.93 - Math.min(Math.max(scrollY / 120, 0), 1) * 0.53).toFixed(2)})`,
            borderWidth: 1,
            borderColor: isDark
              ? `rgba(250, 204, 21, ${(0.28 - Math.min(Math.max(scrollY / 120, 0), 1) * 0.15).toFixed(2)})`
              : `rgba(0, 0, 0, ${(0.16 - Math.min(Math.max(scrollY / 120, 0), 1) * 0.08).toFixed(2)})`,
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            elevation: 8,
            ...(Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                } as any)
              : {}),
          }}
          className="md:hidden"
        >
          {/* Left: Back button if subpage, and Logo with Title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 6 }}>
            {router.canGoBack() && pathname !== '/' && pathname !== '/(student)' && (
              <TouchableOpacity
                onPress={() => router.back()}
                accessibilityLabel="Back"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.gold, fontWeight: '900', fontSize: 16 }}>‹</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => router.push('/(student)')}
              activeOpacity={0.8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#0F172A',
                  borderWidth: 1.5,
                  borderColor: '#FACC15',
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  source={require('../../assets/logo.png')}
                  style={{ width: 28, height: 28, borderRadius: 14 }}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={{
                  color: colors.text,
                  fontWeight: '900',
                  fontSize: 14,
                  letterSpacing: 0.5,
                }}
                numberOfLines={1}
              >
                FARUKH<Text style={{ color: colors.gold }}>.ORG</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Right: Merged Language & Theme Pill + Menu Toggle */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <HeaderPreferences compact />

            <TouchableOpacity
              onPress={() => setMobileMenuOpen((prev) => !prev)}
              accessibilityLabel="Toggle Menu"
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(250, 204, 21, 0.25)' : 'rgba(0, 0, 0, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.gold, fontWeight: '900', fontSize: 15 }}>
                {mobileMenuOpen ? '✕' : '☰'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mobile Slide-out Menu Drawer - Suspended Floating Sheet */}
        {mobileMenuOpen && (
          <View
            style={{
              position: 'absolute',
              top: Math.max(insets.top, 8) + 64,
              left: 12,
              right: 12,
              zIndex: 49,
              backgroundColor: isDark
                ? 'rgba(15, 23, 42, 0.96)'
                : 'rgba(255, 255, 255, 0.96)',
              borderRadius: 22,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(250, 204, 21, 0.3)' : 'rgba(0, 0, 0, 0.1)',
              padding: 16,
              shadowColor: '#000',
              shadowOpacity: 0.35,
              shadowRadius: 18,
              elevation: 14,
              ...(Platform.OS === 'web'
                ? ({
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  } as any)
                : {}),
            }}
            className="md:hidden"
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
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
                      {item.special && (
                        <View
                          style={{
                            backgroundColor: isDark ? 'rgba(250, 204, 21, 0.15)' : 'rgba(250, 204, 21, 0.2)',
                            borderColor: colors.goldBorder,
                            borderWidth: 1,
                            borderRadius: 99,
                            paddingHorizontal: 7,
                            paddingVertical: 1.5,
                          }}
                        >
                          <Text style={{ color: colors.gold, fontSize: 9, fontWeight: '800' }}>
                            {isPersian ? 'اختصاصی' : 'SPECIAL'}
                          </Text>
                        </View>
                      )}
                    </View>
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
                {(isInstructor || isAdmin) && (
                  <TouchableOpacity
                    onPress={() => {
                      setMobileMenuOpen(false);
                      router.push('/instructor' as any);
                    }}
                    style={{
                      padding: 12,
                      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF',
                      borderWidth: 1,
                      borderColor: isDark ? '#3B82F6' : '#93C5FD',
                      borderRadius: 12,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: isDark ? '#60A5FA' : '#1D4ED8', fontWeight: '800', textAlign: 'center', fontSize: 13 }}>
                      🎓 {isPersian ? 'پنل مربیگری' : 'Instructor Portal'} →
                    </Text>
                  </TouchableOpacity>
                )}
                {!isAdmin && !isInstructor && (
                  <TouchableOpacity
                    onPress={() => {
                      setMobileMenuOpen(false);
                      router.push('/(student)/become-instructor' as any);
                    }}
                    style={{
                      padding: 10,
                      backgroundColor: colors.cardHover,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      borderRadius: 12,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: '700', textAlign: 'center', fontSize: 12 }}>
                      ✨ {isPersian ? 'مربی شوید (ارسال درخواست)' : 'Teach on FARUKH (Apply)'}
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
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="school" options={{ headerShown: false }} />
            <Stack.Screen name="community/index" options={{ headerShown: false }} />
            <Stack.Screen name="blog/index" options={{ headerShown: false }} />
            <Stack.Screen name="blog/[blogId]" options={{ headerShown: false }} />
            <Stack.Screen name="about" options={{ headerShown: false }} />
            <Stack.Screen name="course/[courseId]" options={{ headerShown: false }} />
            <Stack.Screen name="lesson/[courseId]/[lessonId]" options={{ headerShown: false }} />
            <Stack.Screen name="exam/[courseId]" options={{ headerShown: false }} />
            <Stack.Screen name="certificates" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
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
