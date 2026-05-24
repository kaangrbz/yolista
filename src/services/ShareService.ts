import { Platform, Share as RNShare, Alert } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { APP_PUBLISHED_ORIGIN } from '../constants/appLinks';
import { encodeProfileUsername } from '../utils/profileSlug';

export interface ShareOptions {
  title: string;
  message?: string;
  url?: string;
  postId: string;
}

export class ShareService {
  static generatePostUrl(postId: string): string {
    return `${APP_PUBLISHED_ORIGIN}/post/${postId}`;
  }

  static generateProfileUrl(username: string): string {
    return `${APP_PUBLISHED_ORIGIN}/profile/${encodeProfileUsername(username)}`;
  }

  static async shareProfile(
    username: string,
    displayName: string,
    handle?: string,
  ): Promise<boolean> {
    const url = ShareService.generateProfileUrl(username);
    const label = handle
      ? `${displayName} (@${handle})`
      : displayName;

    try {
      const result = await ShareService.shareLinkNative(url, label);

      return result.action === RNShare.sharedAction;
    } catch (error) {
      console.error('Error sharing profile:', error);
      Alert.alert('Hata', 'Profil paylaşılırken bir hata oluştu');

      return false;
    }
  }

  /** Paylaşım metni: özel mesaj varsa o + link; yoksa rota başlığı + link; başlık yoksa sadece link */
  static composeShareMessage(
    postTitle: string,
    url: string,
    customMessage?: string,
  ): string {
    const trimmedCustom = customMessage?.trim() ?? '';
    const trimmedTitle = postTitle.trim();

    if (trimmedCustom.length > 0) {
      return `${trimmedCustom}\n\n${url}`;
    }

    if (trimmedTitle.length > 0) {
      return `${trimmedTitle}\n\n${url}`;
    }

    return url;
  }

  private static async shareLinkNative(
    url: string,
    postTitle: string,
    customMessage?: string,
  ): Promise<{ action: string }> {
    const message = ShareService.composeShareMessage(postTitle, url, customMessage);

    return RNShare.share({
      message,
      url: Platform.OS === 'ios' ? url : undefined,
      title: 'Yolista',
    });
  }

  static async sharePost(options: ShareOptions): Promise<boolean> {
    try {
      const url = options.url || this.generatePostUrl(options.postId);
      const result = await this.shareLinkNative(
        url,
        options.title,
        options.message,
      );

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
      const result = await this.shareLinkNative(
        url,
        options.title,
        options.message,
      );

      return result.action === RNShare.sharedAction;
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      return false;
    }
  }

  static async shareToTelegram(options: ShareOptions): Promise<boolean> {
    try {
      const url = options.url || this.generatePostUrl(options.postId);
      const result = await this.shareLinkNative(
        url,
        options.title,
        options.message,
      );

      return result.action === RNShare.sharedAction;
    } catch (error) {
      console.error('Error sharing to Telegram:', error);
      return false;
    }
  }

  static async shareToTwitter(options: ShareOptions): Promise<boolean> {
    try {
      const url = options.url || this.generatePostUrl(options.postId);
      const result = await this.shareLinkNative(
        url,
        options.title,
        options.message,
      );

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

    return ShareService.composeShareMessage(
      options.title,
      url,
      options.message,
    );
  }
}
