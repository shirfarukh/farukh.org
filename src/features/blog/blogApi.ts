import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from '@firebase/firestore';
import { db } from '../../lib/firebase';
import { BlogPost, BlogCategory } from '../../types/blog';
import { cleanFirestoreData } from '../../lib/utils';

const SEED_BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-ai-1',
    title: 'The AI Revolution in 2026: Building Autonomous Agents & LLM Workflows',
    slug: 'ai-revolution-autonomous-agents',
    summary: 'How artificial intelligence and autonomous agent architectures are transforming business automation, software engineering, and digital workflows.',
    content: `Artificial intelligence has shifted from exploratory generative text to autonomous reasoning and action orchestration. Modern systems can plan, execute, and evaluate complex multi-step workflows.

### 1. Shift from Chatbots to Autonomous Agents
Instead of static prompts, modern agents interact with APIs, databases, and filesystem tools dynamically.

### 2. Practical Industry Applications
- Real-time market analytics and algorithmic decision models.
- Automated customer support and CRM routing.
- High-efficiency software development paired with agentic pairs.

### 3. Upskilling for the AI Era
At FARUKH.ORG, our AI & Tech curriculum prepares learners to harness state-of-the-art tools, build AI-powered applications, and maintain a decisive competitive edge.`,
    category: 'AI & Tech',
    author: {
      name: 'Farukh Shir',
      role: 'Founder & EdTech Lead',
    },
    readTime: '6 min read',
    publishedAt: '2026-10-02',
    featured: true,
    tags: ['AI & Tech', 'Machine Learning', 'Agents', 'Innovation'],
  },
  {
    id: 'post-crypto-1',
    title: 'Navigating Crypto & Stock Volatility: Capital Preservation & Strategy',
    slug: 'navigating-crypto-stock-volatility',
    summary: 'A disciplined blueprint for risk management, technical analysis, and long-term asset accumulation in digital asset markets.',
    content: `Market volatility is both an opportunity and a risk. The difference between successful traders and speculators lies in discipline and systematic execution.

### Golden Rules of Trading
1. **Capital Preservation First**: Never commit capital without defining your maximum acceptable downside.
2. **Technical & Fundamental Confluence**: Rely on verifiable volume patterns, moving average alignments, and macro indicators.
3. **Emotional Neutrality**: Maintain a trade journal to systematically analyze win/loss ratios.`,
    category: 'Stocks & Crypto',
    author: {
      name: 'Farukh Trading Research',
      role: 'Market Analysis Lead',
    },
    readTime: '5 min read',
    publishedAt: '2026-09-29',
    featured: false,
    tags: ['Stocks & Crypto', 'Trading', 'Investing', 'Finance'],
  },
  {
    id: 'post-ecom-1',
    title: 'E-commerce in 2026: Direct-to-Consumer Brands & Global Logistics',
    slug: 'ecommerce-d2c-brands-logistics',
    summary: 'Essential strategies for launching and scaling high-margin online retail stores with automated fulfillment and optimized conversion funnels.',
    content: `E-commerce continues to expand exponentially. The most profitable entrepreneurs focus on high-perceived-value product niches, proprietary branding, and exceptional customer retention.

- Optimize your checkout funnel for instant mobile conversion.
- Build repeat buyer loops with personalized retention campaigns.
- Leverage data-driven supply chain tracking to reduce shipping overhead.`,
    category: 'Ecommerce',
    author: {
      name: 'Digital Commerce Guild',
      role: 'E-commerce Specialist',
    },
    readTime: '4 min read',
    publishedAt: '2026-09-24',
    featured: false,
    tags: ['Ecommerce', 'D2C', 'Online Business', 'Sales'],
  },
  {
    id: 'post-lang-1',
    title: 'Accelerated Language Learning: Cognitive Frameworks for Fluency',
    slug: 'accelerated-language-learning-frameworks',
    summary: 'Unlock rapid conversational fluency through immersion techniques, spaced repetition algorithms, and contextual conversation.',
    content: `Mastering a second or third language dramatically widens global business opportunities and cognitive flexibility.

### The 3 Core Pillars of Language Mastery:
- **Active Recall**: Speak aloud from day one instead of relying solely on passive listening.
- **Spaced Repetition**: Reinforce high-frequency vocabulary at scientifically optimized intervals.
- **Cultural Context**: Grasp idiomatic phrasing and cultural etiquette for authentic communication.`,
    category: 'Languages',
    author: {
      name: 'Linguistics Academy',
      role: 'Language Acquisition Director',
    },
    readTime: '5 min read',
    publishedAt: '2026-09-18',
    featured: false,
    tags: ['Languages', 'Fluency', 'Communication', 'Education'],
  },
  {
    id: 'post-moral-1',
    title: 'Character & Ethical Leadership: The True Bedrock of Long-Term Wealth',
    slug: 'character-ethical-leadership-wealth',
    summary: 'Why integrity, discipline, and moral conviction are the greatest multipliers of sustainable achievement and enduring influence.',
    content: `Skills and strategies without ethics result in fragile outcomes. True leadership is demonstrated through transparent promises, accountability to stakeholders, and humility in success.

- Treat your word as an unbreakable contract.
- Build trust through consistency across small and large challenges alike.
- Measure success by the value created for the community, not merely by personal metrics.`,
    category: 'Morals',
    author: {
      name: 'Farukh Shir',
      role: 'Ethics & Leadership Advisor',
    },
    readTime: '4 min read',
    publishedAt: '2026-09-12',
    featured: false,
    tags: ['Morals', 'Ethics', 'Leadership', 'Character'],
  },
  {
    id: 'post-1',
    title: 'Building a High-Impact Startup: Lessons in Entrepreneurship',
    slug: 'building-high-impact-startup',
    summary: 'Discover the essential principles of modern entrepreneurship, product-market fit, and scaling tech ventures with sustainable growth.',
    content: `Entrepreneurship is not merely about launching a company; it is an ongoing process of solving critical problems with resilience, clarity, and vision.

### Key Pillars of Entrepreneurial Success:
1. **Solving Real Customer Pain**: True value stems from building solutions that people actively seek and rely upon.
2. **Execution & Agility**: Ideas are plentiful, but execution differentiates enduring organizations from short-lived projects.
3. **Continuous Education**: The fastest-growing leaders prioritize lifelong learning and adapt rapidly to evolving market demands.`,
    category: 'Entrepreneurship',
    author: {
      name: 'Farukh Shir',
      role: 'Founder & Educator',
    },
    readTime: '5 min read',
    publishedAt: '2026-09-08',
    featured: false,
    tags: ['Entrepreneurship', 'Startups', 'Business Strategy'],
  },
];

