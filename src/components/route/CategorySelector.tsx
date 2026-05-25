import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Category } from '../../screens/CreateRoute/CategorySelectionScreen';
import CategoryModel from '../../model/category.model';
import { useAppTheme } from '../../context/AppThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface CategorySelectorProps {
  selectedCategory: Category | null;
  onCategorySelect: (category: Category | null) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onCategorySelect,
}) => {
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    container: {
      marginBottom: 4,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
    },
    loadingText: {
      fontSize: 14,
      color: t.textSecondary,
      marginLeft: 8,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 28,
    },
    emptyText: {
      fontSize: 14,
      color: t.textMuted,
      marginTop: 8,
    },
    clearRow: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginBottom: 10,
      gap: 6,
    },
    clearRowText: {
      fontSize: 13,
      color: t.textSecondary,
      fontWeight: '500',
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 2,
      paddingRight: 4,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: t.surfaceMuted,
      borderWidth: 1,
      borderColor: t.border,
      maxWidth: 200,
    },
    chipSelected: {
      backgroundColor: t.accent,
      borderColor: t.accent,
    },
    chipLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: t.textPrimary,
      flexShrink: 1,
    },
    chipLabelSelected: {
      color: t.background,
      fontWeight: '600',
    },
  }));

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const fetchedCategories = await CategoryModel.getCategories();

      if (fetchedCategories) {
        const activeCategories = fetchedCategories.filter(cat => !cat.is_disabled);
        setCategories(activeCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryPress = (category: Category) => {
    if (selectedCategory?.id === category.id) {
      onCategorySelect(null);
      return;
    }

    onCategorySelect(category);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.textSecondary} />
        <Text style={styles.loadingText}>Kategoriler yükleniyor…</Text>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="tag-off" size={28} color={theme.borderStrong} />
        <Text style={styles.emptyText}>Kategori bulunamadı</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {selectedCategory ? (
        <TouchableOpacity
          style={styles.clearRow}
          onPress={() => onCategorySelect(null)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="close-circle-outline" size={18} color={theme.textSecondary} />
          <Text style={styles.clearRowText}>Seçimi kaldır</Text>
        </TouchableOpacity>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        nestedScrollEnabled>
        {categories.map((category) => {
          const isSelected = selectedCategory?.id === category.id;

          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
              ]}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}>
              <Icon
                name={category.icon_name}
                size={18}
                color={isSelected ? theme.background : theme.textSecondary}
              />
              <Text
                style={[
                  styles.chipLabel,
                  isSelected && styles.chipLabelSelected,
                ]}
                numberOfLines={1}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
