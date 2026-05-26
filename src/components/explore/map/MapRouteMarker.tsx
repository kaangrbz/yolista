import React, { useEffect } from 'react';
import { Image, Text, View, ViewProps } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { usePostImageDownload } from '../../../hooks/useImageDownload';

interface MapRouteMarkerProps extends Pick<ViewProps, 'collapsable'> {
  /** Supabase storage'daki dosya adı (route.image_url). */
  imageUrl?: string | null;
  /** Küçük kare önizleme — varsa öncelikli indirilir. */
  imagePreviewUrl?: string | null;
  /** Resmi indirmek için gerekli kullanıcı id (route.user_id). */
  userId?: string | null;
  iconName?: string;
  selected?: boolean;
  /** Aynı konumdaki toplam rota sayısı (>=1). 2 ve üzeri ise iskambil-kart efekti uygulanır. */
  stackCount?: number;
  /** Durak sırası rozeti (seçili rota durakları için). */
  orderLabel?: string;
  /** Şehir merkezi fallback — pin görselinde tahmini konum göstergesi. */
  estimatedLocation?: boolean;
  /** Önizleme yüklendiğinde harita marker snapshot'ı için çağrılır. */
  onImageReady?: () => void;
}

const CARD_SIZE = 52;

export const MapRouteMarker: React.FC<MapRouteMarkerProps> = ({
  imageUrl,
  imagePreviewUrl,
  userId,
  iconName = 'map-marker',
  selected = false,
  stackCount = 1,
  orderLabel,
  estimatedLocation = false,
  onImageReady,
  collapsable,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    wrapper: {
      alignItems: 'center',
    },
    stackArea: {
      width: CARD_SIZE + 14,
      height: CARD_SIZE + 8,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    card: {
      position: 'absolute',
      width: CARD_SIZE,
      height: CARD_SIZE,
      borderRadius: 10,
      backgroundColor: t.background,
      borderWidth: 2,
      borderColor: t.accent,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.22,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
      bottom: 0,
      alignSelf: 'center',
    },
    cardBack1: {
      transform: [{ translateX: 6 }, { translateY: -4 }, { rotate: '6deg' }],
      opacity: 0.95,
    },
    cardBack2: {
      transform: [{ translateX: -6 }, { translateY: -6 }, { rotate: '-7deg' }],
      opacity: 0.85,
    },
    cardSelected: {
      transform: [{ scale: 1.08 }],
      borderColor: t.accent,
      shadowOpacity: 0.3,
    },
    cardEstimated: {
      borderStyle: 'dashed',
      borderColor: t.textMuted,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholder: {
      backgroundColor: t.surfaceMuted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badge: {
      position: 'absolute',
      top: -6,
      right: -6,
      minWidth: 20,
      height: 20,
      paddingHorizontal: 5,
      borderRadius: 10,
      backgroundColor: t.accent,
      borderWidth: 2,
      borderColor: t.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeText: {
      color: t.background,
      fontSize: 10,
      fontWeight: '700',
    },
    tail: {
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderTopWidth: 7,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: t.accent,
      marginTop: -1,
    },
    tailSelected: {
      borderTopColor: t.accent,
    },
    estimatedBadge: {
      position: 'absolute',
      bottom: 2,
      left: 2,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: t.overlayDark,
      justifyContent: 'center',
      alignItems: 'center',
    },
  }));

  const safeStack = Math.max(1, stackCount);
  const showStack = !orderLabel && safeStack > 1;
  const showOrderLabel = Boolean(orderLabel);

  const storageKey = imagePreviewUrl || imageUrl;

  const { imageUri, loading } = usePostImageDownload(
    imageUrl || undefined,
    userId || '',
    imagePreviewUrl || undefined,
  );

  useEffect(() => {
    if (!storageKey || !userId) {
      return;
    }

    if (!loading) {
      onImageReady?.();
    }
  }, [storageKey, userId, loading, imageUri, onImageReady]);

  return (
    <View style={styles.wrapper} collapsable={collapsable}>
      <View style={styles.stackArea}>
        {showStack && safeStack >= 3 ? (
          <View style={[styles.card, styles.cardBack2]} />
        ) : null}
        {showStack ? <View style={[styles.card, styles.cardBack1]} /> : null}

        <View
          style={[
            styles.card,
            selected && styles.cardSelected,
            estimatedLocation && styles.cardEstimated,
          ]}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Icon
                name={iconName}
                size={22}
                color={selected ? theme.background : theme.textPrimary}
              />
            </View>
          )}

          {showOrderLabel ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{orderLabel}</Text>
            </View>
          ) : null}

          {showStack ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{safeStack}</Text>
            </View>
          ) : null}

          {estimatedLocation ? (
            <View style={styles.estimatedBadge}>
              <Icon name="approximately-equal" size={10} color={theme.background} />
            </View>
          ) : null}
        </View>
      </View>

      <View style={[styles.tail, selected && styles.tailSelected]} />
    </View>
  );
};

export default MapRouteMarker;
