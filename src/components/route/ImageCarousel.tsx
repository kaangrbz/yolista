import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Photo } from '../../screens/CreateRoute/PhotoSelectionScreen';
import ImageViewer from '../ImageViewer';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

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
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.mediaBackdrop,
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
      left: 14,
      right: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    expandHint: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: t.overlayDark,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pageChip: {
      backgroundColor: t.overlayDark,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
    },
    pageChipText: {
      color: t.onMedia,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    navButton: {
      position: 'absolute',
      top: '50%',
      marginTop: -20,
      backgroundColor: t.overlayDark,
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
      backgroundColor: t.onMedia,
      width: 20,
    },
    thumbnailStrip: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 80,
      backgroundColor: t.overlayDark,
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
      borderColor: t.onMedia,
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
      backgroundColor: t.overlayDark,
      justifyContent: 'center',
      alignItems: 'center',
    },
  }));

  const scrollViewRef = useRef<ScrollView>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const viewerImages = useMemo(
    () => photos.map((p) => ({ uri: p.uri })),
    [photos],
  );

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: currentIndex * screenWidth,
        animated: true,
      });
    }
  }, [currentIndex]);

  const handleMomentumScrollEnd = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
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
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.scrollView}>
        {photos.map((photo, index) => (
          <TouchableOpacity
            key={photo.id}
            style={styles.imageContainer}
            activeOpacity={0.95}
            onPress={() => openViewer(index)}>
            <Image source={{ uri: photo.uri }} style={styles.image} />

            <View style={styles.overlay}>
              <View style={styles.pageChip}>
                <Text style={styles.pageChipText}>
                  {index + 1} / {photos.length}
                </Text>
              </View>

              <View style={styles.expandHint}>
                <Icon name="arrow-expand" size={14} color={theme.onMedia} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ImageViewer
        images={viewerImages}
        visible={viewerVisible}
        initialIndex={viewerIndex}
        onRequestClose={() => setViewerVisible(false)}
      />

      {currentIndex > 0 && (
        <TouchableOpacity
          style={[styles.navButton, styles.prevButton]}
          onPress={handlePrevious}>
          <Icon name="chevron-left" size={24} color={theme.onMedia} />
        </TouchableOpacity>
      )}

      {currentIndex < photos.length - 1 && (
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={handleNext}>
          <Icon name="chevron-right" size={24} color={theme.onMedia} />
        </TouchableOpacity>
      )}

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
                  <Icon name="check" size={16} color={theme.onMedia} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};
