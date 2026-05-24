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
import {
  STOP_DESCRIPTION_MAX_LENGTH,
  STOP_TITLE_MAX_LENGTH,
} from '../../constants/routeContentLimits';
import { appTheme } from '../../theme/appTheme';

interface StopFormProps {
  stop: RouteStop;
  onUpdate: (field: keyof RouteStop, value: unknown) => void;
}

export const StopForm: React.FC<StopFormProps> = ({ stop, onUpdate }) => {
  return (
    <View style={styles.container}>
      <View style={styles.inputGroup}>
        <View style={styles.labelContainer}>
          <Icon name="text-short" size={16} color={appTheme.textSecondary} />
          <Text style={styles.label}>Başlık</Text>
          <Text style={styles.optional}>opsiyonel</Text>
        </View>
        <TextInput
          style={styles.input}
          value={stop.title}
          onChangeText={(text) => onUpdate('title', text)}
          placeholder="Örn: Galata, sahilde gün batımı…"
          placeholderTextColor={appTheme.textMuted}
          maxLength={STOP_TITLE_MAX_LENGTH}
        />
        <Text style={styles.charCount}>
          {stop.title.length}/{STOP_TITLE_MAX_LENGTH}
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.labelContainer}>
          <Icon name="text" size={16} color={appTheme.textSecondary} />
          <Text style={styles.label}>Not</Text>
          <Text style={styles.optional}>opsiyonel</Text>
        </View>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={stop.description}
          onChangeText={(text) => onUpdate('description', text)}
          placeholder="Bu karede neler var, kısa bir ipucu…"
          placeholderTextColor={appTheme.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={STOP_DESCRIPTION_MAX_LENGTH}
        />
        <Text style={styles.charCount}>
          {stop.description.length}/{STOP_DESCRIPTION_MAX_LENGTH}
        </Text>
      </View>

      {stop.coordinate ? (
        <View style={styles.locationInfo}>
          <View style={styles.locationHeader}>
            <Icon name="map-marker" size={16} color={appTheme.textSecondary} />
            <Text style={styles.locationLabel}>Konum</Text>
          </View>

          <View style={styles.locationDetails}>
            <Text style={styles.coordinatesText}>
              {stop.coordinate.latitude.toFixed(5)}, {stop.coordinate.longitude.toFixed(5)}
            </Text>
            {stop.address ? (
              <Text style={styles.addressText}>{stop.address}</Text>
            ) : null}
            <TouchableOpacity
              style={styles.clearLocationButton}
              onPress={() => {
                onUpdate('coordinate', undefined);
                onUpdate('address', undefined);
              }}>
              <Text style={styles.clearLocationText}>Konumu kaldır</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
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
    color: appTheme.textPrimary,
    marginLeft: 8,
  },
  optional: {
    fontSize: 12,
    color: appTheme.textMuted,
    marginLeft: 6,
    textTransform: 'lowercase',
  },
  input: {
    borderWidth: 1,
    borderColor: appTheme.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: appTheme.textPrimary,
    backgroundColor: appTheme.background,
  },
  textArea: {
    minHeight: 120,
    maxHeight: 220,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: appTheme.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  locationInfo: {
    backgroundColor: appTheme.surfaceMuted,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: appTheme.border,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.textSecondary,
    marginLeft: 8,
  },
  locationDetails: {
    gap: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: appTheme.textSecondary,
    fontFamily: 'monospace',
  },
  addressText: {
    fontSize: 14,
    color: appTheme.textPrimary,
    marginTop: 4,
  },
  clearLocationButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearLocationText: {
    fontSize: 13,
    color: '#c62828',
    fontWeight: '500',
  },
});
