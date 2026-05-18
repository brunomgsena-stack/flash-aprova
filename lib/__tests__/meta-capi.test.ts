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

import { buildEvent, sendMetaEvent, trackPurchase } from '../meta-capi.ts';

test('buildEvent assembles a Meta event with hashed user_data', () => {
  const ev = buildEvent({
    eventName: 'Purchase',
    eventId: 'asaas_pay_1',
    actionSource: 'system_generated',
    userData: { email: 'a@b.com', externalId: 'u1' },
    customData: { currency: 'BRL', value: 97, content_name: 'Protocolo Básico' },
    eventTime: 1700000000,
  });
  assert.equal(ev.event_name, 'Purchase');
  assert.equal(ev.event_time, 1700000000);
  assert.equal(ev.event_id, 'asaas_pay_1');
  assert.equal(ev.action_source, 'system_generated');
  assert.ok(Array.isArray(ev.user_data.em));
  assert.deepEqual(ev.custom_data, { currency: 'BRL', value: 97, content_name: 'Protocolo Básico' });
  assert.equal('event_source_url' in ev, false);
});

test('sendMetaEvent is a safe no-op when env vars are missing', async () => {
  delete process.env.META_PIXEL_ID;
  delete process.env.META_ACCESS_TOKEN;
  const ev = buildEvent({
    eventName: 'Purchase', eventId: 'x', actionSource: 'system_generated',
    userData: { email: 'a@b.com' }, eventTime: 1700000000,
  });
  const res = await sendMetaEvent(ev);
  assert.deepEqual(res, { ok: false, status: 0 });
});

test('trackPurchase resolves to a result object without throwing (no env)', async () => {
  delete process.env.META_PIXEL_ID;
  delete process.env.META_ACCESS_TOKEN;
  const res = await trackPurchase({
    email: 'a@b.com', externalId: 'u1', value: 97, currency: 'BRL',
    planName: 'Protocolo Básico', eventId: 'asaas_pay_1',
  });
  assert.equal(typeof res.ok, 'boolean');
  assert.equal(res.ok, false);
});

test('deterministicEventId output format is "EventName.key"', () => {
  assert.equal(deterministicEventId('Purchase', 'asaas_123'), 'Purchase.asaas_123');
});
