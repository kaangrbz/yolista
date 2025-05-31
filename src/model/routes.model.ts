import { supabase } from '../lib/supabase';
import { showToast } from '../utils/alert';

// Route interface
export interface RoutePoint {
  id?: string;
  client_id?: string; // Make client_id optional
  parent_id?: string;
  city_id?: number;
  category_id?: number;
  user_id?: string;
  title: string;
  description?: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  order_index: number;
  is_deleted?: boolean;
  is_hidden?: boolean;
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
  image_url: string;
  is_verified: boolean;
}

export interface RouteWithProfile extends RoutePoint {
  profiles: Profile;
  cities: {
    name: string;
  };
  categories: {
    id: number;
    name: string;
    icon_name: string;
  };
  like_count: number;
}

export interface GetRoutesProps {
  limit?: number;
  onlyMain?: boolean;
  userId?: string;
  categoryId?: number;
}

const RouteModel = {
  async getRoutes({ limit = 20, onlyMain = false, userId, categoryId }: GetRoutesProps): Promise<RouteWithProfile[]> {
    const query = supabase
      .from('routes')
      .select(`
          *,
          profiles (
            *
          ),
          cities (
            *
          ),
          categories (
            *
          ),  
          likes(count)
      `)
      .eq('is_deleted', false)
      .eq('is_hidden', false)
      // .eq('order_index', -1) // Todo: bunu kaldir
      .order('created_at', { ascending: false });

    //* Filter routes by user_id if userId is provided
    if (userId) {
      query.eq('user_id', userId);
    }

    if (categoryId) {
      query.eq('category_id', categoryId);
    }

    //* Fetch only main routes when `onlyMain` is true
    const { data, error } = await (onlyMain ? query.eq('order_index', 0).limit(limit) : query.limit(limit));


    if (error) throw new Error(`Failed to fetch routes: ${error.message}`);
    if (!data) return [];
    // Ensure author is always a single object, not array
    return data.map((route: any) => ({
      ...route,
      profiles: Array.isArray(route.profiles) ? route.profiles[0] : route.profiles,
      cities: Array.isArray(route.cities) ? route.cities[0] : route.cities,
      categories: Array.isArray(route.categories) ? route.categories[0] : route.categories,
      like_count: route.likes?.[0].count || 0,
    })) as RouteWithProfile[];
  },

  async getRoutesById(routeId: string, userId?: string): Promise<any> {
    // Step 1: Fetch Routes
    const { data: routes, error: routesError } = await supabase
      .from('routes')
      .select(`
        *,
        profiles (*),
        cities (*),
        categories (*),
        likes(count)
      `)
      .or(`id.eq.${routeId},parent_id.eq.${routeId}`)
      .order('order_index', { ascending: true });
  
    if (routesError) {
      console.error("Error fetching routes:", routesError);
      throw routesError;
    }
  
    if (!routes || routes.length === 0) {
      return [];
    }
  
    // Step 2: Fetch Likes
    const routeIds = routes.map((route: any) => route.id);
  
    const { data: likesData, error: likesError } = await supabase
      .from('likes')
      .select('entity_id, user_id')
      .eq('entity_type', 'route')
      .in('entity_id', routeIds);
  
    if (likesError) {
      console.error("Error fetching likes data:", likesError);
      throw likesError;
    }
  
    // Step 3: Aggregate Likes Count
    const likesCountMap = likesData?.reduce((acc: Record<string, number>, like: any) => {
      acc[like.entity_id] = (acc[like.entity_id] || 0) + 1;
      return acc;
    }, {});
    
    // Step 4: Check if user has liked each route
    let userLikesMap: Record<string, boolean> = {};
    if (userId) {
      userLikesMap = likesData?.reduce((acc: Record<string, boolean>, like: any) => {
        if (like.user_id === userId) {
          acc[like.entity_id] = true;
        }
        return acc;
      }, {});
    }
  
    // Step 5: Format and Return Routes
    const formattedRoutes = routes.map((route: any) => ({
      ...route,
      categories: Array.isArray(route.categories) ? route.categories[0] : route.categories,
      like_count: likesCountMap?.[route.id] || 0,
      did_like: userId ? !!userLikesMap[route.id] : false,
    }));
  
    return formattedRoutes;
  },




  async createRoute(routeData: RoutePoint[], cityId: number, categoryId: number | null) {
    // Remove client_id from each route object
    const cleanedRouteData: ServerRoutePoint[] = routeData.map(({ client_id, ...rest }) => rest);

    // Önce ana rotayı bul

    const mainRoute: ServerRoutePoint | undefined = cleanedRouteData.find((route) => route.order_index === 0);

    if (!mainRoute) {
      showToast('error', 'Ana rotayı bulamadım', 'Hata');
      return { data: null, error: true, message: 'Ana rota bulunamadı.', type: 'find-main-route' };
    }

    mainRoute.city_id = cityId;
    
    console.log("🚀 ~ createRoute ~ categoryId:", categoryId)
    if (categoryId) {
      mainRoute.category_id = categoryId;
    }

    // Önce ana rotayı ekle
    const { data: route, error } = await supabase
      .from('routes')
      .insert(mainRoute)
      .select();

    let mainRouteId = null;
    if (route && route.length > 0) {
      mainRouteId = route[0].id;
    }

    if (error || !route) {
      return { data: route, error, type: 'create-route' };
    }

    if (!mainRouteId) {
      showToast('error', 'Ana rota ekleneemedi, lütfen tekrar deneyin', 'Hata');
      return { data: null, error: true, message: 'Ana rota bulunamadı.', type: 'find-main-route' };
    }

    const otherRoutes = cleanedRouteData.filter((route) => route.order_index !== 0);
    console.log("🚀 ~ createRoute ~ otherRoutes:", otherRoutes)

    // Diğer rotaların parent_id'sini ana rotanın id'si ile güncelle
    otherRoutes.forEach((route) => {
      route.parent_id = mainRouteId;
      route.city_id = undefined;
      route.category_id = undefined;
    });

    // Diğer rotaları ekle
    const { data: routes, error: routesError } = await supabase
      .from('routes')
      .insert(otherRoutes)
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

  async hideRoute(routeId: string): Promise<{ data: any, error: any }> {
    const { data, error } = await supabase
      .from('routes')
      .update({ is_hidden: true })
      .eq('id', routeId)
      .select()

    if (error) throw new Error(`Failed to hide route: ${error.message}`);
    return { data, error }
  },
};

export default RouteModel;
