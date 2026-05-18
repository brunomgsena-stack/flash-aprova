import { createHash } from 'node:crypto';

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

export function deterministicEventId(eventName: string, key: string): string {
  return `${eventName}.${key}`;
}
