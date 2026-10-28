import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../src/features/auth/useAuth';
import { useTheme } from '../../../src/features/theme/ThemeContext';
import { LiveSession } from '../../../src/types/liveSession';
import { Course } from '../../../src/types/course';
import {
  getAllLiveSessions,
  createLiveSession,
  updateLiveSession,
  deleteLiveSession,
} from '../../../src/features/live/liveApi';
import { getAdminCourses } from '../../../src/features/admin/adminApi';
import { LiveSessionCard } from '../../../src/components/live/LiveSessionCard';
import { LiveSessionModal } from '../../../src/components/live/LiveSessionModal';

export default function AdminLiveScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');

  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingSession, setEditingSession] = useState<LiveSession | null>(null);

  const loadData = async () => {
    try {
      const [allSessions, allCourses] = await Promise.all([
        getAllLiveSessions(),
        getAdminCourses(),
      ]);
      setSessions(allSessions);
      setCourses(allCourses);
    } catch (err) {
      console.error('Failed to load admin live sessions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSaveSession = async (sessionData: Partial<LiveSession>) => {
    if (editingSession?.id) {
      await updateLiveSession(editingSession.id, sessionData);
    } else {
      await createLiveSession(sessionData as any);
    }
    await loadData();
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteLiveSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to delete session.');
    }
  };

  const now = Date.now();
  const filteredSessions = sessions.filter((s) => {
    const isPast = new Date(s.scheduledEndTime).getTime() < now;
    if (filter === 'upcoming') return !isPast && s.status !== 'cancelled';
    if (filter === 'completed') return isPast || s.status === 'completed';
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} />}
      >
        {/* Header Title & Button */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <View>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', marginBottom: 4 }}>
              ⚡ {isPersian ? 'مدیریت کل جلسات لایو (گوگل میت)' : 'Platform Live Sessions & Google Meet'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              {isPersian
                ? 'مشاهده و مدیریت تمامی کلاس‌های زنده پلتفرم و رویدادهای تقویم'
                : 'Supervise, reschedule, and launch all live lessons across FARUKH.ORG'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              setEditingSession(null);
              setModalVisible(true);
            }}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              shadowColor: colors.primary,
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16 }}>➕</Text>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>
              {isPersian ? 'برنامه‌ریزی درس لایو' : 'Schedule Live Class'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.cardHover,
            padding: 4,
            borderRadius: 14,
            marginBottom: 20,
            alignSelf: 'flex-start',
            gap: 4,
          }}
        >
          {(['all', 'upcoming', 'completed'] as const).map((tab) => {
            const active = filter === tab;
            const labels = {
              all: isPersian ? 'همه جلسات' : 'All Sessions',
              upcoming: isPersian ? 'آینده و لایو' : 'Upcoming & Live',
              completed: isPersian ? 'پایان یافته' : 'Completed',
            };
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setFilter(tab)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: active ? (isDark ? '#1E293B' : '#FFFFFF') : 'transparent',
                  borderWidth: active ? 1 : 0,
                  borderColor: active ? colors.cardBorder : 'transparent',
                }}
              >
                <Text
                  style={{
                    color: active ? colors.gold : colors.textSecondary,
                    fontWeight: active ? '800' : '600',
                    fontSize: 12,
                  }}
                >
                  {labels[tab]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* List */}
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : filteredSessions.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              padding: 32,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📅</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 6 }}>
              {isPersian ? 'جلسه لایوی موجود نیست' : 'No Live Sessions Found'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
              {isPersian
                ? 'جلسات زنده برنامه‌ریزی شده در اینجا نمایش داده خواهند شد.'
                : 'All scheduled Google Meet live calls will appear here.'}
            </Text>
          </View>
        ) : (
          filteredSessions.map((session) => (
            <LiveSessionCard
              key={session.id}
              session={session}
              currentUserId={user?.uid}
              isHostOrAdmin
              onEdit={(s) => {
                setEditingSession(s);
                setModalVisible(true);
              }}
              onDelete={handleDeleteSession}
            />
          ))
        )}
      </ScrollView>

      {/* Modal */}
      {user && (
        <LiveSessionModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setEditingSession(null);
          }}
          onSave={handleSaveSession}
          courses={courses}
          initialData={editingSession}
          instructorId={user.uid}
          instructorName={user.displayName || 'Admin'}
        />
      )}
    </View>
  );
}
