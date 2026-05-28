/**
 * POST /api/meta/add-to-cart
 *
 * Chamado pelo client ao montar /checkout.
 * Dispara o evento AddToCart na Conversions API.
 * SEMPRE responde { ok: true } — falha de tracking não pode afetar o checkout.
 *
 * Body: { eventId: string, email?: string }
 * O eventId é gerado no cliente e reaproveitado aqui para garantir dedupe Pixel/CAPI.
 */
import { NextRequest, NextResponse } from 'next/server';
import { trackAddToCart } from '@/lib/meta-capi';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { eventId?: unknown; email?: unknown }
      | null;

    const eventId = typeof body?.eventId === 'string' ? body.eventId.trim() : '';
    if (!eventId || eventId.length > 200) {
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

    await trackAddToCart({
      email,
      eventId,
      actionSource: 'website',
      clientIpAddress: ip,
      clientUserAgent: ua,
      fbp,
      fbc,
      eventSourceUrl: referer,
    });
  } catch (err) {
    console.error('[meta-capi] add-to-cart route erro:', err instanceof Error ? err.message : String(err));
  }
  return NextResponse.json({ ok: true });
}
