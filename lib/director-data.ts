import { createAdminClient } from '@/lib/supabase/admin';
import type {
  DirectorDashboardData,
  ClassRoom,
  Student,
} from '@/components/DirectorDashboard';

// ─── Types matching Supabase rows ─────────────────────────────────────────────

interface HistoryEntry {
  reviewed_at: string; // ISO 8601
  rating: number;      // 1-4
  interval_days: number;
}

interface ProgressRow {
  ease_factor: number;
  updated_at: string;
  history: HistoryEntry[] | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalizes ease_factor (1.3–2.5+) to a 0–100 retention score. */
function normalizeEaseFactor(ef: number): number {
  return Math.min(100, Math.max(0, Math.round(((ef - 1.3) / 1.2) * 100)));
}

/** Portuguese day abbreviations indexed by JS getDay() (0=Sun). */
const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** Builds a Student record from raw profile + user_progress rows. */
function buildStudent(
  id: string,
  fullName: string | null,
  progressRows: ProgressRow[],
): Student {
  // ── Retention: avg normalized ease_factor ──────────────────────────────────
  const retention =
    progressRows.length > 0
      ? Math.round(
          progressRows.reduce((sum, p) => sum + normalizeEaseFactor(p.ease_factor), 0) /
            progressRows.length,
        )
      : 0;

  // Flatten all history entries into a single array
  const allHistory: HistoryEntry[] = progressRows.flatMap(
    (p) => p.history ?? [],
  );

  // ── Engagement: active days in last 7 days → 0-100 ────────────────────────
  const sevenDaysAgo = Date.now() - 7 * 86_400_000;
  const activeDays = new Set<string>();
  for (const entry of allHistory) {
    if (new Date(entry.reviewed_at).getTime() >= sevenDaysAgo) {
      activeDays.add(entry.reviewed_at.substring(0, 10)); // YYYY-MM-DD
    }
  }
  const engagement = Math.round((activeDays.size / 7) * 100);

  // ── Study hours: hour-of-day for each session in last 14 days ─────────────
  const fourteenDaysAgo = Date.now() - 14 * 86_400_000;
  const study_hours: number[] = [];
  for (const entry of allHistory) {
    if (new Date(entry.reviewed_at).getTime() >= fourteenDaysAgo) {
      // Adjust to Brazil time (UTC-3) so hours look natural
      const utcHour = new Date(entry.reviewed_at).getUTCHours();
      const brHour = (utcHour - 3 + 24) % 24;
      study_hours.push(brHour);
    }
  }

  // ── Forgetting curve: avg rating per day for last 7 days ──────────────────
  // rating 1-4 → retention 25/50/75/100 (rating * 25)
  const forgetting_curve = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayKey = d.toISOString().substring(0, 10);

    const dayRatings = allHistory
      .filter((e) => e.reviewed_at.substring(0, 10) === dayKey)
      .map((e) => e.rating);

    const retentionValue =
      dayRatings.length > 0
        ? Math.round(
            (dayRatings.reduce((sum, r) => sum + r, 0) / dayRatings.length) * 25,
          )
        : null;

    return {
      day: DAY_LABELS[d.getDay()],
      retention: retentionValue ?? 50, // fallback 50 = neutral when no data
    };
  });

  return {
    id,
    name: fullName ?? 'Aluno',
    retention,
    engagement,
    study_hours,
    forgetting_curve,
  };
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Fetches complete DirectorDashboardData for a director user.
 * Returns null if the user is not a director/admin or has no school configured.
 */
export async function getDirectorDashboardData(
  directorUserId: string,
  days: 7 | 30 | 90 = 7,
  schoolIdOverride?: string,
): Promise<DirectorDashboardData | null> {
  const supabase = createAdminClient();

  // 1. Get director's school_id + role
  const { data: directorProfile } = await supabase
    .from('profiles')
    .select('school_id, role')
    .eq('id', directorUserId)
    .maybeSingle();

  if (!directorProfile) return null;
  if (directorProfile.role !== 'director' && directorProfile.role !== 'admin') return null;

  // Admins can view any school; directors are limited to their own
  let schoolId: string;
  if (directorProfile.role === 'admin' && schoolIdOverride) {
    schoolId = schoolIdOverride;
  } else if (directorProfile.school_id) {
    schoolId = directorProfile.school_id as string;
  } else {
    return null;
  }

  // 2. Fetch school info + school stats in parallel
  const [schoolResult, statsResult] = await Promise.all([
    supabase
      .from('schools')
      .select('name, logo_url, primary_color')
      .eq('id', schoolId)
      .maybeSingle(),
    supabase.rpc('get_director_school_stats', { p_school_id: schoolId, p_days: days }),
  ]);

  if (!schoolResult.data) return null;

  const school = schoolResult.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stats = (statsResult.data ?? {}) as Record<string, any>;

  // 3. Fetch classes
  const { data: classesRaw } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name');

  // 4. Build class data with students
  const classes: ClassRoom[] = await Promise.all(
    (classesRaw ?? []).map(async (cls) => {
      // Students in this class
      const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('class_id', cls.id);

      // Radar for the class + all student progress in parallel
      const [radarResult, ...progressResults] = await Promise.all([
        supabase.rpc('get_class_radar', { p_class_id: cls.id }),
        ...(studentProfiles ?? []).map((sp) =>
          supabase
            .from('user_progress')
            .select('ease_factor, updated_at, history')
            .eq('user_id', sp.id),
        ),
      ]);

      const students: Student[] = (studentProfiles ?? []).map((sp, idx) => {
        const progress = (progressResults[idx].data ?? []) as ProgressRow[];
        return buildStudent(sp.id, sp.full_name, progress);
      });

      const retention_avg =
        students.length > 0
          ? Math.round(
              students.reduce((sum, s) => sum + s.retention, 0) / students.length,
            )
          : 0;

      return {
        id: cls.id,
        name: cls.name,
        student_count: students.length,
        retention_avg,
        radar: radarResult.data ?? [],
        students,
      };
    }),
  );

  return {
    school: {
      name: school.name,
      logo_url: school.logo_url ?? undefined,
      primary_color: school.primary_color ?? '#10b981',
    },
    engagement_pct:    stats.engagement_pct    ?? 0,
    memory_score:      stats.memory_score      ?? 0,
    students_at_risk:  stats.students_at_risk  ?? 0,
    top_subject:       stats.top_subject       ?? undefined,
    critical_subject:  stats.critical_subject  ?? undefined,
    radar:             stats.radar             ?? [],
    classes,
    critical_subjects: stats.critical_subjects ?? [],
  };
}

/** Returns all schools — only for admin users (Phase 3 multi-school support). */
export async function getAllSchools(
  adminUserId: string,
): Promise<{ id: string; name: string }[]> {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', adminUserId)
    .maybeSingle();

  if (profile?.role !== 'admin') return [];

  const { data } = await supabase
    .from('schools')
    .select('id, name')
    .order('name');

  return data ?? [];
}
