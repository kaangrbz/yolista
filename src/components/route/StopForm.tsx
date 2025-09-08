import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteStop } from '../../screens/CreateRoute/StopDetailsScreen';

interface StopFormProps {
  stop: RouteStop;
  onUpdate: (field: keyof RouteStop, value: any) => void;
}

export const StopForm: React.FC<StopFormProps> = ({ stop, onUpdate }) => {
  return (
    <View style={styles.container}>
      {/* Title Input */}
      <View style={styles.inputGroup}>
        <View style={styles.labelContainer}>
          <Icon name="map-marker" size={16} color="#666" />
          <Text style={styles.label}>Durak Başlığı</Text>
          <Text style={styles.optional}>(opsiyonel)</Text>
        </View>
        <TextInput
          style={styles.input}
          value={stop.title}
          onChangeText={(text) => onUpdate('title', text)}
          placeholder="Örn: Galata Kulesi, Taksim Meydanı..."
          placeholderTextColor="#999"
          maxLength={50}
        />
        <Text style={styles.charCount}>{stop.title.length}/50</Text>
      </View>

      {/* Description Input */}
      <View style={styles.inputGroup}>
        <View style={styles.labelContainer}>
          <Icon name="text" size={16} color="#666" />
          <Text style={styles.label}>Açıklama</Text>
          <Text style={styles.optional}>(opsiyonel)</Text>
        </View>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={stop.description}
          onChangeText={(text) => onUpdate('description', text)}
          placeholder="Bu durakta neler yapılabilir, ne görülür? Deneyimlerinizi paylaşın..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={200}
        />
        <Text style={styles.charCount}>{stop.description.length}/200</Text>
      </View>

      {/* Location Info */}
      <View style={styles.locationInfo}>
        <View style={styles.locationHeader}>
          <Icon name="map" size={16} color="#666" />
          <Text style={styles.locationLabel}>Konum Bilgisi</Text>
        </View>
        
        {stop.coordinate ? (
          <View style={styles.locationDetails}>
            <Text style={styles.coordinatesText}>
              📍 {stop.coordinate.latitude.toFixed(6)}, {stop.coordinate.longitude.toFixed(6)}
            </Text>
            {stop.address && (
              <Text style={styles.addressText}>{stop.address}</Text>
            )}
            <TouchableOpacity
              style={styles.clearLocationButton}
              onPress={() => {
                onUpdate('coordinate', undefined);
                onUpdate('address', undefined);
              }}>
              <Text style={styles.clearLocationText}>Konumu Temizle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.noLocationText}>
            Haritadan bir konum seçmek için aşağıdaki haritaya dokunun
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  optional: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    paddingTop: 10,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  locationInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  locationDetails: {
    gap: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  clearLocationButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearLocationText: {
    fontSize: 12,
    color: '#ff6b6b',
    textDecorationLine: 'underline',
  },
  noLocationText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
