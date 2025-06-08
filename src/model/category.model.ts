import { supabase } from '../lib/supabase';
import { CategoryItem } from '../types/category.types';



const CategoryModel = {
  // Function to get followers of a user
async getCategories(searchQuery?: string, limit: number = 999) {
  let query = supabase
    .from('categories')
    .select('*')
    .order('index', { ascending: true })
    .limit(limit);

  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`);
  }

  const { data: categories, error } = await query;

  if (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }

  return categories as CategoryItem[];
},
}

export default CategoryModel;
