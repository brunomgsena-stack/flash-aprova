/**
 * GET /auth/callback
 *
 * Porteiro PKCE do Supabase (@supabase/ssr).
 * Troca o `code` gerado pelo Supabase por uma sessão persistida em cookies
 * e redireciona o utilizador para o dashboard.
 *
 * Requisitos no Supabase Dashboard:
 *   Auth → URL Configuration → Additional Redirect URLs:
 *     https://flashaprova.app/auth/callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient }        from '@supabase/ssr';
import { cookies }                   from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');

  console.log('[auth/callback] Recebido — code presente:', !!code, '| params:', searchParams.toString());

  if (!code) {
    console.error('[auth/callback] Parâmetro code ausente.');
    const message = encodeURIComponent('Link inválido. Solicite um novo acesso.');
    return NextResponse.redirect(new URL(`/login?message=${message}`, origin));
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
    return NextResponse.redirect(new URL(`/login?message=${message}`, origin));
  }

  console.log('[auth/callback] Sessão criada com sucesso. Redirecionando para /dashboard.');
  return NextResponse.redirect(new URL('/dashboard', origin));
}
