# Faz 5 — Kişiselleştirme & Akıllı Özellikler (Mobil)

> **Durum:** ⬜ Uzun vadeli — Faz 1–4 sonrası  
> **Kapsam:** Mobil istemci + hafif backend sinyalleri

## 1. Ne Anladım

### Problem

Keşif ve topluluk altyapısı tamamlandığında bile kullanıcı her açılışta **bağlama duyarlı** ("şu an ne yapsam?") öneriler görmüyor.

### Mevcut durum

| Sinyal | Durum |
| --- | --- |
| Beğeni / kayıt / takip verisi | ✅ DB'de |
| Kategori tercihi öğrenme | ❌ |
| Hava durumu | 🟡 `MapWeatherBadge` keşif haritasında var; öneri motoru yok |
| Time-slider / mevsim | ❌ |
| Saved area bildirim | ❌ |
| Akıllı başlık önerisi | ❌ |

### Olması gereken

- Ana sayfa **"Sana özel"** rayı.
- Bağlamsal modlar: hava, saat, boş vakit ("1 saatim var").
- Keşif haritasında time-slider ve mevsim filtresi.
- Saved area → yeni rota bildirimi.
- Rota oluşturmada akıllı başlık önerisi.

## 2. Yapılacaklar listesi

### 2.1. Öneri motoru (MVP: kural tabanlı)

- [ ] `RecommendationService.ts` — beğeni kategorisi + şehir + mesafe ağırlıkları.
- [ ] `HomeScreen` — yatay "Sana özel" `FlatList`.
- [ ] Cold start: popüler rotalar fallback.

### 2.2. Bağlam servisleri

- [ ] `WeatherService.ts` — OpenWeather (veya mevcut weather badge API'sini genelle).
- [ ] `ContextService.ts` — saat dilimi, hava, kullanıcı konumu birleşik.
- [ ] Filtre kuralları: yağmur → kapalı mekan kategorileri; sabah → kahvaltı/yürüyüş.

### 2.3. Boş vakit modu

- [ ] Keşif / harita giriş sheet: "Ne kadar vaktin var?" (30 dk / 1 sa / yarım gün).
- [ ] Rota süre tahmini: durak sayısı × ortalama süre veya mesafe / yürüyüş hızı.

### 2.4. Keşif haritası gelişmiş filtreler

- [ ] Time-slider — geçmiş tarih aralığında paylaşılan rotalar.
- [ ] Mevsim modu — çekim tarihi / mevsim metadata (EXIF veya manuel tag gerekir).
- [ ] Heatmap katmanı (opsiyonel, performans R&D).

### 2.5. Saved area

- [ ] `SavedAreaService.ts` — bbox veya radius kaydet.
- [ ] Keşif haritasında "Bu bölgeyi kaydet" long-press veya menü.
- [ ] Push trigger: bölgeye yeni rota → bildirim (backend job).

### 2.6. Oluşturma akışı akıllı özellikler

- [ ] Başlık önerisi: ilk durak adresi + kategori + saat → "Galata'da bir öğleden sonra".
- [ ] `StopForm` veya yayın öncesi önizleme adımında göster.

### 2.7. Geocoding production

- [ ] Nominatim → MapTiler / LocationIQ / kendi instance migration.
- [ ] Rate limit + cache (AsyncStorage, son 50 sorgu).

### 2.8. Clustering / performans (Faz 1 borcu)

- [ ] `supercluster` entegrasyonu yoğun harita için.
- [ ] Statik rota kart mini harita snapshot (image cache).

## 3. Mevcut temel

```
src/components/explore/map/MapWeatherBadge.tsx   # Hava rozeti — genişletilecek
src/services/GeocodingService.ts                 # Production geçiş adayı
src/screens/HomeScreen.tsx                       # Öneri rayı hedefi
src/screens/Explore/ExploreMapScreen.tsx         # Time-slider hedefi
```

## 4. Dışarıda kalanlar

- ML tabanlı öneri modeli — kural tabanlı MVP sonrası.
- Spotify / AR entegrasyonları — fikir havuzu.

## 5. Özet tablo

| Konu | Şimdi | Faz 5 hedef |
| --- | --- | --- |
| Kişisel feed | Kronolojik | Sana özel ray |
| Hava | Rozet only | Öneri filtresi |
| Zaman/mevsim | Yok | Harita slider |
| Saved area | Yok | Kaydet + push |
| Başlık önerisi | Yok | Oluşturma UX |
| Geocoding | Nominatim dev | Production provider |

## 6. Fikir havuzu (plan dışı adaylar)

Kaynak: `.cursor/plans/rota-uygulamasi-fikirler.md`

- Heatmap modu
- Spotify durak playlist
- AR durak ekleme
- Android 17 location button enforcement (2026)
