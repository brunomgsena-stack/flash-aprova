import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getAiLimiter, getGeneralLimiter, getClientIp, isAdminId } from '@/lib/ratelimit';

// ─── Rotas com limite estrito (5 req/min) ─────────────────────────────────────
const AI_ROUTES = ['/api/chat/tutor', '/api/chat/redacao', '/api/ai/grade-essay', '/api/insights/briefing'];

// ─── Rotas excluídas do rate limit (callbacks de terceiros) ───────────────────
const EXCLUDED_API = ['/api/webhooks/', '/api/onboarding/'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // ── Supabase session refresh ────────────────────────────────────────────────
  // Obrigatório para manter a autenticação por cookies viva entre requisições.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  // Força leitura da sessão sem cache para garantir estado atualizado
  await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  // ── Auth guards ─────────────────────────────────────────────────────────────
  const isProtected = ['/dashboard', '/admin', '/study', '/welcome'].some((p) =>
    pathname.startsWith(p),
  );
  const isSetup = pathname.startsWith('/setup');

  // ── Exceção: /director, /dashboard, /study e /welcome nunca redirecionam para /setup ──
  // /study e /welcome devem ser permissivos: se o aluno está logado, pode acessar independente do onboarding.
  const isDirectorOrDashboard = pathname.startsWith('/director') || pathname.startsWith('/dashboard') || pathname.startsWith('/study') || pathname.startsWith('/welcome');

  // Rotas protegidas e /setup exigem login
  if ((isProtected || isSetup) && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user) {
    // Fonte de verdade: tabela profiles no banco.
    // Não confia no JWT (pode estar desatualizado após o onboarding).
    let onboardingDone = false;
    let firstSessionDone = false;
    let profileChecked = false;

    if (isProtected || isSetup || pathname === '/') {
      // maybeSingle() evita erro 406 quando a row ainda não existe (novo usuário
      // cujo trigger de criação de perfil ainda não disparou). Com .single(),
      // profile viria null + erro, fazendo onboardingDone = false incorretamente.
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('onboarding_completed, first_session_completed', { count: 'exact' })
        .eq('id', user.id)
        .maybeSingle();

      if (profileErr) {
        console.error('[Middleware] Erro ao ler profile:', profileErr.message, '| code:', profileErr.code);
      }

      onboardingDone = profile?.onboarding_completed === true;
      firstSessionDone = profile?.first_session_completed === true;
      profileChecked = true;
    }

    // Usuário logado em rota protegida sem ter completado o setup → redireciona
    // Exceção: /director, /dashboard e /study nunca são redirecionados para /setup
    if (!onboardingDone && isProtected && !isDirectorOrDashboard) {
      return NextResponse.redirect(new URL('/setup', request.url));
    }

    // Usuário que já completou o setup tentando acessar /setup → redireciona.
    // Exceção: se a requisição veio DE /setup (Referer header), o usuário pode
    // estar em transição pós-submit. Deixa passar para evitar loop de redirect
    // durante os ~800ms de propagação entre o commit do banco e o window.location.
    const referer = request.headers.get('referer') ?? '';
    const comingFromSetup = referer.includes('/setup');
    if (onboardingDone && isSetup && !comingFromSetup) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redireciona para /welcome se onboarding feito mas primeira sessão pendente
    if (onboardingDone && !firstSessionDone && pathname.startsWith('/dashboard')) {
      const hasTourParam = request.nextUrl.searchParams.get('tour') === '1';
      if (!hasTourParam) {
        return NextResponse.redirect(new URL('/welcome', request.url));
      }
    }

    // Home: redireciona de acordo com status de onboarding
    if (pathname === '/' && profileChecked) {
      if (!onboardingDone) {
        return NextResponse.redirect(new URL('/setup', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  const authOnlyPages = ['/login', '/forgot-password', '/update-password'];
  if (authOnlyPages.includes(pathname) && user && pathname !== '/update-password') {
    // Não redireciona /update-password — o usuário precisa estar logado para updateUser()
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ── Rate Limiting ───────────────────────────────────────────────────────────
  // Só ativo se as env vars do Upstash estiverem configuradas.
  // Fail-open: se o Redis estiver indisponível, a requisição passa normalmente.
  const redisConfigured = Boolean(process.env.UPSTASH_REDIS_REST_URL);

  if (pathname.startsWith('/api/') && redisConfigured) {
    const isExcluded = EXCLUDED_API.some((p) => pathname.startsWith(p));

    if (!isExcluded) {
      // Admins listados em RATE_LIMIT_ADMIN_IDS nunca são bloqueados.
      if (!isAdminId(user?.id)) {
        // Usar user ID (autenticado) ou IP (anônimo).
        // User ID é preferível para redes compartilhadas (escolas, coworkings).
        const identifier = user?.id ?? getClientIp(request);
        const isAiRoute  = AI_ROUTES.some((r) => pathname.startsWith(r));

        try {
          const limiter                      = isAiRoute ? getAiLimiter() : getGeneralLimiter();
          const { success, limit, remaining, reset } = await limiter.limit(identifier);

          // Expõe headers de diagnóstico (útil para o cliente mostrar "tente em Xs")
          response.headers.set('X-RateLimit-Limit',     String(limit));
          response.headers.set('X-RateLimit-Remaining', String(remaining));
          response.headers.set('X-RateLimit-Reset',     String(reset));

          if (!success) {
            const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
            return NextResponse.json(
              {
                success: false,
                error:   'Calma lá! Você atingiu o limite de requisições. Tente novamente em 1 minuto.',
              },
              {
                status:  429,
                headers: {
                  'Content-Type':          'application/json',
                  'X-RateLimit-Limit':     String(limit),
                  'X-RateLimit-Remaining': '0',
                  'X-RateLimit-Reset':     String(reset),
                  'Retry-After':           String(retryAfter),
                },
              },
            );
          }
        } catch (e) {
          // Redis fora do ar — fail open para não bloquear o app.
          console.error('[RateLimit] Redis indisponível, fail-open:', e);
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
