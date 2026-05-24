import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { translateSupabaseError } from '../utils/supabaseErrorMessages';

async function clearPersistedSupabaseAuthKeys(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const keysToRemove = allKeys.filter(
    (key) => key.startsWith('sb-') && key.includes('auth-token'),
  );

  if (keysToRemove.length === 0) {
    return;
  }

  await AsyncStorage.multiRemove(keysToRemove);
}

export async function deleteAccount(): Promise<{ error: string | null }> {
  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
    'delete-account',
    {
      method: 'POST',
    },
  );

  if (error) {
    return {
      error: translateSupabaseError(error, 'Hesap silinirken bir hata oluştu.'),
    };
  }

  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return {
      error: typeof data.error === 'string' ? data.error : 'Hesap silinemedi.',
    };
  }

  await supabase.auth.signOut();
  await clearPersistedSupabaseAuthKeys();

  return { error: null };
}
