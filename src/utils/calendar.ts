import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { LiveSession } from '../types/liveSession';

/**
 * Format an ISO date/time into a compact UTC string required by iCal / Google Calendar:
 * e.g. 20261025T140000Z
 */
export function formatToCalDateUtc(isoString: string): string {
  const d = new Date(isoString);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Builds a direct 1-click Google Calendar Event Template URL.
 * Opens directly in the student/instructor's browser or Google Calendar app.
 */
export function buildGoogleCalendarUrl(session: LiveSession): string {
  const start = formatToCalDateUtc(session.scheduledStartTime);
  const end = formatToCalDateUtc(session.scheduledEndTime);
  const title = encodeURIComponent(`[FARUKH.ORG Live] ${session.title}`);
  
  const details = encodeURIComponent(
    `${session.description || 'Live Lesson & Interactive Discussion on FARUKH.ORG'}\n\n` +
    `🔗 Google Meet Link: ${session.meetUrl}\n` +
    (session.courseTitle ? `📚 Course: ${session.courseTitle}\n` : '') +
    `👨‍🏫 Instructor: ${session.instructorName}\n\n` +
    `Platform: https://farukh.org`
  );

  const location = encodeURIComponent(session.meetUrl || 'Online');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
}

/**
 * Builds an Outlook Web calendar event URL
 */
export function buildOutlookCalendarUrl(session: LiveSession): string {
  const start = encodeURIComponent(new Date(session.scheduledStartTime).toISOString());
  const end = encodeURIComponent(new Date(session.scheduledEndTime).toISOString());
  const subject = encodeURIComponent(`[FARUKH.ORG Live] ${session.title}`);
  const body = encodeURIComponent(
    `${session.description || ''}\n\nGoogle Meet: ${session.meetUrl || 'Online'}\nInstructor: ${session.instructorName}`
  );
  const location = encodeURIComponent(session.meetUrl || 'Online');

  return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${start}&enddt=${end}&subject=${subject}&body=${body}&location=${location}`;
}

/**
 * Builds a valid RFC 5545 iCalendar (.ics) format file string.
 * Works natively with Apple Calendar, iOS/macOS Calendar, Outlook, and Android.
 */
export function generateIcsContent(session: LiveSession): string {
  const start = formatToCalDateUtc(session.scheduledStartTime);
  const end = formatToCalDateUtc(session.scheduledEndTime);
  const now = formatToCalDateUtc(new Date().toISOString());
  const uid = `live-session-${session.id || 'id'}-${start}@farukh.org`;

  const cleanDescription = (session.description || 'Live interactive lesson on FARUKH.ORG')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

  const cleanSummary = `[FARUKH Live] ${session.title}`.replace(/,/g, '\\,').replace(/;/g, '\\;');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FARUKH.ORG//Live Education Sessions//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${cleanSummary}`,
    `DESCRIPTION:${cleanDescription}\\n\\nJoin Meet: ${session.meetUrl}`,
    `LOCATION:${session.meetUrl}`,
    `URL:${session.meetUrl}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: FARUKH.ORG Live Lesson starting in 15 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Exports/downloads the .ics calendar file on web or shares on native devices.
 */
export async function downloadOrShareIcs(session: LiveSession): Promise<void> {
  const icsData = generateIcsContent(session);
  const filename = `live-lesson-${session.id || 'farukh'}.ics`;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = filename;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return;
  }

  // On Mobile, open the Google Calendar web fallback or custom link
  const googleCalUrl = buildGoogleCalendarUrl(session);
  await Linking.openURL(googleCalUrl);
}

/**
 * Helper to compute live status and human-readable countdowns
 */
export function getLiveSessionTiming(session: LiveSession): {
  isLive: boolean;
  isUpcoming: boolean;
  isPast: boolean;
  countdownText: string;
  badgeLabel: string;
} {
  if (session.status === 'cancelled') {
    return {
      isLive: false,
      isUpcoming: false,
      isPast: true,
      countdownText: 'Session Cancelled',
      badgeLabel: 'CANCELLED',
    };
  }

  const now = Date.now();
  const startTime = new Date(session.scheduledStartTime).getTime();
  const endTime = new Date(session.scheduledEndTime).getTime();

  // Allow 5 minutes grace buffer prior to official start time to let students enter room
  const bufferStart = startTime - 5 * 60 * 1000;

  if (now >= bufferStart && now <= endTime) {
    return {
      isLive: true,
      isUpcoming: false,
      isPast: false,
      countdownText: 'Happening Now',
      badgeLabel: 'LIVE NOW 🔴',
    };
  }

  if (now > endTime) {
    return {
      isLive: false,
      isUpcoming: false,
      isPast: true,
      countdownText: 'Completed',
      badgeLabel: 'COMPLETED',
    };
  }

  // Upcoming: calculate diff
  const diffMs = startTime - now;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const diffDays = Math.floor(diffHours / 24);

  let countdownText = '';
  if (diffDays > 0) {
    countdownText = `Starts in ${diffDays}d ${diffHours % 24}h`;
  } else if (diffHours > 0) {
    countdownText = `Starts in ${diffHours}h ${diffMins}m`;
  } else if (diffMins > 0) {
    countdownText = `Starts in ${diffMins}m`;
  } else {
    countdownText = 'Starts in seconds';
  }

  return {
    isLive: false,
    isUpcoming: true,
    isPast: false,
    countdownText,
    badgeLabel: 'UPCOMING',
  };
}

/**
 * Format date nicely for display
 */
export function formatSessionDateTime(
  isoString: string,
  isPersian: boolean = false
): { date: string; time: string } {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: isoString, time: '' };

    const locale = isPersian ? 'fa-AF' : 'en-US';
    const date = d.toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const time = d.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });

    return { date, time };
  } catch {
    return { date: isoString, time: '' };
  }
}
