import { createAdminClient } from '@/lib/supabase/admin';

export type LeadEventName =
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'CompleteRegistration'
  | 'OnboardingCompleted'
  | 'Purchase';

export type LeadStage =
  | 'Pagou'
  | 'Iniciou checkout'
  | 'Carrinho'
  | 'Cadastrou'
  | 'Onboarding'
  | 'Lead';

const STAGE_PRIORITY: LeadEventName[] = [
  'Purchase',
  'InitiateCheckout',
  'AddToCart',
  'CompleteRegistration',
  'OnboardingCompleted',
];

const STAGE_LABEL: Record<LeadEventName, LeadStage> = {
  Purchase:             'Pagou',
  InitiateCheckout:     'Iniciou checkout',
  AddToCart:            'Carrinho',
  CompleteRegistration: 'Cadastrou',
  OnboardingCompleted:  'Onboarding',
};

export function currentStage(events: { event_name: string }[]): LeadStage {
  for (const name of STAGE_PRIORITY) {
    if (events.some(e => e.event_name === name)) return STAGE_LABEL[name];
  }
  return 'Lead';
}

export async function recordLeadEvent(args: {
  email: string;
  eventName: LeadEventName;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}): Promise<void> {
  try {
    const email = args.email.trim().toLowerCase();
    if (!email || !email.includes('@') || email.length > 320) return;

    const admin = createAdminClient();
    const { error } = await admin.from('lead_events').insert({
      email,
      event_name: args.eventName,
      occurred_at: (args.occurredAt ?? new Date()).toISOString(),
      metadata: args.metadata ?? null,
    });

    if (error) {
      console.error('[lead-events] insert falhou:', error.message);
    }
  } catch (err) {
    console.error('[lead-events] erro inesperado:', err instanceof Error ? err.message : String(err));
  }
}
