import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDirectorDashboardData } from '@/lib/director-data';

// GET /api/director/export?period=30d
// Returns CSV of all students with their metrics
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const rawPeriod = request.nextUrl.searchParams.get('period') ?? '7d';
  const days: 7 | 30 | 90 =
    rawPeriod === '30d' ? 30 : rawPeriod === '90d' ? 90 : 7;

  const data = await getDirectorDashboardData(user.id, days);
  if (!data) {
    return NextResponse.json({ error: 'Escola não configurada' }, { status: 403 });
  }

  // Build CSV rows
  const rows: string[] = [
    'Escola,Turma,Aluno,Retenção (%),Engajamento (%),Sessões Noturnas,Status',
  ];

  for (const cls of data.classes) {
    for (const student of cls.students) {
      const nightSessions = student.study_hours.filter((h) =>
        [23, 0, 1, 2, 3, 4].includes(h),
      ).length;
      const status =
        student.retention >= 75
          ? 'Alta Performance'
          : student.retention < 50
          ? 'Em Risco'
          : 'Regular';

      rows.push(
        [
          `"${data.school.name}"`,
          `"${cls.name}"`,
          `"${student.name}"`,
          student.retention,
          student.engagement,
          nightSessions,
          `"${status}"`,
        ].join(','),
      );
    }
  }

  const csv = rows.join('\n');
  const filename = `flashaprova-${data.school.name.toLowerCase().replace(/\s+/g, '-')}-${rawPeriod}-${new Date().toISOString().substring(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
