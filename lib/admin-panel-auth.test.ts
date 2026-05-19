import { test } from 'node:test';
import assert from 'node:assert/strict';
import { derivePanelToken, verifyPanelToken } from './admin-panel-auth.ts';

test('derivePanelToken is deterministic and hides the password', () => {
  const a = derivePanelToken('s3cret');
  const b = derivePanelToken('s3cret');
  assert.equal(a, b);
  assert.notEqual(a, 's3cret');
  assert.match(a, /^[a-f0-9]{64}$/); // hex sha256
});

test('derivePanelToken differs per password', () => {
  assert.notEqual(derivePanelToken('a'), derivePanelToken('b'));
});

test('verifyPanelToken true only for matching env password', () => {
  process.env.ADMIN_PANEL_PASSWORD = 's3cret';
  assert.equal(verifyPanelToken(derivePanelToken('s3cret')), true);
  assert.equal(verifyPanelToken(derivePanelToken('wrong')), false);
  assert.equal(verifyPanelToken(''), false);
  assert.equal(verifyPanelToken('not-hex'), false);
});

test('verifyPanelToken false when env password unset', () => {
  delete process.env.ADMIN_PANEL_PASSWORD;
  assert.equal(verifyPanelToken(derivePanelToken('s3cret')), false);
});
