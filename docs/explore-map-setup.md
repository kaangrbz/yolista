# Keşif Haritası (Faz 1) — Native Kurulum

`react-native-maps` ve `react-native-map-clustering` paketleri package.json'a eklendi.

> **Harita provider stratejisi:** Her iki platformda da `PROVIDER_DEFAULT` + `mapType="none"` + `<UrlTile />` ile **Carto basemaps** (OpenStreetMap verisi) kullanılıyor. Google Maps veya Apple Maps temel katmanı yok → **iOS ve Android için API key gerekmez**, aynı görsel her iki platformda tutarlıdır.

## 1. Paketleri yükle

```bash
yarn install
cd ios && pod install && cd ..
```

> Podfile'da `setup_permissions` listesine `'LocationWhenInUse'` ve `'LocationAccuracy'` eklendi. `pod install` çalıştırılmadan iOS build'inde `react-native-permissions` "No ios.permission.LOCATION_WHEN_IN_USE permission handler detected" hatası verir.
>
> Eğer hâlâ hata alıyorsan Xcode `DerivedData`'yı temizle:
>
> ```bash
> rm -rf ~/Library/Developer/Xcode/DerivedData
> ```

## 2. Android — Konum İzinleri

Google Maps API key **gerekmiyor** (Carto raster tile'larını `UrlTile` üzerinden çekiyoruz). Sadece konum izinleri Android 12+ için her ikisi de declare edilmiş durumda:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### Android API sürüm matrisi

| API | Davranış |
| --- | --- |
| 23+ (Android 6.0) | Runtime permission flow zorunlu; library `check -> request -> BLOCKED Alert` ile yönetir. |
| 29+ (Android 10) | `ACCESS_BACKGROUND_LOCATION` ayrı bir runtime permission. Faz 1 sadece foreground; background ileride incremental request olarak eklenebilir. |
| 31+ (Android 12) | `request(ACCESS_FINE_LOCATION)` dialog'unda kullanıcıya **Precise / Approximate / Deny** seçimi sunulur. Approximate seçilirse FINE denied döner ama COARSE granted olur; library bunu da `granted` kabul eder. |
| 33+ (Android 13) | Foto akışlarında `READ_MEDIA_IMAGES` + `READ_MEDIA_VIDEO` çoklu istek (zaten declare edilmiş). |
| 34+ (Android 14) | `READ_MEDIA_VISUAL_USER_SELECTED` (kısmi foto erişimi) henüz desteklenmiyor — gelecek iş. |
| 37+ (Android 17, geleceğe yönelik) | Yeni "location button" Ekim 2026 enforcement; Faz 5 kapsamında değerlendirilecek. |

## 3. Tile sağlayıcısı (OSM / Carto / Esri)

`src/constants/mapStyles.ts` içinde 3 stil tanımlı (`MAP_STYLE_CYCLE` sırasıyla cycle yapılır):

| Mod | Kaynak | Açıklama |
| --- | --- | --- |
| `light` | Carto basemaps `light_all` | Varsayılan minimal açık tema |
| `dark` | Carto basemaps `dark_all` | Koyu tema |
| `satellite` | Esri World Imagery + Reference labels | Uydu görüntüsü, üzerine şehir/yer adı overlay'i |

`MapStyleToggle` FAB'ı her dokunuşta sırada bir sonraki moda geçer; sadece aktif modun ikonunu gösterir. Yeni stil eklemek için `tileSources`'a entry + `MAP_STYLE_CYCLE`'a item eklemek yeterli.

Bir stilin `overlayUrlTemplate` alanı varsa (örn. satellite), base tile'ın üstüne şeffaf ikinci bir `UrlTile` çizilir — yer isimleri uydu üzerinde okunur kalır.

### Production notları

- Carto basemaps anonim erişime izin verir; attribution UI'da otomatik gösteriliyor.
- Esri World Imagery free tier'ı ücretsizdir ama yüksek trafik için kendi anahtarına geçilmesi önerilir.
- OpenTopoMap volunteer hostlu; production'da kendi caching/proxy katmanı tavsiye edilir.
- Yüksek trafikte rate limit'e takılmamak için MapTiler / Stadia / kendi Carto plan'ına geçilebilir; sadece `urlTemplate`'i değiştirmek yeterli.
- **Lisans gereği attribution kaldırılmamalı** — `mapStyles.ts` her stil için doğru attribution metnini içerir; ekranda otomatik render edilir.

## 3.1. Yer araması (Nominatim)

Search bar OSM Nominatim API'sini kullanır:

- Endpoint: `https://nominatim.openstreetmap.org/search`
- Debounce: 350 ms
- Min query: 2 karakter
- Sonuç tipine göre ikon (şehir, kale/tarihi, park, restoran, otel, default)
- Sonuca tıklayınca: `boundingbox` varsa onunla, yoksa noktaya `ROUTE_FOCUS_ZOOM_DELTA` ile animateToRegion

**Production:**

- Nominatim ana sunucusu max 1 req/sn ve User-Agent zorunlu — geliştirme için OK, production trafiği için **kendi Nominatim instance'ı** ya da **LocationIQ / MapTiler / Mapbox geocoding** alternatifi önerilir.
- Yer arama sağlayıcısını değiştirmek için tek dokunulacak yer: [yolista-mobil/src/services/GeocodingService.ts](../src/services/GeocodingService.ts).

## 3.2. Daha derin stil özgürlüğü (opsiyonel)

`react-native-maps` raster tile çiziyor; Mapbox tarzı vector tile + runtime style istersen `@maplibre/maplibre-react-native` ayrı bir kütüphane olarak entegre edilebilir. Faz 1 kapsamı dışı.

## 4. Build & test

```bash
yarn android
# veya
yarn ios
```

Keşfet sekmesindeki arama çubuğunun yanındaki harita ikonuna tıklayınca `ExploreMap` ekranı açılır.

## 5. İzin kütüphanesi

Tüm izin akışları artık [`src/permissions`](../src/permissions/index.ts) altında. Kısa yollar:

```ts
import {
  requestLocation,
  requestCamera,
  requestPhotos,
  requestMediaLibrary,
  requestPermission,
  checkPermission,
} from '../permissions';

const granted = await requestLocation(); // boolean
const result = await requestPermission('photos'); // 'granted' | 'denied' | 'blocked' | 'unavailable'
```

`BLOCKED` durumunda library otomatik olarak `Alert` açar ve "Ayarları Aç" aksiyonu sunar.

### Gelecek iş

- `ACCESS_BACKGROUND_LOCATION` için ayrı incremental request akışı.
- Android 14 `READ_MEDIA_VISUAL_USER_SELECTED` partial-photo entegrasyonu.
- iOS 14+ `requestLocationAccuracy('preciseLocation')` zorunlu kılma (şu an sadece log).

## 6. Backend TODO

`RouteDiscoveryService.fetchRoutesInBoundingBox` şu an `routes` tablosuna bbox sorgusu atıyor. Performans için `bbox` parametresi alan bir RPC veya REST endpoint eklenirse `RouteDiscoveryService` o yöne çevrilebilir. Mesafe filtresi (`maxDistanceKm`) şu an istemci tarafında haversine ile hesaplanıyor; PostGIS desteği eklenirse server-side yapılabilir.
