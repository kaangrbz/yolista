import type { FetchSocialProfilesPage } from '../components/social/SocialUserListScreen';
import { supabase } from '../lib/supabase';
import { Profile } from '../model/profile.model';
import RouteModel from '../model/routes.model';
import type { SocialUserListRouteParams } from '../types/socialUserList';

const PROFILE_LIST_FIELDS = `
  id,
  username,
  full_name,
  image_url,
  image_preview_url,
  is_verified
`;

function unwrapEmbeddedProfile(
  embedded: Profile | Profile[] | null,
): Profile | null {
  if (Array.isArray(embedded)) {
    return embedded[0] ?? null;
  }

  return embedded;
}

function applyProfileNameSearch<
  Q extends { or: (f: string, o?: { referencedTable?: string }) => Q },
>(query: Q, searchTerm: string): Q {
  const pattern = `%${searchTerm}%`;

  return query.or(
    `username.ilike.${pattern},full_name.ilike.${pattern}`,
    { referencedTable: 'profiles' },
  );
}

function fetchFollowersPage(userId: string): FetchSocialProfilesPage {
  return async (offset, limit, searchQuery) => {
    const hasSearch = searchQuery.length > 0;
    const embedPath = hasSearch
      ? `follower:profiles!follows_follower_id_fkey!inner(${PROFILE_LIST_FIELDS})`
      : `follower:profiles!follows_follower_id_fkey(${PROFILE_LIST_FIELDS})`;

    let query = supabase
      .from('follows')
      .select(embedPath, { count: 'exact' })
      .eq('followed_id', userId)
      .eq('followed_type', 'profile')
      .order('follower_id', { ascending: true });

    if (hasSearch) {
      query = applyProfileNameSearch(query, searchQuery);
    }

    const { data, error, count } = await query.range(
      offset,
      offset + limit - 1,
    );

    if (error) {
      throw error;
    }

    const rows = (data || []) as unknown as {
      follower: Profile | Profile[] | null;
    }[];
    const pageItems = rows
      .map((row) => unwrapEmbeddedProfile(row.follower))
      .filter((profile): profile is Profile => Boolean(profile));

    return {
      items: pageItems,
      totalCount: count ?? 0,
    };
  };
}

function fetchFollowingPage(userId: string): FetchSocialProfilesPage {
  return async (offset, limit, searchQuery) => {
    const hasSearch = searchQuery.length > 0;
    const embedPath = hasSearch
      ? `followed:profiles!follows_followed_id_fkey!inner(${PROFILE_LIST_FIELDS})`
      : `followed:profiles!follows_followed_id_fkey(${PROFILE_LIST_FIELDS})`;

    let query = supabase
      .from('follows')
      .select(embedPath, { count: 'exact' })
      .eq('follower_id', userId)
      .eq('followed_type', 'profile')
      .order('followed_id', { ascending: true });

    if (hasSearch) {
      query = applyProfileNameSearch(query, searchQuery);
    }

    const { data, error, count } = await query.range(
      offset,
      offset + limit - 1,
    );

    if (error) {
      throw error;
    }

    const rows = (data || []) as unknown as {
      followed: Profile | Profile[] | null;
    }[];
    const pageItems = rows
      .map((row) => unwrapEmbeddedProfile(row.followed))
      .filter((profile): profile is Profile => Boolean(profile));

    return {
      items: pageItems,
      totalCount: count ?? 0,
    };
  };
}

function fetchRouteLikersPage(routeId: string): FetchSocialProfilesPage {
  return async (offset, limit, searchQuery) => {
    return RouteModel.getRouteLikersPage({
      routeId,
      offset,
      limit,
      searchQuery,
    });
  };
}

export function createSocialUserListFetchPage(
  params: SocialUserListRouteParams,
): FetchSocialProfilesPage {
  if (params.kind === 'followers') {
    return fetchFollowersPage(params.userId);
  }

  if (params.kind === 'following') {
    return fetchFollowingPage(params.userId);
  }

  return fetchRouteLikersPage(params.routeId);
}
