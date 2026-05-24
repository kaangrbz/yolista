import { Profile } from '../model/profile.model';

export function mergeUniqueProfiles(
  existing: Profile[],
  incoming: Profile[],
): Profile[] {
  const seen = new Set(existing.map((profile) => profile.id));
  const merged = [...existing];

  for (const profile of incoming) {
    if (seen.has(profile.id)) {
      continue;
    }

    seen.add(profile.id);
    merged.push(profile);
  }

  return merged;
}
