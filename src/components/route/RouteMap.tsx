import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteStop } from '../../screens/CreateRoute/StopDetailsScreen';

interface RouteMapProps {
  stops: RouteStop[];
  currentStopIndex: number;
  onLocationSelect: (coordinate: { latitude: number; longitude: number }, address?: string) => void;
}

// Default location (Istanbul)
const DEFAULT_REGION = {
  latitude: 41.0082,
  longitude: 28.9784,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export const RouteMap: React.FC<RouteMapProps> = ({
  stops,
  currentStopIndex,
  onLocationSelect,
}) => {
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [isSelecting, setIsSelecting] = useState(false);

  const currentStop = stops[currentStopIndex];
  
  // Filter stops that have coordinates
  const stopsWithCoordinates = stops.filter(stop => stop.coordinate);

  const handleMapPress = (event: any) => {
    if (!isSelecting) return;

    const { coordinate } = event.nativeEvent;
    onLocationSelect(coordinate);
    setIsSelecting(false);
  };

  const handleStartLocationSelection = () => {
    setIsSelecting(true);
    Alert.alert(
      'Konum Seçimi',
      'Haritada bir noktaya dokunarak durak konumunu belirleyin.',
      [
        { text: 'İptal', onPress: () => setIsSelecting(false) },
        { text: 'Tamam' },
      ],
    );
  };

  const handleCenterOnCurrentStop = () => {
    if (currentStop?.coordinate) {
      setRegion({
        ...currentStop.coordinate,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const getMarkerColor = (stopIndex: number) => {
    if (stopIndex === currentStopIndex) return '#ff4444';
    return '#4CAF50';
  };

  const polylineCoordinates = stopsWithCoordinates
    .map(stop => stop.coordinate!)
    .filter(Boolean);

  return (
    <View style={styles.container}>
      {/* Map Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="map" size={16} color="#666" />
          <Text style={styles.headerTitle}>Rota Haritası</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isSelecting && styles.actionButtonActive,
            ]}
            onPress={handleStartLocationSelection}>
            <Icon 
              name={isSelecting ? "crosshairs-gps" : "map-marker-plus"} 
              size={16} 
              color={isSelecting ? "#fff" : "#666"} 
            />
            <Text style={[
              styles.actionButtonText,
              isSelecting && styles.actionButtonTextActive,
            ]}>
              {isSelecting ? 'Seçiliyor...' : 'Konum Seç'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}>
        
        {/* Stop Markers */}
        {stopsWithCoordinates.map((stop, index) => {
          const originalIndex = stops.findIndex(s => s.id === stop.id);
          return (
            <Marker
              key={stop.id}
              coordinate={stop.coordinate!}
              pinColor={getMarkerColor(originalIndex)}
              title={stop.title || `Durak ${originalIndex + 1}`}
              description={stop.description || 'Açıklama eklenmemiş'}
            />
          );
        })}

        {/* Route Polyline */}
        {polylineCoordinates.length > 1 && (
          <Polyline
            coordinates={polylineCoordinates}
            strokeColor="#4CAF50"
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>

      {/* Map Footer */}
      <View style={styles.footer}>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ff4444' }]} />
            <Text style={styles.legendText}>Aktif Durak</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Diğer Duraklar</Text>
          </View>
        </View>

        {currentStop?.coordinate && (
          <TouchableOpacity
            style={styles.centerButton}
            onPress={handleCenterOnCurrentStop}>
            <Icon name="crosshairs-gps" size={16} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Info */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {stopsWithCoordinates.length} / {stops.length} durak konumu belirlendi
        </Text>
        {isSelecting && (
          <Text style={styles.selectingText}>
            Haritada bir noktaya dokunun
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionButtonActive: {
    backgroundColor: '#121212',
    borderColor: '#121212',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  actionButtonTextActive: {
    color: '#fff',
  },
  map: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  legendContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  centerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  selectingText: {
    fontSize: 12,
    color: '#ff4444',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
});
