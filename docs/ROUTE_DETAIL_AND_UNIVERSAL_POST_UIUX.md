# Rota Detay Ekranı ve UniversalPost — UI/UX Dokümantasyonu

Bu belge, Yolista mobil uygulamasındaki **feed gönderi kartı** (`UniversalPost`) ile **rota detay ekranını** (`RouteDetailScreen`) baştan sona UI/UX perspektifinden açıklar. Her iki yüzey de aynı veri modelini (rota = gönderi) paylaşır; fark, derinlik ve rota deneyiminin ne kadarının aynı ekranda sunulduğudur.

---

## 1. Genel mimari ilişki

```
Feed / Profil listesi
    └── UniversalPost (Instagram tarzı kart)
            ├── PostHeader
            ├── ImageCarousel (durak fotoğrafları)
            ├── RouteDetailCTA  →  "Rotayı aç"
            ├── PostActions
            └── PostCaption

RouteDetailScreen (tam ekran detay)
    └── RouteDetailLayout
            ├── RouteDetailHeader (+ sosyal aksiyonlar)
            ├── PostHeader
            ├── PostCaptionPreview (açıklama üstte)
            ├── RouteDetailHeroToggle (Fotoğraflar | Önizleme)
            ├── Hero: ImageCarousel veya RouteDetailMap
            ├── RouteSummaryBar
            ├── RouteExperienceCore (Duraklar | Navigasyon sekmeleri)
            ├── Yorum satırı
            └── PostCaption (açıklama gizli, zaman damgası)
```

**Temel UX kararı:** Feed'de kullanıcı önce sosyal içeriği (fotoğraf, beğeni, yorum) görür; rota planlama ikincil bir CTA ile açılır. Detay ekranında ise rota deneyimi birincil olur; sosyal aksiyonlar header'a taşınır, içerik dikey scroll ile katmanlanır.

---

## 2. UniversalPost

**Dosya:** `src/components/UniversalPost.tsx`

### 2.1 Amaç

