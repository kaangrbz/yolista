import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StopForm } from '../../components/route/StopForm';
import { RouteEditorMap } from '../../components/route/RouteEditorMap';
import { StopPhotoStrip } from '../../components/route/StopPhotoStrip';
import { LocationProgressChip } from '../../components/route/LocationProgressChip';
import { RouteDistanceChip } from '../../components/route/RouteDistanceChip';
import { RoutePreviewModal } from '../../components/route/RoutePreviewModal';
import { StopReorderSheet } from '../../components/route/StopReorderSheet';
import { WizardStepIndicator } from '../../components/createFlow/WizardStepIndicator';
import KeyboardAwareContainer from '../../components/common/KeyboardAwareContainer';
import { useAppTheme } from '../../context/AppThemeContext';
import type { CreateRouteStackParamList } from '../../navigation/CreateRouteStack';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { useCreateRouteFlowStore } from '../../store/createRouteFlowStore';
import { useCreateFlowPreventRemove } from '../../hooks/useCreateFlowPreventRemove';
import { useCreateFlowAndroidBack } from '../../hooks/useCreateFlowAndroidBack';
import { useReverseGeocode } from '../../hooks/useReverseGeocode';
import GeocodingService from '../../services/GeocodingService';

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

type DetailsMode = 'locate' | 'details';
type StopDetailsNavigationProp = NativeStackNavigationProp<
  CreateRouteStackParamList,
  'StopDetails'
>;

