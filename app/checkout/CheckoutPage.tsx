'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { type SubjectId, SUBJECT_META } from '../onboarding/flashcardData';

const GREEN  = '#22c55e';
const VIOLET = '#7C3AED';
const CYAN   = '#06b6d4';
const RED    = '#ef4444';

// ─── Radar (same as LandingPage but dynamic) ────────────────────────────────
const RADAR_ORDER: SubjectId[] = ['biologia','quimica','historia','geografia'];
const RADAR_LABELS = ['Bio','Quím','Hist','Geo'];
const RADAR_COLORS = [GREEN, CYAN, '#eab308', '#10b981'];

function RadarChart({ scores }: { scores: number[] }) {
  const cx = 110, cy = 110, R = 82;
  // 4 axes at 0°, 90°, 180°, 270° (top, right, bottom, left)
  const angles = [-90, 0, 90, 180].map(d => (d * Math.PI) / 180);
  const pt = (r: number, i: number) => `${cx + r * Math.cos(angles[i])},${cy + r * Math.sin(angles[i])}`;

  return (
    <svg viewBox="0 0 220 220" className="w-full" style={{ maxHeight: 220 }}>
      <defs>
        <filter id="radar-glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* Grid rings */}
      {[0.25,0.5,0.75,1].map(p => (
        <polygon key={p} points={angles.map((_,i) => pt(p*R,i)).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
      ))}
      {/* Axes */}
      {angles.map((_,i) => (
        <line key={i} x1={cx} y1={cy} x2={cx+R*Math.cos(angles[i])} y2={cy+R*Math.sin(angles[i])}
          stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
      ))}
      {/* Data area */}
      <polygon
        points={scores.map((s,i) => pt(s*R,i)).join(' ')}
        fill={`${VIOLET}25`} stroke={VIOLET} strokeWidth="2" filter="url(#radar-glow)" />
      {/* Dots */}
      {scores.map((s,i) => (
        <circle key={i} cx={cx+s*R*Math.cos(angles[i])} cy={cy+s*R*Math.sin(angles[i])}
          r="5" fill={RADAR_COLORS[i]} />
      ))}
      {/* Labels */}
      {angles.map((_,i) => {
        const lx = cx + (R+16)*Math.cos(angles[i]);
        const ly = cy + (R+16)*Math.sin(angles[i]);
        return (
          <text key={i} x={lx} y={ly+4} textAnchor="middle"
            fill={RADAR_COLORS[i]} fontSize="10" fontWeight="700" fontFamily="Inter,system-ui">
            {RADAR_LABELS[i]}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Urgency strip ──────────────────────────────────────────────────────────
function UrgencyStrip() {
  const [count, setCount] = useState(7);
  useEffect(() => {
    const t = setInterval(() => setCount(c => (c > 3 ? c - 1 : 3)), 45000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold mb-6"
      style={{ background: 'rgba(239,68,68,0.10)', border: `1px solid ${RED}30`, color: RED }}>
      <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: RED }} />
      Apenas <strong className="mx-1">{count} vagas</strong> restantes para o Tutor IA Especialista nesta sessão
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
interface OnboardingData {
  university: string;
  subject: SubjectId;
  results: { rating: string; seconds: number }[];
  memoryHealth: number;
}

export default function CheckoutPage() {
  const [data, setData] = useState<OnboardingData | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('flashAprovaOnboarding');
      if (raw) setData(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const health = data?.memoryHealth ?? 62;
  const subjectId = data?.subject ?? 'historia';
  const subjectMeta = SUBJECT_META[subjectId];

  // Compute subject score from health
  const subjectScore = health > 80 ? 0.76 : health > 60 ? 0.52 : health > 40 ? 0.32 : 0.18;

  // Scores for the 4 radar axes in order [biologia, quimica, historia, geografia]
  const defaultScores: Record<SubjectId, number> = { biologia: 0.60, quimica: 0.42, historia: 0.55, geografia: 0.68 };
  const scores = RADAR_ORDER.map(id => id === subjectId ? subjectScore : defaultScores[id]);

  const hardCount = data?.results.filter(r => r.rating === 'dificil').length ?? 3;
  const status = health < 55 ? 'CRÍTICO' : health < 72 ? 'EM RISCO' : 'ATENÇÃO';
  const statusColor = health < 55 ? RED : health < 72 ? '#f97316' : '#eab308';
  const statusBg = health < 55 ? 'rgba(239,68,68,0.08)' : health < 72 ? 'rgba(249,115,22,0.08)' : 'rgba(234,179,8,0.08)';
  const statusBorder = health < 55 ? 'rgba(239,68,68,0.28)' : health < 72 ? 'rgba(249,115,22,0.28)' : 'rgba(234,179,8,0.28)';

  const cardStyle = {
    background: 'rgba(10,5,20,0.88)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
  };

  return (
    <div className="min-h-screen px-4 py-10 sm:px-8 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 0%, #0a0514 0%, #050505 65%)' }}>

      {/* Grid */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)`,
          backgroundSize: '48px 48px', zIndex: 0,
        }} />
      {/* Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full orb-a"
          style={{ width:600,height:600,top:'-15%',left:'-10%',background:`radial-gradient(circle,rgba(239,68,68,0.10) 0%,transparent 70%)` }} />
        <div className="absolute rounded-full orb-b"
          style={{ width:500,height:500,bottom:'5%',right:'-10%',background:`radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 70%)` }} />
      </div>

      <div className="relative max-w-3xl mx-auto" style={{ zIndex: 1 }}>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="font-black text-white text-xl">
            Flash<span style={{ background:`linear-gradient(90deg,${GREEN},${CYAN})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Aprova</span>
          </Link>
        </div>

        {/* ── Status header ── */}
        <div className="relative rounded-3xl p-6 sm:p-8 mb-6 overflow-hidden"
          style={{ ...cardStyle, border: `1px solid ${statusBorder}`, boxShadow: `0 0 60px ${statusColor}18` }}>
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${statusColor}80, transparent)` }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at top, ${statusColor}0c 0%, transparent 60%)` }} />

          <div className="relative flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center sm:text-left flex-1">
              <p className="text-slate-500 text-xs font-semibold tracking-widest uppercase mb-2">Relatório de Diagnóstico · IA</p>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-1">
                Status:{' '}
                <span style={{ color: statusColor, textShadow: `0 0 20px ${statusColor}80` }}>
                  {status}
                </span>
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed mt-2">
                {data?.university && <><span className="text-white font-semibold">{data.university}</span> · </>}
                Saúde da Memória: <span style={{ color: statusColor }} className="font-bold">{health}%</span>
                {' · '}<span className="text-white font-bold">{hardCount}</span> lacunas críticas em{' '}
                <span style={{ color: subjectMeta.color, textShadow: `0 0 10px ${subjectMeta.color}60` }}>
                  {subjectMeta.name}
                </span>
              </p>
              <p className="text-slate-500 text-xs mt-3">
                {health < 55
                  ? '⚠ A IA identificou risco elevado de "branco" na prova. Intervenção urgente recomendada.'
                  : health < 72
                  ? '⚠ Sua base de memorização possui falhas que aumentam o risco de erros em questões fáceis.'
                  : '✓ Base sólida detectada. A IA pode elevar seu domínio para o nível de aprovação.'}
              </p>
            </div>

            {/* Mini radar */}
            <div className="shrink-0 w-44">
              <RadarChart scores={scores} />
              <p className="text-xs text-center text-slate-600 mt-1">Radar ENEM · IA</p>
            </div>
          </div>
        </div>

        <UrgencyStrip />

        {/* ── Plan cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">

          {/* Flash */}
          <div className="relative rounded-2xl p-6 overflow-hidden"
            style={{ ...cardStyle, border:'1px solid rgba(124,58,237,0.20)' }}>
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background:`linear-gradient(90deg,transparent,rgba(124,58,237,0.50),transparent)` }} />
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-4"
              style={{ background:'rgba(124,58,237,0.15)',border:'1px solid rgba(124,58,237,0.30)' }}>⚡</div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color:'#a78bfa' }}>Plano Flash</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-slate-500 text-xs">12x de</span>
              <span className="text-4xl font-black text-white ml-1">R$&nbsp;21</span>
              <span className="text-2xl font-black text-white">,90</span>
            </div>
            <p className="text-slate-700 text-xs mb-5">R$ 262,80/ano · sem juros</p>
            <div className="h-px mb-5" style={{ background:'rgba(255,255,255,0.06)' }} />
            <div className="flex flex-col gap-2 mb-6 text-sm text-slate-400">
              {['Flashcards ilimitados', 'Algoritmo SRS avançado', 'Dashboard & heatmap'].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <span style={{ color:'#a78bfa' }}>✓</span> {f}
                </div>
              ))}
              {['Resumos & Tabelas', 'Áudio-Resumos', 'Tutor IA Especialista'].map(f => (
                <div key={f} className="flex items-center gap-2 opacity-35">
                  <span>🔒</span> <span className="line-through">{f}</span>
                </div>
              ))}
            </div>
            <Link href="/login"
              className="block w-full py-3 rounded-xl text-center text-sm font-bold transition-all hover:opacity-80"
              style={{ background:'rgba(124,58,237,0.18)',border:'1px solid rgba(124,58,237,0.35)',color:'#c4b5fd' }}>
              Começar com Flash
            </Link>
          </div>

          {/* ProAI+ — hero */}
          <div className="shimmer-card relative rounded-2xl p-6 overflow-hidden"
            style={{
              background:'rgba(8,4,16,0.92)',
              border:'1px solid transparent',
              backgroundClip:'padding-box',
              boxShadow:`0 0 0 1px rgba(124,58,237,0.50), 0 0 60px rgba(124,58,237,0.18), 0 0 120px rgba(6,182,212,0.10)`,
            }}>
            {/* Gradient border */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ padding:'1px', background:'linear-gradient(135deg,#7C3AED,#06b6d4,#ec4899)',
                WebkitMask:'linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0)',
                WebkitMaskComposite:'xor', maskComposite:'exclude' }} />
            {/* Ambient */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background:'radial-gradient(ellipse at top right,rgba(6,182,212,0.10) 0%,transparent 60%)' }} />
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background:'linear-gradient(90deg,#7C3AED,#06b6d4,#ec4899)' }} />

            {/* Badge */}
            <div className="absolute top-4 right-4 text-xs font-black px-2.5 py-1 rounded-full text-white"
              style={{ background:'linear-gradient(135deg,#7C3AED,#06b6d4)', boxShadow:'0 0 14px rgba(124,58,237,0.50)' }}>
              🏆 Recomendado para {data?.university?.split('–')[0]?.trim() ?? 'Medicina'}
            </div>

            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-4 relative"
              style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.28),rgba(6,182,212,0.20))',
                border:'1px solid rgba(6,182,212,0.35)', boxShadow:'0 0 18px rgba(6,182,212,0.25)' }}>
              🤖
            </div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1 relative"
              style={{ background:'linear-gradient(90deg,#a78bfa,#67e8f9)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Plano ProAI+
            </p>
            <div className="flex items-baseline gap-1 mb-1 relative">
              <span className="text-slate-500 text-xs">12x de</span>
              <span className="text-4xl font-black text-white ml-1">R$&nbsp;29</span>
              <span className="text-2xl font-black text-white">,90</span>
            </div>
            <p className="text-slate-700 text-xs mb-5 relative">R$ 358,80/ano · sem juros</p>
            <div className="h-px mb-5 relative"
              style={{ background:'linear-gradient(90deg,rgba(124,58,237,0.40),rgba(6,182,212,0.40))' }} />
            <div className="flex flex-col gap-2 mb-6 text-sm relative">
              {[
                { t:'Tudo do Plano Flash',               c:'#67e8f9' },
                { t:'Resumos Storytelling por deck',      c:'#67e8f9' },
                { t:'Tabelas + Macetes & Mnemonics',      c:'#67e8f9' },
                { t:'Áudio-Resumos narrados por IA',      c:'#67e8f9' },
                { t:'Tutor IA Especialista 24h',          c:'#f472b6' },
                { t:'Flashcards via Foto/PDF',            c:'#f472b6' },
              ].map(({ t, c }) => (
                <div key={t} className="flex items-center gap-2">
                  <span style={{ color:c }}>✓</span>
                  <span className="text-slate-300">{t}</span>
                </div>
              ))}
            </div>
            <Link href="/login"
              className="relative block w-full py-4 rounded-xl text-center font-black text-white text-base transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background:'linear-gradient(135deg,#7C3AED 0%,#06b6d4 60%,#ec4899 100%)',
                boxShadow:'0 0 32px rgba(124,58,237,0.55),0 4px 20px rgba(0,0,0,0.45)',
              }}>
              Garantir minha Aprovação (12x sem juros)
            </Link>
          </div>
        </div>

        {/* ── Guarantee + trust ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl p-5 flex items-start gap-4"
            style={{ background:'rgba(10,5,20,0.70)',border:'1px solid rgba(34,197,94,0.20)' }}>
            <div className="text-3xl shrink-0">🛡️</div>
            <div>
              <p className="text-white font-bold text-sm">Garantia de 7 dias</p>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Se não sentir melhora na sua retenção em 7 dias, devolvemos 100% do valor. Sem perguntas.
              </p>
            </div>
          </div>
          <div className="rounded-2xl p-5 flex items-start gap-4"
            style={{ background:'rgba(10,5,20,0.70)',border:'1px solid rgba(124,58,237,0.20)' }}>
            <div className="text-3xl shrink-0">⚡</div>
            <div>
              <p className="text-white font-bold text-sm">Acesso em menos de 2 minutos</p>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Após a confirmação, seus flashcards e o Tutor IA já estarão disponíveis. Sem espera.
              </p>
            </div>
          </div>
        </div>

        {/* Feature comparison */}
        <div className="rounded-2xl overflow-hidden mb-8"
          style={{ border:'1px solid rgba(255,255,255,0.06)',background:'rgba(10,5,20,0.60)' }}>
          <div className="grid grid-cols-3 px-5 py-3 border-b border-white/5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Recurso</span>
            <span className="text-xs font-semibold text-center uppercase tracking-wider" style={{ color:'#a78bfa' }}>Flash</span>
            <span className="text-xs font-semibold text-center uppercase tracking-widest"
              style={{ background:'linear-gradient(90deg,#a78bfa,#67e8f9)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>ProAI+</span>
          </div>
          {[
            ['Flashcards SRS ilimitados', true,  true ],
            ['Dashboard & heatmap',       true,  true ],
            ['Resumos Storytelling',       false, true ],
            ['Tabelas Comparativas',       false, true ],
            ['Áudio-Resumos IA',           false, true ],
            ['Tutor IA Especialista',      false, true ],
            ['Flashcards por Foto/PDF',    false, true ],
          ].map(([feat, flash, pro], i) => (
            <div key={feat as string} className="grid grid-cols-3 px-5 py-3 text-sm"
              style={{ borderTop:'1px solid rgba(255,255,255,0.04)',background:i%2===0?'rgba(255,255,255,0.015)':'transparent' }}>
              <span className="text-slate-400">{feat as string}</span>
              <span className="text-center font-semibold" style={{ color:flash?'#a78bfa':'#334155' }}>{flash?'✓':'—'}</span>
              <span className="text-center font-semibold" style={{ color:pro?'#67e8f9':'#334155' }}>{pro?'✓':'—'}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-700 text-xs pb-8">
          🔒 Pagamento 100% seguro · 📅 Cancele quando quiser · ⚡ Acesso imediato
        </p>
      </div>
    </div>
  );
}
