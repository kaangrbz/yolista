import { triggerAchievementChecks } from '../lib/achievements';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/alert';
import NotificationModel from './notifications.model';
import { Profile } from './profile.model';
import { SaveCollectionsService } from '../services/SaveCollectionsService';
import { applyRouteLocationMetadataToStops } from '../utils/applyRouteLocationMetadata';

/** Stored in routes.image_alignment; add variants here when the app starts persisting them. */
export type RouteImageAlignment =
  | 'portrait'
  | 'square'
  | 'landscape'
  | 'unknown';

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
  /** 128×128 center-cropped preview; harita / küçük thumb. */
  image_preview_url?: string | null;
  image_alignment?: RouteImageAlignment | null;
  image_width?: number | null;
  image_height?: number | null;
  latitude?: number;
  longitude?: number;
  /** Reverse geocode / kullanıcı adres özeti (opsiyonel). */
  location_label?: string | null;
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

/** Harita pin kaynağı — Faz 2'de gerçek durak koordinatları `gps` olur. */
export type RouteLocationSource = 'gps' | 'city_center' | 'none';

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
  comment_count: number;
  location_source?: RouteLocationSource;
}

export interface GetRoutesProps {
  limit?: number;
  offset?: number;
  onlyMain?: boolean;
  loggedUserId?: string | null;
  userId?: string;
  categoryId?: number;
  searchQuery?: string;
}

export interface UserRouteCollectionParams {
  userId: string;
  loggedUserId: string | null;
  limit?: number;
  offset?: number;
}

export interface UserRouteCollectionResult {
  items: RouteWithProfile[];
  hasMore: boolean;
}

async function enrichRoutesWithSocial(routes: any[], loggedUserId: string | null): Promise<RouteWithProfile[]> {
  const routeIds = routes.map((route: any) => route.id);
  const parentIds = routes
    .filter((route: any) => route.parent_id)
    .map((route: any) => route.parent_id);
  const allIds = [...new Set([...routeIds, ...parentIds])];

  const { data: commentCounts, error: commentsError } = await supabase
    .rpc('count_comments_by_route_ids', { route_ids: allIds });

  if (commentsError) {
    console.error('Error fetching comment counts:', commentsError);
  }

  const commentCountsMap = commentCounts?.reduce((acc: Record<string, number>, comment: any) => {
    acc[comment.route_id] = comment.comment_count || 0;
    return acc;
  }, {});

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
      comment_count: 0,
    })) as RouteWithProfile[];
  }

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

  return routes.map((route: any) => ({
    ...route,
    profiles: Array.isArray(route.profiles) ? route.profiles[0] : route.profiles,
    cities: Array.isArray(route.cities) ? route.cities[0] : route.cities,
    categories: Array.isArray(route.categories) ? route.categories[0] : route.categories,
    like_count: likeCountMap[route.id] || 0,
    did_like: loggedUserId ? !!userLikesMap[route.id] : false,
    comment_count: commentCountsMap?.[route.id] || 0,
  })) as RouteWithProfile[];
}

