import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/features/auth/useAuth';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
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
      <View className="flex-1 justify-center max-w-md w-full self-center py-8">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-white mb-2">Create Account</Text>
          <Text className="text-slate-400 text-base">Start learning with interactive courses</Text>
        </View>

        {error ? (
          <View className="bg-red-950/60 border border-red-800 p-3.5 rounded-xl mb-4">
            <Text className="text-red-300 text-sm font-medium">{error}</Text>
          </View>
        ) : null}

        <Input
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="Jane Doe"
        />

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
          placeholder="At least 6 characters"
          secureTextEntry
        />

        <Button
          title="Sign Up"
          onPress={handleRegister}
          loading={loading}
          className="mb-6 mt-2"
        />

        <View className="flex-row justify-center items-center">
          <Text className="text-slate-400 text-sm">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text className="text-brand-400 font-bold text-sm">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}
