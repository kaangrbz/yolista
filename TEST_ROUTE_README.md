# Yolista Test Route Ekleme Aracı

Bu araç, Yolista uygulamasına rastgele başlık ve açıklama ile test route'ları eklemek için kullanılır.

## Kurulum

1. **Environment Variables Ayarlayın:**
   ```bash
   export SUPABASE_URL="your_supabase_url"
   export SUPABASE_ANON_KEY="your_supabase_anon_key"
   ```

2. **Supabase URL ve Key'i Bulun:**
   - Supabase dashboard'unuza gidin
   - Project Settings > API bölümünden URL ve anon key'i kopyalayın

## Kullanım

### Tek Route Ekleme
```bash
node testAddRoute.js
```

### Çoklu Route Ekleme
```bash
node testAddRoute.js 5  # 5 adet route ekler
node testAddRoute.js 10 # 10 adet route ekler
```

## Özellikler

- ✅ Rastgele başlık ve açıklama üretimi
- ✅ Rastgele şehir ve kategori seçimi
- ✅ 2-5 arası rastgele durak sayısı
- ✅ Türkiye koordinatları içinde rastgele konum
- ✅ Otomatik test kullanıcısı oluşturma
- ✅ Hata yönetimi ve detaylı loglama
- ✅ Toplu işlem desteği

## Örnek Çıktı

```
🚀 Yolista Test Route Ekleme Aracı
=====================================
🎯 Rastgele route ekleme başlıyor...
✅ Mevcut kullanıcı kullanılıyor: test_user_123
📊 Oluşturulan veriler:
- Başlık: İstanbul'un Gizli Köşeleri
- Açıklama: Bu rota İstanbul'un en güzel manzaralarını sunuyor...
- Şehir ID: 5
- Kategori ID: 3
- Nokta sayısı: 4
- Kullanıcı ID: 123e4567-e89b-12d3-a456-426614174000
🚀 Route oluşturuluyor...
✅ Route başarıyla oluşturuldu!
📋 Route ID: 456e7890-e89b-12d3-a456-426614174001
🔗 Route detayları: { id: '456e7890...', title: 'İstanbul'un Gizli Köşeleri', ... }

✨ İşlem tamamlandı!
```

## Rastgele Veri Örnekleri

### Başlıklar
- İstanbul'un Gizli Köşeleri
- Boğaz Manzaralı Yürüyüş Rotası
- Tarihi Yarımada Keşfi
- Moda'dan Kadıköy'e
- Galata Kulesi Çevresi

### Açıklamalar
- Tarihi dokuyu modern yaşamla harmanlayan rotalar
- Doğa ile şehir hayatının buluştuğu deneyimler
- Kültürel mirasımızı keşfetme fırsatları
- Gastronomi ve sanat rotaları

## Hata Durumları

Eğer environment variables ayarlanmamışsa:
```
❌ Supabase URL ve Key ayarlanmamış!
Lütfen environment variables olarak ayarlayın:
export SUPABASE_URL="your_supabase_url"
export SUPABASE_ANON_KEY="your_supabase_anon_key"
```

## Notlar

- Test kullanıcısı otomatik olarak oluşturulur
- Her route 2-5 arası durak içerir
- Koordinatlar Türkiye sınırları içindedir
- Şehir ve kategori ID'leri mevcut veritabanındaki değerlerden seçilir