const RouteModel = {
  async getRoutes({ limit = 10, offset = 0, onlyMain = false, loggedUserId, userId, categoryId, searchQuery }: GetRoutesProps): Promise<RouteWithProfile[]> {
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
      const terms = searchQuery
        .split(' ')
        .map((term) => term.trim())
        .filter((term) => term.length > 0);

      if (terms.length > 0) {
        const orClauses = terms
          .map((term) => `name.ilike.%${term}%`)
          .join(',');

        const [citiesResult, categoriesResult] = await Promise.all([
          supabase.from('cities').select('id').or(orClauses),
          supabase.from('categories').select('id').or(orClauses),
        ]);

        const matchingCityIds = (citiesResult.data || []).map((row: any) => row.id);
        const matchingCategoryIds = (categoriesResult.data || []).map((row: any) => row.id);

        const orParts: string[] = [];

        terms.forEach((term) => {
          orParts.push(`title.ilike.%${term}%`);
          orParts.push(`description.ilike.%${term}%`);
        });

        if (matchingCityIds.length > 0) {
          orParts.push(`city_id.in.(${matchingCityIds.join(',')})`);
        }

        if (matchingCategoryIds.length > 0) {
          orParts.push(`category_id.in.(${matchingCategoryIds.join(',')})`);
        }

        query.or(orParts.join(','));
      }
    }

    //* Fetch only main routes when `onlyMain` is true
    const { data: routes, error } = await (onlyMain ? query.eq('order_index', 0).range(offset, offset + limit - 1) : query.range(offset, offset + limit - 1));

    console.log('RouteModel.getRoutes - Query result:', { routes: routes?.length || 0, error });

    if (error) {throw new Error(`Failed to fetch routes: ${error.message}`);}
    if (!routes) {return [];}

    return enrichRoutesWithSocial(routes, loggedUserId || null);
  },

  async getRoutesByIdsOrdered(routeIds: string[], loggedUserId: string | null): Promise<RouteWithProfile[]> {
    if (routeIds.length === 0) {
      return [];
    }

    const { data: routes, error } = await supabase
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
      .in('id', routeIds)
      .eq('is_deleted', false)
      .eq('is_hidden', false)
      .eq('order_index', 0);

    if (error) {
      throw new Error(`Failed to fetch routes: ${error.message}`);
    }

    if (!routes?.length) {
      return [];
    }

    const routeById = new Map(routes.map((route: any) => [route.id, route]));
    const ordered: any[] = [];

    for (const id of routeIds) {
      const row = routeById.get(id);

      if (row) {
        ordered.push(row);
      }
    }

    return enrichRoutesWithSocial(ordered, loggedUserId);
  },

  async getLikedRoutesForUser({ userId, loggedUserId, limit = 20, offset = 0 }: UserRouteCollectionParams): Promise<UserRouteCollectionResult> {
    const { data: likeRows, error } = await supabase
      .from('likes')
      .select('entity_id')
      .eq('user_id', userId)
      .eq('entity_type', 'route')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch liked routes: ${error.message}`);
    }

    const rowCount = likeRows?.length ?? 0;

    if (rowCount === 0) {
      return { items: [], hasMore: false };
    }

    const entityIds = [...new Set(likeRows!.map((row) => row.entity_id))];
    const { data: metaRows } = await supabase
      .from('routes')
      .select('id, parent_id')
      .in('id', entityIds);

    const idToMain = new Map((metaRows || []).map((m: any) => [m.id, m.parent_id || m.id]));
    const orderedMainIds: string[] = [];
    const seen = new Set<string>();

    for (const row of likeRows!) {
      const mainId = idToMain.get(row.entity_id) ?? row.entity_id;

      if (!seen.has(mainId)) {
        seen.add(mainId);
        orderedMainIds.push(mainId);
      }
    }

    const items = await RouteModel.getRoutesByIdsOrdered(orderedMainIds, loggedUserId);

    return {
      items,
      hasMore: rowCount === limit,
    };
  },

  async getSavedCollections(userId: string) {
    return SaveCollectionsService.getCollectionsForUser(userId);
  },

  async getSavedCollectionItemIds(userId: string, routeId: string) {
    return SaveCollectionsService.getCollectionIdsForEntity(userId, 'route', routeId);
  },

  async createSavedCollection(userId: string, name: string, note?: string) {
    return SaveCollectionsService.createCollection(userId, name, note);
  },

  async ensureDefaultSavedCollection(userId: string) {
    return SaveCollectionsService.ensureDefaultCollection(userId);
  },

  async toggleSavedCollectionItem(userId: string, collectionId: string, routeId: string) {
    const result = await SaveCollectionsService.toggleCollectionItem({
      collectionId,
      entityType: 'route',
      entityId: routeId,
      userId,
    });

    if (result.isSaved) {
      const { data: routeRow } = await supabase
        .from('routes')
        .select('user_id')
        .eq('id', routeId)
        .maybeSingle();
      const ownerId = routeRow?.user_id as string | undefined;
      triggerAchievementChecks([userId, ownerId].filter(Boolean) as string[]);
    }

    return result;
  },

  async getSavedRoutesForUser({ userId, loggedUserId, limit = 20, offset = 0 }: UserRouteCollectionParams): Promise<UserRouteCollectionResult> {
    try {
      const { data: savedRows, error } = await supabase
        .from('saved_collection_items')
        .select('entity_id, saved_collections!inner(owner_user_id)')
        .eq('entity_type', 'route')
        .eq('saved_collections.owner_user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('getSavedRoutesForUser:', error);
        const { data: fallbackRows, error: fallbackError } = await supabase
          .from('saved_routes')
          .select('route_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (fallbackError) {
          console.error('getSavedRoutesForUser fallback:', fallbackError);
          return { items: [], hasMore: false };
        }

        const fallbackCount = fallbackRows?.length ?? 0;
        if (fallbackCount === 0) {
          return { items: [], hasMore: false };
        }

        const fallbackRouteIds = fallbackRows!.map((row) => row.route_id);
        const fallbackItems = await RouteModel.getRoutesByIdsOrdered(fallbackRouteIds, loggedUserId);

        return {
          items: fallbackItems,
          hasMore: fallbackCount === limit,
        };
      }

      const rowCount = savedRows?.length ?? 0;

      if (rowCount === 0) {
        return { items: [], hasMore: false };
      }

      const routeIds = savedRows!.map((row: any) => row.entity_id);
      const { data: metaRows } = await supabase
        .from('routes')
        .select('id, parent_id')
        .in('id', routeIds);

      const idToMain = new Map((metaRows || []).map((m: any) => [m.id, m.parent_id || m.id]));
      const orderedMainIds: string[] = [];
      const seen = new Set<string>();

      for (const rid of routeIds) {
        const mainId = idToMain.get(rid) ?? rid;

        if (!seen.has(mainId)) {
          seen.add(mainId);
          orderedMainIds.push(mainId);
        }
      }

      const items = await RouteModel.getRoutesByIdsOrdered(orderedMainIds, loggedUserId);

      return {
        items,
        hasMore: rowCount === limit,
      };
    } catch (err) {
      console.error('getSavedRoutesForUser:', err);

      return { items: [], hasMore: false };
    }
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
      console.error('Error fetching routes:', routesError);
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

        if (parentError) {throw new Error(`Failed to fetch parent route: ${parentError.message}`);}
        if (!parentRoutes) {return [];}

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
      console.error('Error fetching likes data:', likesError);
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

    const enriched = await enrichRoutesWithSocial(formattedRoutes, userId || null);

    return applyRouteLocationMetadataToStops(enriched);
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

    let mainRouteId: string | null = null;
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
      route.parent_id = mainRouteId ?? undefined;
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

    if (error) {throw new Error(`Failed to update route: ${error.message}`);}
    return data as RoutePoint;
  },

  async deleteRoute(routeId: string): Promise<{ data: any, error: any }> {
    const { data, error } = await supabase
      .from('routes')
      .update({ is_deleted: true })
      .eq('id', routeId)
      .select();

    if (error) {throw new Error(`Failed to delete route: ${error.message}`);}
    return { data, error };
  },

  async hideRoute(routeId: string): Promise<{ data: any, error: any }> {
    const { data, error } = await supabase
      .from('routes')
      .update({ is_hidden: true })
      .eq('id', routeId)
      .select();

    if (error) {throw new Error(`Failed to hide route: ${error.message}`);}
    return { data, error };
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
          entity_type: 'route',
        });

      if (error) {throw error;}

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

      triggerAchievementChecks([userId, routeOwnerId]);

      return {
        success: true,
        like_count: count || 0,
        did_like: true,
      };
    } catch (error) {
      console.error('Error liking route:', error);
      return { success: false, error };
    }
  },

  async getRouteLikersPage(params: {
    routeId: string;
    offset: number;
    limit: number;
    searchQuery?: string;
  }): Promise<{ items: Profile[]; totalCount: number }> {
    const { routeId, offset, limit, searchQuery = '' } = params;
    const hasSearch = searchQuery.length > 0;

    if (!hasSearch) {
      const { data: likeRows, error: likesError, count } = await supabase
        .from('likes')
        .select('user_id', { count: 'exact' })
        .eq('entity_id', routeId)
        .eq('entity_type', 'route')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (likesError) {
        console.error('Error fetching route likers (likes):', likesError);
        throw likesError;
      }

      const userIds = (likeRows || [])
        .map((row: { user_id: string }) => row.user_id)
        .filter(Boolean);

      if (userIds.length === 0) {
        return {
          items: [],
          totalCount: count ?? 0,
        };
      }

      const { data: profileRows, error: profilesError } = await supabase
        .from('profiles')
        .select(
          'id, username, full_name, image_url, image_preview_url, is_verified',
        )
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching route likers (profiles):', profilesError);
        throw profilesError;
      }

      const profileById = new Map(
        (profileRows || []).map((row: Profile) => [row.id, row]),
      );

      const items = userIds
        .map((userId) => profileById.get(userId))
        .filter((profile): profile is Profile => Boolean(profile));

      return {
        items,
        totalCount: count ?? 0,
      };
    }

    const pattern = `%${searchQuery}%`;
    const embed =
      'profiles!inner(id,username,full_name,image_url,image_preview_url,is_verified)';

    const { data, error, count } = await supabase
      .from('likes')
      .select(embed, { count: 'exact' })
      .eq('entity_id', routeId)
      .eq('entity_type', 'route')
      .or(`username.ilike.${pattern},full_name.ilike.${pattern}`, {
        referencedTable: 'profiles',
      })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching route likers (search):', error);
      throw error;
    }

    const rows = data || [];

    const items = rows
      .map((row: { profiles: Profile | Profile[] | null }) => {
        const embedded = row.profiles;

        if (Array.isArray(embedded)) {
          return embedded[0] ?? null;
        }

        return embedded;
      })
      .filter((profile): profile is Profile => Boolean(profile));

    return {
      items,
      totalCount: count ?? 0,
    };
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
          entity_type: 'route',
        });

      if (error) {throw error;}

      // Get updated like count
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact' })
        .eq('entity_id', routeId)
        .eq('entity_type', 'route');

      return {
        success: true,
        like_count: count || 0,
        did_like: false,
      };
    } catch (error) {
      console.error('Error unliking route:', error);
      return { success: false, error };
    }
  },
};

export default RouteModel;
