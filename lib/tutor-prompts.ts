/**
 * lib/tutor-prompts.ts — re-export shim
 *
 * All prompt logic now lives in lib/tutor-config.ts.
 * This file keeps backward-compatibility for any code that imported getTutorPrompt.
 */

import { getTutorById } from '@/lib/tutor-config';

/** @deprecated Import from lib/tutor-config.ts instead. */
export function getTutorPrompt(tutorId: string): string {
  return getTutorById(tutorId)?.prompt ?? '';
}
