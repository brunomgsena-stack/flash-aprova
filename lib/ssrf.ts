import { lookup } from 'node:dns/promises';
import net from 'node:net';

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;        // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  const v = ip.toLowerCase();
  if (v === '::1' || v.startsWith('fe80') || v.startsWith('fc') || v.startsWith('fd')) return true;
  if (v === '::') return true;
  return false;
}

export async function isUrlAllowed(
  raw: string,
): Promise<{ ok: true; url: string } | { ok: false; reason: string }> {
  let u: URL;
  try { u = new URL(raw); } catch { return { ok: false, reason: 'malformed' }; }

  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    return { ok: false, reason: 'protocol' };
  }
  const host = u.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') ||
      host.endsWith('.internal') || host.endsWith('.local')) {
    return { ok: false, reason: 'blocked-host' };
  }
  if (raw.length > 2048) return { ok: false, reason: 'too-long' };

  // Resolve and reject if ANY resolved address is private/loopback/link-local.
  // TOCTOU note: there is a DNS rebinding window between this check and fetch's lookup.
  // For this low-value metadata scraper that is acceptable.
  let addrs: { address: string }[];
  try {
    addrs = await lookup(host, { all: true });
  } catch {
    return { ok: false, reason: 'dns' };
  }
  if (addrs.length === 0) return { ok: false, reason: 'dns-empty' };
  for (const { address } of addrs) {
    if (isPrivateIp(address)) return { ok: false, reason: 'private-ip' };
  }
  return { ok: true, url: u.toString() };
}
