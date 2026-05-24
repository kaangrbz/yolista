export const validateName = (name: string): boolean => {
  const regex = /^[\p{L}\p{M}\s'-]{3,200}$/u;

  return regex.test(name);
};

export function validateUsername(username: string): boolean {
  const regex = /^(?!.*[._]{2})[a-zA-Z0-9._]{3,30}(?<!\.)$/;

  return regex.test(username);
}

// Validate if a string is a valid email address
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return regex.test(email);
}

type ValidatePasswordGlobalOptions = {
  minLength?: number;
  maxLength?: number;
};

export function validatePasswordGlobal(
  password: string,
  options: ValidatePasswordGlobalOptions = {},
): boolean {
  const minLength = options.minLength || 8;
  const maxLength = options.maxLength || 128;

  if (typeof password !== 'string') {
    return false;
  }

  if (password.length < minLength || password.length > maxLength) {
    return false;
  }

  return true;
}

// Default password validation used app-wide
export function validatePassword(password: string): boolean {
  return validatePasswordGlobal(password);
}

export function validatePhone(phone: string): boolean {
  const regex = /^\d{10}$/;

  return regex.test(phone);
}

// Example usage of validations with error messages
export function getValidationMessage(
  type: 'email' | 'password' | 'phone' | 'username' | 'name',
  value: string,
): string {
  if (type === 'name') {
    return validateName(value)
      ? 'Ad geçerli.'
      : 'İsim minimum 3 karakter uzunluğunda ve sadece harf olmalıdır. ';
  }

  if (type === 'username') {
    return validateUsername(value)
      ? 'Kullanıcı adı geçerli.'
      : value.endsWith(' ') || value.endsWith('.') || value.startsWith('.') || value.startsWith(' ')
      ? 'Kullanıcı adı boşluk veya nokta ile başlayamaz ve bitemez.'
      : 'Kullanıcı adı minimum 3 maksimum 30 karakter uzunluğunda olabilir ve yalnızca latin harfleri, rakam, alt çizgi (_) ve nokta (.) içerebilir.';
  }

  if (type === 'email') {
    return validateEmail(value)
      ? 'E-posta geçerli.'
      : 'Lütfen geçerli bir e-posta adresi giriniz.';
  }

  if (type === 'password') {
    return validatePassword(value)
      ? 'Şifre geçerli.'
      : 'Şifre 8-128 karakter olmalıdır.';
  }

  if (type === 'phone') {
    return validatePhone(value)
      ? 'Telefon numarası geçerli.'
      : 'Telefon numarası en az 10 karakter uzunluğunda olmalıdır.';
  }

  return 'Bilinmeyen doğrulama türü.';
}
