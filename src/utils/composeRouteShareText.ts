export type RouteShareContext = {
  cityName?: string | null;
  categoryName?: string | null;
  stopCount: number;
  stopTitles?: string[];
  authorUsername?: string | null;
  url: string;
  customMessage?: string;
};

const TURKISH_VOWELS = 'aeıioöuüAEIİOÖUÜ';
const TURKISH_FRONT_VOWELS = 'eiöüEIÖÜ';

function formatCityWithLocative(city: string): string {
  const trimmed = city.trim();
  const lower = trimmed.toLocaleLowerCase('tr-TR');

  let lastVowel = '';
  for (let index = lower.length - 1; index >= 0; index -= 1) {
    if (TURKISH_VOWELS.includes(lower[index])) {
      lastVowel = lower[index];
      break;
    }
  }

  const suffix = TURKISH_FRONT_VOWELS.includes(lastVowel) ? 'de' : 'da';
  const lastChar = trimmed[trimmed.length - 1] ?? '';
  const endsWithConsonant = !TURKISH_VOWELS.includes(lastChar);

  if (endsWithConsonant) {
    return `${trimmed}'${suffix}`;
  }

  return `${trimmed}${suffix}`;
}

function buildSummaryLine(
  cityName?: string | null,
  categoryName?: string | null,
  stopCount = 0,
): string {
  const city = cityName?.trim();
  const category = categoryName?.trim();

  if (city && stopCount > 0) {
    return `${formatCityWithLocative(city)} ${stopCount} duraklı bir rota`;
  }

  if (stopCount > 0) {
    return `${stopCount} duraklı bir rota`;
  }

  if (city && category) {
    return `${city} · ${category}`;
  }

  if (city) {
    return `${city} rotası`;
  }

  if (category) {
    return category;
  }

  return "Yolista'da bir rota";
}

function buildStopChain(stopTitles: string[] | undefined, stopCount: number): string | null {
  const trimmedTitles = (stopTitles ?? [])
    .map((title) => title.trim())
    .filter((title) => title.length > 0);

  if (trimmedTitles.length === 0) {
    return null;
  }

  if (stopCount <= 1) {
    return trimmedTitles[0];
  }

  const previewTitles = trimmedTitles.slice(0, 3);
  const chain = previewTitles.join(' → ');

  if (stopCount > 3) {
    return `${chain}...`;
  }

  return chain;
}

export function composeRouteShareBody(
  context: Omit<RouteShareContext, 'url' | 'customMessage'>,
): string {
  const lines: string[] = [
    buildSummaryLine(context.cityName, context.categoryName, context.stopCount),
  ];

  const stopChain = buildStopChain(context.stopTitles, context.stopCount);
  if (stopChain) {
    lines.push(stopChain);
  }

  const authorUsername = context.authorUsername?.trim();
  if (authorUsername) {
    lines.push(`@${authorUsername} önerdi`);
  }

  return lines.join('\n');
}

export function composeRouteShareText(context: RouteShareContext): string {
  const parts: string[] = [];
  const customMessage = context.customMessage?.trim();

  if (customMessage) {
    parts.push(customMessage);
  }

  parts.push(composeRouteShareBody(context));
  parts.push(`Yolista'da keşfet:\n${context.url}`);

  return parts.join('\n\n');
}

export function extractShareMetaFromStops(
  stops: Array<{ title?: string | null; order_index?: number | null }>,
): { stopCount: number; stopTitles: string[] } {
  const sorted = [...stops].sort(
    (left, right) => (left.order_index ?? 0) - (right.order_index ?? 0),
  );

  return {
    stopCount: sorted.length,
    stopTitles: sorted
      .map((stop) => stop.title?.trim() ?? '')
      .filter((title) => title.length > 0),
  };
}
