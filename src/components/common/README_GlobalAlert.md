# Global Alert Sistemi

Global Alert sistemi, uygulama genelinde kullanılabilecek bottom alert bildirimleri için tasarlanmıştır. "Copied to clipboard", "Başarılı", "Hata" gibi bildirimler için kullanılır.

## Özellikler

- ✅ Sade ve minimal tasarım (siyah arka plan, beyaz metin)
- ✅ Aşağıdan yukarı çıkma animasyonu
- ✅ Otomatik kapanma (süre ayarlanabilir)
- ✅ Manuel kapatma butonu
- ✅ Action butonu desteği
- ✅ Smooth animasyonlar
- ✅ TypeScript desteği
- ✅ Context API ile global erişim

## Kurulum

Sistem zaten `App.tsx`'de kurulu. Herhangi bir ek kurulum gerekmez.

## Kullanım

### 1. useGlobalAlert Hook'u ile

```tsx
import { useGlobalAlert } from '../hooks/useGlobalAlert';

const MyComponent = () => {
  const { showAlert, copyToClipboard, showActionAlert } = useGlobalAlert();

  const handleCopy = async () => {
    await copyToClipboard('Kopyalanacak metin', 'Panoya kopyalandı!');
  };

  const handleSuccess = () => {
    showAlert('İşlem başarılı!');
  };

  const handleError = () => {
    showAlert('Bir hata oluştu!');
  };

  return (
    <View>
      <TouchableOpacity onPress={handleCopy}>
        <Text>Kopyala</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### 2. Direkt Context ile

```tsx
import { useAlert } from '../context/AlertContext';

const MyComponent = () => {
  const { showAlert } = useAlert();

  const handleCustomAlert = () => {
    showAlert({
      message: 'Özel mesaj',
      duration: 5000,
      action: {
        label: 'Tamam',
        onPress: () => console.log('Action pressed'),
      },
    });
  };

  return (
    <TouchableOpacity onPress={handleCustomAlert}>
      <Text>Özel Alert</Text>
    </TouchableOpacity>
  );
};
```

## Basit Alert

```tsx
showAlert('Mesaj');
```

## Süre ile Alert

```tsx
showAlert('Mesaj', 5000); // 5 saniye
```

## Action Button ile Alert

```tsx
showActionAlert(
  'Dosya silinecek, emin misiniz?',
  'Sil',
  () => deleteFile()
);
```

## Clipboard İşlemleri

```tsx
// Basit kopyalama
await copyToClipboard('Metin');

// Özel mesaj ile kopyalama
await copyToClipboard('Metin', 'Özel mesaj!');
```

## Özelleştirme

### Süre Ayarlama
```tsx
showAlert('Mesaj', 5000); // 5 saniye
```

### Action Button
```tsx
showAlert({
  message: 'Mesaj',
  duration: 5000,
  action: {
    label: 'Buton',
    onPress: () => {},
  },
});
```

## Stil Özelleştirme

Alert stilleri `GlobalAlert.tsx` dosyasında tanımlanmıştır:

- **Arka Plan**: Siyah (#000)
- **Metin**: Beyaz (#fff)
- **Konum**: Aşağıdan yukarı
- **Animasyon**: Slide up/down + fade

## Animasyonlar

- **Giriş**: 300ms slide up + fade in
- **Çıkış**: 250ms slide down + fade out
- **Native Driver**: Tüm animasyonlar native driver kullanır

## Örnek Kullanım Senaryoları

### 1. Clipboard İşlemleri
```tsx
const handleCopy = async () => {
  await copyToClipboard(postUrl, 'Link kopyalandı!');
};
```

### 2. Form Validasyonu
```tsx
const handleSubmit = () => {
  if (!isValid) {
    showAlert('Lütfen tüm alanları doldurun');
    return;
  }
  showAlert('Form başarıyla gönderildi!');
};
```

### 3. Network İşlemleri
```tsx
const handleUpload = async () => {
  try {
    await uploadFile();
    showAlert('Dosya yüklendi!');
  } catch (error) {
    showAlert('Yükleme başarısız!');
  }
};
```

### 4. Onay İşlemleri
```tsx
const handleDelete = () => {
  showActionAlert(
    'Bu işlem geri alınamaz. Emin misiniz?',
    'Sil',
    () => deleteItem()
  );
};
```
