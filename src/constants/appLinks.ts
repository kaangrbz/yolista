/** Yayınlanan site ve uygulama deep link kökleri */
export const APP_PUBLISHED_ORIGIN = 'https://yolista.roulista.com';

export const APP_LINK_HOSTS = [
  'yolista.roulista.com',
  'www.yolista.roulista.com',
  'roulista.com',
  'www.roulista.com',
] as const;

export const APP_SCHEME = 'yolista';

export const AUTH_MOBILE_CALLBACK_PATH = '/auth/mobile';

export const getAuthMobileCallbackUrl = (flow: 'recovery' | 'signup' | 'email') => {
  const url = new URL(AUTH_MOBILE_CALLBACK_PATH, APP_PUBLISHED_ORIGIN);
  url.searchParams.set('flow', flow);

  return url.toString();
};

export const getAuthAppDeepLink = (
  path: string,
  params?: Record<string, string>,
): string => {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = new URL(`${APP_SCHEME}://${normalizedPath}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
};

export const isAppLinkHost = (hostname: string): boolean => {
  return (APP_LINK_HOSTS as readonly string[]).includes(hostname);
};
