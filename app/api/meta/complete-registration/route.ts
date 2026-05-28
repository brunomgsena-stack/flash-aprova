/**
 * POST /api/meta/complete-registration
 *
 * Chamado pelo client logo após supabase.auth.signUp bem-sucedido.
 * Dispara o evento CompleteRegistration na Conversions API.
 * SEMPRE responde { ok: true } — falha de tracking não pode afetar o signup.
 */
import { NextRequest, NextResponse } from 'next/server';
import { trackCompleteRegistration, deterministicEventId } from '@/lib/meta-capi';
import { recordLeadEvent } from '@/lib/lead-events';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { email?: unknown } | null;
    const email = typeof body?.email === 'string' ? body.email.trim() : '';

    if (!email || email.length > 320 || !email.includes('@')) {
      return NextResponse.json({ ok: true });
    }

    const cookies = req.cookies;
    const fbp = cookies.get('_fbp')?.value;
    const fbc = cookies.get('_fbc')?.value;
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || undefined;
    const ua = req.headers.get('user-agent') ?? undefined;
    const referer = req.headers.get('referer') ?? undefined;

    await trackCompleteRegistration({
      email,
      eventId: deterministicEventId('CompleteRegistration', email),
      actionSource: 'website',
      clientIpAddress: ip,
      clientUserAgent: ua,
      fbp,
      fbc,
      eventSourceUrl: referer,
    });

    try {
      await recordLeadEvent({ email, eventName: 'CompleteRegistration' });
    } catch { /* defesa adicional */ }
  } catch (err) {
    console.error('[meta-capi] complete-registration route erro:', err instanceof Error ? err.message : String(err));
  }
  return NextResponse.json({ ok: true });
}
