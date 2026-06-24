import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Pressable,
  Text,
  Modal,
  Dimensions,
} from 'react-native';
import ImageView from 'react-native-image-viewing';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PostImageSlide } from '../../types/postImage.types';
import { saveImageToGallery } from '../../utils/saveImageToGallery';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

export interface PreviewMenuOption {
  id: string;
  title: string;
  icon: string;
  color?: string;
  onPress: () => void;
}

interface PostImagePreviewProps {
  slides: PostImageSlide[];
  visible: boolean;
  initialIndex?: number;
  description?: string | null;
  menuOptions: PreviewMenuOption[];
  onRequestClose: () => void;
  onIndexChange?: (index: number) => void;
}

const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 };
const { width: screenWidth } = Dimensions.get('window');

function buildViewerImages(slides: PostImageSlide[]) {
  return slides
    .map((slide, slideIndex) => ({ slide, slideIndex }))
    .filter((entry) => entry.slide.uri)
    .map((entry) => ({
      uri: entry.slide.uri as string,
      slideIndex: entry.slideIndex,
    }));
}

function resolveViewerIndex(
  viewerEntries: ReturnType<typeof buildViewerImages>,
  slideIndex: number,
): number {
  const found = viewerEntries.findIndex((entry) => entry.slideIndex === slideIndex);

  return found >= 0 ? found : 0;
}

const MediaScrim: React.FC<{
  variant: 'top' | 'bottom';
  height: number;
}> = ({ variant, height }) => (
  <View
    pointerEvents="none"
    style={[
      styles.scrim,
      variant === 'top' ? styles.scrimTop : styles.scrimBottom,
      { height },
    ]}
  >
    <Svg width={screenWidth} height={height}>
      <Defs>
        <LinearGradient
          id={`preview-scrim-${variant}`}
          x1="0"
          y1={variant === 'top' ? '0' : '1'}
          x2="0"
          y2={variant === 'top' ? '1' : '0'}
        >
          <Stop offset="0" stopColor="#000" stopOpacity={variant === 'top' ? 0.72 : 0.82} />
          <Stop offset="0.55" stopColor="#000" stopOpacity={variant === 'top' ? 0.28 : 0.35} />
          <Stop offset="1" stopColor="#000" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect width={screenWidth} height={height} fill={`url(#preview-scrim-${variant})`} />
    </Svg>
  </View>
);

