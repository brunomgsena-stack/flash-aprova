import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDirectorDashboardData } from '@/lib/director-data';

// RFC 4180 quoting: escape embedded double-quotes and neutralize formula injection.
function csvCell(value: string | number): string {
  const s = String(value);
  // Prefix with tab to neutralize spreadsheet formula injection (=, +, -, @)
  const safe = /^[=+\-@\t\r]/.test(s) ? `\t${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

// Strips diacritics and non-ASCII chars for a safe ASCII filename.
function safeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-');
}

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

  // Build CSV rows (UTF-8 BOM ensures Excel on Windows renders accents correctly)
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
          csvCell(data.school.name),
          csvCell(cls.name),
          csvCell(student.name),
          student.retention,
          student.engagement,
          nightSessions,
          csvCell(status),
        ].join(','),
      );
    }
  }

  const csv = '\uFEFF' + rows.join('\n');
  const filename = `flashaprova-${safeFilename(data.school.name)}-${rawPeriod}-${new Date().toISOString().substring(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
