import type { RouteWithProfile } from '../model/routes.model';
import type { RouteImageRow } from '../services/PostImageSlidesService';

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
    image_preview_url?: string;
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
  onProfilePress?: (username: string) => void;
}

export interface PostProps {
  postId: string;
  userId: string | null;
  /** Feed / profil listesinden gelen satır; verilirse usePost tekrar istek atmaz. */
  initialRoute?: RouteWithProfile;
  /** Liste batch modu: resim meta tek sorguda gelir. */
  batchImages?: boolean;
  /** batchImages ile: undefined = bekleniyor, [] = resim yok. */
  prefetchedImageRows?: RouteImageRow[];
  showFullScreen?: boolean;
  actions?: PostActions;
}

export interface ImageCarouselProps {
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  height?: number;
  dynamicHeight?: boolean;
  /** DB boyutlarından hesaplanan yükseklikler; verilirse Image.getSize çalışmaz. */
  displayHeights?: number[];
  maxHeight?: number;
  minHeight?: number;
  isLiked?: boolean;
  onDoubleTap?: () => void;
}

export interface PostHeaderProps {
  username: string;
  userImage?: string;
  userImagePreview?: string;
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
  isVerified?: boolean;
}

export interface PostActionsProps {
  isLiked: boolean;
  isSaved?: boolean;
  isSaveLoading?: boolean;
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
  createdAt: string;
  onComment: () => void;
  onLikesPress?: () => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}