export const StopDetailsScreen = () => {
  const navigation = useNavigation<StopDetailsNavigationProp>();
  const selectedPhotos = useCreateRouteFlowStore((state) => state.photos);
  const routeStops = useCreateRouteFlowStore((state) => state.routeStops);
  const setRouteStops = useCreateRouteFlowStore((state) => state.setRouteStops);
  const setStopLocation = useCreateRouteFlowStore((state) => state.setStopLocation);
  const clearStopLocation = useCreateRouteFlowStore((state) => state.clearStopLocation);
  const applyLocationToAllStops = useCreateRouteFlowStore(
    (state) => state.applyLocationToAllStops,
  );
  const reorderPhotos = useCreateRouteFlowStore((state) => state.reorderPhotos);
  const setWizardStep = useCreateRouteFlowStore((state) => state.setWizardStep);

  const [currentStopIndex, setCurrentStopIndex] = useState<number | null>(null);
  const [detailsMode, setDetailsMode] = useState<DetailsMode>('locate');
  const [isReorderVisible, setIsReorderVisible] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  useCreateFlowPreventRemove('stops');
  useCreateFlowAndroidBack('stops');

  useFocusEffect(
    useCallback(() => {
      setWizardStep('stops');
    }, [setWizardStep]),
  );

  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.background,
    },
    loadingText: {
      marginTop: 24,
      textAlign: 'center',
      color: t.textSecondary,
      fontSize: 16,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    titleBlock: {
      flex: 1,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surfaceMuted,
      borderWidth: 1,
      borderColor: t.border,
    },
    iconButtonDisabled: {
      opacity: 0.45,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: t.textPrimary,
    },
    subtitle: {
      fontSize: 14,
      color: t.textSecondary,
      lineHeight: 20,
      marginTop: 4,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    modeToggle: {
      flexDirection: 'row',
      marginHorizontal: 20,
      marginTop: 12,
      marginBottom: 4,
      padding: 4,
      borderRadius: 12,
      backgroundColor: t.surfaceMuted,
      borderWidth: 1,
      borderColor: t.border,
    },
    modeButton: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
    },
    modeButtonActive: {
      backgroundColor: t.background,
    },
    modeButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: t.textSecondary,
    },
    modeButtonTextActive: {
      color: t.textPrimary,
    },
    keyboardContainer: {
      flex: 1,
    },
    locateBody: {
      flex: 1,
    },
    bottomDock: {
      borderTopWidth: 1,
      borderTopColor: t.border,
      backgroundColor: t.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 24,
    },
    mapContainer: {
      marginHorizontal: 20,
      marginTop: 12,
    },
    mapContainerExpanded: {
      flex: 1,
      marginTop: 0,
    },
    formContainer: {
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    footer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: t.border,
      backgroundColor: t.background,
    },
    continueButton: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: t.buttonPrimaryBg,
    },
    continueButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: t.buttonPrimaryText,
    },
  }));

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

  const currentStop =
    currentStopIndex === null ? undefined : routeStops[currentStopIndex];

  const locatedCount = useMemo(
    () => routeStops.filter((stop) => stop.coordinate).length,
    [routeStops],
  );

  const detailsStop = currentStop ?? routeStops[0];

  const { shortAddress, loading: reverseLoading } = useReverseGeocode({
    latitude: detailsStop?.coordinate?.latitude,
    longitude: detailsStop?.coordinate?.longitude,
    enabled:
      detailsMode === 'details' &&
      !!detailsStop?.coordinate &&
      !detailsStop.address,
  });

  const handleStopUpdate = useCallback(
    (stopId: string, field: keyof RouteStop, value: unknown) => {
      setRouteStops(
        routeStops.map((stop) =>
          stop.id === stopId ? { ...stop, [field]: value } : stop,
        ),
      );
    },
    [routeStops, setRouteStops],
  );

  const assignLocation = useCallback(
    async (
      stopId: string,
      coordinate: { latitude: number; longitude: number },
    ) => {
      setStopLocation(stopId, coordinate);

      const reverse = await GeocodingService.reverseGeocode(
        coordinate.latitude,
        coordinate.longitude,
      );

      if (reverse?.shortName) {
        setRouteStops(
          useCreateRouteFlowStore.getState().routeStops.map((stop) =>
            stop.id === stopId
              ? { ...stop, address: reverse.shortName }
              : stop,
          ),
        );
      }
    },
    [setRouteStops, setStopLocation],
  );

  const handleLocationAssign = useCallback(
    (coordinate: { latitude: number; longitude: number }) => {
      if (!currentStop) {
        return;
      }

      void assignLocation(currentStop.id, coordinate);
    },
    [assignLocation, currentStop],
  );

  const handleSelectStop = useCallback((
    index: number,
    options?: { allowDeselect?: boolean },
  ) => {
    if (index < 0 || index >= routeStops.length) {
      return;
    }

    setCurrentStopIndex((prev) => {
      const allowDeselect = options?.allowDeselect !== false;

      if (allowDeselect && detailsMode === 'locate' && prev === index) {
        return null;
      }

      return index;
    });
  }, [detailsMode, routeStops.length]);

  const handleReorderPhotos = useCallback((fromIndex: number, toIndex: number) => {
    reorderPhotos(fromIndex, toIndex);

    setCurrentStopIndex((prev) => {
      if (prev === null) {
        return null;
      }

      if (prev === fromIndex) {
        return toIndex;
      }

      if (fromIndex < prev && toIndex >= prev) {
        return prev - 1;
      }

      if (fromIndex > prev && toIndex <= prev) {
        return prev + 1;
      }

      return prev;
    });
  }, [reorderPhotos]);

  const openLocationPicker = useCallback((stopId: string) => {
    navigation.navigate('LocationPicker', { stopId });
  }, [navigation]);

  const handleApplyRegionToAll = useCallback(() => {
    const sourceStop =
      (currentStop?.coordinate ? currentStop : null) ??
      routeStops.find(
        (stop) =>
          typeof stop.coordinate?.latitude === 'number' &&
          typeof stop.coordinate?.longitude === 'number',
      );

    if (!sourceStop?.coordinate) {
      Alert.alert(
        'Konum yok',
        'Önce en az bir durağa konum at veya seçili durağı konumlandır.',
      );
      return;
    }

    const locationLabel = sourceStop.address?.trim() || 'Seçili konum';

    Alert.alert(
      'Hepsine aynı bölgeyi ata',
      `${routeStops.length} durağa "${locationLabel}" uygulanacak. Devam edilsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Uygula',
          onPress: () => {
            const applied = applyLocationToAllStops(sourceStop.id);

            if (!applied) {
              Alert.alert('Hata', 'Konum uygulanamadı.');
            }
          },
        },
      ],
    );
  }, [applyLocationToAllStops, currentStop, routeStops]);

  const handleContinue = () => {
    if (selectedPhotos.length === 0) {
      Alert.alert('Hata', 'En az bir fotoğraf gereklidir.');
      return;
    }

    setWizardStep('category');
    navigation.navigate('CategorySelection');
  };

  if (selectedPhotos.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Yükleniyor…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Detaylar</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                locatedCount === 0 && styles.iconButtonDisabled,
              ]}
              onPress={() => setIsPreviewVisible(true)}
              disabled={locatedCount === 0}
              accessibilityLabel="Rotayı önizle"
            >
              <Icon name="map-outline" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleApplyRegionToAll}
              accessibilityLabel="Hepsine aynı bölgeyi ata"
            >
              <Icon name="map-marker-multiple" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setIsReorderVisible(true)}
              accessibilityLabel="Sıralamayı düzenle"
            >
              <Icon name="sort" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Her fotoğrafa isteğe bağlı konum ve metin ekle. Rota çizgisi sonra belirlenir.
        </Text>
        <WizardStepIndicator currentStep="stops" />
        <View style={styles.chipRow}>
          <LocationProgressChip
            locatedCount={locatedCount}
            totalCount={routeStops.length}
          />
          <RouteDistanceChip
            points={routeStops.map((stop) => stop.coordinate ?? {})}
          />
        </View>
      </View>

      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            detailsMode === 'locate' && styles.modeButtonActive,
          ]}
          onPress={() => setDetailsMode('locate')}
        >
          <Text
            style={[
              styles.modeButtonText,
              detailsMode === 'locate' && styles.modeButtonTextActive,
            ]}
          >
            Konumlandır
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            detailsMode === 'details' && styles.modeButtonActive,
          ]}
          onPress={() => setDetailsMode('details')}
        >
          <Text
            style={[
              styles.modeButtonText,
              detailsMode === 'details' && styles.modeButtonTextActive,
            ]}
          >
            Detaylar
          </Text>
        </TouchableOpacity>
      </View>

      {detailsMode === 'locate' ? (
        <>
          <View style={styles.locateBody}>
            <View style={styles.mapContainerExpanded}>
              <RouteEditorMap
                stops={routeStops}
                activeStopIndex={currentStopIndex}
                layout="expanded"
                onActiveStopChange={handleSelectStop}
                onLocationAssign={handleLocationAssign}
              />
            </View>

            <View style={styles.bottomDock}>
              <StopPhotoStrip
                photos={selectedPhotos}
                stops={routeStops}
                activeIndex={currentStopIndex}
                onSelect={handleSelectStop}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Devam</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <KeyboardAwareContainer
          style={styles.keyboardContainer}
          keyboardVerticalOffset={88}
          scrollViewProps={{
            contentContainerStyle: styles.scrollContent,
          }}
        >
          <View style={styles.mapContainer}>
            <RouteEditorMap
              stops={routeStops}
              activeStopIndex={currentStopIndex}
              readOnly
              layout="compact"
              onActiveStopChange={handleSelectStop}
              onLocationAssign={handleLocationAssign}
            />
          </View>

          <StopPhotoStrip
            photos={selectedPhotos}
            stops={routeStops}
            activeIndex={currentStopIndex}
            onSelect={handleSelectStop}
          />

          <View style={styles.formContainer}>
            <StopForm
              stop={detailsStop}
              locationSummary={shortAddress}
              locationLoading={reverseLoading}
              onRequestLocation={() => openLocationPicker(detailsStop.id)}
              onClearLocation={() => clearStopLocation(detailsStop.id)}
              onUpdate={(field, value) => handleStopUpdate(detailsStop.id, field, value)}
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Devam</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareContainer>
      )}

      <StopReorderSheet
        visible={isReorderVisible}
        photos={selectedPhotos}
        stopTitles={routeStops.map((stop) => stop.title)}
        onClose={() => setIsReorderVisible(false)}
        onReorder={handleReorderPhotos}
      />

      <RoutePreviewModal
        visible={isPreviewVisible}
        stops={routeStops}
        onClose={() => setIsPreviewVisible(false)}
      />
    </SafeAreaView>
  );
};
