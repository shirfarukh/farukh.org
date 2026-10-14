import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { useTheme } from '../../../src/features/theme/ThemeContext';
import { fetchBlogPosts } from '../../../src/features/blog/blogApi';
import { useTranslation } from 'react-i18next';

const CATEGORIES = [
  'All',
  'AI & Tech',
  'Stocks & Crypto',
  'Ecommerce',
  'Languages',
  'Morals',
  'Entrepreneurship',
];

export default function BlogListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const isPersian = i18n.language === 'fa';

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blogPosts', selectedCategory, searchQuery],
    queryFn: () => fetchBlogPosts(selectedCategory, searchQuery),
  });

  const featuredPost = posts.find((p) => p.featured) || posts[0];
  const regularPosts = featuredPost ? posts.filter((p) => p.id !== featuredPost.id) : posts;

  return (
    <ScreenWrapper scrollable={true} edgeTop={false}>
      <View
        className="max-w-4xl w-full self-center px-4 pb-20"
        style={{ paddingTop: Platform.OS === 'web' ? 12 : 8 }}
      >
        {/* Header Hero Section */}
        <View
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: colors.cardBorder,
            borderWidth: 1,
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            backdropFilter: 'blur(10px)',
          } as any}
        >
          <View className="flex-row items-center gap-2 mb-2">
            <Badge label="INSIGHTS & ARTICLES" variant="warning" />
            <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>
              FARUKH.ORG
            </Text>
          </View>

          <Text
            style={{
              color: colors.text,
              fontSize: 24,
              fontWeight: '900',
              marginBottom: 6,
              lineHeight: 30,
            }}
          >
            {isPersian ? 'مرکز دانش و مقالات تخصصی' : 'Knowledge Hub & Insights'}
          </Text>

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13,
              lineHeight: 19,
              marginBottom: 16,
              maxWidth: 620,
            }}
          >
            {isPersian
              ? 'مجموعه‌ای جامع از تحلیل‌های کاربردی، استراتژی‌های تجارت دیجیتال، هوش مصنوعی و اصول کارآفرینی برای دانشجویان پیشرو.'
              : 'Explore deep-dive analyses, financial strategies, AI advancements, and ethical leadership frameworks curated for visionaries.'}
          </Text>

          {/* Search Input */}
          <View
            style={{
              backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
              borderColor: colors.cardBorder,
              borderWidth: 1,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ marginRight: 8, fontSize: 14 }}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={
                isPersian ? 'جستجو در مقالات، کلمات کلیدی یا موضوعات...' : 'Search articles by topic, keyword, or author...'
              }
              placeholderTextColor={colors.textSecondary}
              style={{
                flex: 1,
                color: colors.text,
                fontSize: 13,
                outlineStyle: 'none',
              } as any}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerStyle={{ gap: 8 }}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={{
                  backgroundColor: isSelected
                    ? colors.gold
                    : isDark
                    ? '#1E293B'
                    : '#F1F5F9',
                  borderColor: isSelected ? colors.gold : colors.cardBorder,
                  borderWidth: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                }}
              >
                <Text
                  style={{
                    color: isSelected ? (isDark ? '#0F172A' : '#FFFFFF') : colors.text,
                    fontWeight: isSelected ? '800' : '600',
                    fontSize: 12,
                  }}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Loading */}
        {isLoading && (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 13 }}>
              Loading articles...
            </Text>
          </View>
        )}

        {!isLoading && (
          <>
            {/* Featured Post Card */}
            {featuredPost && selectedCategory === 'All' && !searchQuery ? (
              <TouchableOpacity
                onPress={() => router.push(`/(student)/blog/${featuredPost.id}` as any)}
                activeOpacity={0.88}
                style={{ marginBottom: 16 }}
              >
                <Card
                  style={{
                    borderWidth: 1.5,
                    borderColor: colors.goldBorder,
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.75)' : '#FFFFFF',
                    padding: 20,
                  }}
                >
                  <View className="flex-row justify-between items-center mb-3">
                    <Badge label="FEATURED ARTICLE" variant="warning" />
                    <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                      ⏱️ {featuredPost.readTime}
                    </Text>
                  </View>

                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 20,
                      fontWeight: '800',
                      lineHeight: 26,
                      marginBottom: 8,
                    }}
                  >
                    {featuredPost.title}
                  </Text>

                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 13,
                      lineHeight: 20,
                      marginBottom: 16,
                    }}
                  >
                    {featuredPost.summary}
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTopWidth: 1,
                      borderTopColor: colors.cardBorder,
                      paddingTop: 12,
                    }}
                  >
                    <View>
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
                        {featuredPost.author.name}
                      </Text>
                      <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '600' }}>
                        {featuredPost.author.role}
                      </Text>
                    </View>

                    <View
                      style={{
                        backgroundColor: colors.gold,
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 10,
                      }}
                    >
                      <Text
                        style={{
                          color: isDark ? '#0F172A' : '#FFFFFF',
                          fontWeight: '800',
                          fontSize: 12,
                        }}
                      >
                        {isPersian ? 'مطالعه مقاله ←' : 'Read Article →'}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ) : null}

            {/* Articles Header */}
            <View className="flex-row items-center justify-between mb-3">
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>
                {selectedCategory === 'All'
                  ? isPersian
                    ? 'جدیدترین مقالات'
                    : 'Latest Articles'
                  : `${selectedCategory} (${posts.length})`}
              </Text>
            </View>

            {posts.length === 0 ? (
              <Card style={{ padding: 32, alignItems: 'center' }}>
                <Text style={{ fontSize: 32, marginBottom: 10 }}>📖</Text>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
                  {isPersian ? 'مقاله‌ای یافت نشد' : 'No Articles Found'}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
                  {isPersian
                    ? 'موردی با این مشخصات یافت نشد. فیلترها را تغییر دهید.'
                    : 'No articles matched your criteria. Try another category or search query.'}
                </Text>
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
                      <Card
                        style={{
                          padding: 18,
                          height: '100%',
                          justifyContent: 'space-between',
                          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.65)' : '#FFFFFF',
                        }}
                      >
                        <View>
                          <View className="flex-row justify-between items-center mb-3">
                            <Badge label={post.category} variant="info" />
                            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                              ⏱️ {post.readTime}
                            </Text>
                          </View>
                          <Text
                            style={{
                              color: colors.text,
                              fontSize: 16,
                              fontWeight: '800',
                              lineHeight: 22,
                              marginBottom: 8,
                            }}
                          >
                            {post.title}
                          </Text>
                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontSize: 13,
                              lineHeight: 19,
                              marginBottom: 16,
                            }}
                            numberOfLines={3}
                          >
                            {post.summary}
                          </Text>
                        </View>

                        <View
                          style={{
                            borderTopWidth: 1,
                            borderTopColor: colors.cardBorder,
                            paddingTop: 10,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                            {post.publishedAt}
                          </Text>
                          <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '800' }}>
                            {isPersian ? 'مطالعه ←' : 'Read →'}
                          </Text>
                        </View>
                      </Card>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}
