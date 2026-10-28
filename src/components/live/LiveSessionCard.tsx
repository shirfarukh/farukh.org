import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { LiveSession } from '../../types/liveSession';
import { useTheme } from '../../features/theme/ThemeContext';
import { Badge } from '../ui/Badge';
import {
  getLiveSessionTiming,
  formatSessionDateTime,
  buildGoogleCalendarUrl,
  downloadOrShareIcs,
} from '../../utils/calendar';

interface LiveSessionCardProps {
  session: LiveSession;
  currentUserId?: string;
  isHostOrAdmin?: boolean;
  onEdit?: (session: LiveSession) => void;
  onDelete?: (sessionId: string) => void;
  onToggleRsvp?: (sessionId: string, isAttending: boolean) => void;
}

export const LiveSessionCard: React.FC<LiveSessionCardProps> = ({
  session,
  currentUserId,
  isHostOrAdmin = false,
  onEdit,
  onDelete,
  onToggleRsvp,
}) => {
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');

  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);
  const isAttending = currentUserId ? session.attendeeUids?.includes(currentUserId) : false;

  const timing = getLiveSessionTiming(session);
  const { date, time } = formatSessionDateTime(session.scheduledStartTime, isPersian);

  const handleJoinMeet = async () => {
    if (!session.meetUrl) {
      Alert.alert(
        isPersian ? 'جلسه در تقویم' : 'Calendar Session',
        isPersian
          ? 'این جلسه در تقویم آموزشی ثبت شده است و لینک ویدیوی برخط ندارد.'
          : 'This session is scheduled directly on the academic calendar.'
      );
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(session.meetUrl);
      if (canOpen) {
        await Linking.openURL(session.meetUrl);
      } else {
        await Linking.openURL(session.meetUrl);
      }
    } catch {
      Alert.alert('Error', 'Unable to open Google Meet link. Please check the URL.');
    }
  };

  const handleAddToGoogleCal = async () => {
    const url = buildGoogleCalendarUrl(session);
    await Linking.openURL(url);
    setCalendarMenuOpen(false);
  };

  const handleDownloadIcs = async () => {
    await downloadOrShareIcs(session);
    setCalendarMenuOpen(false);
  };

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: timing.isLive
          ? colors.danger
          : isDark
          ? 'rgba(255, 255, 255, 0.08)'
          : colors.cardBorder,
        padding: 18,
        marginBottom: 16,
        shadowColor: timing.isLive ? '#EF4444' : '#000',
        shadowOpacity: timing.isLive ? 0.25 : isDark ? 0.2 : 0.05,
        shadowRadius: timing.isLive ? 16 : 8,
        elevation: timing.isLive ? 6 : 2,
      }}
    >
      {/* Top Header: Badge, Status, and Countdown */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {timing.isLive ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                borderColor: '#EF4444',
                borderWidth: 1,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 99,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#EF4444',
                }}
              />
              <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 11 }}>
                {isPersian ? 'هم‌اکنون زنده' : 'LIVE NOW'}
              </Text>
            </View>
          ) : timing.isUpcoming ? (
            <Badge label={isPersian ? 'برنامه‌ریزی شده' : 'UPCOMING'} variant="warning" />
          ) : (
            <Badge label={isPersian ? 'پایان یافته' : 'COMPLETED'} variant="info" />
          )}

          {session.targetType === 'school_class' && (
            <View
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                borderColor: '#3B82F6',
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ color: '#60A5FA', fontSize: 11, fontWeight: '700' }} numberOfLines={1}>
                🎓 {session.schoolGradeLabel || (isPersian ? 'صنف مکتب' : 'School Class')}
              </Text>
            </View>
          )}

          {session.courseTitle && session.targetType !== 'school_class' && (
            <View
              style={{
                backgroundColor: colors.goldBg,
                borderColor: colors.goldBorder,
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '700' }} numberOfLines={1}>
                📚 {session.courseTitle}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={{
            color: timing.isLive ? '#EF4444' : colors.gold,
            fontWeight: '800',
            fontSize: 12,
          }}
        >
          ⏱️ {timing.countdownText}
        </Text>
      </View>

      {/* Title & Description */}
      <Text
        style={{
          color: colors.text,
          fontSize: 17,
          fontWeight: '800',
          marginBottom: 6,
          lineHeight: 22,
        }}
      >
        {isPersian && session.faTitle ? session.faTitle : session.title}
      </Text>

      {(session.description || session.faDescription) ? (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 13,
            lineHeight: 18,
            marginBottom: 14,
          }}
          numberOfLines={2}
        >
          {isPersian && session.faDescription ? session.faDescription : session.description}
        </Text>
      ) : null}

      {/* Meta Bar: Instructor, Date, Time & Attendees */}
      <View
        style={{
          backgroundColor: colors.cardHover,
          borderRadius: 14,
          padding: 12,
          marginBottom: 16,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 14 }}>👨‍🏫</Text>
          <View>
            <Text style={{ color: colors.textMuted, fontSize: 10 }}>
              {isPersian ? 'مدرس' : 'Instructor'}
            </Text>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
              {session.instructorName}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 14 }}>📅</Text>
          <View>
            <Text style={{ color: colors.textMuted, fontSize: 10 }}>
              {isPersian ? 'تاریخ و ساعت' : 'Date & Time'}
            </Text>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
              {date} • {time} ({session.durationMin} min)
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 14 }}>👥</Text>
          <View>
            <Text style={{ color: colors.textMuted, fontSize: 10 }}>
              {isPersian ? 'شرکت‌کنندگان' : 'Attendees'}
            </Text>
            <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '800' }}>
              {session.attendeeCount || 0} {isPersian ? 'نفر' : 'registered'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons: Join Meet, Add to Calendar, RSVP */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {/* Join Meet or Calendar-only indicator */}
        {session.meetUrl ? (
          <TouchableOpacity
            onPress={handleJoinMeet}
            style={{
              flex: 1,
              minWidth: 150,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 14,
              backgroundColor: timing.isLive ? '#DC2626' : '#2563EB',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16 }}>📹</Text>
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
              {timing.isLive
                ? isPersian
                  ? 'ورود به گوگل میت زنده'
                  : 'Join Live Google Meet'
                : isPersian
                ? 'لینک گوگل میت'
                : 'Google Meet Room'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View
            style={{
              flex: 1,
              minWidth: 150,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 14,
              backgroundColor: 'rgba(234, 179, 8, 0.1)',
              borderColor: colors.goldBorder,
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16 }}>📅</Text>
            <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 13 }}>
              {isPersian ? 'رویداد تقویم آموزشی' : 'Academic Calendar Event'}
            </Text>
          </View>
        )}

        {/* Add to Calendar Button */}
        <TouchableOpacity
          onPress={() => setCalendarMenuOpen((prev) => !prev)}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 14,
            backgroundColor: colors.cardHover,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Text style={{ fontSize: 14 }}>📅</Text>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>
            {isPersian ? 'تقویم' : 'Calendar'}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 10 }}>▼</Text>
        </TouchableOpacity>

        {/* RSVP Button */}
        {currentUserId && onToggleRsvp && (
          <TouchableOpacity
            onPress={() => onToggleRsvp(session.id!, isAttending)}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 14,
              backgroundColor: isAttending ? 'rgba(34, 197, 94, 0.15)' : colors.cardHover,
              borderWidth: 1,
              borderColor: isAttending ? '#22C55E' : colors.cardBorder,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 13 }}>{isAttending ? '✓' : '＋'}</Text>
            <Text
              style={{
                color: isAttending ? '#22C55E' : colors.textSecondary,
                fontWeight: '700',
                fontSize: 12,
              }}
            >
              {isAttending
                ? isPersian
                  ? 'ثبت‌نام شده'
                  : 'Attending'
                : isPersian
                ? 'اعلام حضور'
                : 'RSVP'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Calendar Menu Dropdown */}
      {calendarMenuOpen && (
        <View
          style={{
            marginTop: 10,
            padding: 10,
            backgroundColor: colors.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            flexDirection: 'row',
            gap: 8,
          }}
        >
          <TouchableOpacity
            onPress={handleAddToGoogleCal}
            style={{
              flex: 1,
              padding: 8,
              backgroundColor: colors.cardHover,
              borderRadius: 10,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>
              🗓️ Google Calendar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDownloadIcs}
            style={{
              flex: 1,
              padding: 8,
              backgroundColor: colors.cardHover,
              borderRadius: 10,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>
              📥 Apple / iCal (.ics)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Host Controls (Edit / Delete / Cancel) */}
      {isHostOrAdmin && (
        <View
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.headerBorder,
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          {onEdit && (
            <TouchableOpacity
              onPress={() => onEdit(session)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: colors.cardHover,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 11 }}>
                ✏️ {isPersian ? 'ویرایش' : 'Edit'}
              </Text>
            </TouchableOpacity>
          )}

          {onDelete && session.id && (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  isPersian ? 'حذف جلسه' : 'Delete Session',
                  isPersian
                    ? 'آیا از حذف این جلسه لایو اطمینان دارید؟'
                    : 'Are you sure you want to delete this live session?',
                  [
                    { text: isPersian ? 'انصراف' : 'Cancel', style: 'cancel' },
                    {
                      text: isPersian ? 'حذف' : 'Delete',
                      style: 'destructive',
                      onPress: () => onDelete(session.id!),
                    },
                  ]
                );
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: colors.dangerBg,
                borderWidth: 1,
                borderColor: colors.danger,
              }}
            >
              <Text style={{ color: colors.danger, fontWeight: '700', fontSize: 11 }}>
                🗑️ {isPersian ? 'حذف' : 'Delete'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};
