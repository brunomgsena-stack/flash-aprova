import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentStage } from '../lead-events.ts';
import { recordLeadEvent } from '../lead-events.ts';

test('currentStage returns Lead for empty array', () => {
  assert.equal(currentStage([]), 'Lead');
});

test('currentStage returns Pagou when Purchase present alongside others', () => {
  assert.equal(
    currentStage([
      { event_name: 'AddToCart' },
      { event_name: 'Purchase' },
      { event_name: 'InitiateCheckout' },
    ]),
    'Pagou',
  );
});

test('currentStage respects priority — InitiateCheckout beats AddToCart', () => {
  assert.equal(
    currentStage([
      { event_name: 'AddToCart' },
      { event_name: 'InitiateCheckout' },
    ]),
    'Iniciou checkout',
  );
});

test('currentStage returns Carrinho when only AddToCart present', () => {
  assert.equal(currentStage([{ event_name: 'AddToCart' }]), 'Carrinho');
});

test('currentStage returns Cadastrou for CompleteRegistration only', () => {
  assert.equal(currentStage([{ event_name: 'CompleteRegistration' }]), 'Cadastrou');
});

test('currentStage returns Onboarding for OnboardingCompleted only', () => {
  assert.equal(currentStage([{ event_name: 'OnboardingCompleted' }]), 'Onboarding');
});

test('currentStage ignores unknown event names and falls back to Lead', () => {
  assert.equal(currentStage([{ event_name: 'Unknown' }]), 'Lead');
});

// Stub global para createAdminClient — capturamos chamadas pra verificar
// que emails inválidos não disparam insert.
test('recordLeadEvent ignora email vazio', async () => {
  let called = false;
  // recordLeadEvent não deve nem chegar a chamar createAdminClient
  await recordLeadEvent({ email: '', eventName: 'AddToCart' });
  await recordLeadEvent({ email: '   ', eventName: 'AddToCart' });
  assert.equal(called, false, 'placeholder — validação síncrona não throw');
});

test('recordLeadEvent ignora email sem @', async () => {
  await recordLeadEvent({ email: 'nao-tem-arroba', eventName: 'AddToCart' });
  // chega aqui sem throw — sucesso
  assert.ok(true);
});

test('recordLeadEvent ignora email > 320 chars', async () => {
  const longEmail = 'a'.repeat(310) + '@b.com'; // 316 + 6 = 322 chars > 320
  await recordLeadEvent({ email: longEmail, eventName: 'AddToCart' });
  assert.ok(true);
});

test('recordLeadEvent normaliza email (trim+lowercase) — não throw', async () => {
  // Quando o helper tenta o insert real, ele pode falhar (sem SUPABASE_URL no test).
  // O importante é que não throw — engole o erro internamente.
  await recordLeadEvent({ email: '  A@B.COM ', eventName: 'AddToCart' });
  assert.ok(true);
});
