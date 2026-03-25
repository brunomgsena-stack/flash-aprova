import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getAiLimiter, getGeneralLimiter, getClientIp, isAdminId } from '@/lib/ratelimit';

// ─── Rotas com limite estrito (5 req/min) ─────────────────────────────────────
const AI_ROUTES = ['/api/chat/tutor', '/api/chat/redacao', '/api/ai/grade-essay'];

// ─── Rotas excluídas do rate limit (callbacks de terceiros) ───────────────────
const EXCLUDED_API = ['/api/webhooks/'];

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
  const { pathname } = request.nextUrl;

  // ── Auth guards ─────────────────────────────────────────────────────────────
  const isProtected = ['/dashboard', '/admin', '/study', '/subscription'].some((p) =>
    pathname.startsWith(p),
  );

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if ((pathname === '/login' || pathname === '/') && user) {
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
                error:   'Você atingiu o limite de requisições. Tente novamente em alguns minutos.',
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
