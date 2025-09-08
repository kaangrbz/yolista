import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ImageCarouselProps } from '../../types/post.types';

const { width: screenWidth } = Dimensions.get('window');

interface ImageDimensions {
  width: number;
  height: number;
}

// Cache for image dimensions to avoid recalculating
const imageDimensionsCache = new Map<string, ImageDimensions>();

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  currentIndex,
  onIndexChange,
  height = 400,
  dynamicHeight = false,
  maxHeight = 600,
  minHeight = 200,
  onDoubleTap,
}) => {
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions[]>([]);
  const [calculatedHeight, setCalculatedHeight] = useState(height);
  
  // Double tap animation
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  // Calculate image dimensions when images change
  useEffect(() => {
    if (dynamicHeight && images.length > 0) {
      const loadImageDimensions = async () => {
        const dimensions: ImageDimensions[] = [];
        
        for (const imageUri of images) {
          // Check cache first
          if (imageDimensionsCache.has(imageUri)) {
            dimensions.push(imageDimensionsCache.get(imageUri)!);
            continue;
          }

          try {
            const dim = await new Promise<ImageDimensions>((resolve, reject) => {
              Image.getSize(
                imageUri,
                (width, height) => {
                  // Calculate aspect ratio and adjust for screen width
                  const aspectRatio = height / width;
                  const adjustedHeight = screenWidth * aspectRatio;
                  
                  // Clamp height between min and max
                  const clampedHeight = Math.max(
                    minHeight,
                    Math.min(maxHeight, adjustedHeight)
                  );
                  
                  const result = { width: screenWidth, height: clampedHeight };
                  
                  // Cache the result
                  imageDimensionsCache.set(imageUri, result);
                  
                  resolve(result);
                },
                (error) => {
                  console.warn('Error getting image size:', error);
                  const fallback = { width: screenWidth, height: height };
                  imageDimensionsCache.set(imageUri, fallback);
                  resolve(fallback);
                }
              );
            });
            
            dimensions.push(dim);
          } catch (error) {
            console.warn('Error processing image:', error);
            const fallback = { width: screenWidth, height: height };
            imageDimensionsCache.set(imageUri, fallback);
            dimensions.push(fallback);
          }
        }
        
        setImageDimensions(dimensions);
        
        // Set height to current image's height
        if (dimensions[currentIndex]) {
          setCalculatedHeight(dimensions[currentIndex].height);
        }
      };

      loadImageDimensions();
    }
  }, [images, dynamicHeight, currentIndex, height, maxHeight, minHeight]);

  // Update height when current index changes
  useEffect(() => {
    if (dynamicHeight && imageDimensions[currentIndex]) {
      setCalculatedHeight(imageDimensions[currentIndex].height);
    }
  }, [currentIndex, imageDimensions, dynamicHeight]);

  const handleImageScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    onIndexChange(index);
  };

  const getImageHeight = (index: number) => {
    if (dynamicHeight && imageDimensions[index]) {
      return imageDimensions[index].height;
    }
    return calculatedHeight;
  };

  const lastTap = useRef<number>(0);
  const doubleTapDelay = 300; // milliseconds

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < doubleTapDelay) {
      // Double tap detected
      if (onDoubleTap) {
        onDoubleTap();
        showHeartAnimation();
      }
    }
    lastTap.current = now;
  };

  const showHeartAnimation = () => {
    // Reset animation values
    heartScale.setValue(0);
    heartOpacity.setValue(1);

    // Animate heart
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

  return (
    <View style={[styles.container, { height: calculatedHeight }]}>
      <ScrollView
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
                  width: screenWidth 
                }
              ]}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Image Indicators */}
      {images.length > 1 && (
        <View style={styles.indicators}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.activeIndicator
              ]}
            />
          ))}
        </View>
      )}

      {/* Heart Animation */}
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

const styles = StyleSheet.create({
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
    backgroundColor: '#f5f5f5',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
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
});

export default ImageCarousel;
