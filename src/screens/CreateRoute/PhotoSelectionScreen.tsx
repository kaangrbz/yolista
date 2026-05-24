import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PhotoGrid } from '../../components/route/PhotoGrid';
import { RouteWizardDraftsSheet } from '../../components/route/RouteWizardDraftsSheet';
import { appTheme } from '../../theme/appTheme';
import { useCreateRouteFlowStore } from '../../store/createRouteFlowStore';
import { useCreateFlowPreventRemove } from '../../hooks/useCreateFlowPreventRemove';
import { useCreateFlowAndroidBack } from '../../hooks/useCreateFlowAndroidBack';
import {
  deleteWizardDraft,
  listWizardDrafts,
} from '../../services/routeWizardDraftStorage';
import type { CreateFlowPhoto, RouteWizardDraftRecord, WizardStep } from '../../types/createRouteFlowTypes';

type PickerPhotoInput = Omit<CreateFlowPhoto, 'uploadStatus'>;

export type Photo = CreateFlowPhoto;

const STEP_TO_ROUTE: Record<WizardStep, string> = {
  photo: 'PhotoSelection',
  stops: 'StopDetails',
  category: 'CategorySelection',
};

export const PhotoSelectionScreen = () => {
  const navigation = useNavigation();
  const photos = useCreateRouteFlowStore((state) => state.photos);
  const setPhotosFromPicker = useCreateRouteFlowStore((state) => state.setPhotosFromPicker);
  const removePhoto = useCreateRouteFlowStore((state) => state.removePhoto);
  const reorderPhotos = useCreateRouteFlowStore((state) => state.reorderPhotos);
  const setWizardStep = useCreateRouteFlowStore((state) => state.setWizardStep);
  const hydrateFromWizardDraft = useCreateRouteFlowStore((state) => state.hydrateFromWizardDraft);
  const resetFlow = useCreateRouteFlowStore((state) => state.resetFlow);

  const [drafts, setDrafts] = useState<RouteWizardDraftRecord[]>([]);
  const [isDraftsSheetVisible, setIsDraftsSheetVisible] = useState(false);

  useCreateFlowPreventRemove('photo');
  useCreateFlowAndroidBack('photo');

  const refreshDrafts = useCallback(() => {
    listWizardDrafts().then((items) => {
      setDrafts(items);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshDrafts();
    }, [refreshDrafts]),
  );

  const handlePhotoSelect = (incoming: PickerPhotoInput[]) => {
    if (incoming.length > 10) {
      Alert.alert('Uyarı', 'En fazla 10 fotoğraf seçebilirsiniz.');
      return;
    }

    setPhotosFromPicker(incoming);
  };

  const handlePhotoReorder = (fromIndex: number, toIndex: number) => {
    reorderPhotos(fromIndex, toIndex);
  };

  const handleRemovePhoto = (photoId: string) => {
    removePhoto(photoId);
  };

  const handleContinue = () => {
    if (photos.length === 0) {
      Alert.alert('Uyarı', 'En az 1 fotoğraf seçmelisiniz.');
      return;
    }

    setWizardStep('stops');

    (navigation as { navigate: (name: string) => void }).navigate('StopDetails');
  };

  const handleOpenDrafts = () => {
    refreshDrafts();
    setIsDraftsSheetVisible(true);
  };

  const handleSelectDraft = (draft: RouteWizardDraftRecord) => {
    resetFlow();
    hydrateFromWizardDraft(draft);
    setIsDraftsSheetVisible(false);

    const screenName = STEP_TO_ROUTE[draft.wizardStep] || 'PhotoSelection';

    (navigation as { navigate: (name: string) => void }).navigate(screenName);
  };

  const handleDeleteDraft = async (jobId: string) => {
    await deleteWizardDraft(jobId);
    refreshDrafts();
  };

  const canContinue = photos.length > 0;
  const hasDrafts = drafts.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fotoğraflar</Text>
        <Text style={styles.subtitle}>
          En fazla 10 görsel; sırayı sonra değiştirebilirsin.
        </Text>
      </View>

      <View style={styles.content}>
        <PhotoGrid
          selectedPhotos={photos}
          onPhotoSelect={handlePhotoSelect}
          onPhotoReorder={handlePhotoReorder}
          onRemovePhoto={handleRemovePhoto}
          maxPhotos={10}
        />
      </View>

      <View style={styles.footer}>
        {canContinue ? (
          <Text style={styles.countText}>
            {photos.length}/10 seçildi
          </Text>
        ) : null}

        {canContinue ? (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Devam</Text>
          </TouchableOpacity>
        ) : null}

        {hasDrafts ? (
          <TouchableOpacity
            style={[
              styles.draftsButton,
              canContinue && styles.draftsButtonWithContinue,
            ]}
            onPress={handleOpenDrafts}>
            <Icon name="content-save-outline" size={18} color={appTheme.accent} />
            <Text style={styles.draftsButtonText}>Taslaklar</Text>
            <View style={styles.draftsBadge}>
              <Text style={styles.draftsBadgeText}>{drafts.length}</Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>

      <RouteWizardDraftsSheet
        visible={isDraftsSheetVisible}
        drafts={drafts}
        onClose={() => setIsDraftsSheetVisible(false)}
        onSelectDraft={handleSelectDraft}
        onDeleteDraft={handleDeleteDraft}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: appTheme.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: appTheme.textSecondary,
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: appTheme.border,
    backgroundColor: appTheme.background,
    gap: 12,
  },
  countText: {
    fontSize: 14,
    color: appTheme.textSecondary,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: appTheme.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: appTheme.background,
    fontSize: 16,
    fontWeight: '600',
  },
  draftsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appTheme.accent,
    backgroundColor: 'transparent',
    gap: 8,
  },
  draftsButtonWithContinue: {
    paddingVertical: 14,
  },
  draftsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.accent,
  },
  draftsBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: appTheme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  draftsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: appTheme.background,
  },
});
