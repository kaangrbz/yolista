import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ModalSheetVariant = 'bottom' | 'full';

interface ModalSheetSafeAreaProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  /**
   * bottom: İçeriğe göre yükseklik, altta home indicator boşluğu (varsayılan).
   * full: Neredeyse tam ekran sheet (profil düzenleme vb.).
   */
  variant?: ModalSheetVariant;
}

/**
 * Bottom-sheet paneli: alt safe area uygular.
 * Üst inset (Dynamic Island) bottom sheet'e eklenmez; aksi halde panel gereksiz yukarı uzar.
 */
const ModalSheetSafeArea: React.FC<ModalSheetSafeAreaProps> = ({
  children,
  style,
  variant = 'bottom',
}) => {
  const insets = useSafeAreaInsets();
  const isBottomVariant = variant === 'bottom';

  return (
    <View
      style={[
        styles.base,
        isBottomVariant ? styles.bottom : styles.full,
        {
          paddingTop: isBottomVariant ? 0 : insets.top,
          paddingBottom: Math.max(insets.bottom, isBottomVariant ? 12 : 8),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'stretch',
  },
  bottom: {
    flexGrow: 0,
    flexShrink: 1,
  },
  full: {
    flexGrow: 1,
    flexShrink: 1,
  },
});

export default ModalSheetSafeArea;
