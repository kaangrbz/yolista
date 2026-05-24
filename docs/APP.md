Genel Mimari
React Native tabanlı bir mobil uygulama, ana giriş App.tsx.
Katmanlar düzenli: src/navigation, src/screens, src/components, src/services, src/model, src/context, src/store.
State yönetimi ağırlıklı AuthContext + Zustand (routePublishStore, cityStore).
API / Backend Yapısı
Ayrı bir klasik REST API client yok; backend tarafı doğrudan Supabase ile kullanılıyor.
Supabase client merkezi: src/lib/supabase.ts.
Auth akışı: AuthContext içinde signInWithPassword, signUp, getSession, onAuthStateChange; şifre sıfırlama, e-posta doğrulama, deep link auth → bkz. [AUTH_AND_DEEP_LINKING.md](./AUTH_AND_DEEP_LINKING.md).

Deep link: DeepLinkingService (rota/profil/keşfet) + AuthLinkingService (auth/mobile); paylaşım URL’leri https://yolista.roulista.com — aynı belgede.
Veri erişimi çoğunlukla model katmanında:
src/model/routes.model.ts
src/model/user.model.ts
src/model/comment.model.ts
src/model/notifications.model.ts
Kullanılan RPC’ler:
search_profiles
count_comments_by_route_ids
Realtime subscription görünmüyor; bildirim sayısı polling ile çekiliyor (5 sn).
Veritabanı Yapısı (Koddan çıkarılan)
Kullanılan temel tablolar:

profiles
routes
comments
likes (polymorphic: entity_id + entity_type)
follows
saved_routes
notifications
cities
categories
app_versions
İlişki örnekleri:

routes.user_id -> profiles.id
routes.city_id -> cities.id
routes.category_id -> categories.id
comments.route_id -> routes.id
comments.user_id -> profiles.id
follows.follower_id/followed_id -> profiles.id
Storage bucket kullanımı:

profiles, headers, routes
Kritik Gözlem / Riskler
Repo’daki migration sayısı çok az (sadece 2 yeni kolon ekleyen migration var).
Yani tam base schema repo’da görünmüyor; sıfırdan DB kurulumunda drift riski var.
src/lib/supabase.ts içindeki eski SQL comment’leri ile güncel kod kullanımı uyuşmuyor (legacy izler var).
Bazı join’ler FK adlarına bağımlı (...!follows_follower_id_fkey gibi); constraint adı değişirse sorgu kırılabilir.
image_alignment DB’de text, TS tarafında union; ileride yeni değer gelirse tip-kod uyuşmazlığı olabilir.