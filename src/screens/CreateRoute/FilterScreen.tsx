import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FilterPreview } from '../../components/route/FilterPreview';
import { Photo } from './PhotoSelectionScreen';
import { RouteStop } from './StopDetailsScreen';
import { Category, City } from './CategorySelectionScreen';
import { publishRouteFromCreateFlow } from '../../utils/createFlowPublish';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

const DEMO_FILTERS = [
  { id: 'none', name: 'Orijinal', icon: 'image' },
  { id: 'vintage', name: 'Vintage', icon: 'image-filter-vintage' },
  { id: 'bw', name: 'Siyah Beyaz', icon: 'image-filter-black-white' },
  { id: 'sepia', name: 'Sepia', icon: 'image-filter' },
  { id: 'bright', name: 'Parlak', icon: 'brightness-6' },
  { id: 'contrast', name: 'Kontrast', icon: 'contrast-box' },
];

export const FilterScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useAppTheme();
  const {
    selectedPhotos,
    routeStops,
    selectedCategory,
    selectedCity,
  } = route.params as {
    selectedPhotos: Photo[];
    routeStops: RouteStop[];
    selectedCategory: Category | null;
    selectedCity: City | null;
  };

  const [selectedFilter, setSelectedFilter] = useState('none');
  const [isEnqueueing, setIsEnqueueing] = useState(false);

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: t.textPrimary,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: t.textSecondary,
      marginBottom: 12,
    },
    devNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.surfaceMuted,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.borderStrong,
    },
    devNoticeText: {
      fontSize: 12,
      color: t.textSecondary,
      marginLeft: 8,
      fontWeight: '500',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    filtersSection: {
      marginTop: 24,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: t.textPrimary,
      marginBottom: 16,
    },
    filtersScrollView: {
      marginHorizontal: -20,
    },
    filtersContainer: {
      paddingHorizontal: 20,
      gap: 12,
    },
    filterOption: {
      alignItems: 'center',
      position: 'relative',
    },
    filterIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: t.surfaceMuted,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    filterIconContainerSelected: {
      backgroundColor: t.buttonPrimaryBg,
      borderColor: t.buttonPrimaryBg,
    },
    filterOptionDisabled: {
      opacity: 0.5,
    },
    filterText: {
      fontSize: 12,
      color: t.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
    },
    filterTextSelected: {
      color: t.accentPositive,
      fontWeight: '600',
    },
    filterTextDisabled: {
      color: t.textMuted,
    },
    comingSoonBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: t.textMuted,
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    comingSoonText: {
      fontSize: 8,
      color: t.onMedia,
      fontWeight: '600',
    },
    summarySection: {
      backgroundColor: t.surfaceMuted,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: t.border,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: t.textPrimary,
      marginBottom: 16,
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    summaryItem: {
      width: '45%',
      alignItems: 'center',
      backgroundColor: t.background,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: t.border,
    },
    summaryLabel: {
      fontSize: 12,
      color: t.textSecondary,
      marginTop: 4,
    },
    summaryValue: {
      fontSize: 14,
      color: t.textPrimary,
      fontWeight: '600',
      marginTop: 2,
    },
    footer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: t.border,
      backgroundColor: t.background,
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
      flexDirection: 'row',
      justifyContent: 'center',
    },
    skipButton: {
      backgroundColor: t.buttonSecondaryBg,
      borderWidth: 1,
      borderColor: t.buttonSecondaryBorder,
    },
    publishButton: {
      backgroundColor: t.buttonPrimaryBg,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: t.buttonPrimaryText,
    },
    skipButtonText: {
      color: t.buttonSecondaryText,
    },
  }));

  const handleFilterSelect = (filterId: string) => {
    setSelectedFilter(filterId);
  };

  const handlePublish = async () => {
    setIsEnqueueing(true);

    try {
      await publishRouteFromCreateFlow(navigation as { navigate: (n: string, p?: object) => void }, {
        selectedPhotos,
        routeStops,
        selectedCategory,
        selectedCity,
      });
    } finally {
      setIsEnqueueing(false);
    }
  };

  const handleSkip = () => {
    handlePublish();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filtreler</Text>
        <Text style={styles.subtitle}>
          Fotoğraflarınıza filtre uygulayın
        </Text>

        <View style={styles.devNotice}>
          <Icon name="wrench" size={16} color={theme.textSecondary} />
          <Text style={styles.devNoticeText}>
            Bu özellik geliştirme aşamasındadır
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <FilterPreview
          photos={selectedPhotos}
          selectedFilter={selectedFilter}
        />

        <View style={styles.filtersSection}>
          <Text style={styles.sectionTitle}>Filtre Seçenekleri</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScrollView}
            contentContainerStyle={styles.filtersContainer}>
            {DEMO_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={styles.filterOption}
                onPress={() => handleFilterSelect(filter.id)}
                disabled={filter.id !== 'none'}>
                <View style={[
                  styles.filterIconContainer,
                  selectedFilter === filter.id && styles.filterIconContainerSelected,
                  filter.id !== 'none' && styles.filterOptionDisabled,
                ]}>
                  <Icon
                    name={filter.icon}
                    size={24}
                    color={
                      filter.id !== 'none'
                        ? theme.textMuted
                        : selectedFilter === filter.id
                        ? theme.buttonPrimaryText
                        : theme.textSecondary
                    }
                  />
                </View>
                <Text style={[
                  styles.filterText,
                  selectedFilter === filter.id && styles.filterTextSelected,
                  filter.id !== 'none' && styles.filterTextDisabled,
                ]}>
                  {filter.name}
                </Text>
                {filter.id !== 'none' && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Yakında</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Rota Özeti</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Icon name="image" size={20} color={theme.accentPositive} />
              <Text style={styles.summaryLabel}>Fotoğraf</Text>
              <Text style={styles.summaryValue}>{selectedPhotos.length}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Icon name="map-marker" size={20} color={theme.accentPositive} />
              <Text style={styles.summaryLabel}>Durak</Text>
              <Text style={styles.summaryValue}>{routeStops.length}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Icon name="tag" size={20} color={theme.accentPositive} />
              <Text style={styles.summaryLabel}>Kategori</Text>
              <Text style={styles.summaryValue}>
                {selectedCategory ? selectedCategory.name : 'Yok'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Icon name="city" size={20} color={theme.accentPositive} />
              <Text style={styles.summaryLabel}>Şehir</Text>
              <Text style={styles.summaryValue}>
                {selectedCity ? selectedCity.name : 'Yok'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.skipButton]}
            onPress={handleSkip}
            disabled={isEnqueueing}>
            <Text style={[styles.buttonText, styles.skipButtonText]}>
              Atla
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.publishButton]}
            onPress={handlePublish}
            disabled={isEnqueueing}>
            {isEnqueueing ? (
              <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
            ) : (
              <>
                <Icon name="send" size={18} color={theme.buttonPrimaryText} />
                <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                  Yayınla
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};
