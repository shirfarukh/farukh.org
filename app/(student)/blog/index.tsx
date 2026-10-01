import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { fetchBlogPosts } from '../../../src/features/blog/blogApi';

const CATEGORIES = ['All', 'Entrepreneurship', 'Education', 'Leadership', 'Technology'];

export default function BlogListScreen() {
  const router = useRouter();
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
        <View className="mb-8 bg-gradient-to-r from-brand-900 via-surface-card to-brand-800 p-6 md:p-8 rounded-3xl border border-brand-700/50 shadow-xl">
          <View className="flex-row items-center gap-2 mb-2">
            <Badge label="INSIGHTS & ARTICLES" variant="warning" />
            <Text className="text-xs font-bold text-gold-400 uppercase tracking-widest">FARUKH.ORG</Text>
          </View>
          <Text className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            Knowledge Hub for <Text className="text-gold-400">Entrepreneurs</Text> & Learners
          </Text>
          <Text className="text-slate-300 text-base md:text-lg max-w-2xl leading-relaxed mb-6">
            Explore expert articles, leadership principles, business strategies, and educational advancements.
          </Text>

          {/* Search Input */}
          <View className="bg-surface-dark/80 border border-surface-border rounded-2xl px-4 py-3 flex-row items-center">
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search articles by topic, keyword or tag..."
              placeholderTextColor="#94A3B8"
              className="flex-1 text-white text-base font-medium"
            />
          </View>
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
          <View className="flex-row gap-2.5 px-1">
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl border ${
                  selectedCategory === cat
                    ? 'bg-brand-600 border-gold-400/80 shadow-md'
                    : 'bg-surface-card border-surface-border'
                }`}
              >
                <Text
                  className={`font-semibold text-sm ${
                    selectedCategory === cat ? 'text-white font-bold' : 'text-slate-300'
                  }`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#FACC15" />
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
                <Card className="p-6 md:p-8 border-gold-500/40 bg-surface-card hover:bg-surface-hover">
                  <View className="flex-row justify-between items-center mb-4">
                    <Badge label="FEATURED ARTICLE" variant="warning" />
                    <Text className="text-slate-400 text-xs font-semibold">{featuredPost.readTime}</Text>
                  </View>
                  <Text className="text-2xl md:text-3xl font-extrabold text-white mb-3">
                    {featuredPost.title}
                  </Text>
                  <Text className="text-slate-300 text-base leading-relaxed mb-6">
                    {featuredPost.summary}
                  </Text>

                  <View className="flex-row justify-between items-center border-t border-surface-border/60 pt-4">
                    <View>
                      <Text className="text-white font-bold text-sm">{featuredPost.author.name}</Text>
                      <Text className="text-gold-400 text-xs font-medium">{featuredPost.author.role}</Text>
                    </View>
                    <View className="bg-brand-600/80 px-4 py-2 rounded-xl border border-gold-400/30">
                      <Text className="text-white font-bold text-xs">Read Article →</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ) : null}

            {/* Grid of Articles */}
            <Text className="text-xl font-bold text-white mb-4">
              {selectedCategory === 'All' ? 'Latest Articles' : `${selectedCategory} Articles`}
            </Text>

            {posts.length === 0 ? (
              <Card className="p-8 items-center">
                <Text className="text-slate-400 text-base">No articles found matching your criteria.</Text>
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
                      <Card className="p-6 h-full justify-between border-surface-border bg-surface-card hover:bg-surface-hover">
                        <View>
                          <View className="flex-row justify-between items-center mb-3">
                            <Badge label={post.category} variant="info" />
                            <Text className="text-slate-400 text-xs">{post.readTime}</Text>
                          </View>
                          <Text className="text-lg font-bold text-white mb-2 leading-snug">
                            {post.title}
                          </Text>
                          <Text className="text-slate-400 text-sm mb-4" numberOfLines={3}>
                            {post.summary}
                          </Text>
                        </View>

                        <View className="border-t border-surface-border/50 pt-3 flex-row justify-between items-center">
                          <Text className="text-slate-400 text-xs">{post.publishedAt}</Text>
                          <Text className="text-gold-400 text-xs font-bold">Read →</Text>
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
