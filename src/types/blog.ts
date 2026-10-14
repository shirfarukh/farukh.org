export type BlogCategory =
  | 'Entrepreneurship'
  | 'Education'
  | 'Leadership'
  | 'Technology'
  | 'AI & Tech'
  | 'Stocks & Crypto'
  | 'Ecommerce'
  | 'Languages'
  | 'Morals';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: BlogCategory;
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
