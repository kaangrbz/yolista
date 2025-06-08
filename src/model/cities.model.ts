import { supabase } from '../lib/supabase';
import { CityItem } from '../types/city.types';



const CityModel = {
  // Function to get followers of a user
async getCities() {
  const { data: cities, error } = await supabase
    .from('cities')
    .select('*')
    .order('order_index', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    console.error("Error fetching cities:", error);
    throw error;
  }

  return cities as CityItem[];
},
}

export default CityModel;
