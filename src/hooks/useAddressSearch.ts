import { useEffect, useRef, useState } from 'react';
import GeocodingService, { GeocodingResult } from '../services/GeocodingService';

interface UseAddressSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  limit?: number;
}

interface UseAddressSearchResult {
  query: string;
  setQuery: (value: string) => void;
  results: GeocodingResult[];
  loading: boolean;
  clear: () => void;
  minQueryLength: number;
}

export const useAddressSearch = ({
  debounceMs = 500,
  minQueryLength = 3,
  limit = 6,
}: UseAddressSearchOptions = {}): UseAddressSearchResult => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const trimmed = query.trim();

    if (trimmed.length < minQueryLength) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    timerRef.current = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      const items = await GeocodingService.search(trimmed, limit);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setResults(items);
      setLoading(false);
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query, debounceMs, minQueryLength, limit]);

  const clear = () => {
    setQuery('');
    setResults([]);
    setLoading(false);
  };

  return {
    query,
    setQuery,
    results,
    loading,
    clear,
    minQueryLength,
  };
};

export default useAddressSearch;
