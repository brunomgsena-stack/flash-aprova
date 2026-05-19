import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { createClient } from './supabase/server';

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

export const PANEL_COOKIE = 'painel_token';

/**
 * Libera o painel se: (1) usuário logado com profiles.role === 'admin', OU
 * (2) cookie painel_token válido. Não redireciona — retorna boolean.
 */
export async function hasPanelAccess(): Promise<boolean> {
  // (2) Cookie de senha
  const cookieStore = await cookies();
  const token = cookieStore.get(PANEL_COOKIE)?.value;
  if (token && verifyPanelToken(token)) return true;

  // (1) Login admin existente
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    return profile?.role === 'admin';
  } catch {
    return false;
  }
}
