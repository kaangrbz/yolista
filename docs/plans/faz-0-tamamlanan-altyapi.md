# Faz 0 — Tamamlanan Altyapı (Mobil)

> Referans fazı — yeni iş değil. Sonraki fazların üzerine oturduğu temel.

## Ne yapıldı

### React Native yükseltmesi

| Önce | Şimdi |
| --- | --- |
| RN 0.78.x | **RN 0.85.0** |
| React 19.0 | **React 19.2.3** |
| Eski CLI | `@react-native-community/cli` 20.x |

- Reanimated 4.x, Gesture Handler 2.30, Screens 4.25 kurulu.
- Eski upgrade planları: `.cursor/plans/rn-upgrade-*.md` (artık tarihsel).

### Harita altyapısı

- `react-native-maps@^1.27.2` dependency olarak eklendi.
- **Carto + Esri raster tile** stratejisi — Google/Apple Maps API key gerekmez.
- `src/constants/mapStyles.ts` — light / dark / satellite döngüsü.
- `src/permissions/` — merkezi izin akışı (`requestLocation`, vb.).
- Kurulum rehberi: `docs/explore-map-setup.md`.

### Tema sistemi

- Üç tema: `light`, `dark`, `night` (`src/theme/appThemes.ts`).
- Semantic token'lar: `buttonPrimaryBg`, `surfaceMuted`, `chipSelectedBg`, vb.
- Kurallar: `docs/THEME_COLORS.md`.
- `useThemedStyles`, `AppThemeContext`, `ThemedScrollView`, `ThemedRefreshControl` yaygın kullanımda.
- CreateRoute, Explore, Profile, Auth ekranları temaya geçirildi.

### Auth & onboarding UI

- Yeni auth bileşenleri: `AuthScreenLayout`, `AuthFloatingBackground`, `AuthOtpInput`, vb.
- `VerifyEmailScreen`, `ForgotPasswordScreen`, `ResetPasswordScreen` yenilendi.
- Deep link: `docs/AUTH_AND_DEEP_LINKING.md`.

### Feed / post refactor

- `UniversalPost` parçalandı: `PostHeader`, `PostActions`, `PostCaption`, `post/ImageCarousel`.
- `RouteDetailScreen` → `UniversalPost` + `ThemedScrollView`.
- Skeleton bileşenleri: `RouteCardSkeleton`, `ExploreFeedSkeleton`, `PostImageSkeleton`.

### Kayıtlı koleksiyonlar (kısmi)

- `SavedCollectionsSheet`, `SaveCollectionsService` — rota kaydetme UX'i var.
- Tam "kullanıcı koleksiyonları" (Faz 4) henüz yok; mevcut yapı genişletilebilir.

## Bilinen teknik borç

- [x] `react-native-map-clustering` planlandı ama **kurulmadı**; keşif haritasında `supercluster` + `MapClusterMarker` ile clustering yapılıyor.
- [x] `MapClusterMarker.tsx` **Faz 1'de entegre edildi** (`MapClusterMarkerWrapper` üzerinden).
- [ ] Nominatim geocoding geliştirme için OK; production'da rate limit riski.
- [ ] `RouteDiscoveryService` bbox sorgusu şehir merkezi fallback kullanıyor — gerçek durak koordinatları Faz 2'ye bağlı.

## QA notları (Faz 0 kapanış)

- [x] iOS pod install + LocationWhenInUse permission handler
- [x] Android konum izinleri (FINE + COARSE)
- [x] Fiziksel cihaz build script'leri (`yarn android`, `device:physical`)
- [ ] Release APK / TestFlight smoke test checklist'i dokümante edilmeli