Tek bir `postId` (aslında rota ID'si) ile Instagram benzeri bir gönderi kartı render eder. Ana akış (Home), profil grid/liste/masonry görünümleri ve kaydedilen/beğenilen gönderilerde kullanılır.

### 2.2 Kullanım bağlamları

| Bağlam | `showFullScreen` | `batchImages` | `detailExperienceSlot` | `RouteDetailCTA` |
|--------|------------------|---------------|------------------------|------------------|
| Ana feed | `false` | `true` | — | Gösterilir |
| Profil listesi | `false` | `true` | — | Gösterilir |
| Profil grid/masonry | `false` | `true` | — | Gösterilir |
| Tam ekran detay | `true` | — | Opsiyonel slot | Gizlenir |

Feed örneği (`HomeScreen`):

```tsx
<UniversalPost
  postId={postId}
  userId={userId}
  initialRoute={item}
  batchImages={true}
  prefetchedImageRows={rowsByPostId[postId]}
/>
```

### 2.3 Dikey layout (yukarıdan aşağı)

1. **PostHeader** — Yazar satırı
2. **detailExperienceSlot** — Opsiyonel; detay ekranında rota deneyimi buraya enjekte edilebilir
3. **ImageCarousel** — Durak fotoğrafları (her slide bir durak)
4. **RouteDetailCTA** — Sadece feed modunda; detaya geçiş kapısı
5. **PostActions** — Beğeni, yorum, paylaş, kaydet
6. **PostCaption** — Beğeni sayısı, açıklama, yorum önizlemesi, zaman

Alt katman modallar: `ShareModal`, `SavedCollectionsSheet`.

### 2.4 Durum makinesi (loading / error / content)

| Durum | Görünüm | UX |
|-------|---------|-----|
| `loading` | Ortalanmış `ActivityIndicator`, min 400px (fullScreen'de ekran yüksekliğine yakın) | Veri gelene kadar boş kart yerine skeleton benzeri bekletme |
| `error` veya post yok | "Gönderi bulunamadı" metni | Sessiz hata; retry yok |
| Resimler yükleniyor | `PostImageSkeleton` carousel alanında | Layout shift azaltılır |
| Resim hatası | Basılı tutulabilir placeholder + "Tekrar dene" | Kullanıcı tek dokunuşla yeniden dener |
| Resim yok | Placeholder + "Bu gönderi için resim bulunamadı" | Aynı retry deseni |

### 2.5 PostHeader — Yazar satırı

**Dosya:** `src/components/post/PostHeader.tsx`

- Sol: 32px yuvarlak profil fotoğrafı + kullanıcı adı (verified badge) + şehir adı
- Tüm sol blok profil sayfasına gider
- Sağ: `PostDropdownMenu` (⋯)
  - **Kendi gönderisi:** Düzenle (yakında), Sil, Paylaş, Linki kopyala
  - **Başkasının gönderisi:** Şikayet et, Engelle, Takip et / Takibi bırak, Paylaş, Linki kopyala

Silme onay modalı sonrası başarılı olursa `goBack()` veya Home'a yönlendirme.

### 2.6 ImageCarousel — Fotoğraf deneyimi

**Dosya:** `src/components/post/ImageCarousel.tsx`

- Yatay, sayfalı (`pagingEnabled`) scroll; her slide tam ekran genişliği
- **Dinamik yükseklik:** DB'deki görsel boyutlarından hesaplanır (`usePostImageLayout`); min/max sınırlar içinde
- **Çoklu fotoğraf göstergesi:** Sağ üstte beyaz nokta indikatörleri
- **PhotoHintOverlay:** Aktif slide'ın `title` alanı varsa fotoğraf üzerinde ipucu
- **Çift dokunuş beğeni:** Instagram deseni; kalp animasyonu + henüz beğenilmediyse `handleDoubleTapLike`
- Slide değişince `onActiveSlideIndexChange` callback'i (detay ekranında harita ↔ carousel senkronu için)

### 2.7 RouteDetailCTA — Detaya geçiş

**Dosya:** `src/components/routeDetail/RouteDetailCTA.tsx`

Feed kartının carousel ile aksiyonlar arasına yerleşir:

```
[Harita ikonu]  Rotayı aç
                3 durak · harita ve rota planı        >
```

- Dokunulunca `RouteDetail` ekranına gider (`initialTab: 'stops'`)
- `stopCountHint` prop'u ile durak sayısı gösterilir; yoksa genel metin kullanılır
- **UX amacı:** Feed'de rota planlama özelliklerini göstermeden merak uyandırmak; tıklama ile derinleşmek

### 2.8 PostActions — Sosyal aksiyon şeridi

**Dosya:** `src/components/post/PostActions.tsx`

```
[♥] [💬 sayı] [↗]                    [🔖]
```

- Sol grup: beğeni, yorum (sayı varsa), paylaş
- Sağ: kaydet (koleksiyon sheet'i açar)
- Kaydetme sırasında spinner; buton disabled
- Beğenilmiş kalp kırmızı (`#ed4956`)

### 2.9 PostCaption — Metin katmanı

**Dosya:** `src/components/post/PostCaption.tsx`

Sıra:
1. "X beğeni" (tıklanabilir → beğenenler listesi)
2. `@username` + açıklama (3 satır limit, 140+ karakterde "daha fazla / daha az")
3. "X yorumun tümünü gör" veya "İlk yorumu sen ol"
4. Göreceli zaman (`getTimeAgo`)

Yorum açılınca alttan `CommentsSheet` (global context).

### 2.10 Props referansı

| Prop | Tip | UX etkisi |
|------|-----|-----------|
| `postId` | string | Zorunlu kimlik |
| `userId` | string \| null | Beğeni/kaydet sahiplik kontrolü |
| `initialRoute` | RouteWithProfile | Feed'den gelince anında render; ek istek azalır |
| `batchImages` | boolean | Liste modunda toplu resim sorgusu |
| `prefetchedImageRows` | RouteImageRow[] | Batch modunda önceden yüklenmiş slide'lar |
| `showFullScreen` | boolean | Detay modunda min yükseklik artar, CTA gizlenir |
| `actions` | PostActions | Özel handler'lar (test / override) |
| `detailExperienceSlot` | ReactNode | Carousel altına ek rota UI enjekte eder |
| `stopCountHint` | number | CTA meta metninde durak sayısı |
| `activeSlideIndex` | number | Dışarıdan kontrollü carousel indeksi |
| `onActiveSlideIndexChange` | fn | Slide değişim bildirimi |

### 2.11 Veri akışı (hooks)

```
usePost(postId, userId, { initialPost })
usePostActions(postId, userId, postOwnerId)
useImages(...) veya batch prefetched
usePostImageLayout(slides, leadSlide)
```

- `initialRoute` verilirse `postFromRouteWithProfile` ile anında post objesi oluşur
- Yorum sayısı realtime subscription ile senkron (`CommentsSheetContext`)
- Kaydetme: koleksiyon sheet'i (`SavedCollectionsSheet`)

---

## 3. Rota Detay Ekranı (RouteDetailScreen)

**Dosya:** `src/screens/RouteDetailScreen.tsx`  
**Layout:** `src/components/routeDetail/RouteDetailLayout.tsx`

### 3.1 Giriş noktaları

| Kaynak | Navigasyon parametreleri |
|--------|--------------------------|
| Feed `RouteDetailCTA` | `{ routeId, initialTab: 'stops' }` |
| Deep link | `RouteDetail` + routeId |
| Harita / keşfet | `initialTab`, `initialStopIndex`, `initialSegmentIndex`, `startFromUserLocation` |
| Yönlendirme sekmesi | `initialTab: 'directions'` → hero otomatik `map` moduna geçer |

**RouteDetailParams:**
```ts
{
  routeId: string;
  initialTab?: 'stops' | 'directions';
  initialStopIndex?: number;
  initialSegmentIndex?: number;
  startFromUserLocation?: boolean;
}
```

### 3.2 Ekran mimarisi (katmanlar)

```
SafeAreaView (top, left, right)
├── UserLocationProbe (gizli konum okuyucu)
├── RouteDetailLayout (scrollable içerik)
├── RouteDetailFloatingCta (Navigasyon sekmesinde, koşullu)
└── RouteDetailMapModal (tam ekran harita)
```

**RouteDetailScreen** state yönetim katmanıdır; UI render'ı büyük ölçüde `RouteDetailLayout`'a devredilir.

### 3.3 Üst header (sabit)

**Bileşen:** `RouteDetailHeader` + `RouteDetailHeaderSocialActions`

- Sol: Geri butonu
- Orta: Dinamik başlık — `"İstanbul · 5 durak"` veya `"Rota Detayı"`
- Sağ: Kompakt sosyal aksiyonlar (♥ sayı, paylaş, kaydet)

**UX farkı feed'e göre:** Detayda `PostActions` şeridi yok; beğeni/paylaş/kaydet header'a taşınmış. Yorum ve açıklama scroll içinde kalır. Böylece rota içeriği için dikey alan korunur.

### 3.4 Scroll içeriği — yukarıdan aşağı akış

#### A. PostHeader (tekrar)
Yazar bilgisi feed ile aynı; detayda dropdown menü de mevcut.

#### B. PostCaptionPreview (sadece açıklama varsa)
- Açıklama hero'dan **önce**, 2 satır önizleme
- 100+ karakterde "devamını oku / daha az"
- Alttaki `PostCaption`'da açıklama tekrar etmez (`hideDescription: true`)

#### C. RouteDetailHeroToggle
Segmented control:
```
[ Fotoğraflar ] [ Önizleme ]
```
- **Fotoğraflar:** ImageCarousel (feed ile aynı carousel)
- **Önizleme:** RouteDetailMap — tüm durakları gösteren hero harita
- Navigasyon sekmesine geçince otomatik `map` moduna düşer
- Yükleme sırasında toggle gizlenir

#### D. Hero alanı
Duruma göre:
- Skeleton (post + duraklar + slide'lar yüklenirken)
- Hata placeholder + retry
- `heroMode === 'map'` → interaktif harita (pin seçimi carousel'i senkronlar)
- `heroMode === 'photos'` → ImageCarousel (çift dokunuş beğeni dahil)

**Carousel ↔ durak senkronu:** `activeStopIndex` değişince carousel o slide'a kayar; carousel kaydırılınca `onActiveStopIndexChange` ile durak indeksi güncellenir.

#### E. RouteSummaryBar (fotoğraf modunda, durak varsa)
Chip satırı:
- `X durak`
- Mesafe (tahmini ise işaretli)
- Yürüyüş süresi tahmini
- "Tahmini rota" chip'i (segmentler estimated ise)

#### F. RouteExperienceCore — Ana rota deneyimi
İnce üst border ile ayrılmış bölüm (`RouteDetailExperienceSection`).

**Sekmeler (`RouteDetailTabs`):**
```
[ Duraklar ] [ Navigasyon ]
```

Navigasyon sekmesi, en az iki koordinatlı durak yoksa disabled:
> "En az iki koordinatlı durak gerekir — navigasyon kullanılamaz"

---

### 3.5 Duraklar sekmesi

**Bileşen:** `RouteStopsTabPanel`

Dikey akış:

1. **Gömülü harita** (`RouteDetailMap`, variant: `embedded`)
   - Hero `map` modundaysa gömülü harita gizlenir; yerine "Haritayı tam ekran aç" butonu
   - Harita etkileşiminde parent scroll kilitlenir (`useNestedScrollDragLock`)

2. **"Haritayı genişlet"** → `RouteDetailMapModal` açar

3. **"Durakları keşfet"** — yatay scroll durak kartları (`MapRouteStopCard`)
   - Seçili durak vurgulu
   - Kart tıklanınca `activeStopIndex` + carousel senkronu
   - Aktif karta otomatik scroll

4. **Harici navigasyon butonları** (koordinat varsa)
   - **Seçili durak** (primary, accent) → Google Maps'te tek nokta
   - **Tüm rota** → Google Maps'te waypoint'li rota
   - Altında yasal uyarı metni (`ROUTE_EXTERNAL_NAV_DISCLAIMER`)

Boş durum: "Bu rotada durak yok"

---

### 3.6 Navigasyon sekmesi

**Bileşen:** `RouteDirectionsTabPanel`

Dikey akış:

1. **RouteSegmentMap** — Aktif segment vurgulu segment haritası

2. **Chip satırı** (toggle'lar)
   - Özet: bacak sayısı, toplam mesafe, süre
   - **Yürüyüş / Sürüş** modu seçimi
   - **En kısa sıra** (3+ koordinatlı durakta) — navigasyon sırasını optimize eder, fotoğraf sırasını değiştirmez; tasarruf yüzdesi gösterilir
   - **Konumumdan başla** — konum izni ister, kullanıcı konumunu ilk nokta yapar

3. **RouteDirectionsTimeline** — Bacaklar arası dikey timeline; tıklanabilir segmentler

4. **RouteDirectionsStepsList** — Aktif segmentin adım adım yönlendirme metinleri

5. **Aksiyon butonları**
   - Detay ekranında primary CTA çoğu zaman **floating**'e taşınır
   - Panel içinde: "Bu bacak (harici)" — sadece aktif segmenti Maps'te açar

**Yükleme:** "Yol tarifi hazırlanıyor..." spinner

**Edge case'ler:**
- Tek koordinat: "Tek nokta — yönlendirme yok" + Google Maps'te aç
- Koordinat yok: "Koordinatlı durak bulunamadı"

---

### 3.7 Floating CTA (Navigasyon sekmesi)

**Bileşen:** `RouteDetailFloatingCta`

Koşul: `routeDetailTab === 'directions'` && segmentler yüklü && koordinatlar mevcut

```
┌─────────────────────────────────────┐
│  🧭  Google Maps'te başlat          │  ← accent, gölgeli, safe area üstü
└─────────────────────────────────────┘
        (harici navigasyon uyarısı)
```

- Scroll içeriğine alt padding eklenir (`96px`) — CTA içeriği kapatmaz
- Tüm rotayı seçili travel mode + optimize sıra ile açar
- Analytics: `route_detail_maps_cta`

---

### 3.8 Tam ekran harita modalı

**Bileşen:** `RouteDetailMapModal`

- Tam ekran modal; üstte kapat butonu + "Harita" başlığı
- Büyük interaktif harita
- Altta yatay durak kartları şeridi
- Harita pin'i veya kart seçimi `activeStopIndex`'i günceller; kapanınca ana ekran senkron kalır

---

### 3.9 Alt sosyal katman (scroll sonu)

1. **Yorum satırı** (ayrı, caption'dan önce)
   - "X yorumun tümünü gör" / "İlk yorumu sen ol"
   - `CommentsSheet` açar

2. **PostCaption** (detay varyantı)
   - Beğeni sayısı + username
   - Açıklama gizli (`hideDescription`)
   - Yorum önizlemesi gizli (`hideCommentPreview`)
   - Zaman damgası

---

### 3.10 State senkronizasyonu (UX kritik)

| Etkileşim | Sonuç |
|-----------|-------|
| Carousel kaydır | `activeStopIndex` güncellenir |
| Durak kartı seç | Carousel o slide'a gider |
| Harita pin seç | Carousel + durak kartları senkron |
| Segment timeline tıkla | `activeSegmentIndex` + ilgili durak |
| Navigasyon sekmesi | Hero → map modu |
| Yatay durak scroll / harita pan | Ana scroll geçici kilitlenir (800ms sonra açılır) |
| Konumumdan başla | İzin → probe → segmentler yeniden hesaplanır |

---

### 3.11 Analytics olayları

| Olay | Tetikleyici |
|------|-------------|
| `route_detail_tab_change` | Sekme değişimi |
| `route_detail_map_expand` | Harita genişlet |
| `route_detail_maps_cta` | Maps aç (full_route / segment / stop) |

---

## 4. Feed vs Detay — UX karşılaştırması

| Özellik | UniversalPost (feed) | RouteDetailScreen |
|---------|---------------------|-------------------|
| Sosyal aksiyonlar | Carousel altında tam şerit | Header'da kompakt |
| Rota haritası | Yok (CTA ile yönlendirme) | Gömülü + hero + modal |
| Durak listesi | Yok | Yatay kartlar |
| Navigasyon / yol tarifi | Yok | Tam sekme |
| Açıklama konumu | Caption içinde | Üstte preview + altta meta |
| Beğeni çift dokunuş | Carousel'de | Carousel'de (hero photos modunda) |
| Scroll | Feed listesi scroll | Tek ekran iç scroll + nested lock |
| Primary CTA | "Rotayı aç" | "Google Maps'te başlat" (navigasyon) |

---

## 5. Tasarım desenleri ve ilkeler

### 5.1 Görsel dil
- Segmented control'ler: `surfaceMuted` arka plan, aktif seçenek beyaz/kart rengi + gölge
- Aktif rota vurgusu: `MAP_ACTIVE_ROUTE_BORDER` rengi
- Primary aksiyonlar: `theme.accent`, pill (`borderRadius: 999`) butonlar
- Chip'ler: küçük, ikon + bold metin, wrap layout

### 5.2 Progressive disclosure (aşamalı açılım)
1. Feed kartı → minimal bilgi + fotoğraf
2. "Rotayı aç" → duraklar + harita
3. Navigasyon sekmesi → segmentler + Maps entegrasyonu
4. Floating CTA → dış navigasyon

### 5.3 Hata toleransı
- Resim/slide hatalarında retry placeholder (feed ve detay aynı desen)
- Navigasyon yoksa sekme disabled + açıklayıcı hint
- Konum izni reddedilirse toast: "Konum izni gerekli"

### 5.4 Performans UX'i
- `initialRoute` / `prefetchedImageRows` ile feed'de anında render
- Batch image loading ile N+1 sorgu önlenir
- Hero yüklenirken skeleton; toggle ve deneyim bölümü gecikmeli gösterilir

### 5.5 Erişilebilirlik
- Butonlarda `accessibilityRole`, `accessibilityLabel`
- Tab'larda `accessibilityState: { selected, disabled }`
- Hero toggle'da `role="tab"`

---

## 6. İlgili dosyalar

| Dosya | Rol |
|-------|-----|
| `src/components/UniversalPost.tsx` | Feed gönderi kartı |
| `src/screens/RouteDetailScreen.tsx` | Detay ekran container + state |
| `src/components/routeDetail/RouteDetailLayout.tsx` | Detay UI layout |
| `src/components/routeDetail/RouteExperienceCore.tsx` | Sekme orchestrator |
| `src/components/routeDetail/RouteStopsTabPanel.tsx` | Duraklar sekmesi |
| `src/components/routeDetail/RouteDirectionsTabPanel.tsx` | Navigasyon sekmesi |
| `src/components/routeDetail/RouteDetailCTA.tsx` | Feed → detay köprüsü |
| `src/components/post/*` | Post alt bileşenleri |
| `src/types/post.types.ts` | UniversalPost prop tipleri |
| `src/types/routeDetailNavigation.types.ts` | Detay navigasyon parametreleri |

---

## 7. Kullanıcı yolculuğu özeti (örnek senaryo)

1. Kullanıcı feed'de bir rota görür → fotoğrafları kaydırır, çift dokunuşla beğenir
2. "Rotayı aç" CTA'sına basar → detay ekranı açılır, `Duraklar` sekmesi aktif
3. Açıklamayı üstte okur; hero'da fotoğraflar arasında gezer
4. "Önizleme" toggle ile haritaya geçer; pin seçerek durakları inceler
5. Aşağı kaydırır; gömülü haritada rotayı görür, durak kartlarından birini seçer
6. "Tüm rota" ile Google Maps'e gider veya `Navigasyon` sekmesine geçer
7. Yürüyüş modunu seçer, "En kısa sıra"yı açar, timeline'dan bir bacak seçer
8. Alttaki floating "Google Maps'te başlat" ile navigasyonu başlatır
9. Geri döner, yorum satırından yorum yapar; header'dan kaydeder

Bu akış, sosyal keşiften pratik rota planlamaya doğru doğal bir derinleşme sağlar.
