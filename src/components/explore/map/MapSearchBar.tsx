// keyboard-aware-ignore: harita üstünde absolute pozisyonlanmış arama çubuğu; klavye kaldırma davranışı uygun değil
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import GeocodingService, {
  GeocodingResult,
} from '../../../services/GeocodingService';
import { appTheme } from '../../../theme/appTheme';

interface MapSearchBarProps {
  onResultPress: (result: GeocodingResult) => void;
  placeholder?: string;
}

const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

const iconForType = (type: string): string => {
  if (/(city|town|village|hamlet|municipality)/i.test(type)) {
    return 'city';
  }

  if (/(museum|castle|monument|memorial|ruins|archaeolog|historic)/i.test(type)) {
    return 'castle';
  }

  if (/(park|forest|nature|peak|mountain)/i.test(type)) {
    return 'tree';
  }

  if (/(restaurant|cafe|bar|food)/i.test(type)) {
    return 'silverware-fork-knife';
  }

  if (/(hotel|hostel|guest_house)/i.test(type)) {
    return 'bed';
  }

  return 'map-marker-outline';
};

export const MapSearchBar: React.FC<MapSearchBarProps> = ({
  onResultPress,
  placeholder = 'Şehir, tarihi yer, mekan ara...',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const showResults = useMemo(() => {
    return focused && query.trim().length >= MIN_QUERY_LENGTH;
  }, [focused, query]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);

      return;
    }

    setLoading(true);

    timerRef.current = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      const items = await GeocodingService.search(trimmed);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setResults(items);
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query]);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

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
              name={iconForType(item.type)}
              size={16}
              color={appTheme.textSecondary}
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
    [handleSelect],
  );

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Icon
          name="magnify"
          size={18}
          color={appTheme.textSecondary}
          style={styles.leadingIcon}
        />

        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor={appTheme.textMuted}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {loading ? (
          <ActivityIndicator
            size="small"
            color={appTheme.textSecondary}
            style={styles.trailingIcon}
          />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={handleClear} style={styles.trailingIcon}>
            <Icon name="close-circle" size={16} color={appTheme.textMuted} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 22,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: appTheme.border,
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
    color: appTheme.textPrimary,
    paddingVertical: 0,
  },
  trailingIcon: {
    marginLeft: 6,
  },
  resultsCard: {
    marginTop: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: 280,
    borderWidth: 1,
    borderColor: appTheme.border,
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
    backgroundColor: appTheme.surfaceMuted,
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
    color: appTheme.textPrimary,
  },
  resultSubtitle: {
    fontSize: 11,
    color: appTheme.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: appTheme.border,
    marginHorizontal: 12,
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: appTheme.textSecondary,
  },
});

export default MapSearchBar;
