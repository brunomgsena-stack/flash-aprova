/**
 * ID de evento determinístico, compartilhado entre browser (Pixel) e
 * servidor (CAPI) para deduplicação no Meta. Módulo PURO — sem node:crypto —
 * portanto seguro para import em componentes client.
 */
export function deterministicEventId(eventName: string, key: string): string {
  return `${eventName}.${key}`;
}
