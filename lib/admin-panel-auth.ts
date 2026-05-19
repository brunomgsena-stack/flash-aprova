import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_PAYLOAD = 'flashaprova-painel';

/**
 * Token determinístico derivado da senha (HMAC-SHA256, hex).
 * Não reversível para a senha — é o que vai no cookie.
 */
export function derivePanelToken(password: string): string {
  return createHmac('sha256', password).update(TOKEN_PAYLOAD).digest('hex');
}

/**
 * Verifica, em tempo constante, se o valor do cookie corresponde ao token
 * derivado de ADMIN_PANEL_PASSWORD. Sem env setada → sempre false.
 */
export function verifyPanelToken(cookieValue: string): boolean {
  const password = process.env.ADMIN_PANEL_PASSWORD;
  if (!password) return false;
  if (!/^[a-f0-9]{64}$/.test(cookieValue)) return false;
  const expected = derivePanelToken(password);
  const a = Buffer.from(cookieValue, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
