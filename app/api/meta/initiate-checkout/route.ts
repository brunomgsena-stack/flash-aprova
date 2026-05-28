/**
 * POST /api/meta/initiate-checkout
 *
 * Chamado pelo client ao clicar comprar, antes do redirect pro Asaas.
 * Aceita request via navigator.sendBeacon (Content-Type pode ser text/plain
 * ou application/json — parsing é tolerante).
 * Dispara o evento InitiateCheckout na Conversions API.
 * SEMPRE responde { ok: true } — falha de tracking não pode afetar o checkout.
 *
 * Body: { eventId: string, email?: string, planId: 'aceleracao' | 'panteao_elite' | 'black' }
 * O eventId é gerado no cliente e reaproveitado aqui para garantir dedupe Pixel/CAPI.
 */
import { NextRequest, NextResponse } from 'next/server';
import { trackInitiateCheckout } from '@/lib/meta-capi';
import { recordLeadEvent } from '@/lib/lead-events';

export const runtime = 'nodejs';

const PLAN_META: Record<string, { value: number; name: string }> = {
  aceleracao:    { value: 257, name: 'Protocolo Aceleração' },
  panteao_elite: { value: 327, name: 'Protocolo Pantéon Elite' },
  black:         { value: 997, name: 'Protocolo Black' },
};

export async function POST(req: NextRequest) {
  try {
    // sendBeacon pode mandar como text/plain — parse tolerante.
    const raw = await req.text().catch(() => '');
    type Body = { eventId?: unknown; email?: unknown; planId?: unknown };
    let body: Body | null = null;
    try {
      body = raw ? (JSON.parse(raw) as Body) : null;
    } catch {
      body = null;
    }

    const eventId = typeof body?.eventId === 'string' ? body.eventId.trim() : '';
    const planId  = typeof body?.planId  === 'string' ? body.planId.trim()  : '';

    if (!eventId || eventId.length > 200 || !PLAN_META[planId]) {
      return NextResponse.json({ ok: true });
    }

    const rawEmail = typeof body?.email === 'string' ? body.email.trim() : '';
    const email = rawEmail && rawEmail.length <= 320 && rawEmail.includes('@')
      ? rawEmail
      : undefined;

    const cookies = req.cookies;
    const fbp = cookies.get('_fbp')?.value;
    const fbc = cookies.get('_fbc')?.value;
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || undefined;
    const ua = req.headers.get('user-agent') ?? undefined;
    const referer = req.headers.get('referer') ?? undefined;

    const meta = PLAN_META[planId];
    await trackInitiateCheckout({
      email,
      eventId,
      planId,
      planName: meta.name,
      value: meta.value,
      actionSource: 'website',
      clientIpAddress: ip,
      clientUserAgent: ua,
      fbp,
      fbc,
      eventSourceUrl: referer,
    });

    if (email) {
      try {
        await recordLeadEvent({
          email,
          eventName: 'InitiateCheckout',
          metadata: { planId, value: meta.value, planName: meta.name },
        });
      } catch { /* defesa adicional */ }
    }
  } catch (err) {
    console.error('[meta-capi] initiate-checkout route erro:', err instanceof Error ? err.message : String(err));
  }
  return NextResponse.json({ ok: true });
}
