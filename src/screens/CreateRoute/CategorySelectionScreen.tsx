import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CategorySelector } from '../../components/route/CategorySelector';
import { CitySelector } from '../../components/route/CitySelector';
import { appTheme } from '../../theme/appTheme';
import { publishRouteFromCreateFlow } from '../../utils/createFlowPublish';
import { useCreateRouteFlowStore } from '../../store/createRouteFlowStore';
import { saveWizardDraft } from '../../services/routeWizardDraftStorage';
import { showToast } from '../../utils/alert';
import { useCreateFlowPreventRemove } from '../../hooks/useCreateFlowPreventRemove';
import { useCreateFlowAndroidBack } from '../../hooks/useCreateFlowAndroidBack';

export interface Category {
  id: number;
  name: string;
  icon_name: string;
  is_disabled: boolean;
}

export interface City {
  id: number;
  name: string;
  is_disabled: boolean;
}

export const CategorySelectionScreen = () => {
  const navigation = useNavigation();
  const photos = useCreateRouteFlowStore((state) => state.photos);
  const routeStops = useCreateRouteFlowStore((state) => state.routeStops);
  const storeCategory = useCreateRouteFlowStore((state) => state.selectedCategory);
  const storeCity = useCreateRouteFlowStore((state) => state.selectedCity);
  const setCategoryCity = useCreateRouteFlowStore((state) => state.setCategoryCity);
  const completeFlow = useCreateRouteFlowStore((state) => state.completeFlow);
  const getSnapshotForDraft = useCreateRouteFlowStore((state) => state.getSnapshotForDraft);
  const waitUntilUploadsSettled = useCreateRouteFlowStore((state) => state.waitUntilUploadsSettled);
  const anyUploadInProgress = useCreateRouteFlowStore((state) => state.anyUploadInProgress);
  const setWizardStep = useCreateRouteFlowStore((state) => state.setWizardStep);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(storeCategory);
  const [selectedCity, setSelectedCity] = useState<City | null>(storeCity);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  useCreateFlowPreventRemove('category');
  useCreateFlowAndroidBack('category');

  const syncMetaToStore = (category: Category | null, city: City | null) => {
    setCategoryCity(category, city);
  };

  const handleCategorySelect = (category: Category | null) => {
    setSelectedCategory(category);
    syncMetaToStore(category, selectedCity);
  };

  const handleCitySelect = (city: City | null) => {
    setSelectedCity(city);
    syncMetaToStore(selectedCategory, city);
  };

  const runPublish = async (category: Category | null, city: City | null) => {
    setIsPublishing(true);
    setWizardStep('category');
    syncMetaToStore(category, city);

    try {
      if (anyUploadInProgress()) {
        const ready = await waitUntilUploadsSettled();

        if (!ready) {
          showToast('error', 'Bazı fotoğraflar yüklenemedi. Tekrar deneyin.');
          return;
        }
      }

      await publishRouteFromCreateFlow(
        navigation as { navigate: (n: string, p?: object) => void },
        {
          selectedPhotos: photos,
          routeStops,
          selectedCategory: category,
          selectedCity: city,
        },
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublish = () => {
    runPublish(selectedCategory, selectedCity);
  };

  const handleSkip = () => {
    runPublish(null, null);
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setWizardStep('category');
    syncMetaToStore(selectedCategory, selectedCity);

    try {
      const snapshot = getSnapshotForDraft();

      if (!snapshot) {
        showToast('error', 'Kaydedilecek taslak bulunamadı');
        return;
      }

      const saved = await saveWizardDraft(snapshot, 'category');

      if (!saved) {
        showToast('error', 'Taslak kaydedilemedi');
        return;
      }

      completeFlow();
      showToast('success', 'Taslak kaydedildi', 'Kaydedildi');

      (navigation as { navigate: (n: string, p?: object) => void }).navigate('HomeStack', {
        screen: 'HomeMain',
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const uploadHint = anyUploadInProgress()
    ? 'Fotoğraflar arka planda yükleniyor…'
    : null;

  const isBusy = isPublishing || isSavingDraft;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rota bilgileri</Text>
        <Text style={styles.subtitle}>
          İstersen kategori ve şehir ekle; yayınlamadan önce son adım.
        </Text>
        {uploadHint ? (
          <Text style={styles.uploadHint}>{uploadHint}</Text>
        ) : null}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="tag" size={20} color={appTheme.textPrimary} />
            <Text style={styles.sectionTitle}>Kategori</Text>
            <Text style={styles.optional}>opsiyonel</Text>
          </View>

          <CategorySelector
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="city" size={20} color={appTheme.textPrimary} />
            <Text style={styles.sectionTitle}>Şehir</Text>
            <Text style={styles.optional}>opsiyonel</Text>
          </View>

          <CitySelector
            selectedCity={selectedCity}
            onCitySelect={handleCitySelect}
          />
        </View>

        <View style={styles.summaryStrip}>
          <Text style={styles.summaryText}>
            {photos.length} fotoğraf
            {selectedCategory ? ` · ${selectedCategory.name}` : ''}
            {selectedCity ? ` · ${selectedCity.name}` : ''}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.outlineButton]}
          onPress={handleSaveDraft}
          disabled={isBusy}>
          {isSavingDraft ? (
            <ActivityIndicator size="small" color={appTheme.accent} />
          ) : (
            <>
              <Icon name="content-save-outline" size={18} color={appTheme.accent} />
              <Text style={styles.outlineButtonText}>Taslağa ekle</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleSkip}
            disabled={isBusy}>
            <Text style={styles.secondaryButtonText}>Atla</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handlePublish}
            disabled={isBusy}>
            {isPublishing ? (
              <ActivityIndicator size="small" color={appTheme.background} />
            ) : (
              <>
                <Icon name="send" size={18} color={appTheme.background} />
                <Text style={styles.primaryButtonText}>Yayınla</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
  uploadHint: {
    marginTop: 8,
    fontSize: 13,
    color: appTheme.accent,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: appTheme.textPrimary,
    marginLeft: 8,
  },
  optional: {
    fontSize: 12,
    color: appTheme.textMuted,
    marginLeft: 8,
    textTransform: 'lowercase',
  },
  summaryStrip: {
    marginTop: 24,
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: appTheme.surfaceMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appTheme.border,
  },
  summaryText: {
    fontSize: 14,
    color: appTheme.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: appTheme.border,
    backgroundColor: appTheme.background,
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  outlineButton: {
    flex: undefined,
    width: '100%',
    borderWidth: 1,
    borderColor: appTheme.accent,
    backgroundColor: 'transparent',
    gap: 8,
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.accent,
    marginLeft: 4,
  },
  secondaryButton: {
    backgroundColor: appTheme.surfaceMuted,
    borderWidth: 1,
    borderColor: appTheme.borderStrong,
  },
  primaryButton: {
    backgroundColor: appTheme.accent,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.background,
    marginLeft: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: appTheme.textSecondary,
  },
});
