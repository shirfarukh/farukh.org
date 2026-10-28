import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { useTheme } from '../../src/features/theme/ThemeContext';
import { useAuth } from '../../src/features/auth/useAuth';
import { HeaderPreferences } from '../../src/components/ui/HeaderPreferences';
import {
  AFGHAN_PROVINCES,
  GUARDIAN_RELATIONS,
  SchoolApplication,
} from '../../src/types/schoolApplication';
import { submitSchoolApplication } from '../../src/features/school/schoolApplicationApi';

export default function SchoolRegistrationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');
  const scrollViewRef = useRef<any>(null);

  // Step state (1: Student, 2: Guardian, 3: Location, 4: Academic, 5: Documents, 6: Review & Submit)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 6;
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 1: Student Information
  const [studentFullName, setStudentFullName] = useState(user?.displayName || '');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [studentEmail, setStudentEmail] = useState(user?.email || '');
  const [studentPhone, setStudentPhone] = useState('');
  const [nationalIdNumber, setNationalIdNumber] = useState('');
  const [studentPassword, setStudentPassword] = useState('123456');

  // Step 2: Guardian Information
  const [guardianFullName, setGuardianFullName] = useState('');
  const [guardianRelation, setGuardianRelation] = useState<string>('father');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianJob, setGuardianJob] = useState('');

  // Step 3: Location
  const [province, setProvince] = useState<string>(AFGHAN_PROVINCES[0]);
  const [district, setDistrict] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [displacementStatus, setDisplacementStatus] = useState<'resident' | 'idp' | 'refugee_abroad'>('resident');

  // Step 4: Academic & Grade
  const initialGrade = params.grade ? Number(params.grade) : 7;
  const [targetGrade, setTargetGrade] = useState<number>(initialGrade >= 7 && initialGrade <= 12 ? initialGrade : 7);
  const [lastCompletedGrade, setLastCompletedGrade] = useState<number>(targetGrade > 7 ? targetGrade - 1 : 6);
  const [previousSchoolName, setPreviousSchoolName] = useState('');
  const [primaryLanguage, setPrimaryLanguage] = useState<'dari' | 'pashto' | 'uzbeki' | 'other'>('dari');
  const [internetAccess, setInternetAccess] = useState<'daily' | 'several_days_a_week' | 'limited'>('daily');
  const [deviceType, setDeviceType] = useState<'smartphone' | 'tablet' | 'computer' | 'shared_family'>('smartphone');

  // Step 5: Documents
  const [hasDocumentsNow, setHasDocumentsNow] = useState<boolean>(true);
  const [tazkiraUrl, setTazkiraUrl] = useState('');
  const [transcriptUrl, setTranscriptUrl] = useState('');
  const [studentPhotoUrl, setStudentPhotoUrl] = useState('');
  const [documentNotes, setDocumentNotes] = useState('');

  // Step 6: Confirmation
  const [declarationAgreed, setDeclarationAgreed] = useState<boolean>(true);
  const [privacyConsent, setPrivacyConsent] = useState<boolean>(true);

  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  useEffect(() => {
    if (params.grade) {
      const g = Number(params.grade);
      if (g >= 7 && g <= 12) {
        setTargetGrade(g);
        setLastCompletedGrade(g > 7 ? g - 1 : 6);
      }
    }
  }, [params.grade]);

  // Step validations
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!studentFullName.trim()) {
        Alert.alert(isPersian ? 'نام شاگرد الزامی است' : 'Student name required', isPersian ? 'لطفاً نام و تخلص کامل شاگرد را وارد نمایید.' : 'Please enter student full name.');
        return false;
      }
      if (!dateOfBirth.trim()) {
        Alert.alert(isPersian ? 'تاریخ تولد الزامی است' : 'Date of birth required', isPersian ? 'لطفاً تاریخ تولد شاگرد را وارد نمایید.' : 'Please provide date of birth.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!guardianFullName.trim()) {
        Alert.alert(isPersian ? 'نام سرپرست الزامی است' : 'Guardian name required', isPersian ? 'لطفاً نام کامل سرپرست (پدر، مادر یا ولی قانونی) را بنویسید.' : 'Please enter guardian full name.');
        return false;
      }
      if (!guardianPhone.trim()) {
        Alert.alert(isPersian ? 'شماره تماس سرپرست الزامی است' : 'Guardian phone required', isPersian ? 'وارد کردن شماره تماس معتبر جهت تأیید و مصونیت شاگرد ضروری است.' : 'Please enter guardian contact number.');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!district.trim()) {
        Alert.alert(isPersian ? 'ولسوالی / ناحیه الزامی است' : 'District required', isPersian ? 'لطفاً ولسوالی یا ناحیه محل سکونت را مشخص نمایید.' : 'Please enter district / neighborhood.');
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (!targetGrade) {
        Alert.alert(isPersian ? 'انتخاب صنف الزامی است' : 'Target grade required', isPersian ? 'لطفاً صنف مورد تقاضا (۷ تا ۱۲) را انتخاب فرمایید.' : 'Please choose target grade (7 to 12).');
        return false;
      }
      return true;
    }

    if (step === 5) {
      return true;
    }

    if (step === 6) {
      if (!declarationAgreed || !privacyConsent) {
        Alert.alert(
          isPersian ? 'تأیید تعهدنامه الزامی است' : 'Agreement required',
          isPersian
            ? 'لطفاً صحت معلومات و توافق‌نامه مصونیت شاگرد را با تیک زدن گزینه‌ها تأیید نمایید.'
            : 'Please agree to information accuracy and student digital safety policy.'
        );
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmitApplication = async () => {
    setSubmitError(null);
    if (!validateStep(6)) return;

    setIsSubmitting(true);
    try {
      const result = await submitSchoolApplication({
        userId: user?.uid,
        studentFullName: studentFullName.trim(),
        dateOfBirth: dateOfBirth.trim(),
        fatherName: fatherName.trim() || undefined,
        motherName: motherName.trim() || undefined,
        studentEmail: studentEmail.trim() || undefined,
        studentPhone: studentPhone.trim() || undefined,
        nationalIdNumber: nationalIdNumber.trim() || undefined,

        guardianFullName: guardianFullName.trim(),
        guardianRelation,
        guardianPhone: guardianPhone.trim(),
        guardianEmail: guardianEmail.trim() || undefined,
        guardianJob: guardianJob.trim() || undefined,

        province,
        district: district.trim(),
        currentAddress: currentAddress.trim() || undefined,
        displacementStatus,

        targetGrade,
        lastCompletedGrade,
        previousSchoolName: previousSchoolName.trim() || undefined,
        primaryLanguage,
        internetAccess,
        deviceType,

        hasDocumentsNow,
        tazkiraUrl: tazkiraUrl.trim() || undefined,
        transcriptUrl: transcriptUrl.trim() || undefined,
        studentPhotoUrl: studentPhotoUrl.trim() || undefined,
        documentNotes: documentNotes.trim() || undefined,

        declarationAgreed,
        privacyConsent,
        studentPassword: studentPassword.trim() || '123456',
      });

      setSubmittedRef(result.referenceNumber);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } catch (err: any) {
      console.error('Failed to submit school application:', err);
      const errMsg = err?.message || (isPersian ? 'ارسال درخواست با خطا مواجه شد. لطفاً دوباره تلاش کنید.' : 'Failed to submit application. Please try again.');
      setSubmitError(errMsg);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(errMsg);
      } else {
        Alert.alert(isPersian ? 'خطا در ارسال درخواست' : 'Submission Error', errMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles = [
    { num: 1, fa: 'معلومات شاگرد', en: 'Student' },
    { num: 2, fa: 'معلومات سرپرست', en: 'Guardian' },
    { num: 3, fa: 'موقعیت و سکونت', en: 'Location' },
    { num: 4, fa: 'صنف و سوابق', en: 'Academic' },
    { num: 5, fa: 'اسناد و مدارک', en: 'Documents' },
    { num: 6, fa: 'بررسی و ارسال', en: 'Review' },
  ];

  return (
    <ScreenWrapper>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{
          padding: 20,
          paddingTop: Platform.OS === 'web' ? 24 : 70,
          paddingBottom: 80,
          maxWidth: 860,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <HeaderPreferences />

        {/* Back Link to School Page */}
        <TouchableOpacity
          onPress={() => router.push('/(student)/school')}
          style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}
        >
          <Text style={{ color: colors.gold, fontSize: 13, fontWeight: '700' }}>
            {isPersian ? '← بازگشت به پورتال صنوف مکتب' : '← Back to School Classes Portal'}
          </Text>
        </TouchableOpacity>

        {/* Page Hero Banner */}
        <View
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.75)' : '#FFFFFF',
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            padding: 24,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.3 : 0.06,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <View
              style={{
                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                borderColor: colors.goldBorder,
                borderWidth: 1,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 99,
              }}
            >
              <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 11 }}>
                🎓 {isPersian ? 'فورم رسمی پذیرش و ثبت‌نام شاگردان' : 'OFFICIAL STUDENT APPLICATION'}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                borderColor: '#3B82F6',
                borderWidth: 1,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 99,
              }}
            >
              <Text style={{ color: '#60A5FA', fontWeight: '800', fontSize: 11 }}>
                {isPersian ? 'صنوف ۷ الی ۱۲ مکتب' : 'Grades 7 to 12'}
              </Text>
            </View>
          </View>

          <Text
            style={{
              color: colors.text,
              fontSize: 24,
              fontWeight: '900',
              marginBottom: 8,
              textAlign: isPersian ? 'right' : 'left',
              lineHeight: 32,
            }}
          >
            {isPersian
              ? 'درخواست آنلاین شمولیت در مکتب آنلاین'
              : 'Online Application for Academic School Admission'}
          </Text>

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13.5,
              lineHeight: 22,
              textAlign: isPersian ? 'right' : 'left',
              maxWidth: 720,
            }}
          >
            {isPersian
              ? 'آموزش آنلاین مصون، رایگان و بر اساس نصاب رسمی معارف افغانستان برای دختران بازمانده از مکتب (صنوف ۷ تا ۱۲). معلومات خود را با دقت در بخش‌های زیر وارد نمایید.'
              : 'Safe, structured, accredited secondary and high school education (Grades 7–12) following the national curriculum. Complete each section below carefully.'}
          </Text>
        </View>

        {/* Successful Submission View */}
        {submittedRef ? (
          <View
            style={{
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : '#FFFFFF',
              borderRadius: 24,
              borderWidth: 2,
              borderColor: colors.success,
              padding: 32,
              alignItems: 'center',
              shadowColor: colors.success,
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 6,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900', marginBottom: 8, textAlign: 'center' }}>
              {isPersian ? 'از ثبت‌نام شما صمیمانه سپاسگزاریم!' : 'Thank You for Registering!'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13.5, textAlign: 'center', marginBottom: 20, lineHeight: 22, maxWidth: 540 }}>
              {isPersian
                ? 'درخواست شمولیت شما با موفقیت ثبت شد و جهت بررسی و تأیید به اداره مکتب ارسال گردید. در صورت ضرورت، با شما تماس گرفته خواهد شد. به محض تأیید توسط اداره مکتب، دسترسی به تمام مواد آموزشی، کتب و ویدیوهای این صنف برای شما فعال می‌گردد.'
                : 'Thank you for registering. Your application has been submitted to the school administration for approval. If necessary, we will contact you back. Once approved by the administration, you will receive full access to all materials and lessons for this grade.'}
            </Text>

            {/* Login Credentials Badge */}
            <View
              style={{
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : '#F8FAFC',
                borderRadius: 18,
                padding: 18,
                borderWidth: 1.5,
                borderColor: colors.goldBorder,
                marginBottom: 24,
                width: '100%',
                maxWidth: 480,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.gold, fontSize: 13, fontWeight: '800', marginBottom: 12, textAlign: 'center' }}>
                🔑 {isPersian ? 'مشخصات ورود به داشبورد و صنف مکتب' : 'School Dashboard Login Credentials'}
              </Text>

              <View style={{ width: '100%', flexDirection: isPersian ? 'row-reverse' : 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12.5, fontWeight: '700' }}>
                  {isPersian ? 'نام کاربری / شناسه شاگرد:' : 'Username / Student ID:'}
                </Text>
                <Text style={{ color: colors.gold, fontSize: 14, fontWeight: '900', letterSpacing: 1 }}>
                  {submittedRef}
                </Text>
              </View>

              <View style={{ width: '100%', flexDirection: isPersian ? 'row-reverse' : 'row', justifyContent: 'space-between', paddingVertical: 6, marginTop: 4 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12.5, fontWeight: '700' }}>
                  {isPersian ? 'رمز عبور صنف:' : 'Class Password:'}
                </Text>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>
                  {studentPassword}
                </Text>
              </View>

              <Text style={{ color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 10, lineHeight: 18 }}>
                {isPersian
                  ? 'پس از تأیید اداره مکتب، با این نام کاربری و رمز عبور می‌توانید در داشبورد مکتب وارد کلاس خود شوید.'
                  : 'Once approved by administration, use these credentials to log in and access your class dashboard.'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <TouchableOpacity
                onPress={() => router.push('/(student)/school')}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  flexDirection: isPersian ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13.5 }}>
                  🔐 {isPersian ? 'ورود به داشبورد و صنوف مکتب' : 'Go to School Dashboard'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setSubmittedRef(null);
                  setCurrentStep(1);
                }}
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  borderWidth: 1,
                  borderRadius: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
                  {isPersian ? 'ثبت درخواست شاگرد دیگر' : 'Submit Another Application'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Step Progress Indicators */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', justifyContent: 'space-between', gap: 6 }}>
                {stepTitles.map((st) => {
                  const isActive = currentStep === st.num;
                  const isCompleted = currentStep > st.num;
                  return (
                    <TouchableOpacity
                      key={st.num}
                      onPress={() => {
                        if (st.num < currentStep) setCurrentStep(st.num);
                      }}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: 8,
                        borderRadius: 12,
                        backgroundColor: isActive
                          ? colors.goldBg
                          : isCompleted
                          ? isDark ? 'rgba(74, 222, 128, 0.1)' : 'rgba(22, 163, 74, 0.08)'
                          : colors.card,
                        borderWidth: 1,
                        borderColor: isActive
                          ? colors.gold
                          : isCompleted
                          ? colors.success
                          : colors.cardBorder,
                      }}
                    >
                      <Text
                        style={{
                          color: isActive ? colors.gold : isCompleted ? colors.success : colors.textMuted,
                          fontSize: 12,
                          fontWeight: '800',
                          marginBottom: 2,
                        }}
                      >
                        {isCompleted ? '✓' : st.num}
                      </Text>
                      <Text
                        style={{
                          color: isActive ? colors.gold : isCompleted ? colors.text : colors.textMuted,
                          fontSize: 10,
                          fontWeight: isActive ? '800' : '600',
                          textAlign: 'center',
                        }}
                        numberOfLines={1}
                      >
                        {isPersian ? st.fa : st.en}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Form Step Body */}
            <View
              style={{
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.65)' : '#FFFFFF',
                borderRadius: 24,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                padding: 24,
                marginBottom: 24,
                shadowColor: '#000',
                shadowOpacity: isDark ? 0.2 : 0.04,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              {/* STEP 1: Student Information */}
              {currentStep === 1 && (
                <View>
                  <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 13, textTransform: 'uppercase', marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian ? 'گام ۱ از ۶: معلومات شخصی شاگرد' : 'Step 1 of 6: Student Personal Information'}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 18, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian
                      ? 'لطفاً مشخصات هویتی شاگرد را مطابق تذکره یا اسناد تحصیلی وارد نمایید.'
                      : 'Enter student identification details accurately as stated in formal documents.'}
                  </Text>

                  {/* Student Full Name */}
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12.5, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'نام و تخلص کامل شاگرد *' : 'Student Full Name *'}
                    </Text>
                    <TextInput
                      value={studentFullName}
                      onChangeText={setStudentFullName}
                      placeholder={isPersian ? 'مثلاً: فاطمه احمدی' : 'e.g. Fatima Ahmadi'}
                      placeholderTextColor={colors.textMuted}
                      style={{
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        color: colors.text,
                        fontSize: 13.5,
                        textAlign: isPersian ? 'right' : 'left',
                      }}
                    />
                  </View>

                  {/* Date of Birth */}
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12.5, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'تاریخ تولد (سال، ماه، روز - هجری شمسی یا میلادی) *' : 'Date of Birth (YYYY-MM-DD or Solar Hijri) *'}
                    </Text>
                    <TextInput
                      value={dateOfBirth}
                      onChangeText={setDateOfBirth}
                      placeholder={isPersian ? 'مثلاً: 1387/05/12 یا 2008-08-03' : 'e.g. 2008-08-03 or 1387/05/12'}
                      placeholderTextColor={colors.textMuted}
                      style={{
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        color: colors.text,
                        fontSize: 13.5,
                        textAlign: isPersian ? 'right' : 'left',
                      }}
                    />
                  </View>

                  {/* Father and Mother Name */}
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? 'نام پدر' : 'Father’s Name'}
                      </Text>
                      <TextInput
                        value={fatherName}
                        onChangeText={setFatherName}
                        placeholder={isPersian ? 'نام پدر' : 'Father name'}
                        placeholderTextColor={colors.textMuted}
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                          borderWidth: 1,
                          borderRadius: 12,
                          padding: 12,
                          color: colors.text,
                          fontSize: 13,
                          textAlign: isPersian ? 'right' : 'left',
                        }}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? 'نام مادر (اختیاری)' : 'Mother’s Name (Optional)'}
                      </Text>
                      <TextInput
                        value={motherName}
                        onChangeText={setMotherName}
                        placeholder={isPersian ? 'نام مادر' : 'Mother name'}
                        placeholderTextColor={colors.textMuted}
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                          borderWidth: 1,
                          borderRadius: 12,
                          padding: 12,
                          color: colors.text,
                          fontSize: 13,
                          textAlign: isPersian ? 'right' : 'left',
                        }}
                      />
                    </View>
                  </View>

                  {/* Contact Number and Email */}
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? 'شماره تماس یا واتساپ شاگرد' : 'Student Phone / WhatsApp'}
                      </Text>
                      <TextInput
                        value={studentPhone}
                        onChangeText={setStudentPhone}
                        placeholder="+93 700 000 000"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="phone-pad"
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                          borderWidth: 1,
                          borderRadius: 12,
                          padding: 12,
                          color: colors.text,
                          fontSize: 13,
                        }}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? 'ایمیل شاگرد' : 'Student Email'}
                      </Text>
                      <TextInput
                        value={studentEmail}
                        onChangeText={setStudentEmail}
                        placeholder="student@example.com"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                          borderWidth: 1,
                          borderRadius: 12,
                          padding: 12,
                          color: colors.text,
                          fontSize: 13,
                        }}
                      />
                    </View>
                  </View>

                  {/* National ID / Tazkira */}
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'شماره تذکره یا نمبر ثبت هویت (اختیاری)' : 'Tazkira / National ID Number (Optional)'}
                    </Text>
                    <TextInput
                      value={nationalIdNumber}
                      onChangeText={setNationalIdNumber}
                      placeholder={isPersian ? 'نمبر تذکره الکترونیکی یا کاغذی' : 'Tazkira or ID number'}
                      placeholderTextColor={colors.textMuted}
                      style={{
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        color: colors.text,
                        fontSize: 13,
                        textAlign: isPersian ? 'right' : 'left',
                      }}
                    />
                  </View>

                  {/* Student Class Login Password */}
                  <View style={{ marginBottom: 10, backgroundColor: isDark ? 'rgba(250, 204, 21, 0.06)' : 'rgba(250, 204, 21, 0.1)', borderColor: colors.goldBorder, borderWidth: 1, borderRadius: 14, padding: 14 }}>
                    <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 13, marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                      🔑 {isPersian ? 'تعیین رمز عبور برای ورود به داشبورد صنف *' : 'Set Class Login Password *'}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11.5, marginBottom: 8, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian
                        ? 'این رمز عبور همراه با شناسه اختصاصی شاگرد جهت ورود به صنف در داشبورد مکتب استفاده خواهد شد.'
                        : 'This password along with your Student ID will be used to log in to the School Dashboard once approved.'}
                    </Text>
                    <TextInput
                      value={studentPassword}
                      onChangeText={setStudentPassword}
                      placeholder={isPersian ? 'رمز عبور (حداقل ۶ کاراکتر)' : 'Password (at least 6 characters)'}
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                      style={{
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        color: colors.text,
                        fontSize: 13.5,
                        textAlign: isPersian ? 'right' : 'left',
                      }}
                    />
                  </View>
                </View>
              )}

              {/* STEP 2: Guardian Information */}
              {currentStep === 2 && (
                <View>
                  <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 13, textTransform: 'uppercase', marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian ? 'گام ۲ از ۶: معلومات سرپرست یا والدین' : 'Step 2 of 6: Guardian & Parent Information'}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 18, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian
                      ? 'به دلایل مصونیت شاگردان، هماهنگی با یکی از اعضای خانواده یا سرپرست قانونی ضروری است.'
                      : 'For child safety and academic verification, verified guardian details are required.'}
                  </Text>

                  {/* Guardian Full Name */}
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12.5, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'نام و تخلص کامل سرپرست *' : 'Guardian Full Name *'}
                    </Text>
                    <TextInput
                      value={guardianFullName}
                      onChangeText={setGuardianFullName}
                      placeholder={isPersian ? 'مثلاً: محمد احمدی' : 'e.g. Mohammad Ahmadi'}
                      placeholderTextColor={colors.textMuted}
                      style={{
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        color: colors.text,
                        fontSize: 13.5,
                        textAlign: isPersian ? 'right' : 'left',
                      }}
                    />
                  </View>

                  {/* Guardian Relation */}
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12.5, marginBottom: 8, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'نسبت سرپرست با شاگرد *' : 'Relation to Student *'}
                    </Text>
                    <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8 }}>
                      {GUARDIAN_RELATIONS.map((rel) => {
                        const isSelected = guardianRelation === rel.id;
                        return (
                          <TouchableOpacity
                            key={rel.id}
                            onPress={() => setGuardianRelation(rel.id)}
                            style={{
                              paddingHorizontal: 14,
                              paddingVertical: 8,
                              borderRadius: 10,
                              backgroundColor: isSelected ? colors.goldBg : colors.card,
                              borderColor: isSelected ? colors.gold : colors.cardBorder,
                              borderWidth: 1,
                            }}
                          >
                            <Text
                              style={{
                                color: isSelected ? colors.gold : colors.textSecondary,
                                fontWeight: isSelected ? '800' : '600',
                                fontSize: 12,
                              }}
                            >
                              {isPersian ? rel.fa : rel.en}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Guardian Phone */}
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12.5, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'شماره تماس مستقیم یا واتساپ سرپرست *' : 'Guardian Phone / WhatsApp Number *'}
                    </Text>
                    <TextInput
                      value={guardianPhone}
                      onChangeText={setGuardianPhone}
                      placeholder="+93 700 000 000"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                      style={{
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        color: colors.text,
                        fontSize: 13.5,
                      }}
                    />
                  </View>

                  {/* Guardian Email & Job */}
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? 'ایمیل سرپرست (اختیاری)' : 'Guardian Email'}
                      </Text>
                      <TextInput
                        value={guardianEmail}
                        onChangeText={setGuardianEmail}
                        placeholder="guardian@example.com"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                          borderWidth: 1,
                          borderRadius: 12,
                          padding: 12,
                          color: colors.text,
                          fontSize: 13,
                        }}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? 'شغل / پیشه سرپرست' : 'Guardian Occupation'}
                      </Text>
                      <TextInput
                        value={guardianJob}
                        onChangeText={setGuardianJob}
                        placeholder={isPersian ? 'مثلاً: معلم، کارمند، آزاد' : 'Occupation'}
                        placeholderTextColor={colors.textMuted}
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                          borderWidth: 1,
                          borderRadius: 12,
                          padding: 12,
                          color: colors.text,
                          fontSize: 13,
                          textAlign: isPersian ? 'right' : 'left',
                        }}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* STEP 3: Location */}
              {currentStep === 3 && (
                <View>
                  <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 13, textTransform: 'uppercase', marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian ? 'گام ۳ از ۶: موقعیت جغرافیایی و سکونت' : 'Step 3 of 6: Location & Residence'}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 18, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian
                      ? 'ولایت و منطقه سکونت خود را مشخص کنید. این اطلاعات برای برنامه‌ریزی زون زمانی و صنف‌بندی استفاده می‌شود.'
                      : 'Specify your province and district for scheduling and timezone coordination.'}
                  </Text>

                  {/* Province Selection */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12.5, marginBottom: 8, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'انتخاب ولایت یا منطقه سکونت *' : 'Select Province or Location *'}
                    </Text>
                    <ScrollView style={{ maxHeight: 180, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, padding: 8 }}>
                      {AFGHAN_PROVINCES.map((p) => {
                        const isSelected = province === p;
                        return (
                          <TouchableOpacity
                            key={p}
                            onPress={() => setProvince(p)}
                            style={{
                              paddingVertical: 10,
                              paddingHorizontal: 12,
                              borderRadius: 8,
                              backgroundColor: isSelected ? colors.goldBg : 'transparent',
                              marginBottom: 2,
                            }}
                          >
                            <Text
                              style={{
                                color: isSelected ? colors.gold : colors.text,
                                fontWeight: isSelected ? '800' : '600',
                                fontSize: 12.5,
                                textAlign: isPersian ? 'right' : 'left',
                              }}
                            >
                              {isSelected ? '✓ ' : ''}{p}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* District */}
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12.5, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'ولسوالی یا ناحیه *' : 'District / Neighborhood *'}
                    </Text>
                    <TextInput
                      value={district}
                      onChangeText={setDistrict}
                      placeholder={isPersian ? 'مثلاً: ناحیه سوم، یا ولسوالی پغمان' : 'e.g. District 3, or Paghman'}
                      placeholderTextColor={colors.textMuted}
                      style={{
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        color: colors.text,
                        fontSize: 13.5,
                        textAlign: isPersian ? 'right' : 'left',
                      }}
                    />
                  </View>

                  {/* Village / Street Address */}
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'قریه / سرک / گذر (اختیاری)' : 'Village / Street Address (Optional)'}
                    </Text>
                    <TextInput
                      value={currentAddress}
                      onChangeText={setCurrentAddress}
                      placeholder={isPersian ? 'آدرس محل سکونت فعلی' : 'Current living address'}
                      placeholderTextColor={colors.textMuted}
                      style={{
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        color: colors.text,
                        fontSize: 13,
                        textAlign: isPersian ? 'right' : 'left',
                      }}
                    />
                  </View>

                  {/* Displacement Status */}
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginBottom: 8, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'وضعیت سکونت:' : 'Displacement Status:'}
                    </Text>
                    <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', gap: 8 }}>
                      {[
                        { id: 'resident', fa: 'ساکن اصلی در منطقه', en: 'Original Resident' },
                        { id: 'idp', fa: 'بیجاشده داخلی (IDP)', en: 'Internally Displaced' },
                        { id: 'refugee_abroad', fa: 'مهاجر در خارج از کشور', en: 'Refugee Abroad' },
                      ].map((item) => {
                        const isSelected = displacementStatus === item.id;
                        return (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => setDisplacementStatus(item.id as any)}
                            style={{
                              flex: 1,
                              paddingVertical: 10,
                              paddingHorizontal: 8,
                              borderRadius: 10,
                              backgroundColor: isSelected ? colors.goldBg : colors.card,
                              borderColor: isSelected ? colors.gold : colors.cardBorder,
                              borderWidth: 1,
                              alignItems: 'center',
                            }}
                          >
                            <Text
                              style={{
                                color: isSelected ? colors.gold : colors.textSecondary,
                                fontSize: 11,
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
                  </View>
                </View>
              )}

              {/* STEP 4: Academic Background */}
              {currentStep === 4 && (
                <View>
                  <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 13, textTransform: 'uppercase', marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian ? 'گام ۴ از ۶: صنف مورد تقاضا و سوابق تحصیلی' : 'Step 4 of 6: Target Grade & Academic Background'}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 18, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian
                      ? 'صنف درخواستی خود را انتخاب کنید (دوره متوسطه و لیسه صنوف ۷ تا ۱۲).'
                      : 'Choose your desired school class (Grades 7 to 12).'}
                  </Text>

                  {/* Target Grade Selection */}
                  <View style={{ marginBottom: 18 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12.5, marginBottom: 8, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'صنف مورد تقاضا جهت ثبت‌نام *' : 'Target Grade to Apply For *'}
                    </Text>
                    <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8 }}>
                      {[7, 8, 9, 10, 11, 12].map((g) => {
                        const isSelected = targetGrade === g;
                        return (
                          <TouchableOpacity
                            key={g}
                            onPress={() => setTargetGrade(g)}
                            style={{
                              width: '31%',
                              paddingVertical: 12,
                              paddingHorizontal: 8,
                              borderRadius: 12,
                              backgroundColor: isSelected ? colors.gold : colors.card,
                              borderColor: isSelected ? colors.gold : colors.cardBorder,
                              borderWidth: 1.5,
                              alignItems: 'center',
                            }}
                          >
                            <Text
                              style={{
                                color: isSelected ? (isDark ? '#0F172A' : '#FFFFFF') : colors.text,
                                fontWeight: '900',
                                fontSize: 14,
                                marginBottom: 2,
                              }}
                            >
                              {isPersian ? `صنف ${g}` : `Grade ${g}`}
                            </Text>
                            <Text
                              style={{
                                color: isSelected ? (isDark ? '#1E293B' : '#E2E8F0') : colors.textMuted,
                                fontSize: 10,
                                fontWeight: '700',
                              }}
                            >
                              {g <= 9 ? (isPersian ? 'دوره متوسطه' : 'Middle School') : (isPersian ? 'دوره لیسه' : 'High School')}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Last Completed Grade & Previous School */}
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? 'آخرین صنف تکمیل‌شده *' : 'Last Completed Grade *'}
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                        {[6, 7, 8, 9, 10, 11].map((cg) => {
                          const isSelected = lastCompletedGrade === cg;
                          return (
                            <TouchableOpacity
                              key={cg}
                              onPress={() => setLastCompletedGrade(cg)}
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 8,
                                backgroundColor: isSelected ? colors.goldBg : colors.card,
                                borderColor: isSelected ? colors.gold : colors.cardBorder,
                                borderWidth: 1,
                              }}
                            >
                              <Text
                                style={{
                                  color: isSelected ? colors.gold : colors.textSecondary,
                                  fontWeight: '800',
                                  fontSize: 11,
                                }}
                              >
                                {isPersian ? `صنف ${cg}` : `Gr ${cg}`}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? 'نام مکتب قبلی' : 'Previous School Name'}
                      </Text>
                      <TextInput
                        value={previousSchoolName}
                        onChangeText={setPreviousSchoolName}
                        placeholder={isPersian ? 'مثلاً: لیسه رابعه بلخی' : 'School name'}
                        placeholderTextColor={colors.textMuted}
                        style={{
                          backgroundColor: colors.card,
                          borderColor: colors.cardBorder,
                          borderWidth: 1,
                          borderRadius: 12,
                          padding: 12,
                          color: colors.text,
                          fontSize: 13,
                          textAlign: isPersian ? 'right' : 'left',
                        }}
                      />
                    </View>
                  </View>

                  {/* Primary Language */}
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'زبان مادری / آموزشی اصلی:' : 'Primary Language of Instruction:'}
                    </Text>
                    <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', gap: 8 }}>
                      {[
                        { id: 'dari', fa: 'فارسی / دری', en: 'Dari / Persian' },
                        { id: 'pashto', fa: 'پښتو (Pashto)', en: 'Pashto' },
                        { id: 'uzbeki', fa: 'اوزبیکی (Uzbeki)', en: 'Uzbeki' },
                        { id: 'other', fa: 'سایر زبان‌ها', en: 'Other' },
                      ].map((item) => {
                        const isSelected = primaryLanguage === item.id;
                        return (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => setPrimaryLanguage(item.id as any)}
                            style={{
                              flex: 1,
                              paddingVertical: 8,
                              borderRadius: 10,
                              backgroundColor: isSelected ? colors.goldBg : colors.card,
                              borderColor: isSelected ? colors.gold : colors.cardBorder,
                              borderWidth: 1,
                              alignItems: 'center',
                            }}
                          >
                            <Text
                              style={{
                                color: isSelected ? colors.gold : colors.textSecondary,
                                fontWeight: isSelected ? '800' : '600',
                                fontSize: 11.5,
                              }}
                            >
                              {isPersian ? item.fa : item.en}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Internet & Device Access */}
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 11.5, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? 'دسترسی به اینترنت و برق:' : 'Internet & Power Access:'}
                      </Text>
                      {[
                        { id: 'daily', fa: 'دسترسی روزانه', en: 'Daily Access' },
                        { id: 'several_days_a_week', fa: 'چند روز در هفته', en: 'Few Days a Week' },
                        { id: 'limited', fa: 'محدود و متغیر', en: 'Limited' },
                      ].map((item) => {
                        const isSelected = internetAccess === item.id;
                        return (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => setInternetAccess(item.id as any)}
                            style={{
                              paddingVertical: 6,
                              paddingHorizontal: 8,
                              borderRadius: 8,
                              backgroundColor: isSelected ? colors.goldBg : 'transparent',
                              marginBottom: 4,
                            }}
                          >
                            <Text style={{ color: isSelected ? colors.gold : colors.textSecondary, fontSize: 11, fontWeight: '700', textAlign: isPersian ? 'right' : 'left' }}>
                              {isSelected ? '● ' : '○ '}{isPersian ? item.fa : item.en}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 11.5, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian ? 'وسیله مورد استفاده:' : 'Device Available:'}
                      </Text>
                      {[
                        { id: 'smartphone', fa: 'موبایل هوشمند', en: 'Smartphone' },
                        { id: 'tablet', fa: 'تبلت', en: 'Tablet' },
                        { id: 'computer', fa: 'لپ‌تاپ / کمپیوتر', en: 'Laptop / PC' },
                        { id: 'shared_family', fa: 'اشتراکی با فامیل', en: 'Family Shared' },
                      ].map((item) => {
                        const isSelected = deviceType === item.id;
                        return (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => setDeviceType(item.id as any)}
                            style={{
                              paddingVertical: 6,
                              paddingHorizontal: 8,
                              borderRadius: 8,
                              backgroundColor: isSelected ? colors.goldBg : 'transparent',
                              marginBottom: 4,
                            }}
                          >
                            <Text style={{ color: isSelected ? colors.gold : colors.textSecondary, fontSize: 11, fontWeight: '700', textAlign: isPersian ? 'right' : 'left' }}>
                              {isSelected ? '● ' : '○ '}{isPersian ? item.fa : item.en}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}

              {/* STEP 5: Documents */}
              {currentStep === 5 && (
                <View>
                  <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 13, textTransform: 'uppercase', marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian ? 'گام ۵ از ۶: اسناد و مدارک تحصیلی' : 'Step 5 of 6: Educational Documents & ID'}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 18, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian
                      ? 'اگر اسناد تحصیلی فعلاً نزد شما موجود نیست، نگران نباشید. می‌توانید گزینه "بعداً ارسال می‌کنم" را انتخاب کنید.'
                      : 'If your formal certificates are not readily accessible, you can opt to provide them later.'}
                  </Text>

                  {/* Document Availability Toggle */}
                  <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', gap: 10, marginBottom: 18 }}>
                    <TouchableOpacity
                      onPress={() => setHasDocumentsNow(true)}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        borderRadius: 14,
                        backgroundColor: hasDocumentsNow ? colors.goldBg : colors.card,
                        borderColor: hasDocumentsNow ? colors.gold : colors.cardBorder,
                        borderWidth: 1.5,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: hasDocumentsNow ? colors.gold : colors.text, fontWeight: '800', fontSize: 12.5 }}>
                        📄 {isPersian ? 'اسناد نزد من موجود است' : 'Documents Available'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setHasDocumentsNow(false)}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        borderRadius: 14,
                        backgroundColor: !hasDocumentsNow ? colors.goldBg : colors.card,
                        borderColor: !hasDocumentsNow ? colors.gold : colors.cardBorder,
                        borderWidth: 1.5,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: !hasDocumentsNow ? colors.gold : colors.text, fontWeight: '800', fontSize: 12.5 }}>
                        ⏳ {isPersian ? 'اسناد را بعداً تحویل می‌دهم' : 'Will Provide Later'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {hasDocumentsNow ? (
                    <View style={{ gap: 14, marginBottom: 10 }}>
                      <View>
                        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12.5, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                          {isPersian ? 'لینک یا نام فایل تذکره / کارت هویت' : 'Tazkira / ID Document Link or File'}
                        </Text>
                        <TextInput
                          value={tazkiraUrl}
                          onChangeText={setTazkiraUrl}
                          placeholder={isPersian ? 'https://... یا نام فایل تذکره' : 'https://... or filename'}
                          placeholderTextColor={colors.textMuted}
                          autoCapitalize="none"
                          style={{
                            backgroundColor: colors.card,
                            borderColor: colors.cardBorder,
                            borderWidth: 1,
                            borderRadius: 12,
                            padding: 12,
                            color: colors.text,
                            fontSize: 13,
                          }}
                        />
                      </View>

                      <View>
                        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12.5, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                          {isPersian ? 'لینک یا نام کارنامه / اطلاع‌نامه صنف قبلی' : 'Previous School Transcript / Certificate'}
                        </Text>
                        <TextInput
                          value={transcriptUrl}
                          onChangeText={setTranscriptUrl}
                          placeholder={isPersian ? 'https://... یا نام فایل اطلاع‌نامه' : 'https://... or transcript link'}
                          placeholderTextColor={colors.textMuted}
                          autoCapitalize="none"
                          style={{
                            backgroundColor: colors.card,
                            borderColor: colors.cardBorder,
                            borderWidth: 1,
                            borderRadius: 12,
                            padding: 12,
                            color: colors.text,
                            fontSize: 13,
                          }}
                        />
                      </View>

                      <View>
                        <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                          {isPersian ? 'عکس شاگرد جهت پروفایل آموزشی (اختیاری)' : 'Student Profile Photo Link (Optional)'}
                        </Text>
                        <TextInput
                          value={studentPhotoUrl}
                          onChangeText={setStudentPhotoUrl}
                          placeholder="https://..."
                          placeholderTextColor={colors.textMuted}
                          autoCapitalize="none"
                          style={{
                            backgroundColor: colors.card,
                            borderColor: colors.cardBorder,
                            borderWidth: 1,
                            borderRadius: 12,
                            padding: 12,
                            color: colors.text,
                            fontSize: 13,
                          }}
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={{ backgroundColor: colors.cardHover, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.goldBorder, marginBottom: 12 }}>
                      <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 12.5, marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                        ℹ️ {isPersian ? 'ثبت‌نام مشروط بدون تاخیر' : 'Conditional Admission'}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian
                          ? 'درخواست شما بررسی می‌شود و در صورت قبولی، شاگرد می‌تواند تا زمان اخذ اسناد از مکتب قبلی، در صنف حاضر شود.'
                          : 'Your application will be evaluated promptly. Students may attend provisional classes while documents are being arranged.'}
                      </Text>
                    </View>
                  )}

                  <View style={{ marginTop: 8 }}>
                    <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginBottom: 6, textAlign: isPersian ? 'right' : 'left' }}>
                      {isPersian ? 'توضیحات تکمیلی اسناد یا وضعیت تحصیلی (اختیاری)' : 'Additional Notes on Documents (Optional)'}
                    </Text>
                    <TextInput
                      value={documentNotes}
                      onChangeText={setDocumentNotes}
                      placeholder={isPersian ? 'هرگونه توضیح درباره مکتب قبلی، اسناد یا سال‌های وقفه تحصیلی...' : 'Any details about previous schooling or gaps...'}
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
                        textAlignVertical: 'top',
                        textAlign: isPersian ? 'right' : 'left',
                      }}
                    />
                  </View>
                </View>
              )}

              {/* STEP 6: Review & Final Submission */}
              {currentStep === 6 && (
                <View>
                  <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 13, textTransform: 'uppercase', marginBottom: 4, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian ? 'گام ۶ از ۶: خلاصه درخواست، تعهد و ارسال' : 'Step 6 of 6: Review & Final Submission'}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 18, textAlign: isPersian ? 'right' : 'left' }}>
                    {isPersian
                      ? 'لطفاً خلاصه اطلاعات وارد شده را بازبینی نموده و با زدن تیک تعهدنامه، درخواست را ارسال فرمایید.'
                      : 'Please verify the summary below and submit your formal admission request.'}
                  </Text>

                  {/* Summary Details Box */}
                  <View
                    style={{
                      backgroundColor: colors.cardHover,
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      marginBottom: 20,
                      gap: 8,
                    }}
                  >
                    <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{isPersian ? 'نام شاگرد:' : 'Student Name:'}</Text>
                      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13 }}>{studentFullName}</Text>
                    </View>

                    <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{isPersian ? 'صنف درخواستی:' : 'Target Grade:'}</Text>
                      <Text style={{ color: colors.gold, fontWeight: '900', fontSize: 13 }}>
                        {isPersian ? `صنف ${targetGrade} (معارف ملی)` : `Grade ${targetGrade}`}
                      </Text>
                    </View>

                    <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{isPersian ? 'نام و نسبت سرپرست:' : 'Guardian:'}</Text>
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12.5 }}>
                        {guardianFullName} ({guardianRelation})
                      </Text>
                    </View>

                    <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{isPersian ? 'شماره تماس سرپرست:' : 'Guardian Phone:'}</Text>
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12.5 }}>{guardianPhone}</Text>
                    </View>

                    <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{isPersian ? 'ولایت و ولسوالی:' : 'Location:'}</Text>
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12.5 }}>
                        {province} • {district}
                      </Text>
                    </View>

                    <View style={{ flexDirection: isPersian ? 'row-reverse' : 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{isPersian ? 'وضعیت اسناد:' : 'Documents:'}</Text>
                      <Text style={{ color: hasDocumentsNow ? colors.success : colors.gold, fontWeight: '700', fontSize: 12 }}>
                        {hasDocumentsNow ? (isPersian ? 'آماده بررسی' : 'Provided') : (isPersian ? 'ارسال مشروط بعداً' : 'Pending later')}
                      </Text>
                    </View>
                  </View>

                  {/* Declaration Checkboxes */}
                  <View style={{ gap: 12, marginBottom: 20 }}>
                    <TouchableOpacity
                      onPress={() => setDeclarationAgreed(!declarationAgreed)}
                      style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 10 }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          borderWidth: 2,
                          borderColor: declarationAgreed ? colors.gold : colors.textMuted,
                          backgroundColor: declarationAgreed ? colors.gold : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: 2,
                        }}
                      >
                        {declarationAgreed && <Text style={{ color: isDark ? '#000' : '#fff', fontSize: 11, fontWeight: '900' }}>✓</Text>}
                      </View>
                      <Text style={{ flex: 1, color: colors.text, fontSize: 12.5, lineHeight: 18, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian
                          ? 'صحت تمامی اطلاعات ارائه شده در این فورم را تأیید می‌کنم و به عنوان شاگرد/سرپرست، متعهد به حضور منظم در برنامه‌های آموزشی هستم.'
                          : 'I certify that all information submitted is true and accurate, and commit to active participation in educational sessions.'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setPrivacyConsent(!privacyConsent)}
                      style={{ flexDirection: isPersian ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 10 }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          borderWidth: 2,
                          borderColor: privacyConsent ? colors.gold : colors.textMuted,
                          backgroundColor: privacyConsent ? colors.gold : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: 2,
                        }}
                      >
                        {privacyConsent && <Text style={{ color: isDark ? '#000' : '#fff', fontSize: 11, fontWeight: '900' }}>✓</Text>}
                      </View>
                      <Text style={{ flex: 1, color: colors.text, fontSize: 12.5, lineHeight: 18, textAlign: isPersian ? 'right' : 'left' }}>
                        {isPersian
                          ? 'با سیاست‌های حفاظت از محرمانگی و حریم خصوصی شاگردان مکتب موافقت دارم و رضایت به تماس تیم بررسی پذیرش با سرپرست را اعلام می‌نمایم.'
                          : 'I agree to the student digital safety, privacy policies, and verification contact by the academic admissions committee.'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Submit Error Banner */}
              {submitError ? (
                <View
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    borderColor: '#EF4444',
                    borderWidth: 1.5,
                    borderRadius: 14,
                    padding: 14,
                    marginTop: 12,
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 13, textAlign: isPersian ? 'right' : 'left' }}>
                    ⚠️ {submitError}
                  </Text>
                </View>
              ) : null}

              {/* Action Buttons: Back / Next / Submit */}
              <View
                style={{
                  flexDirection: isPersian ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  borderTopWidth: 1,
                  borderTopColor: colors.cardBorder,
                  paddingTop: 16,
                  marginTop: 8,
                }}
              >
                {currentStep > 1 ? (
                  <TouchableOpacity
                    onPress={handleBack}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 12,
                      backgroundColor: colors.cardHover,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 13 }}>
                      {isPersian ? '← مرحله قبل' : '← Previous'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}

                {currentStep < totalSteps ? (
                  <TouchableOpacity
                    onPress={handleNext}
                    style={{
                      backgroundColor: colors.gold,
                      paddingVertical: 12,
                      paddingHorizontal: 24,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ color: isDark ? '#0F172A' : '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                      {isPersian ? 'مرحله بعد →' : 'Next Step →'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleSubmitApplication}
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: colors.primary,
                      paddingVertical: 12,
                      paddingHorizontal: 28,
                      borderRadius: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13.5 }}>
                        {isPersian ? 'ارسال نهایی درخواست شمولیت' : 'Submit Application'}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
