import { APP_PUBLISHED_ORIGIN } from '../constants/appLinks';

type AuthApiResponse = {
  ok?: boolean;
  error?: string;
  needsEmailVerification?: boolean;
};

async function postAuthApi(
  path: string,
  body: Record<string, string>,
): Promise<AuthApiResponse> {
  const res = await fetch(`${APP_PUBLISHED_ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let data: AuthApiResponse = {};
  try {
    data = (await res.json()) as AuthApiResponse;
  } catch {
    // ignore parse errors
  }

  if (!res.ok) {
    throw new Error(data.error ?? 'İstek başarısız.');
  }

  return data;
}

export async function signupViaWebApi(params: {
  email: string;
  password: string;
  full_name: string;
  username: string;
}): Promise<{ needsEmailVerification: boolean }> {
  const data = await postAuthApi('/api/auth/signup', params);
  return { needsEmailVerification: data.needsEmailVerification ?? true };
}

export async function requestRecoveryViaWebApi(email: string): Promise<void> {
  await postAuthApi('/api/auth/recovery', { email });
}

export async function resendConfirmationViaWebApi(email: string): Promise<void> {
  await postAuthApi('/api/auth/resend-confirmation', { email });
}
