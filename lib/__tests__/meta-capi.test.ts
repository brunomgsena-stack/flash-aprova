import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { normalizeAndHash, buildUserData, deterministicEventId } from '../meta-capi.ts';

const sha = (v: string) => createHash('sha256').update(v).digest('hex');

test('normalizeAndHash trims, lowercases, sha256-hex', () => {
  assert.equal(normalizeAndHash('  Foo@Bar.COM '), sha('foo@bar.com'));
});

test('normalizeAndHash returns empty string for empty input', () => {
  assert.equal(normalizeAndHash('   '), '');
  assert.equal(normalizeAndHash(''), '');
});

test('buildUserData hashes em/ph/external_id as single-element arrays', () => {
  const ud = buildUserData({ email: 'A@B.com', phone: '+55 (11) 99999-1234', externalId: 'user-1' });
  assert.deepEqual(ud.em, [sha('a@b.com')]);
  assert.deepEqual(ud.ph, [sha('5511999991234')]);
  assert.deepEqual(ud.external_id, [sha('user-1')]);
});

test('buildUserData passes fbp/fbc/ip/ua raw and omits absent fields', () => {
  const ud = buildUserData({ fbp: 'fb.1.2.3', fbc: 'fb.1.4.5', clientIpAddress: '1.2.3.4', clientUserAgent: 'UA/1.0' });
  assert.equal(ud.fbp, 'fb.1.2.3');
  assert.equal(ud.fbc, 'fb.1.4.5');
  assert.equal(ud.client_ip_address, '1.2.3.4');
  assert.equal(ud.client_user_agent, 'UA/1.0');
  assert.equal(ud.em, undefined);
});

test('deterministicEventId is stable and varies by name/key', () => {
  assert.equal(deterministicEventId('Purchase', 'k1'), deterministicEventId('Purchase', 'k1'));
  assert.notEqual(deterministicEventId('Purchase', 'k1'), deterministicEventId('Purchase', 'k2'));
  assert.notEqual(deterministicEventId('Purchase', 'k1'), deterministicEventId('CompleteRegistration', 'k1'));
});
