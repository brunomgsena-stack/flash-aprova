'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

// ─── Design tokens ────────────────────────────────────────────────────────────
const GREEN  = '#22c55e';
const VIOLET = '#7C3AED';
const CYAN   = '#06b6d4';

// ─── Phone mask ───────────────────────────────────────────────────────────────
function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <=  2) return `(${d}`;
  if (d.length <=  7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

// ─── Subjects data ────────────────────────────────────────────────────────────
const SUBJECTS = [
  {
    icon: '🍎', name: 'Física',    area: 'Ciências da Natureza', count: '1.128',
    color: '#f97316',
    topics: ['Mecânica Clássica', 'Eletromagnetismo', 'Termodinâmica', 'Óptica Geométrica', 'Ondulatória'],
  },
  {
    icon: '⚗️', name: 'Química',   area: 'Ciências da Natureza', count: '892',
    color: CYAN,
    topics: ['Estequiometria', 'Termoquímica', 'Ácidos e Bases', 'Eletroquímica', 'Orgânica e Funções'],
  },
  {
    icon: '🧬', name: 'Biologia',  area: 'Ciências da Natureza', count: '1.354',
    color: GREEN,
    topics: ['Ecologia', 'Genética e Evolução', 'Citologia', 'Embriologia', 'Fisiologia Humana'],
  },
  {
    icon: '⏳', name: 'História',  area: 'Ciências Humanas',     count: '756',
    color: '#eab308',
    topics: ['Revolução Francesa', 'Brasil Colonial', 'Guerra Fria', 'Era Vargas', 'Ditadura Militar'],
  },
  {
    icon: '🌐', name: 'Geografia', area: 'Ciências Humanas',     count: '634',
    color: '#10b981',
    topics: ['Geopolítica', 'Climatologia', 'Urbanização', 'Geopolítica Brasileira', 'Globalização'],
  },
  {
    icon: '📐', name: 'Matemática',area: 'Matemática',           count: '1.043',
    color: VIOLET,
    topics: ['Funções e Gráficos', 'Estatística e Probabilidade', 'Geometria Plana', 'Trigonometria', 'Análise Combinatória'],
  },
] as const;

// ─── Radar chart mockup ───────────────────────────────────────────────────────
// Hexagon with 6 axes: Biologia(top), Química(TR), Física(BR), História(B), Geo(BL), Mat(TL)
function RadarMockup() {
  const cx = 100, cy = 100, R = 78;
  const angles = [-90, -30, 30, 90, 150, 210].map(d => (d * Math.PI) / 180);
  const pt = (r: number, i: number) =>
    `${cx + r * Math.cos(angles[i])},${cy + r * Math.sin(angles[i])}`;

  const dataR = [0.75, 0.45, 0.62, 0.82, 0.38, 0.70].map(p => p * R);
  const labels = ['Bio', 'Quím', 'Fís', 'Hist', 'Geo', 'Mat'];
  const labelColors = [GREEN, CYAN, '#f97316', '#eab308', '#10b981', VIOLET];

  return (
    <svg viewBox="0 0 200 200" className="w-full" style={{ maxHeight: 180 }}>
      {/* Grid rings */}
      {[0.25, 0.50, 0.75, 1.0].map((pct) => (
        <polygon key={pct}
          points={angles.map((_, i) => pt(pct * R, i)).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {/* Axes */}
      {angles.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + R * Math.cos(angles[i])} y2={cy + R * Math.sin(angles[i])}
          stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {/* Data fill */}
      <polygon
        points={dataR.map((r, i) => pt(r, i)).join(' ')}
        fill={`${GREEN}22`} stroke={GREEN} strokeWidth="1.5"
      />
      {/* Data dots */}
      {dataR.map((r, i) => (
        <circle key={i}
          cx={cx + r * Math.cos(angles[i])} cy={cy + r * Math.sin(angles[i])}
          r="3" fill={GREEN} />
      ))}
      {/* Labels */}
      {angles.map((_, i) => {
        const lx = cx + (R + 14) * Math.cos(angles[i]);
        const ly = cy + (R + 14) * Math.sin(angles[i]);
        return (
          <text key={i} x={lx} y={ly + 3} textAnchor="middle"
            fill={labelColors[i]} fontSize="8" fontWeight="700" fontFamily="Inter,system-ui">
            {labels[i]}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Heatmap mockup ───────────────────────────────────────────────────────────
const HEAT_MOCK = [
  [0,0,2,3,5,0,1],[0,4,5,2,0,3,1],[2,0,3,5,4,1,0],[0,1,5,3,2,0,4],
  [3,2,0,4,5,1,0],[0,5,3,1,0,4,2],[1,0,4,5,3,0,2],[0,3,1,5,4,0,3],
  [2,1,0,3,5,2,0],[0,4,5,2,1,0,3],[1,0,2,5,4,3,0],[0,2,4,1,5,0,2],[0,1,5,3,0,4,2],
];
const HEAT_ALPHA = [0.05, 0.20, 0.40, 0.65, 0.85, 1.0];

function HeatmapMockup() {
  return (
    <div style={{ display:'flex', gap:'3px' }}>
      {HEAT_MOCK.map((week, wi) => (
        <div key={wi} style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
          {week.map((v, di) => (
            <div key={di} style={{
              width: 10, height: 10, borderRadius: 2,
              background: v === 0 ? 'rgba(255,255,255,0.05)' : `rgba(34,197,94,${HEAT_ALPHA[v]})`,
              boxShadow: v >= 4 ? `0 0 4px rgba(34,197,94,0.5)` : 'none',
            }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Line chart mockup ────────────────────────────────────────────────────────
function LineMockup() {
  const path = 'M10,70 C30,68 40,60 60,50 C75,42 80,55 100,40 C120,28 130,35 150,22 C165,12 175,18 190,8';
  const area = `${path} L190,80 L10,80 Z`;
  return (
    <svg viewBox="0 0 200 90" className="w-full" style={{ maxHeight: 90 }}>
      <defs>
        <linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GREEN} stopOpacity="0.25" />
          <stop offset="100%" stopColor={GREEN} stopOpacity="0" />
        </linearGradient>
        <filter id="line-glow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Grid */}
      {[20,40,60,80].map(y => (
        <line key={y} x1="10" y1={y} x2="190" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
      ))}
      {/* Area */}
      <path d={area} fill="url(#line-fill)" />
      {/* Line */}
      <path d={path} fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round"
        filter="url(#line-glow)" />
      {/* End dot */}
      <circle cx="190" cy="8" r="4" fill={GREEN} />
      <circle cx="190" cy="8" r="7" fill={`${GREEN}33`} />
    </svg>
  );
}

// ─── Ebbinghaus curve ─────────────────────────────────────────────────────────
function ForgettingCurve() {
  return (
    <svg viewBox="0 0 440 190" className="w-full" style={{ maxHeight: 200 }}>
      <defs>
        <linearGradient id="grad-forget" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f97316" /><stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <linearGradient id="grad-srs2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={VIOLET} /><stop offset="60%" stopColor={CYAN} /><stop offset="100%" stopColor={GREEN} />
        </linearGradient>
        <filter id="glow-srs2"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <linearGradient id="area-forget2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.15"/><stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="area-srs2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GREEN} stopOpacity="0.20"/><stop offset="100%" stopColor={GREEN} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[10,50,90,130,170].map(y => (
        <line key={y} x1="40" y1={y} x2="430" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
      ))}
      {([[10,'100%'],[50,'75%'],[90,'50%'],[130,'25%'],[170,'0%']] as const).map(([y,l]) => (
        <text key={l} x="34" y={y+4} textAnchor="end" fill="rgba(255,255,255,0.20)" fontSize="9" fontFamily="Inter,system-ui">{l}</text>
      ))}
      {([[40,'Hoje'],[105,'1d'],[170,'3d'],[260,'1 sem'],[380,'1 mês']] as const).map(([x,l]) => (
        <text key={l} x={x} y="185" textAnchor="middle" fill="rgba(255,255,255,0.20)" fontSize="9" fontFamily="Inter,system-ui">{l}</text>
      ))}
      <path d="M40,10 C70,10 80,70 105,95 C130,118 150,138 200,148 C250,156 310,160 380,163 L380,170 L40,170 Z" fill="url(#area-forget2)"/>
      <path d="M40,10 C70,10 80,70 105,95 C130,118 150,138 200,148 C250,156 310,160 380,163" fill="none" stroke="url(#grad-forget)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M40,10 C52,10 58,44 72,40 C86,36 92,18 112,16 C132,14 138,46 152,42 C166,38 172,18 194,16 C216,14 222,46 242,42 C262,38 268,18 292,16 C312,14 320,46 342,42 C356,38 364,20 380,18 L380,170 L40,170 Z" fill="url(#area-srs2)"/>
      <path d="M40,10 C52,10 58,44 72,40 C86,36 92,18 112,16 C132,14 138,46 152,42 C166,38 172,18 194,16 C216,14 222,46 242,42 C262,38 268,18 292,16 C312,14 320,46 342,42 C356,38 364,20 380,18" fill="none" stroke="url(#grad-srs2)" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow-srs2)"/>
      {([112,194,292] as const).map(cx => (
        <circle key={cx} cx={cx} cy={16} r="4" fill="#050505" stroke={GREEN} strokeWidth="1.8"/>
      ))}
    </svg>
  );
}

// ─── CTA button ───────────────────────────────────────────────────────────────
function CTAButton({ onClick, size = 'lg' }: { onClick: () => void; size?: 'sm' | 'lg' }) {
  const big = size === 'lg';
  return (
    <button
      onClick={onClick}
      className={`cta-pulse inline-flex items-center gap-3 rounded-2xl font-black text-black transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.99] ${big ? 'px-8 py-5 text-lg' : 'px-6 py-4 text-base'}`}
      style={{
        background:    `linear-gradient(135deg, ${GREEN} 0%, #16a34a 100%)`,
        letterSpacing: '-0.01em',
      }}
    >
      <svg width={big ? 22 : 18} height={big ? 22 : 18} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
      Iniciar Diagnóstico por IA agora
    </button>
  );
}

// ─── Onboarding overlay ───────────────────────────────────────────────────────
type OnboardingState = 'idle' | 'saving' | 'done' | 'error';

function OnboardingOverlay({ onClose }: { onClose: () => void }) {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [state,    setState]    = useState<OnboardingState>('idle');
  const [errMsg,   setErrMsg]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || whatsapp.replace(/\D/g,'').length < 10) {
      setErrMsg('Preencha todos os campos corretamente.'); return;
    }
    setState('saving'); setErrMsg('');
    const { error } = await supabase.from('leads').insert({
      name: name.trim(), email: email.trim().toLowerCase(), whatsapp: whatsapp.replace(/\D/g,''),
    });
    if (error) { setState('error'); setErrMsg('Erro ao salvar. Tente novamente.'); return; }
    setState('done');
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.10)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-in"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}>
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden card-in"
        style={{
          background: 'rgba(5,5,5,0.96)',
          border: `1px solid ${GREEN}55`,
          boxShadow: `0 0 0 1px ${GREEN}22, 0 0 60px ${GREEN}18, 0 24px 48px rgba(0,0,0,0.70)`,
        }}
        onClick={e => e.stopPropagation()}>

        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${GREEN}, transparent)` }} />
        <div className="absolute top-0 left-0 w-48 h-48 pointer-events-none rounded-full"
          style={{ background: `radial-gradient(circle, ${GREEN}15 0%, transparent 70%)`, transform: 'translate(-30%,-30%)' }} />

        <div className="relative p-7">
          {state === 'done' ? (
            <div className="flex flex-col items-center text-center gap-5 py-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: `${GREEN}18`, border: `1px solid ${GREEN}40`, boxShadow: `0 0 24px ${GREEN}30` }}>
                ✅
              </div>
              <div>
                <p className="text-white font-black text-xl mb-2">Diagnóstico enviado!</p>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Crie sua conta gratuita para acessar os 10 cards de diagnóstico da IA e descobrir suas lacunas de memória.
                </p>
              </div>
              <Link href="/login"
                className="w-full py-4 rounded-xl font-black text-black text-base text-center transition-all duration-200 hover:-translate-y-0.5 cta-pulse"
                style={{ background: `linear-gradient(135deg, ${GREEN}, #16a34a)` }}>
                Criar conta e Iniciar Diagnóstico →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="flex gap-1.5 mb-6">
                {[1,2,3].map(n => (
                  <div key={n} className="h-1 rounded-full"
                    style={{ width: n === 1 ? '28px' : '10px', background: n === 1 ? GREEN : 'rgba(255,255,255,0.10)' }} />
                ))}
                <span className="text-slate-600 text-xs ml-1">Passo 1 de 3</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
                  style={{ background: `${GREEN}18`, border: `1px solid ${GREEN}40`, boxShadow: `0 0 20px ${GREEN}25` }}>
                  🎯
                </div>
                <div>
                  <p className="text-white font-black text-base leading-tight">Identificação de Combate</p>
                  <p className="text-slate-500 text-xs mt-0.5">Para onde a IA envia seu Diagnóstico?</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 mb-5">
                {[
                  { label: 'Nome completo', type: 'text',  placeholder: 'Seu nome', val: name,     set: setName,     ac: 'name' },
                  { label: 'E-mail',        type: 'email', placeholder: 'seu@email.com', val: email, set: setEmail, ac: 'email' },
                ].map(({ label, type, placeholder, val, set, ac }) => (
                  <div key={label}>
                    <label className="text-xs text-slate-500 font-medium mb-1.5 block">{label}</label>
                    <input type={type} placeholder={placeholder} value={val}
                      onChange={e => set(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all duration-200 placeholder-slate-700"
                      style={inputStyle} autoComplete={ac} required />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">WhatsApp</label>
                  <input type="tel" placeholder="(11) 99999-9999" value={whatsapp}
                    onChange={e => setWhatsapp(maskPhone(e.target.value))}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all duration-200 placeholder-slate-700"
                    style={inputStyle} autoComplete="tel" required />
                </div>
              </div>

              {errMsg && <p className="text-red-400 text-xs mb-4 text-center">{errMsg}</p>}

              <button type="submit" disabled={state === 'saving'}
                className="w-full py-4 rounded-xl font-black text-black text-base transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: `linear-gradient(135deg, ${GREEN}, #16a34a)`,
                  boxShadow: `0 0 28px ${GREEN}40, 0 4px 20px rgba(0,0,0,0.40)` }}>
                {state === 'saving' ? 'Salvando...' : 'Iniciar meu Diagnóstico por IA →'}
              </button>
              <p className="text-center text-slate-700 text-xs mt-4">🔒 Seus dados são privados.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const open = () => setShowOnboarding(true);

  return (
    <div
      className="relative overflow-x-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 0%, #0a0514 0%, #050505 60%)' }}
    >

      {/* ── Ambient orbs — violet/blue dominant ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="orb-a absolute rounded-full"
          style={{ width: 700, height: 700, top: '-20%', left: '-15%',
            background: `radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)` }} />
        <div className="orb-b absolute rounded-full"
          style={{ width: 550, height: 550, top: '30%', right: '-18%',
            background: `radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)` }} />
        <div className="orb-a absolute rounded-full"
          style={{ width: 450, height: 450, bottom: '5%', left: '20%',
            background: `radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)`, animationDelay: '-5s' }} />
      </div>

      {/* ── Grid overlay — subtle violet tint ── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        zIndex: 0,
        backgroundImage: `linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      <div className="relative" style={{ zIndex: 1 }}>

        {/* ══════════════════════════════════════════ NAVBAR ══ */}
        <nav className="flex items-center justify-between px-5 sm:px-10 py-5 max-w-6xl mx-auto">
          <span className="font-black text-white text-xl tracking-tight">
            Flash<span style={{
              background: `linear-gradient(90deg, ${GREEN}, ${CYAN})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Aprova</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors font-medium hidden sm:block">
              Entrar
            </Link>
            <button onClick={open}
              className="text-sm px-4 py-2 rounded-xl font-bold text-black transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: GREEN }}>
              Começar grátis
            </button>
          </div>
        </nav>

        {/* ══════════════════════════════════════════ HERO ══ */}
        <section className="max-w-4xl mx-auto px-5 sm:px-10 pt-10 pb-20 text-center">

          <div className="fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-bold tracking-widest uppercase"
            style={{ background: `${GREEN}14`, border: `1px solid ${GREEN}35`, color: GREEN }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GREEN }} />
            Algoritmo de Revisão Inteligente · IA Especialista
          </div>

          <h1 className="fade-up-d1 text-4xl sm:text-5xl md:text-6xl font-black leading-tight text-white mb-6">
            Lembre-se de{' '}
            <span style={{
              background: `linear-gradient(90deg, ${GREEN}, ${CYAN})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>97%</span>{' '}do que estudou e seja Aprovado no{' '}
            <span style={{
              color: GREEN,
              textShadow: `0 0 20px ${GREEN}90, 0 0 40px ${GREEN}50`,
            }}>ENEM.</span>
          </h1>

          <p className="fade-up-d2 text-slate-400 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            O <span className="text-white font-semibold">"branco" na hora da prova</span> é o sintoma de um método quebrado.
            Use o sistema de repetição espaçada com{' '}
            <span className="text-white font-semibold">Análise de Lacunas por IA</span>{' '}
            que blinda sua memória e garante seu nome na lista.
          </p>

          <div className="fade-up-d3 flex flex-col items-center gap-3">
            <CTAButton onClick={open} />
            <p className="text-slate-700 text-xs">Sem cartão · Diagnóstico por IA em 3 min · Acesso imediato</p>
          </div>

          {/* Stats */}
          <div className="fade-up-d4 flex flex-wrap justify-center gap-8 mt-14">
            {[
              { n: '97%',     label: 'retenção média com IA',    color: GREEN },
              { n: '8.400+',  label: 'flashcards táticos',       color: VIOLET },
              { n: '48h',     label: 'para sentir a diferença',  color: CYAN },
            ].map(({ n, label, color }) => (
              <div key={n} className="text-center">
                <p className="text-3xl font-black" style={{
                  color,
                  textShadow: `0 0 18px ${color}70`,
                }}>{n}</p>
                <p className="text-slate-600 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════ SUBJECT SHOWCASE ══ */}
        <section className="max-w-6xl mx-auto px-5 sm:px-10 pb-24">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: GREEN }}>
              Banco de Questões
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Conteúdos do FlashAprova
            </h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              Cada card foi gerado e validado por IA Especialista com base nas provas anteriores do ENEM.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUBJECTS.map(s => (
              <div key={s.name}
                className="relative rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: 'rgba(10,5,20,0.70)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid rgba(124,58,237,0.20)`,
                  boxShadow: `0 0 40px rgba(124,58,237,0.06)`,
                }}>
                {/* violet ambient glow per card */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at top left, rgba(124,58,237,0.08) 0%, transparent 65%)` }} />
                <div className="absolute inset-x-0 top-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${s.color}60, rgba(124,58,237,0.40), transparent)` }} />

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
                      style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{s.name}</p>
                      <p className="text-slate-600 text-xs">{s.area}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-base" style={{ color: s.color }}>{s.count}</p>
                    <p className="text-slate-700 text-xs font-semibold tracking-wider">CARDS</p>
                  </div>
                </div>

                {/* Topics */}
                <div className="flex flex-col gap-1.5">
                  {s.topics.map(t => (
                    <div key={t} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-slate-500 text-xs">{t}</span>
                    </div>
                  ))}
                </div>

                {/* Lock badge */}
                <div className="mt-4 flex items-center gap-1.5">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}25` }}>
                    IA-curado
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════ DASHBOARD MOCKUPS ══ */}
        <section className="max-w-6xl mx-auto px-5 sm:px-10 pb-24">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: VIOLET }}>
              Seu Painel de Controle
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              A IA mapeia seu cérebro{' '}
              <span style={{
                background: `linear-gradient(90deg, ${VIOLET}, ${CYAN})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>em tempo real</span>
            </h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              Visualize exatamente o que você domina, o que está esquecendo e quando revisar cada tópico.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Radar */}
            <div className="relative rounded-2xl p-5 overflow-hidden"
              style={{ background: 'rgba(10,5,20,0.80)', border: `1px solid rgba(124,58,237,0.28)`,
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 0 50px rgba(124,58,237,0.10)' }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at top right, rgba(124,58,237,0.13) 0%, transparent 65%)' }} />
              <div className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}80, transparent)` }} />
              <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: VIOLET }}>Radar ENEM</p>
              <p className="text-slate-600 text-xs mb-4">Equilíbrio de domínio</p>
              <RadarMockup />
              <p className="text-slate-600 text-xs mt-3 text-center">
                ● Domínio atual &nbsp;&nbsp;○ Meta
              </p>
            </div>

            {/* Heatmap */}
            <div className="relative rounded-2xl p-5 overflow-hidden"
              style={{ background: 'rgba(10,5,20,0.80)', border: `1px solid rgba(99,102,241,0.25)`,
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 0 50px rgba(99,102,241,0.08)' }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at top left, rgba(99,102,241,0.10) 0%, transparent 65%)' }} />
              <div className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, rgba(99,102,241,0.70), ${GREEN}40, transparent)` }} />
              <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: GREEN }}>Consistência</p>
              <p className="text-slate-600 text-xs mb-4">Heatmap de revisões · últimos 3 meses</p>
              <div className="overflow-x-auto">
                <HeatmapMockup />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-slate-700 text-xs">Menos</span>
                {[0.05, 0.25, 0.50, 0.75, 1.0].map(a => (
                  <div key={a} style={{ width:10, height:10, borderRadius:2,
                    background: `rgba(34,197,94,${a})` }} />
                ))}
                <span className="text-slate-700 text-xs">Mais</span>
              </div>
            </div>

            {/* Line chart */}
            <div className="relative rounded-2xl p-5 overflow-hidden"
              style={{ background: 'rgba(10,5,20,0.80)', border: `1px solid rgba(6,182,212,0.22)`,
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 0 50px rgba(6,182,212,0.07)' }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at bottom right, rgba(6,182,212,0.09) 0%, transparent 65%)' }} />
              <div className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${CYAN}70, transparent)` }} />
              <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: CYAN }}>Previsão de Revisão</p>
              <p className="text-slate-600 text-xs mb-4">Evolução do domínio por semana</p>
              <LineMockup />
              <div className="flex justify-between text-slate-700 text-xs mt-2">
                <span>Semana 1</span><span>→</span><span>Hoje</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: GREEN }} />
                <span className="text-slate-500 text-xs">% Domínio acumulado (IA)</span>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════ AI TUTOR MOCKUP ══ */}
        <section className="max-w-4xl mx-auto px-5 sm:px-10 pb-24">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: GREEN }}>
              Tutor IA Especialista
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Dúvida? A IA resolve{' '}
              <span style={{ color: GREEN, textShadow: `0 0 20px ${GREEN}70` }}>em segundos</span>
            </h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              Treinado nas provas do ENEM, o Tutor IA explica conceitos complexos de forma simples e tática — como um professor particular disponível 24h.
            </p>
          </div>

          <div className="relative rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(5,5,5,0.90)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${GREEN}25`,
              boxShadow: `0 0 60px ${GREEN}0c`,
            }}>
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${GREEN}50, transparent)` }} />

            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                style={{ background: `${GREEN}20`, border: `1px solid ${GREEN}40` }}>
                🤖
              </div>
              <div>
                <p className="text-white font-bold text-sm">Tutor IA · Química Especialista</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GREEN }} />
                  <span className="text-slate-600 text-xs">Online · Analisando lacunas</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="px-5 py-6 flex flex-col gap-4">

              {/* Student message */}
              <div className="flex justify-end">
                <div className="max-w-xs sm:max-w-sm rounded-2xl rounded-tr-sm px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Não consigo entender Estequiometria. Como calculo a proporção entre reagentes sem travar na prova?
                  </p>
                  <p className="text-slate-700 text-xs mt-1 text-right">Você · agora</p>
                </div>
              </div>

              {/* AI response */}
              <div className="flex justify-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mt-1"
                  style={{ background: `${GREEN}20`, border: `1px solid ${GREEN}40` }}>
                  🤖
                </div>
                <div className="max-w-xs sm:max-w-md rounded-2xl rounded-tl-sm px-4 py-3"
                  style={{ background: `${GREEN}0e`, border: `1px solid ${GREEN}25` }}>
                  <p className="text-white text-sm font-semibold mb-2">
                    Técnica dos 3 passos — memorize isso:
                  </p>
                  <div className="flex flex-col gap-2 text-sm text-slate-300 leading-relaxed">
                    <div className="flex gap-2">
                      <span style={{ color: GREEN }} className="font-bold shrink-0">①</span>
                      <span><span className="text-white font-semibold">Escreva a equação balanceada.</span> Os coeficientes são as proporções. Ex: 2H₂ + O₂ → 2H₂O significa 2 mol de H₂ para 1 mol de O₂.</span>
                    </div>
                    <div className="flex gap-2">
                      <span style={{ color: GREEN }} className="font-bold shrink-0">②</span>
                      <span><span className="text-white font-semibold">Monte a regra de 3</span> usando massas molares (H=1, O=16, C=12...).</span>
                    </div>
                    <div className="flex gap-2">
                      <span style={{ color: GREEN }} className="font-bold shrink-0">③</span>
                      <span><span className="text-white font-semibold">Confira as unidades.</span> Se der mol → converta pra gramas multiplicando pela massa molar. Pronto.</span>
                    </div>
                  </div>
                  <div className="mt-3 px-3 py-2 rounded-xl text-xs"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: GREEN }} className="font-bold">💡 Macete ENEM:</span>
                    <span className="text-slate-400 ml-1">Coeficiente = proporção = regra de 3. Nunca mude isso.</span>
                  </div>
                  <p className="text-slate-700 text-xs mt-2">Tutor IA · agora</p>
                </div>
              </div>

              {/* Typing indicator */}
              <div className="flex justify-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                  style={{ background: `${GREEN}20`, border: `1px solid ${GREEN}40` }}>
                  🤖
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1"
                  style={{ background: `${GREEN}0a`, border: `1px solid ${GREEN}18` }}>
                  {[0,0.2,0.4].map(delay => (
                    <div key={delay} className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: GREEN, animationDelay: `${delay}s` }} />
                  ))}
                  <span className="text-slate-600 text-xs ml-2">Preparando seu próximo card...</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════ EBBINGHAUS ══ */}
        <section className="max-w-4xl mx-auto px-5 sm:px-10 pb-24">
          <div className="relative rounded-3xl p-7 sm:p-10 overflow-hidden"
            style={{
              background: 'rgba(10,5,20,0.80)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(124,58,237,0.20)',
              boxShadow: '0 0 60px rgba(124,58,237,0.08)',
            }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at bottom left, rgba(124,58,237,0.10) 0%, transparent 60%)' }} />
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.50), rgba(124,58,237,0.30), transparent)' }} />
            <div className="max-w-xl mb-6">
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#f97316' }}>A Ciência por Trás do Método</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3">
                A Curva do Esquecimento de Ebbinghaus
              </h2>
              <p className="text-slate-400 text-base leading-relaxed">
                A ciência é clara:{' '}
                <span className="text-white font-semibold">sem a revisão certa, você esquece 70% do que estudou em 48h.</span>
                {' '}Nossa IA hackeia esse processo para você reter quase tudo.
              </p>
            </div>
            <ForgettingCurve />
            <div className="flex flex-wrap gap-5 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 rounded-full" style={{ background: '#f97316' }} />
                <span className="text-slate-500 text-xs">Sem revisão</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${VIOLET}, ${GREEN})` }} />
                <span className="text-slate-500 text-xs">Com IA + SRS (FlashAprova)</span>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════ FINAL CTA ══ */}
        <section className="max-w-4xl mx-auto px-5 sm:px-10 pb-24">
          <div className="relative rounded-3xl p-10 sm:p-16 overflow-hidden text-center"
            style={{
              background: 'rgba(10,5,20,0.92)',
              border: `1px solid rgba(124,58,237,0.35)`,
              boxShadow: `0 0 0 1px rgba(124,58,237,0.12), 0 0 100px rgba(124,58,237,0.16), 0 0 200px rgba(99,102,241,0.08)`,
            }}>
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}, ${CYAN}80, transparent)` }} />
            <div className="absolute top-0 left-0 w-80 h-80 pointer-events-none"
              style={{ background: `radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)`, transform: 'translate(-30%,-30%)' }} />
            <div className="absolute bottom-0 right-0 w-72 h-72 pointer-events-none"
              style={{ background: `radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)`, transform: 'translate(30%,30%)' }} />

            <div className="relative">
              <p className="text-slate-600 text-sm mb-2">Não deixe para depois</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
                Seu concorrente já está<br/>
                <span style={{ color: GREEN, textShadow: `0 0 24px ${GREEN}80` }}>
                  blindando a memória com IA.
                </span>
              </h2>
              <p className="text-slate-400 text-base mb-8 max-w-lg mx-auto">
                Cada dia sem o método certo é memória perdida que não volta. Inicie seu Diagnóstico por IA agora e entre para a lista de aprovados.
              </p>
              <div className="flex justify-center">
                <CTAButton onClick={open} />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════ FOOTER ══ */}
        <footer className="border-t border-white/5 py-8 px-5 sm:px-10 text-center">
          <p className="text-white font-black mb-2">
            Flash<span style={{
              background: `linear-gradient(90deg, ${GREEN}, ${CYAN})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Aprova</span>
          </p>
          <p className="text-slate-700 text-xs">
            © 2026 · Tecnologia de aprovação com IA ·{' '}
            <Link href="/login" className="hover:text-slate-400 transition-colors">Entrar</Link>
          </p>
        </footer>

      </div>

      {showOnboarding && <OnboardingOverlay onClose={() => setShowOnboarding(false)} />}
    </div>
  );
}
