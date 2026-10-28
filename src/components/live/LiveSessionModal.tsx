import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { LiveSession } from '../../types/liveSession';
import { Course } from '../../types/course';
import { useTheme } from '../../features/theme/ThemeContext';

interface LiveSessionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (sessionData: Partial<LiveSession>) => Promise<void>;
  courses: Course[];
  initialData?: LiveSession | null;
  instructorId: string;
  instructorName: string;
}

const SCHOOL_CLASSES = [
  { grade: 7, en: 'Grade 7: Secondary Core', fa: 'صنف هفتم (متوسطه)' },
  { grade: 8, en: 'Grade 8: Sciences & Math', fa: 'صنف هشتم (علوم پایه)' },
  { grade: 9, en: 'Grade 9: Intermediate Graduation', fa: 'صنف نهم (فراغت متوسطه)' },
  { grade: 10, en: 'Grade 10: Senior Lycee', fa: 'صنف دهم (دوره عالی و لیسه)' },
  { grade: 11, en: 'Grade 11: Pre-Diploma', fa: 'صنف یازدهم (پیش‌دانشگاهی)' },
  { grade: 12, en: 'Grade 12: High School Baccalaureate', fa: 'صنف دوازدهم (دیپلوم و کانکور)' },
];

export const LiveSessionModal: React.FC<LiveSessionModalProps> = ({
  visible,
  onClose,
  onSave,
  courses,
  initialData,
  instructorId,
  instructorName,
}) => {
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');

  const [title, setTitle] = useState('');
  const [faTitle, setFaTitle] = useState('');
  const [description, setDescription] = useState('');
  const [faDescription, setFaDescription] = useState('');

  // Target Option: Course vs School Class vs General
  const [targetType, setTargetType] = useState<'course' | 'school_class' | 'general'>('course');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<number>(7);

  // Calendar Option: Optional Google Calendar & Meet integration
  const [enableCalendar, setEnableCalendar] = useState<boolean>(true);
  const [dateStr, setDateStr] = useState(''); // YYYY-MM-DD
  const [timeStr, setTimeStr] = useState(''); // HH:MM
  const [durationMin, setDurationMin] = useState<number>(60);
  const [meetUrl, setMeetUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setFaTitle(initialData.faTitle || '');
      setDescription(initialData.description || '');
      setFaDescription(initialData.faDescription || '');
      setTargetType(initialData.targetType || (initialData.schoolGrade ? 'school_class' : initialData.courseId ? 'course' : 'general'));
      setSelectedCourseId(initialData.courseId || '');
      setSelectedGrade(initialData.schoolGrade || 7);
      setDurationMin(initialData.durationMin || 60);
      setMeetUrl(initialData.meetUrl || '');
      setEnableCalendar(initialData.hasCalendarEvent ?? Boolean(initialData.meetUrl || initialData.scheduledStartTime));

      if (initialData.scheduledStartTime) {
        const d = new Date(initialData.scheduledStartTime);
        setDateStr(d.toISOString().split('T')[0]);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        setTimeStr(`${hh}:${mm}`);
      }
    } else {
      // Default: tomorrow at 18:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDateStr(tomorrow.toISOString().split('T')[0]);
      setTimeStr('18:00');
      setTitle('');
      setFaTitle('');
      setDescription('');
      setFaDescription('');
      setTargetType('course');
      setSelectedCourseId(courses[0]?.id || '');
      setSelectedGrade(7);
      setEnableCalendar(true);
      setDurationMin(60);
      setMeetUrl('');
    }
  }, [initialData, visible, courses]);

  const handleOpenGoogleMeetNew = async () => {
    try {
      await Linking.openURL('https://meet.google.com/new');
    } catch {
      Alert.alert('Notice', 'Please visit meet.google.com to create a Google Meet link and paste it here.');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Field', 'Please enter a title for the lesson.');
      return;
    }

    let startDateTime: Date | null = null;
    let endDateTime: Date | null = null;

    if (enableCalendar) {
      if (!meetUrl.trim() || !meetUrl.includes('meet.google.com')) {
        Alert.alert(
          'Invalid Google Meet Link',
          'Please enter a valid Google Meet link (e.g. https://meet.google.com/xyz-abcd-efg) or disable the Calendar option.'
        );
        return;
      }

      if (!dateStr || !timeStr) {
        Alert.alert('Missing Date/Time', 'Please provide a valid date and start time for calendar scheduling.');
        return;
      }

      startDateTime = new Date(`${dateStr}T${timeStr}:00`);
      if (isNaN(startDateTime.getTime())) {
        Alert.alert('Invalid Date', 'Date and time format should be YYYY-MM-DD and HH:MM.');
        return;
      }

      endDateTime = new Date(startDateTime.getTime() + durationMin * 60 * 1000);
    }

    const selectedCourse = courses.find((c) => c.id === selectedCourseId);
    const selectedSchoolClass = SCHOOL_CLASSES.find((s) => s.grade === selectedGrade);

    const payload: Partial<LiveSession> = {
      title: title.trim(),
      faTitle: faTitle.trim() || undefined,
      description: description.trim(),
      faDescription: faDescription.trim() || undefined,
      targetType,
      courseId: targetType === 'course' ? (selectedCourseId || undefined) : undefined,
      courseTitle: targetType === 'course' ? selectedCourse?.title : undefined,
      schoolGrade: targetType === 'school_class' ? selectedGrade : undefined,
      schoolGradeLabel: targetType === 'school_class' ? (isPersian ? selectedSchoolClass?.fa : selectedSchoolClass?.en) : undefined,
      category: targetType === 'school_class' ? 'School Classes' : (selectedCourse?.category || 'General'),
      hasCalendarEvent: enableCalendar,
      instructorId: initialData?.instructorId || instructorId,
      instructorName: initialData?.instructorName || instructorName,
      scheduledStartTime: startDateTime ? startDateTime.toISOString() : undefined,
      scheduledEndTime: endDateTime ? endDateTime.toISOString() : undefined,
      durationMin,
      meetUrl: enableCalendar ? meetUrl.trim() : undefined,
      status: initialData?.status || 'scheduled',
    };

    setSaving(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save lesson.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 620,
            maxHeight: '92%',
            backgroundColor: colors.surface,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            padding: 22,
            shadowColor: '#000',
            shadowOpacity: 0.4,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.headerBorder,
              paddingBottom: 12,
            }}
          >
            <View>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>
                {initialData
                  ? isPersian
                    ? 'ویرایش درس'
                    : 'Edit Lesson'
                  : isPersian
                  ? 'ایجاد و برنامه‌ریزی درس جدید'
                  : 'Create & Schedule Lesson'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                {isPersian
                  ? 'انتخاب دوره یا صنف مکتب با قابلیت اختیاری تقویم و گوگل میت'
                  : 'Assign to Course or School Class, with optional Calendar & Meet'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.cardHover,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: '800', fontSize: 14 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 1. Target Selection: Course vs School Class vs General */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
                1. {isPersian ? 'اختصاص درس به:' : 'ASSIGN LESSON TO:'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                {[
                  { id: 'course', en: '📚 Course Track', fa: '📚 دوره آموزشی' },
                  { id: 'school_class', en: '🏫 School Class', fa: '🏫 صنف درسی مکتب' },
                  { id: 'general', en: '🌐 General Session', fa: '🌐 کارگاه عمومی' },
                ].map((item) => {
                  const isSelected = targetType === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setTargetType(item.id as any)}
                      activeOpacity={0.8}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        paddingHorizontal: 8,
                        borderRadius: 12,
                        backgroundColor: isSelected ? colors.goldBg : colors.card,
                        borderColor: isSelected ? colors.gold : colors.cardBorder,
                        borderWidth: 1.5,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? colors.gold : colors.textSecondary,
                          fontSize: 12,
                          fontWeight: isSelected ? '800' : '600',
                          textAlign: 'center',
                        }}
                      >
                        {isPersian ? item.fa : item.en}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Sub-selector: Choose Course */}
              {targetType === 'course' && (
                <View style={{ backgroundColor: colors.cardHover, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontWeight: '700', marginBottom: 8 }}>
                    {isPersian ? 'انتخاب دوره آموزشی:' : 'Select Associated Course:'}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {courses.map((c) => {
                      const isSelected = selectedCourseId === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => setSelectedCourseId(c.id!)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 10,
                            backgroundColor: isSelected ? colors.gold : colors.card,
                            borderColor: isSelected ? colors.gold : colors.cardBorder,
                            borderWidth: 1,
                            marginRight: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: isSelected ? (isDark ? '#0F172A' : '#FFFFFF') : colors.text,
                              fontSize: 12,
                              fontWeight: isSelected ? '800' : '600',
                            }}
                          >
                            {c.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Sub-selector: Choose School Class Grade 7-12 */}
              {targetType === 'school_class' && (
                <View style={{ backgroundColor: colors.cardHover, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11.5, fontWeight: '700', marginBottom: 8 }}>
                    {isPersian ? 'انتخاب صنف درسی مکتب (نصاب رسمی معارف):' : 'Select Academic School Class (Grades 7–12):'}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {SCHOOL_CLASSES.map((sc) => {
                      const isSelected = selectedGrade === sc.grade;
                      return (
                        <TouchableOpacity
                          key={sc.grade}
                          onPress={() => setSelectedGrade(sc.grade)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: 99,
                            backgroundColor: isSelected ? colors.gold : colors.card,
                            borderColor: isSelected ? colors.gold : colors.cardBorder,
                            borderWidth: 1,
                          }}
                        >
                          <Text
                            style={{
                              color: isSelected ? (isDark ? '#0F172A' : '#FFFFFF') : colors.text,
                              fontSize: 11.5,
                              fontWeight: isSelected ? '800' : '600',
                            }}
                          >
                            {isPersian ? sc.fa : sc.en}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* 2. Title & Description */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginBottom: 6 }}>
                Lesson Title (English) *
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Linear Equations in Algebra or Python Foundations"
                placeholderTextColor={colors.textMuted}
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                  color: colors.text,
                  fontSize: 14,
                }}
              />
            </View>

            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginBottom: 6 }}>
                عنوان فارسی درس (اختیاری)
              </Text>
              <TextInput
                value={faTitle}
                onChangeText={setFaTitle}
                placeholder="مثلاً: حل معادلات خطی الجبر یا مبانی پایتون"
                placeholderTextColor={colors.textMuted}
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                  color: colors.text,
                  fontSize: 14,
                  textAlign: 'right',
                }}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginBottom: 6 }}>
                Description / Curriculum Notes
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What will be taught in this lesson?"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                  color: colors.text,
                  fontSize: 13,
                  minHeight: 60,
                  textAlignVertical: 'top',
                }}
              />
            </View>

            {/* 3. Calendar & Google Meet Integration Option */}
            <View
              style={{
                marginBottom: 16,
                backgroundColor: colors.cardHover,
                borderColor: enableCalendar ? colors.goldBorder : colors.cardBorder,
                borderWidth: 1.5,
                borderRadius: 18,
                padding: 14,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: enableCalendar ? 12 : 0 }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13 }}>
                    📅 {isPersian ? 'گزینه تقویم و جلسه لایو (گوگل کلندر و میت)' : 'Calendar & Live Meet Integration'}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                    {enableCalendar
                      ? (isPersian ? 'فعال: تاریخ و ساعت برگزاری همراه با لینک میت و همگام‌سازی تقویم تنظیم می‌شود.' : 'Active: Generates Google Calendar, Outlook, and iCal invites for students.')
                      : (isPersian ? 'غیرفعال: درس به صورت محتوای ضبط‌شده یا خودآموز ایجاد می‌شود.' : 'Disabled: Treated as an on-demand lesson without scheduled calendar invite.')}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setEnableCalendar((prev) => !prev)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 99,
                    backgroundColor: enableCalendar ? colors.gold : colors.card,
                    borderColor: enableCalendar ? colors.gold : colors.cardBorder,
                    borderWidth: 1,
                  }}
                >
                  <Text style={{ color: enableCalendar ? (isDark ? '#0F172A' : '#FFFFFF') : colors.textSecondary, fontSize: 11, fontWeight: '800' }}>
                    {enableCalendar ? (isPersian ? 'فعال ✓' : 'Enabled ✓') : (isPersian ? 'اختیاری / غیرفعال' : 'Optional / Off')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Conditional Calendar Scheduling Inputs */}
              {enableCalendar && (
                <View style={{ borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: 12, marginTop: 6 }}>
                  {/* Google Meet Link */}
                  <View style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12 }}>
                        Google Meet URL *
                      </Text>
                      <TouchableOpacity
                        onPress={handleOpenGoogleMeetNew}
                        style={{
                          backgroundColor: '#2563EB',
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                        }}
                      >
                        <Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '800' }}>
                          🔗 Create on Meet
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      value={meetUrl}
                      onChangeText={setMeetUrl}
                      placeholder="https://meet.google.com/abc-defg-hij"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      style={{
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 10,
                        padding: 10,
                        color: colors.text,
                        fontSize: 12.5,
                      }}
                    />
                  </View>

                  {/* Date, Time, Duration */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 11.5, marginBottom: 4 }}>
                        Date (YYYY-MM-DD) *
                      </Text>
                      <TextInput
                        value={dateStr}
                        onChangeText={setDateStr}
                        placeholder="2026-10-25"
                        placeholderTextColor={colors.textMuted}
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                          borderWidth: 1,
                          borderRadius: 10,
                          padding: 10,
                          color: colors.text,
                          fontSize: 12.5,
                        }}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 11.5, marginBottom: 4 }}>
                        Time (HH:MM 24h) *
                      </Text>
                      <TextInput
                        value={timeStr}
                        onChangeText={setTimeStr}
                        placeholder="18:30"
                        placeholderTextColor={colors.textMuted}
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                          borderWidth: 1,
                          borderRadius: 10,
                          padding: 10,
                          color: colors.text,
                          fontSize: 12.5,
                        }}
                      />
                    </View>

                    <View style={{ width: 90 }}>
                      <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 11.5, marginBottom: 4 }}>
                        Duration
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        {[45, 60].map((mins) => (
                          <TouchableOpacity
                            key={mins}
                            onPress={() => setDurationMin(mins)}
                            style={{
                              flex: 1,
                              paddingVertical: 9,
                              borderRadius: 8,
                              backgroundColor: durationMin === mins ? colors.goldBg : colors.card,
                              borderColor: durationMin === mins ? colors.gold : colors.cardBorder,
                              borderWidth: 1,
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ color: durationMin === mins ? colors.gold : colors.textSecondary, fontSize: 10.5, fontWeight: '800' }}>
                              {mins}m
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 14,
              borderTopWidth: 1,
              borderTopColor: colors.headerBorder,
              paddingTop: 12,
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              disabled={saving}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 11,
                borderRadius: 12,
                backgroundColor: colors.cardHover,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 13 }}>
                {isPersian ? 'انصراف' : 'Cancel'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 11,
                borderRadius: 12,
                backgroundColor: colors.primary,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>
                  {initialData
                    ? isPersian
                      ? 'ذخیره تغییرات'
                      : 'Update Lesson'
                    : isPersian
                    ? 'ذخیره و انتشار درس'
                    : 'Save & Publish Lesson'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
