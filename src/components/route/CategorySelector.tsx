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
        // Filter out disabled categories
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
      // Deselect if already selected
      onCategorySelect(null);
    } else {
      onCategorySelect(category);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#666" />
        <Text style={styles.loadingText}>Kategoriler yükleniyor...</Text>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="tag-off" size={32} color="#ccc" />
        <Text style={styles.emptyText}>Kategori bulunamadı</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Clear Selection Button */}
      {selectedCategory && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => onCategorySelect(null)}>
          <Icon name="close" size={16} color="#666" />
          <Text style={styles.clearButtonText}>Seçimi Temizle</Text>
        </TouchableOpacity>
      )}

      {/* Categories Grid */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled>
        <View style={styles.grid}>
          {categories.map((category) => {
            const isSelected = selectedCategory?.id === category.id;
            
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  isSelected && styles.categoryItemSelected,
                ]}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.7}>
                
                <View style={[
                  styles.iconContainer,
                  isSelected && styles.iconContainerSelected,
                ]}>
                  <Icon
                    name={category.icon_name}
                    size={24}
                    color={isSelected ? '#fff' : '#666'}
                  />
                </View>
                
                <Text style={[
                  styles.categoryText,
                  isSelected && styles.categoryTextSelected,
                ]}>
                  {category.name}
                </Text>
                
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Icon name="check" size={16} color="#4CAF50" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 300,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  scrollView: {
    maxHeight: 250,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryItemSelected: {
    backgroundColor: '#fff',
    borderColor: '#4CAF50',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainerSelected: {
    backgroundColor: '#4CAF50',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    lineHeight: 18,
  },
  categoryTextSelected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
