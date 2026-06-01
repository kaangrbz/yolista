// keyboard-aware-ignore: harita üstünde absolute pozisyonlanmış arama çubuğu; klavye kaldırma davranışı uygun değil
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GeocodingResult } from '../../../services/GeocodingService';
import { useAddressSearch } from '../../../hooks/useAddressSearch';
import { iconForGeocodingType } from '../../../utils/geocodingDisplay';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';

interface MapSearchBarProps {
  onResultPress: (result: GeocodingResult) => void;
  placeholder?: string;
}

export interface MapSearchBarHandle {
  blur: () => void;
}

export const MapSearchBar = forwardRef<MapSearchBarHandle, MapSearchBarProps>(({
  onResultPress,
  placeholder = 'Şehir, tarihi yer, mekan ara...',
}, ref) => {
  const theme = useAppTheme();
  const inputRef = useRef<TextInput>(null);
  const { query, setQuery, results, loading, clear, minQueryLength } = useAddressSearch();
  const [focused, setFocused] = useState(false);

  useImperativeHandle(ref, () => ({
    blur: () => {
      inputRef.current?.blur();
      Keyboard.dismiss();
      setFocused(false);
    },
  }));

  const showResults = useMemo(() => {
    return focused && query.trim().length >= minQueryLength;
  }, [focused, minQueryLength, query]);

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.background,
      borderRadius: 22,
      paddingHorizontal: 12,
      height: 44,
      borderWidth: 1,
      borderColor: t.border,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    leadingIcon: {
      marginRight: 6,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: t.textPrimary,
      paddingVertical: 0,
    },
    trailingIcon: {
      marginLeft: 6,
    },
    resultsCard: {
      marginTop: 6,
      backgroundColor: t.background,
      borderRadius: 12,
      maxHeight: 280,
      borderWidth: 1,
      borderColor: t.border,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    resultIconWrapper: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: t.surfaceMuted,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    resultTexts: {
      flex: 1,
    },
    resultTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: t.textPrimary,
    },
    resultSubtitle: {
      fontSize: 11,
      color: t.textSecondary,
      marginTop: 2,
    },
    separator: {
      height: 1,
      backgroundColor: t.border,
      marginHorizontal: 12,
    },
    emptyState: {
      padding: 16,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 12,
      color: t.textSecondary,
    },
  }));

  const handleClear = useCallback(() => {
    clear();
  }, [clear]);

  const handleSelect = useCallback(
    (item: GeocodingResult) => {
      Keyboard.dismiss();
      setFocused(false);
      onResultPress(item);
    },
    [onResultPress],
  );

  const renderItem = useCallback(
    ({ item }: { item: GeocodingResult }) => {
      return (
        <TouchableOpacity
          style={styles.resultRow}
          activeOpacity={0.85}
          onPress={() => handleSelect(item)}
        >
          <View style={styles.resultIconWrapper}>
            <Icon
              name={iconForGeocodingType(item.type)}
              size={16}
              color={theme.textSecondary}
            />
          </View>

          <View style={styles.resultTexts}>
            <Text numberOfLines={1} style={styles.resultTitle}>
              {item.shortName}
            </Text>
            <Text numberOfLines={1} style={styles.resultSubtitle}>
              {item.displayName}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handleSelect, styles, theme.textSecondary],
  );

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Icon
          name="magnify"
          size={18}
          color={theme.textSecondary}
          style={styles.leadingIcon}
        />

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {loading ? (
          <ActivityIndicator
            size="small"
            color={theme.textSecondary}
            style={styles.trailingIcon}
          />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={handleClear} style={styles.trailingIcon}>
            <Icon name="close-circle" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {showResults ? (
        <View style={styles.resultsCard}>
          {results.length === 0 && !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      ) : null}
    </View>
  );
});

MapSearchBar.displayName = 'MapSearchBar';

export default MapSearchBar;
