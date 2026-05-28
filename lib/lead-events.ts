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
