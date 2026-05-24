import { NavigationContainerRef } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { parseAuthLink } from '../utils/parseAuthLink';
import { showToast } from '../utils/alert';

type AuthLinkNavigation = {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
};

class AuthLinkingService {
  private navigationRef: NavigationContainerRef<any> | null = null;
  private pendingUrl: string | null = null;

  setNavigationRef(ref: NavigationContainerRef<any>) {
    this.navigationRef = ref;

    if (this.pendingUrl) {
      void this.handleUrl(this.pendingUrl);
      this.pendingUrl = null;
    }
  }

  async handleUrl(rawUrl: string): Promise<boolean> {
    const parsedLink = parseAuthLink(rawUrl);

    if (!parsedLink) {
      return false;
    }

    if (!this.navigationRef?.isReady()) {
      this.pendingUrl = rawUrl;
      return true;
    }

    try {
      await this.consumeAuthLink(parsedLink);
      await this.navigateAfterAuth(parsedLink);

      return true;
    } catch (error) {
      console.error('[AuthLink] Handle error:', error);

      const message =
        error instanceof Error ? error.message : 'Bağlantı işlenirken bir hata oluştu';

      showToast('error', message);

      return true;
    }
  }

  private async consumeAuthLink(parsedLink: ReturnType<typeof parseAuthLink>) {
    if (!parsedLink) {
      return;
    }

    if (parsedLink.accessToken && parsedLink.refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: parsedLink.accessToken,
        refresh_token: parsedLink.refreshToken,
      });

      if (error) {
        throw error;
      }

      return;
    }

    if (parsedLink.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(parsedLink.code);

      if (error) {
        throw error;
      }

      return;
    }

    if (parsedLink.tokenHash) {
      const otpType =
        parsedLink.flow === 'recovery'
          ? 'recovery'
          : parsedLink.flow === 'signup'
            ? 'signup'
            : 'email';

      const { error } = await supabase.auth.verifyOtp({
        token_hash: parsedLink.tokenHash,
        type: otpType,
      });

      if (error) {
        throw error;
      }

      return;
    }

    if (parsedLink.otpToken && parsedLink.email) {
      const otpType =
        parsedLink.flow === 'recovery'
          ? 'recovery'
          : parsedLink.flow === 'signup'
            ? 'signup'
            : 'email';

      const { error } = await supabase.auth.verifyOtp({
        email: parsedLink.email,
        token: parsedLink.otpToken,
        type: otpType,
      });

      if (error) {
        throw error;
      }
    }
  }

  private async navigateAfterAuth(parsedLink: NonNullable<ReturnType<typeof parseAuthLink>>) {
    const navigation: AuthLinkNavigation = {
      navigate: (screen, params) => {
        this.navigationRef?.navigate(screen as never, params as never);
      },
    };

    const { data: { user } } = await supabase.auth.getUser();
    const sessionEmail = parsedLink.email || user?.email || undefined;

    if (parsedLink.flow === 'recovery') {
      navigation.navigate('ResetPassword', {
        email: sessionEmail,
        fromDeepLink: true,
      } as Record<string, unknown>);

      showToast('success', 'Şifre sıfırlama bağlantısı doğrulandı. Yeni şifreni belirle.');

      return;
    }

    navigation.navigate('VerifyEmail', {
      email: sessionEmail,
      verifiedFromLink: true,
    } as Record<string, unknown>);

    showToast('success', 'E-posta bağlantısı doğrulandı.');
  }
}

export default new AuthLinkingService();
