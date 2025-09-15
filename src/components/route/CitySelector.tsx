import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { City } from '../../screens/CreateRoute/CategorySelectionScreen';
import CityModel from '../../model/cities.model';
import KeyboardAwareContainer from '../common/KeyboardAwareContainer';

interface CitySelectorProps {
  selectedCity: City | null;
  onCitySelect: (city: City | null) => void;
}

export const CitySelector: React.FC<CitySelectorProps> = ({
  selectedCity,
  onCitySelect,
}) => {
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    // Filter cities based on search query
    if (searchQuery.trim() === '') {
      setFilteredCities(cities.slice(0, 10)); // Show first 10 cities
    } else {
      const filtered = cities.filter(city =>
        city.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCities(filtered.slice(0, 20)); // Show max 20 results
    }
  }, [searchQuery, cities]);

  const fetchCities = async () => {
    try {
      setIsLoading(true);
      const fetchedCities = await CityModel.getCities();

      if (fetchedCities) {
        // Filter out disabled cities and sort by name
        const activeCities = fetchedCities
          .filter(city => !city.is_disabled)
          .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

        setCities(activeCities);
        setFilteredCities(activeCities.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCityPress = (city: City) => {
    if (selectedCity?.id === city.id) {
      // Deselect if already selected
      onCitySelect(null);
      setSearchQuery('');
    } else {
      onCitySelect(city);
      setSearchQuery(city.name);
    }
    setShowDropdown(false);
  };

  const handleClearSelection = () => {
    onCitySelect(null);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleSearchFocus = () => {
    setShowDropdown(true);
  };

  const handleSearchBlur = () => {
    // Delay hiding dropdown to allow for city selection
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#666" />
        <Text style={styles.loadingText}>Şehirler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <KeyboardAwareContainer style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="magnify" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            placeholder="Şehir ara..."
            placeholderTextColor="#999"
          />
          {(searchQuery || selectedCity) && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={handleClearSelection}>
              <Icon name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Selected City Display */}
      {selectedCity && !showDropdown && (
        <View style={styles.selectedCityContainer}>
          <View style={styles.selectedCityContent}>
            <Icon name="city" size={20} color="#4CAF50" />
            <Text style={styles.selectedCityText}>{selectedCity.name}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleClearSelection}>
              <Icon name="close" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Cities Dropdown */}
      {showDropdown && (
        <View style={styles.dropdown}>
          {filteredCities.length > 0 ? (
            <ScrollView
              style={styles.citiesList}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled>
              {filteredCities.map((city) => (
                <TouchableOpacity
                  key={city.id}
                  style={[
                    styles.cityItem,
                    selectedCity?.id === city.id && styles.cityItemSelected,
                  ]}
                  onPress={() => handleCityPress(city)}>
                  <Icon name="city" size={16} color="#666" />
                  <Text style={styles.cityText}>{city.name}</Text>
                  {selectedCity?.id === city.id && (
                    <Icon name="check" size={16} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noCitiesContainer}>
              <Icon name="city-variant-outline" size={32} color="#ccc" />
              <Text style={styles.noCitiesText}>
                {searchQuery ? 'Aradığınız şehir bulunamadı' : 'Şehir bulunamadı'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Popular Cities (when not searching) */}
      {!showDropdown && !selectedCity && (
        <View style={styles.popularCitiesContainer}>
          <Text style={styles.popularCitiesTitle}>Popüler Şehirler</Text>
          <View style={styles.popularCitiesGrid}>
            {cities.slice(0, 6).map((city) => (
              <TouchableOpacity
                key={city.id}
                style={styles.popularCityChip}
                onPress={() => handleCityPress(city)}>
                <Text style={styles.popularCityText}>{city.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </KeyboardAwareContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  clearSearchButton: {
    padding: 4,
  },
  selectedCityContainer: {
    marginBottom: 12,
  },
  selectedCityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  selectedCityText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginLeft: 8,
  },
  removeButton: {
    padding: 4,
  },
  dropdown: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  citiesList: {
    maxHeight: 200,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cityItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  cityText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  noCitiesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  noCitiesText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  popularCitiesContainer: {
    marginTop: 8,
  },
  popularCitiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  popularCitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularCityChip: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  popularCityText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});
