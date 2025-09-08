# useImages Hook - Gerçek Resim Yönetimi

## Genel Bakış
`useImages` hook'u artık mock resimler yerine veritabanından gerçek resimleri indirir ve yönetir. Bu hook, bir post'un tüm rota noktalarındaki resimleri otomatik olarak yükler ve önbellekler.

## Özellikler
- ✅ **Gerçek Resimler**: Veritabanından gerçek rota resimleri
- ✅ **Otomatik İndirme**: ImageService ile optimize edilmiş indirme
- ✅ **Önbellekleme**: Resimler otomatik olarak önbelleğe alınır
- ✅ **Hata Yönetimi**: Kapsamlı hata durumu yönetimi
- ✅ **Loading States**: Yükleme durumları
- ✅ **Refresh**: Resimleri yeniden yükleme özelliği
- ✅ **Dinamik Yükseklik**: Her resim kendi boyutuna göre yükseklik alır

## Kullanım

### Temel Kullanım
```tsx
import { useImages } from '../hooks/useImages';

const PostComponent = ({ postId, userId }) => {
  const { 
    images, 
    loading, 
    error, 
    currentIndex, 
    handleImageScroll, 
    goToImage, 
    refreshImages 
  } = useImages(postId, userId);

  return (
    <View>
      {loading && <Text>Resimler yükleniyor...</Text>}
      {error && <Text>Hata: {error}</Text>}
      {images.length > 0 && (
        <ImageCarousel
          images={images}
          currentIndex={currentIndex}
          onIndexChange={goToImage}
        />
      )}
    </View>
  );
};
```

### Gelişmiş Kullanım
```tsx
const PostComponent = ({ postId, userId }) => {
  const { 
    images, 
    loading, 
    error, 
    currentIndex, 
    handleImageScroll, 
    refreshImages 
  } = useImages(postId, userId);

  const handleRefresh = async () => {
    await refreshImages();
  };

  return (
    <View>
      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>Resimler yükleniyor...</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={styles.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Images */}
      {!loading && !error && images.length > 0 && (
        <ImageCarousel
          images={images}
          currentIndex={currentIndex}
          onIndexChange={(index) => handleImageScroll({ nativeEvent: { contentOffset: { x: index * 400 } } }, 400)}
          dynamicHeight={true}
          maxHeight={600}
          minHeight={250}
        />
      )}

      {/* No Images */}
      {!loading && !error && images.length === 0 && (
        <View style={styles.noImagesContainer}>
          <Text>Bu gönderi için resim bulunamadı</Text>
        </View>
      )}
    </View>
  );
};
```

## Parametreler

| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `postId` | `string` | Post/rota ID'si |
| `userId` | `string?` | Kullanıcı ID'si (opsiyonel) |

## Dönen Değerler

| Değer | Tip | Açıklama |
|-------|-----|----------|
| `images` | `string[]` | İndirilen resim URI'ları |
| `loading` | `boolean` | Yükleme durumu |
| `error` | `string \| null` | Hata mesajı |
| `currentIndex` | `number` | Aktif resim indeksi |
| `handleImageScroll` | `function` | Resim kaydırma handler'ı |
| `goToImage` | `function` | Belirli resme gitme |
| `refreshImages` | `function` | Resimleri yeniden yükleme |

## Veritabanı Yapısı

Hook, aşağıdaki veritabanı yapısını kullanır:

```sql
-- routes tablosu
CREATE TABLE routes (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES routes(id),
  user_id UUID REFERENCES profiles(id),
  title TEXT,
  description TEXT,
  image_url TEXT, -- Resim dosya adı
  order_index INTEGER,
  is_deleted BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Resim İndirme Süreci

1. **Veritabanı Sorgusu**: Post ID'sine göre tüm rota noktaları alınır
2. **Filtreleme**: Sadece resmi olan noktalar seçilir
3. **Sıralama**: `order_index`'e göre sıralanır
4. **İndirme**: Her resim `ImageService.downloadPostImage` ile indirilir
5. **Önbellekleme**: İndirilen resimler otomatik önbelleğe alınır

## Performans Optimizasyonları

### 1. **Önbellekleme**
- Resimler 24 saat boyunca önbellekte tutulur
- Aynı resim tekrar istenirse önbellekten döner
- Bellek kullanımı optimize edilmiştir

### 2. **Paralel İndirme**
- Tüm resimler paralel olarak indirilir
- Hızlı yükleme sağlanır

### 3. **Hata Toleransı**
- Bir resim indirilemezse diğerleri devam eder
- Kısmi başarı durumları desteklenir

## Hata Durumları

### 1. **Veritabanı Hatası**
```typescript
error: "Resimler yüklenirken hata oluştu"
```

### 2. **Resim Bulunamadı**
```typescript
error: "Bu gönderi için resim bulunamadı"
```

### 3. **İndirme Hatası**
```typescript
error: "Resimler yüklenirken beklenmeyen bir hata oluştu"
```

### 4. **Yenileme Hatası**
```typescript
error: "Resimler yenilenirken hata oluştu"
```

## Migration (Mock'tan Gerçek Resimlere)

### Eski Kod (Mock):
```tsx
const { images, loading, currentIndex, handleImageScroll } = useImages(postId);
// Mock resimler kullanılıyordu
```

### Yeni Kod (Gerçek):
```tsx
const { 
  images, 
  loading, 
  error, 
  currentIndex, 
  handleImageScroll, 
  refreshImages 
} = useImages(postId, userId);
// Gerçek veritabanı resimleri kullanılıyor
```

## Avantajlar

### 1. **Gerçek Veri**
- Artık mock resimler yerine gerçek kullanıcı resimleri
- Daha anlamlı ve kişisel içerik

### 2. **Performans**
- Önbellekleme ile hızlı yükleme
- Paralel indirme ile optimize edilmiş süreç

### 3. **Güvenilirlik**
- Kapsamlı hata yönetimi
- Fallback mekanizmaları

### 4. **Kullanıcı Deneyimi**
- Loading states ile bilgilendirme
- Hata durumlarında retry seçeneği
- Dinamik yükseklik ile optimal görünüm

## Dikkat Edilmesi Gerekenler

1. **İlk Yükleme**: Resimler indirilirken kısa bir gecikme olabilir
2. **Ağ Bağımlılığı**: İnternet bağlantısı gereklidir
3. **Bellek Kullanımı**: Çok fazla resim varsa bellek kullanımı artabilir
4. **Cache Management**: Önbellek otomatik yönetilir

## Gelecek Geliştirmeler

- [ ] Progressive loading (resimler sırayla yüklenir)
- [ ] Lazy loading (sadece görünen resimler yüklenir)
- [ ] Image compression (resimler sıkıştırılır)
- [ ] Offline support (çevrimdışı görüntüleme)
