# Faz 2b — Gönderi Düzenleme (Tam Wizard)

> **Durum:** ⬜ Planlandı  
> **Kapsam:** Sadece `yolista-mobil`  
> **Bağımlılık:** Faz 2 rota oluşturma (~%95) ✅ publish worker, konum, preview upload  
> **Agent planı:** `.cursor/plans/post_edit_full_wizard.plan.md`

## Karar

**Tam C:** Mevcut `CreateRouteStack` wizard'ı edit modunda yeniden kullanılır. Kullanıcı fotoğraf ekleyebilir, çıkarabilir, sıralayabilir, durak metni/konumunu ve kategori/şehir bilgisini değiştirebilir.

Yeni ayrı “hafif edit ekranı” yok — create ile aynı UX, farklı kayıt yolu.

## Problem

- `UniversalPost` menüsünde **Düzenle** görünüyor ama placeholder.
- `RouteModel.updateRoute` tek satır; çok duraklı gönderi için yetersiz.
- Admin panelde sadece ana metadata edit var; mobil kullanıcı ihtiyacı karşılanmıyor.

## Hedef akış

```
RouteDetail / UniversalPost
  └─ Düzenle (sadece sahip, routes.edit kısıtı yok)
       └─ hydrateEditFlowFromPost(routeId)
            └─ CreateRouteStack (mode=edit)
                 PhotoSelection → StopDetails → CategorySelection
                       └─ Kaydet → RouteEditWorker → updateRoutePost
                            └─ RouteDetail refresh
```

## Veri modeli (hatırlatma)

| Alan | Ana row (order_index=0) | Child row |
| --- | --- | --- |
| `city_id` | ✅ | — |
| `category_id` | ✅ | — |
| `title`, `description` | ✅ | ✅ |
| `image_url`, `image_preview_url` | ✅ | ✅ |
| `latitude`, `longitude`, `location_label` | ✅ | ✅ |
| `parent_id` | null | main id |
| Silme | `is_deleted: true` | aynı |

## Diff stratejisi

Her durak edit store'da `existingRouteId` taşır (DB `routes.id`).

| Durum | DB aksiyonu |
| --- | --- |
| Mevcut durak, metin/konum/sıra değişti | UPDATE |
| Mevcut durak, foto değişti | UPDATE + yeni storage upload |
| Yeni picker fotoğrafı | INSERT + upload |
| Wizard'dan çıkarılan durak | UPDATE `is_deleted: true` |
| Sıra değişimi | Tüm aktif row'larda `order_index` güncelle |

Fotoğraf upload: `uploadStatus === 'done' && !isReplaced` → mevcut storage key korunur (create worker ile aynı optimizasyon).

## Uygulama fazları

### Faz A — Tipler & hydration (1.5 gün)

- [ ] `RouteStop.existingRouteId`, `CreateFlowPhoto.existingStorageFileName`, `isReplaced`
- [ ] `RouteEditHydrationService.hydrateEditFlowFromPost`
- [ ] Remote görselleri cache URI'ye çevir (`mapPreviewImageCache` / signed URL)
- [ ] `createRouteFlowStore`: `mode`, `editRouteId`, `beginEditFlow`, baseline snapshot

### Faz B — Model & worker (2 gün)

- [ ] `RouteModel.updateRoutePost(mainRouteId, stops, removedIds, city, category)`
- [ ] `RouteEditWorker` — upload skip + diff kayıt
- [ ] `routePublishStore.enqueueEdit` + progress UI paylaşımı
- [ ] Edit draft storage (`edit-{routeId}` key)
- [ ] Create publish ile çakışma kilidi

### Faz C — Navigasyon & ekranlar (1.5 gün)

- [ ] `EditRoute` stack screen (Home / Profile / Explore)
- [ ] `UniversalPost.handleEditPost` → navigate + restriction check
- [ ] `saveRouteEditFromCreateFlow` (`createFlowPublish.ts`)
- [ ] CategorySelection: Paylaş → Kaydet (edit modu)
- [ ] Exit modal / prevent-remove edit metinleri
- [ ] Success: RouteDetail'e dön + refresh

### Faz D — Cache & edge cases (1 gün)

- [ ] Feed, harita viewport, profil grid invalidation
- [ ] Min 1 foto guard
- [ ] Silinmiş gönderi / yetkisiz hydration hataları
- [ ] Storage orphan cleanup — **opsiyonel**, dokümante

### Faz E — QA (1 gün)

Tam matris: `.cursor/plans/post_edit_full_wizard.plan.md` → Faz 9

## Kod referansları

| Alan | Dosya |
| --- | --- |
| Placeholder edit | `src/components/UniversalPost.tsx` → `handleEditPost` |
| Create store | `src/store/createRouteFlowStore.ts` |
| Publish worker | `src/services/RoutePublishWorker.ts` |
| Publish queue | `src/store/routePublishStore.ts` |
| Route CRUD | `src/model/routes.model.ts` |
| Gönderi fetch | `RouteModel.getRoutesById` |
| Görsel cache | `src/utils/mapPreviewImageCache.ts` |
| Limitler | `src/constants/routeContentLimits.ts` |
| RLS kısıt | `routes.edit` — `20260524000200_rls_user_restrictions.sql` |

## Bilinçli out of scope

- Admin panel tam wizard edit (ayrı iş)
- Edit geçmişi / versiyonlama
- Multi-device eşzamanlı edit merge
- Otomatik storage GC (ilk PR'da zorunlu değil)

## Tahmini toplam

**~7 iş günü** (tek geliştirici, QA dahil)
