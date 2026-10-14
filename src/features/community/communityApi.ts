import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from '@firebase/firestore';
import { db } from '../../lib/firebase';
import { CommunityPost, PollOption } from '../../types/community';
import { cleanFirestoreData } from '../../lib/utils';

const SEED_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'seed-poll-1',
    type: 'poll',
    title: '📊 Which programming or AI topic would you like us to cover next?',
    content: 'We are expanding our course library! Cast your vote below to help us prioritize our upcoming curriculum.',
    category: 'AI & Tech',
    pollOptions: [
      { id: 'opt-1', text: 'Building Autonomous AI Agents & LangChain', votes: 42 },
      { id: 'opt-2', text: 'Full-Stack Next.js 15 & React Native Masterclass', votes: 29 },
      { id: 'opt-3', text: 'Machine Learning & Python for Finance', votes: 18 },
      { id: 'opt-4', text: 'Cybersecurity & Cloud Penetration Testing', votes: 12 },
    ],
    voters: {},
    totalVotes: 101,
    authorId: 'admin-seed',
    authorName: 'Farukh Admin',
    authorRole: 'admin',
    status: 'approved',
    likes: 24,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'seed-post-1',
    type: 'text',
    title: '🚀 5 Key Principles for Risk Management in Crypto & Stock Trading',
    content: `When navigating volatile markets, discipline beats emotion every single time:
1. Never risk more than 1-2% of your capital on a single trade.
2. Always define your Stop-Loss BEFORE entering a position.
3. Take partial profits at defined resistance levels.
4. Keep a trading journal to analyze mistakes and wins.
5. Protect your psychology—take breaks during high market volatility.

What is your golden rule when trading? Drop your thoughts below!`,
    category: 'Stocks & Crypto',
    authorId: 'admin-seed',
    authorName: 'Farukh Academy',
    authorRole: 'admin',
    status: 'approved',
    likes: 38,
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    id: 'seed-poll-2',
    type: 'poll',
    title: '🛒 Best E-commerce business model for beginners in 2026?',
    content: 'Starting an online store this year? Vote for the model that offers the best balance of low risk and scalable margin.',
    category: 'Ecommerce',
    pollOptions: [
      { id: 'e-1', text: 'Direct-to-Consumer (D2C) Private Label', votes: 35 },
      { id: 'e-2', text: 'Print-on-Demand (POD)', votes: 14 },
      { id: 'e-3', text: 'Digital Products & SaaS Templates', votes: 48 },
      { id: 'e-4', text: 'B2B Wholesale / Marketplace', votes: 8 },
    ],
    voters: {},
    totalVotes: 105,
    authorId: 'seed-user-1',
    authorName: 'Ahmad Karimi',
    authorRole: 'student',
    status: 'approved',
    likes: 19,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'seed-post-2',
    type: 'text',
    title: '💡 The Value of Consistency: 30 Minutes of Daily Learning',
    content: 'Studying just 30 minutes every single day outperforms cramming 5 hours once a week. Compound knowledge is as powerful as compound interest. Stay dedicated!',
    category: 'Morals',
    authorId: 'seed-user-2',
    authorName: 'Zahra Mohammadi',
    authorRole: 'student',
    status: 'approved',
    likes: 15,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

// In-memory cache for smooth optimistic interaction and fallback
let localPostsCache: CommunityPost[] = [...SEED_COMMUNITY_POSTS];

export async function fetchCommunityPosts(): Promise<CommunityPost[]> {
  try {
    const q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const posts: CommunityPost[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          type: data.type || 'text',
          title: data.title || '',
          content: data.content || '',
          category: data.category || 'General',
          pollOptions: data.pollOptions || [],
          voters: data.voters || {},
          totalVotes: data.totalVotes || 0,
          authorId: data.authorId || '',
          authorName: data.authorName || 'Anonymous',
          authorRole: data.authorRole || 'student',
          authorAvatar: data.authorAvatar,
          status: data.status || 'pending',
          likes: data.likes || 0,
          likedBy: data.likedBy || [],
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
      });

      // Merge with seed posts if remote posts are fewer than 2
      if (posts.length > 0) {
        localPostsCache = posts;
        return posts;
      }
    }
  } catch (err) {
    console.warn('Could not read communityPosts from Firestore, using cached/seed data:', err);
  }

  return localPostsCache;
}

