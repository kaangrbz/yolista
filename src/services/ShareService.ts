import { Share as RNShare, Alert } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

export interface ShareOptions {
  title: string;
  message?: string;
  url?: string;
  postId: string;
}

export class ShareService {
  static generatePostUrl(postId: string): string {
    // Gerçek uygulamada bu URL dinamik olarak oluşturulacak
    return `https://roulista.com/post/${postId}`;
  }

  static async sharePost(options: ShareOptions): Promise<boolean> {
    try {
      const url = options.url || this.generatePostUrl(options.postId);
      const message = options.message || `"${options.title}" gönderisini inceleyin: ${url}`;

      const result = await RNShare.share({
        message: message,
        url: url,
        title: options.title,
      });

      return result.action === RNShare.sharedAction;
    } catch (error) {
      console.error('Error sharing post:', error);
      Alert.alert('Hata', 'Paylaşım sırasında bir hata oluştu');
      return false;
    }
  }

  static async shareToWhatsApp(options: ShareOptions): Promise<boolean> {
    try {
      const url = options.url || this.generatePostUrl(options.postId);
      const message = `${options.message || `"${options.title}" gönderisini inceleyin`} ${url}`;

      const result = await RNShare.share({
        message: message,
        url: url,
      });

      return result.action === RNShare.sharedAction;
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      return false;
    }
  }

  static async shareToTelegram(options: ShareOptions): Promise<boolean> {
    try {
      const url = options.url || this.generatePostUrl(options.postId);
      const message = `${options.message || `"${options.title}" gönderisini inceleyin`} ${url}`;

      const result = await RNShare.share({
        message: message,
        url: url,
      });

      return result.action === RNShare.sharedAction;
    } catch (error) {
      console.error('Error sharing to Telegram:', error);
      return false;
    }
  }

  static async shareToTwitter(options: ShareOptions): Promise<boolean> {
    try {
      const url = options.url || this.generatePostUrl(options.postId);
      const message = `${options.message || `"${options.title}" gönderisini inceleyin`} ${url}`;

      const result = await RNShare.share({
        message: message,
        url: url,
      });

      return result.action === RNShare.sharedAction;
    } catch (error) {
      console.error('Error sharing to Twitter:', error);
      return false;
    }
  }

  static async copyToClipboard(options: ShareOptions): Promise<boolean> {
    try {
      const url = options.url || this.generatePostUrl(options.postId);

      await Clipboard.setString(url);
      Alert.alert('Başarılı', 'Link panoya kopyalandı!');

      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Hata', 'Link kopyalanırken bir hata oluştu');
      return false;
    }
  }

  static getShareableText(options: ShareOptions): string {
    const url = options.url || this.generatePostUrl(options.postId);
    return `${options.message || `"${options.title}" gönderisini inceleyin`} ${url}`;
  }
}
