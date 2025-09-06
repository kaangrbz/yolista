/**
 * Rastgele başlık ve açıklama ile post ekleyen Node.js test komutuibilgileri 
 * 
 * 
 * Kullanım:
 * node testAddRoute.js
 * 
 * Veya belirli sayıda post eklemek için:
 * node testAddRoute.js 5
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Supabase konfigürasyonu (src/lib/supabase.ts'den alındı)
const supabaseUrl = process.env.SUPABASE_URL || 'https://koimmduhmsjnerkqksmu.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvaW1tZHVobXNqbmVya3Frc211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyODI5OTMsImV4cCI6MjA1ODg1ODk5M30.N90ttUoEYmPDks7027rFwR0FaiEdE1kLB1lAiY7oDuk';

const supabase = createClient(supabaseUrl, supabaseKey);

// Rastgele başlık listesi
const randomTitles = [
  "İstanbul'un Gizli Köşeleri",
  "Boğaz Manzaralı Yürüyüş Rotası",
  "Tarihi Yarımada Keşfi",
  "Moda'dan Kadıköy'e",
  "Galata Kulesi Çevresi",
  "Sultanahmet'te Bir Gün",
  "Beyoğlu'nun Arka Sokakları",
  "Üsküdar'da Nostaljik Tur",
  "Çamlıca Tepesi'nden İstanbul",
  "Kız Kulesi'ne Giden Yol",
  "Eminönü'nden Eminönü'ne",
  "Fatih'in Tarihi Dokusu",
  "Beşiktaş'ta Spor ve Kültür",
  "Şişli'nin Modern Yüzü",
  "Kadıköy'ün Renkli Sokakları",
  "Bostancı Sahil Yürüyüşü",
  "Maltepe'den Pendik'e",
  "Kartal'ın Doğal Güzellikleri",
  "Pendik Marina Turu",
  "Tuzla'nın Sakin Köşeleri",
  "Ankara'nın Tarihi Yolları",
  "İzmir'in Ege Manzaraları",
  "Antalya'nın Turkuaz Koyları",
  "Kapadokya'nın Peri Bacaları",
  "Trabzon'un Yeşil Doğası",
  "Bursa'nın Osmanlı Mirası",
  "Gaziantep'in Lezzet Durakları",
  "Konya'nın Mistik Atmosferi",
  "Samsun'un Karadeniz Rüzgarı",
  "Adana'nın Sıcak İklimi"
];

// Rastgele açıklama listesi
const randomDescriptions = [
  "Bu rota İstanbul'un en güzel manzaralarını sunuyor. Tarihi dokuyu modern yaşamla harmanlayan bu yürüyüş rotası, şehrin farklı yüzlerini keşfetmenizi sağlayacak.",
  "Doğa ile şehir hayatının buluştuğu bu rota, hem dinlendirici hem de keşif dolu bir deneyim sunuyor. Fotoğraf çekmeyi unutmayın!",
  "Tarihi mekanları ve modern yaşam alanlarını bir arada görebileceğiniz bu rota, İstanbul'un çok katmanlı yapısını yansıtıyor.",
  "Bu yürüyüş rotası size şehrin farklı mahallelerini keşfetme fırsatı veriyor. Her köşede yeni bir sürpriz sizi bekliyor.",
  "Deniz manzaralı bu rota, hem doğa severler hem de şehir hayatını sevenler için ideal. Temiz hava ve güzel manzaralar eşliğinde keyifli bir yürüyüş.",
  "Kültürel mirasımızı ve modern yaşamı bir arada görebileceğiniz bu rota, İstanbul'un zengin tarihini keşfetmenizi sağlayacak.",
  "Bu rota boyunca hem tarihi yapıları hem de doğal güzellikleri görebilirsiniz. Şehrin farklı dönemlerinden izler taşıyan bu yürüyüş rotası çok özel.",
  "Sakin ve huzurlu bir ortamda yürümek isteyenler için ideal olan bu rota, şehrin gürültüsünden uzaklaşmanızı sağlayacak.",
  "Bu yürüyüş rotası size İstanbul'un farklı kültürlerini tanıma fırsatı veriyor. Her adımda yeni bir keşif sizi bekliyor.",
  "Deniz kenarında yürümeyi sevenler için mükemmel olan bu rota, hem temiz hava hem de güzel manzaralar sunuyor.",
  "Bu rota, şehrin en popüler turistik mekanlarını içeriyor. Yerli ve yabancı turistlerin mutlaka görmesi gereken yerler burada.",
  "Gastronomi tutkunları için hazırlanmış bu rota, şehrin en lezzetli duraklarını keşfetmenizi sağlayacak.",
  "Sanat ve kültür severler için özel olarak tasarlanmış bu rota, müzeler, galeriler ve tarihi mekanları içeriyor.",
  "Aileler için güvenli ve eğlenceli bu rota, çocukların da keyif alabileceği aktiviteler sunuyor.",
  "Romantik bir yürüyüş için ideal olan bu rota, çiftlerin unutulmaz anılar biriktirmesini sağlayacak."
];

// Kategori ID'si null (opsiyonel)
const categoryIds = [null];

// Rastgele şehir ID'leri (gerçek şehirlerden)
const cityIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

// Rastgele sayı üretici
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Rastgele eleman seçici
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Rastgele koordinat üretici (Türkiye çevresinde)
function getRandomCoordinates() {
  // Türkiye koordinatları (yaklaşık)
  const lat = 39.9334 + (Math.random() - 0.5) * 6; // ±3 derece
  const lng = 32.8597 + (Math.random() - 0.5) * 8; // ±4 derece
  return { lat, lng };
}

// Rastgele string üretici
function randomString(length) {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
}

// Rastgele route noktaları oluşturucu
function generateRandomRoutePoints(userId) {
  const pointCount = getRandomInt(2, 5); // 2-5 nokta arası
  const points = [];
  
  for (let i = 0; i < pointCount; i++) {
    const coords = getRandomCoordinates();
    points.push({
      title: i === 0 ? getRandomElement(randomTitles) : `Durak ${i + 1}`,
      description: i === 0 ? getRandomElement(randomDescriptions) : `Bu durakta ${getRandomInt(5, 30)} dakika kalabilirsiniz.`,
      latitude: coords.lat,
      longitude: coords.lng,
      order_index: i,
      user_id: userId,
      is_deleted: false,
      is_hidden: false
    });
  }
  
  return points;
}

// Test kullanıcısı ile giriş yap
async function getTestUser() {
  try {
    const testEmail = 'test@gmail.com';
    const testPassword = 'test123';
    
    console.log('🔐 Test kullanıcısı ile giriş yapılıyor...');
    
    // Kullanıcı girişi
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (authError) {
      console.error('❌ Giriş hatası:', authError);
      console.log('🔄 Kullanıcı kaydı deneniyor...');
      
      // Giriş başarısızsa kayıt olmayı dene
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      if (signUpError) {
        console.error('❌ Kayıt hatası:', signUpError);
        return null;
      }

      if (!signUpData.user) {
        console.error('❌ Kullanıcı oluşturulamadı');
        return null;
      }

      console.log(`✅ Test kullanıcısı oluşturuldu: ${signUpData.user.email}`);
      return signUpData.user.id;
    }

    if (!authData.user) {
      console.error('❌ Giriş başarısız');
      return null;
    }

    console.log(`✅ Test kullanıcısı ile giriş yapıldı: ${authData.user.email}`);
    return authData.user.id;
  } catch (error) {
    console.error('❌ Kullanıcı işlemi hatası:', error);
    return null;
  }
}

// Route oluşturma fonksiyonu
async function createRoute(routePoints, cityId, categoryId) {
  try {
    // Önce ana rotayı bul
    const mainRoute = routePoints.find(route => route.order_index === 0);
    
    if (!mainRoute) {
      throw new Error('Ana rota bulunamadı');
    }

    // Ana rotaya şehir ve kategori bilgilerini ekle
    mainRoute.city_id = cityId;
    mainRoute.category_id = categoryId;

    // Ana rotayı ekle
    const { data: route, error } = await supabase
      .from('routes')
      .insert(mainRoute)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const mainRouteId = route.id;

    // Diğer rotaları ekle
    const otherRoutes = routePoints.filter(route => route.order_index !== 0);
    
    if (otherRoutes.length > 0) {
      otherRoutes.forEach(route => {
        route.parent_id = mainRouteId;
        route.city_id = null;
        route.category_id = null;
      });

      const { data: routes, error: routesError } = await supabase
        .from('routes')
        .insert(otherRoutes)
        .select();

      if (routesError) {
        throw routesError;
      }
    }

    return { data: route, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Ana test fonksiyonu
async function addRandomRoute() {
  try {
    console.log('🎯 Rastgele route ekleme başlıyor...');
    
    // Test kullanıcısını al
    const userId = await getTestUser();
    if (!userId) {
      console.error('❌ Kullanıcı bulunamadı veya oluşturulamadı');
      return;
    }
    
    // Rastgele veriler oluştur
    const routePoints = generateRandomRoutePoints(userId);
    const cityId = getRandomElement(cityIds);
    const categoryId = getRandomElement(categoryIds);
    
    console.log('📊 Oluşturulan veriler:');
    console.log('- Başlık:', routePoints[0].title);
    console.log('- Açıklama:', routePoints[0].description.substring(0, 50) + '...');
    console.log('- Şehir ID:', cityId);
    console.log('- Kategori ID:', categoryId);
    console.log('- Nokta sayısı:', routePoints.length);
    console.log('- Kullanıcı ID:', userId);
    
    // Route oluştur
    console.log('🚀 Route oluşturuluyor...');
    const { data, error } = await createRoute(routePoints, cityId, categoryId);
    
    if (error) {
      console.error('❌ Route oluşturma hatası:', error);
    } else {
      console.log('✅ Route başarıyla oluşturuldu!');
      console.log('📋 Route ID:', data?.id);
      console.log('🔗 Route detayları:', {
        id: data?.id,
        title: data?.title,
        city_id: data?.city_id,
        category_id: data?.category_id,
        created_at: data?.created_at
      });
    }
    
    return { success: !error, data, error };
    
  } catch (err) {
    console.error('❌ Beklenmeyen hata:', err);
    return { success: false, data: null, error: err };
  }
}

// Toplu test fonksiyonu
async function addMultipleRandomRoutes(count = 5) {
  console.log(`🎯 ${count} adet rastgele route ekleme başlıyor...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 1; i <= count; i++) {
    console.log(`\n📝 ${i}/${count} route ekleniyor...`);
    const result = await addRandomRoute();
    
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }
    
    // Kısa bir bekleme
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n🎉 İşlem tamamlandı!`);
  console.log(`✅ Başarılı: ${successCount}`);
  console.log(`❌ Hatalı: ${errorCount}`);
  console.log(`📊 Toplam: ${count}`);
}

// Yardımcı fonksiyonlar
function showRandomData() {
  console.log('🎲 Rastgele veri örnekleri:');
  console.log('- Başlık:', getRandomElement(randomTitles));
  console.log('- Açıklama:', getRandomElement(randomDescriptions).substring(0, 50) + '...');
  console.log('- Şehir ID:', getRandomElement(cityIds));
  console.log('- Kategori ID:', getRandomElement(categoryIds));
  console.log('- Koordinatlar:', getRandomCoordinates());
}

// Ana fonksiyon
async function main() {
  const args = process.argv.slice(2);
  const count = args[0] ? parseInt(args[0]) : 1;
  
  console.log('🚀 Yolista Test Route Ekleme Aracı');
  console.log('=====================================');
  
  if (count > 1) {
    await addMultipleRandomRoutes(count);
  } else {
    await addRandomRoute();
  }
  
  console.log('\n✨ İşlem tamamlandı!');
}

// Script doğrudan çalıştırıldığında main fonksiyonunu çalıştır
if (require.main === module) {
  main().catch(console.error);
}

// Export fonksiyonları (diğer modüllerden kullanım için)
module.exports = {
  addRandomRoute,
  addMultipleRandomRoutes,
  showRandomData,
  generateRandomRoutePoints,
  getTestUser
};