'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

// ─── Phone mask ───────────────────────────────────────────────────────────────

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <=  2) return `(${d}`;
  if (d.length <=  7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

// ─── Ebbinghaus SVG ───────────────────────────────────────────────────────────

function ForgettingCurve() {
  // ViewBox 0 0 440 190  — Y: 10 = 100%, Y: 170 = 0%
  return (
    <svg
      viewBox="0 0 440 190"
      className="w-full"
      style={{ maxHeight: 200 }}
      aria-label="Curva de Ebbinghaus"
    >
      <defs>
        <linearGradient id="grad-forget" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <linearGradient id="grad-srs" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="60%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <filter id="glow-srs">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        {/* Area fills */}
        <linearGradient id="area-forget" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="area-srs" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[10, 50, 90, 130, 170].map(y => (
        <line key={y} x1="40" y1={y} x2="430" y2={y}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {/* Y-axis labels */}
      {[[10,'100%'],[50,'75%'],[90,'50%'],[130,'25%'],[170,'0%']].map(([y,label]) => (
        <text key={label as string} x="34" y={Number(y)+4} textAnchor="end"
          fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="Inter,system-ui">
          {label}
        </text>
      ))}

      {/* X-axis labels */}
      {[[40,'Hoje'],[105,'1d'],[170,'3d'],[260,'1 sem'],[380,'1 mês']].map(([x,label]) => (
        <text key={label as string} x={x as number} y="185" textAnchor="middle"
          fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="Inter,system-ui">
          {label}
        </text>
      ))}

      {/* ── Sem revisão — area fill ── */}
      <path
        d="M40,10 C70,10 80,70 105,95 C130,118 150,138 200,148 C250,156 310,160 380,163 L380,170 L40,170 Z"
        fill="url(#area-forget)"
      />
      {/* ── Sem revisão — line ── */}
      <path
        d="M40,10 C70,10 80,70 105,95 C130,118 150,138 200,148 C250,156 310,160 380,163"
        fill="none"
        stroke="url(#grad-forget)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* ── Com SRS — area fill ── */}
      <path
        d="M40,10 C52,10 58,44 72,40 C86,36 92,18 112,16 C132,14 138,46 152,42 C166,38 172,18 194,16 C216,14 222,46 242,42 C262,38 268,18 292,16 C312,14 320,46 342,42 C356,38 364,20 380,18 L380,170 L40,170 Z"
        fill="url(#area-srs)"
      />
      {/* ── Com SRS — line (sawtooth = review sessions) ── */}
      <path
        d="M40,10 C52,10 58,44 72,40 C86,36 92,18 112,16 C132,14 138,46 152,42 C166,38 172,18 194,16 C216,14 222,46 242,42 C262,38 268,18 292,16 C312,14 320,46 342,42 C356,38 364,20 380,18"
        fill="none"
        stroke="url(#grad-srs)"
        strokeWidth="2.5"
        strokeLinecap="round"
        filter="url(#glow-srs)"
      />

      {/* Review dots on SRS line */}
      {[[112,16],[194,16],[292,16]].map(([cx,cy]) => (
        <circle key={cx} cx={cx} cy={cy} r="4"
          fill="#050505" stroke="#06b6d4" strokeWidth="1.8" />
      ))}
    </svg>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, desc, gradient, delay }: {
  icon: React.ReactNode; title: string; desc: string;
  gradient: string; delay: string;
}) {
  return (
    <div
      className={`relative rounded-2xl p-6 overflow-hidden fade-up`}
      style={{
        animationDelay:       delay,
        background:           'rgba(255,255,255,0.03)',
        backdropFilter:       'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border:               '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: gradient }} />
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
        {icon}
      </div>
      <h3 className="text-white font-bold text-base mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

// ─── Onboarding overlay ───────────────────────────────────────────────────────

type OnboardingState = 'idle' | 'saving' | 'done' | 'error';

function OnboardingOverlay({ onClose }: { onClose: () => void }) {
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [whatsapp,  setWhatsapp]  = useState('');
  const [state,     setState]     = useState<OnboardingState>('idle');
  const [errMsg,    setErrMsg]    = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || whatsapp.replace(/\D/g,'').length < 10) {
      setErrMsg('Preencha todos os campos corretamente.');
      return;
    }
    setState('saving');
    setErrMsg('');

    const { error } = await supabase.from('leads').insert({
      name:      name.trim(),
      email:     email.trim().toLowerCase(),
      whatsapp:  whatsapp.replace(/\D/g,''),
    });

    if (error) {
      setState('error');
      setErrMsg('Erro ao salvar. Tente novamente.');
      return;
    }
    setState('done');
  }

  const inputClass = [
    'w-full rounded-xl px-4 py-3 text-sm text-white outline-none',
    'transition-all duration-200 placeholder-slate-600',
  ].join(' ');
  const inputStyle = {
    background:   'rgba(255,255,255,0.05)',
    border:       '1px solid rgba(255,255,255,0.10)',
  };
  const inputFocusStyle = { '--tw-ring-color': '#7C3AED' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-in"
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden card-in"
        style={{
          background:           'rgba(8,6,18,0.95)',
          backdropFilter:       'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border:               '1px solid rgba(124,58,237,0.40)',
          boxShadow:            '0 0 0 1px rgba(124,58,237,0.20), 0 0 60px rgba(124,58,237,0.18), 0 24px 48px rgba(0,0,0,0.60)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cyberpunk top border */}
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, #7C3AED, #06b6d4, #ec4899)' }} />

        {/* Ambient glows */}
        <div className="absolute top-0 left-0 w-48 h-48 pointer-events-none rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', transform: 'translate(-30%,-30%)' }} />
        <div className="absolute bottom-0 right-0 w-40 h-40 pointer-events-none rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.10) 0%, transparent 70%)', transform: 'translate(30%,30%)' }} />

        <div className="relative p-7">

          {state === 'done' ? (
            /* ── Success screen ── */
            <div className="flex flex-col items-center text-center gap-5 py-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', boxShadow: '0 0 24px rgba(16,185,129,0.25)' }}
              >
                ✅
              </div>
              <div>
                <p className="text-white font-black text-xl mb-2">Diagnóstico enviado!</p>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Crie sua conta gratuita para acessar os 10 cards de diagnóstico e descobrir suas lacunas de memória.
                </p>
              </div>
              <Link
                href="/login"
                className="w-full py-4 rounded-xl font-black text-white text-base text-center transition-all duration-200 hover:-translate-y-0.5 cta-pulse"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #06b6d4 60%, #ec4899 100%)',
                  letterSpacing: '-0.01em',
                }}
              >
                Criar conta e Iniciar Diagnóstico →
              </Link>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} noValidate>
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex gap-1.5">
                  {[1,2,3].map(n => (
                    <div key={n} className="h-1 rounded-full"
                      style={{
                        width: n === 1 ? '24px' : '8px',
                        background: n === 1
                          ? 'linear-gradient(90deg,#7C3AED,#06b6d4)'
                          : 'rgba(255,255,255,0.12)',
                      }} />
                  ))}
                </div>
                <span className="text-slate-600 text-xs ml-1">Passo 1 de 3</span>
              </div>

              {/* Icon + title */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
                  style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.35)', boxShadow: '0 0 20px rgba(124,58,237,0.20)' }}>
                  🎯
                </div>
                <div>
                  <p className="text-white font-black text-base leading-tight">
                    Identificação de Combate
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Para onde enviamos seu Diagnóstico?
                  </p>
                </div>
              </div>

              {/* Fields */}
              <div className="flex flex-col gap-3 mb-5">
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">Nome completo</label>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                    autoComplete="name"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">E-mail</label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                    autoComplete="email"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1.5 block">WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={whatsapp}
                    onChange={e => setWhatsapp(maskPhone(e.target.value))}
                    className={inputClass}
                    style={inputStyle}
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              {errMsg && (
                <p className="text-red-400 text-xs mb-4 text-center">{errMsg}</p>
              )}

              <button
                type="submit"
                disabled={state === 'saving'}
                className="w-full py-4 rounded-xl font-black text-white text-base transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #06b6d4 60%, #ec4899 100%)',
                  boxShadow:  '0 0 28px rgba(124,58,237,0.45), 0 4px 20px rgba(0,0,0,0.40)',
                  letterSpacing: '-0.01em',
                }}
              >
                {state === 'saving' ? 'Salvando...' : 'Iniciar meu Diagnóstico →'}
              </button>

              <p className="text-center text-slate-700 text-xs mt-4">
                🔒 Seus dados são privados e nunca serão compartilhados.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main landing page ────────────────────────────────────────────────────────

export default function LandingPage() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  return (
    <div style={{ background: '#050505' }} className="relative overflow-x-hidden">

      {/* ── Ambient orbs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="orb-a absolute rounded-full"
          style={{ width: 600, height: 600, top: '-15%', left: '-10%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
        <div className="orb-b absolute rounded-full"
          style={{ width: 500, height: 500, top: '20%', right: '-15%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.09) 0%, transparent 70%)' }} />
        <div className="orb-a absolute rounded-full"
          style={{ width: 400, height: 400, bottom: '5%', left: '30%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 70%)',
            animationDelay: '-6s' }} />
      </div>

      {/* ── Grid overlay ── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      <div className="relative" style={{ zIndex: 1 }}>

        {/* ─────────────────────────────────────── NAVBAR ── */}
        <nav className="flex items-center justify-between px-5 sm:px-10 py-5 max-w-6xl mx-auto">
          <span className="font-black text-white text-lg tracking-tight">
            Flash<span style={{
              background: 'linear-gradient(90deg,#7C3AED,#06b6d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Aprova</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/login"
              className="text-sm text-slate-400 hover:text-white transition-colors font-medium">
              Entrar
            </Link>
            <Link href="/login"
              className="text-sm px-4 py-2 rounded-xl font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'rgba(124,58,237,0.20)',
                border: '1px solid rgba(124,58,237,0.40)',
              }}>
              Começar grátis
            </Link>
          </div>
        </nav>

        {/* ─────────────────────────────────────── HERO ── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-10 pt-12 pb-24 text-center">

          {/* Badge */}
          <div className="fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-bold tracking-widest uppercase"
            style={{
              background: 'rgba(124,58,237,0.12)',
              border:     '1px solid rgba(124,58,237,0.35)',
              color:      '#c4b5fd',
            }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00ff80' }} />
            Sistema Anti-Branco · Powered by Neurociência
          </div>

          {/* Headline */}
          <h1 className="fade-up-d1 text-4xl sm:text-5xl md:text-6xl font-black leading-tight text-white mb-6">
            Lembre-se de{' '}
            <span style={{
              background: 'linear-gradient(90deg, #7C3AED, #06b6d4, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              97% do que estudou
            </span>
            {' '}e seja Aprovado no ENEM.
          </h1>

          {/* Sub-headline */}
          <p className="fade-up-d2 text-slate-400 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            O <span className="text-white font-semibold">"branco" na hora da prova</span> é o sintoma de um método quebrado.
            Use o sistema de repetição espaçada que <span className="text-white font-semibold">blinda sua memória</span> e garante seu nome na lista.
          </p>

          {/* CTA */}
          <div className="fade-up-d3">
            <button
              onClick={() => setShowOnboarding(true)}
              className="cta-pulse inline-flex items-center gap-3 px-8 py-5 rounded-2xl font-black text-white text-lg transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.99]"
              style={{
                background:    'linear-gradient(135deg, #7C3AED 0%, #06b6d4 55%, #ec4899 100%)',
                letterSpacing: '-0.01em',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              Iniciar Escaneamento de Memória Grátis
            </button>
            <p className="text-slate-700 text-xs mt-4">
              Sem cartão de crédito · Diagnóstico em 3 minutos
            </p>
          </div>

          {/* Social proof numbers */}
          <div className="fade-up-d4 flex flex-wrap justify-center gap-8 mt-14">
            {[
              { n: '97%',     label: 'de retenção média' },
              { n: '10.000+', label: 'questões no banco' },
              { n: '48h',     label: 'para sentir a diferença' },
            ].map(({ n, label }) => (
              <div key={n} className="text-center">
                <p className="text-3xl font-black text-white"
                  style={{
                    background: 'linear-gradient(90deg, #a78bfa, #67e8f9)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                  {n}
                </p>
                <p className="text-slate-600 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─────────────────────────── EBBINGHAUS CURVE ── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-10 pb-24">
          <div
            className="relative rounded-3xl p-7 sm:p-10 overflow-hidden"
            style={{
              background:           'rgba(255,255,255,0.03)',
              backdropFilter:       'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border:               '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.50), transparent)' }} />

            <div className="max-w-xl mb-6">
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#f97316' }}>
                A Ciência por Trás do Método
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3">
                A Curva do Esquecimento de Ebbinghaus
              </h2>
              <p className="text-slate-400 text-base leading-relaxed">
                A ciência é clara:{' '}
                <span className="text-white font-semibold">sem a revisão certa, você esquece 70% do que estudou em 48h.</span>
                {' '}Nós hackeamos esse processo para você reter quase tudo.
              </p>
            </div>

            <ForgettingCurve />

            {/* Legend */}
            <div className="flex flex-wrap gap-5 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 rounded-full" style={{ background: '#f97316' }} />
                <span className="text-slate-500 text-xs">Sem revisão</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #7C3AED, #06b6d4)' }} />
                <span className="text-slate-500 text-xs">Com SRS (FlashAprova)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: '#050505', border: '1.5px solid #06b6d4' }} />
                <span className="text-slate-500 text-xs">Revisão programada</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────── FEATURES ── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-10 pb-24">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#a78bfa' }}>
              Como funciona
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              3 Pilares da sua Aprovação
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <FeatureCard
              delay="0s"
              gradient="linear-gradient(90deg, transparent, rgba(124,58,237,0.60), transparent)"
              icon={<span className="text-xl">🧠</span>}
              title="Repetição Espaçada"
              desc="Algoritmo SRS que agenda cada card no momento exato em que você está prestes a esquecer. Zero desperdício de tempo."
            />
            <FeatureCard
              delay="0.12s"
              gradient="linear-gradient(90deg, transparent, rgba(6,182,212,0.60), transparent)"
              icon={<span className="text-xl">🤖</span>}
              title="Tutor IA Especialista"
              desc="Dúvidas respondidas em segundos por IAs treinadas nas bancas do ENEM. Como ter um professor particular 24h."
            />
            <FeatureCard
              delay="0.24s"
              gradient="linear-gradient(90deg, transparent, rgba(236,72,153,0.60), transparent)"
              icon={<span className="text-xl">📊</span>}
              title="Mapa de Lacunas"
              desc="Dashboard que identifica exatamente quais tópicos você domina e quais te colocarão em risco na prova."
            />
          </div>
        </section>

        {/* ─────────────────────────────── FINAL CTA ── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-10 pb-24">
          <div
            className="relative rounded-3xl p-10 sm:p-14 overflow-hidden text-center"
            style={{
              background: 'rgba(8,6,18,0.90)',
              border:     '1px solid rgba(124,58,237,0.35)',
              boxShadow:  '0 0 0 1px rgba(124,58,237,0.15), 0 0 80px rgba(124,58,237,0.12)',
            }}
          >
            {/* Cyberpunk border */}
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, #7C3AED, #06b6d4, #ec4899)' }} />
            <div className="absolute top-0 left-0 w-64 h-64 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', transform: 'translate(-30%,-30%)' }} />
            <div className="absolute bottom-0 right-0 w-56 h-56 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)', transform: 'translate(30%,30%)' }} />

            <div className="relative">
              <p className="text-slate-500 text-sm mb-2">Não deixe para depois</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
                Seu concorrente já está<br />
                <span style={{
                  background: 'linear-gradient(90deg,#7C3AED,#06b6d4,#ec4899)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  blindando a memória dele.
                </span>
              </h2>
              <p className="text-slate-400 text-base mb-8 max-w-lg mx-auto">
                Cada dia sem o método certo é memória perdida que não volta. Comece agora e entre para a lista de aprovados.
              </p>
              <button
                onClick={() => setShowOnboarding(true)}
                className="cta-pulse inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-white text-base transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02]"
                style={{
                  background:    'linear-gradient(135deg, #7C3AED 0%, #06b6d4 55%, #ec4899 100%)',
                  letterSpacing: '-0.01em',
                }}
              >
                Iniciar Escaneamento de Memória Grátis →
              </button>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────── FOOTER ── */}
        <footer className="border-t border-white/5 py-8 px-5 sm:px-10 text-center">
          <p className="text-slate-700 text-xs">
            © 2026 FlashAprova · Todos os direitos reservados ·{' '}
            <Link href="/login" className="hover:text-slate-400 transition-colors">Entrar</Link>
          </p>
        </footer>

      </div>

      {/* ── Onboarding overlay ── */}
      {showOnboarding && (
        <OnboardingOverlay onClose={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}
