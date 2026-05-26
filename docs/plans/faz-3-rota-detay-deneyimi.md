# Faz 3 — Rota Detay Deneyimi (Mobil)

> **Durum:** ⬜ Faz 2 sonrası  
> **Bağımlılık:** Faz 2 (durak koordinatları DB'de)

## 1. Ne Anladım

### Problem

`RouteDetailScreen` şu an `UniversalPost` ile Instagram tarzı dikey feed gösteriyor. Rota açan kullanıcı **coğrafi akışı**, duraklar arası mesafeyi ve "bu rotayı takip etme" deneyimini hissetmiyor.

### Mevcut durum

| Bileşen | Durum |
| --- | --- |
| `RouteDetailScreen.tsx` | `UniversalPost` + scroll |
| `UniversalPost.tsx` | Carousel, like, comment, save — harita yok |
| Durak bazlı yorum | ❌ Yorumlar rota geneline |
| Google Maps deep link | ❌ |
| Mesafe / segment özeti | ❌ |
| Story / split mod | ❌ |

### Olması gereken

**Tüketim layout'u**

```
┌─────────────────────────────────────┐
│         [ ROTA HARİTASI ]           │
│    ① → ② → ③   polyline             │
├─────────────────────────────────────┤
│  Toplam ~8.2 km · 5 durak            │
│  [🗺 Tüm rotayı Google Maps'te aç]  │
├─────────────────────────────────────┤
│  ① Galata — [foto] — not            │
│  ↓ 1.2 km · ~15 dk yürüyüş          │
│  [Bu durağı haritada aç]            │
│  ② Karaköy — ...                    │
└─────────────────────────────────────┘
```

**İki görünüm modu**

1. **Split (varsayılan):** Üstte harita, altta segment kartları / foto pager. Foto kaydırınca harita pan; pin'e tıklayınca foto atlar.
2. **Story:** Tam ekran durak kartları, tap ile ilerleme, üstte progress bar.

**Google Maps entegrasyonu**

| Buton | URL şeması |
| --- | --- |
| Bu durağı aç | `https://www.google.com/maps/dir/?api=1&destination=lat,lng` |
| Tüm rotayı aç | `origin=ilk&destination=son&waypoints=ara1\|ara2` (durak ekle mantığı) |
| Buradan devam et (v2) | `origin=user_location&waypoints=...` |

Yeni util: `src/utils/openInMaps.ts` — iOS Apple Maps fallback opsiyonel.

## 2. Yapılacaklar listesi

### 2.1. Layout & navigasyon

- [ ] `RouteDetailScreen` — mod toggle: Anlatım (split) / Story.
- [ ] Tercih persist: AsyncStorage `route_detail_view_mode`.
- [ ] `RouteSplitView.tsx` — harita + segment listesi çift yönlü senkron.
- [ ] `RouteStoryView.tsx` — reanimated tap geçişleri.

### 2.2. Segment kartları

- [ ] `RouteSegmentCard.tsx` — foto, başlık, not, durak numarası.
- [ ] `RouteSegmentConnector.tsx` — "X ile Y arası 1.2 km" (haversine; ileride Directions API).
- [ ] `RouteSummaryBar.tsx` — toplam mesafe, durak sayısı, tahmini süre (yürüyüş ~5 km/saat kuralı ile MVP).

### 2.3. Harita bileşeni (detay)

- [ ] `RouteDetailMap.tsx` — keşif haritası tile reuse, sadece bu rotanın durakları + polyline.
- [ ] Aktif durak marker büyütme / renk vurgusu.
- [ ] `openInMaps` butonları harita overlay FAB + segment kartında.

### 2.4. UniversalPost entegrasyonu

- [ ] Mevcut like/comment/save/header korunur.
- [ ] Harita + segmentler carousel **üstüne** veya **altına** — scroll birleşik akış.
- [ ] Koordinatsız duraklar: segment kartında harita butonu gizli, "konum yok" metni.

### 2.5. Etkileşimler (Faz 3 çekirdek)

- [ ] `RouteCloneButton` — başkasının rotasını `createRouteFlowStore`'a prefill.
- [ ] `StopCheckInButton` — "Ben de gittim" (optimistic; backend TODO).

### 2.6. Durak bazlı yorum (kısmi)

- [ ] `StopCommentSection.tsx` — durak ID ile filtre.
- [ ] Backend: `comments.stop_id` veya `order_index` — migration gerekir.
- [ ] Geriye uyum: stop_id yoksa rota geneli yorumlar göster.

### 2.7. Takip modu (Faz 3.5 — opsiyonel)

- [ ] `RouteFollowingService` — foreground geofence.
- [ ] Yaklaşınca lokal bildirim (`@notifee/react-native`).
- [ ] Arkaplan geofence → Faz 4+ R&D.

### 2.8. QA

- [ ] Tek duraklı rota (polyline yok).
- [ ] Koordinatsız durak karışık rota.
- [ ] Google Maps link iOS/Android doğrulama.
- [ ] Split mod foto ↔ harita senkron gecikmesi.

## 3. Dosya hedefleri

```
src/screens/RouteDetailScreen.tsx          # Mod orchestrator
src/components/routeDetail/
  RouteSplitView.tsx
  RouteStoryView.tsx
  RouteDetailMap.tsx
  RouteSegmentCard.tsx
  RouteSegmentConnector.tsx
  RouteSummaryBar.tsx
  StopCommentSection.tsx
  RouteCloneButton.tsx
  StopCheckInButton.tsx
src/utils/openInMaps.ts
src/utils/routeDistance.ts                 # haversine, toplam mesafe
```

## 4. Dışarıda kalanlar

- Turn-by-turn navigasyon — ürün kapsamı dışı (harici Maps'e delege).
- Google Directions API ile gerçek yol mesafesi → Faz 5 veya premium.
- Arkaplan geofence.

## 5. Özet tablo

| Konu | Şimdi | Faz 3 hedef |
| --- | --- | --- |
| Detay görünüm | Feed carousel | Split + Story |
| Harita | Yok | Hero harita + polyline |
| Mesafe | Yok | Segment + toplam |
| Google Maps | Yok | Durak + tüm rota |
| Durak yorum | Yok | Thread (backend ile) |
| Klonlama | Yok | Taslağa kopyala |
