import React, { useState, useEffect, useRef, memo } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: number;
  threshold?: number;
  once?: boolean;
  style?: any;
}

const LazyComponent: React.FC<LazyComponentProps> = memo(({
  children,
  fallback = null,
  rootMargin = screenHeight * 0.5, // Load when 50% of screen height away
  threshold = 0.1,
  once = true,
  style,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const viewRef = useRef<View>(null);

  useEffect(() => {
    if (once && hasBeenVisible) {return;}

    const checkVisibility = () => {
      if (!viewRef.current) {return;}

      viewRef.current.measure((x, y, width, height, pageX, pageY) => {
        const viewportHeight = screenHeight;
        const isInViewport = pageY < viewportHeight + rootMargin &&
                            pageY + height > -rootMargin;

        if (isInViewport && !isVisible) {
          setIsVisible(true);
          if (once) {
            setHasBeenVisible(true);
          }
        } else if (!isInViewport && isVisible && !once) {
          setIsVisible(false);
        }
      });
    };

    // Initial check
    const timer = setTimeout(checkVisibility, 100);

    return () => clearTimeout(timer);
  }, [isVisible, hasBeenVisible, once, rootMargin]);

  const shouldRender = once ? hasBeenVisible || isVisible : isVisible;

  return (
    <View ref={viewRef} style={style}>
      {shouldRender ? children : fallback}
    </View>
  );
});

LazyComponent.displayName = 'LazyComponent';

export default LazyComponent;
