import { BlogPost } from '../../types/blog';

const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    title: 'Building a High-Impact Startup: Lessons in Entrepreneurship',
    slug: 'building-high-impact-startup',
    summary: 'Discover the essential principles of modern entrepreneurship, product-market fit, and scaling tech ventures with sustainable growth.',
    content: `Entrepreneurship is not merely about launching a company; it is an ongoing process of solving critical problems with resilience, clarity, and vision.

### Key Pillars of Entrepreneurial Success

1. **Solving Real Customer Pain**: True value stems from building solutions that people actively seek and rely upon.
2. **Execution & Agility**: Ideas are plentiful, but execution differentiates enduring organizations from short-lived projects.
3. **Continuous Education**: The fastest-growing leaders prioritize lifelong learning and adapt rapidly to evolving market demands.

### Cultivating an Entrepreneurial Mindset

Whether you are building your first enterprise or scaling an existing venture, continuous skill enhancement in technology, leadership, and strategy is your greatest asset. At FARUKH.ORG, our mission is to empower visionaries with world-class education and actionable insights.`,
    category: 'Entrepreneurship',
    author: {
      name: 'Farukh Shir',
      role: 'Founder & Entrepreneurship Educator',
    },
    readTime: '5 min read',
    publishedAt: '2026-09-28',
    featured: true,
    tags: ['Entrepreneurship', 'Business Strategy', 'Leadership', 'Startup'],
  },
  {
    id: 'post-2',
    title: 'The Future of Digital Education: AI & Interactive Learning',
    slug: 'future-of-digital-education',
    summary: 'How artificial intelligence and practical hands-on curricula are reshaping online learning platforms for global students.',
    content: `Education is experiencing its most transformational shift in decades. Modern learners demand interactive, accessible, and self-paced digital environments.

### The Role of Next-Gen Platforms

Interactive courses with real-time feedback, digital certification, and practical assessments ensure that learners gain practical competency rather than passive knowledge.

- Personalized Learning Paths
- Verified Digital Credentials
- Real-World Project Execution`,
    category: 'Education',
    author: {
      name: 'Farukh Shir',
      role: 'EdTech Specialist',
    },
    readTime: '4 min read',
    publishedAt: '2026-09-20',
    featured: false,
    tags: ['EdTech', 'Interactive Learning', 'Skills'],
  },
  {
    id: 'post-3',
    title: 'Leadership Principles for Tech Visionaries in 2026',
    slug: 'leadership-principles-2026',
    summary: 'Strategies for leading remote teams, empowering innovators, and maintaining strategic focus amid rapid technological shifts.',
    content: `Great leaders inspire innovation while fostering accountability. In today's fast-moving tech ecosystem, leadership requires empathy, clear communication, and decisive strategic vision.

- Lead by example
- Build trust through transparency
- Empower teams to experiment and iterate fast`,
    category: 'Leadership',
    author: {
      name: 'Farukh Shir',
      role: 'Executive Coach & Founder',
    },
    readTime: '6 min read',
    publishedAt: '2026-09-15',
    featured: false,
    tags: ['Leadership', 'Management', 'Strategy'],
  },
  {
    id: 'post-4',
    title: 'Mastering Modern Full-Stack Development with React Native & Expo',
    slug: 'mastering-fullstack-react-native',
    summary: 'A comprehensive roadmap to building cross-platform web and mobile applications with React Native, Expo Router, and Cloud Backends.',
    content: `Cross-platform development allows developers to write code once and deploy seamlessly across iOS, Android, and Web.

Leveraging modern stacks like Expo Router, NativeWind, and Firebase empowers developers to build scalable enterprise apps rapidly.`,
    category: 'Technology',
    author: {
      name: 'Tech Engineering Team',
      role: 'Software Architecture',
    },
    readTime: '7 min read',
    publishedAt: '2026-09-10',
    featured: false,
    tags: ['React Native', 'Expo', 'Mobile', 'Web'],
  },
];

export async function fetchBlogPosts(category?: string, searchQuery?: string): Promise<BlogPost[]> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  let result = MOCK_BLOG_POSTS;

  if (category && category !== 'All') {
    result = result.filter((p) => p.category === category);
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return result;
}

export async function fetchBlogPostById(id: string): Promise<BlogPost | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return MOCK_BLOG_POSTS.find((p) => p.id === id || p.slug === id);
}
