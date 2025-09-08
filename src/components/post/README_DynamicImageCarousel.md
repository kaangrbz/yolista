# Dinamik Yükseklikli ImageCarousel

## Genel Bakış
`ImageCarousel` bileşeni artık resim boyutlarına göre dinamik yükseklik ayarlama özelliğine sahip. Bu özellik sayesinde her resim kendi orijinal aspect ratio'suna uygun yükseklikte gösterilir.

## Özellikler
- ✅ **Dinamik Yükseklik**: Her resim kendi boyutuna göre yükseklik alır
- ✅ **Aspect Ratio Korunur**: Resimler orijinal oranlarını korur
- ✅ **Min/Max Sınırlar**: Yükseklik belirlenen aralıkta tutulur
- ✅ **Önbellekleme**: Resim boyutları önbelleğe alınır (performans)
- ✅ **Fallback**: Hata durumunda varsayılan yükseklik kullanılır
- ✅ **Smooth Transitions**: Resim değişimlerinde yumuşak geçişler

## Kullanım

### Temel Kullanım (Sabit Yükseklik)
```tsx
<ImageCarousel
  images={images}
  currentIndex={currentIndex}
  onIndexChange={setCurrentIndex}
  height={400}
/>
```

### Dinamik Yükseklik Kullanımı
```tsx
<ImageCarousel
  images={images}
  currentIndex={currentIndex}
  onIndexChange={setCurrentIndex}
  height={400} // Varsayılan yükseklik
  dynamicHeight={true} // Dinamik yükseklik aktif
  maxHeight={600} // Maksimum yükseklik
  minHeight={250} // Minimum yükseklik
/>
```

## Parametreler

| Parametre | Tip | Varsayılan | Açıklama |
|-----------|-----|------------|----------|
| `images` | `string[]` | - | Resim URI'ları dizisi |
| `currentIndex` | `number` | - | Aktif resim indeksi |
| `onIndexChange` | `(index: number) => void` | - | Resim değişim callback'i |
| `height` | `number` | `400` | Varsayılan yükseklik |
| `dynamicHeight` | `boolean` | `false` | Dinamik yükseklik aktif/pasif |
| `maxHeight` | `number` | `600` | Maksimum yükseklik sınırı |
| `minHeight` | `number` | `200` | Minimum yükseklik sınırı |

## Örnek Senaryolar

### 1. Instagram Benzeri Post
```tsx
<ImageCarousel
  images={postImages}
  currentIndex={currentIndex}
  onIndexChange={setCurrentIndex}
  dynamicHeight={true}
  maxHeight={500}
  minHeight={300}
/>
```

### 2. Galeri Görünümü
```tsx
<ImageCarousel
  images={galleryImages}
  currentIndex={currentIndex}
  onIndexChange={setCurrentIndex}
  dynamicHeight={true}
  maxHeight={800}
  minHeight={200}
/>
```

### 3. Küçük Thumbnail Carousel
```tsx
<ImageCarousel
  images={thumbnails}
  currentIndex={currentIndex}
  onIndexChange={setCurrentIndex}
  height={150}
  dynamicHeight={false} // Sabit yükseklik
/>
```

## Performans Optimizasyonları

### 1. Önbellekleme
- Resim boyutları otomatik olarak önbelleğe alınır
- Aynı resim tekrar yüklendiğinde boyut hesaplaması yapılmaz
- Bellek kullanımı optimize edilmiştir

### 2. Lazy Loading
- Sadece görünen resimlerin boyutları hesaplanır
- Gereksiz hesaplamalar önlenir

### 3. Error Handling
- Resim yükleme hatalarında fallback yükseklik kullanılır
- Uygulama çökmesi önlenir

## Aspect Ratio Hesaplama

```typescript
// Resim boyutu hesaplama mantığı
const aspectRatio = originalHeight / originalWidth;
const adjustedHeight = screenWidth * aspectRatio;

// Min/Max sınırları uygulanır
const clampedHeight = Math.max(
  minHeight,
  Math.min(maxHeight, adjustedHeight)
);
```

## Örnek Boyutlar

| Resim Oranı | Ekran Genişliği | Hesaplanan Yükseklik | Sınırlanmış Yükseklik |
|-------------|-----------------|---------------------|----------------------|
| 16:9 (1920x1080) | 375px | 211px | 250px (min) |
| 4:3 (1200x900) | 375px | 281px | 281px |
| 1:1 (800x800) | 375px | 375px | 375px |
| 3:4 (600x800) | 375px | 500px | 500px |
| 9:16 (1080x1920) | 375px | 667px | 600px (max) |

## Migration (Mevcut Kod Güncelleme)

### Eski Kod:
```tsx
<ImageCarousel
  images={images}
  currentIndex={currentIndex}
  onIndexChange={setCurrentIndex}
  height={400}
/>
```

### Yeni Kod (Dinamik):
```tsx
<ImageCarousel
  images={images}
  currentIndex={currentIndex}
  onIndexChange={setCurrentIndex}
  height={400}
  dynamicHeight={true}
  maxHeight={600}
  minHeight={250}
/>
```

## Avantajlar

### 1. **Görsel Kalite**
- Resimler orijinal oranlarını korur
- Bozuk görünümler önlenir
- Daha profesyonel görünüm

### 2. **Kullanıcı Deneyimi**
- Her resim optimal boyutta gösterilir
- Kaydırma deneyimi iyileşir
- İçerik daha iyi görünür

### 3. **Performans**
- Önbellekleme ile hızlı yükleme
- Gereksiz hesaplamalar önlenir
- Bellek kullanımı optimize

### 4. **Esneklik**
- Farklı senaryolar için uyarlanabilir
- Min/Max sınırları ile kontrol
- Geriye uyumlu

## Dikkat Edilmesi Gerekenler

1. **İlk Yükleme**: Resim boyutları hesaplanırken kısa bir gecikme olabilir
2. **Bellek Kullanımı**: Çok fazla resim varsa önbellek boyutu artabilir
3. **Ağ Bağımlılığı**: Resim boyutları için ağ bağlantısı gerekir
4. **Fallback**: Hata durumunda varsayılan yükseklik kullanılır

## Gelecek Geliştirmeler

- [ ] Resim boyutlarını metadata'dan okuma
- [ ] Progressive loading ile daha hızlı yükleme
- [ ] Animasyonlu yükseklik geçişleri
- [ ] Responsive tasarım desteği
