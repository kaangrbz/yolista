export const encodeProfileUsername = (username: string): string => {
  return encodeURIComponent(username.trim());
};

export const decodeProfileUsername = (slug: string): string => {
  try {
    return decodeURIComponent(slug.trim());
  } catch {
    return slug.trim();
  }
};

export type ProfileNavigationParams = {
  username: string;
  currentUserId?: string;
};

export const buildProfileNavigationParams = (input: {
  username: string;
  currentUserId?: string | null;
}): ProfileNavigationParams => {
  const params: ProfileNavigationParams = {
    username: input.username.trim(),
  };

  if (input.currentUserId) {
    params.currentUserId = input.currentUserId;
  }

  return params;
};
