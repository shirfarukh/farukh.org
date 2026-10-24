import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Linking,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { QuizCard } from '../../../src/components/QuizCard';
import { CertificateViewer } from '../../../src/components/CertificateViewer';
import { useTheme } from '../../../src/features/theme/ThemeContext';
import { useAuth } from '../../../src/features/auth/useAuth';
import { startFinalExamCallable, submitFinalExamCallable, ExamQuestionClient } from '../../../src/features/exam/examApi';
import {
  issueCertificateCallable,
  listenToCertificate,
} from '../../../src/features/certificates/certificatesApi';
import { getCourseDetail } from '../../../src/features/student/studentApi';
import {
  validateEnglishName,
  validatePersianName,
} from '../../../src/lib/certificateValidation';
import { formatTime } from '../../../src/lib/utils';
import { Certificate } from '../../../src/types/certificate';

export default function FinalExamScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');

  const { data: course } = useQuery({
    queryKey: ['courseDetail', courseId],
    queryFn: () => getCourseDetail(courseId!),
    enabled: !!courseId,
  });

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ExamQuestionClient[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingSec, setRemainingSec] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState('');

  // Certificate Issuance State
  const [nameEn, setNameEn] = useState(user?.displayName || '');
  const [nameFa, setNameFa] = useState('');
  const [hasInteractedEn, setHasInteractedEn] = useState(false);
  const [hasInteractedFa, setHasInteractedFa] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeCertificateId, setActiveCertificateId] = useState<string | null>(null);
  const [liveCertificate, setLiveCertificate] = useState<Certificate | null>(null);
  const [issuanceError, setIssuanceError] = useState('');

  const startMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg('');
      if (!courseId) return;
      return await startFinalExamCallable(courseId);
    },
    onSuccess: (data) => {
      if (data) {
        setAttemptId(data.attemptId);
        setQuestions(data.questions);
        setExpiresAt(data.expiresAt);
      }
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to start exam.');
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!attemptId) return;
      return await submitFinalExamCallable(attemptId, answers);
    },
    onSuccess: (data) => {
      if (data?.certificateId) {
        setActiveCertificateId(data.certificateId);
      }
    },
  });

  const mutateRef = React.useRef(submitMutation.mutate);
  useEffect(() => {
    mutateRef.current = submitMutation.mutate;
  }, [submitMutation.mutate]);

  const autoSubmittedRef = React.useRef(false);

  // Countdown timer effect
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setRemainingSec(diff);
      if (diff <= 0) {
        clearInterval(interval);
        if (!autoSubmittedRef.current) {
          autoSubmittedRef.current = true;
          mutateRef.current();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Real-time listener on activeCertificateId
  useEffect(() => {
    if (!activeCertificateId) return;
    const unsubscribe = listenToCertificate(
      activeCertificateId,
      (cert) => {
        setLiveCertificate(cert);
      },
      (err) => {
        console.error('Error listening to certificate:', err);
      }
    );
    return () => unsubscribe();
  }, [activeCertificateId]);

  // Client-side validations
  const enValidation = validateEnglishName(nameEn);
  const faValidation = validatePersianName(nameFa);
  const isNamesValid = enValidation.isValid && faValidation.isValid;

  const issueMutation = useMutation({
    mutationFn: async () => {
      if (!attemptId) throw new Error('Attempt ID missing');
      setIssuanceError('');
      return await issueCertificateCallable({
        attemptId,
        nameEn: nameEn.trim(),
        nameFa: nameFa.trim(),
      });
    },
    onSuccess: (data) => {
      setShowConfirmModal(false);
      if (data?.certificateId) {
        setActiveCertificateId(data.certificateId);
      }
    },
    onError: (err: any) => {
      setIssuanceError(err.message || 'Certificate issuance failed.');
    },
  });

  const result = submitMutation.data;
  const storageBucket = Constants.expoConfig?.extra?.firebaseStorageBucket || 'farukh-org.firebasestorage.app';

  return (
    <ScreenWrapper>
      <View className="max-w-3xl w-full self-center pb-16">
        <Text style={{ color: colors.text }} className="text-2xl font-bold mb-2">
          {isPersian ? 'امتحان نهایی دوره' : 'Course Final Exam'}
        </Text>
        <Text style={{ color: colors.textSecondary }} className="text-sm mb-6">
          {isPersian
            ? 'برای دریافت گواهینامه معتبر رسمی بین‌المللی FARUKH.ORG و AECCI حداقل نمره ۸۰٪ الزامی است.'
            : 'Score 80% or higher to receive your official verifiable course certificate credited by AECCI.'}
        </Text>

        {course?.isUnfinished && (
          <View
            style={{
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
              borderColor: 'rgba(245, 158, 11, 0.4)',
              borderWidth: 1,
              borderRadius: 14,
              padding: 12,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 24 }}>⏳</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#D97706', fontWeight: 'bold', fontSize: 13 }}>
                {isPersian ? 'دوره در حال تدوین • گواهینامه غیرفعال' : 'Unfinished Course • Certificate Disabled'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                {isPersian
                  ? 'این دوره هنوز توسط استاد تکمیل نگردیده است. شرکت در آزمون جهت سنجش مهارت مجاز است، اما صدور تصدیق‌نامه تا زمان تکمیل کامل دوره امکان‌پذیر نمی‌باشد.'
                  : 'This course is currently in-progress and marked as unfinished by the instructor. You can take the exam for practice, but certificates will not be issued until the course is completed.'}
              </Text>
            </View>
          </View>
        )}

        {errorMsg ? (
          <Card className="border-red-800 bg-red-950/60 mb-6">
            <Text className="text-red-300 text-base font-semibold mb-2">
              {isPersian ? 'خطا در شروع امتحان' : 'Cannot Start Exam'}
            </Text>
            <Text className="text-slate-300 text-sm mb-4">{errorMsg}</Text>
            <Button
              title={isPersian ? 'بازگشت به برنامه دوره' : 'Return to Course Outline'}
              onPress={() => router.replace(`/(student)/course/${courseId}` as any)}
            />
          </Card>
        ) : !attemptId ? (
          <Card className="border-brand-500">
            <Text style={{ color: colors.text }} className="text-lg font-bold mb-2">
              {isPersian ? 'آماده شرکت در امتحان نهایی هستید؟' : 'Ready to Start Your Final Exam?'}
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-sm mb-6 leading-6">
              {isPersian
                ? '• زمان امتحان: ۳۰ دقیقه\n• سوالات تصادفی از بانک سوالات دوره\n• حداقل نمره قبولی: ۸۰٪\n• صدور تصدیق‌نامه رسمی دوزبانه (فارسی و انگلیسی) با کد QR استعلام دایمی'
                : '• Timed Examination (30 Minutes)\n• Randomized questions from official pool\n• Passing Score: 80%\n• Official bilingual PDF & JPG Certificate with permanent verification QR'}
            </Text>
            <Button
              title={isPersian ? 'شروع امتحان نهایی' : 'Start Final Exam Now'}
              onPress={() => startMutation.mutate()}
              loading={startMutation.isPending}
            />
          </Card>
        ) : (
          <>
            {/* Active Exam Timer Banner */}
            {!result && (
              <View
                style={{
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: colors.cardBorder,
                  borderWidth: 1,
                }}
                className="p-4 rounded-2xl mb-6 flex-row justify-between items-center sticky top-0 z-10"
              >
                <Text style={{ color: colors.text }} className="font-semibold">
                  {isPersian ? 'امتحان در حال اجرا' : 'Exam in Progress'}
                </Text>
                <View className="bg-brand-950 border border-brand-500 px-3 py-1.5 rounded-xl">
                  <Text className="text-brand-300 font-bold font-mono">
                    ⏳ {formatTime(remainingSec)}
                  </Text>
                </View>
              </View>
            )}

            {/* Questions List */}
            {questions.map((q, idx) => (
              <QuizCard
                key={q.id}
                questionNumber={idx + 1}
                totalQuestions={questions.length}
                questionText={q.text}
                options={q.options}
                selectedOptionId={answers[q.id]}
                onSelectOption={(optId) => setAnswers({ ...answers, [q.id]: optId })}
                feedback={result?.feedback?.[q.id]}
                disabled={submitMutation.isPending || !!result}
              />
            ))}

            {/* Result Display */}
            {result ? (
              <View className="space-y-6">
                <Card
                  className={`border ${
                    result.passed
                      ? 'border-emerald-500 bg-emerald-950/30'
                      : 'border-red-500 bg-red-950/30'
                  }`}
                >
                  <Text
                    className={`text-2xl font-bold mb-1 ${
                      result.passed ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {result.passed
                      ? isPersian
                        ? '🎉 تبریک! شما در امتحان نهایی کامیاب شدید!'
                        : '🎉 Congratulations! You Passed the Final Exam!'
                      : isPersian
                      ? 'متاسفانه نمره قبولی حاصل نشد'
                      : 'Exam Failed'}
                  </Text>
                  <Text style={{ color: colors.text }} className="text-lg mb-2">
                    {isPersian
                      ? `نمره نهایی: ${result.scorePercent}٪ (حد نصاب قبولی: ${result.passPercentage}٪)`
                      : `Final Score: ${result.scorePercent}% (Required Pass Mark: ${result.passPercentage}%)`}
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-sm">
                    {result.passed
                      ? isPersian
                        ? 'شما واجد شرایط اخذ تصدیق‌نامه رسمی FARUKH.ORG و AECCI گردیدید.'
                        : 'You are now eligible to receive your official accredited certificate.'
                      : isPersian
                      ? 'شما می‌توانید پس از پایان مهلت استراحت مجدداً امتحان را تکرار کنید.'
                      : 'You can retry the exam after the cooldown period.'}
                  </Text>
                </Card>

                {/* CERTIFICATE ISSUANCE SECTION */}
                {result.passed && (
                  <Card
                    style={{
                      borderColor: colors.gold,
                      borderWidth: 1.5,
                      backgroundColor: isDark ? 'rgba(30,41,59,0.85)' : '#FFFFFF',
                    }}
                    className="p-6"
                  >
                    {/* CASE A: Certificate is Ready */}
                    {liveCertificate && liveCertificate.status === 'ready' ? (
                      <View>
                        <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-slate-700/50">
                          <View>
                            <Text style={{ color: colors.gold }} className="text-xs font-bold uppercase tracking-wider">
                              {isPersian ? 'تصدیق‌نامه رسمی صادر شد' : 'Official Certificate Issued'}
                            </Text>
                            <Text style={{ color: colors.text }} className="text-xl font-bold mt-1">
                              {liveCertificate.courseTitleEn}
                            </Text>
                          </View>
                          <Badge label="✓ READY & VERIFIED" variant="success" />
                        </View>

                        {/* Official Visual Certificate Image with Overlaid Details & Black QR Code */}
                        <CertificateViewer certificate={liveCertificate} />

                        <View className="space-y-3 mt-4">
                          {liveCertificate.pdfPath && (
                            <Button
                              title={isPersian ? 'دانلود تصدیق‌نامه چاپی (PDF)' : 'Download Certified PDF Certificate'}
                              variant="primary"
                              onPress={() => {
                                const url = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(liveCertificate.pdfPath!)}?alt=media`;
                                Linking.openURL(url);
                              }}
                            />
                          )}

                          {liveCertificate.jpgPath && (
                            <Button
                              title={isPersian ? 'دانلود تصویر باکیفیت (JPG)' : 'Download High-Resolution JPG'}
                              variant="outline"
                              onPress={() => {
                                const url = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(liveCertificate.jpgPath!)}?alt=media`;
                                Linking.openURL(url);
                              }}
                            />
                          )}

                          <Button
                            title={isPersian ? 'مشاهده صفحه تایید و استعلام عمومی →' : 'View Public Verification Page →'}
                            variant="secondary"
                            onPress={() => router.push(`/verify/${liveCertificate.certificateId || liveCertificate.id}` as any)}
                          />
                        </View>
                      </View>
                    ) : issueMutation.isPending || (liveCertificate && liveCertificate.status === 'generating') ? (
                      /* CASE B: Generating State */
                      <View className="py-8 items-center">
                        <ActivityIndicator size="large" color={colors.gold} />
                        <Text style={{ color: colors.text }} className="text-lg font-bold mt-4">
                          {isPersian
                            ? 'در حال صدور و رندر تصدیق‌نامه رسمی...'
                            : 'Rendering Official High-Resolution Certificate...'}
                        </Text>
                        <Text style={{ color: colors.textSecondary }} className="text-xs mt-2 text-center max-w-md">
                          {isPersian
                            ? 'سیستم در حال رندر با موتور Chromium و بارگذاری در سرور ابری می‌باشد. لطفاً چند لحظه شکیبا باشید.'
                            : 'Headless Chromium is rendering your certified PDF & JPG with high-resolution vector fonts and QR code.'}
                        </Text>
                      </View>
                    ) : course?.isUnfinished ? (
                      /* CASE C-0: Unfinished Course - Certificate Disabled */
                      <View
                        style={{
                          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
                          borderColor: 'rgba(245, 158, 11, 0.4)',
                          borderWidth: 1,
                          borderRadius: 16,
                          padding: 18,
                          alignItems: 'center',
                          marginVertical: 8,
                        }}
                      >
                        <Text style={{ fontSize: 32, marginBottom: 8 }}>⏳</Text>
                        <Text style={{ color: '#D97706', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
                          {isPersian
                            ? 'دوره در حال تدوین است • صدور گواهینامه غیرفعال'
                            : 'Course Is In Progress • Certificate Issuance Disabled'}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
                          {isPersian
                            ? 'تبریک! شما این آزمون را با موفقیت پشت سر گذاشتید و نمره شما در سوابق سیستم ثبت گردید. با توجه به اینکه این دوره در وضعیت «تکمیل‌نشده» قرار دارد، صدور تصدیق‌نامه رسمی پس از تکمیل نهایی دوره توسط استاد فعال خواهد شد.'
                            : 'Congratulations on passing! Your score has been officially recorded in your student profile. Because this course is currently marked as unfinished by the instructor, certificates will be issued once the course is completed.'}
                        </Text>
                      </View>
                    ) : (
                      /* CASE C: Required Name Inputs Form */
                      <View>
                        <View className="mb-4">
                          <Text style={{ color: colors.gold }} className="text-xs font-bold uppercase tracking-wider mb-1">
                            {isPersian ? 'مرحله صدور تصدیق‌نامه رسمی' : 'Official Certificate Issuance'}
                          </Text>
                          <Text style={{ color: colors.text }} className="text-xl font-bold">
                            {isPersian ? 'ثبت نام دو زبانه جهت درج در گواهینامه' : 'Enter Official Bilingual Names'}
                          </Text>
                          <Text style={{ color: colors.textSecondary }} className="text-xs mt-1 leading-5">
                            {isPersian
                              ? 'تصدیق‌نامه رسمی شما به هر دو زبان انگلیسی و فارسی صادر خواهد شد. لطفاً نام خود را دقیقاً مطابق با اسناد هویتی وارد نمایید.'
                              : 'Your certificate will be issued with both English and Persian official names. Please enter exact spelling.'}
                          </Text>
                        </View>

                        {issuanceError ? (
                          <View className="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-800">
                            <Text className="text-red-300 text-xs font-semibold">{issuanceError}</Text>
                          </View>
                        ) : null}

                        {/* Input 1: English Name */}
                        <View className="mb-4">
                          <View className="flex-row justify-between mb-1">
                            <Text style={{ color: colors.text }} className="text-sm font-bold">
                              Full Name (English, Latin letters only) <Text className="text-red-400">*</Text>
                            </Text>
                            <Text style={{ color: colors.textMuted }} className="text-xs">
                              {nameEn.length}/60
                            </Text>
                          </View>
                          <TextInput
                            value={nameEn}
                            onChangeText={(text) => {
                              setNameEn(text);
                              if (!hasInteractedEn) setHasInteractedEn(true);
                            }}
                            onBlur={() => setHasInteractedEn(true)}
                            placeholder="e.g. Shir Farukh"
                            placeholderTextColor={colors.textMuted}
                            style={{
                              backgroundColor: isDark ? 'rgba(15,23,42,0.8)' : '#F8FAFC',
                              color: colors.text,
                              borderColor: hasInteractedEn && !enValidation.isValid ? '#EF4444' : colors.cardBorder,
                              borderWidth: 1.5,
                              borderRadius: 12,
                              paddingHorizontal: 14,
                              paddingVertical: 12,
                              fontSize: 15,
                            }}
                          />
                          {hasInteractedEn && !enValidation.isValid && (
                            <Text className="text-red-400 text-xs mt-1">
                              {isPersian ? enValidation.errorFa : enValidation.errorEn}
                            </Text>
                          )}
                          <Text style={{ color: colors.textMuted }} className="text-xs mt-1">
                            Latin characters, hyphen, apostrophe, dot (2–60 chars).
                          </Text>
                        </View>

                        {/* Input 2: Persian Name */}
                        <View className="mb-6">
                          <View className="flex-row justify-between mb-1">
                            <Text style={{ color: colors.text }} className="text-sm font-bold">
                              نام و تخلص کامل (فارسی / دری) <Text className="text-red-400">*</Text>
                            </Text>
                            <Text style={{ color: colors.textMuted }} className="text-xs">
                              {nameFa.length}/60
                            </Text>
                          </View>
                          <TextInput
                            value={nameFa}
                            onChangeText={(text) => {
                              setNameFa(text);
                              if (!hasInteractedFa) setHasInteractedFa(true);
                            }}
                            onBlur={() => setHasInteractedFa(true)}
                            placeholder="مثلاً: شیر فرخ"
                            placeholderTextColor={colors.textMuted}
                            textAlign="right"
                            style={{
                              backgroundColor: isDark ? 'rgba(15,23,42,0.8)' : '#F8FAFC',
                              color: colors.text,
                              borderColor: hasInteractedFa && !faValidation.isValid ? '#EF4444' : colors.cardBorder,
                              borderWidth: 1.5,
                              borderRadius: 12,
                              paddingHorizontal: 14,
                              paddingVertical: 12,
                              fontSize: 15,
                            }}
                          />
                          {hasInteractedFa && !faValidation.isValid && (
                            <Text className="text-red-400 text-xs mt-1 text-right">
                              {isPersian ? faValidation.errorFa : faValidation.errorEn}
                            </Text>
                          )}
                          <Text style={{ color: colors.textMuted }} className="text-xs mt-1 text-right">
                            فقط حروف فارسی/دری بدون اعداد (۲ تا ۶۰ حرف).
                          </Text>
                        </View>

                        {/* Submit Button to open Confirmation Dialog */}
                        <Button
                          title={isPersian ? 'بررسی و تایید نهایی تصدیق‌نامه →' : 'Review & Confirm Certificate Details →'}
                          variant="primary"
                          disabled={!isNamesValid}
                          onPress={() => {
                            setHasInteractedEn(true);
                            setHasInteractedFa(true);
                            if (isNamesValid) {
                              setShowConfirmModal(true);
                            }
                          }}
                        />
                      </View>
                    )}
                  </Card>
                )}

                <Button
                  title={isPersian ? 'بازگشت به فهرست دوره‌ها' : 'Return to Course Catalog'}
                  variant="secondary"
                  onPress={() => router.replace('/(student)')}
                />
              </View>
            ) : (
              <Button
                title={isPersian ? 'ثبت و ارسال پاسخ‌های امتحان نهایی' : 'Submit Final Exam Answers'}
                onPress={() => submitMutation.mutate()}
                loading={submitMutation.isPending}
              />
            )}
          </>
        )}
      </View>

      {/* CONFIRMATION DIALOG MODAL */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.75)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: colors.gold,
              borderWidth: 2,
              borderRadius: 24,
              maxWidth: 550,
              width: '100%',
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* Modal Title */}
            <View className="items-center mb-4">
              <Text style={{ fontSize: 32 }} className="mb-2">⚠️</Text>
              <Text style={{ color: colors.text }} className="text-xl font-bold text-center">
                {isPersian ? 'تایید نهایی املای نام تصدیق‌نامه' : 'Permanent Name Confirmation'}
              </Text>
              <Text style={{ color: '#EF4444' }} className="text-xs font-bold text-center mt-1">
                {isPersian
                  ? 'توجه: پس از صدور، املای نام به هیچ عنوان قابل تغییر نخواهد بود.'
                  : 'Warning: Spelling cannot be changed after issuing.'}
              </Text>
            </View>

            {/* Large Name Displays */}
            <View
              style={{
                backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : '#F8FAFC',
                borderColor: colors.cardBorder,
                borderWidth: 1,
                borderRadius: 16,
                padding: 18,
                marginBottom: 18,
              }}
            >
              {/* English Name Large */}
              <View className="mb-4 pb-3 border-b border-slate-700/50">
                <Text style={{ color: colors.textSecondary }} className="text-xs mb-1 font-semibold uppercase">
                  Name in English (Latin)
                </Text>
                <Text style={{ color: colors.gold, fontSize: 22, fontWeight: '800' }}>
                  {nameEn}
                </Text>
              </View>

              {/* Persian Name Large */}
              <View>
                <Text style={{ color: colors.textSecondary }} className="text-xs mb-1 font-semibold text-right">
                  نام و تخلص به فارسی / دری
                </Text>
                <Text style={{ color: colors.gold, fontSize: 24, fontWeight: '800', textAlign: 'right' }}>
                  {nameFa}
                </Text>
              </View>
            </View>

            {/* Explanation Warning */}
            <View className="p-3.5 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <Text style={{ color: isDark ? '#FCD34D' : '#B45309' }} className="text-xs leading-5">
                {isPersian
                  ? 'این نام‌ها به صورت دائمی در پایگاه داده بلاک‌چین/سرور ثبت شده و کد QR استعلام بین‌المللی با این مشخصات تولید می‌گردد. لطفاً در صورت وجود هرگونه اشتباه تایپی دکمه ویرایش را بزنید.'
                  : 'Your official certificate and verification QR code will be permanently minted with these exact names. If any spelling correction is needed, please click Edit now.'}
              </Text>
            </View>

            {/* Localized Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                disabled={issueMutation.isPending}
                onPress={() => setShowConfirmModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: colors.cardBorder,
                  alignItems: 'center',
                  backgroundColor: 'rgba(148,163,184,0.1)',
                }}
              >
                <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>
                  {isPersian ? 'ویرایش مجدد' : 'Edit'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={issueMutation.isPending}
                onPress={() => issueMutation.mutate()}
                style={{
                  flex: 1.5,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: '#22C55E',
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {issueMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>
                    {isPersian ? 'تایید و صدور قطعی ✓' : 'Confirm & Issue ✓'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
