# Faz 2 — Rota Oluşturma & Konum UX (Mobil)

> **Durum:** 🟡 Devam ediyor — harita editörü + konum atama UX  
> **Bağımlılık:** Faz 0 ✅ | Faz 1 keşif haritası koordinat verisi için Faz 2 publish şart

## Henüz yapılmayan / bilinen eksikler (Mayıs 2026)

| # | Konu | Not |
| --- | --- | --- |
| 1 | `LocationPickerScreen` | ✅ Modal route — crosshair harita, adres arama, konumumu kullan |
| 2 | Harita zoom davranışı | ✅ Konum atarken mevcut zoom korunur (`ROUTE_ASSIGN_PRESERVE_ZOOM_MAX_DELTA` üstüne çıkılmaz; çok zoom-out ise `ROUTE_FOCUS_ZOOM_DELTA`'ya yakınlaştırılır). |
| 3 | Maks durak sayısı | ✅ `MAX_ROUTE_STOPS = 20` (`routeContentLimits.ts`). |
| — | EXIF otomasyonu | Bilinçli olarak kaldırıldı; ileride `includeExtra` veya ayrı servis ile değerlendirilecek. |

## 0. Domain notu (ürün gerçeği)

> **Start/stop veya navigasyon rotası yok.** Her fotoğraf bağımsız bir **konumlu nokta** (lat/lng).  
> Kullanıcı oluştururken sadece “bu fotoğraf nerede çekildi / temsil ediyor?” sorusunu cevaplar.  
> **Rota çizgisi (polyline, sıra, mesafe)** oluşturma akışının **sonunda** veya ayrı bir adımda belirlenecek — şimdilik publish’te sadece nokta koordinatları yazılır.

| Kavram | Ne değil | Ne |
| --- | --- | --- |
| `RouteStop` (kod adı) | Başlangıç/bitiş durağı | Fotoğraf + opsiyonel metin + opsiyonel konum |
| `order_index` | Rota güzergâh sırası | Carousel / slide sırası (parent_id altında kardeş kayıtlar) |
| `latitude` / `longitude` | Rota geometrisi | Tek fotoğrafın nokta konumu |
| Keşif haritası polyline | Kesin rota yolu | Faz 3+ önizleme; noktalar arası bağ henüz “rota” değil |

**Publish (Faz 2.1):** Her slide için `latitude`, `longitude`, opsiyonel `location_label` — rota path hesaplanmaz.

## 1. Ne Anladım

### Problem

Uygulamanın asıl amacı **rota**. Her fotoğraf bir durağı temsil etmeli; kullanıcı konum atamadan rota anlamını yitiriyor. Mevcut akışta:

- `StopDetailsScreen` sadece carousel + `StopForm` (açıklama + gelişmiş ipucu).
- `RouteMap.tsx` yazılmış ama **hiçbir ekrana bağlı değil**.
- `StopForm` konum **gösteriyor** ama "konum ekle" CTA yok.
- `RoutePublishWorker` → `RoutePoint` oluştururken `latitude`/`longitude` **aktarmıyor**.
- `GeocodingService` sadece forward search; reverse geocode yok.
- EXIF GPS okuma yok.

### Olması gereken

**Ana layout: Harita + Zaman Çizelgesi (Map + Timeline)**

```
┌─────────────────────────────────────┐
│  Detaylar          3/5 konum ✓      │
├─────────────────────────────────────┤
│         [ İNTERAKTİF HARİTA ]       │  ~%40–45 ekran
│    ①  ②  ③  nokta marker (polyline opsiyonel / son adım) │
├─────────────────────────────────────┤
│ [📷1✓] [📷2●] [📷3 ] [📷4 ]         │  yatay foto şeridi
├─────────────────────────────────────┤
│  Durak 2 · açıklama / ipucu / konum │
└─────────────────────────────────────┘
```

**Etkileşim kuralları**

| Aksiyon | Sonuç |
| --- | --- |
| Foto şeridinde kare seç | Aktif durak; haritada kırmızı marker |
| Haritada boş yere dokun | Aktif fotoğrafa konum atanır |
| Mevcut marker'a dokun | O durağa geç; form güncellenir |
| "Konum ekle" | Tam ekran Konum Seç modalı |

**İki mod toggle:** `[ Konumlandır ]` / `[ Detaylar ]`

- **Konumlandır:** Harita tam etkileşimli; alt panel minimal (foto şeridi + adres özeti).
- **Detaylar:** Harita salt okunur; uzun açıklama + gelişmiş seçenekler (fotoğraf ipucu) odaklı form.

**Konum Seç modalı (3 yol)**

1. Haritadan seç — sabit crosshair, pan ile konum, reverse geocode alt panelde.
2. Adres arama — `GeocodingService` autocomplete (keşif haritasındaki `MapSearchBar` reuse).
3. EXIF — foto GPS varsa banner: "Bu fotonun konumu bulundu — Kullan / Yoksay".

## 2. Mevcut kod (başlangıç noktaları)

| Dosya | Not |
| --- | --- |
| `StopDetailsScreen.tsx` | Entegrasyon hedefi |
| `StopForm.tsx` | Konum CTA + mini harita preview eklenecek |
| `RouteMap.tsx` | Refactor → `RouteEditorMap` veya StopDetails'e gömülü harita |
| `createRouteFlowStore.ts` | `setStopLocation`, `reorderStops` action'ları |
| `RouteStop.coordinate` + `address` | Tip zaten var |
| `RoutePublishWorker.ts` | lat/lng mapping **eksik** |
| `routes.model.ts` `RoutePoint` | `latitude`/`longitude` alanları DB'de destekleniyor |
| `GeocodingService.ts` | `reverseGeocode()` eklenecek |
| `ExploreMapScreen` tile/harita kalıbı | Carto tile reuse |

## 3. Yapılacaklar listesi

### Metin semantiği (uygulandı)

| DB kolonu | Anlam | Zorunlu? |
| --- | --- | --- |
| `title` | Kısa **fotoğraf ipucu** — carousel overlay (2sn auto-show + ⓘ) | Hayır |
| `description` | Uzun **açıklama** — feed caption (ana rota), harita durak kartı | Hayır |

- Tek fotoğraf paylaşımı desteklenir; ipucu/açıklama/konum zorunlu değil.
- Keşif kartları `route.title` göstermez → `getRouteDisplayLabel()` (şehir · kategori).

### 3.1. Veri & publish pipeline (öncelik 1)

- [x] `RoutePublishWorker`: `stop.coordinate` → `RoutePoint.latitude/longitude`.
- [x] `location_label` kolonu migration (`20260530130000_route_stop_locations.sql`); `stop.address` publish'te yazılır.
- [x] `createRouteFlowStore`:
  - `setStopLocation(stopId, { latitude, longitude, address? })`
  - `clearStopLocation(stopId)`
  - `reorderPhotos` → routeStops foto sırasıyla senkron
  - Draft autosave konum değişikliklerini yazıyor (`routeStops` zaten draft'ta)
- [ ] Yayın sonrası keşif haritasında gerçek pin doğrulama testi.

### 3.2. Servisler

- [x] `GeocodingService.reverseGeocode({ latitude, longitude })` → `{ formattedAddress, shortName }`
- [ ] EXIF otomasyonu — ertelendi (`includeExtra` / ayrı servis değerlendirilecek)
- [x] `useReverseGeocode.ts` — koordinat değişiminde debounce (350ms).
- [x] `useAddressSearch.ts` — forward search hook (keşif `MapSearchBar` mantığı paylaşımı).

### 3.3. Bileşenler

- [x] `RouteEditorMap.tsx` — nokta marker, tıkla-atama, polyline yok
- [x] `StopPhotoStrip.tsx` — yatay thumbnail şeridi, konum badge (✓)
- [x] `StopMiniMap.tsx` — durak kartında statik mini preview.
- [x] `LocationSearchBar.tsx` — modal içi autocomplete.
- [x] `WizardStepIndicator.tsx` — Foto → Detay → Kategori adımları.
- [x] `StopReorderList.tsx` — sürükle-bırak (`react-native-draggable-flatlist@^4`).
- [x] `LocationProgressChip.tsx` — "3/5 konum" üst chip.
- [ ] `ExifLocationBanner.tsx` — EXIF ertelendi

### 3.4. Ekranlar

- [x] `LocationPickerScreen.tsx` — modal route, param: `stopId`.
  - Crosshair harita, search bar, "Konumumu kullan", Onayla.
- [x] `StopDetailsScreen.tsx` güncellemesi:
  - Harita + foto şeridi layout.
  - Konumlandır / Detaylar toggle.
  - Seçili fotoğrafa haritadan dokunarak konum atama (placementMode kaldırıldı).
  - [x] "Sıralamayı düzenle" → bottom sheet + `StopReorderList`.
  - [ ] "Hepsine aynı bölgeyi ata" hızlı işlem (bottom sheet).
- [x] `StopForm.tsx`:
  - Uzun açıklama (opsiyonel) + `StopAdvancedOptions` accordion (fotoğraf ipucu, remiks stub).
  - Boş durum: belirgin "Konum ekle" CTA.
  - Dolu durum: koordinat + adres + "Kaldır".
- [x] `CreateRouteStack.tsx` — `LocationPicker` modal route.

### 3.4. Bağımlılıklar

- [x] `react-native-draggable-flatlist@^4.x`
- [x] Maks durak: `MAX_ROUTE_STOPS = 20`

### 3.5. QA

- [ ] EXIF yok / bozuk foto — ertelendi.
- [ ] Reverse geocode timeout → koordinatla devam.
- [ ] 20 durak performansı.
- [ ] Sürükle-bırak ↔ carousel `currentStopIndex` tutarlılığı.
- [ ] Konum atamadan yayın (opsiyonel konum mu zorunlu mu — ürün kararı; şimdilik opsiyonel + uyarı chip).
- [ ] Tek fotoğraf, metinsiz publish.
- [ ] Çok slide, karışık ipucu var/yok; carousel 2sn timer slide atlama.
- [ ] Eski `title` dolu kayıtlar feed'de ipucu overlay'de görünür, kart başlığında değil.

## 4. Faz 2.5 (hemen sonrası, aynı epic)

- [ ] Mesafe özeti chip: "Toplam ~X km" (haversine, publish öncesi preview).
- [ ] "Tüm rotayı önizle" mini harita fullscreen.
- [ ] Video durağı, sesli not, maliyet/süre alanları — ayrı mini-faz.

## 5. Dışarıda kalanlar

- Google Maps export → Faz 3
- Rota detay split view → Faz 3
- AR ile durak ekleme → uzun vadeli

## 6. Özet tablo

| Konu | Şimdi | Faz 2 hedef |
| --- | --- | --- |
| Konum UI | Yok (sadece koordinat metni) | Harita + foto şeridi |
| Harita bileşeni | `RouteMap` orphan | `StopDetails` entegre |
| Publish lat/lng | Yazılmıyor | Her durak DB'ye |
| Geocoding | Forward (keşif only) | Forward + reverse |
| EXIF | Yok (ertelendi) | Otomatik prefill (gelecek) |
| Maks durak | 20 | `MAX_ROUTE_STOPS` |
| Sıralama | Foto seçim sırası | Sürükle-bırak |
| Step indicator | Yok | 3–4 adım görsel ✅ |

## 7. Uygulama sırası önerisi

1. Publish pipeline + store (`setStopLocation`) — veri önce
2. `RouteEditorMap` + foto şeridi — temel UX
3. `LocationPickerScreen` + reverse geocode
4. EXIF + reorder + cilalama
