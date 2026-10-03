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

export default function RegisterScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const { register } = useAuth();
  const isPersian = i18n.language?.startsWith('fa');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    if (!name || !email || !password) {
      setError(isPersian ? 'لطفا تمامی فیلدها را تکمیل کنید' : 'Please fill in all fields');
      return;
    }
    if (password.length < 3) {
      setError(isPersian ? 'رمز عبور حداقل باید ۳ کاراکتر باشد' : 'Password must be at least 3 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name);
      router.replace('/(student)');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
            {isPersian ? 'ایجاد حساب کاربری جدید' : 'Create Account'}
          </Text>
          <Text className="text-slate-400 text-sm text-center">
            {isPersian ? 'به جامعه کارآفرینان و فراگیران بپیوندید' : 'Start learning with interactive courses'}
          </Text>
        </View>

        {error ? (
          <View className="bg-red-950/70 border border-red-800 p-3.5 rounded-xl mb-4">
            <Text className="text-red-300 text-xs font-medium">{error}</Text>
          </View>
        ) : null}

        <Input
          label={isPersian ? 'نام و نام خانوادگی' : 'Full Name'}
          value={name}
          onChangeText={setName}
          placeholder="Jane Doe"
        />

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

        <Button
          title={isPersian ? 'ثبت‌نام و شروع' : 'Sign Up'}
          onPress={handleRegister}
          loading={loading}
          className="mb-6 mt-2 shadow-lg shadow-brand-900"
        />

        <View className="flex-row justify-center items-center">
          <Text className="text-slate-400 text-sm">
            {isPersian ? 'قبلا ثبت‌نام کرده‌اید؟ ' : 'Already have an account? '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text className="text-gold-400 font-bold text-sm">
              {isPersian ? 'ورود به حساب' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}
