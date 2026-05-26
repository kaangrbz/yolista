// keyboard-aware-ignore: parent ekran (CreateRoute / StopDetailsScreen) zaten KeyboardAwareContainer sağlıyor
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteStop } from '../../screens/CreateRoute/StopDetailsScreen';
import {
  STOP_DESCRIPTION_MAX_LENGTH,
} from '../../constants/routeContentLimits';
import { StopAdvancedOptions } from './StopAdvancedOptions';
import { StopMiniMap } from './StopMiniMap';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface StopFormProps {
  stop: RouteStop;
  onUpdate: (field: keyof RouteStop, value: unknown) => void;
  onRequestLocation?: () => void;
  onClearLocation?: () => void;
  locationSummary?: string | null;
  locationLoading?: boolean;
  compact?: boolean;
}

export const StopForm: React.FC<StopFormProps> = ({
  stop,
  onUpdate,
  onRequestLocation,
  onClearLocation,
  locationSummary,
  locationLoading = false,
  compact = false,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      paddingVertical: 8,
    },
    inputGroup: {
      marginBottom: 12,
    },
    labelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: t.textPrimary,
      marginLeft: 8,
    },
    optional: {
      fontSize: 12,
      color: t.textMuted,
      marginLeft: 6,
      textTransform: 'lowercase',
    },
    input: {
      borderWidth: 1,
      borderColor: t.borderStrong,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: t.textPrimary,
      backgroundColor: t.background,
    },
    textArea: {
      minHeight: 140,
      maxHeight: 240,
      paddingTop: 12,
    },
    charCount: {
      fontSize: 12,
      color: t.textMuted,
      textAlign: 'right',
      marginTop: 4,
    },
    locationInfo: {
      backgroundColor: t.surfaceMuted,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: t.border,
      marginTop: 8,
    },
    locationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    locationLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: t.textSecondary,
      marginLeft: 8,
    },
    locationDetails: {
      gap: 4,
    },
    coordinatesText: {
      fontSize: 12,
      color: t.textSecondary,
      fontFamily: 'monospace',
    },
    addressText: {
      fontSize: 14,
      color: t.textPrimary,
      marginTop: 4,
    },
    editLocationButton: {
      marginTop: 8,
      alignSelf: 'flex-start',
    },
    editLocationText: {
      fontSize: 13,
      color: t.accent,
      fontWeight: '600',
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
    addLocationButton: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.borderStrong,
      borderStyle: 'dashed',
      backgroundColor: t.surfaceMuted,
      gap: 8,
    },
    addLocationText: {
      fontSize: 14,
      fontWeight: '600',
      color: t.textPrimary,
    },
    addLocationHint: {
      fontSize: 12,
      color: t.textSecondary,
      marginTop: 6,
      lineHeight: 18,
    },
  }));

  return (
    <View style={styles.container}>
      {!compact ? (
        <>
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Icon name="text" size={16} color={theme.textSecondary} />
              <Text style={styles.label}>Açıklama</Text>
              <Text style={styles.optional}>opsiyonel</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={stop.description}
              onChangeText={(text) => onUpdate('description', text)}
              placeholder="Bu kare hakkında not, deneyim veya ipucu…"
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={STOP_DESCRIPTION_MAX_LENGTH}
            />
            <Text style={styles.charCount}>
              {stop.description.length}/{STOP_DESCRIPTION_MAX_LENGTH}
            </Text>
          </View>

          <StopAdvancedOptions
            hint={stop.title}
            onHintChange={(text) => onUpdate('title', text)}
          />
        </>
      ) : null}

      {stop.coordinate ? (
        <View style={styles.locationInfo}>
          <StopMiniMap
            latitude={stop.coordinate.latitude}
            longitude={stop.coordinate.longitude}
          />

          <View style={styles.locationHeader}>
            <Icon name="map-marker" size={16} color={theme.textSecondary} />
            <Text style={styles.locationLabel}>Konum</Text>
          </View>

          <View style={styles.locationDetails}>
            <Text style={styles.coordinatesText}>
              {stop.coordinate.latitude.toFixed(5)},{' '}
              {stop.coordinate.longitude.toFixed(5)}
            </Text>
            {locationLoading ? (
              <Text style={styles.addressText}>Adres aranıyor…</Text>
            ) : stop.address || locationSummary ? (
              <Text style={styles.addressText}>
                {stop.address || locationSummary}
              </Text>
            ) : null}
            {onRequestLocation ? (
              <TouchableOpacity
                style={styles.editLocationButton}
                onPress={onRequestLocation}
              >
                <Text style={styles.editLocationText}>Konumu düzenle</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.clearLocationButton}
              onPress={() => {
                if (onClearLocation) {
                  onClearLocation();
                  return;
                }

                onUpdate('coordinate', undefined);
                onUpdate('address', undefined);
              }}>
              <Text style={styles.clearLocationText}>Konumu kaldır</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Icon name="map-marker-outline" size={16} color={theme.textSecondary} />
            <Text style={styles.label}>Konum</Text>
            <Text style={styles.optional}>opsiyonel</Text>
          </View>

          <TouchableOpacity
            style={styles.addLocationButton}
            onPress={onRequestLocation}
            disabled={!onRequestLocation}
          >
            <Icon name="map-marker-plus" size={18} color={theme.accent} />
            <Text style={styles.addLocationText}>Konum seç</Text>
          </TouchableOpacity>

          <Text style={styles.addLocationHint}>
            Haritada crosshair ile seç veya adres ara.
          </Text>
        </View>
      )}
    </View>
  );
};