export async function createCommunityPost(data: {
  type: 'text' | 'poll';
  title: string;
  content?: string;
  category?: string;
  pollOptions?: { text: string }[];
  authorId: string;
  authorName: string;
  authorRole?: 'admin' | 'student';
  isAdmin?: boolean;
}): Promise<CommunityPost> {
  const newId = `post_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const status = data.isAdmin ? 'approved' : 'pending';

  let formattedOptions: PollOption[] | undefined;
  let totalVotes = 0;

  if (data.type === 'poll' && data.pollOptions) {
    formattedOptions = data.pollOptions
      .filter((opt) => opt.text.trim().length > 0)
      .map((opt, index) => ({
        id: `opt-${index + 1}-${Date.now()}`,
        text: opt.text.trim(),
        votes: 0,
      }));
  }

  const newPost: CommunityPost = {
    id: newId,
    type: data.type,
    title: data.title.trim(),
    content: data.content?.trim(),
    category: data.category || 'General',
    pollOptions: formattedOptions,
    voters: {},
    totalVotes,
    authorId: data.authorId,
    authorName: data.authorName,
    authorRole: data.isAdmin ? 'admin' : (data.authorRole || 'student'),
    status,
    likes: 0,
    likedBy: [],
    createdAt: new Date().toISOString(),
  };

  // Add to local cache first (instant response)
  localPostsCache = [newPost, ...localPostsCache];

  // Persist to Firestore with undefined values stripped
  try {
    const docRef = doc(db, 'communityPosts', newId);
    const firestorePayload = cleanFirestoreData({
      ...newPost,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, firestorePayload);
  } catch (err) {
    console.warn('Error saving community post to Firestore, saved in memory:', err);
  }

  return newPost;
}

export async function voteCommunityPoll(
  postId: string,
  optionId: string,
  userId: string
): Promise<{ success: boolean; updatedPost?: CommunityPost; error?: string }> {
  // Update local cache
  const postIndex = localPostsCache.findIndex((p) => p.id === postId);
  if (postIndex === -1) {
    return { success: false, error: 'Post not found' };
  }

  const post = localPostsCache[postIndex];
  if (post.type !== 'poll' || !post.pollOptions) {
    return { success: false, error: 'This post is not a poll' };
  }

  const voters = { ...(post.voters || {}) };
  const prevOptionId = voters[userId];

  // If already voted for the same option, return
  if (prevOptionId === optionId) {
    return { success: true, updatedPost: post };
  }

  // Adjust votes
  const updatedOptions = post.pollOptions.map((opt) => {
    let votes = opt.votes;
    if (prevOptionId && opt.id === prevOptionId) {
      votes = Math.max(0, votes - 1);
    }
    if (opt.id === optionId) {
      votes = votes + 1;
    }
    return { ...opt, votes };
  });

  voters[userId] = optionId;
  const totalVotes = updatedOptions.reduce((acc, opt) => acc + opt.votes, 0);

  const updatedPost: CommunityPost = {
    ...post,
    pollOptions: updatedOptions,
    voters,
    totalVotes,
  };

  localPostsCache[postIndex] = updatedPost;

  // Persist to Firestore
  try {
    const docRef = doc(db, 'communityPosts', postId);
    await updateDoc(docRef, {
      pollOptions: updatedOptions,
      [`voters.${userId}`]: optionId,
      totalVotes,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Failed to update poll vote in Firestore:', err);
  }

  return { success: true, updatedPost };
}

export async function updatePostStatus(
  postId: string,
  status: 'approved' | 'rejected'
): Promise<boolean> {
  const postIndex = localPostsCache.findIndex((p) => p.id === postId);
  if (postIndex !== -1) {
    localPostsCache[postIndex] = {
      ...localPostsCache[postIndex],
      status,
    };
  }

  try {
    const docRef = doc(db, 'communityPosts', postId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.warn('Failed to update post status in Firestore:', err);
    return true; // Still true locally
  }
}

export async function deleteCommunityPost(postId: string): Promise<boolean> {
  localPostsCache = localPostsCache.filter((p) => p.id !== postId);

  try {
    const docRef = doc(db, 'communityPosts', postId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn('Failed to delete community post from Firestore:', err);
    return true;
  }
}

export async function toggleLikePost(
  postId: string,
  userId: string
): Promise<CommunityPost | null> {
  const postIndex = localPostsCache.findIndex((p) => p.id === postId);
  if (postIndex === -1) return null;

  const post = localPostsCache[postIndex];
  const likedBy = post.likedBy || [];
  const isLiked = likedBy.includes(userId);

  const updatedLikedBy = isLiked
    ? likedBy.filter((id) => id !== userId)
    : [...likedBy, userId];

  const updatedPost: CommunityPost = {
    ...post,
    likedBy: updatedLikedBy,
    likes: updatedLikedBy.length,
  };

  localPostsCache[postIndex] = updatedPost;

  try {
    const docRef = doc(db, 'communityPosts', postId);
    await updateDoc(docRef, {
      likedBy: updatedLikedBy,
      likes: updatedLikedBy.length,
    });
  } catch (err) {
    console.warn('Failed to toggle like in Firestore:', err);
  }

  return updatedPost;
}
