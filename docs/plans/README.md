# Yolista Mobil — Faz Planları

> **Kapsam:** Sadece `yolista-mobil` (React Native). Web/admin bu belgelerin dışındadır.  
> **Son kod incelemesi:** Mayıs 2026  
> **Ürün odağı:** Rota = çok duraklı foto hikâyesi + coğrafi akış  
> **DB migration kaynağı:** `yolista-web/supabase/migrations/` (tek kaynak)

## Faz sırası

| Faz | Dosya | Durum | Özet |
| --- | --- | --- | --- |
| 0 | [faz-0-tamamlanan-altyapi.md](./faz-0-tamamlanan-altyapi.md) | ✅ Bitti | RN 0.85, tema sistemi, izinler, auth UI |
| 1 | [faz-1-kesif-haritasi.md](./faz-1-kesif-haritasi.md) | ✅ Tamamlandı + cilalandı | Keşif haritası, filtreler, durak seçimi, preview cache |
| 2 | [faz-2-rota-olusturma-konum.md](./faz-2-rota-olusturma-konum.md) | 🟡 ~%95 | Rota oluşturma, konum UX, publish lat/lng + preview, mesafe chip |
| 2b | [faz-2b-gonderi-duzenleme.md](./faz-2b-gonderi-duzenleme.md) | ⬜ Planlandı | Tam wizard edit — foto/sıra/konum/kategori, diff + RouteEditWorker |
| 3 | [faz-3-rota-detay-deneyimi.md](./faz-3-rota-detay-deneyimi.md) | ⬜ Bekliyor | Split view, mesafe, Google Maps export |
| 4 | [faz-4-sosyal-topluluk.md](./faz-4-sosyal-topluluk.md) | ⬜ Bekliyor | Koleksiyon, rozet, freshness |
| 5 | [faz-5-kisisellestirme.md](./faz-5-kisisellestirme.md) | ⬜ Bekliyor | Öneri, hava, saved area |

**Bağımlılık:** Faz 2 publish ile gerçek durak koordinatları keşif haritasına gelir. Koordinat yoksa `RouteDiscoveryService` şehir merkezine fallback yapar. **Faz 2b**, Faz 2 publish worker'ına dayanır — önce Faz 2 kapanışı önerilir.

## Mimari özet (mevcut)

```
CreateRouteStack          ExploreMapScreen           RouteDetailScreen
PhotoSelection     →      MapBottomSheet      →      UniversalPost
StopDetails              RouteDiscoveryService
CategorySelection        mapPreviewImageCache
LocationPicker           128×128 preview upload
```

## Kod referansları

| Alan | Dosya |
| --- | --- |
| Keşif haritası | `src/screens/Explore/ExploreMapScreen.tsx` |
| Viewport sorgu | `src/hooks/useViewportRoutes.ts`, `src/services/RouteDiscoveryService.ts` |
| Geocoding | `src/services/GeocodingService.ts` (forward + reverse) |
| Harita preview cache | `src/utils/mapPreviewImageCache.ts` |
| Oluşturma store | `src/store/createRouteFlowStore.ts` |
| Durak tipi | `RouteStop` in `StopDetailsScreen.tsx` |
| Harita editör | `src/components/route/RouteEditorMap.tsx` |
| Yayın | `src/services/RoutePublishWorker.ts` — lat/lng + `image_preview_url` |
| Migration | `yolista-web/supabase/migrations/` |
| Harita kurulum | `docs/explore-map-setup.md` |

## Eski plan konumu

`.cursor/plans/faz-*.md` dosyaları ilk beyin fırtınası kayıtlarıdır. **Güncel planlar bu klasördedir.**
