import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentStage } from '../lead-events.ts';

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
