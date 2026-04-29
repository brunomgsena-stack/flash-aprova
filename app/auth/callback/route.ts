/**
 * GET /auth/callback
 *
 * Porteiro PKCE do Supabase (@supabase/ssr).
 * Troca o `code` gerado pelo Supabase por uma sessão persistida em cookies.
 *
 * Query params:
 *   code  — obrigatório, fornecido pelo Supabase no redirect
 *   next  — opcional, rota para onde redirecionar após login (default: /dashboard)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient }        from '@supabase/ssr';
import { cookies }                   from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  // Valida que next é um caminho relativo seguro (previne open redirect)
  const safePath = next.startsWith('/') ? next : '/dashboard';

  if (!code) {
    console.error('[auth/callback] Parâmetro code ausente.');
    return NextResponse.redirect(
      new URL(`/login?error=missing_code&message=Link+inválido.+Solicite+um+novo+acesso.`, origin),
    );
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll:  () => cookieStore.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          ),
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession falhou:', error.message);
    const message = encodeURIComponent(
      'O link de acesso expirou ou já foi usado. Faça login normalmente.',
    );
    return NextResponse.redirect(
      new URL(`/login?error=expired_link&message=${message}`, origin),
    );
  }

  return NextResponse.redirect(new URL(safePath, origin));
}
