# ImageService Kullanım Kılavuzu

## Genel Bakış
`ImageService` ve `useImageDownload` hook'ları, uygulamada resim indirme işlemlerini standartlaştırmak ve optimize etmek için oluşturulmuştur.

## Özellikler
- ✅ **Önbellekleme**: Resimler 24 saat boyunca önbellekte tutulur
- ✅ **Otomatik Yeniden Deneme**: Hata durumunda 3 kez yeniden dener
- ✅ **Loading States**: Yükleme durumları otomatik yönetilir
- ✅ **Error Handling**: Hata yönetimi ve kullanıcı bildirimleri
- ✅ **TypeScript Desteği**: Tam tip güvenliği

## Kullanım Örnekleri

### 1. Post Resimleri İçin
```tsx
import { usePostImageDownload } from '../hooks/useImageDownload';

const PostCard = ({ route }) => {
  const { imageUri, loading, error } = usePostImageDownload(
    route.image_url, 
    route.user_id
  );

  return (
    <View>
      {loading && <Text>Yükleniyor...</Text>}
      {error && <Text>Hata: {error}</Text>}
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.image} />
      )}
    </View>
  );
};
```

### 2. Profil Resimleri İçin
```tsx
import { useProfileImageDownload } from '../hooks/useImageDownload';

const AuthorInfo = ({ image_url, authorId }) => {
  const { imageUri, loading, error } = useProfileImageDownload(
    image_url, 
    authorId
  );

  return (
    <Image 
      source={imageUri ? { uri: imageUri } : DefaultAvatar} 
      style={styles.avatar} 
    />
  );
};
```

### 3. Profil Arka Plan Resimleri İçin
```tsx
import { useProfileBackgroundDownload } from '../hooks/useImageDownload';

const ProfileHeader = ({ background_url, userId }) => {
  const { imageUri, loading, error } = useProfileBackgroundDownload(
    background_url, 
    userId
  );

  return (
    <View style={styles.header}>
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.background} />
      )}
    </View>
  );
};
```

### 4. Genel Kullanım (Özel Bucket)
```tsx
import { useImageDownload } from '../hooks/useImageDownload';

const CustomImage = ({ imageUrl, userId }) => {
  const { imageUri, loading, error } = useImageDownload(
    imageUrl, 
    'custom-bucket', // Özel bucket adı
    userId
  );

  return (
    <View>
      {loading && <ActivityIndicator />}
      {error && <Text>Resim yüklenemedi</Text>}
      {imageUri && <Image source={{ uri: imageUri }} />}
    </View>
  );
};
```

## Direkt Service Kullanımı

### Fonksiyon Seviyesinde Kullanım
```tsx
import { ImageService } from '../services/ImageService';

const downloadImage = async () => {
  const result = await ImageService.downloadPostImage(
    'image.jpg',
    'user123',
    (state) => {
      console.log('Loading:', state.loading);
      console.log('Error:', state.error);
      console.log('Image URI:', state.imageUri);
    }
  );
  
  if (result) {
    console.log('Resim başarıyla indirildi:', result);
  }
};
```

## Bucket Yapısı
- **`routes`**: Post/rota resimleri
- **`profiles`**: Profil resimleri ve arka plan resimleri

## Performans İpuçları
1. **Önbellek Kullanımı**: Resimler otomatik olarak önbelleğe alınır
2. **Lazy Loading**: Hook'lar sadece gerekli olduğunda çalışır
3. **Memory Management**: Eski önbellekler otomatik temizlenir

## Hata Yönetimi
```tsx
const { imageUri, loading, error } = usePostImageDownload(imageUrl, userId);

if (error) {
  // Hata durumunda varsayılan resim göster
  return <Image source={DefaultImage} />;
}

if (loading) {
  // Yükleme durumunda spinner göster
  return <ActivityIndicator />;
}
```

## Önbellek Yönetimi
```tsx
import { ImageService } from '../services/ImageService';

// Önbelleği temizle
await ImageService.clearCache();

// Önbellek boyutunu kontrol et
const cacheSize = ImageService.getCacheSize();
console.log('Önbellek boyutu:', cacheSize);
```

## Migration (Mevcut Kod Güncelleme)

### Eski Kod:
```tsx
const [imageUri, setImageUri] = useState(null);

const downloadImage = async (image_url) => {
  try {
    const { data, error } = await supabase
      .storage
      .from('profiles')
      .download(`${userId}/${image_url}`);
    
    const reader = new FileReader();
    reader.onloadend = () => setImageUri(reader.result);
    reader.readAsDataURL(data);
  } catch (error) {
    console.error(error);
  }
};

useEffect(() => {
  downloadImage(image_url);
}, [image_url]);
```

### Yeni Kod:
```tsx
const { imageUri, loading, error } = useProfileImageDownload(image_url, userId);
```

## Avantajlar
- 🚀 **%70 daha az kod**: Tek satırla resim indirme
- 🔄 **Otomatik yeniden deneme**: Ağ hatalarında otomatik çözüm
- 💾 **Akıllı önbellekleme**: Hızlı yükleme ve düşük veri kullanımı
- 🛡️ **Tip güvenliği**: TypeScript ile tam güvenlik
- 🎯 **Tutarlılık**: Tüm uygulamada aynı davranış
