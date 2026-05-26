# Faz 4 — Sosyal & Topluluk (Mobil)

> **Durum:** ⬜ Faz 2–3 sonrası  
> **Kapsam:** Sadece mobil istemci + gerekli backend şema notları

## 1. Ne Anladım

### Problem

Uygulama "paylaş & beğen" düzeyinde. Uzmanlık tanınması, rotaları tematik gruplama, içeriğin güncel kalması ve takip odaklı keşif eksik.

### Mevcut durum (mobil)

| Özellik | Durum |
| --- | --- |
| Takip / takipçi | ✅ `SocialUserListRouteScreen`, profil |
| Beğeni | ✅ Polymorphic likes |
| Kaydetme | ✅ `SavedCollectionsSheet`, `SaveCollectionsService` |
| Bildirimler | ✅ `NotificationsScreen` (polling) |
| Kullanıcı koleksiyonları (public) | ❌ |
| Rozet sistemi | ❌ (`ProfileBadgeInfoSheet` UI iskeleti var) |
| Freshness oylaması | ❌ |
| Haritada "takip ettiklerim" | ❌ |
| Mention (@) | ❌ |

### Olması gereken

- Tematik **rota koleksiyonları** (kendi veya başkasının rotaları).
- **Rozetler:** Local Guide, Foto-rotacı, Doğrulayıcı.
- **Freshness:** 6 ay+ rotalarda "hâlâ aktif mi?" oylaması.
- Keşif haritasında **"Sadece takip ettiklerim"** filtresi.
- Yorumlarda `@mention` + deep link paylaşım.

## 2. Yapılacaklar listesi

### 2.1. Koleksiyonlar

- [ ] Backend: `collections`, `collection_routes` tabloları.
- [ ] `CollectionsService.ts` — CRUD, reorder (mevcut `SaveCollectionsService` ile birleştirme değerlendir).
- [ ] Ekranlar:
  - `CollectionListScreen` — profil sekmesi
  - `CollectionDetailScreen` — rota grid
  - `CollectionEditScreen` — ekle/çıkar/sırala
- [ ] Rota detayında "Koleksiyona ekle" → bottom sheet.
- [ ] `SavedCollectionsSheet` → genişlet veya migrate.

### 2.2. Rozetler

- [ ] Backend: `badges`, `user_badges`.
- [ ] `BadgeService.ts` — kriter değerlendirme (client display + server award).
- [ ] `BadgesScreen` / profil rozeti şeridi.
- [ ] `ProfileBadgeInfoSheet` — gerçek rozet verisiyle bağla.

### 2.3. Freshness / doğrulama

- [ ] `FreshnessVoteSheet` — rota detayında 6 ay+ rotalar için.
- [ ] `FreshnessService.ts` — oy verme, skor.
- [ ] Feed sıralamasında freshness ağırlığı (backend).

### 2.4. Keşif haritası sosyal filtresi

- [ ] `MapFilterBar` — "Takip ettiklerim" chip.
- [ ] `RouteDiscoveryService` — `followedUserIds` filtresi.
- [ ] `useViewportRoutes` — filtre genişletmesi.

### 2.5. Mention & aktivite

- [ ] Yorum input parser — `@username` autocomplete.
- [ ] Bildirim tipleri: mention, koleksiyona ekleme, rozet.
- [ ] `NotificationsScreen` — yeni event render.

### 2.6. QA

- [ ] Boş koleksiyon, private koleksiyon.
- [ ] Freshness oy spam koruması.
- [ ] Takip filtresi + bbox performans.

## 3. Mevcut dosyalar (genişletilecek)

```
src/services/SaveCollectionsService.ts
src/components/common/SavedCollectionsSheet.tsx
src/components/profile/ProfileBadgeInfoSheet.tsx
src/screens/SocialUserListRouteScreen.tsx
src/screens/NotificationsScreen.tsx
src/components/explore/map/MapFilterBar.tsx
src/services/RouteDiscoveryService.ts
```

## 4. Dışarıda kalanlar

- Canlı aktivite feed (realtime) — Supabase realtime yok; polling veya push queue.
- Moderasyon paneli — web admin.

## 5. Özet tablo

| Konu | Şimdi | Faz 4 hedef |
| --- | --- | --- |
| Kaydetme | Kişisel saved | Public koleksiyonlar |
| Rozet | UI iskelet | Kriter + award |
| Güncellik | Yok | Freshness oyu |
| Harita sosyal | Yok | Takip filtresi |
| Mention | Yok | Yorum + bildirim |
