import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import ImageView from 'react-native-image-viewing';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveImageToGallery } from '../utils/saveImageToGallery';
import {
  applyMediaPreviewSystemBars,
  applySystemNavigationBar,
} from '../utils/systemNavigationBar';
import { useAppTheme } from '../context/AppThemeContext';

interface ImageViewerProps {
  images: { uri: string }[];
  visible: boolean;
  onRequestClose: () => void;
  initialIndex?: number;
}

const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 };

const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  visible,
  onRequestClose,
  initialIndex = 0,
}) => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();

  useEffect(() => {
    if (!visible) {
      return;
    }

    applyMediaPreviewSystemBars(theme.mediaBackdrop);

    const entry = StatusBar.pushStackEntry({
      barStyle: 'light-content',
      backgroundColor: theme.mediaBackdrop,
      animated: true,
    });

    return () => {
      StatusBar.popStackEntry(entry);
      applySystemNavigationBar(theme);
    };
  }, [visible, theme]);

  const renderHeader = ({ imageIndex }: { imageIndex: number }) => (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + 8,
          paddingLeft: 12 + insets.left,
          paddingRight: 12 + insets.right,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onRequestClose}
        style={styles.button}
        hitSlop={hitSlop}
        accessibilityRole="button"
        accessibilityLabel="Kapat"
      >
        <Icon name="close" size={24} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => void saveImageToGallery(images[imageIndex].uri)}
        style={styles.button}
        hitSlop={hitSlop}
        accessibilityRole="button"
        accessibilityLabel="Fotoğrafı kaydet"
      >
        <Icon name="download" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ImageView
      images={images}
      imageIndex={initialIndex}
      visible={visible}
      onRequestClose={onRequestClose}
      swipeToCloseEnabled={true}
      doubleTapToZoomEnabled={true}
      HeaderComponent={renderHeader}
      backgroundColor="rgba(0, 0, 0, 0.94)"
    />
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  button: {
    minWidth: 44,
    minHeight: 44,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 22,
  },
});

export default ImageViewer;
