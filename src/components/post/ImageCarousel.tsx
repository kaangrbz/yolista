import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { ImageCarouselProps } from '../../types/post.types';

const { width: screenWidth } = Dimensions.get('window');

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  currentIndex,
  onIndexChange,
  height = 400,
}) => {
  const handleImageScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    onIndexChange(index);
  };

  if (images.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Resim yok</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleImageScroll}
        style={styles.scrollView}
      >
        {images.map((imageUri, index) => (
          <Image
            key={index}
            source={{ uri: imageUri }}
            style={[styles.image, { height }]}
            resizeMode="cover"
          />
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
});

export default ImageCarousel;
