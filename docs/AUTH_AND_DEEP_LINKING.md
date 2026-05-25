# Kimlik doğrulama ve deep link

Yayınlanan site: [https://yolista.roulista.com](https://yolista.roulista.com)

## Kimlik doğrulama ekranları

| Ekran | Dosya | Açıklama |
|-------|--------|----------|
| Giriş | `src/screens/LoginScreen.tsx` | Animasyonlu auth layout |
| Kayıt | `src/screens/RegisterScreen.tsx` | Kayıt + doğrulama yönlendirmesi |
| Şifremi unuttum | `src/screens/ForgotPasswordScreen.tsx` | E-postaya OTP / link gönderir |
| Yeni şifre | `src/screens/ResetPasswordScreen.tsx` | 6 haneli kod veya deep link sonrası şifre |
| E-posta doğrulama | `src/screens/VerifyEmailScreen.tsx` | OTP veya mail linki |

Paylaşılan UI: `src/components/auth/shared/` (`AuthScreenLayout`, `AuthTextInput`, `AuthOtpInput`, …)

### AuthContext metodları

- `signIn`, `signUp`, `logout`
- `resetPasswordForEmail` — redirect: `https://yolista.roulista.com/auth/mobile?flow=recovery`
- `verifyEmailOtp`, `verifyRecoveryOtp`, `updatePassword`
- `resendSignupConfirmation` — `emailRedirectTo: .../auth/mobile?flow=signup` ile yeniden gönderim
- `isEmailConfirmed`, `refreshAuthSession`

### Profilde e-posta doğrulama

- `src/components/profile/ProfileEmailVerification.tsx` — banner
- Ayarlar: `ProfileSettingsModal` → «E-postayı doğrula»
- Giriş yapılmışken: `ProfileStack` → `VerifyEmail`

## Deep link mimarisi

### Uygulama şeması

```
yolista://route/{id}
yolista://profile/{username}
yolista://category/{id}
yolista://explore
yolista://auth/mobile?flow=recovery&...
```

### Universal link / App Link hostları

- `yolista.roulista.com` (birincil)
- `www.yolista.roulista.com`
- `roulista.com`, `www.roulista.com` (eski uyumluluk)

### Servisler

| Servis | Dosya | Görev |
|--------|--------|--------|
| `DeepLinkingService` | `src/services/DeepLinkingService.ts` | Rota, profil, keşfet, kategori |
| `AuthLinkingService` | `src/services/AuthLinkingService.ts` | Auth token / OTP linkleri |
| Sabitler | `src/constants/appLinks.ts` | Origin, redirect URL’leri |

Auth linkleri önce `AuthLinkingService`’te işlenir (`App.tsx` → `DeepLinkingService.initialize`).

### Web paylaşım URL’leri

```
https://yolista.roulista.com/post/{routeId}
https://yolista.roulista.com/profile/{username}
https://yolista.roulista.com/route/{routeId}   (alternatif)
```

`ShareService.generatePostUrl()` ve `DeepLinkingService.generateShareURL()` bu domain’i kullanır. Web’de `/post/{id}` açılır; uygulama bunu `route` olarak yorumlar.

### Native yapılandırma

- **Android:** `android/app/src/main/AndroidManifest.xml` — `https` host + `yolista` scheme
- **iOS:** `ios/yolista/Info.plist` — `CFBundleURLSchemes`, `com.apple.developer.associated-domains`

### Supabase (zorunlu ayarlar)

Dashboard → **Authentication** → **URL Configuration** → **Redirect URLs**:

```
https://yolista.roulista.com/auth/mobile
https://yolista.roulista.com/auth/mobile/**
yolista://auth/mobile
yolista://reset-password
```

SMTP açık olmalı; şifre sıfırlama ve e-posta doğrulama mailleri için.

### E-posta şablonları

Kaynak: `supabase/templates/` (`confirmation.html`, `recovery.html`, `invite.html`)  
Metin kaynağı: `../shared/auth-messages.ts`  
Detaylı matris ve Dashboard checklist: `../docs/AUTH_MESSAGES.md`

Local: `supabase/config.toml` → `[auth.email.template.*]`  
Production: Supabase Dashboard → Authentication → Email Templates (HTML + subject repo ile eşleştirilmeli)

- Gönderen: `Yolista` / `noreply@yolista.app`
- Destek linki (şablon): `mailto:yolistaapp@gmail.com`
- Logo: `https://yolista.roulista.com/logo-email.png`

### Test

Geliştirmede `src/utils/deepLinkTester.ts` örnek URL’ler loglar.

```bash
# iOS simülatör
xcrun simctl openurl booted "yolista://route/ROTA_UUID"

# Android
adb shell am start -a android.intent.action.VIEW -d "https://yolista.roulista.com/post/ROTA_UUID"
```

## İlgili web dokümantasyonu

Web köprü sayfaları: `../yolista-web/docs/DEEP_LINKING.md`
