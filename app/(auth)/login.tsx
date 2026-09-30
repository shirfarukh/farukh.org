import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/features/auth/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('student@example.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(student)');
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <View className="flex-1 justify-center max-w-md w-full self-center py-8">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-white mb-2">Welcome Back</Text>
          <Text className="text-slate-400 text-base">Sign in to continue your learning journey</Text>
        </View>

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

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/reset-password')}
          className="align-self-end mb-6"
        >
          <Text className="text-brand-400 font-semibold text-sm">Forgot Password?</Text>
        </TouchableOpacity>

        <Button
          title="Sign In"
          onPress={handleLogin}
          loading={loading}
          className="mb-6"
        />

        <View className="flex-row justify-center items-center">
          <Text className="text-slate-400 text-sm">Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text className="text-brand-400 font-bold text-sm">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}
