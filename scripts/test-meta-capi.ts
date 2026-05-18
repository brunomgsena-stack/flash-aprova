/**
 * Verificação manual da Conversions API.
 *
 * Requer no ambiente: META_PIXEL_ID, META_ACCESS_TOKEN e
 * META_TEST_EVENT_CODE (pegue o código em Eventos de Teste no
 * Gerenciador de Eventos da Meta).
 *
 * Uso: npx tsx scripts/test-meta-capi.ts
 */
import { trackPurchase, trackCompleteRegistration } from '../lib/meta-capi.ts';

async function main() {
  if (!process.env.META_TEST_EVENT_CODE) {
    console.error('Defina META_TEST_EVENT_CODE para validar em Eventos de Teste.');
    process.exit(1);
  }

  const reg = await trackCompleteRegistration({
    email: 'teste+capi@flashaprova.app',
    externalId: 'test-user-1',
    eventId: 'test_reg_1',
    actionSource: 'website',
  });
  console.log('CompleteRegistration ->', reg);

  const pur = await trackPurchase({
    email: 'teste+capi@flashaprova.app',
    externalId: 'test-user-1',
    value: 97,
    currency: 'BRL',
    planName: 'Protocolo Básico',
    eventId: 'test_pur_1',
  });
  console.log('Purchase ->', pur);
}

main().catch((e) => { console.error(e); process.exit(1); });
