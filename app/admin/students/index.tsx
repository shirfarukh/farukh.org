import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, query, orderBy } from '@firebase/firestore';
import { httpsCallable } from '@firebase/functions';
import { db, functions } from '../../../src/lib/firebase';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { Badge } from '../../../src/components/ui/Badge';
import { UserProfile } from '../../../src/types/user';

export default function AdminStudentsScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['adminStudents'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
      return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
    },
  });

  const disableMutation = useMutation({
    mutationFn: async ({ uid, disabled }: { uid: string; disabled: boolean }) => {
      const fn = httpsCallable(functions, 'disableUser');
      await fn({ uid, disabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
    },
  });

  const resetProgressMutation = useMutation({
    mutationFn: async ({ uid, courseId }: { uid: string; courseId: string }) => {
      const fn = httpsCallable(functions, 'resetStudentProgress');
      await fn({ uid, courseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
    },
  });

  const filtered = students.filter(
    (s) =>
      s.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface-dark justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScreenWrapper scrollable={false}>
      <View className="max-w-4xl w-full self-center flex-1">
        <Text className="text-xl font-bold text-white mb-4">Student Roster ({students.length})</Text>

        <Input
          placeholder="Search by student name or email..."
          value={search}
          onChangeText={setSearch}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <Card className="mb-4">
              <View className="flex-row justify-between items-start mb-2">
                <View>
                  <Text className="text-lg font-bold text-white">{item.displayName || 'Unnamed User'}</Text>
                  <Text className="text-slate-400 text-sm">{item.email}</Text>
                </View>
                <Badge
                  label={item.disabled ? 'DISABLED' : 'ACTIVE'}
                  variant={item.disabled ? 'danger' : 'success'}
                />
              </View>

              <View className="flex-row space-x-3 pt-3 border-t border-surface-border mt-2">
                <Button
                  title={item.disabled ? 'Enable Account' : 'Disable Account'}
                  variant={item.disabled ? 'primary' : 'danger'}
                  onPress={() => disableMutation.mutate({ uid: item.uid, disabled: !item.disabled })}
                  loading={disableMutation.isPending}
                  className="mr-3"
                />
                <Button
                  title="Reset Progress"
                  variant="outline"
                  onPress={() => resetProgressMutation.mutate({ uid: item.uid, courseId: 'crypto-101' })}
                  loading={resetProgressMutation.isPending}
                />
              </View>
            </Card>
          )}
        />
      </View>
    </ScreenWrapper>
  );
}
