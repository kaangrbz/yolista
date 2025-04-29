import {supabase} from '../lib/supabase';

interface Route {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category_id: number;
  city_id: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author_id: string;
}

interface Profile {
  username: string;
  full_name: string;
  avatar_url: string;
  is_verified: boolean;
}

export interface RouteWithProfile extends Route {
  profiles: Profile;
}

const RouteModel = {
  async getAllRoutes(): Promise<RouteWithProfile[]> {
    const {data, error} = await supabase
      .from('routes')
      .select(
        `
        id,
        title,
        description,
        image_url,
        category_id,
        city_id,
        is_deleted,
        created_at,
        updated_at,
        author_id,
        profiles (
            username,
            full_name,
            avatar_url,
            is_verified
        )
        `,
      )
      .eq('is_deleted', false);

    console.log('Fetched routes:', data);

    if (error) throw new Error(`Failed to fetch routes: ${error.message}`);
    if (!data) return [];
    // Ensure author is always a single object, not array
    return data.map((route: any) => ({
      ...route,
      author: Array.isArray(route.author) ? route.author[0] : route.author,
    })) as RouteWithProfile[];
  },

  async getRouteById(routeId: string): Promise<RouteWithProfile | null> {
    const {data, error} = await supabase
      .from('routes')
      .select(
        `
        id,
        title,
        description,
        image_url,
        category_id,
        city_id,
        is_deleted,
        created_at,
        updated_at,
        author_id,
        profiles (
          username,
          full_name,
          avatar_url,
          is_verified
        )
      `,
      )
      .eq('id', routeId)
      .single();

    if (error) throw new Error(`Failed to fetch route: ${error.message}`);
    if (!data) return null;
    // Ensure author is always a single object, not array
    return {
      ...data,
      profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
    } as RouteWithProfile;
  },

  async createRoute(routeData: Partial<Route>): Promise<Route> {
    const {data, error} = await supabase
      .from('routes')
      .insert(routeData)
      .single();

    if (error) throw new Error(`Failed to create route: ${error.message}`);
    return data as Route;
  },

  async updateRoute(routeId: string, updates: Partial<Route>): Promise<Route> {
    const {data, error} = await supabase
      .from('routes')
      .update(updates)
      .eq('id', routeId)
      .single();

    if (error) throw new Error(`Failed to update route: ${error.message}`);
    return data as Route;
  },

  async deleteRoute(routeId: string): Promise<Route> {
    const {data, error} = await supabase
      .from('routes')
      .update({is_deleted: true})
      .eq('id', routeId)
      .single();

    if (error) throw new Error(`Failed to delete route: ${error.message}`);
    return data as Route;
  },
};

export default RouteModel;
