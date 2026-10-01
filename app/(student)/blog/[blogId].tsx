import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { fetchBlogPostById } from '../../../src/features/blog/blogApi';
import { AppLogo } from '../../../src/components/ui/AppLogo';

export default function BlogDetailScreen() {
  const { blogId } = useLocalSearchParams<{ blogId: string }>();
  const router = useRouter();

  const { data: post, isLoading } = useQuery({
    queryKey: ['blogPost', blogId],
    queryFn: () => fetchBlogPostById(blogId!),
    enabled: !!blogId,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface-dark justify-center items-center">
        <ActivityIndicator size="large" color="#FACC15" />
      </View>
    );
  }

  if (!post) {
    return (
      <ScreenWrapper>
        <View className="max-w-md w-full self-center my-auto">
          <Card className="p-6 items-center">
            <Text className="text-xl font-bold text-white mb-2">Article Not Found</Text>
            <Text className="text-slate-400 text-sm mb-4">The article you are looking for does not exist.</Text>
            <Button title="Back to Articles" onPress={() => router.push('/(student)/blog' as any)} />
          </Card>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView className="flex-1 py-6 max-w-3xl w-full self-center">
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-6 self-start bg-surface-card border border-surface-border px-4 py-2 rounded-xl"
        >
          <Text className="text-slate-300 font-semibold text-sm">← Back to Articles</Text>
        </TouchableOpacity>

        <Card className="p-6 md:p-10 border-brand-600/30 bg-surface-card mb-8">
          {/* Article Category & Metadata */}
          <View className="flex-row justify-between items-center mb-4">
            <Badge label={post.category} variant="warning" />
            <Text className="text-slate-400 text-xs font-semibold">{post.readTime} • {post.publishedAt}</Text>
          </View>

          {/* Article Title */}
          <Text className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
            {post.title}
          </Text>

          {/* Author info */}
          <View className="flex-row items-center gap-3 border-b border-surface-border pb-6 mb-6">
            <AppLogo size={40} />
            <View>
              <Text className="text-white font-bold text-base">{post.author.name}</Text>
              <Text className="text-gold-400 text-xs font-medium">{post.author.role}</Text>
            </View>
          </View>

          {/* Summary Box */}
          <View className="bg-brand-900/40 border-l-4 border-gold-400 p-4 rounded-r-2xl mb-8">
            <Text className="text-gold-100 font-medium text-base italic leading-relaxed">
              "{post.summary}"
            </Text>
          </View>

          {/* Content Body */}
          <View className="space-y-4">
            {post.content.split('\n\n').map((paragraph, idx) => {
              if (paragraph.startsWith('### ')) {
                return (
                  <Text key={idx} className="text-2xl font-bold text-white mt-4 mb-2">
                    {paragraph.replace('### ', '')}
                  </Text>
                );
              }
              return (
                <Text key={idx} className="text-slate-300 text-base md:text-lg leading-relaxed mb-4">
                  {paragraph}
                </Text>
              );
            })}
          </View>

          {/* Tags */}
          <View className="flex-row flex-wrap gap-2 border-t border-surface-border pt-6 mt-8">
            {post.tags.map((tag) => (
              <View key={tag} className="bg-surface-dark border border-surface-border px-3 py-1.5 rounded-lg">
                <Text className="text-gold-300 text-xs font-medium">#{tag}</Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}
