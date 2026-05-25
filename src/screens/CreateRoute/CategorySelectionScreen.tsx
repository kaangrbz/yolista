import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CategorySelector } from '../../components/route/CategorySelector';
import { CitySelector } from '../../components/route/CitySelector';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { publishRouteFromCreateFlow } from '../../utils/createFlowPublish';
import { useCreateRouteFlowStore } from '../../store/createRouteFlowStore';
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
  const waitUntilUploadsSettled = useCreateRouteFlowStore(
    (state) => state.waitUntilUploadsSettled,
  );
  const anyUploadInProgress = useCreateRouteFlowStore(
    (state) => state.anyUploadInProgress,
  );
  const setWizardStep = useCreateRouteFlowStore((state) => state.setWizardStep);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(storeCategory);
  const [selectedCity, setSelectedCity] = useState<City | null>(storeCity);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useCreateFlowPreventRemove('category');
  useCreateFlowAndroidBack('category');

  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      backgroundColor: t.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 20,
    },
    eyebrow: {
      fontSize: 12,
      fontWeight: '600',
      color: t.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 6,
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      color: t.textPrimary,
      letterSpacing: -0.4,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 15,
      color: t.textSecondary,
      lineHeight: 22,
    },
    uploadBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
      alignSelf: 'flex-start',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: t.surfaceMuted,
      borderWidth: 1,
      borderColor: t.border,
    },
    uploadBadgeText: {
      fontSize: 12,
      fontWeight: '500',
      color: t.textSecondary,
    },
    content: {
      flex: 1,
    },
    contentInner: {
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    summaryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.surfaceMuted,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: t.border,
    },
    summaryItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    summaryItemText: {
      fontSize: 14,
      fontWeight: '500',
      color: t.textPrimary,
    },
    summaryDivider: {
      width: 1,
      height: 18,
      backgroundColor: t.borderStrong,
      marginHorizontal: 12,
    },
    section: {
      marginTop: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: t.textPrimary,
    },
    optional: {
      fontSize: 11,
      fontWeight: '600',
      color: t.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    sectionHint: {
      fontSize: 13,
      color: t.textSecondary,
      lineHeight: 19,
      marginBottom: 14,
    },
    sectionBody: {
      backgroundColor: t.background,
    },
    previewCard: {
      marginTop: 24,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surfaceMuted,
    },
    previewLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: t.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 10,
    },
    previewRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    previewChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: t.accent,
    },
    previewChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: t.background,
    },
    footer: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: t.border,
      backgroundColor: t.background,
    },
    button: {
      flex: 1,
      paddingVertical: 15,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    primaryButton: {
      backgroundColor: t.accent,
      flex: 1.4,
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: t.background,
    },
  }));

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleCategorySelect = (category: Category | null) => {
    setSelectedCategory(category);
    setCategoryCity(category, selectedCity);
  };

  const handleCitySelect = (city: City | null) => {
    setSelectedCity(city);
    setCategoryCity(selectedCategory, city);
  };

  const runPublish = async (category: Category | null, city: City | null) => {
    setIsPublishing(true);
    setWizardStep('category');
    setCategoryCity(category, city);

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

  const handlePublish = () => runPublish(selectedCategory, selectedCity);

  const uploadInProgress = anyUploadInProgress();
  const photoCount = photos.length;
  const stopCount = routeStops.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Son adım</Text>
        <Text style={styles.title}>Rotanı etiketle</Text>
        <Text style={styles.subtitle}>
          Kategori ve şehir seçmek zorunlu değil. İstediğin zaman atlayabilirsin.
        </Text>

        {uploadInProgress ? (
          <View style={styles.uploadBadge}>
            <ActivityIndicator size="small" color={theme.accent} />
            <Text style={styles.uploadBadgeText}>
              Fotoğraflar arka planda yükleniyor…
            </Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Icon name="image-multiple-outline" size={18} color={theme.textSecondary} />
            <Text style={styles.summaryItemText}>{photoCount} fotoğraf</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Icon name="map-marker-path" size={18} color={theme.textSecondary} />
            <Text style={styles.summaryItemText}>{stopCount} durak</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Icon name="tag-outline" size={18} color={theme.textPrimary} />
              <Text style={styles.sectionTitle}>Kategori</Text>
            </View>
            <Text style={styles.optional}>opsiyonel</Text>
          </View>
          <Text style={styles.sectionHint}>
            Rotana en yakın konuyu seç; insanlar daha kolay keşfetsin.
          </Text>

          <View style={styles.sectionBody}>
            <CategorySelector
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Icon name="city-variant-outline" size={18} color={theme.textPrimary} />
              <Text style={styles.sectionTitle}>Şehir</Text>
            </View>
            <Text style={styles.optional}>opsiyonel</Text>
          </View>
          <Text style={styles.sectionHint}>
            Rotanın geçtiği şehri ekle; şehir bazlı keşifte öne çıksın.
          </Text>

          <View style={styles.sectionBody}>
            <CitySelector
              selectedCity={selectedCity}
              onCitySelect={handleCitySelect}
            />
          </View>
        </View>

        {selectedCategory || selectedCity ? (
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Şu an seçili</Text>
            <View style={styles.previewRow}>
              {selectedCategory ? (
                <View style={styles.previewChip}>
                  <Icon
                    name={selectedCategory.icon_name || 'tag'}
                    size={14}
                    color={theme.background}
                  />
                  <Text style={styles.previewChipText}>{selectedCategory.name}</Text>
                </View>
              ) : null}
              {selectedCity ? (
                <View style={styles.previewChip}>
                  <Icon name="city" size={14} color={theme.background} />
                  <Text style={styles.previewChipText}>{selectedCity.name}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {isKeyboardVisible ? null : (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              isPublishing && styles.buttonDisabled,
            ]}
            onPress={handlePublish}
            disabled={isPublishing}
            activeOpacity={0.85}>
            {isPublishing ? (
              <ActivityIndicator size="small" color={theme.background} />
            ) : (
              <>
                <Icon name="send" size={18} color={theme.background} />
                <Text style={styles.primaryButtonText}>Yayınla</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};