let localBlogCache: BlogPost[] = [...SEED_BLOG_POSTS];

export async function fetchBlogPosts(category?: string, searchQuery?: string): Promise<BlogPost[]> {
  try {
    const q = query(collection(db, 'blogPosts'), orderBy('publishedAt', 'desc'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const remotePosts: BlogPost[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title || '',
          slug: data.slug || d.id,
          summary: data.summary || '',
          content: data.content || '',
          category: data.category || 'General',
          author: {
            name: data.author?.name || 'Farukh Academy',
            role: data.author?.role || 'Educator',
            avatar: data.author?.avatar,
          },
          readTime: data.readTime || '4 min read',
          publishedAt: data.publishedAt || new Date().toISOString().split('T')[0],
          coverImage: data.coverImage,
          featured: data.featured || false,
          tags: Array.isArray(data.tags) ? data.tags : [],
        };
      });

      // Merge remote posts with seeds that don't collide
      const remoteIds = new Set(remotePosts.map((p) => p.id));
      const remainingSeeds = SEED_BLOG_POSTS.filter((s) => !remoteIds.has(s.id));
      localBlogCache = [...remotePosts, ...remainingSeeds];
    }
  } catch (err) {
    console.warn('Could not read blogPosts from Firestore, using cached posts:', err);
  }

  let result = localBlogCache;

  if (category && category !== 'All') {
    result = result.filter((p) => p.category === category);
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return result;
}

export async function fetchBlogPostById(id: string): Promise<BlogPost | undefined> {
  // Check memory first
  const existing = localBlogCache.find((p) => p.id === id || p.slug === id);
  if (existing) return existing;

  try {
    const docRef = doc(db, 'blogPosts', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const post: BlogPost = {
        id: snap.id,
        title: data.title || '',
        slug: data.slug || snap.id,
        summary: data.summary || '',
        content: data.content || '',
        category: data.category || 'General',
        author: {
          name: data.author?.name || 'Farukh Academy',
          role: data.author?.role || 'Educator',
          avatar: data.author?.avatar,
        },
        readTime: data.readTime || '4 min read',
        publishedAt: data.publishedAt || new Date().toISOString().split('T')[0],
        coverImage: data.coverImage,
        featured: data.featured || false,
        tags: Array.isArray(data.tags) ? data.tags : [],
      };
      localBlogCache = [post, ...localBlogCache];
      return post;
    }
  } catch (err) {
    console.warn('Error fetching single blog post from Firestore:', err);
  }

  return SEED_BLOG_POSTS.find((p) => p.id === id || p.slug === id);
}

export async function createOrUpdateBlogPost(postData: {
  id?: string;
  title: string;
  slug?: string;
  summary: string;
  content: string;
  category: BlogCategory;
  authorName?: string;
  authorRole?: string;
  readTime?: string;
  coverImage?: string;
  featured?: boolean;
  tags?: string[];
}): Promise<string> {
  const id =
    postData.id ||
    `blog_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const slug =
    postData.slug ||
    postData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') ||
    id;

  // Auto-calculate read time if not provided: ~200 words per minute
  const wordCount = postData.content.trim().split(/\s+/).length;
  const calculatedReadTime = `${Math.max(1, Math.ceil(wordCount / 180))} min read`;

  const newPost: BlogPost = {
    id,
    title: postData.title.trim(),
    slug,
    summary: postData.summary.trim(),
    content: postData.content.trim(),
    category: postData.category,
    author: {
      name: postData.authorName?.trim() || 'Farukh Shir',
      role: postData.authorRole?.trim() || 'Academy Lead & Author',
    },
    readTime: postData.readTime?.trim() || calculatedReadTime,
    publishedAt: new Date().toISOString().split('T')[0],
    coverImage: postData.coverImage?.trim() || undefined,
    featured: postData.featured || false,
    tags: postData.tags || [],
  };

  // Update in memory cache immediately
  const existingIdx = localBlogCache.findIndex((p) => p.id === id);
  if (existingIdx !== -1) {
    localBlogCache[existingIdx] = newPost;
  } else {
    localBlogCache = [newPost, ...localBlogCache];
  }

  // Persist to Firestore with undefined values stripped
  try {
    const docRef = doc(db, 'blogPosts', id);
    const firestorePayload = cleanFirestoreData({
      ...newPost,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    await setDoc(docRef, firestorePayload);
  } catch (err) {
    console.warn('Error saving blog post to Firestore, kept in cache:', err);
  }

  return id;
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  localBlogCache = localBlogCache.filter((p) => p.id !== id);

  try {
    const docRef = doc(db, 'blogPosts', id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn('Error deleting blog post from Firestore:', err);
    return true;
  }
}
