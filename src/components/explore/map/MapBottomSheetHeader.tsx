import React from 'react';
import { ActivityIndicator, Keyboard, LayoutChangeEvent, Text, View } from 'react-native';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import MapHeaderIconButton from './MapHeaderIconButton';
import MapWeatherBadge from './MapWeatherBadge';

const DEFAULT_HEADER_TITLE = 'Paylaşılan Rotalar';

interface MapBottomSheetHeaderProps {
  title?: string;
  loading?: boolean;
  topInset?: number;
  weatherLatitude?: number | null;
  weatherLongitude?: number | null;
  selectedRouteId?: string | null;
  hideRouteActions?: boolean;
  isRouteSaved?: boolean;
  onClearSelectedRoute?: () => void;
  onShareRoute?: () => void;
  onSaveRoute?: () => void;
  saveLoading?: boolean;
  onLayout?: (height: number) => void;
}

export const MapBottomSheetHeader: React.FC<MapBottomSheetHeaderProps> = ({
  title = DEFAULT_HEADER_TITLE,
  loading = false,
  topInset = 0,
  weatherLatitude,
  weatherLongitude,
  selectedRouteId = null,
  hideRouteActions = false,
  isRouteSaved = false,
  onClearSelectedRoute,
  onShareRoute,
  onSaveRoute,
  saveLoading = false,
  onLayout,
}) => {
  const theme = useAppTheme();
  const isRouteSelected = Boolean(selectedRouteId) && !hideRouteActions;
  const styles = useThemedStyles((t) => ({
    header: {
      paddingHorizontal: 18,
      paddingTop: 4,
      paddingBottom: 10,
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      minHeight: 36,
    },
    headerTitleGroup: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minWidth: 0,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: t.textPrimary,
      letterSpacing: -0.2,
      flexShrink: 1,
    },
    headerTitleLoader: {
      width: 16,
      height: 16,
      transform: [{ scale: 0.7 }],
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    onLayout?.(event.nativeEvent.layout.height);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleClearRoute = () => {
    dismissKeyboard();
    onClearSelectedRoute?.();
  };

  const handleShareRoute = () => {
    dismissKeyboard();
    onShareRoute?.();
  };

  const handleSaveRoute = () => {
    dismissKeyboard();
    onSaveRoute?.();
  };

  return (
    <View
      style={[styles.header, { paddingTop: 4 + topInset }]}
      onLayout={handleLayout}
    >
      <View style={styles.headerTopRow}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={theme.textSecondary}
              style={styles.headerTitleLoader}
            />
          ) : null}
        </View>

        {isRouteSelected ? (
          <View style={styles.headerActions}>
            <MapHeaderIconButton
              iconName="share-variant"
              onPress={handleShareRoute}
              accessibilityLabel="Rotayı paylaş"
            />
            <MapHeaderIconButton
              iconName={isRouteSaved ? 'bookmark' : 'bookmark-outline'}
              onPress={handleSaveRoute}
              accessibilityLabel="Rotayı kaydet"
              loading={saveLoading}
              active={isRouteSaved}
            />
            <MapHeaderIconButton
              iconName="close"
              onPress={handleClearRoute}
              accessibilityLabel="Rota detayından çık"
            />
          </View>
        ) : (
          <MapWeatherBadge
            latitude={weatherLatitude}
            longitude={weatherLongitude}
          />
        )}
      </View>
    </View>
  );
};

export default MapBottomSheetHeader;
