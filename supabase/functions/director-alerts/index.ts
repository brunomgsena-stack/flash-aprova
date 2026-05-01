import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL     = 'alertas@flashaprova.com.br';

Deno.serve(async (req) => {
  // Require the cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data: atRiskRows } = await supabase.rpc('get_all_schools_at_risk');

  if (!atRiskRows || atRiskRows.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let sent = 0;

  for (const row of atRiskRows as { school_name: string; director_email: string; at_risk_count: number }[]) {
    if (row.at_risk_count === 0 || !row.director_email) continue;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      row.director_email,
        subject: `[FlashAprova] ${row.at_risk_count} alunos sem revisão em ${row.school_name}`,
        html: `
          <p>Olá, Diretor(a)!</p>
          <p>O painel detectou <strong>${row.at_risk_count} aluno(s)</strong> sem revisão nos últimos 7 dias em <strong>${row.school_name}</strong>.</p>
          <p><a href="https://app.flashaprova.com.br/director">Acesse o painel</a> para ver quem precisa de atenção.</p>
          <hr>
          <p style="color:#999;font-size:12px">FlashAprova B2B · Dados pedagógicos confidenciais</p>
        `,
      }),
    });

    if (res.ok) sent++;
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
