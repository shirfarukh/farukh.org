import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { QuizOption } from '../types/quiz';

interface QuizCardProps {
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  options: QuizOption[];
  selectedOptionId?: string;
  onSelectOption: (optionId: string) => void;
  feedback?: {
    correct: boolean;
    correctOptionId: string;
    explanation: string;
  };
  disabled?: boolean;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  questionNumber,
  totalQuestions,
  questionText,
  options,
  selectedOptionId,
  onSelectOption,
  feedback,
  disabled = false,
}) => {
  return (
    <View className="bg-surface-card border border-surface-border p-5 rounded-2xl mb-4">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
          Question {questionNumber} of {totalQuestions}
        </Text>
      </View>

      <Text className="text-white text-lg font-medium mb-4 leading-6">
        {questionText}
      </Text>

      <View className="space-y-2.5">
        {options.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          let optionStyle = 'bg-slate-800/80 border-surface-border';
          let textStyle = 'text-slate-200';

          if (feedback) {
            if (opt.id === feedback.correctOptionId) {
              optionStyle = 'bg-emerald-950/80 border-emerald-500';
              textStyle = 'text-emerald-300 font-semibold';
            } else if (isSelected && !feedback.correct) {
              optionStyle = 'bg-red-950/80 border-red-500';
              textStyle = 'text-red-300 font-semibold';
            }
          } else if (isSelected) {
            optionStyle = 'bg-brand-950/80 border-brand-500';
            textStyle = 'text-brand-300 font-semibold';
          }

          return (
            <TouchableOpacity
              key={opt.id}
              disabled={disabled}
              onPress={() => onSelectOption(opt.id)}
              activeOpacity={0.7}
              className={`p-3.5 rounded-xl border flex-row items-center justify-between my-1 ${optionStyle}`}
            >
              <Text className={`text-base flex-1 pr-2 ${textStyle}`}>
                {opt.text}
              </Text>
              {isSelected && !feedback && (
                <View className="w-4 h-4 rounded-full bg-brand-500" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {feedback && (
        <View
          className={`mt-4 p-3.5 rounded-xl border ${
            feedback.correct
              ? 'bg-emerald-950/40 border-emerald-800/60'
              : 'bg-red-950/40 border-red-800/60'
          }`}
        >
          <Text
            className={`font-semibold text-sm mb-1 ${
              feedback.correct ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {feedback.correct ? 'Correct Answer!' : 'Incorrect'}
          </Text>
          {feedback.explanation ? (
            <Text className="text-slate-300 text-sm">{feedback.explanation}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
};
