/**
 * lib/tutor-engine.ts — re-export shim
 *
 * All tutor data now lives in lib/tutor-config.ts.
 * This file keeps backward-compatibility for UI components that import from here.
 */

export type { TutorConfig as Tutor } from '@/lib/tutor-config';
export {
  getTutorBySubject  as getTutor,
  getTutorById,
  getAllTutors,
  getOpeningMessage,
} from '@/lib/tutor-config';
