export const REJECTED_PRODUCTION_SECRETS = new Set([
  'replace_with_your_generated_64_character_hex_secret_key_here',
  'dev_campus_halls_jwt_secret_key_2026_secured',
  'your_secret_key_here',
  'supersecretkey12345678901234567890',
  'change_this_to_a_secure_secret_key_123',
]);

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is missing in production.');
    }
    return 'dev_campus_halls_jwt_secret_key_2026_secured';
  }
  if (process.env.NODE_ENV === 'production') {
    if (secret.length < 32) {
      throw new Error('FATAL: JWT_SECRET must be at least 32 characters in production.');
    }
    if (REJECTED_PRODUCTION_SECRETS.has(secret.trim())) {
      throw new Error('FATAL: Insecure JWT_SECRET detected. You cannot use default or example template secrets in production.');
    }
  }
  return secret;
}
