import type { RouteWithProfile } from '../model/routes.model';

/** Keşif kartları ve listeler için — artık `route.title` (ipucu) kullanılmaz. */
export function getRouteDisplayLabel(route: RouteWithProfile): string {
  const city = route.cities?.name?.trim();
  const category = route.categories?.name?.trim();

  if (city && category) {
    return `${city} · ${category}`;
  }

  if (city) {
    return city;
  }

  if (category) {
    return category;
  }

  return 'Rota';
}

/** Paylaşım metni için kısa etiket */
export function getRouteShareLabel(route: {
  cities?: { name?: string | null } | null;
  categories?: { name?: string | null } | null;
}): string {
  const city = route.cities?.name?.trim();
  const category = route.categories?.name?.trim();

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
