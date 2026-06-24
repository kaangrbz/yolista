import DeepLinkingService from '../services/DeepLinkingService';
import { APP_PUBLISHED_ORIGIN } from '../constants/appLinks';

/**
 * Deep linking test fonksiyonları
 * Development aşamasında test etmek için kullanılır
 */

export const testDeepLinks = () => {
  console.log('🔗 Deep Link Test URLs:');

  // Route share URL'i
  const routeUrl = DeepLinkingService.generateShareURL('route', '123', {
    title: 'Harika Bir Rota',
    utm_source: 'test',
  });
  console.log('Route URL:', routeUrl);

  // Profile share URL'i
  const profileUrl = DeepLinkingService.generateShareURL('profile', 'kaan_yolcu', {
    utm_source: 'test',
  });
  console.log('Profile URL:', profileUrl);

  // App scheme URL'leri
  const routeAppUrl = DeepLinkingService.generateAppURL('route', '123');
  console.log('Route App URL:', routeAppUrl);

  const profileAppUrl = DeepLinkingService.generateAppURL('profile', 'kaan_yolcu');
  console.log('Profile App URL:', profileAppUrl);
};

/**
 * Test URL'lerini console'a yazdır
 */
export const logTestUrls = () => {
  console.log('\n🔗 TEST URLS FOR DEEP LINKING:');
  console.log('================================');

  const testUrls = [
    // Website URLs (will redirect to app)
    `${APP_PUBLISHED_ORIGIN}/post/123`,
    `${APP_PUBLISHED_ORIGIN}/profile/kaan_yolcu`,
    `${APP_PUBLISHED_ORIGIN}/category/travel`,
    `${APP_PUBLISHED_ORIGIN}/explore`,
    // Legacy domain (uyumluluk)
    'https://web.youlistaapp.com/post/123',

    // App scheme URLs (direct app opening)
    'yolista://route/123',
    'yolista://profile/kaan_yolcu',
    'yolista://category/travel',
    'yolista://explore',
  ];

  testUrls.forEach((url, index) => {
    console.log(`${index + 1}. ${url}`);
  });

  console.log('\n📱 Test Instructions:');
  console.log('1. Website URLs: Open in browser, should show redirect page');
  console.log('2. App URLs: Use adb or Simulator to test direct app opening');
  console.log('3. Share URLs: Use ShareModal to generate and test');
  console.log('================================\n');
};

/**
 * Development modda otomatik test çalıştır
 */
if (__DEV__) {
  setTimeout(() => {
    logTestUrls();
  }, 2000);
}
