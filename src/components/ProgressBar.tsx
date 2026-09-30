import React from 'react';
import { View, Text } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 100
  showPercentage?: boolean;
  height?: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showPercentage = true,
  height = 8,
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <View className={`w-full my-2 ${className}`}>
      {showPercentage && (
        <View className="flex-row justify-between mb-1">
          <Text className="text-xs text-slate-400 font-medium">Progress</Text>
          <Text className="text-xs text-slate-300 font-semibold">{Math.round(clamped)}%</Text>
        </View>
      )}
      <View
        className="w-full bg-slate-800 rounded-full overflow-hidden"
        style={{ height }}
      >
        <View
          className="bg-brand-500 h-full rounded-full"
          style={{ width: `${clamped}%` }}
        />
      </View>
    </View>
  );
};
