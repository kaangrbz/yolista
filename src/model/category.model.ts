import { supabase } from '../lib/supabase';
import { CategoryItem } from '../types/category.types';
import { getCachedCategories } from '../services/categoriesCache';

const CategoryModel = {
  async getCategories(searchQuery?: string, limit: number = 999) {
    // Arama sorgusu yoksa cache'den (stale-while-revalidate) anında dön.
    if (!searchQuery) {
      const cached = await getCachedCategories();
      return cached.slice(0, limit);
    }

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('index', { ascending: true })
      .ilike('name', `%${searchQuery}%`)
      .limit(limit);

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    return categories as CategoryItem[];
  },
};

export default CategoryModel;
