// Re-exporta o handler do path canônico (app/api/webhooks/asaas)
// para manter compatibilidade com a URL configurada no Asaas: /api/webhook/asaas
export { POST, runtime } from '@/app/api/webhooks/asaas/route';
