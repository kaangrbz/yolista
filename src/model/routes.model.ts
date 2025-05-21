import { supabase } from '../lib/supabase';
import { showToast } from '../utils/alert';

// Route interface
export interface RoutePoint {
  id?: string;
  client_id?: string; // Make client_id optional
  parent_id?: string;
  city_id?: number;
  user_id?: string;
  title: string;
  description?: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  order_index: number;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Interface for server-side route data (without client_id)
interface ServerRoutePoint extends Omit<RoutePoint, 'client_id'> {
  // All properties from RoutePoint except client_id
}

export interface Profile {
  username: string;
  full_name: string;
  avatar_url: string;
  is_verified: boolean;
}

export interface RouteWithProfile extends RoutePoint {
  profiles: Profile;
  cities: {
    name: string;
  };
}

const RouteModel = {
  async getRoutes(limit?: number, onlyMain?: boolean): Promise<RouteWithProfile[]> {
    const query = supabase
      .from('routes')
      .select(`
          *,
          profiles (
            *
          ),
          cities (
            *
          )
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    //* Fetch only main routes when `onlyMain` is true
    const { data, error } = await (onlyMain ? query.eq('order_index', 0).limit(limit || 20) : query.limit(limit || 20));

    if (error) throw new Error(`Failed to fetch routes: ${error.message}`);
    if (!data) return [];
    // Ensure author is always a single object, not array
    return data.map((route: any) => ({
      ...route,
      profiles: Array.isArray(route.profiles) ? route.profiles[0] : route.profiles,
      cities: Array.isArray(route.cities) ? route.cities[0] : route.cities,
    })) as RouteWithProfile[];
  },
  async getRoutesById(routeId: string): Promise<any> {

    let { data: routes, error } = await supabase
      .from('routes')
      .select('*')
      .or(`id.eq.${routeId},parent_id.eq.${routeId}`)
      .eq('is_deleted', false)
      .order('order_index', { ascending: true });

    // Ensure author is always a single object, not array
    return routes;
  },



  async createRoute(routeData: RoutePoint[]) {
    // Remove client_id from each route object
    const cleanedRouteData: ServerRoutePoint[] = routeData.map(({ client_id, ...rest }) => rest);

    // Önce ana rotayı bul

    const mainRouteData: ServerRoutePoint | undefined = cleanedRouteData.find((route) => route.order_index === 0);

    if (!mainRouteData) {
      showToast('error', 'Ana rotayı bulamadım', 'Hata');
      return { data: null, error: true, message: 'Ana rota bulunamadı.', type: 'find-main-route' };
    }

    // Önce ana rotayı ekle
    const { data: route, error } = await supabase
      .from('routes')
      .insert(mainRouteData)
      .select();

    let mainRouteId = null;
    if (route && route.length > 0) {
      mainRouteId = route[0].id;
    }

    if (error || !route) {
      return { data: route, error, type: 'create-route' };
    }

    if (!mainRouteId) {
      showToast('error', 'Ana rotayı bulamadım', 'Hata');
      return { data: null, error: true, message: 'Ana rota bulunamadı.', type: 'find-main-route' };
    }

    // Diğer rotaların parent_id'sini ana rotanın id'si ile güncelle
    cleanedRouteData.forEach((route) => {
      route.parent_id = mainRouteId;
    });

    // Diğer rotaları ekle
    const { data: routes, error: routesError } = await supabase
      .from('routes')
      .insert(cleanedRouteData.filter((route) => route.order_index !== 0))
      .select();

    if (routesError || !routes) {
      return { data: routes, error: routesError, type: 'create-route' };
    }

    // Eğer bookmarks varsa, bunları da ekle
    // let bookmarksError = null;
    // if (routeData && Array.isArray(routeData) && routeData.length > 0) {
    //   // Her bookmark'a route_id ekle
    //   const bookmarksWithRouteId = routeData.map(b => ({
    //     ...b,
    //     route_id: route[0].id,
    //   }));
    //   const { error: bmError } = await supabase
    //     .from('bookmarks')
    //     .insert(bookmarksWithRouteId);
    //   bookmarksError = bmError;
    // }

    // console.log('bookmarks create', bookmarks, bookmarksError);
    return { data: route, error: error };
  },

  async updateRoute(routeId: string, updates: Partial<RoutePoint>): Promise<RoutePoint> {
    const { data, error } = await supabase
      .from('routes')
      .update(updates)
      .eq('id', routeId)
      .single();

    if (error) throw new Error(`Failed to update route: ${error.message}`);
    return data as RoutePoint;
  },

  async deleteRoute(routeId: string): Promise<{ data: any, error: any }> {
    const { data, error } = await supabase
      .from('routes')
      .update({ is_deleted: true })
      .eq('id', routeId)
      .select()

    if (error) throw new Error(`Failed to delete route: ${error.message}`);
    return { data, error }
  },
};

export default RouteModel;
