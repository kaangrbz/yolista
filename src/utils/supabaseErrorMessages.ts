type ErrorWithCode = {
  code?: string;
  message?: string;
  status?: number;
};

const authErrorCodeMessages: Record<string, string> = {
  anonymous_provider_disabled: 'Misafir giriş şu an devre dışı.',
  bad_code_verifier: 'Doğrulama işlemi başarısız oldu. Lütfen tekrar deneyin.',
  bad_json: 'Geçersiz istek verisi gönderildi.',
  bad_jwt: 'Oturum doğrulanamadı. Lütfen tekrar giriş yapın.',
  captcha_failed: 'Güvenlik doğrulaması başarısız oldu.',
  email_address_invalid: 'E-posta adresi geçersiz.',
  email_address_not_authorized: 'Bu e-posta adresine izin verilmiyor.',
  email_conflict_identity_not_deletable:
    'Bu e-posta farklı bir giriş yöntemiyle bağlı olduğu için kaldırılamıyor.',
  email_exists: 'Bu e-posta adresi zaten kullanımda.',
  email_not_confirmed: 'E-posta adresinizi doğrulamanız gerekiyor.',
  flow_state_expired: 'Doğrulama bağlantısının süresi dolmuş.',
  flow_state_not_found: 'Doğrulama oturumu bulunamadı.',
  identity_already_exists: 'Bu kimlik zaten başka bir hesapla bağlı.',
  insufficient_aal: 'Bu işlem için ek güvenlik doğrulaması gerekiyor.',
  invalid_credentials: 'E-posta veya şifre hatalı.',
  invalid_grant: 'Giriş bilgileri geçersiz veya süresi dolmuş.',
  invalid_login_credentials: 'E-posta veya şifre hatalı.',
  invalid_refresh_token: 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.',
  over_email_send_rate_limit:
    'Çok fazla e-posta isteği gönderildi. Lütfen biraz sonra tekrar deneyin.',
  over_request_rate_limit:
    'Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin.',
  phone_exists: 'Bu telefon numarası zaten kullanımda.',
  provider_disabled: 'Bu giriş yöntemi şu an devre dışı.',
  refresh_token_not_found: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.',
  request_timeout: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.',
  signup_disabled: 'Kayıt olma işlemi şu an devre dışı.',
  single_identity_not_deletable: 'Hesaptaki tek giriş yöntemi silinemez.',
  too_many_enrolled_mfa_factors:
    'Çok fazla güvenlik doğrulama yöntemi eklendi.',
  unexpected_audience: 'Kimlik doğrulama hedefi beklenmiyor.',
  user_already_exists: 'Bu e-posta adresi zaten kayıtlı.',
  user_not_found: 'Kullanıcı bulunamadı.',
  weak_password: 'Şifre güvenlik kriterlerini karşılamıyor.',
};

const postgrestOrPostgresCodeMessages: Record<string, string> = {
  '23503': 'Bağlantılı kayıt bulunamadı. Lütfen girdiğiniz bilgileri kontrol edin.',
  '23505': 'Bu bilgi zaten kayıtlı.',
  '42501': 'Bu işlem için yetkiniz bulunmuyor.',
  PGRST003: 'Sunucu yoğun. Lütfen biraz sonra tekrar deneyin.',
  PGRST100: 'Gönderilen sorgu parametreleri geçersiz.',
  PGRST101: 'Bu işlem yöntemi desteklenmiyor.',
  PGRST102: 'İstek gövdesi geçersiz.',
  PGRST116: 'Beklenen kayıt bulunamadı.',
  PGRST200: 'İlişkili tablo veya ilişki bilgisi güncel değil.',
  PGRST202: 'İstenen veritabanı fonksiyonu bulunamadı.',
  PGRST301: 'Oturum doğrulanamadı. Lütfen tekrar giriş yapın.',
};

const inferMessageFromRawText = (message: string): string | null => {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes('database error saving new user') ||
    normalizedMessage.includes('database error saving user')
  ) {
    return 'Kayıt oluşturulamadı. Bu e-posta zaten kayıtlı olabilir veya veritabanı tetikleyicisinde bir sorun olabilir.';
  }

  if (normalizedMessage.includes('user already registered')) {
    return 'Bu e-posta adresi zaten kayıtlı.';
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return 'E-posta adresinizi doğrulamanız gerekiyor.';
  }

  if (normalizedMessage.includes('invalid login credentials')) {
    return 'E-posta veya şifre hatalı.';
  }

  if (
    normalizedMessage.includes('network request failed') ||
    normalizedMessage.includes('failed to fetch')
  ) {
    return 'İnternet bağlantısı hatası. Lütfen bağlantınızı kontrol edin.';
  }

  return null;
};

export const translateSupabaseError = (
  error: unknown,
  fallbackMessage = 'İşlem sırasında bir hata oluştu.',
): string => {
  if (!error) {
    return fallbackMessage;
  }

  const castedError = error as ErrorWithCode;
  const code = castedError.code;
  const message = castedError.message;

  if (code && authErrorCodeMessages[code]) {
    return authErrorCodeMessages[code];
  }

  if (code && postgrestOrPostgresCodeMessages[code]) {
    return postgrestOrPostgresCodeMessages[code];
  }

  if (typeof message === 'string' && message.trim().length > 0) {
    const inferredMessage = inferMessageFromRawText(message);

    if (inferredMessage) {
      return inferredMessage;
    }
  }

  if (castedError.status === 429) {
    return 'Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin.';
  }

  if (castedError.status === 500) {
    return 'Sunucu tarafında geçici bir sorun oluştu. Lütfen tekrar deneyin.';
  }

  return fallbackMessage;
};
