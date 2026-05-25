import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { City } from '../../screens/CreateRoute/CategorySelectionScreen';
import { CITY_CENTERS } from '../../data/cityCenters';

interface CitySelectorProps {
  selectedCity: City | null;
  onCitySelect: (city: City | null) => void;
}

const POPULAR_CITY_NAMES = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana'];

/**
 * Türkçe dahil tüm büyük/küçük harf ve aksan farklarını kaldırarak
 * arama için kullanılan normalize fonksiyonu.
 */
const normalize = (input: string): string => {
  return input
    .toLocaleLowerCase('tr')
    .replace(/i̇/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
};

const ALL_CITIES: City[] = (() => {
  const popularLower = POPULAR_CITY_NAMES.map((n) => normalize(n));

  const base: City[] = CITY_CENTERS.map((c) => ({
    id: c.id,
    name: c.name,
    is_disabled: false,
  }));

  const popular: City[] = [];
  popularLower.forEach((p) => {
    const found = base.find((c) => normalize(c.name) === p);
    if (found) popular.push(found);
  });

  const rest = base
    .filter((c) => !popularLower.includes(normalize(c.name)))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  return [...popular, ...rest];
})();

export const CitySelector: React.FC<CitySelectorProps> = ({
  selectedCity,
  onCitySelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredCities = useMemo(() => {
    const q = normalize(searchQuery);

    if (!q) {
      return ALL_CITIES;
    }

    return ALL_CITIES.filter((city) => normalize(city.name).includes(q));
  }, [searchQuery]);

  const handleCityPress = (city: City) => {
    if (selectedCity?.id === city.id) {
      onCitySelect(null);
      setSearchQuery('');
    } else {
      onCitySelect(city);
      setSearchQuery('');
    }
    setShowDropdown(false);
    Keyboard.dismiss();
  };

  const handleClearSelection = () => {
    onCitySelect(null);
    setSearchQuery('');
  };

  const toggleDropdown = () => {
    setShowDropdown((prev) => {
      const next = !prev;
      if (!next) {
        Keyboard.dismiss();
      }
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.fieldRow}
        activeOpacity={0.85}
        onPress={toggleDropdown}>
        <Icon name="magnify" size={20} color="#666" />

        {showDropdown ? (
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Şehir ara..."
            placeholderTextColor="#999"
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
          />
        ) : (
          <Text
            style={[
              styles.fieldText,
              !selectedCity && styles.fieldPlaceholder,
            ]}
            numberOfLines={1}>
            {selectedCity ? selectedCity.name : 'Şehir seç...'}
          </Text>
        )}

        {selectedCity && !showDropdown ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleClearSelection}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="close" size={20} color="#666" />
          </TouchableOpacity>
        ) : (
          <Icon
            name={showDropdown ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#666"
          />
        )}
      </TouchableOpacity>

      {showDropdown ? (
        <View style={styles.dropdown}>
          {filteredCities.length > 0 ? (
            <ScrollView
              style={styles.citiesList}
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled>
              {filteredCities.map((city) => {
                const isSelected = selectedCity?.id === city.id;

                return (
                  <TouchableOpacity
                    key={city.id}
                    style={[
                      styles.cityItem,
                      isSelected && styles.cityItemSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleCityPress(city)}>
                    <Icon
                      name="city"
                      size={16}
                      color={isSelected ? '#4CAF50' : '#666'}
                    />
                    <Text
                      style={[
                        styles.cityText,
                        isSelected && styles.cityTextSelected,
                      ]}>
                      {city.name}
                    </Text>
                    {isSelected ? (
                      <Icon name="check" size={16} color="#4CAF50" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.noCitiesContainer}>
              <Icon name="city-variant-outline" size={32} color="#ccc" />
              <Text style={styles.noCitiesText}>Aradığınız şehir bulunamadı</Text>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  fieldText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  fieldPlaceholder: {
    color: '#999',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  iconButton: {
    padding: 2,
  },
  dropdown: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  citiesList: {
    maxHeight: 300,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
    gap: 10,
  },
  cityItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  cityText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  cityTextSelected: {
    fontWeight: '600',
    color: '#121212',
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
});
