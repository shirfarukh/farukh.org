import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { Badge } from '../../../src/components/ui/Badge';
import { useTheme } from '../../../src/features/theme/ThemeContext';
import { useAuth } from '../../../src/features/auth/useAuth';
import {
  fetchBlogPosts,
  createOrUpdateBlogPost,
  deleteBlogPost,
} from '../../../src/features/blog/blogApi';
import { BlogCategory, BlogPost } from '../../../src/types/blog';

const BLOG_CATEGORIES: BlogCategory[] = [
  'AI & Tech',
  'Stocks & Crypto',
  'Ecommerce',
  'Languages',
  'Morals',
  'Entrepreneurship',
  'Education',
  'Technology',
  'Leadership',
];

export default function AdminBlogScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const isPersian = i18n.language?.startsWith('fa');

  // Form State
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BlogCategory>('AI & Tech');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [authorName, setAuthorName] = useState(user?.displayName || 'Farukh Shir');
  const [authorRole, setAuthorRole] = useState('Founder & Academy Lead');
  const [tagsInput, setTagsInput] = useState('');
  const [featured, setFeatured] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search filter
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Query blog posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['adminBlogPosts'],
    queryFn: () => fetchBlogPosts(),
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      setFormError('');
      setSuccessMessage('');

      if (!title.trim()) {
        throw new Error(isPersian ? 'لطفاً عنوان مقاله را وارد کنید.' : 'Please enter an article title.');
      }
      if (!summary.trim()) {
        throw new Error(isPersian ? 'لطفاً خلاصه مقاله را وارد کنید.' : 'Please enter an article summary / excerpt.');
      }
      if (!content.trim()) {
        throw new Error(isPersian ? 'لطفاً متن کامل مقاله را وارد کنید.' : 'Please enter the article content.');
      }

      const tags = tagsInput
        .split(/[,،]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const postId = await createOrUpdateBlogPost({
        title: title.trim(),
        category,
        summary: summary.trim(),
        content: content.trim(),
        coverImage: coverImage.trim() || undefined,
        authorName: authorName.trim(),
        authorRole: authorRole.trim(),
        featured,
        tags,
      });

      return postId;
    },
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: ['adminBlogPosts'] });
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
      setSuccessMessage(isPersian ? 'مقاله با موفقیت در وبلاگ منتشر شد!' : 'Article published successfully to the blog page!');
      setTitle('');
      setSummary('');
      setContent('');
      setCoverImage('');
      setTagsInput('');
      setFeatured(false);
      setShowCreate(false);
      Alert.alert(
        'Published Successfully',
        'Your article is now live on the public student blog page.',
        [
          { text: 'OK' },
          {
            text: 'View on Blog',
            onPress: () => router.push(`/(student)/blog/${newId}` as any),
          },
        ]
      );
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to publish article');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteBlogPost(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBlogPosts'] });
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
    },
  });

  // Formatting helper buttons for Markdown content
  const handleInsertMarkdown = (snippet: string) => {
    setContent((prev) => (prev ? `${prev}\n\n${snippet}` : snippet));
  };

  // Filtered posts
  const filteredPosts = posts.filter((post) => {
    if (filterCategory !== 'All' && post.category !== filterCategory) return false;
    if (search.trim().length > 0) {
      const q = search.toLowerCase();
      return (
        post.title.toLowerCase().includes(q) ||
        post.summary.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <ScreenWrapper scrollable={true} edgeTop={false}>
      <View className="max-w-4xl w-full self-center px-4 py-6 pb-20">
        {/* Top Header Card */}
        <View
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#FFFFFF',
            borderColor: colors.cardBorder,
            borderWidth: 1,
            borderRadius: 20,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <View className="flex-row items-center justify-between flex-wrap gap-3">
            <View className="flex-1 min-w-[240px]">
              <View className="flex-row items-center gap-2 mb-1">
                <Text style={{ fontSize: 24 }}>✍️</Text>
                <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>
                  {isPersian ? 'استودیو نگارش وبلاگ' : 'Blog Publishing Studio'}
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
                {isPersian
                  ? 'نگارش و انتشار مقالات آموزشی، تحلیل‌های بازار و راهنماها به صورت مستقیم در صفحه وبلاگ دانشجویان.'
                  : 'Write and publish expert insights, market analyses, and academic guides directly to the public student blog.'}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => router.push('/(student)/blog' as any)}
                style={{
                  backgroundColor: isDark ? '#334155' : '#E2E8F0',
                  borderColor: colors.cardBorder,
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>
                  👀 {isPersian ? 'مشاهده وبلاگ' : 'View Public Blog'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowCreate(!showCreate)}
                style={{
                  backgroundColor: colors.gold,
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    color: isDark ? '#0F172A' : '#FFFFFF',
                    fontWeight: '800',
                    fontSize: 13,
                  }}
                >
                  {showCreate
                    ? isPersian
                      ? 'بستن فرم'
                      : '✕ Close Editor'
                    : isPersian
                    ? '+ نگارش مقاله جدید'
                    : '+ Write New Article'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Success Alert */}
        {successMessage ? (
          <View
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              borderColor: '#10B981',
              borderWidth: 1,
              padding: 14,
              borderRadius: 14,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 13 }}>
              ✓ {successMessage}
            </Text>
          </View>
        ) : null}

        {/* ── EXPANDABLE WRITE / PUBLISH ARTICLE FORM ── */}
        {showCreate && (
          <Card
            style={{
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.75)' : '#FFFFFF',
              borderColor: colors.goldBorder,
              borderWidth: 1.5,
              padding: 22,
              marginBottom: 24,
              borderRadius: 22,
            }}
          >
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-700/40 mb-4">
              <View className="flex-row items-center gap-2">
                <Text style={{ fontSize: 18 }}>📝</Text>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>
                  {isPersian ? 'نگارش مقاله جدید برای وبلاگ' : 'Create & Publish Blog Article'}
                </Text>
              </View>
              <Badge label="PUBLIC VISIBILITY" variant="warning" />
            </View>

            {formError ? (
              <View
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  borderColor: '#EF4444',
                  borderWidth: 1,
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 14,
                }}
              >
                <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>
                  {formError}
                </Text>
              </View>
            ) : null}

            {/* Title */}
            <Input
              label={isPersian ? 'عنوان مقاله *' : 'Article Title *'}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Building Autonomous AI Agents with React Native in 2026"
            />

            {/* Category Selector */}
            <View className="mb-4">
              <Text
                style={{
                  color: colors.textSecondary,
                  fontWeight: '700',
                  fontSize: 12,
                  marginBottom: 8,
                }}
              >
                {isPersian ? 'دسته‌بندی مقاله *' : 'Article Category *'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {BLOG_CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={{
                        backgroundColor: isSelected
                          ? colors.gold
                          : isDark
                          ? '#1E293B'
                          : '#F1F5F9',
                        borderColor: isSelected ? colors.gold : colors.cardBorder,
                        borderWidth: 1,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 14,
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? (isDark ? '#0F172A' : '#FFFFFF') : colors.text,
                          fontWeight: isSelected ? '800' : '500',
                          fontSize: 12,
                        }}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Summary / Excerpt */}
            <Input
              label={isPersian ? 'خلاصه مقاله (توضیح کوتاه در کارت) *' : 'Summary / Short Excerpt *'}
              value={summary}
              onChangeText={setSummary}
              placeholder="A brief 1-2 sentence overview shown in the article card..."
              multiline
              numberOfLines={2}
            />

            {/* Markdown Body Content with Formatting Bar */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12 }}>
                  {isPersian ? 'متن کامل مقاله (پشتیبانی از مارک‌داون) *' : 'Article Body (Markdown Supported) *'}
                </Text>
                <View className="flex-row items-center gap-1.5">
                  <TouchableOpacity
                    onPress={() => handleInsertMarkdown('### Heading Title')}
                    style={{
                      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: colors.gold, fontSize: 10, fontWeight: '800' }}>H3</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleInsertMarkdown('- Key point or takeaway\n- Next point')}
                    style={{
                      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: colors.gold, fontSize: 10, fontWeight: '800' }}>• List</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleInsertMarkdown('> "Important quote or highlight"')}
                    style={{
                      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: colors.gold, fontSize: 10, fontWeight: '800' }}>” Quote</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Input
                value={content}
                onChangeText={setContent}
                placeholder="Write your in-depth guide, insights, steps, and takeaways here..."
                multiline
                numberOfLines={8}
                style={{ minHeight: 160, textAlignVertical: 'top' }}
              />
            </View>

            {/* Author and Cover Image */}
            <View className="flex-row gap-3 flex-wrap mb-2">
              <View style={{ flex: 1, minWidth: 200 }}>
                <Input
                  label={isPersian ? 'نام نویسنده' : 'Author Name'}
                  value={authorName}
                  onChangeText={setAuthorName}
                  placeholder="e.g. Farukh Shir"
                />
              </View>
              <View style={{ flex: 1, minWidth: 200 }}>
                <Input
                  label={isPersian ? 'عنوان نویسنده' : 'Author Role'}
                  value={authorRole}
                  onChangeText={setAuthorRole}
                  placeholder="e.g. Founder & Tech Lead"
                />
              </View>
            </View>

            <Input
              label={isPersian ? 'لینک تصویر جلد (اختیاری)' : 'Cover Image URL (Optional)'}
              value={coverImage}
              onChangeText={setCoverImage}
              placeholder="https://images.unsplash.com/..."
            />

            <Input
              label={isPersian ? 'برچسب‌ها (با کاما جدا کنید)' : 'Tags / Keywords (comma separated)'}
              value={tagsInput}
              onChangeText={setTagsInput}
              placeholder="e.g. AI, Trading, E-commerce, Leadership"
            />

            {/* Featured toggle */}
            <TouchableOpacity
              onPress={() => setFeatured(!featured)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 10,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 1.5,
                  borderColor: featured ? colors.gold : colors.textSecondary,
                  backgroundColor: featured ? colors.gold : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {featured && (
                  <Text
                    style={{
                      color: isDark ? '#0F172A' : '#FFFFFF',
                      fontSize: 12,
                      fontWeight: '900',
                    }}
                  >
                    ✓
                  </Text>
                )}
              </View>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>
                ⭐ {isPersian ? 'تنظیم به عنوان مقاله ویژه در بالای وبلاگ' : 'Feature this article on the blog header banner'}
              </Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <Button
              title={
                createMutation.isPending
                  ? isPersian
                    ? 'در حال انتشار...'
                    : 'Publishing Article...'
                  : isPersian
                  ? '🚀 انتشار مستقیم در صفحه وبلاگ'
                  : '🚀 Publish Article to Blog Page'
              }
              onPress={() => createMutation.mutate()}
              loading={createMutation.isPending}
            />
          </Card>
        )}

        {/* ── ARTICLES CATALOG IN ADMIN ── */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>
              {isPersian ? 'تمام مقالات وبلاگ' : 'Published Articles'} ({posts.length})
            </Text>
          </View>

          {/* Search & Category Filter */}
          <View className="flex-row gap-2 mb-4">
            <View
              style={{
                flex: 1,
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                borderColor: colors.cardBorder,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text style={{ marginRight: 6 }}>🔍</Text>
              <Input
                value={search}
                onChangeText={setSearch}
                placeholder="Search published articles..."
                style={{
                  borderWidth: 0,
                  backgroundColor: 'transparent',
                  paddingVertical: 0,
                  fontSize: 13,
                  flex: 1,
                }}
              />
            </View>
          </View>

          {/* Loading */}
          {isLoading && (
            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.gold} />
            </View>
          )}

          {/* Articles List */}
          {!isLoading && filteredPosts.length === 0 && (
            <Card style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                No articles found. Click "+ Write New Article" above to create one.
              </Text>
            </Card>
          )}

          {!isLoading &&
            filteredPosts.map((post) => (
              <Card
                key={post.id}
                style={{
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF',
                  borderColor: colors.cardBorder,
                  marginBottom: 12,
                  padding: 16,
                }}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-row items-center gap-2 flex-wrap">
                    <Badge label={post.category} variant="warning" />
                    {post.featured && <Badge label="⭐ FEATURED" variant="success" />}
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                      {post.readTime} • {post.publishedAt}
                    </Text>
                  </View>

                  {/* Delete Button */}
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Delete Article',
                        `Are you sure you want to permanently delete "${post.title}"?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => deleteMutation.mutate(post.id),
                          },
                        ]
                      );
                    }}
                    style={{ padding: 4 }}
                  >
                    <Text style={{ color: '#EF4444', fontSize: 13 }}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>

                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: '800',
                    lineHeight: 22,
                    marginBottom: 6,
                  }}
                >
                  {post.title}
                </Text>

                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                    lineHeight: 18,
                    marginBottom: 12,
                  }}
                  numberOfLines={2}
                >
                  {post.summary}
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTopWidth: 1,
                    borderTopColor: colors.cardBorder,
                    paddingTop: 10,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                    By <Text style={{ color: colors.text, fontWeight: '700' }}>{post.author.name}</Text> ({post.author.role})
                  </Text>

                  <TouchableOpacity
                    onPress={() => router.push(`/(student)/blog/${post.id}` as any)}
                    style={{
                      backgroundColor: colors.goldBg,
                      borderColor: colors.goldBorder,
                      borderWidth: 1,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '800' }}>
                      View on Blog ↗
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
        </View>
      </View>
    </ScreenWrapper>
  );
}
