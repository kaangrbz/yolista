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
import { useNavigation } from '@react-navigation/native';
import { ImageCarousel } from '../../components/route/ImageCarousel';
import { StopForm } from '../../components/route/StopForm';
import KeyboardAwareContainer from '../../components/common/KeyboardAwareContainer';
import { appTheme } from '../../theme/appTheme';
import { useCreateRouteFlowStore } from '../../store/createRouteFlowStore';
import { useCreateFlowPreventRemove } from '../../hooks/useCreateFlowPreventRemove';
import { useCreateFlowAndroidBack } from '../../hooks/useCreateFlowAndroidBack';

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
  const selectedPhotos = useCreateRouteFlowStore((state) => state.photos);
  const routeStops = useCreateRouteFlowStore((state) => state.routeStops);
  const setRouteStops = useCreateRouteFlowStore((state) => state.setRouteStops);
  const setWizardStep = useCreateRouteFlowStore((state) => state.setWizardStep);

  const [currentStopIndex, setCurrentStopIndex] = useState(0);

  useCreateFlowPreventRemove('stops');
  useCreateFlowAndroidBack('stops');

  useEffect(() => {
    if (selectedPhotos.length === 0) {
      return;
    }

    const currentStops = useCreateRouteFlowStore.getState().routeStops;
    const existingByPhotoId = new Map(currentStops.map((stop) => [stop.photoId, stop]));

    const synced: RouteStop[] = selectedPhotos.map((photo) => {
      const existing = existingByPhotoId.get(photo.id);

      if (existing) {
        return existing;
      }

      return {
        id: `stop_${photo.id}`,
        photoId: photo.id,
        title: '',
        description: '',
      };
    });

    const needsSync =
      synced.length !== currentStops.length ||
      synced.some((stop, index) => stop.photoId !== currentStops[index]?.photoId);

    if (needsSync) {
      setRouteStops(synced);
    }
  }, [selectedPhotos, setRouteStops]);

  const currentStop = routeStops[currentStopIndex];
  const currentPhoto = selectedPhotos.find((photo) => photo.id === currentStop?.photoId);

  const handleStopUpdate = (stopId: string, field: keyof RouteStop, value: unknown) => {
    setRouteStops(
      routeStops.map((stop) =>
        stop.id === stopId ? { ...stop, [field]: value } : stop,
      ),
    );
  };

  const handleSwipeToStop = (index: number) => {
    if (index >= 0 && index < routeStops.length) {
      setCurrentStopIndex(index);
    }
  };

  const handleContinue = () => {
    if (selectedPhotos.length === 0) {
      Alert.alert('Hata', 'En az bir fotoğraf gereklidir.');
      return;
    }

    setWizardStep('category');

    (navigation as { navigate: (name: string) => void }).navigate('CategorySelection');
  };

  const handleSkip = () => {
    const minimalStops = selectedPhotos.map((photo, index) => ({
      id: `stop_${photo.id}`,
      photoId: photo.id,
      title: `Nokta ${index + 1}`,
      description: '',
    }));

    setRouteStops(minimalStops);
    setWizardStep('category');

    (navigation as { navigate: (name: string) => void }).navigate('CategorySelection');
  };

  if (!currentStop || !currentPhoto || selectedPhotos.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Yükleniyor…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Detaylar</Text>
        <Text style={styles.subtitle}>
          Her fotoğraf için isteğe bağlı başlık ve not ekleyebilirsin.
        </Text>
      </View>

      <KeyboardAwareContainer
        style={styles.keyboardContainer}
        keyboardVerticalOffset={88}
        scrollViewProps={{
          contentContainerStyle: styles.scrollContent,
        }}
      >
        <View style={styles.carouselContainer}>
          <ImageCarousel
            photos={selectedPhotos}
            currentIndex={currentStopIndex}
            onSwipe={handleSwipeToStop}
          />
        </View>

        <View style={styles.formContainer}>
          <StopForm
            stop={currentStop}
            onUpdate={(field, value) => handleStopUpdate(currentStop.id, field, value)}
          />
        </View>

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
              <Text style={[styles.buttonText, styles.continueButtonText]}>
                Devam
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
    backgroundColor: appTheme.background,
  },
  loadingText: {
    marginTop: 24,
    textAlign: 'center',
    color: appTheme.textSecondary,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: appTheme.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: appTheme.textSecondary,
    lineHeight: 22,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  carouselContainer: {
    height: screenHeight * 0.36,
    backgroundColor: '#000000',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  formContainer: {
    minHeight: 200,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: appTheme.border,
    backgroundColor: appTheme.background,
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
  },
  skipButton: {
    backgroundColor: appTheme.surfaceMuted,
    borderWidth: 1,
    borderColor: appTheme.borderStrong,
  },
  continueButton: {
    backgroundColor: appTheme.accent,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  continueButtonText: {
    color: appTheme.background,
  },
  skipButtonText: {
    color: appTheme.textSecondary,
  },
});
