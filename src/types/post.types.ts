import type { RouteWithProfile } from '../model/routes.model';
import type { RouteImageRow } from '../services/PostImageSlidesService';
import type { ImageResizeMode } from 'react-native';
import type { PostImageSlide } from './postImage.types';

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
  detailExperienceSlot?: React.ReactNode;
  /** Feed listesinde durak sayısı ipucu (Rotayı aç CTA). */
  stopCountHint?: number | null;
  /** Carousel ↔ harita senkronu. */
  activeSlideIndex?: number;
  onActiveSlideIndexChange?: (index: number) => void;
  /** Feed listesinde ağ indirmesine izin ver (viewport penceresi). */
  imageDownloadEnabled?: boolean;
  /** Feed scroll iptali için generation token. */
  downloadGeneration?: number;
  /** Feed listesindeki sıra; indirme önceliği için. */
  feedIndex?: number;
  /**
   * Carousel çerçevesi ilk fotoğrafın image_width/image_height oranına kilitlenir;
   * diğer slaytlar aynı en-boy kutusunda gösterilir, kaydırınca yükseklik değişmez.
   * (varsayılan: true)
   */
  lockCarouselToFirstPhotoDimensions?: boolean;
  /**
   * Ana fotoğraf (ilk slayt) dışındaki görsellerin resizeMode tercihi.
   * (varsayılan: cover)
   */
  secondaryImageResizeMode?: ImageResizeMode;
}

export interface ImageCarouselProps {
  slides: PostImageSlide[];
  /** DB title — fotoğraf ipucu; slides ile aynı indeks */
  hints?: (string | null | undefined)[];
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
  onImagePress?: (index: number) => void;
  /** true: tüm slaytlar ilk fotoğrafın boyut çerçevesinde; kaydırınca yükseklik sabit. */
  lockToFirstPhotoDimensions?: boolean;
  /** İlk slayt dışındaki görsellerin resizeMode tercihi (varsayılan: cover). */
  secondaryImageResizeMode?: ImageResizeMode;
  /** Feed / detay: ağ indirmesine izin ver (varsayılan: true). */
  downloadEnabled?: boolean;
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

export type PostActionsVariant = 'default' | 'compact';

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
  variant?: PostActionsVariant;
}

export interface PostCaptionProps {
  username: string;
  description?: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  onComment: () => void;
  onLikesPress?: () => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  /** Rota detayda açıklama üstte önizlenir; alttaki caption tekrar etmez. */
  hideDescription?: boolean;
  /** Rota detayda yorum linki ayrı satırda gösterilir. */
  hideCommentPreview?: boolean;
}
