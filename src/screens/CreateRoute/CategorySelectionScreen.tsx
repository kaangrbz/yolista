import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ProgressIndicator } from '../../components/common/ProgressIndicator';
import { CategorySelector } from '../../components/route/CategorySelector';
import { CitySelector } from '../../components/route/CitySelector';
import { Photo } from './PhotoSelectionScreen';
import { RouteStop } from './StopDetailsScreen';

export interface Category {
  id: number;
  name: string;
  icon_name: string;
  is_disabled: boolean;
}

export interface City {
  id: number;
  name: string;
  is_disabled: boolean;
}

export const CategorySelectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedPhotos, routeStops } = route.params as {
    selectedPhotos: Photo[];
    routeStops: RouteStop[];
  };

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = () => {
    setIsLoading(true);

    // Navigate to filter screen
    navigation.navigate('FilterScreen', {
      selectedPhotos,
      routeStops,
      selectedCategory,
      selectedCity,
    });

    setIsLoading(false);
  };

  const handleSkip = () => {
    // Skip to filter screen without category/city
    navigation.navigate('FilterScreen', {
      selectedPhotos,
      routeStops,
      selectedCategory: null,
      selectedCity: null,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={3} totalSteps={4} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Kategori ve Şehir</Text>
        <Text style={styles.subtitle}>
          Rotanızı kategorize edin ve şehir belirleyin
        </Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Category Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="tag" size={20} color="#333" />
            <Text style={styles.sectionTitle}>Kategori Seçin</Text>
            <Text style={styles.optional}>(opsiyonel)</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Rotanız hangi kategoriye uygun? Bu, diğer kullanıcıların rotanızı bulmasına yardımcı olur.
          </Text>

          <CategorySelector
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />
        </View>

        {/* City Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="city" size={20} color="#333" />
            <Text style={styles.sectionTitle}>Şehir Seçin</Text>
            <Text style={styles.optional}>(opsiyonel)</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Rotanız hangi şehirde? Bu bilgi konum bazlı aramalar için kullanılır.
          </Text>

          <CitySelector
            selectedCity={selectedCity}
            onCitySelect={setSelectedCity}
          />
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Rota Özeti</Text>
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <Icon name="image" size={16} color="#666" />
              <Text style={styles.summaryText}>
                {selectedPhotos.length} fotoğraf
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Icon name="map-marker" size={16} color="#666" />
              <Text style={styles.summaryText}>
                {routeStops.length} durak
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Icon name="map-marker-path" size={16} color="#666" />
              <Text style={styles.summaryText}>
                {routeStops.filter(stop => stop.coordinate).length} konum belirlendi
              </Text>
            </View>
            {selectedCategory && (
              <View style={styles.summaryItem}>
                <Icon name="tag" size={16} color="#666" />
                <Text style={styles.summaryText}>
                  {selectedCategory.name}
                </Text>
              </View>
            )}
            {selectedCity && (
              <View style={styles.summaryItem}>
                <Icon name="city" size={16} color="#666" />
                <Text style={styles.summaryText}>
                  {selectedCity.name}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.skipButton]}
            onPress={handleSkip}
            disabled={isLoading}>
            <Text style={[styles.buttonText, styles.skipButtonText]}>
              Atla
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.continueButton]}
            onPress={handleContinue}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                Devam Et
              </Text>
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
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  optional: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  summarySection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryContent: {
    gap: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
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
