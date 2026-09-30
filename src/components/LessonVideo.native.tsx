import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
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
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [watched, setWatched] = useState(false);

  const handleStateChange = (state: string) => {
    if (state === 'ended') {
      setPlaying(false);
      setWatched(true);
      if (onVideoEnd) onVideoEnd();
      if (onWatchedThresholdReached) onWatchedThresholdReached();
    }
  };

  const openInYouTube = () => {
    Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
  };

  if (error || !videoId || videoId === 'REPLACE_ME') {
    return (
      <View className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 my-4 items-center justify-center">
        <Text className="text-amber-400 font-semibold text-base mb-2 text-center">
          Video Player Demo / Unavailable
        </Text>
        <Text className="text-slate-400 text-sm text-center mb-4">
          {videoId === 'REPLACE_ME'
            ? 'Placeholder video link. Replace with a valid YouTube video ID.'
            : 'Unable to embed video directly.'}
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
    <View className="w-full bg-black rounded-2xl overflow-hidden my-4 border border-surface-border">
      <YoutubePlayer
        height={220}
        play={playing}
        videoId={videoId}
        onChangeState={handleStateChange}
        onError={() => setError(true)}
      />
      {!watched && (
        <View className="p-3 bg-surface-card border-t border-surface-border flex-row justify-between items-center">
          <Text className="text-xs text-slate-400">Watch full video or tap below when finished:</Text>
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
