import assert from 'node:assert';
import { isUrlAllowed } from '../ssrf';

(async () => {
  // Blocked
  assert.strictEqual((await isUrlAllowed('http://169.254.169.254/')).ok, false);
  assert.strictEqual((await isUrlAllowed('http://localhost/')).ok, false);
  assert.strictEqual((await isUrlAllowed('http://127.0.0.1/')).ok, false);
  assert.strictEqual((await isUrlAllowed('http://10.0.0.5/')).ok, false);
  assert.strictEqual((await isUrlAllowed('http://192.168.1.1/')).ok, false);
  assert.strictEqual((await isUrlAllowed('http://[::1]/')).ok, false);
  assert.strictEqual((await isUrlAllowed('ftp://example.com/')).ok, false);
  assert.strictEqual((await isUrlAllowed('http://metadata.google.internal/')).ok, false);
  // Allowed (public host)
  assert.strictEqual((await isUrlAllowed('https://example.com/')).ok, true);
  console.log('ssrf.test.ts PASS');
})().catch((e) => { console.error(e); process.exit(1); });
