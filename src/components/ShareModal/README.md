# ShareModal Component

Instagram tarzı paylaşım modal'ı. Post'ları farklı platformlarda paylaşmak için kullanılır.

## Özellikler

### 📱 Paylaşım Seçenekleri
- **Link Paylaş**: Genel paylaşım (sistem paylaşım menüsü)
- **Linki Kopyala**: Link'i panoya kopyalar
- **WhatsApp**: WhatsApp'ta paylaş
- **Telegram**: Telegram'da paylaş
- **Twitter**: Twitter'da paylaş
- **Daha Fazla**: Diğer uygulamalar

### ✏️ Özelleştirilebilir Mesaj
- İsteğe bağlı mesaj ekleme
- 200 karakter sınırı
- Gerçek zamanlı karakter sayacı

### 👀 Önizleme
- Post başlığı
- Paylaşılacak metin önizlemesi (başlık + link)
- Görsel placeholder

### Paylaşım metni (varsayılan)

Özel mesaj yoksa:

```
{Rota başlığı}

https://yolista.roulista.com/post/{postId}
```

Özel mesaj varsa: `{mesaj}\n\n{link}`. «Linki kopyala» tam bu metni kopyalar.

## Kullanım

```tsx
<ShareModal
  visible={isVisible}
  onClose={() => setIsVisible(false)}
  postId="123"
  postTitle="Güzel bir gün"
  postImage="https://example.com/image.jpg"
  postUrl="https://yolista.roulista.com/post/123"
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | ✅ | Modal görünürlüğü |
| `onClose` | `() => void` | ✅ | Modal kapatma fonksiyonu |
| `postId` | `string` | ✅ | Post ID'si |
| `postTitle` | `string` | ✅ | Post başlığı |
| `postImage` | `string?` | ❌ | Post görseli |
| `postUrl` | `string?` | ❌ | Özel URL (varsayılan: https://yolista.roulista.com/post/{postId}) |

## Servis Kullanımı

```tsx
import { ShareService } from '../services/ShareService';

// Genel paylaşım
await ShareService.sharePost({
  postId: '123',
  title: 'Güzel bir gün',
  message: 'Bu gönderiyi inceleyin!',
  url: 'https://yolista.roulista.com/post/123'
});

// WhatsApp'ta paylaş
await ShareService.shareToWhatsApp({
  postId: '123',
  title: 'Güzel bir gün'
});

// Link kopyala
await ShareService.copyToClipboard({
  postId: '123',
  title: 'Güzel bir gün'
});
```

## Tasarım

- **Modal Style**: Alt kısımdan yukarı çıkan modal
- **Responsive**: Farklı ekran boyutlarına uyumlu
- **iOS Style**: iOS tarzı tasarım
- **Smooth Animations**: Yumuşak geçişler

## Gelecek Özellikler

- [ ] Clipboard entegrasyonu (@react-native-clipboard/clipboard)
- [ ] Daha fazla sosyal medya platformu
- [ ] QR kod oluşturma
- [ ] Paylaşım istatistikleri
- [ ] Özel paylaşım şablonları
