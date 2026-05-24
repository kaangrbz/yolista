import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import ImageView from 'react-native-image-viewing';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requestPhotos } from '../permissions';
import * as FileSystem from 'react-native-fs';
import { showToast } from '../utils/alert';

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

  useEffect(() => {
    if (!visible) {
      return;
    }

    const entry = StatusBar.pushStackEntry({
      barStyle: 'light-content',
      animated: true,
    });

    return () => {
      StatusBar.popStackEntry(entry);
    };
  }, [visible]);

  const handleSave = async (imageUri: string) => {
    try {
      const hasPermission = await requestPhotos();
      if (!hasPermission) {
        showToast('error', 'Dosya erişim izni reddedildi');
        return;
      }

      const timestamp = new Date().getTime();
      const fileName = `yolista_${timestamp}.jpg`;
      const destinationPath = Platform.select({
        ios: `${FileSystem.DocumentDirectoryPath}/${fileName}`,
        android: `${FileSystem.PicturesDirectoryPath}/${fileName}`,
      });

      if (!destinationPath) {
        throw new Error('Could not determine save location');
      }

      await FileSystem.downloadFile({
        fromUrl: imageUri,
        toFile: destinationPath,
      });

      showToast('success', 'Fotoğraf başarıyla kaydedildi');
    } catch (error) {
      console.error('Save image error:', error);
      showToast('error', 'Fotoğraf kaydedilirken bir hata oluştu');
    }
  };

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
        onPress={() => handleSave(images[imageIndex].uri)}
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
