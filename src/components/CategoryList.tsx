import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CategoryItem from './CategoryItem';

interface Category {
  id: number;
  name: string;
  icon?: string;
}

interface CategoryListProps {
  categories: Category[];
  selectedCategory: number | null;
  onCategoryPress: (categoryId: number | null) => void;
  onAddCategory: () => void;
  loading?: boolean;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  selectedCategory,
  onCategoryPress,
  onAddCategory,
  loading,
}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoriesContainer}>
      <CategoryItem
        name="Tümü"
        selected={selectedCategory === 0}
        onPress={() => onCategoryPress(0)}
        icon="view-grid"
        style={styles.allButton}
      />
      {categories.map(category => (
        <CategoryItem
          key={category.id}
          name={category.name}
          selected={selectedCategory === category.id}
          onPress={() => onCategoryPress(category.id)}
          icon={category.icon}
        />
      ))}
      <TouchableOpacity
        style={[styles.categoryButton, styles.addCategoryButton]}
        onPress={onAddCategory}>
        <Icon name="plus" size={24} color="white" />
        <Text style={styles.categoryText}>Öneride Bulun</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  categoriesContainer: {
    flexDirection: 'row',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  loadingText: {
    color: '#666',
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#666',
  },
  addCategoryButton: {
    backgroundColor: '#1DA1F2',
  },
  categoryText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 4,
  },
  allButton: {
    backgroundColor: '#121212dd',
  },
});

export default CategoryList;
