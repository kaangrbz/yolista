import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ModalSheetSafeArea from '../common/ModalSheetSafeArea';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import type { RouteWizardDraftRecord } from '../../types/createRouteFlowTypes';

interface RouteWizardDraftsSheetProps {
  visible: boolean;
  drafts: RouteWizardDraftRecord[];
  onClose: () => void;
  onSelectDraft: (draft: RouteWizardDraftRecord) => void;
  onDeleteDraft: (jobId: string) => void;
}

function formatSavedAt(savedAt: string): string {
  const savedDate = new Date(savedAt);
  const now = new Date();
  const diffMs = now.getTime() - savedDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return 'Bugün';
  }

  if (diffDays === 1) {
    return 'Dün';
  }

  if (diffDays < 7) {
    return `${diffDays} gün önce`;
  }

  return savedDate.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
  });
}

function getDraftTitle(draft: RouteWizardDraftRecord): string {
  const firstTitledStop = draft.routeStops.find((stop) => stop.title.trim().length > 0);

  if (firstTitledStop?.title.trim()) {
    return firstTitledStop.title.trim();
  }

  return 'İsimsiz rota taslağı';
}

function getDraftSubtitle(draft: RouteWizardDraftRecord): string {
  const parts: string[] = [`${draft.photos.length} fotoğraf`];

  if (draft.selectedCategory?.name) {
    parts.push(draft.selectedCategory.name);
  }

  if (draft.selectedCity?.name) {
    parts.push(draft.selectedCity.name);
  }

  parts.push(formatSavedAt(draft.savedAt));

  return parts.join(' · ');
}

function getPreviewUri(draft: RouteWizardDraftRecord): string | undefined {
  const firstPhoto = draft.photos[0];

  if (!firstPhoto) {
    return undefined;
  }

  return firstPhoto.processedLocalUri || firstPhoto.uri;
}

export const RouteWizardDraftsSheet: React.FC<RouteWizardDraftsSheetProps> = ({
  visible,
  drafts,
  onClose,
  onSelectDraft,
  onDeleteDraft,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    overlay: {
      flex: 1,
      backgroundColor: t.overlayDark,
      justifyContent: 'flex-end',
    },
    sheetWrap: {
      maxHeight: '70%',
    },
    sheet: {
      backgroundColor: t.background,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingHorizontal: 16,
      minHeight: 200,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.borderStrong,
      marginTop: 8,
      marginBottom: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: t.textPrimary,
    },
    list: {
      flexGrow: 0,
    },
    listContent: {
      paddingBottom: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    rowPressed: {
      opacity: 0.85,
    },
    thumbnail: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: t.surfaceMuted,
    },
    thumbnailPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: {
      flex: 1,
      minWidth: 0,
    },
    rowTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: t.textPrimary,
      marginBottom: 2,
    },
    rowSubtitle: {
      fontSize: 13,
      color: t.textSecondary,
    },
    deleteButton: {
      padding: 4,
    },
    empty: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 15,
      color: t.textSecondary,
    },
  }));

  const renderRow = ({ item }: { item: RouteWizardDraftRecord }) => {
    const previewUri = getPreviewUri(item);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.row,
          pressed && styles.rowPressed,
        ]}
        onPress={() => onSelectDraft(item)}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Icon name="image-outline" size={22} color={theme.textMuted} />
          </View>
        )}

        <View style={styles.rowText}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {getDraftTitle(item)}
          </Text>
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {getDraftSubtitle(item)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDeleteDraft(item.jobId)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="trash-can-outline" size={20} color={theme.textMuted} />
        </TouchableOpacity>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheetWrap} onPress={(event) => event.stopPropagation()}>
          <ModalSheetSafeArea style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Taslaklar</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {drafts.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Kayıtlı taslak yok</Text>
              </View>
            ) : (
              <FlatList
                data={drafts}
                keyExtractor={(item) => item.jobId}
                renderItem={renderRow}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </ModalSheetSafeArea>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
