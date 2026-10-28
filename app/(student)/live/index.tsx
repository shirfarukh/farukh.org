import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../src/features/auth/useAuth';
import { useTheme } from '../../../src/features/theme/ThemeContext';
import { LiveSession } from '../../../src/types/liveSession';
import {
  getUpcomingLiveSessions,
  toggleRsvpLiveSession,
} from '../../../src/features/live/liveApi';
import { LiveSessionCard } from '../../../src/components/live/LiveSessionCard';
import {
  getLiveSessionTiming,
  formatSessionDateTime,
  buildGoogleCalendarUrl,
  downloadOrShareIcs,
} from '../../../src/utils/calendar';
import { COURSE_CATEGORIES } from '../../../src/types/course';

export default function StudentLiveSessionsScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');

  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<'all' | 'courses' | 'school'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const loadSessions = async () => {
    try {
      const data = await getUpcomingLiveSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load upcoming live sessions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  const handleToggleRsvp = async (sessionId: string, currentlyAttending: boolean) => {
    if (!user) return;
    try {
      await toggleRsvpLiveSession(sessionId, user.uid, currentlyAttending);
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          const uids = s.attendeeUids || [];
          return {
            ...s,
            attendeeUids: currentlyAttending
              ? uids.filter((uid) => uid !== user.uid)
              : [...uids, user.uid],
            attendeeCount: Math.max(0, (s.attendeeCount || 0) + (currentlyAttending ? -1 : 1)),
          };
        })
      );
    } catch (err) {
      console.error('Failed to toggle RSVP:', err);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (selectedTarget === 'courses' && s.targetType === 'school_class') return false;
    if (selectedTarget === 'school' && s.targetType !== 'school_class') return false;
    if (selectedCategory === 'All') return true;
    return s.category === selectedCategory;
  });

  // Find next upcoming or currently live session for hero spotlight
  const activeSession = sessions.find((s) => getLiveSessionTiming(s).isLive);
  const nextSession = activeSession || sessions[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingTop: Platform.OS === 'web' ? 24 : 72,
          paddingBottom: 80,
          maxWidth: 960,
          width: '100%',
          alignSelf: 'center',
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} />}
      >
        {/* Hero Banner */}
        <View
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF',
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            padding: 24,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.3 : 0.05,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <View
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                borderColor: '#EF4444',
                borderWidth: 1,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 99,
              }}
            >
              <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 11 }}>
                🔴 {isPersian ? 'جلسات برخط زنده' : 'LIVE CLASSROOMS'}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: colors.goldBg,
                borderColor: colors.goldBorder,
                borderWidth: 1,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 99,
              }}
            >
              <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 11 }}>
                📹 Google Meet
              </Text>
            </View>
          </View>

          <Text
            style={{
              color: colors.text,
              fontSize: 26,
              fontWeight: '900',
              marginBottom: 8,
              lineHeight: 32,
            }}
          >
            {isPersian
              ? 'کلاس‌های زنده، تقویم و نشست‌های تعاملی'
              : 'Live Video Lessons & Interactive Workshops'}
          </Text>

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 14,
              lineHeight: 20,
              marginBottom: 16,
              maxWidth: 700,
            }}
          >
            {isPersian
              ? 'در جلسات تعاملی با اساتید برجسته شرکت کنید، پرسش‌های خود را مطرح نمایید و رویدادها را با یک کلیک به تقویم گوگل اضافه کنید.'
              : 'Join real-time video classrooms hosted via Google Meet. Ask questions directly to instructors and sync every session with your Google Calendar.'}
          </Text>

          {/* Quick Spotlight Card if there's a live/upcoming session */}
          {nextSession && (
            <View
              style={{
                backgroundColor: colors.cardHover,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: getLiveSessionTiming(nextSession).isLive ? '#EF4444' : colors.goldBorder,
                padding: 16,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <View style={{ flex: 1, minWidth: 200 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 12 }}>
                    ⭐ {getLiveSessionTiming(nextSession).isLive ? 'HAPPENING NOW' : 'NEXT UPCOMING SESSION'}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>•</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                    {formatSessionDateTime(nextSession.scheduledStartTime, isPersian).date}
                  </Text>
                </View>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }} numberOfLines={1}>
                  {isPersian && nextSession.faTitle ? nextSession.faTitle : nextSession.title}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  👨‍🏫 {nextSession.instructorName} {nextSession.courseTitle ? `• 📚 ${nextSession.courseTitle}` : ''}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                {nextSession.meetUrl && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(nextSession.meetUrl)}
                    style={{
                      backgroundColor: getLiveSessionTiming(nextSession).isLive ? '#DC2626' : '#2563EB',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                      📹 {getLiveSessionTiming(nextSession).isLive ? 'Join Live Room' : 'Open Meet Room'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => Linking.openURL(buildGoogleCalendarUrl(nextSession))}
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.cardBorder,
                    borderWidth: 1,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>
                    📅 Add to Cal
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Target Scope Filter: All, Courses, School Classes */}
        <View style={{ marginBottom: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.card,
              borderRadius: 14,
              padding: 4,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            {[
              { id: 'all', label: isPersian ? 'همه رویدادها' : 'All Events', icon: '🌐' },
              { id: 'courses', label: isPersian ? 'دوره‌های تخصصی' : 'Courses', icon: '📚' },
              { id: 'school', label: isPersian ? 'صنوف درسی مکتب (۷-۱۲)' : 'School Classes (7-12)', icon: '🎓' },
            ].map((tab) => {
              const active = selectedTarget === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setSelectedTarget(tab.id as any)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: active ? colors.goldBg : 'transparent',
                    borderWidth: active ? 1 : 0,
                    borderColor: active ? colors.goldBorder : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      color: active ? colors.gold : colors.textSecondary,
                      fontWeight: active ? '800' : '600',
                      fontSize: 12,
                    }}
                  >
                    {tab.icon} {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Category Filter Pills */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 }}>
            {isPersian ? 'دسته‌بندی موضوعی' : 'FILTER BY CATEGORY'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {['All', ...COURSE_CATEGORIES].map((cat) => {
              const active = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 12,
                    backgroundColor: active ? colors.goldBg : colors.card,
                    borderColor: active ? colors.gold : colors.cardBorder,
                    borderWidth: 1,
                    marginRight: 8,
                  }}
                >
                  <Text
                    style={{
                      color: active ? colors.gold : colors.textSecondary,
                      fontWeight: active ? '800' : '600',
                      fontSize: 12,
                    }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Sessions List */}
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
              padding: 40,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 44, marginBottom: 12 }}>📅</Text>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 6 }}>
              {isPersian ? 'هیچ جلسه لایوی برای این دسته‌بندی یافت نشد' : 'No Live Sessions Scheduled'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', maxWidth: 400 }}>
              {isPersian
                ? 'اساتید و مربیان به زودی جلسات زنده جدیدی را اعلام خواهند کرد. می‌توانید با دنبال کردن دوره‌ها از زمان‌بندی جدید مطلع شوید.'
                : 'Instructors regularly schedule workshops and Q&A sessions. Check back soon or select another category.'}
            </Text>
          </View>
        ) : (
          filteredSessions.map((session) => (
            <LiveSessionCard
              key={session.id}
              session={session}
              currentUserId={user?.uid}
              onToggleRsvp={handleToggleRsvp}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
