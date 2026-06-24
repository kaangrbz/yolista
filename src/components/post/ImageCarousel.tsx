import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import SmartImage from '../common/smart-image/SmartImage';
import RouteImageSkeleton from '../common/smart-image/RouteImageSkeleton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ImageCarouselProps } from '../../types/post.types';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import PhotoHintOverlay from './PhotoHintOverlay';

const { width: screenWidth } = Dimensions.get('window');
const doubleTapDelay = 300;

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  slides,
  hints = [],
  currentIndex,
  onIndexChange,
  height = 400,
  dynamicHeight = false,
  displayHeights,
  maxHeight = 600,
  minHeight = 200,
  isLiked = false,
  onDoubleTap,
  onImagePress,
  lockToFirstPhotoDimensions = true,
  secondaryImageResizeMode = 'cover',
  downloadEnabled = true,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    container: {
      position: 'relative',
    },
    scrollView: {
      height: '100%',
    },
    image: {
      width: screenWidth,
    },
    indicators: {
      position: 'absolute',
      top: 8,
      right: 8,
      flexDirection: 'row',
    },
    indicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      marginHorizontal: 2,
    },
    activeIndicator: {
      backgroundColor: '#fff',
    },
    imageTouchable: {
      width: screenWidth,
      height: '100%',
    },
    heartAnimation: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginTop: -40,
      marginLeft: -40,
      zIndex: 1000,
    },
  }));

  const [calculatedHeight, setCalculatedHeight] = useState(height);
  const hasPresetHeights = Boolean(displayHeights?.length);

  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const syncedIndexRef = useRef(currentIndex);
  const lastTap = useRef(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentIndex === syncedIndexRef.current) {
      return;
    }

    syncedIndexRef.current = currentIndex;
    scrollRef.current?.scrollTo({
      x: currentIndex * screenWidth,
      animated: true,
    });
  }, [currentIndex]);

  useEffect(() => {
    if (lockToFirstPhotoDimensions) {
      const lockedHeight = displayHeights?.[0] ?? height;
      setCalculatedHeight(lockedHeight);
      return;
    }

    if (!dynamicHeight) {
      setCalculatedHeight(height);
      return;
    }

    if (hasPresetHeights && displayHeights && displayHeights[currentIndex] !== undefined) {
      setCalculatedHeight(displayHeights[currentIndex]);
      return;
    }

    setCalculatedHeight(height);
  }, [
    dynamicHeight,
    displayHeights,
    currentIndex,
    hasPresetHeights,
    height,
    lockToFirstPhotoDimensions,
  ]);

  const handleImageScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    syncedIndexRef.current = index;
    onIndexChange(index);
  };

  const getImageHeight = (index: number) => {
    if (
      !lockToFirstPhotoDimensions &&
      dynamicHeight &&
      displayHeights &&
      displayHeights[index] !== undefined
    ) {
      return displayHeights[index];
    }

    return calculatedHeight;
  };

  const showHeartAnimation = () => {
    heartScale.setValue(0);
    heartOpacity.setValue(1);

    Animated.parallel([
      Animated.timing(heartScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(heartOpacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = (index: number) => {
    const now = Date.now();
    const slide = slides[index];
    const hasOpenableImage = Boolean(slide?.uri);

    if (now - lastTap.current < doubleTapDelay) {
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
      }

      showHeartAnimation();

      if (onDoubleTap && !isLiked) {
        onDoubleTap();
      }

      lastTap.current = 0;
      return;
    }

    lastTap.current = now;

    if (!onImagePress || !hasOpenableImage) {
      return;
    }

    singleTapTimer.current = setTimeout(() => {
      singleTapTimer.current = null;
      onImagePress(index);
    }, doubleTapDelay);
  };

  const getImageResizeMode = (index: number) =>
    index === 0 ? 'cover' : secondaryImageResizeMode;

  if (slides.length === 0) {
    return (
      <View style={[styles.container, { height: calculatedHeight }]}>
        <RouteImageSkeleton
          width={screenWidth}
          height={calculatedHeight}
          borderRadius={0}
        />
      </View>
    );
  }

  const currentHint = hints[currentIndex]?.trim() ?? '';

  return (
    <View style={[styles.container, { height: calculatedHeight }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleImageScroll}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => {
          const imageHeight = getImageHeight(index);
          const hasOpenableImage = Boolean(slide.uri);

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={1}
              onPress={() => handlePress(index)}
              style={styles.imageTouchable}
            >
              <SmartImage
                kind="route"
                userId={slide.userId ?? ''}
                imageUrl={slide.imageUrl}
                imagePreviewUrl={slide.imagePreviewUrl}
                resolvedUri={slide.uri}
                downloadEnabled={downloadEnabled}
                cacheOnly={!downloadEnabled}
                width={screenWidth}
                height={imageHeight}
                resizeMode={getImageResizeMode(index)}
                style={styles.image}
                accessibilityLabel={
                  hasOpenableImage ? 'Gönderi fotoğrafı' : 'Görsel yüklenemedi'
                }
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {slides.length > 1 && (
        <View style={styles.indicators}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.activeIndicator,
              ]}
            />
          ))}
        </View>
      )}

      {currentHint ? (
        <PhotoHintOverlay
          hint={currentHint}
          slideKey={`${currentIndex}-${currentHint}`}
        />
      ) : null}

      <Animated.View
        style={[
          styles.heartAnimation,
          {
            opacity: heartOpacity,
            transform: [{ scale: heartScale }],
          },
        ]}
        pointerEvents="none"
      >
        <Icon name="heart" size={80} color="#ed4956" />
      </Animated.View>
    </View>
  );
};

export default ImageCarousel;
