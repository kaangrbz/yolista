import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, Dimensions, TouchableOpacity, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ImageCarouselProps } from '../../types/post.types';
import { useThemedStyles } from '../../theme/useThemedStyles';
import PhotoHintOverlay from './PhotoHintOverlay';

const { width: screenWidth } = Dimensions.get('window');

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
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
}) => {
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
    placeholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: t.surfaceMuted,
    },
    placeholderText: {
      fontSize: 16,
      color: t.textMuted,
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

  useEffect(() => {
    scrollRef.current?.scrollTo({
      x: currentIndex * screenWidth,
      animated: true,
    });
  }, [currentIndex]);

  useEffect(() => {
    if (!dynamicHeight) {
      setCalculatedHeight(height);
      return;
    }

    if (hasPresetHeights && displayHeights && displayHeights[currentIndex] !== undefined) {
      setCalculatedHeight(displayHeights[currentIndex]);
      return;
    }

    setCalculatedHeight(height);
  }, [dynamicHeight, hasPresetHeights, displayHeights, currentIndex, height]);

  const handleImageScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    onIndexChange(index);
  };

  const getImageHeight = (index: number) => {
    if (dynamicHeight && displayHeights && displayHeights[index] !== undefined) {
      return displayHeights[index];
    }

    return calculatedHeight;
  };

  const lastTap = useRef<number>(0);
  const doubleTapDelay = 300;

  const handleDoubleTap = () => {
    const now = Date.now();

    if (now - lastTap.current < doubleTapDelay) {
      showHeartAnimation();

      if (onDoubleTap && !isLiked) {
        onDoubleTap();
      }
    }

    lastTap.current = now;
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

  if (images.length === 0) {
    return (
      <View style={[styles.container, { height: calculatedHeight }]}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Resim yok</Text>
        </View>
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
        {images.map((imageUri, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={1}
            onPress={handleDoubleTap}
            style={styles.imageTouchable}
          >
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.image,
                {
                  height: getImageHeight(index),
                  width: screenWidth,
                },
              ]}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {images.length > 1 && (
        <View style={styles.indicators}>
          {images.map((_, index) => (
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
