import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../features/theme/ThemeContext';
import { useAuth } from '../../features/auth/useAuth';
import { AFGHAN_PROVINCES } from '../../types/schoolApplication';
import { TEACHER_SUBJECTS } from '../../types/schoolTeacher';
import { submitSchoolTeacherApplication } from '../../features/school/schoolTeacherApi';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (refNumber: string) => void;
}

export function TeacherApplicationModal({ visible, onClose, onSuccess }: Props) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');

  // Form Fields
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState(AFGHAN_PROVINCES[0] as string);
  const [cityOrDistrict, setCityOrDistrict] = useState('');
  const [educationLevel, setEducationLevel] = useState<'bachelors' | 'masters' | 'phd' | 'teacher_training' | 'other'>('bachelors');
  const [fieldOfStudy, setFieldOfStudy] = useState('');

  // Girls' School Experience - INSISTED ON
  const [hasGirlsSchoolExperience, setHasGirlsSchoolExperience] = useState(true);
  const [girlsSchoolName, setGirlsSchoolName] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('3');
  const [pastSubjectsTaught, setPastSubjectsTaught] = useState('');
  const [experienceDetails, setExperienceDetails] = useState('');

  // Teaching Preferences
  const [selectedGrades, setSelectedGrades] = useState<number[]>([7, 8]);
  const [primarySubject, setPrimarySubject] = useState<string>(TEACHER_SUBJECTS[0].id);
  const [hasLaptopAndInternet, setHasLaptopAndInternet] = useState(true);
  const [motivationStatement, setMotivationStatement] = useState('');
  const [resumeOrDocsUrl, setResumeOrDocsUrl] = useState('');

  // Status & Submission
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const toggleGrade = (grade: number) => {
    if (selectedGrades.includes(grade)) {
      if (selectedGrades.length === 1) return; // Keep at least one
      setSelectedGrades(selectedGrades.filter((g) => g !== grade));
    } else {
      setSelectedGrades([...selectedGrades, grade].sort((a, b) => a - b));
    }
  };

  const handleSubmit = async () => {
    setErrorMessage('');

    // Validation
    if (!fullName.trim()) {
      setErrorMessage(isPersian ? 'لطفاً نام و نام خانوادگی خود را وارد کنید.' : 'Please enter your full name.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage(isPersian ? 'شماره تماس یا واتساپ الزامی است.' : 'Phone or WhatsApp is required.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage(isPersian ? 'ایمیل الزامی است.' : 'Email is required.');
      return;
    }
    if (!fieldOfStudy.trim()) {
      setErrorMessage(isPersian ? 'رشته تحصیلی را مشخص فرمایید.' : 'Please enter your field of study.');
      return;
    }

    // STRICT INSISTENCE ON GIRLS SCHOOL TEACHING EXPERIENCE
    if (!girlsSchoolName.trim()) {
      setErrorMessage(
        isPersian
          ? 'ثبت نام مکتب یا لیسه دخترانه‌ای که در آن تدریس نموده‌اید الزامی است.'
          : 'Please specify the girls school/high school you previously taught in.'
      );
      return;
    }
    if (!pastSubjectsTaught.trim()) {
      setErrorMessage(
        isPersian
          ? 'لطفاً مضامینی را که در مکتب دخترانه تدریس کرده‌اید درج نمایید.'
          : 'Please specify the subjects you taught in the girls school.'
      );
      return;
    }
    if (!experienceDetails.trim()) {
      setErrorMessage(
        isPersian
          ? 'شرح سابقه تدریس در مکاتب دخترانه الزامی است.'
          : 'Please provide details of your girls school teaching experience.'
      );
      return;
    }
    if (selectedGrades.length === 0) {
      setErrorMessage(
        isPersian
          ? 'حداقل یک صنف را برای تدریس انتخاب کنید.'
          : 'Please select at least one grade to teach.'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await submitSchoolTeacherApplication({
        userId: user?.uid,
        fullName: fullName.trim(),
        gender: 'female',
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        province,
        cityOrDistrict: cityOrDistrict.trim(),
        educationLevel,
        fieldOfStudy: fieldOfStudy.trim(),
        hasGirlsSchoolExperience: true,
        girlsSchoolName: girlsSchoolName.trim(),
        yearsOfExperience: parseInt(yearsOfExperience, 10) || 1,
        pastSubjectsTaught: pastSubjectsTaught.trim(),
        experienceDetails: experienceDetails.trim(),
        requestedGrades: selectedGrades,
        primarySubject,
        hasLaptopAndInternet,
        motivationStatement: motivationStatement.trim(),
        resumeOrDocsUrl: resumeOrDocsUrl.trim() || undefined,
      });

      setSubmittedRef(res.referenceNumber);
      if (onSuccess) onSuccess(res.referenceNumber);
    } catch (err: any) {
      setErrorMessage(err?.message || (isPersian ? 'خطا در ثبت درخواست' : 'Submission error'));
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setSubmittedRef(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={resetAndClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <View
          style={{
            backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.goldBorder,
            width: '100%',
            maxWidth: 760,
            maxHeight: '92%',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 22,
              paddingVertical: 18,
              borderBottomWidth: 1,
              borderBottomColor: colors.cardBorder,
              flexDirection: isPersian ? 'row-reverse' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#F8FAFC',
            }}
          >
            <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(234, 179, 8, 0.15)',
                  borderWidth: 1,
                  borderColor: colors.gold,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 22 }}>👩‍🏫</Text>
              </View>
              <View>
                <Text style={{ color: colors.text, fontSize: 17, fontWeight: '900', textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian ? 'فرم درخواست تدریس در مکتب آنلاین دختران' : 'Girls Online School Teacher Application'}
                </Text>
                <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '700', textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian ? 'ویژه استادان و آموزگاران باسابقه مکاتب دخترانه' : 'For Experienced Girls’ School Educators'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={resetAndClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Success View */}
          {submittedRef ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  borderWidth: 2,
                  borderColor: '#10B981',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 36 }}>✓</Text>
              </View>

              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: 8, textAlign: 'center' }}>
                {isPersian ? 'درخواست تدریس با موفقیت ثبت شد!' : 'Teacher Application Successfully Submitted!'}
              </Text>

              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 13,
                  lineHeight: 22,
                  textAlign: 'center',
                  marginBottom: 20,
                  maxWidth: 500,
                }}
              >
                {isPersian
                  ? 'از همکاری ارزشمند شما برای تداوم آموزش دختران صمیمانه سپاسگزاریم. کمیته علمی مکتب پس از اعتبارسنجی سوابق تدریس شما در مکاتب دخترانه، پنل مربی را با صلاحیت صنوف مورد تایید به حساب شما متصل خواهد کرد.'
                  : 'Thank you for your commitment to girls’ education. The academic committee will review your girls’ school teaching credentials and assign the authorized grades to your teacher dashboard.'}
              </Text>

              <View
                style={{
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.gold,
                  marginBottom: 24,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                  {isPersian ? 'کد رهگیری درخواست تدریس:' : 'Application Reference Number:'}
                </Text>
                <Text style={{ color: colors.gold, fontSize: 18, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 }}>
                  {submittedRef}
                </Text>
              </View>

              <TouchableOpacity
                onPress={resetAndClose}
                style={{
                  backgroundColor: colors.gold,
                  paddingHorizontal: 30,
                  paddingVertical: 12,
                  borderRadius: 14,
                }}
              >
                <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '900', fontSize: 14 }}>
                  {isPersian ? 'بستن پنجره' : 'Done & Close'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 22 }} showsVerticalScrollIndicator={false}>
              {/* Mandatory Requirement Advisory */}
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
                  borderWidth: 1.5,
                  borderColor: '#F59E0B',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 22,
                }}
              >
                <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Text style={{ fontSize: 20 }}>⭐</Text>
                  <Text style={{ color: '#F59E0B', fontWeight: '900', fontSize: 14 }}>
                    {isPersian ? 'شرط الزامی و اساسی پذیرش آموزگاران' : 'Mandatory Teacher Requirement'}
                  </Text>
                </View>
                <Text
                  style={{
                    color: isDark ? '#FDE68A' : '#92400E',
                    fontSize: 12.5,
                    lineHeight: 21,
                    textAlign: isPersian ? 'right' : 'left',
                    fontWeight: '600',
                  }}
                >
                  {isPersian
                    ? 'این فراخوان منحصراً ویژه آموزگاران، استادان و معلمان گرامی است که سابقه تدریس رسمی در مکاتب دخترانه، لیسه‌ها یا مراکز تعلیمی رسمی افغانستان دارند. پس از بررسی مدارک، پنل تدریس منحصراً برای صنوف تایید‌شده فعال خواهد شد.'
                    : 'This recruitment is strictly reserved for educators who have prior official teaching experience in girls’ schools, high schools, or established educational institutions in Afghanistan. Following verification, lesson creation will be authorized only for your approved grades.'}
                </Text>
              </View>

              {errorMessage ? (
                <View
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    borderWidth: 1,
                    borderColor: '#EF4444',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 12, textAlign: isPersian ? 'right' : 'left' }}>
                    ⚠️ {errorMessage}
                  </Text>
                </View>
              ) : null}

              {/* Section 1: Personal & Contact */}
              <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 14, marginBottom: 10, textAlign: isPersian ? 'right' : 'left' }}>
                {isPersian ? '۱. معلومات فردی و ارتباطی' : '1. Personal & Contact Information'}
              </Text>

              <View style={{ gap: 12, marginBottom: 20 }}>
                <View>
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 5, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian ? 'نام و نام خانوادگی کامل *' : 'Full Name *'}
                  </Text>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder={isPersian ? 'مثال: فاطمه محمدی' : 'e.g. Fatima Mohammadi'}
                    placeholderTextColor="#64748B"
                    style={{
                      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                      borderColor: colors.cardBorder,
                      borderWidth: 1,
                      borderRadius: 12,
                      padding: 12,
                      color: colors.text,
                      textAlign: isPersian ? 'right' : 'left',
                    }}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 5, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'ایمیل آدرس *' : 'Email Address *'}
                    </Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="teacher@example.com"
                      placeholderTextColor="#64748B"
                      style={{
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        color: colors.text,
                        textAlign: 'left',
                      }}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 5, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'شماره تماس / واتساپ *' : 'WhatsApp / Phone *'}
                    </Text>
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="+93 79 123 4567"
                      placeholderTextColor="#64748B"
                      style={{
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        color: colors.text,
                        textAlign: 'left',
                      }}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 5, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'ولایت / محل سکونت فعلی *' : 'Province / Location *'}
                    </Text>
                    <TextInput
                      value={province}
                      onChangeText={setProvince}
                      placeholder={isPersian ? 'کابل، هرات، بلخ یا مهاجر' : 'Kabul, Herat, etc.'}
                      placeholderTextColor="#64748B"
                      style={{
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        color: colors.text,
                        textAlign: isPersian ? 'right' : 'left',
                      }}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 5, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'مدرک و رشته تحصیلی *' : 'Degree & Major *'}
                    </Text>
                    <TextInput
                      value={fieldOfStudy}
                      onChangeText={setFieldOfStudy}
                      placeholder={isPersian ? 'مثال: لیسانس ادبیات انگلیسی' : 'e.g. BS in Mathematics'}
                      placeholderTextColor="#64748B"
                      style={{
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        color: colors.text,
                        textAlign: isPersian ? 'right' : 'left',
                      }}
                    />
                  </View>
                </View>
              </View>

              {/* Section 2: Girls' School Teaching Experience (INSISTED ON) */}
              <View
                style={{
                  backgroundColor: isDark ? '#1E293B/50' : '#F8FAFC',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  marginBottom: 20,
                }}
              >
                <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 14, marginBottom: 12, textAlign: isPersian ? 'right' : 'left' }}>
                  {isPersian ? '۲. سابقه تدریس در مکاتب دخترانه (الزامی و با اولویت قطعی)' : '2. Girls’ School Teaching Experience (Mandatory)'}
                </Text>

                <View style={{ gap: 12 }}>
                  <View>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 5, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'نام مکتب یا لیسه دخترانه که در آن تدریس نموده‌اید *' : 'Name of Girls School / High School Taught At *'}
                    </Text>
                    <TextInput
                      value={girlsSchoolName}
                      onChangeText={setGirlsSchoolName}
                      placeholder={isPersian ? 'مثال: لیسه دخترانه زرغونه، رابعه بلخی، گوهرشاد و...' : 'e.g. Zarghona Girls High School, Kabul'}
                      placeholderTextColor="#64748B"
                      style={{
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        color: colors.text,
                        textAlign: isPersian ? 'right' : 'left',
                      }}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 5, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? 'مدت سابقه تدریس (سال) *' : 'Years of Teaching Experience *'}
                      </Text>
                      <TextInput
                        value={yearsOfExperience}
                        onChangeText={setYearsOfExperience}
                        keyboardType="number-pad"
                        placeholder="3"
                        placeholderTextColor="#64748B"
                        style={{
                          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                          borderColor: colors.cardBorder,
                          borderWidth: 1,
                          borderRadius: 12,
                          padding: 12,
                          color: colors.text,
                          textAlign: 'left',
                        }}
                      />
                    </View>

                    <View style={{ flex: 2 }}>
                      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 5, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? 'مضامینی که در مکتب تدریس کرده‌اید *' : 'Subjects Previously Taught *'}
                      </Text>
                      <TextInput
                        value={pastSubjectsTaught}
                        onChangeText={setPastSubjectsTaught}
                        placeholder={isPersian ? 'مثال: انگلیسی، ساینس، ریاضی صنف ۷ و ۸' : 'e.g. English, Math, Biology'}
                        placeholderTextColor="#64748B"
                        style={{
                          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                          borderColor: colors.cardBorder,
                          borderWidth: 1,
                          borderRadius: 12,
                          padding: 12,
                          color: colors.text,
                          textAlign: isPersian ? 'right' : 'left',
                        }}
                      />
                    </View>
                  </View>

                  <View>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 5, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'شرح تجارب تدریس، سال‌های فعالیت و مستندات مکتب *' : 'Details of Teaching Service & Verification *'}
                    </Text>
                    <TextInput
                      value={experienceDetails}
                      onChangeText={setExperienceDetails}
                      placeholder={isPersian ? 'لطفاً سال‌های تدریس، دوره فعالیت و توضیحات مربوط به سابقه خدمت در مکتب را تشریح فرمایید...' : 'Describe your teaching roles, grades taught, and school context...'}
                      placeholderTextColor="#64748B"
                      multiline
                      numberOfLines={3}
                      style={{
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        color: colors.text,
                        minHeight: 70,
                        textAlign: isPersian ? 'right' : 'left',
                      }}
                    />
                  </View>
                </View>
              </View>

              {/* Section 3: Requested Grades to Teach */}
              <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 14, marginBottom: 8, textAlign: isPersian ? 'right' : 'left' }}>
                {isPersian ? '۳. صنوف مورد نظر برای تدریس (انتخاب چندگانه)' : '3. Requested Grades to Teach (Select all that apply)'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11.5, marginBottom: 12, textAlign: isPersian ? 'right' : 'left' }}>
                {isPersian
                  ? 'توجه: پس از تایید توسط اداره، در پنل مربی تنها به این صنوف تایید‌شده دسترسی ایجاد درس خواهید داشت.'
                  : 'Note: You will only be permitted to create lessons for the specific grades approved by the admin.'}
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {[7, 8, 9, 10, 11, 12].map((g) => {
                  const isSelected = selectedGrades.includes(g);
                  return (
                    <TouchableOpacity
                      key={g}
                      onPress={() => toggleGrade(g)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: isSelected ? colors.gold : (isDark ? '#1E293B' : '#F1F5F9'),
                        borderWidth: 1,
                        borderColor: isSelected ? colors.gold : colors.cardBorder,
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? (isDark ? '#0F172A' : '#FFFFFF') : colors.text,
                          fontWeight: '800',
                          fontSize: 13,
                        }}
                      >
                        {isSelected ? '✓ ' : ''}
                        {isPersian ? `صنف ${g}` : `Grade ${g}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Section 4: Primary Subject */}
              <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 14, marginBottom: 8, textAlign: isPersian ? 'right' : 'left' }}>
                {isPersian ? '۴. مضمون تخصصی شما برای تدریس آنلاین' : '4. Primary Subject Specialization'}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {TEACHER_SUBJECTS.map((sub) => {
                  const isSelected = primarySubject === sub.id;
                  return (
                    <TouchableOpacity
                      key={sub.id}
                      onPress={() => setPrimarySubject(sub.id)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 10,
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : (isDark ? '#1E293B' : '#F1F5F9'),
                        borderWidth: 1,
                        borderColor: isSelected ? '#3B82F6' : colors.cardBorder,
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? '#60A5FA' : colors.textSecondary,
                          fontWeight: '700',
                          fontSize: 12,
                        }}
                      >
                        {isPersian ? sub.fa : sub.en}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Section 5: Motivation & Online Readiness */}
              <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 14, marginBottom: 10, textAlign: isPersian ? 'right' : 'left' }}>
                {isPersian ? '۵. آمادگی تدریس و انگیزه‌نامه' : '5. Motivation & Online Teaching'}
              </Text>

              <View style={{ gap: 12, marginBottom: 24 }}>
                <TouchableOpacity
                  onPress={() => setHasLaptopAndInternet(!hasLaptopAndInternet)}
                  style={{
                    flexDirection: isPersian ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: 10,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      backgroundColor: hasLaptopAndInternet ? colors.gold : 'transparent',
                      borderWidth: 1.5,
                      borderColor: colors.gold,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {hasLaptopAndInternet && <Text style={{ color: '#000', fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
                  </View>
                  <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '700', flex: 1, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian
                      ? 'به کمپیوتر / لپ‌تاپ و انترنت مناسب برای آماده‌سازی محتوا و ضبط دروس دسترسی دارم'
                      : 'I have access to a computer and internet for lesson preparation and online teaching'}
                  </Text>
                </TouchableOpacity>

                <View>
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 5, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian ? 'انگیزه‌نامه و پیام شما به کمیته علمی مکتب' : 'Motivation & Message to Academic Board'}
                  </Text>
                  <TextInput
                    value={motivationStatement}
                    onChangeText={setMotivationStatement}
                    placeholder={isPersian ? 'هدف و انگیزه خود را برای تدریس آنلاین دختران بنویسید...' : 'Your goals and motivation...'}
                    placeholderTextColor="#64748B"
                    multiline
                    numberOfLines={3}
                    style={{
                      backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                      borderColor: colors.cardBorder,
                      borderWidth: 1,
                      borderRadius: 12,
                      padding: 12,
                      color: colors.text,
                      minHeight: 70,
                      textAlign: isPersian ? 'right' : 'left',
                    }}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                style={{
                  backgroundColor: colors.gold,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                  shadowColor: colors.gold,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                {loading ? (
                  <ActivityIndicator color={isDark ? '#0F172A' : '#FFFFFF'} />
                ) : (
                  <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '900', fontSize: 15 }}>
                    {isPersian ? 'ارسال رسمی درخواست تدریس به اداره مکتب' : 'Submit Application to School Board'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
