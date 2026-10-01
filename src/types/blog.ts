export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: 'Entrepreneurship' | 'Education' | 'Leadership' | 'Technology';
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  readTime: string;
  publishedAt: string;
  coverImage?: string;
  featured?: boolean;
  tags: string[];
}
