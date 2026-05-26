# Yolista Mobil — Faz Planları

> **Kapsam:** Sadece `yolista-mobil` (React Native). Web/admin bu belgelerin dışındadır.  
> **Son kod incelemesi:** Mayıs 2026  
> **Ürün odağı:** Rota = çok duraklı foto hikâyesi + coğrafi akış

## Faz sırası

| Faz | Dosya | Durum | Özet |
| --- | --- | --- | --- |
| 0 | [faz-0-tamamlanan-altyapi.md](./faz-0-tamamlanan-altyapi.md) | ✅ Büyük ölçüde bitti | RN 0.85, tema sistemi, izinler, auth UI |
| 1 | [faz-1-kesif-haritasi.md](./faz-1-kesif-haritasi.md) | ✅ Tamamlandı | Keşif haritası, bbox sorgu, bottom sheet, clustering |
| 2 | [faz-2-rota-olusturma-konum.md](./faz-2-rota-olusturma-konum.md) | 🔴 Sırada | Foto↔konum, harita editörü, yayın pipeline |
| 3 | [faz-3-rota-detay-deneyimi.md](./faz-3-rota-detay-deneyimi.md) | ⬜ Bekliyor | Split view, mesafe, Google Maps export |
| 4 | [faz-4-sosyal-topluluk.md](./faz-4-sosyal-topluluk.md) | ⬜ Bekliyor | Koleksiyon, rozet, freshness |
| 5 | [faz-5-kisisellestirme.md](./faz-5-kisisellestirme.md) | ⬜ Bekliyor | Öneri, hava, saved area |

**Kritik bağımlılık:** Faz 2 tamamlanmadan keşif haritasında gerçek durak pinleri ve rota polyline'ları anlamlı olmaz. Şu an `RouteDiscoveryService` koordinat yoksa **şehir merkezine** fallback yapıyor.

## Mimari özet (mevcut)

```
CreateRouteStack          ExploreScreen              RouteDetailScreen
PhotoSelection     →      map toggle        →        UniversalPost
StopDetails              ExploreMapScreen             (feed-style)
CategorySelection        RouteDiscoveryService
FilterScreen             GeocodingService (forward)
                         MapBottomSheet + polyline
```

## Kod referansları

| Alan | Dosya |
| --- | --- |
| Keşif haritası | `src/screens/Explore/ExploreMapScreen.tsx` |
| Viewport sorgu | `src/hooks/useViewportRoutes.ts`, `src/services/RouteDiscoveryService.ts` |
| Yer arama (keşif) | `src/services/GeocodingService.ts` (Nominatim, sadece forward) |
| Oluşturma store | `src/store/createRouteFlowStore.ts` |
| Durak tipi | `RouteStop` in `src/screens/CreateRoute/StopDetailsScreen.tsx` |
| Harita (kullanılmıyor) | `src/components/route/RouteMap.tsx` — StopDetails'e bağlı değil |
| Yayın | `src/services/RoutePublishWorker.ts` — lat/lng **henüz yazılmıyor** |
| Tema | `src/theme/appThemes.ts`, `docs/THEME_COLORS.md` |
| Harita kurulum | `docs/explore-map-setup.md` |

## Eski plan konumu

`.cursor/plans/faz-*.md` dosyaları ilk beyin fırtınası kayıtlarıdır. **Güncel ve mobil-odaklı planlar bu klasördedir.**
