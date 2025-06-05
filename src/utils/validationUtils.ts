export const validateName = (name: string): boolean => {
  const regex = /^[\p{L}\p{M}\s'-]{3,200}$/u;
  return regex.test(name);
};

export function validateUsername(username: string): boolean {
  const regex = /^(?!.*[._]{2})[a-zA-Z0-9._]{1,30}(?<!\.)$/;
  return regex.test(username);
}

// Validate if a string is a valid email address
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validate if a string is a valid password
export function validatePassword(password: string): boolean {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
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
      : 'Kullanıcı adı yalnızca latin harfleri, rakam, alt çizgi (_) ve nokta (.) içerebilir.';
  }

  if (type === 'email') {
    return validateEmail(value)
      ? 'E-posta geçerli.'
      : 'Lütfen geçerli bir e-posta adresi giriniz.';
  }

  if (type === 'password') {
    return validatePassword(value)
      ? 'Şifre geçerli.'
        : 'Şifre en az 8 karakter uzunluğunda olmalıdır ve en az bir küçük harf, bir büyük harf ve bir sayı içermelidir.';
  }

  if (type === 'phone') {
    return validatePhone(value)
      ? 'Telefon numarası geçerli.'
      : 'Telefon numarası en az 10 karakter uzunluğunda olmalıdır.';
  }

  return 'Bilinmeyen doğrulama türü.';
}
