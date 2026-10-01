import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/features/auth/useAuth';
import { AppLogo } from '../../src/components/ui/AppLogo';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setError('');
    setMessage('');
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setMessage('Password reset instructions have been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <View className="flex-1 justify-center max-w-md w-full self-center py-8">
        <View className="mb-8 items-center text-center">
          <AppLogo size={96} showText className="mb-6 flex-col justify-center items-center text-center" />
          <Text className="text-3xl font-bold text-white mb-2">Reset Password</Text>
          <Text className="text-slate-400 text-base text-center">Enter your email to receive password reset instructions</Text>
        </View>

        {message ? (
          <View className="bg-emerald-950/60 border border-emerald-800 p-3.5 rounded-xl mb-4">
            <Text className="text-emerald-300 text-sm font-medium">{message}</Text>
          </View>
        ) : null}

        {error ? (
          <View className="bg-red-950/60 border border-red-800 p-3.5 rounded-xl mb-4">
            <Text className="text-red-300 text-sm font-medium">{error}</Text>
          </View>
        ) : null}

        <Input
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Button
          title="Send Reset Instructions"
          onPress={handleReset}
          loading={loading}
          className="mb-6 mt-2"
        />

        <View className="flex-row justify-center items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-slate-300 font-bold text-sm">Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}
