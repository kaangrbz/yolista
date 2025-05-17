import { supabase } from '../lib/supabase';

interface Route {
  id?: string;
  title: string;
  description: string;
  image_url: string;
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
  cities: {
    name: string;
  };
}

const RouteModel = {
  async getAllRoutes(): Promise<RouteWithProfile[]> {
    const { data, error } = await supabase
      .from('routes')
      .select(`
    id,
    title,
    description,
    image_url,
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
    ),
    cities (
      name
    )
  `)
      .eq('is_deleted', false)

    if (error) throw new Error(`Failed to fetch routes: ${error.message}`);
    if (!data) return [];
    // Ensure author is always a single object, not array
    return data.map((route: any) => ({
      ...route,
      profiles: Array.isArray(route.profiles) ? route.profiles[0] : route.profiles,
      cities: Array.isArray(route.cities) ? route.cities[0] : route.cities,
    })) as RouteWithProfile[];
  },

  async getAllRoutesByCityId(cityId: number): Promise<RouteWithProfile[]> {
    const { data, error } = await supabase
      .from('routes')
      .select(
        `
        id,
        title,
        description,
        image_url,
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
        cities (
            name
        )
        `,
      )
      .eq('city_id', cityId)
      .eq('is_deleted', false);

    if (error) throw new Error(`Failed to fetch routes: ${error.message}`);
    if (!data) return [];
    // Ensure author is always a single object, not array
    return data.map((route: any) => ({
      ...route,
      profiles: Array.isArray(route.profiles) ? route.profiles[0] : route.profiles,
      cities: Array.isArray(route.cities) ? route.cities[0] : route.cities,
    })) as RouteWithProfile[];
  },

  async getRouteById(routeId: string): Promise<RouteWithProfile | null> {
    const { data, error } = await supabase
      .from('routes')
      .select(
        `
        id,
        title,
        description,
        image_url,
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
      .order('created_at', { ascending: true })
      .single();

    if (error) throw new Error(`Failed to fetch route: ${error.message}`);
    if (!data) return null;
    // Ensure author is always a single object, not array
    return {
      ...data,
      profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
      cities: Array.isArray(data.cities) ? data.cities[0] : data.cities,
    } as RouteWithProfile;
  },

  async getRouteAndBookmarksById(routeId: string): Promise<RouteWithProfile | null> {
    const { data, error } = await supabase
      .from('routes')
      .select(
        `
        id,
        title,
        description,
        image_url,
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
        ),
        cities (
          name
        ),
        bookmarks (
          id,
          route_id,
          order_index,
          created_at,
          updated_at
        ),
        likes (
          count
        )
      `,
      )
      .eq('id', routeId)
      .order('created_at', { ascending: true })
      .single();

    if (error) throw new Error(`Failed to fetch route: ${error.message}`);
    if (!data) return null;
    // Ensure author is always a single object, not array
    return {
      ...data,
      profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
      cities: Array.isArray(data.cities) ? data.cities[0] : data.cities,
      bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [],
    } as RouteWithProfile;
  },

  async createRoute(routeData: Partial<Route>) {
    const { data, error } = await supabase
      .from('routes')
      .insert(routeData)
      .single();

    return { data, error };
  },

  async updateRoute(routeId: string, updates: Partial<Route>): Promise<Route> {
    const { data, error } = await supabase
      .from('routes')
      .update(updates)
      .eq('id', routeId)
      .single();

    if (error) throw new Error(`Failed to update route: ${error.message}`);
    return data as Route;
  },

  async deleteRoute(routeId: string): Promise<{ error: any }> {

    const { error } = await supabase
      .from('routes')
      .delete()
      .eq('id', routeId)

    return { error };
  },
};

export default RouteModel;
