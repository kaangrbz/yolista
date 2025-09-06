import { useState, useEffect } from 'react';

export const useImages = (postId: string) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Mock images for demonstration (10 adede kadar)
  const mockImages = [
    'https://picsum.photos/400/600?random=' + Math.round(Math.random() * 1000),
    'https://picsum.photos/400/600?random=' + Math.round(Math.random() * 1000),
    'https://picsum.photos/400/600?random=' + Math.round(Math.random() * 1000),
    'https://picsum.photos/400/600?random=' + Math.round(Math.random() * 1000),
    'https://picsum.photos/400/600?random=' + Math.round(Math.random() * 1000),
  ];

  useEffect(() => {
    // Simulate loading images
    setLoading(true);
    setTimeout(() => {
      setImages(mockImages);
      setLoading(false);
    }, 500);
  }, [postId]);

  const handleImageScroll = (event: any, screenWidth: number) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    setCurrentIndex(index);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  return {
    images,
    loading,
    currentIndex,
    handleImageScroll,
    goToImage,
  };
};
