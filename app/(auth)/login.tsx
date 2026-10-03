import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/features/auth/useAuth';
import { AppLogo } from '../../src/components/ui/AppLogo';
import { LanguageSwitcher } from '../../src/components/ui/LanguageSwitcher';

export default function LoginScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const { login } = useAuth();
  const isPersian = i18n.language?.startsWith('fa');

  const [email, setEmail] = useState('shir@secureai.be');
  const [password, setPassword] = useState('123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError(isPersian ? 'لطفا ایمیل و رمز عبور خود را وارد کنید' : 'Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      const isKnownAdmin = ['shir@secureai.be', 'admin@example.com', 'admin@farukh.org'].includes(email.trim().toLowerCase());
      if (isKnownAdmin) {
        router.replace('/admin');
      } else {
        router.replace('/(student)');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      {/* Top Header Bar with Home & Language Switcher */}
      <View className="max-w-md w-full self-center flex-row justify-between items-center pt-2 pb-4 border-b border-surface-border/50 mb-6">
        <TouchableOpacity
          onPress={() => router.push('/(student)')}
          className="flex-row items-center bg-surface-card border border-surface-border px-3.5 py-2 rounded-xl"
        >
          <Text className="text-gold-300 font-bold text-xs">
            ← {isPersian ? 'صفحه اصلی' : 'Home'}
          </Text>
        </TouchableOpacity>

        <LanguageSwitcher />
      </View>

      <View className="flex-1 justify-center max-w-md w-full self-center py-4">
        <View className="mb-6 items-center text-center">
          <AppLogo size={88} showText className="mb-5 flex-col justify-center items-center text-center" />
          <Text className="text-3xl font-extrabold text-white mb-2">
            {isPersian ? 'ورود به حساب کاربری' : 'Welcome Back'}
          </Text>
          <Text className="text-slate-400 text-sm text-center">
            {isPersian ? 'جهت ادامه دوره‌ها و دسترسی به پنل وارد شوید' : 'Sign in to access your courses & dashboard'}
          </Text>
        </View>

        {error ? (
          <View className="bg-red-950/70 border border-red-800 p-3.5 rounded-xl mb-4">
            <Text className="text-red-300 text-xs font-medium">{error}</Text>
          </View>
        ) : null}

        <Input
          label={isPersian ? 'آدرس ایمیل' : 'Email Address'}
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label={isPersian ? 'رمز عبور' : 'Password'}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/reset-password')}
          className="align-self-end mb-6"
        >
          <Text className="text-gold-400 font-semibold text-xs">
            {isPersian ? 'فراموشی رمز عبور؟' : 'Forgot Password?'}
          </Text>
        </TouchableOpacity>

        <Button
          title={isPersian ? 'ورود به حساب' : 'Sign In'}
          onPress={handleLogin}
          loading={loading}
          className="mb-6 shadow-lg shadow-brand-900"
        />

        <View className="flex-row justify-center items-center">
          <Text className="text-slate-400 text-sm">
            {isPersian ? 'حساب کاربری ندارید؟ ' : "Don't have an account? "}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text className="text-gold-400 font-bold text-sm">
              {isPersian ? 'ثبت‌نام جدید' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}
