import type { DimensionValue, ImageResizeMode, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

export type SmartImageKind = 'user' | 'route' | 'routePreview' | 'header';

export interface SmartImageProps {
  kind: SmartImageKind;
  userId: string;
  imageUrl?: string | null;
  imagePreviewUrl?: string | null;
  style?: StyleProp<ViewStyle>;
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  resizeMode?: ImageResizeMode;
  cacheOnly?: boolean;
  previewOnly?: boolean;
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
