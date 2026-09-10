type AuthErrorLike = {
  code?: string;
  status?: number;
};

export const AUTH_RATE_LIMIT_COOLDOWN_SECONDS = 60;

export function isAuthRateLimitError(
  error: AuthErrorLike | null | undefined
): boolean {
  return (
    error?.status === 429 ||
    error?.code === 'over_email_send_rate_limit' ||
    error?.code === 'over_request_rate_limit'
  );
}

export function getSignupErrorMessage(error: AuthErrorLike | null | undefined): string {
  switch (error?.code) {
    case 'over_email_send_rate_limit':
      return 'Doğrulama e-postası gönderme sınırına ulaşıldı. Lütfen biraz sonra tekrar deneyin.';
    case 'over_request_rate_limit':
      return 'Çok fazla kayıt isteği gönderildi. Lütfen biraz bekleyip tekrar deneyin.';
    case 'email_address_not_authorized':
      return 'Şu anda bu adrese doğrulama e-postası gönderilemiyor. Lütfen daha sonra tekrar deneyin.';
    case 'captcha_failed':
      return 'Güvenlik doğrulaması tamamlanamadı. Lütfen sayfayı yenileyip tekrar deneyin.';
    case 'email_address_invalid':
      return 'Geçerli bir e-posta adresi girin.';
    case 'signup_disabled':
    case 'email_provider_disabled':
      return 'E-posta ile kayıt şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
    case 'weak_password':
      return 'Daha güçlü bir şifre seçin.';
    case 'email_exists':
    case 'user_already_exists':
      return 'Bu bilgilerle kayıt tamamlanamadı. Giriş yapmayı veya şifrenizi sıfırlamayı deneyin.';
    default:
      return error?.status === 429
        ? 'Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.'
        : 'Kayıt şu anda tamamlanamadı. Lütfen daha sonra tekrar deneyin.';
  }
}

export function getLoginErrorMessage(
  error: AuthErrorLike | null | undefined
): string {
  switch (error?.code) {
    case 'captcha_failed':
      return 'Güvenlik doğrulaması tamamlanamadı. Lütfen yeniden deneyin.';
    case 'over_request_rate_limit':
      return 'Çok fazla giriş isteği gönderildi. Lütfen biraz bekleyip tekrar deneyin.';
    default:
      return error?.status === 429
        ? 'Çok fazla giriş isteği gönderildi. Lütfen biraz bekleyip tekrar deneyin.'
        : 'Giriş başarısız. E-posta veya şifre hatalı.';
  }
}
