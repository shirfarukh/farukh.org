import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/features/auth/useAuth';
import { AppLogo } from '../../src/components/ui/AppLogo';
import { LanguageSwitcher } from '../../src/components/ui/LanguageSwitcher';

export default function StudentLayout() {
  const { user, isAdmin, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');
  const username = user?.email ? user.email.split('@')[0] : (user?.displayName || 'Student');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <View className="flex-1 bg-surface-dark justify-center items-center">
        <ActivityIndicator size="large" color="#FACC15" />
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
    <View className="flex-1 flex-col md:flex-row bg-surface-dark">
      {/* Desktop / Web Left Sidebar */}
      {isWeb && (
        <View className="hidden md:flex w-72 bg-surface-card border-r border-surface-border p-5 justify-between">
          <View>
            <TouchableOpacity onPress={() => router.push('/(student)')} className="mb-6">
              <AppLogo size={48} showText />
            </TouchableOpacity>

            {/* Language Switcher in Sidebar */}
            <View className="mb-6 bg-surface-dark/60 p-2 rounded-2xl border border-surface-border/60">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1.5">
                🌐 Language / زبان
              </Text>
              <LanguageSwitcher />
            </View>

            <View className="mb-2">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">
                MAIN MENU
              </Text>
              {navItems.map((item) => {
                const active = isCurrentActive(item.path);
                return (
                  <TouchableOpacity
                    key={item.path}
                    onPress={() => handleNavClick(item)}
                    className={`flex-row items-center gap-3 p-3.5 rounded-2xl mb-2 border transition-all ${
                      active
                        ? 'bg-brand-600 border-gold-400/70 shadow-lg shadow-brand-900/50'
                        : 'bg-transparent border-transparent hover:bg-surface-hover'
                    }`}
                  >
                    <Text className="text-lg">{item.icon}</Text>
                    <Text className={`font-semibold text-sm ${active ? 'text-white font-bold' : 'text-slate-300'}`}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="border-t border-surface-border/60 pt-4 gap-2">
            {user ? (
              <>
                {isAdmin && (
                  <TouchableOpacity
                    onPress={() => router.push('/admin' as any)}
                    className="p-3 bg-gradient-to-r from-amber-600/30 to-gold-600/30 border border-gold-400/50 rounded-2xl mb-2 flex-row items-center justify-between"
                  >
                    <Text className="text-gold-300 font-bold text-sm">⚡ Admin Dashboard</Text>
                    <Text className="text-gold-400 font-extrabold">→</Text>
                  </TouchableOpacity>
                )}
                <View className="p-3.5 bg-surface-dark/80 rounded-2xl border border-surface-border/60 gap-2.5">
                  <View className="flex-row items-center gap-2.5">
                    <View className="w-9 h-9 rounded-full bg-brand-600 border border-gold-400/60 items-center justify-center">
                      <Text className="text-white font-black text-sm">
                        {username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-400 text-[10px] font-semibold">
                        {isPersian ? 'خوش آمدید' : 'Welcome,'}
                      </Text>
                      <Text className="text-white font-extrabold text-sm truncate">
                        {username}
                      </Text>
                      <Text className="text-gold-400 text-[10px] font-bold uppercase">
                        {isAdmin ? 'Admin' : 'Student'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={logout}
                    className="p-2 bg-red-950/60 hover:bg-red-900/60 rounded-xl border border-red-800/60 items-center flex-row justify-center gap-1.5"
                  >
                    <Text className="text-red-300 text-xs font-bold">
                      🚪 {isPersian ? 'خروج از حساب' : 'Log Out'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View className="gap-2">
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/login')}
                  className="p-3.5 bg-brand-600 border border-gold-400/60 rounded-2xl items-center shadow-md"
                >
                  <Text className="text-white font-bold text-sm">{t('signIn', 'Sign In')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/register')}
                  className="p-3 bg-surface-dark border border-surface-border rounded-2xl items-center"
                >
                  <Text className="text-gold-300 font-bold text-xs">{t('signUp', 'Sign Up')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Mobile Header Bar */}
      <View className="flex-1 flex-col">
        <View className="md:hidden flex-row items-center justify-between bg-surface-card border-b border-surface-border px-3 py-2.5">
          <TouchableOpacity onPress={() => router.push('/(student)')}>
            <AppLogo size={36} showText />
          </TouchableOpacity>

          <View className="flex-row items-center gap-2">
            {user ? (
              <View className="flex-row items-center gap-1.5">
                <View className="bg-brand-950/80 border border-brand-500/40 px-2.5 py-1 rounded-full flex-row items-center gap-1">
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <Text className="text-brand-300 text-[11px] font-bold max-w-[100px] truncate">
                    {username}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={logout}
                  className="bg-red-950/70 border border-red-700/60 px-2 py-1 rounded-lg"
                >
                  <Text className="text-red-300 text-[10px] font-bold">
                    {isPersian ? 'خروج' : 'Log Out'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login')}
                className="bg-brand-600 border border-gold-400/40 px-2.5 py-1 rounded-lg"
              >
                <Text className="text-white text-xs font-bold">{t('signIn', 'Sign In')}</Text>
              </TouchableOpacity>
            )}
            <LanguageSwitcher />
            <TouchableOpacity
              onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-surface-dark border border-surface-border"
            >
              <Text className="text-gold-400 font-bold text-base">{mobileMenuOpen ? '✕' : '☰'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mobile Slide-out Menu Drawer */}
        {mobileMenuOpen && (
          <View className="md:hidden bg-surface-card border-b border-surface-border p-4 shadow-2xl z-50">
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Navigation</Text>
              {navItems.map((item) => {
                const active = isCurrentActive(item.path);
                return (
                  <TouchableOpacity
                    key={item.path}
                    onPress={() => {
                      setMobileMenuOpen(false);
                      handleNavClick(item);
                    }}
                    className={`flex-row items-center gap-3 p-3 rounded-xl mb-1.5 border ${
                      active ? 'bg-brand-600 border-gold-400' : 'bg-surface-dark/50 border-surface-border/40'
                    }`}
                  >
                    <Text className="text-base">{item.icon}</Text>
                    <Text className={`font-semibold text-sm ${active ? 'text-white font-bold' : 'text-slate-300'}`}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {user ? (
              <>
                <View className="p-3 bg-surface-dark/90 border border-surface-border/60 rounded-xl mb-3 flex-row items-center gap-2.5">
                  <View className="w-8 h-8 rounded-full bg-brand-600 items-center justify-center">
                    <Text className="text-white font-black text-xs">{username.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-400 text-[10px]">
                      {isPersian ? 'خوش آمدید' : 'Welcome,'}
                    </Text>
                    <Text className="text-white font-bold text-xs truncate">{username}</Text>
                  </View>
                  <Text className="text-gold-400 text-[10px] font-bold uppercase">{isAdmin ? 'Admin' : 'Student'}</Text>
                </View>

                {isAdmin && (
                  <TouchableOpacity
                    onPress={() => {
                      setMobileMenuOpen(false);
                      router.push('/admin' as any);
                    }}
                    className="p-3 bg-amber-600/30 border border-gold-400/50 rounded-xl mb-2"
                  >
                    <Text className="text-gold-300 font-bold text-center text-sm">⚡ Admin Panel →</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="p-3 bg-red-950/70 border border-red-800 rounded-xl flex-row items-center justify-center gap-1.5"
                >
                  <Text className="text-red-300 font-bold text-center text-xs">
                    🚪 {isPersian ? 'خروج از حساب' : 'Log Out'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View className="flex-row gap-2 mt-2">
                <TouchableOpacity
                  onPress={() => {
                    setMobileMenuOpen(false);
                    router.push('/(auth)/login');
                  }}
                  className="flex-1 p-3 bg-brand-600 border border-gold-400/60 rounded-xl items-center"
                >
                  <Text className="text-white font-bold text-xs">{t('signIn', 'Sign In')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setMobileMenuOpen(false);
                    router.push('/(auth)/register');
                  }}
                  className="flex-1 p-3 bg-surface-dark border border-surface-border rounded-xl items-center"
                >
                  <Text className="text-gold-300 font-bold text-xs">{t('signUp', 'Sign Up')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Main Screen Content */}
        <View className="flex-1" style={isWeb ? ({ flex: 1, overflowY: 'auto' } as any) : { flex: 1 }}>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#091430' },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: { fontWeight: 'bold' },
              contentStyle: { backgroundColor: '#030819' },
              headerRight: () => (
                <View className="mr-3 flex-row items-center gap-2.5">
                  {user ? (
                    <View className="flex-row items-center gap-2">
                      <View className="bg-brand-900/60 border border-brand-500/40 px-3 py-1 rounded-full flex-row items-center gap-1.5">
                        <View className="w-2 h-2 rounded-full bg-emerald-400" />
                        <Text className="text-brand-200 text-xs font-bold">
                          {isPersian ? `خوش آمدید، ${username}` : `Welcome, ${username}`}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={logout}
                        className="bg-red-950/60 border border-red-700/60 px-2.5 py-1 rounded-xl"
                      >
                        <Text className="text-red-300 font-bold text-xs">
                          {isPersian ? 'خروج' : 'Log Out'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-1.5">
                      <TouchableOpacity
                        onPress={() => router.push('/(auth)/login')}
                        className="bg-brand-600 border border-gold-400/50 px-3 py-1 rounded-xl shadow-sm"
                      >
                        <Text className="text-white font-bold text-xs">{t('signIn', 'Sign In')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => router.push('/(auth)/register')}
                        className="bg-surface-dark border border-surface-border px-2.5 py-1 rounded-xl"
                      >
                        <Text className="text-gold-300 font-bold text-xs">{t('signUp', 'Sign Up')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <LanguageSwitcher />
                  <AppLogo size={32} />
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
        <View className="md:hidden flex-row bg-surface-card border-t border-surface-border justify-around py-2 px-1">
          {navItems.map((item) => {
            const active = isCurrentActive(item.path);
            return (
              <TouchableOpacity
                key={item.path}
                onPress={() => handleNavClick(item)}
                className="items-center py-1 px-3"
              >
                <Text className={`text-xl mb-0.5 ${active ? 'scale-110' : 'opacity-70'}`}>{item.icon}</Text>
                <Text
                  className={`text-[10px] font-semibold ${
                    active ? 'text-gold-400 font-bold' : 'text-slate-400'
                  }`}
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
