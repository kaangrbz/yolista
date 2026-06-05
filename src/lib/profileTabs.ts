export type ProfileTabKey = 'grid' | 'list' | 'saved' | 'liked' | 'achievements';

export type ProfileTabDef = {
  key: ProfileTabKey;
  icon: string;
};

export function buildProfileTabs(isOwnProfile: boolean): ProfileTabDef[] {
  const base: ProfileTabDef[] = [
    { key: 'grid', icon: 'grid' },
    { key: 'list', icon: 'format-list-bulleted' },
  ];

  if (isOwnProfile) {
    return [
      ...base,
      { key: 'saved', icon: 'bookmark' },
      { key: 'liked', icon: 'heart' },
      { key: 'achievements', icon: 'trophy' },
    ];
  }

  return [...base, { key: 'achievements', icon: 'trophy' }];
}
