import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ProgressIndicator } from '../../components/common/ProgressIndicator';
import { ImageCarousel } from '../../components/route/ImageCarousel';
import { StopForm } from '../../components/route/StopForm';
// import { RouteMap } from '../../components/route/RouteMap';
import { Photo } from './PhotoSelectionScreen';
import { showToast } from '../../utils/alert';
import KeyboardAwareContainer from '../../components/common/KeyboardAwareContainer';

export interface RouteStop {
  id: string;
  photoId: string;
  title: string;
  description: string;
  coordinate?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
}

const { height: screenHeight } = Dimensions.get('window');

export const StopDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedPhotos } = route.params as { selectedPhotos: Photo[] };

  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);

  // Initialize route stops from photos
  useEffect(() => {
    const initialStops: RouteStop[] = selectedPhotos.map((photo, index) => ({
      id: `stop_${photo.id}`,
      photoId: photo.id,
      title: '',
      description: '',
    }));
    setRouteStops(initialStops);
  }, [selectedPhotos]);

  const currentStop = routeStops[currentStopIndex];
  const currentPhoto = selectedPhotos.find(photo => photo.id === currentStop?.photoId);

  const handleStopUpdate = (stopId: string, field: keyof RouteStop, value: any) => {
    setRouteStops(prev =>
      prev.map(stop =>
        stop.id === stopId ? { ...stop, [field]: value } : stop,
      ),
    );
  };

  const handleLocationSelect = (coordinate: { latitude: number; longitude: number }, address?: string) => {
    if (currentStop) {
      handleStopUpdate(currentStop.id, 'coordinate', coordinate);
      handleStopUpdate(currentStop.id, 'address', address);
      showToast('success', 'Konum seçildi');
    }
  };

  const handleSwipeToStop = (index: number) => {
    if (index >= 0 && index < routeStops.length) {
      setCurrentStopIndex(index);
    }
  };

  const handleContinue = () => {
    // Validate that at least one stop has required info (photo is already guaranteed)
    const hasValidStop = routeStops.some(stop =>
      selectedPhotos.some(photo => photo.id === stop.photoId)
    );

    if (!hasValidStop) {
      Alert.alert('Hata', 'En az bir durak için fotoğraf gereklidir.');
      return;
    }

    // Navigate to next step
    (navigation as any).navigate('CategorySelection', {
      selectedPhotos,
      routeStops: routeStops.filter(stop =>
        selectedPhotos.some(photo => photo.id === stop.photoId)
      ),
    });
  };

  const handleSkip = () => {
    // Create minimal stops with just photos
    const minimalStops = selectedPhotos.map((photo, index) => ({
      id: `stop_${photo.id}`,
      photoId: photo.id,
      title: `Durak ${index + 1}`,
      description: '',
    }));

    (navigation as any).navigate('CategorySelection', {
      selectedPhotos,
      routeStops: minimalStops,
    });
  };

  if (!currentStop || !currentPhoto) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={2} totalSteps={4} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Durak Bilgileri</Text>
        <Text style={styles.subtitle}>
          Durak {currentStopIndex + 1} / {routeStops.length}
        </Text>
      </View>

      {/* KeyboardAware Main Content */}
      <KeyboardAwareContainer
        style={styles.keyboardContainer}
        keyboardVerticalOffset={120} // Header + progress yüksekliği için
        scrollViewProps={{
          contentContainerStyle: styles.scrollContent,
        }}
      >
        {/* Image Carousel */}
        <View style={styles.carouselContainer}>
          <ImageCarousel
            photos={selectedPhotos}
            currentIndex={currentStopIndex}
            onSwipe={handleSwipeToStop}
          />
        </View>

        {/* Stop Form */}
        <View style={styles.formContainer}>
          <StopForm
            stop={currentStop}
            onUpdate={(field, value) => handleStopUpdate(currentStop.id, field, value)}
          />
        </View>

        {/* Map - Collapsed when keyboard is active */}
        <View style={styles.mapContainer}>
          {/* <RouteMap
            stops={routeStops}
            currentStopIndex={currentStopIndex}
            onLocationSelect={handleLocationSelect}
          /> */}
        </View>

        {/* Footer - Inside KeyboardAware */}
        <View style={styles.footer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.skipButton]}
              onPress={handleSkip}>
              <Text style={[styles.buttonText, styles.skipButtonText]}>
                Atla
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.continueButton]}
              onPress={handleContinue}>
              <Text style={styles.buttonText}>
                Devam Et
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareContainer>
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
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  carouselContainer: {
    height: screenHeight * 0.35, // Biraz küçült
    backgroundColor: '#000',
    marginHorizontal: 20,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  formContainer: {
    minHeight: 200, // Fixed height yerine minimum height
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    flex: 1, // Form'un genişleyebilmesini sağla
  },
  mapContainer: {
    height: 120, // Küçült, keyboard açıkken gizlenebilir
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skipButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  continueButton: {
    backgroundColor: '#121212',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  skipButtonText: {
    color: '#666',
  },
});
