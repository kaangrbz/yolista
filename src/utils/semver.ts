/**
 * Basit semver karşılaştırma: major.minor.patch[-prerelease]
 */

export type ParsedVersion = {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
};

const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:-([\w.]+))?$/;

export function parseVersion(raw: string): ParsedVersion | null {
  const value = raw.trim();
  const match = value.match(VERSION_PATTERN);
  if (!match) return null;

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
  };
}

export function compareVersions(a: string, b: string): number | null {
  const parsedA = parseVersion(a);
  const parsedB = parseVersion(b);
  if (!parsedA || !parsedB) return null;

  if (parsedA.major !== parsedB.major) return parsedA.major - parsedB.major;
  if (parsedA.minor !== parsedB.minor) return parsedA.minor - parsedB.minor;
  if (parsedA.patch !== parsedB.patch) return parsedA.patch - parsedB.patch;

  if (parsedA.prerelease === parsedB.prerelease) return 0;
  if (parsedA.prerelease && !parsedB.prerelease) return -1;
  if (!parsedA.prerelease && parsedB.prerelease) return 1;

  return parsedA.prerelease!.localeCompare(parsedB.prerelease!);
}

export function isVersionLessThan(current: string, target: string): boolean {
  const cmp = compareVersions(current, target);
  return cmp !== null && cmp < 0;
}

export type VersionGateStatus = 'valid' | 'optional_update' | 'forced_update';

export function resolveVersionGateStatus(
  current: string,
  minSupported: string,
  latest: string,
): VersionGateStatus | 'invalid_current' {
  if (!parseVersion(current)) return 'invalid_current';
  if (!parseVersion(minSupported) || !parseVersion(latest)) {
    return 'valid';
  }

  if (isVersionLessThan(current, minSupported)) {
    return 'forced_update';
  }
  if (isVersionLessThan(current, latest)) {
    return 'optional_update';
  }
  return 'valid';
}
