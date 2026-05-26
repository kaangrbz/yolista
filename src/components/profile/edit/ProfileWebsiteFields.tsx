// keyboard-aware-ignore: parent ekran (ProfileEditModal) zaten KeyboardAwareContainer sağlıyor
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  Animated,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { randomString } from '../../../utils/randomString';
import { parseWebsitesForEditor } from '../../../utils/websiteUtils';
import { clampIndex, reorderList } from '../../../utils/reorderList';
import { useAppTheme } from '../../../context/AppThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';

export interface WebsiteEntry {
  id: string;
  value: string;
}

interface ProfileWebsiteFieldsProps {
  entries: WebsiteEntry[];
  onChange: (entries: WebsiteEntry[]) => void;
  onDragActiveChange?: (isDragging: boolean) => void;
  error?: string;
}

const MAX_WEBSITE_COUNT = 10;
const DEFAULT_ROW_HEIGHT = 56;
const LONG_PRESS_DRAG_MS = 220;

export const createWebsiteEntry = (value = ''): WebsiteEntry => ({
  id: randomString(10),
  value,
});

export const buildWebsiteEntriesFromProfile = (
  storedWebsites: string | null | undefined,
): WebsiteEntry[] => {
  const values = parseWebsitesForEditor(storedWebsites);

  return values.map((value) => createWebsiteEntry(value));
};

