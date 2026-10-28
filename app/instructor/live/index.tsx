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
  getInstructorLiveSessions,
  createLiveSession,
  updateLiveSession,
  deleteLiveSession,
} from '../../../src/features/live/liveApi';
import { getInstructorCourses } from '../../../src/features/instructor/instructorApi';
import { LiveSessionCard } from '../../../src/components/live/LiveSessionCard';
import { LiveSessionModal } from '../../../src/components/live/LiveSessionModal';

export default function InstructorLiveScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');

  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingSession, setEditingSession] = useState<LiveSession | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      const [liveData, coursesData] = await Promise.all([
        getInstructorLiveSessions(user.uid),
        getInstructorCourses(user.uid),
      ]);
      setSessions(liveData);
      setCourses(coursesData);
    } catch (err) {
      console.error('Failed to load instructor live sessions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

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

  const totalAttendees = sessions.reduce((acc, curr) => acc + (curr.attendeeCount || 0), 0);
  const activeCount = sessions.filter((s) => {
    const start = new Date(s.scheduledStartTime).getTime();
    const end = new Date(s.scheduledEndTime).getTime();
    return now >= start && now <= end;
  }).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} />}
      >
        {/* Header Title & Schedule Button */}
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
              📅 {isPersian ? 'مدیریت کلاس‌های لایو و گوگل میت' : 'Live Lessons & Google Meet'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              {isPersian
                ? 'برنامه‌ریزی جلسات برخط، ایجاد اتاق گفتگوی تصویری و همگام‌سازی با تقویم'
                : 'Schedule interactive video classes, invite students, and sync to Google Calendar'}
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
              {isPersian ? 'برنامه‌ریزی درس لایو جدید' : 'Schedule Live Class'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <View
            style={{
              flex: 1,
              minWidth: 140,
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              padding: 16,
            }}
          >
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
              {isPersian ? 'کل جلسات' : 'Total Scheduled'}
            </Text>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 4 }}>
              {sessions.length}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              minWidth: 140,
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: activeCount > 0 ? '#EF4444' : colors.cardBorder,
              padding: 16,
            }}
          >
            <Text style={{ color: activeCount > 0 ? '#EF4444' : colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
              {isPersian ? 'هم‌اکنون لایو' : 'Live Right Now'}
            </Text>
            <Text style={{ color: activeCount > 0 ? '#EF4444' : colors.text, fontSize: 22, fontWeight: '900', marginTop: 4 }}>
              {activeCount}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              minWidth: 140,
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              padding: 16,
            }}
          >
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
              {isPersian ? 'مجموع ثبت‌نام‌ها' : 'Total RSVPs'}
            </Text>
            <Text style={{ color: colors.gold, fontSize: 22, fontWeight: '900', marginTop: 4 }}>
              {totalAttendees}
            </Text>
          </View>
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
          {(['upcoming', 'all', 'completed'] as const).map((tab) => {
            const active = filter === tab;
            const labels = {
              upcoming: isPersian ? 'آینده و پیش‌رو' : 'Upcoming',
              all: isPersian ? 'همه جلسات' : 'All',
              completed: isPersian ? 'پایان یافته' : 'Past',
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

        {/* Content List */}
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
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📹</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 6 }}>
              {isPersian ? 'هیچ جلسه لایوی یافت نشد' : 'No Live Sessions Scheduled'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
              {isPersian
                ? 'با کلیک روی دکمه زیر می‌توانید جلسه لایو جدیدی در گوگل میت بسازید و با شاگردان به اشتراک بگذارید.'
                : 'Click the button below to schedule your first interactive live class with Google Meet.'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setEditingSession(null);
                setModalVisible(true);
              }}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>
                ➕ {isPersian ? 'برنامه‌ریزی درس لایو' : 'Schedule Live Class'}
              </Text>
            </TouchableOpacity>
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
          instructorName={user.displayName || user.email || 'Instructor'}
        />
      )}
    </View>
  );
}
