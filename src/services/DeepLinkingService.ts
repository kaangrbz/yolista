import { Linking, Alert } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { APP_SCHEME, APP_PUBLISHED_ORIGIN, isAppLinkHost } from '../constants/appLinks';
import { ShareService } from './ShareService';
import AuthLinkingService from './AuthLinkingService';
import { isAuthLink } from '../utils/parseAuthLink';

export interface DeepLinkData {
  type: 'route' | 'profile' | 'category' | 'explore';
  id?: string;
  params?: Record<string, any>;
}

class DeepLinkingService {
  private navigationRef: NavigationContainerRef<any> | null = null;
  private pendingURL: string | null = null;

  /**
   * Navigation referansını ayarla
   */
  setNavigationRef(ref: NavigationContainerRef<any>) {
    this.navigationRef = ref;
    
    // Pending URL varsa işle
    if (this.pendingURL) {
      this.handleDeepLink(this.pendingURL);
      this.pendingURL = null;
    }
  }

  /**
   * Deep linking'i başlat
   */
  async initialize() {
    // Uygulama kapalıyken açılan link'i al
    try {
      const initialURL = await Linking.getInitialURL();
      if (initialURL) {
        console.log('📱 [DeepLink] Initial URL:', initialURL);
        this.handleDeepLink(initialURL);
      }
    } catch (error) {
      console.error('📱 [DeepLink] Initial URL Error:', error);
    }

    // Uygulama açıkken gelen link'leri dinle
    const handleURL = (event: { url: string }) => {
      console.log('📱 [DeepLink] Incoming URL:', event.url);
      this.handleDeepLink(event.url);
    };

    Linking.addEventListener('url', handleURL);

    return () => {
      Linking.removeAllListeners('url');
    };
  }

  /**
   * Deep link'i işle
   */
  private handleDeepLink(url: string) {
    try {
      if (isAuthLink(url)) {
        void AuthLinkingService.handleUrl(url);
        return;
      }

      const linkData = this.parseDeepLink(url);

      if (!linkData) {
        console.warn('📱 [DeepLink] Invalid URL format:', url);
        return;
      }

      console.log('📱 [DeepLink] Parsed data:', linkData);

      // Navigation hazır değilse beklet
      if (!this.navigationRef?.isReady()) {
        console.log('📱 [DeepLink] Navigation not ready, pending...');
        this.pendingURL = url;
        return;
      }

      this.navigateToScreen(linkData);
    } catch (error) {
      console.error('📱 [DeepLink] Handle error:', error);
    }
  }

  /**
   * URL'yi parse et
   */
  private parseDeepLink(url: string): DeepLinkData | null {
    try {
      const parsedURL = new URL(url);
      
      // yolista://route/123 format
      if (parsedURL.protocol === `${APP_SCHEME}:`) {
        const pathParts = [
          parsedURL.hostname,
          ...parsedURL.pathname.split('/').filter(Boolean),
        ].filter(Boolean);
        let type = pathParts[0] as DeepLinkData['type'];
        const id = pathParts[1];

        if (type === 'post' as DeepLinkData['type']) {
          type = 'route';
        }

        return {
          type,
          id,
          params: this.parseSearchParams(parsedURL.searchParams),
        };
      }

      // https://yolista.roulista.com/route/123 (yayınlanan site)
      if (isAppLinkHost(parsedURL.hostname)) {
        const pathParts = parsedURL.pathname.split('/').filter(Boolean);
        let type = pathParts[0] as DeepLinkData['type'];
        const id = pathParts[1];

        if (type === 'post' as DeepLinkData['type']) {
          type = 'route';
        }

        return {
          type,
          id,
          params: this.parseSearchParams(parsedURL.searchParams),
        };
      }

      return null;
    } catch (error) {
      console.error('📱 [DeepLink] Parse error:', error);
      return null;
    }
  }

  /**
   * Search params'ları parse et
   */
  private parseSearchParams(searchParams: URLSearchParams): Record<string, any> {
    const params: Record<string, any> = {};
    
    for (const [key, value] of searchParams.entries()) {
      // JSON parse etmeye çalış
      try {
        params[key] = JSON.parse(value);
      } catch {
        params[key] = value;
      }
    }
    
    return params;
  }

  /**
   * Ekrana yönlendir
   */
  private navigateToScreen(linkData: DeepLinkData) {
    if (!this.navigationRef) {
      console.warn('📱 [DeepLink] Navigation ref not available');
      return;
    }

    try {
      switch (linkData.type) {
        case 'route':
          if (linkData.id) {
            this.navigationRef.navigate('RouteDetail', { 
              routeId: linkData.id,
              ...linkData.params 
            });
          }
          break;

        case 'profile':
          if (linkData.id) {
            this.navigationRef.navigate('ProfileMain', {
              username: linkData.id,
              ...linkData.params,
            });
          }
          break;

        case 'category':
          this.navigationRef.navigate('ExploreMain', { 
            categoryId: linkData.id,
            ...linkData.params 
          });
          break;

        case 'explore':
          this.navigationRef.navigate('ExploreMain', linkData.params);
          break;

        default:
          // Genel anasayfa
          this.navigationRef.navigate('HomeMain');
          break;
      }

      console.log('📱 [DeepLink] Navigation successful:', linkData.type);
    } catch (error) {
      console.error('📱 [DeepLink] Navigation error:', error);
      
      // Fallback: Ana sayfaya yönlendir
      this.navigationRef.navigate('HomeMain');
    }
  }

  /**
   * Share URL oluştur
   */
  generateShareURL(type: DeepLinkData['type'], id?: string, params?: Record<string, any>): string {
    let path = '';

    switch (type) {
      case 'route':
        if (id) {
          return ShareService.generatePostUrl(id);
        }
        path = '/';
        break;
      case 'profile':
        if (id) {
          return ShareService.generateProfileUrl(id);
        }
        path = '/';
        break;
      case 'category':
        path = id ? `/category/${id}` : '/explore';
        break;
      case 'explore':
        path = '/explore';
        break;
      default:
        path = '/';
    }

    const url = new URL(path, APP_PUBLISHED_ORIGIN);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      });
    }

    return url.toString();
  }

  /**
   * App scheme URL oluştur (fallback)
   */
  generateAppURL(type: DeepLinkData['type'], id?: string, params?: Record<string, any>): string {
    let path = '';
    switch (type) {
      case 'route':
        path = `/route/${id}`;
        break;
      case 'profile':
        path = id ? `/profile/${encodeURIComponent(id)}` : '/profile';
        break;
      case 'category':
        path = `/category/${id}`;
        break;
      case 'explore':
        path = '/explore';
        break;
      default:
        path = '/';
    }

    const url = new URL(`${APP_SCHEME}:${path}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      });
    }

    return url.toString();
  }

  /**
   * Link'in açılabilir olup olmadığını kontrol et
   */
  async canOpenURL(url: string): Promise<boolean> {
    try {
      return await Linking.canOpenURL(url);
    } catch (error) {
      console.error('📱 [DeepLink] CanOpenURL error:', error);
      return false;
    }
  }

  /**
   * External URL aç
   */
  async openURL(url: string): Promise<boolean> {
    try {
      const canOpen = await this.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('📱 [DeepLink] OpenURL error:', error);
      return false;
    }
  }
}

export default new DeepLinkingService();
