import { APP_SCHEME, isAppLinkHost } from '../constants/appLinks';

export type AuthLinkFlow = 'recovery' | 'signup' | 'email';

export type ParsedAuthLink = {
  flow: AuthLinkFlow;
  email?: string;
  tokenHash?: string;
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  otpToken?: string;
};

const AUTH_PATH_MARKERS = [
  'auth',
  'reset-password',
  'confirm',
  'callback',
  'mobile',
];

const getParam = (
  searchParams: URLSearchParams,
  hashParams: URLSearchParams,
  key: string,
): string | null => {
  return searchParams.get(key) || hashParams.get(key);
};

const resolveFlow = (
  explicitFlow: string | null,
  typeParam: string | null,
  pathHint: string,
): AuthLinkFlow => {
  if (explicitFlow === 'recovery' || explicitFlow === 'signup' || explicitFlow === 'email') {
    return explicitFlow;
  }

  if (typeParam === 'recovery') {
    return 'recovery';
  }

  if (typeParam === 'signup' || typeParam === 'invite') {
    return 'signup';
  }

  if (typeParam === 'email' || typeParam === 'email_change') {
    return 'email';
  }

  if (pathHint.includes('reset-password')) {
    return 'recovery';
  }

  return 'email';
};

const isAuthPath = (pathSegments: string[]): boolean => {
  if (pathSegments.length === 0) {
    return false;
  }

  const joinedPath = pathSegments.join('/');

  return AUTH_PATH_MARKERS.some((marker) => joinedPath.includes(marker));
};

export const parseAuthLink = (rawUrl: string): ParsedAuthLink | null => {
  try {
    const parsedUrl = new URL(rawUrl);
    const isAppScheme = parsedUrl.protocol === `${APP_SCHEME}:`;

    if (!isAppScheme && !isAppLinkHost(parsedUrl.hostname)) {
      return null;
    }

    const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));
    const searchParams = parsedUrl.searchParams;

    const pathSegments = isAppScheme
      ? [parsedUrl.hostname, ...parsedUrl.pathname.split('/').filter(Boolean)]
      : parsedUrl.pathname.split('/').filter(Boolean);

    if (!isAuthPath(pathSegments)) {
      return null;
    }

    const pathHint = pathSegments.join('/');
    const flow = resolveFlow(
      getParam(searchParams, hashParams, 'flow'),
      getParam(searchParams, hashParams, 'type'),
      pathHint,
    );

    const tokenHash = getParam(searchParams, hashParams, 'token_hash') ?? undefined;
    const code = getParam(searchParams, hashParams, 'code') ?? undefined;
    const accessToken = getParam(searchParams, hashParams, 'access_token') ?? undefined;
    const refreshToken = getParam(searchParams, hashParams, 'refresh_token') ?? undefined;
    const email = getParam(searchParams, hashParams, 'email') ?? undefined;
    const otpToken = getParam(searchParams, hashParams, 'token') ?? undefined;

    if (!tokenHash && !code && !accessToken && !otpToken) {
      return null;
    }

    return {
      flow,
      email: email ?? undefined,
      tokenHash,
      code,
      accessToken,
      refreshToken,
      otpToken,
    };
  } catch {
    return null;
  }
};

export const isAuthLink = (rawUrl: string): boolean => {
  return parseAuthLink(rawUrl) !== null;
};
