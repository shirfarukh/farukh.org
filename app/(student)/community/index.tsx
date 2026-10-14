import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenWrapper } from '../../../src/components/ui/ScreenWrapper';
import { useTheme } from '../../../src/features/theme/ThemeContext';
import { useAuth } from '../../../src/features/auth/useAuth';
import {
  fetchCommunityPosts,
  createCommunityPost,
  voteCommunityPoll,
  updatePostStatus,
  deleteCommunityPost,
  toggleLikePost,
} from '../../../src/features/community/communityApi';
import { CommunityPost } from '../../../src/types/community';
import { useTranslation } from 'react-i18next';

const CATEGORIES = [
  'All',
  'AI & Tech',
  'Stocks & Crypto',
  'Ecommerce',
  'Languages',
  'Morals',
  'General',
];

export default function CommunityScreen() {
  const { colors, isDark } = useTheme();
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isPersian = i18n.language === 'fa';
  const queryClient = useQueryClient();

  // Active filter state
  const [activeTab, setActiveTab] = useState<'all' | 'polls' | 'discussions' | 'pending'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [postType, setPostType] = useState<'text' | 'poll'>('text');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('General');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [submitting, setSubmitting] = useState(false);

  // Guest Prompt Modal
  const [guestPromptVisible, setGuestPromptVisible] = useState(false);
  const [guestPromptAction, setGuestPromptAction] = useState('participate');

  // Optimistic local votes tracker for instantaneous feedback
  const [localVotes, setLocalVotes] = useState<Record<string, string>>({});

  // Query posts
  const {
    data: posts = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['communityPosts'],
    queryFn: fetchCommunityPosts,
  });

  // Vote Mutation
  const voteMutation = useMutation({
    mutationFn: async ({ postId, optionId }: { postId: string; optionId: string }) => {
      if (!user) throw new Error('Must be logged in to vote');
      return voteCommunityPoll(postId, optionId, user.uid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Could not record vote');
    },
  });

  // Status Mutation (Approve / Reject)
  const statusMutation = useMutation({
    mutationFn: async ({ postId, status }: { postId: string; status: 'approved' | 'rejected' }) => {
      return updatePostStatus(postId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      return deleteCommunityPost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
    },
  });

  // Handle voting with instant UI update
  const handleVote = (post: CommunityPost, optionId: string) => {
    if (!user) {
      setGuestPromptAction('vote in polls');
      setGuestPromptVisible(true);
      return;
    }

    // Set immediate optimistic vote in local state
    setLocalVotes((prev) => ({ ...prev, [post.id]: optionId }));
    voteMutation.mutate({ postId: post.id, optionId });
  };

  // Handle liking
  const handleLike = async (postId: string) => {
    if (!user) {
      setGuestPromptAction('like posts');
      setGuestPromptVisible(true);
      return;
    }
    await toggleLikePost(postId, user.uid);
    queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
  };

  // Open Create Modal (or prompt guest)
  const handleOpenCreateModal = (type: 'text' | 'poll') => {
    if (!user) {
      setGuestPromptAction(type === 'poll' ? 'create polls' : 'create discussion posts');
      setGuestPromptVisible(true);
      return;
    }
    setPostType(type);
    setPostTitle('');
    setPostContent('');
    setPostCategory('General');
    setPollOptions(['', '']);
    setModalVisible(true);
  };

  // Submit new post / poll
  const handleSubmitPost = async () => {
    if (!user) return;
    if (!postTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a title or question for your post.');
      return;
    }

    if (postType === 'poll') {
      const validOptions = pollOptions.filter((o) => o.trim().length > 0);
      if (validOptions.length < 2) {
        Alert.alert('Incomplete Poll', 'Please provide at least 2 distinct options for your poll.');
        return;
      }
    } else {
      if (!postContent.trim()) {
        Alert.alert('Missing Content', 'Please provide some content or details for your post.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await createCommunityPost({
        type: postType,
        title: postTitle,
        content: postContent,
        category: postCategory,
        pollOptions: postType === 'poll' ? pollOptions.map((text) => ({ text })) : undefined,
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Community Member',
        authorRole: isAdmin ? 'admin' : 'student',
        isAdmin,
      });

      setModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });

      if (isAdmin) {
        Alert.alert('Success', 'Your post has been published immediately as Admin.');
      } else {
        Alert.alert(
          'Submitted for Review',
          'Thank you! Your post has been submitted and will appear publicly once approved by an admin.'
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit post');
    } finally {
      setSubmitting(false);
    }
  };

  // Poll options manipulation
  const handleOptionChange = (text: string, index: number) => {
    const updated = [...pollOptions];
    updated[index] = text;
    setPollOptions(updated);
  };

  const handleAddOption = () => {
    if (pollOptions.length >= 6) {
      Alert.alert('Limit reached', 'A poll can have up to 6 options.');
      return;
    }
    setPollOptions([...pollOptions, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (pollOptions.length <= 2) {
      Alert.alert('Minimum options', 'A poll requires at least 2 options.');
      return;
    }
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  // Filter posts based on permissions and selected tabs
  const pendingCount = useMemo(() => {
    return posts.filter((p) => p.status === 'pending').length;
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Status filtering:
      // Public / Guests: only 'approved'
      // Normal logged-in user: 'approved' + their own 'pending' posts
      // Admins: see all or tab-filtered
      const isAuthor = user && post.authorId === user.uid;
      const canView = post.status === 'approved' || isAdmin || isAuthor;
      if (!canView) return false;

      // Pending tab
      if (activeTab === 'pending') {
        if (!isAdmin && !isAuthor) return false;
        if (post.status !== 'pending') return false;
      } else {
        // If not in pending tab, hide rejected posts
        if (post.status === 'rejected') return false;
        // In 'all', 'polls', 'discussions': if student, show approved + author's pending
        // But if admin, in 'all' show approved unless specifically filtered
        if (activeTab === 'polls' && post.type !== 'poll') return false;
        if (activeTab === 'discussions' && post.type !== 'text') return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && post.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = post.title.toLowerCase().includes(query);
        const matchesContent = post.content?.toLowerCase().includes(query);
        const matchesAuthor = post.authorName.toLowerCase().includes(query);
        return matchesTitle || matchesContent || matchesAuthor;
      }

      return true;
    });
  }, [posts, activeTab, selectedCategory, searchQuery, user, isAdmin]);

  return (
    <ScreenWrapper scrollable={true} edgeTop={false}>
      <View
        className="max-w-4xl w-full self-center px-4 pb-20"
        style={{ paddingTop: Platform.OS === 'web' ? 12 : 8 }}
      >
        {/* Header Hero Banner */}
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
          <View className="flex-row items-center justify-between flex-wrap gap-3">
            <View className="flex-1 min-w-[220px]">
              <View className="flex-row items-center gap-2 mb-1">
                <Text style={{ fontSize: 24 }}>💬</Text>
                <Text
                  style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}
                >
                  {isPersian ? 'جامعه و نظرسنجی‌ها' : 'Community & Live Polls'}
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
                {isPersian
                  ? 'فضایی تعاملی برای گفتگو، تبادل نظر، شرکت در نظرسنجی‌های زنده و به اشتراک‌گذاری تجارب آموزشی.'
                  : 'Open space for learners to exchange insights, vote on live polls, and shape academy curriculums.'}
              </Text>
            </View>

            {/* Action Buttons for Posting */}
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => handleOpenCreateModal('poll')}
                style={{
                  backgroundColor: colors.gold,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: isDark ? '#0F172A' : '#FFFFFF',
                    fontWeight: '800',
                    fontSize: 13,
                  }}
                >
                  📊 {isPersian ? 'نظرسنجی جدید' : 'New Poll'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleOpenCreateModal('text')}
                style={{
                  backgroundColor: isDark ? 'rgba(51, 65, 85, 0.8)' : '#E2E8F0',
                  borderColor: colors.cardBorder,
                  borderWidth: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
                  ✍️ {isPersian ? 'ارسال مطلب' : 'New Post'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Guest Info Notice (if not logged in) */}
          {!user && (
            <View
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 12,
                backgroundColor: isDark ? 'rgba(217, 119, 6, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                borderColor: colors.goldBorder,
                borderWidth: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <View className="flex-row items-center gap-2 flex-1 min-w-[200px]">
                <Text style={{ fontSize: 16 }}>👀</Text>
                <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '600' }}>
                  {isPersian
                    ? 'شما به عنوان مهمان در حال مشاهده هستید. برای شرکت در نظرسنجی‌ها و ارسال مطلب وارد شوید.'
                    : 'Browsing as Guest. Anyone can read, but you must sign in to vote and publish posts.'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login' as any)}
                style={{
                  backgroundColor: colors.gold,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: isDark ? '#0F172A' : '#FFFFFF',
                    fontSize: 12,
                    fontWeight: '800',
                  }}
                >
                  {isPersian ? 'ورود / عضویت' : 'Sign In / Register'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Search Bar & Main Tabs */}
        <View className="mb-4 gap-3">
          {/* Main Content Tabs */}
          <View className="flex-row items-center gap-2 flex-wrap">
            <TouchableOpacity
              onPress={() => setActiveTab('all')}
              style={{
                backgroundColor:
                  activeTab === 'all' ? colors.gold : isDark ? '#1E293B' : '#F1F5F9',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  color: activeTab === 'all' ? (isDark ? '#0F172A' : '#FFFFFF') : colors.text,
                  fontWeight: '700',
                  fontSize: 13,
                }}
              >
                🔥 {isPersian ? 'همه مطالب' : 'All'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('polls')}
              style={{
                backgroundColor:
                  activeTab === 'polls' ? colors.gold : isDark ? '#1E293B' : '#F1F5F9',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  color: activeTab === 'polls' ? (isDark ? '#0F172A' : '#FFFFFF') : colors.text,
                  fontWeight: '700',
                  fontSize: 13,
                }}
              >
                📊 {isPersian ? 'نظرسنجی‌ها' : 'Polls'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('discussions')}
              style={{
                backgroundColor:
                  activeTab === 'discussions' ? colors.gold : isDark ? '#1E293B' : '#F1F5F9',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  color:
                    activeTab === 'discussions' ? (isDark ? '#0F172A' : '#FFFFFF') : colors.text,
                  fontWeight: '700',
                  fontSize: 13,
                }}
              >
                💬 {isPersian ? 'گفتگوها' : 'Discussions'}
              </Text>
            </TouchableOpacity>

            {/* Pending Approvals Tab for Admin or Authors with pending items */}
            {(isAdmin || (user && pendingCount > 0)) && (
              <TouchableOpacity
                onPress={() => setActiveTab('pending')}
                style={{
                  backgroundColor:
                    activeTab === 'pending'
                      ? '#E11D48'
                      : isDark
                      ? 'rgba(225, 29, 72, 0.15)'
                      : 'rgba(225, 29, 72, 0.1)',
                  borderColor: '#E11D48',
                  borderWidth: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    color: activeTab === 'pending' ? '#FFFFFF' : '#E11D48',
                    fontWeight: '800',
                    fontSize: 13,
                  }}
                >
                  ⏳ {isAdmin ? (isPersian ? 'نیاز به تایید ادمین' : 'Admin Approvals') : (isPersian ? 'در انتظار تایید من' : 'My Pending')}
                </Text>
                {pendingCount > 0 && (
                  <View
                    style={{
                      backgroundColor: activeTab === 'pending' ? '#FFFFFF' : '#E11D48',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: activeTab === 'pending' ? '#E11D48' : '#FFFFFF',
                        fontSize: 10,
                        fontWeight: '900',
                      }}
                    >
                      {pendingCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Category Horizontal Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
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
                      ? isDark
                        ? '#334155'
                        : '#CBD5E1'
                      : 'transparent',
                    borderColor: colors.cardBorder,
                    borderWidth: 1,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 14,
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? colors.gold : colors.textSecondary,
                      fontSize: 12,
                      fontWeight: isSelected ? '700' : '500',
                    }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

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
                isPersian ? 'جستجو در موضوعات و نظرسنجی‌ها...' : 'Search discussions, polls...'
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

        {/* Loading Indicator */}
        {isLoading && (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 13 }}>
              Loading community content...
            </Text>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && filteredPosts.length === 0 && (
          <View
            style={{
              paddingVertical: 50,
              alignItems: 'center',
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              borderWidth: 1,
              borderRadius: 20,
              padding: 24,
            }}
          >
            <Text style={{ fontSize: 36, marginBottom: 12 }}>💬</Text>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 6 }}>
              {isPersian ? 'مطلبی یافت نشد' : 'No Posts Found'}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 13,
                textAlign: 'center',
                maxWidth: 320,
                marginBottom: 16,
              }}
            >
              {activeTab === 'pending'
                ? isPersian
                  ? 'هیچ پست در انتظار تاییدی وجود ندارد.'
                  : 'There are no posts waiting for approval.'
                : isPersian
                ? 'اولین نفری باشید که در این بخش گفتگو ایجاد کرده یا نظرسنجی می‌سازد!'
                : 'Be the first to share an insight or create a live poll in this category!'}
            </Text>
            <TouchableOpacity
              onPress={() => handleOpenCreateModal('poll')}
              style={{
                backgroundColor: colors.gold,
                paddingHorizontal: 16,
                paddingVertical: 10,
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
                📊 {isPersian ? 'ایجاد اولین نظرسنجی' : 'Create First Poll'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Posts Feed */}
        {!isLoading &&
          filteredPosts.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              user={user}
              isAdmin={isAdmin}
              isDark={isDark}
              colors={colors}
              isPersian={isPersian}
              localVotedOptionId={localVotes[post.id]}
              onVote={(optionId) => handleVote(post, optionId)}
              onLike={() => handleLike(post.id)}
              onApprove={() => statusMutation.mutate({ postId: post.id, status: 'approved' })}
              onReject={() => statusMutation.mutate({ postId: post.id, status: 'rejected' })}
              onDelete={() => {
                Alert.alert(
                  'Delete Post',
                  'Are you sure you want to permanently remove this post?',
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
            />
          ))}
      </View>

      {/* CREATE POST / POLL MODAL */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 16,
            }}
          >
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
              borderWidth: 1,
              borderRadius: 24,
              width: '100%',
              maxWidth: 540,
              maxHeight: '90%',
              padding: 22,
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowRadius: 20,
            }}
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-700/40 mb-4">
              <View className="flex-row items-center gap-2">
                <Text style={{ fontSize: 20 }}>{postType === 'poll' ? '📊' : '✍️'}</Text>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>
                  {postType === 'poll'
                    ? isPersian
                      ? 'ایجاد نظرسنجی زنده'
                      : 'Create Live Poll'
                    : isPersian
                    ? 'ارسال مطلب جدید'
                    : 'Create Discussion Post'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: colors.textSecondary, fontSize: 18, fontWeight: '700' }}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {/* Type Switcher */}
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
                  borderRadius: 14,
                  padding: 4,
                  marginBottom: 16,
                }}
              >
                <TouchableOpacity
                  onPress={() => setPostType('text')}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 10,
                    alignItems: 'center',
                    backgroundColor: postType === 'text' ? colors.gold : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      color:
                        postType === 'text' ? (isDark ? '#0F172A' : '#FFFFFF') : colors.text,
                      fontWeight: '700',
                      fontSize: 13,
                    }}
                  >
                    💬 {isPersian ? 'مطلب متنی' : 'Discussion'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setPostType('poll')}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 10,
                    alignItems: 'center',
                    backgroundColor: postType === 'poll' ? colors.gold : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      color:
                        postType === 'poll' ? (isDark ? '#0F172A' : '#FFFFFF') : colors.text,
                      fontWeight: '700',
                      fontSize: 13,
                    }}
                  >
                    📊 {isPersian ? 'نظرسنجی گزینه‌ای' : 'Live Poll'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Category Picker */}
              <View className="mb-4">
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                    fontWeight: '700',
                    marginBottom: 6,
                  }}
                >
                  {isPersian ? 'دسته‌بندی موضوع' : 'Category'}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6 }}
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((cat) => {
                    const isSelected = postCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setPostCategory(cat)}
                        style={{
                          backgroundColor: isSelected
                            ? colors.gold
                            : isDark
                            ? '#1E293B'
                            : '#F1F5F9',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.gold : colors.cardBorder,
                        }}
                      >
                        <Text
                          style={{
                            color:
                              isSelected ? (isDark ? '#0F172A' : '#FFFFFF') : colors.textSecondary,
                            fontSize: 12,
                            fontWeight: isSelected ? '800' : '500',
                          }}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Title / Question */}
              <View className="mb-4">
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                    fontWeight: '700',
                    marginBottom: 6,
                  }}
                >
                  {postType === 'poll'
                    ? isPersian
                      ? 'پرسش یا عنوان نظرسنجی *'
                      : 'Poll Question / Title *'
                    : isPersian
                    ? 'عنوان مطلب *'
                    : 'Post Title *'}
                </Text>
                <TextInput
                  value={postTitle}
                  onChangeText={setPostTitle}
                  placeholder={
                    postType === 'poll'
                      ? 'e.g., Which skill should we add next?'
                      : 'e.g., 5 Lessons I learned from my first trading month'
                  }
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.cardBorder,
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 12,
                    color: colors.text,
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                />
              </View>

              {/* Description / Content */}
              <View className="mb-4">
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                    fontWeight: '700',
                    marginBottom: 6,
                  }}
                >
                  {postType === 'poll'
                    ? isPersian
                      ? 'توضیحات تکمیلی (اختیاری)'
                      : 'Context or Description (Optional)'
                    : isPersian
                    ? 'متن کامل مطلب *'
                    : 'Discussion Content *'}
                </Text>
                <TextInput
                  value={postContent}
                  onChangeText={setPostContent}
                  placeholder={
                    postType === 'poll'
                      ? 'Explain context or guidelines for this poll...'
                      : 'Write your thoughts, tips, or question for the community...'
                  }
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  style={{
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.cardBorder,
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 12,
                    color: colors.text,
                    fontSize: 13,
                    minHeight: 90,
                    textAlignVertical: 'top',
                  }}
                />
              </View>

              {/* Poll Options (If Poll) */}
              {postType === 'poll' && (
                <View className="mb-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 12,
                        fontWeight: '700',
                      }}
                    >
                      {isPersian ? 'گزینه‌های نظرسنجی (حداقل ۲ گزینه) *' : 'Poll Choices (Min 2) *'}
                    </Text>
                    {pollOptions.length < 6 && (
                      <TouchableOpacity onPress={handleAddOption}>
                        <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '700' }}>
                          + {isPersian ? 'افزودن گزینه' : 'Add Choice'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {pollOptions.map((opt, index) => (
                    <View key={index} className="flex-row items-center gap-2 mb-2">
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: isDark ? '#334155' : '#CBD5E1',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text }}>
                          {index + 1}
                        </Text>
                      </View>
                      <TextInput
                        value={opt}
                        onChangeText={(txt) => handleOptionChange(txt, index)}
                        placeholder={`Option ${index + 1}`}
                        placeholderTextColor={colors.textSecondary}
                        style={{
                          flex: 1,
                          backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                          borderColor: colors.cardBorder,
                          borderWidth: 1,
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          color: colors.text,
                          fontSize: 13,
                        }}
                      />
                      {pollOptions.length > 2 && (
                        <TouchableOpacity
                          onPress={() => handleRemoveOption(index)}
                          style={{ padding: 6 }}
                        >
                          <Text style={{ color: '#EF4444', fontSize: 16 }}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Approval Notice */}
              <View
                style={{
                  backgroundColor: isAdmin
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(245, 158, 11, 0.1)',
                  borderColor: isAdmin ? '#10B981' : colors.goldBorder,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 18,
                }}
              >
                <Text
                  style={{
                    color: isAdmin ? '#10B981' : colors.gold,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {isAdmin
                    ? '👑 Admin Privileges: Your post will be approved and published immediately.'
                    : '🛡️ Moderation Protection: As a community safeguard, posts and polls are verified by an admin before showing in the public feed.'}
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor: isDark ? '#334155' : '#E2E8F0',
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
                    {isPersian ? 'انصراف' : 'Cancel'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmitPost}
                  disabled={submitting}
                  style={{
                    flex: 2,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor: colors.gold,
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? (
                    <ActivityIndicator
                      size="small"
                      color={isDark ? '#0F172A' : '#FFFFFF'}
                    />
                  ) : (
                    <Text
                      style={{
                        color: isDark ? '#0F172A' : '#FFFFFF',
                        fontWeight: '800',
                        fontSize: 14,
                      }}
                    >
                      {isAdmin
                        ? isPersian
                          ? 'انتشار مستقیم ادمین'
                          : 'Publish Immediately'
                        : isPersian
                        ? 'ارسال جهت تایید ادمین'
                        : 'Submit for Admin Review'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>

      {/* GUEST AUTHENTICATION CALLOUT MODAL */}
      <Modal
        visible={guestPromptVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setGuestPromptVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.goldBorder,
              borderWidth: 1.5,
              borderRadius: 24,
              width: '100%',
              maxWidth: 440,
              padding: 24,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 42, marginBottom: 12 }}>🔒</Text>
            <Text
              style={{
                color: colors.text,
                fontSize: 20,
                fontWeight: '800',
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              {isPersian ? 'ورود به حساب لازم است' : 'Account Required'}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 13,
                lineHeight: 19,
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              {isPersian
                ? `مشاهده مطالب برای همه آزاد است، اما برای ${guestPromptAction} باید وارد حساب کاربری خود شوید.`
                : `Everyone can read discussions and poll results, but you must be signed in to ${guestPromptAction}. Join our verified community!`}
            </Text>

            <View className="w-full gap-2">
              <TouchableOpacity
                onPress={() => {
                  setGuestPromptVisible(false);
                  router.push('/(auth)/login' as any);
                }}
                style={{
                  backgroundColor: colors.gold,
                  paddingVertical: 13,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: isDark ? '#0F172A' : '#FFFFFF',
                    fontWeight: '800',
                    fontSize: 14,
                  }}
                >
                  🚀 {isPersian ? 'ورود به حساب کاربری' : 'Sign In to Account'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setGuestPromptVisible(false);
                  router.push('/(auth)/register' as any);
                }}
                style={{
                  backgroundColor: 'transparent',
                  borderColor: colors.cardBorder,
                  borderWidth: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
                  ✨ {isPersian ? 'ایجاد حساب کاربری رایگان' : 'Create Free Account'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setGuestPromptVisible(false)}
                style={{ paddingVertical: 10, alignItems: 'center' }}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  {isPersian ? 'ادامه مشاهده به عنوان مهمان' : 'Continue Browsing as Guest'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: Post & Poll Card
// ─────────────────────────────────────────────────────────────────────────────
function CommunityPostCard({
  post,
  user,
  isAdmin,
  isDark,
  colors,
  isPersian,
  localVotedOptionId,
  onVote,
  onLike,
  onApprove,
  onReject,
  onDelete,
}: {
  post: CommunityPost;
  user: any;
  isAdmin: boolean;
  isDark: boolean;
  colors: any;
  isPersian: boolean;
  localVotedOptionId?: string;
  onVote: (optionId: string) => void;
  onLike: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const isAuthor = user && post.authorId === user.uid;
  const isPending = post.status === 'pending';

  // Determine current user's voted option
  const userVotedOptionId =
    localVotedOptionId || (user ? post.voters?.[user.uid] : undefined);
  const hasUserVoted = !!userVotedOptionId;

  // Total poll votes
  const totalVotes = post.pollOptions?.reduce((acc, opt) => acc + opt.votes, 0) || post.totalVotes || 0;

  // Likes
  const isLiked = user && post.likedBy?.includes(user.uid);

  return (
    <View
      style={{
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.65)' : '#FFFFFF',
        borderColor: isPending ? '#F59E0B' : colors.cardBorder,
        borderWidth: isPending ? 1.5 : 1,
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: isDark ? 0.2 : 0.04,
        shadowRadius: 8,
      }}
    >
      {/* Pending Banner if applicable */}
      {isPending && (
        <View
          style={{
            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
            borderColor: '#F59E0B',
            borderWidth: 1,
            borderRadius: 10,
            padding: 8,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          <View className="flex-row items-center gap-2">
            <Text style={{ fontSize: 14 }}>⏳</Text>
            <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '700' }}>
              {isPersian
                ? 'در انتظار تایید ادمین (هنوز در لیست عمومی منتشر نشده است)'
                : 'Pending Admin Approval (Not visible to other students yet)'}
            </Text>
          </View>

          {/* Admin Moderation Actions */}
          {isAdmin && (
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={onApprove}
                style={{
                  backgroundColor: '#10B981',
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>
                  ✅ {isPersian ? 'تایید و انتشار' : 'Approve'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onReject}
                style={{
                  backgroundColor: '#EF4444',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>
                  ❌ {isPersian ? 'رد کردن' : 'Reject'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Card Top: Author & Tag */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2.5">
          {/* Avatar Icon */}
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor:
                post.authorRole === 'admin'
                  ? colors.gold
                  : isDark
                  ? '#334155'
                  : '#E2E8F0',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color:
                  post.authorRole === 'admin'
                    ? isDark
                      ? '#0F172A'
                      : '#FFFFFF'
                    : colors.text,
                fontWeight: '800',
              }}
            >
              {post.authorRole === 'admin' ? '👑' : post.authorName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View>
            <View className="flex-row items-center gap-1.5">
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>
                {post.authorName}
              </Text>
              {post.authorRole === 'admin' && (
                <View
                  style={{
                    backgroundColor: 'rgba(217, 119, 6, 0.2)',
                    borderColor: colors.gold,
                    borderWidth: 1,
                    paddingHorizontal: 5,
                    paddingVertical: 1,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: colors.gold, fontSize: 9, fontWeight: '800' }}>
                    ADMIN
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
              {post.category || 'General'} • {post.type === 'poll' ? '📊 Live Poll' : '💬 Discussion'}
            </Text>
          </View>
        </View>

        {/* Delete button for Admin or Owner */}
        {(isAdmin || isAuthor) && (
          <TouchableOpacity onPress={onDelete} style={{ padding: 4 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
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

      {/* Content Text (if present) */}
      {post.content ? (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 13,
            lineHeight: 20,
            marginBottom: post.type === 'poll' ? 14 : 10,
          }}
        >
          {post.content}
        </Text>
      ) : null}

      {/* POLL OPTIONS & INTERACTIVE VOTING */}
      {post.type === 'poll' && post.pollOptions && (
        <View className="mb-3 gap-2.5">
          {post.pollOptions.map((option) => {
            const isSelected = userVotedOptionId === option.id;
            const percentage =
              totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => onVote(option.id)}
                activeOpacity={0.8}
                style={{
                  position: 'relative',
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: isSelected ? colors.gold : colors.cardBorder,
                  borderWidth: isSelected ? 1.5 : 1,
                  borderRadius: 12,
                  overflow: 'hidden',
                  paddingVertical: 11,
                  paddingHorizontal: 14,
                }}
              >
                {/* Instant Animated Progress Fill Bar */}
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: `${percentage}%`,
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(217, 119, 6, 0.35)'
                        : 'rgba(245, 158, 11, 0.25)'
                      : isDark
                      ? 'rgba(51, 65, 85, 0.4)'
                      : 'rgba(203, 213, 225, 0.5)',
                  }}
                />

                {/* Option Content Overlay */}
                <View className="flex-row items-center justify-between z-10">
                  <View className="flex-row items-center gap-2 flex-1 mr-2">
                    {/* Radio / Selection Circle */}
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        borderWidth: 1.5,
                        borderColor: isSelected ? colors.gold : colors.textSecondary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? colors.gold : 'transparent',
                      }}
                    >
                      {isSelected && (
                        <Text
                          style={{
                            fontSize: 10,
                            color: isDark ? '#0F172A' : '#FFFFFF',
                            fontWeight: '900',
                          }}
                        >
                          ✓
                        </Text>
                      )}
                    </View>

                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 13,
                        fontWeight: isSelected ? '700' : '500',
                        flex: 1,
                      }}
                    >
                      {option.text}
                    </Text>
                  </View>

                  {/* Percentage & Vote Count (Live!) */}
                  <View className="flex-row items-center gap-1.5">
                    <Text
                      style={{
                        color: isSelected ? colors.gold : colors.text,
                        fontSize: 13,
                        fontWeight: '800',
                      }}
                    >
                      {percentage}%
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                      ({option.votes})
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Poll Summary Footer */}
          <View className="flex-row items-center justify-between pt-1">
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              📊 {totalVotes} {isPersian ? 'رأی ثبت شده' : 'total votes'}
              {hasUserVoted && (
                <Text style={{ color: colors.gold, fontWeight: '700' }}>
                  {' '}
                  • {isPersian ? 'رأی شما ثبت شد' : 'Your vote is counted'}
                </Text>
              )}
            </Text>

            {!user && (
              <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '600' }}>
                {isPersian ? 'برای رأی دادن وارد شوید' : 'Sign in to vote'}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Card Footer: Likes & Engagement */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(51, 65, 85, 0.4)' : '#F1F5F9',
          paddingTop: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity
          onPress={onLike}
          className="flex-row items-center gap-1.5"
          style={{ paddingVertical: 4 }}
        >
          <Text style={{ fontSize: 15 }}>{isLiked ? '❤️' : '🤍'}</Text>
          <Text
            style={{
              color: isLiked ? '#EF4444' : colors.textSecondary,
              fontSize: 12,
              fontWeight: '700',
            }}
          >
            {post.likes || 0} {isPersian ? 'پسند' : 'Likes'}
          </Text>
        </TouchableOpacity>

        <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
          {new Date(post.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </View>
    </View>
  );
}