const PreviewOptionsSheet: React.FC<{
  visible: boolean;
  options: PreviewMenuOption[];
  onClose: () => void;
}> = ({ visible, options, onClose }) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const styles = useThemedStyles((t) => ({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: t.overlayDark,
    },
    sheet: {
      backgroundColor: t.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: Math.max(insets.bottom, 12),
      overflow: 'hidden',
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.borderStrong,
      marginTop: 10,
      marginBottom: 4,
    },
    title: {
      fontSize: 13,
      fontWeight: '600',
      color: t.textMuted,
      textAlign: 'center',
      paddingVertical: 10,
      letterSpacing: 0.2,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
      gap: 14,
    },
    optionPressed: {
      backgroundColor: t.surfaceMuted,
    },
    optionIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surfaceMuted,
    },
    optionText: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: t.textPrimary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.hairlineBorder,
      marginHorizontal: 20,
    },
    cancelButton: {
      marginTop: 8,
      marginHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: t.surfaceMuted,
    },
    cancelText: {
      fontSize: 16,
      fontWeight: '700',
      color: t.textPrimary,
    },
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Seçenekler</Text>

          {options.map((option, index) => (
            <View key={option.id}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <Pressable
                style={({ pressed }) => [
                  styles.option,
                  pressed && styles.optionPressed,
                ]}
                onPress={() => {
                  option.onPress();
                  onClose();
                }}
              >
                <View style={styles.optionIconWrap}>
                  <Icon
                    name={option.icon}
                    size={20}
                    color={option.color || theme.textPrimary}
                  />
                </View>
                <Text
                  style={[
                    styles.optionText,
                    option.color ? { color: option.color } : null,
                  ]}
                >
                  {option.title}
                </Text>
              </Pressable>
            </View>
          ))}

          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && { opacity: 0.85 },
            ]}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>Vazgeç</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const PreviewPageIndicator: React.FC<{
  total: number;
  activeIndex: number;
}> = ({ total, activeIndex }) => {
  if (total <= 1) {
    return null;
  }

  if (total <= 7) {
    return (
      <View style={styles.pageDots} pointerEvents="none">
        {Array.from({ length: total }, (_, index) => (
          <View
            key={index}
            style={[
              styles.pageDot,
              index === activeIndex && styles.pageDotActive,
            ]}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.pageCounter} pointerEvents="none">
      <Text style={styles.pageCounterText}>
        {activeIndex + 1} / {total}
      </Text>
    </View>
  );
};

const PostImagePreview: React.FC<PostImagePreviewProps> = ({
  slides,
  visible,
  initialIndex = 0,
  description,
  menuOptions,
  onRequestClose,
  onIndexChange,
}) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [chromeVisible, setChromeVisible] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeViewerIndex, setActiveViewerIndex] = useState(0);
  const [mountKey, setMountKey] = useState(0);
  const wasVisibleRef = useRef(false);
  const onIndexChangeRef = useRef(onIndexChange);

  onIndexChangeRef.current = onIndexChange;

  const viewerEntries = useMemo(() => buildViewerImages(slides), [slides]);
  const viewerImages = useMemo(
    () => viewerEntries.map((entry) => ({ uri: entry.uri })),
    [viewerEntries],
  );

  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      const nextViewerIndex = resolveViewerIndex(viewerEntries, initialIndex);
      setChromeVisible(true);
      setMenuVisible(false);
      setActiveViewerIndex(nextViewerIndex);
      setMountKey((value) => value + 1);
    }

    if (!visible) {
      setMenuVisible(false);
    }

    wasVisibleRef.current = visible;
  }, [visible, initialIndex, viewerEntries]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const entry = StatusBar.pushStackEntry({
      barStyle: 'light-content',
      animated: true,
    });

    return () => {
      StatusBar.popStackEntry(entry);
    };
  }, [visible]);

  const handleImageIndexChange = (nextIndex: number) => {
    setActiveViewerIndex(nextIndex);
    setChromeVisible(true);

    const slideIndex = viewerEntries[nextIndex]?.slideIndex;

    if (slideIndex !== undefined) {
      onIndexChangeRef.current?.(slideIndex);
    }
  };

  const handleToggleChrome = () => {
    if (menuVisible) {
      return;
    }

    setChromeVisible((value) => !value);
  };

  const currentSlideIndex =
    viewerEntries[activeViewerIndex]?.slideIndex ?? initialIndex;
  const currentSlide = slides[currentSlideIndex];
  const slideTitle = currentSlide?.hint?.trim() ?? '';
  const trimmedDescription = description?.trim() ?? '';
  const totalSlides = slides.length;
  const hasFooterContent =
    Boolean(slideTitle) || Boolean(trimmedDescription) || totalSlides > 1;

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerRoot} pointerEvents="box-none">
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleToggleChrome}
          accessibilityRole="button"
          accessibilityLabel={
            chromeVisible ? 'Arayüzü gizle' : 'Arayüzü göster'
          }
        />

        {chromeVisible ? (
          <>
            <MediaScrim variant="top" height={insets.top + 88} />

            <View
              style={[
                styles.headerBar,
                {
                  paddingTop: insets.top + 10,
                  paddingLeft: 14 + insets.left,
                  paddingRight: 14 + insets.right,
                },
              ]}
              pointerEvents="box-none"
            >
              <TouchableOpacity
                onPress={onRequestClose}
                style={styles.chromeButton}
                hitSlop={hitSlop}
                accessibilityRole="button"
                accessibilityLabel="Kapat"
              >
                <Icon name="close" size={22} color={theme.onMedia} />
              </TouchableOpacity>

              <PreviewPageIndicator
                total={totalSlides}
                activeIndex={currentSlideIndex}
              />

              <TouchableOpacity
                onPress={() => setMenuVisible(true)}
                style={styles.chromeButton}
                hitSlop={hitSlop}
                accessibilityRole="button"
                accessibilityLabel="Daha fazla seçenek"
              >
                <Icon name="dots-horizontal" size={22} color={theme.onMedia} />
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        <PreviewOptionsSheet
          visible={menuVisible}
          options={menuOptions}
          onClose={() => setMenuVisible(false)}
        />
      </View>
    ),
    [
      chromeVisible,
      currentSlideIndex,
      insets.left,
      insets.right,
      insets.top,
      menuOptions,
      menuVisible,
      onRequestClose,
      theme.onMedia,
      totalSlides,
    ],
  );

  const renderFooter = useCallback(
    () => {
      if (!chromeVisible || !hasFooterContent) {
        return null;
      }

      const footerHeight = Math.max(
        120,
        (slideTitle ? 34 : 0) +
          (trimmedDescription ? 56 : 0) +
          Math.max(insets.bottom, 16) +
          28,
      );

      return (
        <View style={styles.footerRoot} pointerEvents="box-none">
          <MediaScrim variant="bottom" height={footerHeight} />

          <View
            style={[
              styles.footerContent,
              {
                paddingBottom: Math.max(insets.bottom, 18),
                paddingLeft: 18 + insets.left,
                paddingRight: 18 + insets.right,
              },
            ]}
            pointerEvents="none"
          >
            {totalSlides > 1 ? (
              <View style={styles.stopBadge}>
                <Icon name="map-marker-outline" size={13} color={theme.onMedia} />
                <Text style={styles.stopBadgeText}>
                  Durak {currentSlideIndex + 1}
                </Text>
              </View>
            ) : null}

            {slideTitle ? (
              <Text style={styles.title} numberOfLines={2}>
                {slideTitle}
              </Text>
            ) : null}

            {trimmedDescription ? (
              <Text style={styles.description} numberOfLines={3}>
                {trimmedDescription}
              </Text>
            ) : null}
          </View>
        </View>
      );
    },
    [
      chromeVisible,
      currentSlideIndex,
      hasFooterContent,
      insets.bottom,
      insets.left,
      insets.right,
      slideTitle,
      theme.onMedia,
      totalSlides,
      trimmedDescription,
    ],
  );

  if (!visible || viewerImages.length === 0) {
    return null;
  }

  const openImageIndex = resolveViewerIndex(viewerEntries, initialIndex);

  return (
    <ImageView
      key={`post-image-preview-${mountKey}`}
      images={viewerImages}
      imageIndex={openImageIndex}
      visible={visible}
      onRequestClose={onRequestClose}
      onImageIndexChange={handleImageIndexChange}
      swipeToCloseEnabled
      doubleTapToZoomEnabled
      HeaderComponent={renderHeader}
      FooterComponent={renderFooter}
      backgroundColor={theme.mediaBackdrop}
    />
  );
};

export async function savePreviewSlide(slide: PostImageSlide | undefined): Promise<void> {
  if (!slide?.uri) {
    return;
  }

  await saveImageToGallery(slide.uri);
}

const styles = StyleSheet.create({
  headerRoot: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    minHeight: 52,
  },
  chromeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  pageDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
  },
  pageDotActive: {
    width: 18,
    backgroundColor: '#fff',
  },
  pageCounter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },
  pageCounterText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  scrimTop: {
    top: 0,
  },
  scrimBottom: {
    bottom: 0,
  },
  footerRoot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  footerContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: 8,
    paddingTop: 8,
  },
  stopBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stopBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.15,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.86)',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
});

export default PostImagePreview;
