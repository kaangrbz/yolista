import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

type StorageListItem = {
  name: string;
  metadata?: Record<string, unknown> | null;
};

const isStorageFile = (item: StorageListItem): boolean => {
  if (!item.metadata) {
    return false;
  }

  return 'size' in item.metadata && typeof item.metadata.size === 'number';
};

const collectFilePaths = async (
  admin: SupabaseClient,
  bucket: string,
  path: string,
): Promise<string[]> => {
  const { data, error } = await admin.storage.from(bucket).list(path, { limit: 1000 });

  if (error || !data?.length) {
    return [];
  }

  const paths: string[] = [];

  for (const item of data as StorageListItem[]) {
    const fullPath = `${path}/${item.name}`;

    if (isStorageFile(item)) {
      paths.push(fullPath);
      continue;
    }

    const nestedPaths = await collectFilePaths(admin, bucket, fullPath);
    paths.push(...nestedPaths);
  }

  return paths;
};

const removeAllUnderUserId = async (
  admin: SupabaseClient,
  bucket: string,
  userId: string,
): Promise<void> => {
  const paths = await collectFilePaths(admin, bucket, userId);

  if (paths.length === 0) {
    return;
  }

  const batchSize = 100;

  for (let index = 0; index < paths.length; index += batchSize) {
    const batch = paths.slice(index, index + batchSize);
    const { error } = await admin.storage.from(bucket).remove(batch);

    if (error) {
      console.error(`Storage remove failed (${bucket}):`, error);
    }
  }
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');

  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Yetkilendirme gerekli' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Sunucu yapılandırması eksik' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Geçersiz oturum' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const buckets = ['profiles', 'headers', 'routes'];

  for (const bucket of buckets) {
    await removeAllUnderUserId(admin, bucket, user.id);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
