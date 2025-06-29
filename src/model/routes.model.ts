import { supabase } from '../lib/supabase';
import { showToast } from '../utils/alert';
import NotificationModel from './notifications.model';
import { Profile } from './profile.model';

// Route interface
export interface RoutePoint {
  id?: string;
  client_id: string; // Make client_id optional
  parent_id?: string;
  city_id?: number | null;
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
  did_like: boolean;
}

export interface GetRoutesProps {
  limit?: number;
  onlyMain?: boolean;
  loggedUserId?: string | null;
  userId?: string;
  categoryId?: number;
  searchQuery?: string;
}

const RouteModel = {
  async getRoutes({ limit = 10, onlyMain = false, loggedUserId, userId, categoryId, searchQuery }: GetRoutesProps): Promise<RouteWithProfile[]> {
    // First, get the routes with basic info
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
          )
      `)
      .eq('is_deleted', false)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });

    //* Filter routes by user_id if userId is provided
    if (userId) {
      query.eq('user_id', userId);
    }

    if (categoryId) {
      query.eq('category_id', categoryId);
    }

    if (searchQuery) {
      const filters = searchQuery.split(' ').map((term) => `title.ilike.%${term}%`).join(",");
      query.or(filters);
    }

    //* Fetch only main routes when `onlyMain` is true
    const { data: routes, error } = await (onlyMain ? query.eq('order_index', 0).limit(limit) : query.limit(limit));

    if (error) throw new Error(`Failed to fetch routes: ${error.message}`);
    if (!routes) return [];

    // Get all route IDs (including parent IDs) for the likes query
    const routeIds = routes.map((route: any) => route.id);
    const parentIds = routes
      .filter((route: any) => route.parent_id)
      .map((route: any) => route.parent_id);
    const allIds = [...new Set([...routeIds, ...parentIds])];

    // Fetch likes count and user likes in a single query
    const { data: likesData, error: likesError } = await supabase
      .from('likes')
      .select('entity_id, user_id')
      .eq('entity_type', 'route')
      .in('entity_id', allIds);

    if (likesError) {
      console.error('Error fetching likes:', likesError);
      return routes.map((route: any) => ({
        ...route,
        profiles: Array.isArray(route.profiles) ? route.profiles[0] : route.profiles,
        cities: Array.isArray(route.cities) ? route.cities[0] : route.cities,
        categories: Array.isArray(route.categories) ? route.categories[0] : route.categories,
        like_count: 0,
        did_like: false,
      })) as RouteWithProfile[];
    }

    // Create maps for like counts and user likes
    const likeCountMap = likesData.reduce((acc: Record<string, number>, like: any) => {
      acc[like.entity_id] = (acc[like.entity_id] || 0) + 1;
      return acc;
    }, {});

    const userLikesMap = loggedUserId ? likesData.reduce((acc: Record<string, boolean>, like: any) => {
      if (like.user_id === loggedUserId) {
        acc[like.entity_id] = true;
      }
      return acc;
    }, {}) : {};

    // Process the data to include like count and did_like status
    return routes.map((route: any) => ({
      ...route,
      profiles: Array.isArray(route.profiles) ? route.profiles[0] : route.profiles,
      cities: Array.isArray(route.cities) ? route.cities[0] : route.cities,
      categories: Array.isArray(route.categories) ? route.categories[0] : route.categories,
      like_count: likeCountMap[route.id] || 0,
      did_like: loggedUserId ? !!userLikesMap[route.id] : false,
    })) as RouteWithProfile[];
  },

  async getRoutesById(routeId: string, userId?: string): Promise<any> {
    // Step 1: Fetch Routes
    let { data: routes, error: routesError } = await supabase
      .from('routes')
      .select(`
        *,
        profiles (*),
        cities (*),
        categories (*),
        likes(count)
      `)
      .or(`id.eq.${routeId},parent_id.eq.${routeId}`)
      .eq('is_deleted', false)
      .eq('is_hidden', false)
      .order('order_index', { ascending: true });

    if (routesError) {
      console.error("Error fetching routes:", routesError);
      throw routesError;
    }

    if (!routes || routes.length === 0) {
      return [];
    }

    let mainRoute = routes.find((route: any) => route.order_index === 0);
    if (!mainRoute) {
      // If no main route found, try to find the parent route
      const parentRouteId = routes[0]?.parent_id;
      if (parentRouteId) {
        const { data: parentRoutes, error: parentError } = await supabase
          .from('routes')
          .select(`
            *,
            profiles (*),
            cities (*),
            categories (*),
            likes(count)
          `)
          .or(`id.eq.${parentRouteId},parent_id.eq.${parentRouteId}`)
          .eq('is_deleted', false)
          .eq('is_hidden', false)
          .order('order_index', { ascending: true });

        if (parentError) throw new Error(`Failed to fetch parent route: ${parentError.message}`);
        if (!parentRoutes) return [];

        // Combine the parent routes with the original routes
        const combinedRoutes = [...parentRoutes, ...routes];
        const foundMainRoute = combinedRoutes.find((route: any) => route.order_index === 0);
        if (!foundMainRoute) {
          return [];
        }

        // Update routes for the rest of the function
        routes = combinedRoutes;
        mainRoute = foundMainRoute;
      } else {
        return [];
      }
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

    
    mainRoute.city_id = cityId || null;

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

    // Diğer rotaların parent_id'sini ana rotanın id'si ile güncelle
    otherRoutes.forEach((route) => {
      route.parent_id = mainRouteId;
      route.city_id = undefined;
      route.category_id = undefined;
      route.title = route.title.trim();
      route.description = route.description?.trim();
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

  async likeRoute(routeId: string | undefined, routeOwnerId: string, userId: string | undefined): Promise<{ success: boolean; error?: any; like_count?: number; did_like?: boolean }> {
    if (!routeId) {
      showToast('error', 'Rota bulunamadı', 'Hata');
      return { success: false, error: 'Rota bulunamadı' };
    }

    if (!userId) {
      showToast('error', 'Kullanıcı bulunamadı', 'Hata');
      return { success: false, error: 'Kullanıcı bulunamadı' };
    }

    try {
      const { error } = await supabase
        .from('likes')
        .insert({
          entity_id: routeId,
          user_id: userId,
          entity_type: 'route'
        });

      if (error) throw error;

      //* Send notification to the user
      NotificationModel.createNotification({
        recipientId: routeOwnerId,
        senderId: userId,
        entityType: 'like',
        entityId: routeId,
      });

      // Get updated like count
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact' })
        .eq('entity_id', routeId)
        .eq('entity_type', 'route');

      return {
        success: true,
        like_count: count || 0,
        did_like: true
      };
    } catch (error) {
      console.error('Error liking route:', error);
      return { success: false, error };
    }
  },

  async unlikeRoute(routeId: string | undefined, userId: string | undefined): Promise<{ success: boolean; error?: any; like_count?: number; did_like?: boolean }> {
    if (!routeId) {
      showToast('error', 'Rota bulunamadı', 'Hata');
      return { success: false, error: 'Rota bulunamadı' };
    }

    if (!userId) {
      showToast('error', 'Kullanıcı bulunamadı', 'Hata');
      return { success: false, error: 'Kullanıcı bulunamadı' };
    }

    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .match({
          entity_id: routeId,
          user_id: userId,
          entity_type: 'route'
        });

      if (error) throw error;

      // Get updated like count
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact' })
        .eq('entity_id', routeId)
        .eq('entity_type', 'route');

      return {
        success: true,
        like_count: count || 0,
        did_like: false
      };
    } catch (error) {
      console.error('Error unliking route:', error);
      return { success: false, error };
    }
  },
};

export default RouteModel;
