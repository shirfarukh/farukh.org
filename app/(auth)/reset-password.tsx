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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const { resetPassword } = useAuth();
  const isPersian = i18n.language?.startsWith('fa');

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setError('');
    setMessage('');
    if (!email) {
      setError(isPersian ? 'لطفا ایمیل خود را وارد نمایید' : 'Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setMessage(
        isPersian
          ? 'دستورالعمل بازیابی رمز عبور به ایمیل شما ارسال شد.'
          : 'Password reset instructions have been sent to your email.'
      );
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
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
            {isPersian ? 'بازیابی رمز عبور' : 'Reset Password'}
          </Text>
          <Text className="text-slate-400 text-sm text-center">
            {isPersian ? 'ایمیل خود را جهت دریافت لینک بازیابی وارد نمایید' : 'Enter your email to receive password reset instructions'}
          </Text>
        </View>

        {message ? (
          <View className="bg-emerald-950/70 border border-emerald-800 p-3.5 rounded-xl mb-4">
            <Text className="text-emerald-300 text-xs font-medium">{message}</Text>
          </View>
        ) : null}

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

        <Button
          title={isPersian ? 'ارسال لینک بازیابی' : 'Send Reset Instructions'}
          onPress={handleReset}
          loading={loading}
          className="mb-6 mt-2 shadow-lg shadow-brand-900"
        />

        <View className="flex-row justify-center items-center">
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text className="text-gold-400 font-bold text-sm">
              ← {isPersian ? 'بازگشت به صفحه ورود' : 'Back to Login'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}
