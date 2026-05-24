import React, { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { SavedCollection, SaveCollectionsService } from '../../services/SaveCollectionsService';
import SavedCollectionRow from './SavedCollectionRow';

interface SavedCollectionsSheetHeaderProps {
  isCreateOpen: boolean;
  onToggleCreateOpen: () => void;
  onSubmitNewListName: (name: string) => Promise<void>;
}

const SavedCollectionsSheetHeader: React.FC<SavedCollectionsSheetHeaderProps> = ({
  isCreateOpen,
  onToggleCreateOpen,
  onSubmitNewListName,
}) => {
  const [draftName, setDraftName] = useState('');

  const handleSubmit = async () => {
    const cleanName = draftName.trim();

    if (!cleanName) {
      return;
    }

    try {
      await onSubmitNewListName(cleanName);
      setDraftName('');
    } catch {
      // Parent shows alert; keep draft so user can retry
    }
  };

  return (
    <View style={styles.headerSection}>
      <Pressable
        style={({ pressed }) => [
          styles.createButton,
          pressed && styles.createButtonPressed,
        ]}
        onPress={onToggleCreateOpen}
      >
        <Text style={styles.createButtonText}>Yeni Liste Oluştur</Text>
      </Pressable>

      {isCreateOpen && (
        <View style={styles.createInputContainer}>
          <TextInput
            value={draftName}
            onChangeText={setDraftName}
            style={styles.input}
            placeholder="Liste adı"
            placeholderTextColor="#888"
            autoFocus={true}
            maxLength={40}
          />
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={handleSubmit}
          >
            <Text style={styles.addButtonText}>Ekle</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

interface SavedCollectionsSheetProps {
  visible: boolean;
  loading: boolean;
  collections: SavedCollection[];
  selectedCollectionIds: string[];
  rowLoadingMap: Record<string, boolean>;
  onClose: () => void;
  onToggleCollection: (collectionId: string) => void;
  onCreateCollection: (name: string) => Promise<void>;
}

const sortCustomCollections = (
  list: SavedCollection[],
  selectedIds: string[],
): SavedCollection[] => {
  const isSelected = (id: string) => selectedIds.includes(id);
  const byName = (a: SavedCollection, b: SavedCollection) => {
    return a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' });
  };

  const saved = list.filter((c) => isSelected(c.id)).sort(byName);
  const unsaved = list.filter((c) => !isSelected(c.id)).sort(byName);

  return [...saved, ...unsaved];
};

const buildSortedSheetCollections = (
  all: SavedCollection[],
  selectedIds: string[],
): SavedCollection[] => {
  const defaultColl = all.find((c) => c.is_default) ?? null;
  const custom = all.filter((c) => !c.is_default);
  const sortedCustom = sortCustomCollections(custom, selectedIds);

  if (defaultColl) {
    return [defaultColl, ...sortedCustom];
  }

  return sortedCustom;
};

const SavedCollectionsSheet: React.FC<SavedCollectionsSheetProps> = ({
  visible,
  loading,
  collections,
  selectedCollectionIds,
  rowLoadingMap,
  onClose,
  onToggleCollection,
  onCreateCollection,
}) => {
  const sheetRef = useRef<ComponentRef<typeof BottomSheetModal>>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [previewByCollectionId, setPreviewByCollectionId] = useState<
    Record<string, string | null>
  >({});

  const snapPoints = useMemo(() => ['38%', '82%'], []);

  const sortedListCollections = useMemo(() => {
    return buildSortedSheetCollections(collections, selectedCollectionIds);
  }, [collections, selectedCollectionIds]);

  const collectionIdsForPreview = useMemo(() => {
    return collections.map((c) => c.id);
  }, [collections]);

  const renderBackdrop = useCallback(
    (backdropProps: BottomSheetBackdropProps) => {
      return (
        <BottomSheetBackdrop
          {...backdropProps}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      );
    },
    [],
  );

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();

      return;
    }

    sheetRef.current?.dismiss();
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setPreviewByCollectionId({});

      return;
    }

    if (collectionIdsForPreview.length === 0) {
      setPreviewByCollectionId({});

      return;
    }

    const ids = collectionIdsForPreview;
    let cancelled = false;

    SaveCollectionsService.getCollectionFirstItemPreviewUrls(ids)
      .then((map) => {
        if (!cancelled) {
          setPreviewByCollectionId(map);
        }
      })
      .catch((err) => {
        console.error('SavedCollectionsSheet previews:', err);

        if (!cancelled) {
          setPreviewByCollectionId({});
        }
      });

    return () => {
      cancelled = true;
    };
  }, [visible, collectionIdsForPreview]);

  const handleDismiss = useCallback(() => {
    onClose();
    setIsCreateOpen(false);
  }, [onClose]);

  const handleSubmitNewListName = useCallback(
    async (name: string) => {
      await onCreateCollection(name);
      setIsCreateOpen(false);
    },
    [onCreateCollection],
  );

  const toggleCreateOpen = useCallback(() => {
    setIsCreateOpen((prev) => !prev);
  }, []);

  const renderCollectionRow = useCallback(
    ({ item }: { item: SavedCollection }) => {
      return (
        <SavedCollectionRow
          collection={item}
          isSelected={selectedCollectionIds.includes(item.id)}
          isLoading={!!rowLoadingMap[item.id]}
          previewUrl={previewByCollectionId[item.id] ?? null}
          onPress={() => onToggleCollection(item.id)}
        />
      );
    },
    [onToggleCollection, previewByCollectionId, rowLoadingMap, selectedCollectionIds],
  );

  const renderListEmpty = useCallback(() => {
    return (
      <Text style={styles.emptyText}>
        {loading ? 'Listeler yükleniyor...' : 'Henüz listen yok'}
      </Text>
    );
  }, [loading]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetIndicator}
    >
      <View style={styles.sheetBody}>
        <SavedCollectionsSheetHeader
          isCreateOpen={isCreateOpen}
          onToggleCreateOpen={toggleCreateOpen}
          onSubmitNewListName={handleSubmitNewListName}
        />
        <BottomSheetFlatList
          data={sortedListCollections}
          keyExtractor={(item) => item.id}
          renderItem={renderCollectionRow}
          ListEmptyComponent={renderListEmpty}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          style={styles.flatList}
        />
      </View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  sheetIndicator: {
    backgroundColor: '#d2d2d2',
  },
  sheetBody: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  flatList: {
    flex: 1,
  },
  createButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  createButtonPressed: {
    opacity: 0.55,
  },
  createButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0095f6',
  },
  createInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    columnGap: 8,
  },
  input: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#111',
  },
  addButton: {
    height: 42,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
});

export default SavedCollectionsSheet;
