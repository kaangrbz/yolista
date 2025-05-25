import { supabase } from '../lib/supabase';
import { CategoryItem } from '../types/category.types';



const CategoryModel = {
  // Function to get followers of a user
async getCategories(limit: number = 999) {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .limit(limit);

  if (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }

  return categories as CategoryItem[];
},
}

export default CategoryModel;
