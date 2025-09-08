import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PhotoGrid } from '../../components/route/PhotoGrid';
import { ProgressIndicator } from '../../components/common/ProgressIndicator';

export interface Photo {
  id: string;
  uri: string;
  fileName?: string;
  type?: string;
  fileSize?: number;
}

export const PhotoSelectionScreen = () => {
  const navigation = useNavigation();
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([]);

  const handlePhotoSelect = (photos: Photo[]) => {
    if (photos.length > 10) {
      Alert.alert('Uyarı', 'En fazla 10 fotoğraf seçebilirsiniz.');
      return;
    }
    setSelectedPhotos(photos);
  };

  const handlePhotoReorder = (fromIndex: number, toIndex: number) => {
    const newPhotos = [...selectedPhotos];
    const [movedPhoto] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, movedPhoto);
    setSelectedPhotos(newPhotos);
  };

  const handleRemovePhoto = (photoId: string) => {
    setSelectedPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const handleContinue = () => {
    if (selectedPhotos.length === 0) {
      Alert.alert('Uyarı', 'En az 1 fotoğraf seçmelisiniz.');
      return;
    }

    // Navigate to next step with selected photos
    navigation.navigate('StopDetails', { selectedPhotos });
  };

  const canContinue = selectedPhotos.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={1} totalSteps={4} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Fotoğrafları Seç</Text>
        <Text style={styles.subtitle}>
          Rotanız için en fazla 10 fotoğraf seçebilirsiniz
        </Text>
      </View>

      {/* Photo Grid */}
      <View style={styles.content}>
        <PhotoGrid
          selectedPhotos={selectedPhotos}
          onPhotoSelect={handlePhotoSelect}
          onPhotoReorder={handlePhotoReorder}
          onRemovePhoto={handleRemovePhoto}
          maxPhotos={10}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.photoCount}>
          <Text style={styles.countText}>
            {selectedPhotos.length}/10 fotoğraf seçildi
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !canContinue && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!canContinue}>
          <Text
            style={[
              styles.continueButtonText,
              !canContinue && styles.continueButtonTextDisabled,
            ]}>
            Devam Et
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  photoCount: {
    marginBottom: 12,
  },
  countText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#121212',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonDisabled: {
    backgroundColor: '#e0e0e0',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButtonTextDisabled: {
    color: '#999',
  },
});
