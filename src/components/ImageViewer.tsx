import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import ImageView from 'react-native-image-viewing';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { requestFilePermission } from '../utils/PermissionController';
import * as FileSystem from 'react-native-fs';
import { showToast } from '../utils/alert';

interface ImageViewerProps {
  images: { uri: string }[];
  visible: boolean;
  onRequestClose: () => void;
  initialIndex?: number;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  visible,
  onRequestClose,
  initialIndex = 0,
}) => {
  const handleSave = async (imageUri: string) => {
    try {
      const hasPermission = await requestFilePermission();
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
    <View style={styles.header}>
      <TouchableOpacity onPress={onRequestClose} style={styles.button}>
        <Icon name="close" size={24} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => handleSave(images[imageIndex].uri)} 
        style={styles.button}
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
      backgroundColor="rgba(0, 0, 0, 0.9)"
    />
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  button: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
});

export default ImageViewer; 