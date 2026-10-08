import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { useTheme } from '../../../src/features/theme/ThemeContext';
import { fetchBlogPosts } from '../../../src/features/blog/blogApi';

const CATEGORIES = ['All', 'Entrepreneurship', 'Education', 'Leadership', 'Technology'];

export default function BlogListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blogPosts', selectedCategory, searchQuery],
    queryFn: () => fetchBlogPosts(selectedCategory, searchQuery),
  });

  const featuredPost = posts.find((p) => p.featured) || posts[0];
  const regularPosts = featuredPost ? posts.filter((p) => p.id !== featuredPost.id) : posts;

  return (
    <ScreenWrapper>
      <ScrollView className="flex-1 py-6">
        {/* Header Hero Section */}
        <View
          style={{
            backgroundColor: isDark ? '#091430' : '#FFFFFF',
            borderColor: isDark ? 'rgba(59,130,246,0.35)' : colors.cardBorder,
            borderWidth: 1,
            borderRadius: 24,
            padding: 24,
            marginBottom: 24,
          }}
          className="shadow-xl"
        >
          <View className="flex-row items-center gap-2 mb-2">
            <Badge label="INSIGHTS & ARTICLES" variant="warning" />
            <Text style={{ color: colors.gold }} className="text-xs font-bold uppercase tracking-widest">FARUKH.ORG</Text>
          </View>
          <Text style={{ color: colors.text }} className="text-3xl md:text-4xl font-extrabold mb-3">
            Knowledge Hub for <Text style={{ color: colors.gold }}>Entrepreneurs</Text> & Learners
          </Text>
          <Text style={{ color: colors.textSecondary }} className="text-base md:text-lg max-w-2xl leading-relaxed mb-6">
            Explore expert articles, leadership principles, business strategies, and educational advancements.
          </Text>

          {/* Search Input */}
          <View
            style={{
              backgroundColor: colors.cardHover,
              borderColor: colors.cardBorder,
              borderWidth: 1,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search articles by topic, keyword or tag..."
              placeholderTextColor={colors.textMuted}
              style={{ color: colors.text }}
              className="flex-1 text-base font-medium"
            />
          </View>
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
          <View className="flex-row gap-2.5 px-1">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={{
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.gold : colors.cardBorder,
                    borderWidth: 1,
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    borderRadius: 14,
                  }}
                >
                  <Text
                    style={{
                      color: active ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: active ? '700' : '600',
                      fontSize: 13,
                    }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : (
          <>
            {/* Featured Post Card */}
            {featuredPost && selectedCategory === 'All' && !searchQuery ? (
              <TouchableOpacity
                onPress={() => router.push(`/(student)/blog/${featuredPost.id}` as any)}
                activeOpacity={0.88}
                className="mb-8"
              >
                <Card>
                  <View className="flex-row justify-between items-center mb-4">
                    <Badge label="FEATURED ARTICLE" variant="warning" />
                    <Text style={{ color: colors.textMuted }} className="text-xs font-semibold">{featuredPost.readTime}</Text>
                  </View>
                  <Text style={{ color: colors.text }} className="text-2xl md:text-3xl font-extrabold mb-3">
                    {featuredPost.title}
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-base leading-relaxed mb-6">
                    {featuredPost.summary}
                  </Text>

                  <View style={{ borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ color: colors.text }} className="font-bold text-sm">{featuredPost.author.name}</Text>
                      <Text style={{ color: colors.gold }} className="text-xs font-medium">{featuredPost.author.role}</Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 12,
                      }}
                    >
                      <Text className="text-white font-bold text-xs">Read Article →</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ) : null}

            {/* Grid of Articles */}
            <Text style={{ color: colors.text }} className="text-xl font-bold mb-4">
              {selectedCategory === 'All' ? 'Latest Articles' : `${selectedCategory} Articles`}
            </Text>

            {posts.length === 0 ? (
              <Card>
                <Text style={{ color: colors.textSecondary }} className="text-base text-center py-4">No articles found matching your criteria.</Text>
              </Card>
            ) : (
              <View className="flex-row flex-wrap -mx-2">
                {regularPosts.map((post) => (
                  <View key={post.id} className="w-full md:w-1/2 px-2 mb-4">
                    <TouchableOpacity
                      onPress={() => router.push(`/(student)/blog/${post.id}` as any)}
                      activeOpacity={0.88}
                      className="h-full"
                    >
                      <Card style={{ height: '100%', justifyContent: 'space-between' }}>
                        <View>
                          <View className="flex-row justify-between items-center mb-3">
                            <Badge label={post.category} variant="info" />
                            <Text style={{ color: colors.textMuted }} className="text-xs">{post.readTime}</Text>
                          </View>
                          <Text style={{ color: colors.text }} className="text-lg font-bold mb-2 leading-snug">
                            {post.title}
                          </Text>
                          <Text style={{ color: colors.textSecondary }} className="text-sm mb-4" numberOfLines={3}>
                            {post.summary}
                          </Text>
                        </View>

                        <View style={{ borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ color: colors.textMuted }} className="text-xs">{post.publishedAt}</Text>
                          <Text style={{ color: colors.gold }} className="text-xs font-bold">Read →</Text>
                        </View>
                      </Card>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
