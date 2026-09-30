import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Button } from './ui/Button';

interface LessonVideoProps {
  videoId: string;
  onVideoEnd?: () => void;
  onWatchedThresholdReached?: () => void;
}

export const LessonVideo: React.FC<LessonVideoProps> = ({
  videoId,
  onVideoEnd,
  onWatchedThresholdReached,
}) => {
  const [watched, setWatched] = useState(false);
  const isPlaceholder = !videoId || videoId === 'REPLACE_ME';

  const openInYouTube = () => {
    Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
  };

  if (isPlaceholder) {
    return (
      <View className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 my-4 items-center justify-center">
        <Text className="text-amber-400 font-semibold text-base mb-2 text-center">
          Video Player Demo / Placeholder
        </Text>
        <Text className="text-slate-400 text-sm text-center mb-4">
          Replace `REPLACE_ME` in course lesson configuration with your YouTube video ID.
        </Text>
        <Button
          title="Open in YouTube"
          variant="outline"
          onPress={openInYouTube}
        />
      </View>
    );
  }

  return (
    <View className="w-full my-4">
      <View className="w-full bg-black rounded-2xl overflow-hidden border border-surface-border aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Lesson Video"
        />
      </View>

      {!watched && (
        <View className="mt-2 p-3 bg-surface-card border border-surface-border rounded-xl flex-row justify-between items-center">
          <Text className="text-xs text-slate-400">Mark video watched to enable quiz submission:</Text>
          <TouchableOpacity
            onPress={() => {
              setWatched(true);
              if (onWatchedThresholdReached) onWatchedThresholdReached();
            }}
            className="bg-brand-600 px-3 py-1.5 rounded-lg"
          >
            <Text className="text-white text-xs font-semibold">I finished watching</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
