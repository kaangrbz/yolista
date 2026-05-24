import { supabase } from '../lib/supabase';

export type SavedEntityType = 'route';

export interface SavedCollection {
  id: string;
  owner_user_id: string;
  name: string;
  note: string | null;
  is_default: boolean;
  visibility: 'private' | 'shared';
  created_at: string;
}

interface ToggleCollectionItemParams {
  collectionId: string;
  entityType: SavedEntityType;
  entityId: string;
  userId: string;
}

interface EnsureDefaultCollectionResult {
  collection: SavedCollection;
  created: boolean;
}

export class SaveCollectionsService {
  static async getCollectionsForUser(userId: string): Promise<SavedCollection[]> {
    const { data, error } = await supabase
      .from('saved_collections')
      .select('id, owner_user_id, name, note, is_default, visibility, created_at')
      .eq('owner_user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch saved collections: ${error.message}`);
    }

    return (data || []) as SavedCollection[];
  }

  static async createCollection(userId: string, name: string, note?: string): Promise<SavedCollection> {
    const cleanName = name.trim();
    const cleanNote = note?.trim() || null;

    if (!cleanName) {
      throw new Error('Liste adı boş olamaz.');
    }

    const { data, error } = await supabase
      .from('saved_collections')
      .insert({
        owner_user_id: userId,
        name: cleanName,
        note: cleanNote,
        is_default: false,
      })
      .select('id, owner_user_id, name, note, is_default, visibility, created_at')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Liste oluşturulamadı.');
    }

    return data as SavedCollection;
  }

  static async ensureDefaultCollection(userId: string): Promise<EnsureDefaultCollectionResult> {
    const { data: existingDefault, error: fetchError } = await supabase
      .from('saved_collections')
      .select('id, owner_user_id, name, note, is_default, visibility, created_at')
      .eq('owner_user_id', userId)
      .eq('is_default', true)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Failed to check default collection: ${fetchError.message}`);
    }

    if (existingDefault) {
      return {
        collection: existingDefault as SavedCollection,
        created: false,
      };
    }

    const { data: createdDefault, error: createError } = await supabase
      .from('saved_collections')
      .insert({
        owner_user_id: userId,
        name: 'Kaydedilenler',
        is_default: true,
      })
      .select('id, owner_user_id, name, note, is_default, visibility, created_at')
      .single();

    if (createError || !createdDefault) {
      throw new Error(createError?.message || 'Default liste oluşturulamadı.');
    }

    return {
      collection: createdDefault as SavedCollection,
      created: true,
    };
  }

  static async getCollectionIdsForEntity(userId: string, entityType: SavedEntityType, entityId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('saved_collection_items')
      .select('collection_id, saved_collections!inner(owner_user_id)')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('saved_collections.owner_user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch saved membership: ${error.message}`);
    }

    return (data || []).map((item: any) => item.collection_id);
  }

  static async toggleCollectionItem(params: ToggleCollectionItemParams): Promise<{ isSaved: boolean }> {
    const { collectionId, entityType, entityId, userId } = params;
    const { data: existing, error: lookupError } = await supabase
      .from('saved_collection_items')
      .select('id, collection_id, saved_collections!inner(owner_user_id)')
      .eq('collection_id', collectionId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('saved_collections.owner_user_id', userId)
      .maybeSingle();

    if (lookupError) {
      throw new Error(`Failed to check saved item: ${lookupError.message}`);
    }

    if (existing) {
      const { error: removeError } = await supabase
        .from('saved_collection_items')
        .delete()
        .eq('id', existing.id);

      if (removeError) {
        throw new Error(`Failed to remove from list: ${removeError.message}`);
      }

      return { isSaved: false };
    }

    const { error: insertError } = await supabase
      .from('saved_collection_items')
      .insert({
        collection_id: collectionId,
        entity_type: entityType,
        entity_id: entityId,
        added_by_user_id: userId,
      });

    if (insertError) {
      throw new Error(`Failed to add into list: ${insertError.message}`);
    }

    return { isSaved: true };
  }

  /**
   * Her liste için o listeye en erken eklenen rotanın görseli (liste önizlemesi).
   */
  static async getCollectionFirstItemPreviewUrls(
    collectionIds: string[],
  ): Promise<Record<string, string | null>> {
    if (collectionIds.length === 0) {
      return {};
    }

    const { data: itemRows, error: itemsError } = await supabase
      .from('saved_collection_items')
      .select('collection_id, created_at, entity_id')
      .eq('entity_type', 'route')
      .in('collection_id', collectionIds)
      .order('created_at', { ascending: true });

    if (itemsError) {
      throw new Error(`Failed to fetch collection preview items: ${itemsError.message}`);
    }

    const firstEntityByCollection: Record<string, string> = {};

    for (const row of itemRows || []) {
      const collectionId = row.collection_id as string;
      const entityId = row.entity_id as string;

      if (firstEntityByCollection[collectionId] !== undefined) {
        continue;
      }

      firstEntityByCollection[collectionId] = entityId;
    }

    const routeIds = [...new Set(Object.values(firstEntityByCollection))];

    if (routeIds.length === 0) {
      return {};
    }

    const { data: routeRows, error: routesError } = await supabase
      .from('routes')
      .select('id, image_url')
      .in('id', routeIds);

    if (routesError) {
      throw new Error(`Failed to fetch route previews: ${routesError.message}`);
    }

    const imageByRouteId = (routeRows || []).reduce(
      (acc: Record<string, string | null>, route: { id: string; image_url?: string | null }) => {
        const url = typeof route.image_url === 'string' ? route.image_url.trim() : null;
        acc[route.id] = url || null;

        return acc;
      },
      {},
    );

    const byCollection: Record<string, string | null> = {};

    for (const collectionId of collectionIds) {
      const routeId = firstEntityByCollection[collectionId];

      if (!routeId) {
        byCollection[collectionId] = null;

        continue;
      }

      byCollection[collectionId] = imageByRouteId[routeId] ?? null;
    }

    return byCollection;
  }
}
