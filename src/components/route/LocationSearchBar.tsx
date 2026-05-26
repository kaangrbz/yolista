// keyboard-aware-ignore: konum seçici modal içinde arama; parent klavye yönetimi yeterli
import React, { useCallback, useMemo, useState } from 'react';
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
import { GeocodingResult } from '../../services/GeocodingService';
import { useAddressSearch } from '../../hooks/useAddressSearch';
import { iconForGeocodingType } from '../../utils/geocodingDisplay';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface LocationSearchBarProps {
  onResultPress: (result: GeocodingResult) => void;
  placeholder?: string;
}

export const LocationSearchBar: React.FC<LocationSearchBarProps> = ({
  onResultPress,
  placeholder = 'Adres veya mekan ara…',
}) => {
  const theme = useAppTheme();
  const { query, setQuery, results, loading, clear, minQueryLength } = useAddressSearch();
  const [focused, setFocused] = useState(false);

  const showResults = useMemo(() => {
    return focused && query.trim().length >= minQueryLength;
  }, [focused, minQueryLength, query]);

  const styles = useThemedStyles((t) => ({
    container: {
      zIndex: 10,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.background,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      borderWidth: 1,
      borderColor: t.border,
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
      maxHeight: 220,
      borderWidth: 1,
      borderColor: t.border,
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

  const handleSelect = useCallback(
    (item: GeocodingResult) => {
      Keyboard.dismiss();
      setFocused(false);
      clear();
      onResultPress(item);
    },
    [clear, onResultPress],
  );

  const renderItem = useCallback(
    ({ item }: { item: GeocodingResult }) => (
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
    ),
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
          <TouchableOpacity onPress={clear} style={styles.trailingIcon}>
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
};

export default LocationSearchBar;
