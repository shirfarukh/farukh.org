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
import { useTheme } from '../../../src/features/theme/ThemeContext';

export default function BlogDetailScreen() {
  const { blogId } = useLocalSearchParams<{ blogId: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const { data: post, isLoading } = useQuery({
    queryKey: ['blogPost', blogId],
    queryFn: () => fetchBlogPostById(blogId!),
    enabled: !!blogId,
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (!post) {
    return (
      <ScreenWrapper>
        <View className="max-w-md w-full self-center my-auto">
          <Card style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 6 }}>
              Article Not Found
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 16 }}>
              The article you are looking for does not exist.
            </Text>
            <Button title="Back to Articles" onPress={() => router.push('/(student)/blog' as any)} />
          </Card>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollable={true} edgeTop={false}>
      <View className="max-w-3xl w-full self-center px-4 py-6 pb-20">
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.push('/(student)/blog' as any)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
            alignSelf: 'flex-start',
            backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
            borderColor: colors.cardBorder,
            borderWidth: 1,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>
            ← Back to Articles
          </Text>
        </TouchableOpacity>

        <Card
          style={{
            padding: 24,
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF',
            borderColor: colors.cardBorder,
            marginBottom: 24,
          }}
        >
          {/* Article Category & Metadata */}
          <View className="flex-row justify-between items-center mb-4">
            <Badge label={post.category} variant="warning" />
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
              ⏱️ {post.readTime} • {post.publishedAt}
            </Text>
          </View>

          {/* Article Title */}
          <Text
            style={{
              color: colors.text,
              fontSize: 24,
              fontWeight: '900',
              lineHeight: 32,
              marginBottom: 16,
            }}
          >
            {post.title}
          </Text>

          {/* Author info */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.cardBorder,
              paddingBottom: 16,
              marginBottom: 20,
            }}
          >
            <AppLogo size={36} />
            <View>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
                {post.author.name}
              </Text>
              <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '600' }}>
                {post.author.role}
              </Text>
            </View>
          </View>

          {/* Summary Box */}
          <View
            style={{
              backgroundColor: isDark ? 'rgba(217, 119, 6, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              borderLeftWidth: 4,
              borderLeftColor: colors.gold,
              padding: 16,
              borderRadius: 12,
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontWeight: '600',
                fontSize: 14,
                fontStyle: 'italic',
                lineHeight: 22,
              }}
            >
              "{post.summary}"
            </Text>
          </View>

          {/* Content Body */}
          <View style={{ gap: 16 }}>
            {post.content.split('\n\n').map((paragraph, idx) => {
              if (paragraph.startsWith('### ')) {
                return (
                  <Text
                    key={idx}
                    style={{
                      color: colors.text,
                      fontSize: 18,
                      fontWeight: '800',
                      marginTop: 12,
                      marginBottom: 6,
                    }}
                  >
                    {paragraph.replace('### ', '')}
                  </Text>
                );
              }
              return (
                <Text
                  key={idx}
                  style={{
                    color: colors.textSecondary,
                    fontSize: 14,
                    lineHeight: 24,
                  }}
                >
                  {paragraph}
                </Text>
              );
            })}
          </View>

          {/* Tags */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              borderTopWidth: 1,
              borderTopColor: colors.cardBorder,
              paddingTop: 18,
              marginTop: 24,
            }}
          >
            {post.tags.map((tag) => (
              <View
                key={tag}
                style={{
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: colors.cardBorder,
                  borderWidth: 1,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '600' }}>
                  #{tag}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </View>
    </ScreenWrapper>
  );
}
