import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Category } from '../../screens/CreateRoute/CategorySelectionScreen';
import CategoryModel from '../../model/category.model';
import { appTheme } from '../../theme/appTheme';

interface CategorySelectorProps {
  selectedCategory: Category | null;
  onCategorySelect: (category: Category | null) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onCategorySelect,
}) => {
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
        <ActivityIndicator size="small" color={appTheme.textSecondary} />
        <Text style={styles.loadingText}>Kategoriler yükleniyor…</Text>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="tag-off" size={28} color={appTheme.borderStrong} />
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
          <Icon name="close-circle-outline" size={18} color={appTheme.textSecondary} />
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
                color={isSelected ? appTheme.background : appTheme.textSecondary}
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

const styles = StyleSheet.create({
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
    color: appTheme.textSecondary,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  emptyText: {
    fontSize: 14,
    color: appTheme.textMuted,
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
    color: appTheme.textSecondary,
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
    backgroundColor: appTheme.surfaceMuted,
    borderWidth: 1,
    borderColor: appTheme.border,
    maxWidth: 200,
  },
  chipSelected: {
    backgroundColor: appTheme.accent,
    borderColor: appTheme.accent,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: appTheme.textPrimary,
    flexShrink: 1,
  },
  chipLabelSelected: {
    color: appTheme.background,
    fontWeight: '600',
  },
});
