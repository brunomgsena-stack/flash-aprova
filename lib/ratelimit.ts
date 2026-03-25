import { Ratelimit } from '@upstash/ratelimit';
import { Redis }     from '@upstash/redis';

// ─── Redis client (lazy — não inicializa até a primeira chamada) ───────────────
let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

// ─── Limiters ─────────────────────────────────────────────────────────────────

/**
 * Rotas de IA (/api/chat/*, /api/ai/*): 5 requisições por 60 segundos.
 * Janela deslizante evita bursts no início do minuto.
 */
export function getAiLimiter(): Ratelimit {
  return new Ratelimit({
    redis:   getRedis(),
    limiter: Ratelimit.slidingWindow(5, '60 s'),
    prefix:  'rl:ai',
  });
}

/**
 * API geral (/api/*): 60 requisições por 60 segundos.
 * Protege contra scraping e ataques de força bruta.
 */
export function getGeneralLimiter(): Ratelimit {
  return new Ratelimit({
    redis:   getRedis(),
    limiter: Ratelimit.slidingWindow(60, '60 s'),
    prefix:  'rl:general',
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extrai o IP real do cliente a partir dos headers do Vercel/Cloudflare.
 * Fallback para 127.0.0.1 em desenvolvimento local.
 */
export function getClientIp(request: { headers: { get: (k: string) => string | null } }): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1'
  );
}

/**
 * Verifica se o userId está na lista de admins que bypass o rate limit.
 * Configure a env var RATE_LIMIT_ADMIN_IDS com user IDs separados por vírgula.
 * Exemplo: RATE_LIMIT_ADMIN_IDS=uuid-1,uuid-2
 */
export function isAdminId(userId: string | null | undefined): boolean {
  if (!userId) return false;
  const ids = (process.env.RATE_LIMIT_ADMIN_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.includes(userId);
}
