# Faz 1 — Keşif Haritası (Mobil)

> **Durum:** ✅ Tamamlandı (Faz 2 gerçek durak koordinatlarına bağlı iyileştirmeler hariç)  
> **Bağımlılık:** Faz 0 (harita altyapısı) ✅

## 1. Ne Anladım

### Problem

Kullanıcılar rotaları sadece liste/grid olarak görüyordu; coğrafi keşif yoktu.

### Mevcut durum (kod incelemesi)

| Bileşen | Durum |
| --- | --- |
| `ExploreMapScreen.tsx` | ✅ Tam ekran harita |
| `ExploreScreen` harita toggle | ✅ Arama çubuğu yanında ikon |
| `RouteDiscoveryService.ts` | ✅ Bbox + kategori + mesafe (client haversine) |
| `useViewportRoutes.ts` | ✅ Debounce'lu viewport sorgu |
| `GeocodingService.ts` | ✅ Forward search (Nominatim) — keşif search bar |
| `MapBottomSheet` | ✅ Durak şeridi + rota listesi (orta kart kaldırıldı) |
| `MapFilterBar` | ✅ Kategori + Yakınım / 5 km / 15 km (GPS + zoom) |
| `MapRouteGroupMarker` | ✅ Preview cache + Android snapshot fix |
| `MapSelectedRouteStops` | ✅ Seçili rotanın durakları; X → sadece ana pin |
| Preview cache | ✅ `mapPreviewImageCache.ts` — pin + bottom sheet |
| Polyline (seçili rota) | ✅ `fetchRouteDetails` → durak lat/lng |
| `MapStyleToggle`, `MyLocationFab`, `MapZoomControls` | ✅ |
| `MapWeatherBadge` | ✅ Bottom sheet'te hava rozeti |
| `MapSearchBar` | ✅ Nominatim autocomplete |
| `react-native-map-clustering` | ❌ Kurulmadı (supercluster tercih edildi) |
| `MapClusterMarker.tsx` | ✅ supercluster ile entegre |
| Gerçek durak koordinatları | ⚠️ Çoğu rota şehir merkezine düşüyor (Faz 2) |

### Olması gereken (kalan — Faz 2+)

- Backend bbox RPC deploy + şehir fallback birleştirme (migration hazır).
- Gerçek durak pinleri ve polyline kalitesi → Faz 2.
- Release APK / TestFlight smoke test checklist'i.

## 2. Yapılacaklar (kalan)

### 2.1. Faz 1 kapanış

- [x] **Clustering:** `supercluster` + `MapClusterMarker` entegrasyonu; aynı koordinat grupları `MapRouteGroupMarker` ile stack.
- [x] **Koordinat kalitesi:** `location_source` (`gps` / `city_center` / `none`); pin'de tahmini konum göstergesi.
- [x] **Empty state:** Viewport'ta rota yokken bottom sheet mesajı + kaydırma ipucu.
- [x] **Performans:** `useViewportRoutes` zoom-göreli delta eşiği.
- [x] **Pin ↔ kart senkron:** Yatay carousel kaydırınca seçili pin vurgusu.
- [ ] **QA:** iOS/Android konum reddedildi, offline tile, seçili rota polyline + durak carousel senkronu (manuel).

### 2.2. Backend (mobil tarafı hazırlık)

- [x] `RouteDiscoveryService.fetchRoutesInBoundingBox` için Supabase RPC taslağı: `routes_in_bbox(min_lat, max_lat, min_lng, max_lng, category_id)`.
- [x] `latitude`/`longitude` NULL olan ana rotalar RPC'den hariç; istemci şehir fallback ile listeler.

## 3. Dosya haritası (mevcut)

```
src/screens/Explore/ExploreMapScreen.tsx     # Ana ekran
src/hooks/useViewportRoutes.ts
src/hooks/useRouteMapClusters.ts
src/services/RouteDiscoveryService.ts
src/utils/routeLocationLabel.ts
src/services/GeocodingService.ts             # Sadece search — reverse yok
src/components/explore/map/
  MapBottomSheet.tsx
  MapFilterBar.tsx
  MapRouteGroupMarker.tsx
  MapClusterMarker.tsx
  MapClusterMarkerWrapper.tsx
  MapRouteMarker.tsx
  MapRouteCard.tsx / MapRouteRow.tsx
  MapSelectedRouteStops.tsx
  MapRouteStopCard.tsx
  MapSearchBar.tsx
  MapStyleToggle.tsx
  MyLocationFab.tsx
  MapZoomControls.tsx
  MapWeatherBadge.tsx
src/constants/mapDefaults.ts
src/constants/mapStyles.ts
src/data/cityCenters.ts                      # Fallback koordinatlar
```

## 4. Dışarıda kalanlar

- Heatmap, time-slider, mevsim modu → Faz 5
- "Takip ettiklerim" harita filtresi → Faz 4
- Haritadan rota oluşturma → Faz 2

## 5. Özet tablo

| Konu | Plan (2026 başı) | Şimdi |
| --- | --- | --- |
| Tam ekran harita | Hedef | ✅ |
| Viewport sorgu | Hedef | ✅ (client-side bbox) |
| Bottom sheet | Hedef | ✅ |
| Polyline | Hedef | ✅ (seçili rota) |
| Clustering kütüphanesi | Hedef | ✅ supercluster |
| Gerçek durak pinleri | — | ⏳ Faz 2'ye bağlı |
| Bbox RPC | TODO | ✅ Taslak + istemci fallback |