const ProfileWebsiteFields: React.FC<ProfileWebsiteFieldsProps> = ({
  entries,
  onChange,
  onDragActiveChange,
  error,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    container: {
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
      color: t.textPrimary,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      gap: 8,
    },
    rowDragging: {
      zIndex: 10,
      elevation: 6,
      backgroundColor: t.background,
      borderRadius: 12,
      paddingVertical: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
    },
    dragHandle: {
      width: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dragHandlePlaceholder: {
      width: 28,
    },
    input: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: t.borderStrong,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: t.textPrimary,
      backgroundColor: t.surfaceMuted,
      minHeight: 48,
    },
    removeButton: {
      padding: 4,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 4,
    },
    addButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1DA1F2',
    },
    hintText: {
      fontSize: 12,
      color: t.textMuted,
      marginTop: 4,
      lineHeight: 17,
    },
    errorText: {
      color: '#e74c3c',
      fontSize: 13,
      marginTop: 6,
      fontWeight: '500',
    },
  }));

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [rowHeight, setRowHeight] = useState(DEFAULT_ROW_HEIGHT);
  const dragOffsetY = useRef(new Animated.Value(0)).current;
  const draggingIndexRef = useRef<number | null>(null);
  const entriesRef = useRef(entries);
  const rowHeightRef = useRef(rowHeight);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDragIndexRef = useRef<number | null>(null);
  const isDragInteractionActiveRef = useRef(false);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    rowHeightRef.current = rowHeight;
  }, [rowHeight]);

  const setDragInteractionActive = (isActive: boolean) => {
    if (isDragInteractionActiveRef.current === isActive) {
      return;
    }

    isDragInteractionActiveRef.current = isActive;
    onDragActiveChange?.(isActive);
  };

  const setDragging = (index: number | null) => {
    draggingIndexRef.current = index;
    setDraggingIndex(index);
  };

  const finishDrag = (translationY: number) => {
    const fromIndex = draggingIndexRef.current;

    if (fromIndex === null) {
      setDragInteractionActive(false);

      return;
    }

    const currentEntries = entriesRef.current;
    const shift = Math.round(translationY / rowHeightRef.current);
    const toIndex = clampIndex(fromIndex + shift, currentEntries.length);

    if (toIndex !== fromIndex) {
      onChange(reorderList(currentEntries, fromIndex, toIndex));
    }

    dragOffsetY.setValue(0);
    setDragging(null);
    setDragInteractionActive(false);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => draggingIndexRef.current !== null,
      onMoveShouldSetPanResponderCapture: () => draggingIndexRef.current !== null,
      onPanResponderTerminationRequest: () => draggingIndexRef.current === null,
      onPanResponderMove: (_, gestureState) => {
        dragOffsetY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        finishDrag(gestureState.dy);
      },
      onPanResponderTerminate: (_, gestureState) => {
        finishDrag(gestureState.dy);
      },
    }),
  ).current;

  const handleRowLayout = (event: LayoutChangeEvent) => {
    const measuredHeight = event.nativeEvent.layout.height;

    if (measuredHeight > 0 && Math.abs(measuredHeight - rowHeight) > 2) {
      setRowHeight(measuredHeight);
    }
  };

  const updateEntryValue = (entryId: string, value: string) => {
    onChange(
      entries.map((entry) => {
        if (entry.id !== entryId) {
          return entry;
        }

        return { ...entry, value };
      }),
    );
  };

  const handleAddWebsite = () => {
    if (entries.length >= MAX_WEBSITE_COUNT) {
      return;
    }

    onChange([...entries, createWebsiteEntry()]);
  };

  const handleRemoveWebsite = (entryId: string) => {
    if (entries.length <= 1) {
      onChange([createWebsiteEntry()]);

      return;
    }

    onChange(entries.filter((entry) => entry.id !== entryId));
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    pendingDragIndexRef.current = null;
  };

  const handleDragHandlePressIn = (index: number) => {
    pendingDragIndexRef.current = index;
    setDragInteractionActive(true);
    clearLongPressTimer();

    longPressTimerRef.current = setTimeout(() => {
      if (pendingDragIndexRef.current === index) {
        setDragging(index);
      }
    }, LONG_PRESS_DRAG_MS);
  };

  const handleDragHandlePressOut = () => {
    if (draggingIndexRef.current === null) {
      clearLongPressTimer();
      setDragInteractionActive(false);
    }
  };

  useEffect(() => {
    return () => {
      clearLongPressTimer();

      if (isDragInteractionActiveRef.current) {
        isDragInteractionActiveRef.current = false;
        onDragActiveChange?.(false);
      }
    };
  }, [onDragActiveChange]);

  const canAddMore = entries.length < MAX_WEBSITE_COUNT;
  const canReorder = entries.length > 1;

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>Website</Text>
      </View>

      <View {...panResponder.panHandlers}>
        {entries.map((entry, index) => {
          const isDragging = draggingIndex === index;

          const rowStyle = isDragging
            ? [
                styles.row,
                styles.rowDragging,
                { transform: [{ translateY: dragOffsetY }] },
              ]
            : styles.row;

          return (
            <Animated.View
              key={entry.id}
              style={rowStyle}
              onLayout={index === 0 ? handleRowLayout : undefined}
            >
              {canReorder ? (
                <Pressable
                  style={styles.dragHandle}
                  onPressIn={() => handleDragHandlePressIn(index)}
                  onPressOut={handleDragHandlePressOut}
                  accessibilityLabel="Sıralamak için basılı tut"
                >
                  <Icon name="drag-vertical" size={22} color={theme.textMuted} />
                </Pressable>
              ) : (
                <View style={styles.dragHandlePlaceholder} />
              )}

              <TextInput
                style={styles.input}
                value={entry.value}
                onChangeText={(value) => updateEntryValue(entry.id, value)}
                placeholder="ornek.com veya https://..."
                placeholderTextColor={theme.textMuted}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveWebsite(entry.id)}
                accessibilityLabel="Website alanını kaldır"
              >
                <Icon name="close-circle-outline" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {canAddMore ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddWebsite}
          accessibilityRole="button"
          accessibilityLabel="Bir website daha ekle"
        >
          <Icon name="plus-circle-outline" size={20} color="#1DA1F2" />
          <Text style={styles.addButtonText}>Bir website daha ekle</Text>
        </TouchableOpacity>
      ) : null}

      {canReorder ? (
        <Text style={styles.hintText}>
          Sırayı değiştirmek için tutamacı basılı tutup sürükleyin.
        </Text>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

export default ProfileWebsiteFields;
