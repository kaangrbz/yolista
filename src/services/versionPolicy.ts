import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { resolveVersionGateStatus, type VersionGateStatus } from '../utils/semver';

export type AppVersionPolicy = {
  min_supported_version: string;
  latest_version: string;
  store_url_ios: string | null;
  store_url_android: string | null;
  update_message: string | null;
  block_on_fetch_error: boolean;
};

export type VersionCheckResult = {
  status: VersionGateStatus | 'loading' | 'fetch_error';
  policy: AppVersionPolicy | null;
  currentVersion: string;
};

export async function fetchVersionCheckResult(
  currentVersion: string,
): Promise<VersionCheckResult> {
  const { data, error } = await supabase
    .from('app_version_policy')
    .select(
      'min_supported_version, latest_version, store_url_ios, store_url_android, update_message, block_on_fetch_error',
    )
    .eq('id', 1)
    .maybeSingle();

  if (error || !data) {
    return {
      status: 'fetch_error',
      policy: null,
      currentVersion,
    };
  }

  const policy = data as AppVersionPolicy;
  const gate = resolveVersionGateStatus(
    currentVersion,
    policy.min_supported_version,
    policy.latest_version,
  );

  if (gate === 'invalid_current') {
    return {
      status: policy.block_on_fetch_error ? 'forced_update' : 'valid',
      policy,
      currentVersion,
    };
  }

  return {
    status: gate,
    policy,
    currentVersion,
  };
}

export function resolveStoreUrl(policy: AppVersionPolicy | null): string | null {
  if (!policy) return null;
  return Platform.OS === 'ios'
    ? policy.store_url_ios
    : policy.store_url_android;
}

export function resolveFetchErrorStatus(
  policy: AppVersionPolicy | null,
): VersionGateStatus {
  if (policy?.block_on_fetch_error) {
    return 'forced_update';
  }
  return 'valid';
}
