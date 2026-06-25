import type { DimensionValue, ImageResizeMode, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import type { RouteImageVariant } from '../../../utils/routeImage';

export type SmartImageKind = 'user' | 'route' | 'header';

export interface SmartImageProps {
  kind: SmartImageKind;
  userId: string;
  /** Rota full görseli (image_url) */
  imageUrl?: string | null;
  /** Rota thumb (image_thumb_url) */
  imageThumbUrl?: string | null;
  /** Rota medium (image_medium_url) */
  imageMediumUrl?: string | null;
  /** Profil/kapak önizleme — kind=user|header için */
  imagePreviewUrl?: string | null;
  /** kind=route için hangi varyant indirilecek */
  variant?: RouteImageVariant;
  style?: StyleProp<ViewStyle>;
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  resizeMode?: ImageResizeMode;
  cacheOnly?: boolean;
  /** thumb varyantında full fallback yok */
  strictVariant?: boolean;
  /** false: ağ yok; önbellek hit'i yine gösterilir */
  downloadEnabled?: boolean;
  /** Önceden çözümlenmiş URI — indirme atlanır */
  resolvedUri?: string | null;
  fallbackSource?: ImageSourcePropType;
  onPress?: () => void;
  onLoad?: () => void;
  onError?: () => void;
  accessibilityLabel?: string;
  suppressErrorText?: boolean;
  /** Konteyner arka planı (varsayılan: theme.surfaceMuted) */
  backgroundColor?: string;
}

export interface SmartImageSourceState {
  imageUri: string | null;
  loading: boolean;
  error: string | null;
}
