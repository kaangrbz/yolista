# Keşif Haritası (Faz 1) — Native Kurulum

`react-native-maps` ve `react-native-map-clustering` paketleri package.json'a eklendi.

> **Harita provider stratejisi:** Android'de **Google Maps** (`PROVIDER_GOOGLE` + `AndroidManifest` API key), iOS'ta **Apple MapKit** (`PROVIDER_DEFAULT`). Özel raster tile (Carto/Esri) yok; `mapType` ile light / dark / satellite döngüsü kullanılır.

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

## 2. Android — Google Maps & Konum

`AndroidManifest.xml` içinde Google Maps API key tanımlı:

```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_KEY" />
```

Konum izinleri Android 12+ için her ikisi de declare edilmiş durumda:

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
| 29+ (Android 10) | EXIF GPS için `ACCESS_MEDIA_LOCATION` — `requestPhotosWithExif()` / `requestMediaLocation()`. |
| 34+ (Android 14) | `READ_MEDIA_VISUAL_USER_SELECTED` (kısmi foto erişimi) henüz desteklenmiyor — gelecek iş. |
| 37+ (Android 17, geleceğe yönelik) | Yeni "location button" Ekim 2026 enforcement; Faz 5 kapsamında değerlendirilecek. |

## 3. Harita stilleri (native katmanlar)

`src/constants/mapStyles.ts` + `src/constants/mapViewConfig.ts`:

| Mod | Android (Google) | iOS (Apple) |
| --- | --- | --- |
| `light` | `mapType="standard"` | `mapType="standard"` |
| `satellite` | `mapType="hybrid"` (uydu + etiketler) | `mapType="hybrid"` |

`MapStyleToggle` FAB'ı her dokunuşta sıradaki moda geçer. Attribution Google/Apple tarafından harita üzerinde otomatik gösterilir.

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
