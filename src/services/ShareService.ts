import { Linking, Platform, Share as RNShare, Alert } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { APP_PUBLISHED_ORIGIN } from '../constants/appLinks';
import { encodeProfileUsername } from '../utils/profileSlug';
import { composeRouteShareText } from '../utils/composeRouteShareText';

export interface ShareOptions {
  title: string;
  message?: string;
  url?: string;
  postId: string;
  cityName?: string | null;
  categoryName?: string | null;
  stopCount?: number;
  stopTitles?: string[];
  authorUsername?: string | null;
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

  static hasRichShareContext(options: Pick<
    ShareOptions,
    'cityName' | 'categoryName' | 'stopCount' | 'stopTitles'
  >): boolean {
    return (
      options.stopCount !== undefined ||
      (options.stopTitles?.length ?? 0) > 0 ||
      Boolean(options.cityName?.trim()) ||
      Boolean(options.categoryName?.trim())
    );
  }

  /** Paylaşım metni: zengin rota bağlamı varsa composeRouteShareText; yoksa kısa etiket + link */
  static composeShareMessage(
    postTitle: string,
    url: string,
    customMessage?: string,
    richContext?: Pick<
      ShareOptions,
      'cityName' | 'categoryName' | 'stopCount' | 'stopTitles' | 'authorUsername'
    >,
  ): string {
    if (richContext && ShareService.hasRichShareContext(richContext)) {
      return composeRouteShareText({
        cityName: richContext.cityName,
        categoryName: richContext.categoryName,
        stopCount: richContext.stopCount ?? 0,
        stopTitles: richContext.stopTitles,
        authorUsername: richContext.authorUsername,
        url,
        customMessage,
      });
    }

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

  static resolveShareMessage(options: ShareOptions): string {
    const url = options.url || ShareService.generatePostUrl(options.postId);

    return ShareService.composeShareMessage(
      options.title,
      url,
      options.message,
      ShareService.hasRichShareContext(options)
        ? {
            cityName: options.cityName,
            categoryName: options.categoryName,
            stopCount: options.stopCount,
            stopTitles: options.stopTitles,
            authorUsername: options.authorUsername,
          }
        : undefined,
    );
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

  static async shareToWhatsApp(message: string): Promise<boolean> {
    try {
      const canOpenWhatsApp = await Linking.canOpenURL('whatsapp://');

      if (canOpenWhatsApp) {
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
        await Linking.openURL(whatsappUrl);
        return true;
      }

      const result = await RNShare.share({ message });
      return result.action === RNShare.sharedAction;
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      return false;
    }
  }

  static async copyToClipboard(options: ShareOptions): Promise<boolean> {
    try {
      const text = ShareService.resolveShareMessage(options);

      await Clipboard.setString(text);
      Alert.alert('Başarılı', 'Paylaşım metni panoya kopyalandı!');

      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Hata', 'Link kopyalanırken bir hata oluştu');
      return false;
    }
  }

  static getShareableText(options: ShareOptions): string {
    return ShareService.resolveShareMessage(options);
  }
}
