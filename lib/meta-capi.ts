import { createHash } from 'node:crypto';
export { deterministicEventId } from './meta-event-id';

export function normalizeAndHash(value: string): string {
  const v = (value ?? '').trim().toLowerCase();
  if (!v) return '';
  return createHash('sha256').update(v).digest('hex');
}

export interface UserDataInput {
  email?: string;
  phone?: string;
  externalId?: string;
  fbp?: string;
  fbc?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
}

export interface MetaUserData {
  em?: string[];
  ph?: string[];
  external_id?: string[];
  fbp?: string;
  fbc?: string;
  client_ip_address?: string;
  client_user_agent?: string;
}

export function buildUserData(input: UserDataInput): MetaUserData {
  const ud: MetaUserData = {};
  if (input.email) ud.em = [normalizeAndHash(input.email)];
  if (input.phone) {
    const digits = input.phone.replace(/\D/g, '');
    if (digits) ud.ph = [normalizeAndHash(digits)];
  }
  if (input.externalId) ud.external_id = [normalizeAndHash(input.externalId)];
  if (input.fbp) ud.fbp = input.fbp;
  if (input.fbc) ud.fbc = input.fbc;
  if (input.clientIpAddress) ud.client_ip_address = input.clientIpAddress;
  if (input.clientUserAgent) ud.client_user_agent = input.clientUserAgent;
  return ud;
}

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v21.0';

interface MetaConfig {
  pixelId: string;
  accessToken: string;
  testEventCode?: string;
}

let _warned = false;
function getConfig(): MetaConfig | null {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
    if (!_warned) {
      console.warn('[meta-capi] META_PIXEL_ID/META_ACCESS_TOKEN ausentes — eventos desativados.');
      _warned = true;
    }
    return null;
  }
  return { pixelId, accessToken, testEventCode: process.env.META_TEST_EVENT_CODE };
}

export type ActionSource = 'website' | 'system_generated';

export interface MetaEvent {
  event_name: string;
  event_time: number;
  event_id: string;
  action_source: ActionSource;
  event_source_url?: string;
  user_data: MetaUserData;
  custom_data?: Record<string, unknown>;
}

export function buildEvent(params: {
  eventName: string;
  eventId: string;
  actionSource: ActionSource;
  userData: UserDataInput;
  customData?: Record<string, unknown>;
  eventSourceUrl?: string;
  eventTime?: number;
}): MetaEvent {
  const ev: MetaEvent = {
    event_name: params.eventName,
    event_time: params.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: params.eventId,
    action_source: params.actionSource,
    user_data: buildUserData(params.userData),
  };
  if (params.eventSourceUrl) ev.event_source_url = params.eventSourceUrl;
  if (params.customData) ev.custom_data = params.customData;
  return ev;
}

export async function sendMetaEvent(event: MetaEvent): Promise<{ ok: boolean; status: number }> {
  const cfg = getConfig();
  if (!cfg) return { ok: false, status: 0 };

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${cfg.pixelId}/events?access_token=${encodeURIComponent(cfg.accessToken)}`;
  const body: Record<string, unknown> = { data: [event] };
  if (cfg.testEventCode) body.test_event_code = cfg.testEventCode;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[meta-capi] ${event.event_name} HTTP ${res.status}: ${text}`);
      return { ok: false, status: res.status };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    console.error(`[meta-capi] ${event.event_name} falhou:`, err instanceof Error ? err.message : String(err));
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

interface BaseMatch {
  email?: string;
  externalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
  eventSourceUrl?: string;
}

export function trackPurchase(p: BaseMatch & {
  value: number;
  currency: string;
  planName: string;
  eventId: string;
  actionSource?: ActionSource;
}) {
  return sendMetaEvent(buildEvent({
    eventName: 'Purchase',
    eventId: p.eventId,
    actionSource: p.actionSource ?? 'system_generated',
    userData: {
      email: p.email, externalId: p.externalId,
      clientIpAddress: p.clientIpAddress, clientUserAgent: p.clientUserAgent,
      fbp: p.fbp, fbc: p.fbc,
    },
    customData: { currency: p.currency, value: p.value, content_name: p.planName },
    eventSourceUrl: p.eventSourceUrl,
  }));
}

export function trackCompleteRegistration(p: BaseMatch & {
  eventId: string;
  actionSource?: ActionSource;
}) {
  return sendMetaEvent(buildEvent({
    eventName: 'CompleteRegistration',
    eventId: p.eventId,
    actionSource: p.actionSource ?? 'website',
    userData: {
      email: p.email, externalId: p.externalId,
      clientIpAddress: p.clientIpAddress, clientUserAgent: p.clientUserAgent,
      fbp: p.fbp, fbc: p.fbc,
    },
    eventSourceUrl: p.eventSourceUrl,
  }));
}

export function trackOnboardingCompleted(p: BaseMatch & { eventId: string }) {
  return sendMetaEvent(buildEvent({
    eventName: 'OnboardingCompleted',
    eventId: p.eventId,
    actionSource: 'website',
    userData: {
      email: p.email, externalId: p.externalId,
      clientIpAddress: p.clientIpAddress, clientUserAgent: p.clientUserAgent,
      fbp: p.fbp, fbc: p.fbc,
    },
    eventSourceUrl: p.eventSourceUrl,
  }));
}
