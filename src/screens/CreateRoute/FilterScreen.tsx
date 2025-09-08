import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ProgressIndicator } from '../../components/common/ProgressIndicator';
import { FilterPreview } from '../../components/route/FilterPreview';
import { Photo } from './PhotoSelectionScreen';
import { RouteStop } from './StopDetailsScreen';
import { Category, City } from './CategorySelectionScreen';

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
  const [isPublishing, setIsPublishing] = useState(false);

  const handleFilterSelect = (filterId: string) => {
    setSelectedFilter(filterId);
  };

  const handlePublish = async () => {
    setIsPublishing(true);

    try {
      // Simulate publishing process
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        'Rota Yayınlandı! 🎉',
        'Rotanız başarıyla oluşturuldu ve yayınlandı.',
        [
          {
            text: 'Tamam',
            onPress: () => {
              // Navigate to home or route detail
              navigation.navigate('HomeStack');
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert('Hata', 'Rota yayınlanırken bir hata oluştu.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSkip = () => {
    handlePublish(); // Skip filters and publish directly
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={4} totalSteps={4} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Filtreler</Text>
        <Text style={styles.subtitle}>
          Fotoğraflarınıza filtre uygulayın
        </Text>
        
        {/* Development Notice */}
        <View style={styles.devNotice}>
          <Icon name="wrench" size={16} color="#ff9800" />
          <Text style={styles.devNoticeText}>
            Bu özellik geliştirme aşamasındadır
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Filter Preview */}
        <FilterPreview
          photos={selectedPhotos}
          selectedFilter={selectedFilter}
        />

        {/* Filter Options */}
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
                style={[
                  styles.filterOption,
                  selectedFilter === filter.id && styles.filterOptionSelected,
                ]}
                onPress={() => handleFilterSelect(filter.id)}
                disabled={filter.id !== 'none'} // Only allow 'none' for demo
              >
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
                        ? '#ccc'
                        : selectedFilter === filter.id
                        ? '#fff'
                        : '#666'
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

        {/* Final Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Rota Özeti</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Icon name="image" size={20} color="#4CAF50" />
              <Text style={styles.summaryLabel}>Fotoğraf</Text>
              <Text style={styles.summaryValue}>{selectedPhotos.length}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Icon name="map-marker" size={20} color="#4CAF50" />
              <Text style={styles.summaryLabel}>Durak</Text>
              <Text style={styles.summaryValue}>{routeStops.length}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Icon name="tag" size={20} color="#4CAF50" />
              <Text style={styles.summaryLabel}>Kategori</Text>
              <Text style={styles.summaryValue}>
                {selectedCategory ? selectedCategory.name : 'Yok'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Icon name="city" size={20} color="#4CAF50" />
              <Text style={styles.summaryLabel}>Şehir</Text>
              <Text style={styles.summaryValue}>
                {selectedCity ? selectedCity.name : 'Yok'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.skipButton]}
            onPress={handleSkip}
            disabled={isPublishing}>
            <Text style={[styles.buttonText, styles.skipButtonText]}>
              Atla
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.publishButton]}
            onPress={handlePublish}
            disabled={isPublishing}>
            {isPublishing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="send" size={18} color="#fff" />
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
    marginBottom: 12,
  },
  devNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcc02',
  },
  devNoticeText: {
    fontSize: 12,
    color: '#ff9800',
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
    color: '#333',
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
  filterOptionSelected: {
    // Selected styles handled in child components
  },
  filterOptionDisabled: {
    opacity: 0.5,
  },
  filterIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterIconContainerSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  filterTextSelected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  filterTextDisabled: {
    color: '#ccc',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff9800',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  comingSoonText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '600',
  },
  summarySection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginTop: 2,
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
    flexDirection: 'row',
    justifyContent: 'center',
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
  publishButton: {
    backgroundColor: '#4CAF50',
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
