export interface Post {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  user_id: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  did_like: boolean;
  is_deleted: boolean;
  profiles?: {
    username: string;
    full_name: string;
    image_url?: string;
    is_verified: boolean;
  };
  cities?: {
    name: string;
  };
  categories?: {
    name: string;
    icon_name: string;
  };
}

export interface PostActions {
  onLike?: (postId: string, isLiked: boolean) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onProfilePress?: (userId: string) => void;
}

export interface PostProps {
  postId: string;
  userId: string | null;
  showFullScreen?: boolean;
  actions?: PostActions;
}

export interface ImageCarouselProps {
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  height?: number;
  dynamicHeight?: boolean;
  maxHeight?: number;
  minHeight?: number;
  onDoubleTap?: () => void;
}

export interface PostHeaderProps {
  username: string;
  userImage?: string;
  userId?: string;
  location?: string;
  onProfilePress: () => void;
  onMorePress?: () => void;
  onReportPress?: () => void;
  onBlockPress?: () => void;
  onFollowPress?: () => void;
  onUnfollowPress?: () => void;
  onEditPress?: () => void;
  onDeletePress?: () => void;
  onSharePress?: () => void;
  onCopyLinkPress?: () => void;
  isOwnPost?: boolean;
  isFollowing?: boolean;
}

export interface PostActionsProps {
  isLiked: boolean;
  likeCount: number;
  commentCount: number;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
}

export interface PostCaptionProps {
  username: string;
  title: string;
  description?: string;
  likeCount: number;
  commentCount: number;
  timeAgo: string;
  onComment: () => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}
