export type CommunityPostType = 'text' | 'poll';
export type CommunityPostStatus = 'pending' | 'approved' | 'rejected';

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface CommunityPost {
  id: string;
  type: CommunityPostType;
  title: string;
  content?: string;
  category?: string;
  pollOptions?: PollOption[];
  voters?: Record<string, string>; // userId -> optionId
  totalVotes?: number;
  authorId: string;
  authorName: string;
  authorRole?: 'admin' | 'student';
  authorAvatar?: string;
  status: CommunityPostStatus;
  likes?: number;
  likedBy?: string[];
  createdAt: any;
  updatedAt?: any;
}
