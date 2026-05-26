import React from 'react';
import {
  Dimensions,
  ScrollView,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedScrollSurface } from '../../theme/useThemedScrollSurface';

const DEFAULT_TAB_BAR_RESERVE = 56;

export type ThemedScrollViewProps = ScrollViewProps & {
  /** Üstteki sabit header yüksekliği (px). */
  reservedTop?: number;
  /** Tab bar + alt chrome için düşülecek yükseklik (px). */
  reservedBottom?: number;
  fillStyle?: StyleProp<ViewStyle>;
};

/**
 * ScrollView + dış/ iç sarmalayıcı ile tema arka planını viewport boyunca zorlar.
 * iOS bounce ve tab sceneContainer beyazlığını kapatır.
 */
const ThemedScrollView: React.FC<ThemedScrollViewProps> = ({
  children,
  style,
  contentContainerStyle,
  fillStyle,
  reservedTop = 0,
  reservedBottom = DEFAULT_TAB_BAR_RESERVE,
  ...rest
}) => {
  const theme = useAppTheme();
  const surface = useThemedScrollSurface();
  const insets = useSafeAreaInsets();
  const windowHeight = Dimensions.get('window').height;
  const minContentHeight = Math.max(
    windowHeight - insets.top - insets.bottom - reservedTop - reservedBottom,
    320,
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        {...rest}
        style={[surface.style, style]}
        contentContainerStyle={[
          surface.contentContainerStyle,
          { minHeight: minContentHeight },
          contentContainerStyle,
        ]}
      >
        <View
          style={[
            {
              backgroundColor: theme.background,
              minHeight: minContentHeight,
            },
            fillStyle,
          ]}
        >
          {children}
        </View>
      </ScrollView>
    </View>
  );
};

export default ThemedScrollView;
