import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

const AUTO_HIDE_MS = 2000;

interface PhotoHintOverlayProps {
  hint: string;
  /** Slide değişiminde timer'ı yeniden başlatmak için */
  slideKey: string | number;
}

export const PhotoHintOverlay: React.FC<PhotoHintOverlayProps> = ({
  hint,
  slideKey,
}) => {
  const theme = useAppTheme();
  const trimmedHint = hint.trim();
  const [expanded, setExpanded] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const styles = useThemedStyles((t) => ({
    container: {
      position: 'absolute',
      left: 12,
      bottom: 12,
      flexDirection: 'row',
      alignItems: 'flex-end',
      maxWidth: '85%',
      zIndex: 10,
    },
    pressable: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      maxWidth: '100%',
    },
    iconBadge: {
      width: 24,
      height: 24,
      borderRadius: 16,
      backgroundColor: t.overlayDark,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bubble: {
      marginLeft: 4,
      backgroundColor: t.overlayDark,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      maxWidth: 260,
    },
    hintText: {
      color: t.onMedia,
      fontSize: 11,
    },
  }));

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const animateExpanded = useCallback(
    (nextExpanded: boolean) => {
      Animated.timing(expandAnim, {
        toValue: nextExpanded ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    },
    [expandAnim],
  );

  const setExpandedState = useCallback(
    (nextExpanded: boolean) => {
      setExpanded(nextExpanded);
      animateExpanded(nextExpanded);
    },
    [animateExpanded],
  );

  const scheduleAutoCollapse = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setExpandedState(false);
    }, AUTO_HIDE_MS);
  }, [clearHideTimer, setExpandedState]);

  useEffect(() => {
    if (!trimmedHint) {
      return;
    }

    setExpandedState(true);
    scheduleAutoCollapse();

    return () => {
      clearHideTimer();
    };
  }, [slideKey, trimmedHint, clearHideTimer, scheduleAutoCollapse, setExpandedState]);

  const handleToggle = useCallback(() => {
    clearHideTimer();

    if (expanded) {
      setExpandedState(false);
      return;
    }

    setExpandedState(true);
    scheduleAutoCollapse();
  }, [clearHideTimer, expanded, scheduleAutoCollapse, setExpandedState]);

  if (!trimmedHint) {
    return null;
  }

  const bubbleOpacity = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const bubbleMaxWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 260],
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable
        onPress={handleToggle}
        style={styles.pressable}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Fotoğraf ipucunu gizle' : 'Fotoğraf ipucunu göster'}
      >
        <View style={styles.iconBadge}>
          <Icon
            name="information-outline"
            size={16}
            color={theme.onMedia}
          />
        </View>

        <Animated.View
          style={[
            styles.bubble,
            {
              opacity: bubbleOpacity,
              maxWidth: bubbleMaxWidth,
              overflow: 'hidden',
            },
          ]}
          pointerEvents={expanded ? 'auto' : 'none'}
        >
          <Text style={styles.hintText} numberOfLines={1}>
            {trimmedHint}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
};

export default PhotoHintOverlay;
