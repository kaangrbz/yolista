import React, { useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  Image,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Photo } from '../../screens/CreateRoute/PhotoSelectionScreen';

interface ImageCarouselProps {
  photos: Photo[];
  currentIndex: number;
  onSwipe: (index: number) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  photos,
  currentIndex,
  onSwipe,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto scroll to current index when it changes
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: currentIndex * screenWidth,
        animated: true,
      });
    }
  }, [currentIndex]);

  const handleMomentumScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < photos.length) {
      onSwipe(newIndex);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onSwipe(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      onSwipe(currentIndex + 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Image Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.scrollView}>
        {photos.map((photo, index) => (
          <View key={photo.id} style={styles.imageContainer}>
            <Image source={{ uri: photo.uri }} style={styles.image} />

            <View style={styles.overlay}>
              <View style={styles.pageChip}>
                <Text style={styles.pageChipText}>
                  {index + 1} / {photos.length}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <TouchableOpacity
          style={[styles.navButton, styles.prevButton]}
          onPress={handlePrevious}>
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {currentIndex < photos.length - 1 && (
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={handleNext}>
          <Icon name="chevron-right" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Dots Indicator */}
      <View style={styles.dotsContainer}>
        {photos.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dot,
              index === currentIndex && styles.activeDot,
            ]}
            onPress={() => onSwipe(index)} />
        ))}
      </View>

      {/* Thumbnail Strip */}
      <View style={styles.thumbnailStrip}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailContainer}>
          {photos.map((photo, index) => (
            <TouchableOpacity
              key={photo.id}
              style={[
                styles.thumbnail,
                index === currentIndex && styles.activeThumbnail,
              ]}
              onPress={() => onSwipe(index)}>
              <Image source={{ uri: photo.uri }} style={styles.thumbnailImage} />
              {index === currentIndex && (
                <View style={styles.thumbnailOverlay}>
                  <Icon name="check" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: screenWidth,
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pageChip: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pageChipText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevButton: {
    left: 16,
  },
  nextButton: {
    right: 16,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 20,
  },
  thumbnailStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  thumbnailContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
    height: '100%',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginHorizontal: 4,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  activeThumbnail: {
    borderColor: '#fff',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
