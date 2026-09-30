import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { QuizCard } from '../../../src/components/QuizCard';
import { startFinalExamCallable, submitFinalExamCallable, ExamQuestionClient } from '../../../src/features/exam/examApi';
import { formatTime } from '../../../src/lib/utils';

export default function FinalExamScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ExamQuestionClient[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingSec, setRemainingSec] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState('');

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
  });

  // Countdown timer effect
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setRemainingSec(diff);
      if (diff <= 0) {
        clearInterval(interval);
        // Auto-submit when time expires
        if (!submitMutation.data && !submitMutation.isPending) {
          submitMutation.mutate();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, submitMutation]);

  const result = submitMutation.data;

  return (
    <ScreenWrapper>
      <View className="max-w-3xl w-full self-center pb-12">
        <Text className="text-2xl font-bold text-white mb-2">Course Final Exam</Text>
        <Text className="text-slate-400 text-sm mb-6">
          Score 80% or higher to receive your official verifiable course certificate.
        </Text>

        {errorMsg ? (
          <Card className="border-red-800 bg-red-950/60 mb-6">
            <Text className="text-red-300 text-base font-semibold mb-2">Cannot Start Exam</Text>
            <Text className="text-slate-300 text-sm mb-4">{errorMsg}</Text>
            <Button
              title="Return to Course Outline"
              onPress={() => router.replace(`/(student)/course/${courseId}` as any)}
            />
          </Card>
        ) : !attemptId ? (
          <Card className="border-brand-500">
            <Text className="text-lg font-bold text-white mb-2">Ready to Start Your Exam?</Text>
            <Text className="text-slate-300 text-sm mb-6 leading-6">
              • Timed Examination (30 Minutes){'\n'}
              • Randomized questions from question bank{'\n'}
              • Passing Score: 80%{'\n'}
              • Downloadable PDF Certificate upon completion
            </Text>
            <Button
              title="Start Final Exam Now"
              onPress={() => startMutation.mutate()}
              loading={startMutation.isPending}
            />
          </Card>
        ) : (
          <>
            {/* Active Exam Timer Banner */}
            <View className="bg-slate-800 border border-surface-border p-4 rounded-2xl mb-6 flex-row justify-between items-center sticky top-0 z-10">
              <Text className="text-white font-semibold">Exam in Progress</Text>
              <View className="bg-brand-950 border border-brand-500 px-3 py-1.5 rounded-xl">
                <Text className="text-brand-300 font-bold font-mono">
                  ⏳ {formatTime(remainingSec)}
                </Text>
              </View>
            </View>

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
              <Card className={`mb-6 border ${result.passed ? 'border-emerald-500 bg-emerald-950/40' : 'border-red-500 bg-red-950/40'}`}>
                <Text className={`text-2xl font-bold mb-1 ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {result.passed ? '🎉 Congratulations! Exam Passed!' : 'Exam Failed'}
                </Text>
                <Text className="text-slate-300 text-lg mb-2">
                  Final Score: {result.scorePercent}% (Pass Mark: {result.passPercentage}%)
                </Text>
                <Text className="text-slate-400 text-sm mb-6">
                  {result.passed
                    ? 'Your official certificate has been issued and stored in Firebase Storage.'
                    : 'You can retry the exam after the cooldown period.'}
                </Text>

                <View className="space-y-3">
                  {result.passed && result.certificateId ? (
                    <Button
                      title="View & Download Certificate →"
                      variant="primary"
                      onPress={() => router.push('/(student)/certificates' as any)}
                      className="mb-3"
                    />
                  ) : null}
                  <Button
                    title="Return to Course Catalog"
                    variant="secondary"
                    onPress={() => router.replace('/(student)')}
                  />
                </View>
              </Card>
            ) : (
              <Button
                title="Submit Final Exam Answers"
                onPress={() => submitMutation.mutate()}
                loading={submitMutation.isPending}
              />
            )}
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}
