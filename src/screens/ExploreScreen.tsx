import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, ListRenderItem, RefreshControl } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CategoryItem } from '../types/category.types';
import CategoryModel from '../model/category.modal';
import { ExploreHeader } from '../components/header/Header';
import GlobalFloatingAction from '../components/common/GlobalFloatingAction';
import RouteModel, { RouteWithProfile, GetRoutesProps } from '../model/routes.model';
import { navigate, PageName } from '../types/navigation';
import { useNavigation } from '@react-navigation/native';

const NUM_COLUMNS = 2;
const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 4) / NUM_COLUMNS; // 3 items per row with 2px gap

// Types

interface ExploreItem {
  id: string;
  image: string;
  likes: number;
  title: string;
  location: string;
}

// Mock data - replace with your actual data source

/*
Array(15).fill(0).map((_, index) => ({
  id: String(index + 1),
  image: `https://picsum.photos/500/500?random=${index}`,
  likes: Math.floor(Math.random() * 1000) + 100,
  title: `Amazing Route ${index + 1}`,
  location: `City ${String.fromCharCode(65 + (index % 5))}`,
}))
*/

const ExploreScreen = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [routes, setRoutes] = useState<RouteWithProfile[]>([]);
  const [activeCategory, setActiveCategory] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadTimeout, setLoadTimeout] = useState<NodeJS.Timeout | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const _categories = await CategoryModel.getCategories();
        let categories: CategoryItem[] = [];

        categories.push({
          id: 'all',
          name: 'Popüler',
          icon_name: 'trending-up',
          description: 'Popüler Rotalar',
          index: 0,
        });

        _categories.forEach((category) => {
          categories.push({
            id: category.id,
            name: category.name,
            icon_name: category.icon_name,
            description: category.description,
            index: category.index,
          });
        });

        setCategories(categories.sort((a, b) => a.index - b.index));
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const fetchExploreItems = async () => {
    if (loadTimeout) {
      clearTimeout(loadTimeout);
    }
    setIsLoading(true);
    try {
      let props: GetRoutesProps = { limit: 20, onlyMain: true, categoryId: Number(activeCategory) }
      const routes = await RouteModel.getRoutes(props);
      setRoutes(routes);
    } catch (error) {
      console.error('Error fetching explore items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {

    fetchExploreItems();

    return () => {
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }
    }
  }, [activeCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExploreItems();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const renderCategoryItem: ListRenderItem<CategoryItem> = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        activeCategory === item.id && styles.activeCategoryItem,
      ]}
      onPress={() => setActiveCategory(item.id)}
    >
      <Icon
        name={item.icon_name}
        size={20}
        color={activeCategory === item.id ? '#fff' : '#333'}
        style={styles.categoryIcon}
      />
      <Text
        style={[
          styles.categoryText,
          activeCategory === item.id && styles.activeCategoryText,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderExploreItem: ListRenderItem<RouteWithProfile> = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.exploreItem,
        { marginRight: (index + 1) % 3 === 0 ? 0 : 2 },
      ]}
      activeOpacity={0.8}
      onPress={() => navigate(navigation, PageName.RouteDetail, { routeId: item.id })}
    >
      <Image source={{ uri: item.image_url || 'https://picsum.photos/300/300?random=' + item.id }} style={styles.exploreImage} />
      <View style={styles.overlay}>
        <View style={styles.likeContainer}>
          <Icon name="heart" size={16} color="#fff" />
          <Text style={styles.likeCount}>{item?.like_count?.toLocaleString()}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.locationContainer}>
            <Icon name="map-marker" size={12} color="#fff" />
            <Text style={styles.locationText} numberOfLines={1}>{item.cities.name}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ExploreHeader onSearch={() => console.log('search')} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rota, Yer, Kategori, Şehir Ara.."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Explore Grid */}
      {
        isLoading &&  (
          <ActivityIndicator size="small" style={{ flex: 1 }} color="#000" />
        )
      }

      {
        !isLoading && routes.length > 0 && (
          <FlatList
            data={routes}
            renderItem={renderExploreItem}
            onRefresh={onRefresh}
            refreshing={refreshing}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#333', '#121212']}
                tintColor="#000000"
                titleColor="#000000"
              />
            }
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.exploreList}
            showsVerticalScrollIndicator={false}
          />
        )
      }

      {/* No Routes alert */}
      {
        routes.length === 0 && !isLoading && activeCategory === 0 && (
          <View style={styles.noRoutesContainer}>
            <Text style={styles.noRoutesText}>Hiç Rota Bulunamadı</Text>
          </View>
        )
      }
      
      {
        routes.length === 0 && !isLoading && activeCategory !== 0 && (
          <View style={styles.noRoutesContainer}>
            <Text style={styles.noRoutesText}>Bu kategoride hiç rota bulunamadı</Text>
          </View>
        )
      }
      <GlobalFloatingAction />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#000',
    fontSize: 16,
  },
  noRoutesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  noRoutesText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoriesList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  activeCategoryItem: {
    backgroundColor: '#000',
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#fff',
  },
  exploreList: {
    padding: 1,
  },
  columnWrapper: {
    marginBottom: 2,
  },
  exploreItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    backgroundColor: '#F5F5F5',
    position: 'relative',
    overflow: 'hidden',
  },
  exploreImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 8,
    justifyContent: 'space-between',
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  likeCount: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    padding: 6,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 2,
    opacity: 0.9,
  },
});

export default ExploreScreen;