import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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
      gap: 12,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    loadingText: {
      fontSize: 14,
      color: t.textSecondary,
      marginLeft: 8,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    emptyText: {
      fontSize: 14,
      color: t.textMuted,
      marginTop: 8,
    },
    clearButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'stretch',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surfaceMuted,
    },
    clearButtonText: {
      fontSize: 14,
      color: t.textSecondary,
      fontWeight: '600',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 12,
    },
    card: {
      width: '48%',
      minHeight: 108,
      paddingVertical: 18,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: t.surfaceMuted,
      borderWidth: 1.5,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    cardSelected: {
      backgroundColor: t.chipSelectedBg,
      borderColor: t.chipSelectedBg,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.background,
    },
    iconWrapSelected: {
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
    },
    cardLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: t.textPrimary,
      textAlign: 'center',
    },
    cardLabelSelected: {
      color: t.chipSelectedText,
    },
    checkBadge: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: t.background,
      alignItems: 'center',
      justifyContent: 'center',
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
        const activeCategories = fetchedCategories.filter((cat) => !cat.is_disabled);
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
          style={styles.clearButton}
          onPress={() => onCategorySelect(null)}
          activeOpacity={0.75}>
          <Icon name="close-circle-outline" size={18} color={theme.textSecondary} />
          <Text style={styles.clearButtonText}>Seçimi kaldır</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.grid}>
        {categories.map((category) => {
          const isSelected = selectedCategory?.id === category.id;

          return (
            <TouchableOpacity
              key={category.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.75}>
              {isSelected ? (
                <View style={styles.checkBadge}>
                  <Icon name="check" size={14} color={theme.chipSelectedBg} />
                </View>
              ) : null}

              <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                <Icon
                  name={category.icon_name}
                  size={24}
                  color={isSelected ? theme.chipSelectedText : theme.textSecondary}
                />
              </View>

              <Text
                style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}
                numberOfLines={2}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
