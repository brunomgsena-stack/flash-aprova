'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Design tokens ───────────────────────────────────────────────────────────
const VIOLET = '#7C3AED';
const CYAN   = '#06b6d4';
const NEON   = '#00FF73';
const RED    = '#ef4444';
const ORANGE = '#f97316';
const GREEN  = '#22c55e';
const MONO   = "'JetBrains Mono', 'Courier New', ui-monospace, monospace";

// ─── Phone mask ───────────────────────────────────────────────────────────────
function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <=  2) return `(${d}`;
  if (d.length <=  7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

// ─── Blurred background panels ───────────────────────────────────────────────
function DataBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      {/* Grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(124,58,237,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.06) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Blurred panels layer */}
      <div style={{ position: 'absolute', inset: 0, filter: 'blur(6px) brightness(0.30)', transform: 'scale(1.04)' }}>

        {/* Top-left: Radar */}
        <div style={{ position:'absolute', top:'5%', left:'3%', width:240, height:220,
          background:'rgba(5,2,15,0.95)', borderRadius:16, border:`1px solid ${VIOLET}40`, padding:16 }}>
          <div style={{ color:`${VIOLET}90`, fontSize:9, fontFamily:'monospace', letterSpacing:'0.18em', marginBottom:8 }}>
            RADAR ENEM — MAPEAMENTO ATIVO
          </div>
          <svg width="100%" viewBox="0 0 100 90">
            <polygon points="50,6 92,30 92,64 50,84 8,64 8,30" fill="none" stroke={`${VIOLET}50`} strokeWidth="1"/>
            <polygon points="50,22 76,36 76,58 50,68 24,58 24,36" fill="none" stroke={`${VIOLET}30`} strokeWidth="1"/>
            <polygon points="50,14 85,34 80,60 50,75 20,60 15,34"
              fill={`${CYAN}18`} stroke={CYAN} strokeWidth="1.5"
              style={{ filter:`drop-shadow(0 0 6px ${CYAN})` }}/>
            <polygon points="50,30 68,40 66,55 50,63 34,55 32,40"
              fill={`${VIOLET}25`} stroke={VIOLET} strokeWidth="1"
              style={{ filter:`drop-shadow(0 0 4px ${VIOLET})` }}/>
          </svg>
        </div>

        {/* Top-right: Line chart */}
        <div style={{ position:'absolute', top:'5%', right:'3%', width:280, height:160,
          background:'rgba(5,2,15,0.95)', borderRadius:16, border:`1px solid ${GREEN}30`, padding:16 }}>
          <div style={{ color:`${GREEN}80`, fontSize:9, fontFamily:'monospace', letterSpacing:'0.18em', marginBottom:8 }}>
            RETENÇÃO SINÁPTICA — 12 SEMANAS
          </div>
          <svg width="100%" viewBox="0 0 260 100">
            <defs>
              <linearGradient id="lg-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={NEON} stopOpacity="0.2"/>
                <stop offset="100%" stopColor={NEON} stopOpacity="0"/>
              </linearGradient>
            </defs>
            {[25,50,75].map(y => <line key={y} x1="10" y1={y} x2="250" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>)}
            <path d="M10,80 C40,74 60,65 90,52 C115,40 130,55 155,40 C178,26 200,32 230,18 L230,95 L10,95 Z" fill="url(#lg-fill)"/>
            <path d="M10,80 C40,74 60,65 90,52 C115,40 130,55 155,40 C178,26 200,32 230,18"
              fill="none" stroke={NEON} strokeWidth="2" strokeLinecap="round"
              style={{ filter:`drop-shadow(0 0 5px ${NEON})` }}/>
          </svg>
        </div>

        {/* Bottom-left: Heatmap */}
        <div style={{ position:'absolute', bottom:'5%', left:'3%', width:260, height:180,
          background:'rgba(5,2,15,0.95)', borderRadius:16, border:`1px solid ${CYAN}30`, padding:16 }}>
          <div style={{ color:`${CYAN}80`, fontSize:9, fontFamily:'monospace', letterSpacing:'0.18em', marginBottom:10 }}>
            HEATMAP DE LACUNAS — DISCIPLINAS
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gap:3 }}>
            {[0.9,0.2,0.7,0.1,0.8,0.4,0.6,0.3,1,0.5,0.3,0.8,0.1,0.9,0.6,0.4,0.2,0.7,0.3,1,
              0.5,0.8,0.1,0.6,0.9,0.4,0.2,0.7,0.3,0.5,0.8,0.1,0.9,0.6,0.4,0.7,0.2,0.5,0.8,
              0.3,0.6,0.9,0.1,0.7,0.4,0.2,0.8,0.5,0.3,0.6,0.9,0.1,0.7,0.4,0.2,0.8,0.5,0.3,0.6,0.9].map((v, i) => (
              <div key={i} style={{
                height:10, borderRadius:2,
                background: v > 0.65 ? CYAN : v > 0.35 ? VIOLET : 'rgba(255,255,255,0.05)',
                opacity: 0.5 + v * 0.5,
                boxShadow: v > 0.8 ? `0 0 4px ${CYAN}80` : 'none',
              }}/>
            ))}
          </div>
        </div>

        {/* Bottom-right: Bar chart */}
        <div style={{ position:'absolute', bottom:'5%', right:'3%', width:200, height:180,
          background:'rgba(5,2,15,0.95)', borderRadius:16, border:`1px solid ${ORANGE}30`, padding:16 }}>
          <div style={{ color:`${ORANGE}80`, fontSize:9, fontFamily:'monospace', letterSpacing:'0.18em', marginBottom:12 }}>
            ÍNDICE DE RISCO — MATÉRIAS
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:100 }}>
            {([0.82,0.45,0.63,0.28,0.91,0.55] as const).map((h, i) => {
              const c = [RED,ORANGE,VIOLET,GREEN,RED,CYAN][i];
              return <div key={i} style={{ flex:1, height:`${h*100}%`, background:c, borderRadius:'3px 3px 0 0', opacity:0.75, boxShadow:`0 0 8px ${c}60` }}/>;
            })}
          </div>
        </div>

        {/* Center: Terminal log */}
        <div style={{ position:'absolute', top:'35%', left:'50%', transform:'translateX(-50%)',
          width:320, background:'rgba(0,0,0,0.92)', borderRadius:12,
          border:`1px solid ${VIOLET}50`, padding:'12px 16px', fontFamily:'monospace', fontSize:10 }}>
          {[
            { c:GREEN,  t:'[OK]   Scan de lacunas concluído' },
            { c:RED,    t:'[FAIL] Retenção abaixo do limiar crítico' },
            { c:ORANGE, t:'[WARN] 3 falhas invisíveis detectadas' },
            { c:CYAN,   t:'[DATA] Gerando relatório tático...' },
            { c:VIOLET, t:'[LOCK] Aguardando autenticação do aluno' },
          ].map(({ c, t }, i) => (
            <div key={i} style={{ color:c, marginBottom:4, opacity:0.8 }}>{t}</div>
          ))}
        </div>
      </div>

      {/* Ambient orbs */}
      <div className="absolute rounded-full" style={{ width:600, height:600, top:'-20%', left:'-15%',
        background:`radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 65%)` }}/>
      <div className="absolute rounded-full" style={{ width:500, height:500, bottom:'-15%', right:'-10%',
        background:`radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 65%)` }}/>
    </div>
  );
}

// ─── Sending overlay ──────────────────────────────────────────────────────────
function SendingOverlay() {
  const [msgIdx, setMsgIdx] = useState(0);
  const msgs = [
    'Verificando identidade...',
    'Criptografando pacote de dados...',
    'Enviando ao núcleo de análise...',
    'Sincronizando protocolo AetherX...',
    'Acesso liberado.',
  ];

  useEffect(() => {
    if (msgIdx >= msgs.length - 1) return;
    const t = setTimeout(() => setMsgIdx(i => i + 1), 520);
    return () => clearTimeout(t);
  }, [msgIdx, msgs.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8"
      style={{ background: 'rgba(0,0,0,0.97)' }}
    >
      {/* Icon + spinner */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background:`rgba(124,58,237,0.18)`,
            border:`1px solid rgba(124,58,237,0.50)`,
            boxShadow:`0 0 60px rgba(124,58,237,0.50)`,
          }}>
          {/* Stylized DB icon */}
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <ellipse cx="22" cy="11" rx="14" ry="5" stroke={VIOLET} strokeWidth="2"/>
            <path d="M8 11 C8 11 8 22 8 22 C8 25.31 14.27 28 22 28 C29.73 28 36 25.31 36 22 L36 11" stroke={VIOLET} strokeWidth="2"/>
            <path d="M8 22 C8 22 8 33 8 33 C8 36.31 14.27 39 22 39 C29.73 39 36 36.31 36 33 L36 22" stroke={CYAN} strokeWidth="2"/>
            <ellipse cx="22" cy="33" rx="14" ry="5" stroke={CYAN} strokeWidth="2"/>
            <circle cx="22" cy="22" r="3" fill={NEON} style={{ filter:`drop-shadow(0 0 6px ${NEON})` }}/>
          </svg>
        </div>
        {/* Spinning ring */}
        <div className="absolute inset-0 rounded-full" style={{
          border:'2px solid transparent',
          borderTopColor: VIOLET,
          borderRightColor: CYAN,
          animation:'lg-spin 0.9s linear infinite',
        }}/>
      </div>

      <div className="text-center">
        <p className="font-black text-xl mb-3 tracking-tight"
          style={{ color:'#fff', fontFamily: MONO }}>
          [ ENVIANDO DADOS AO NÚCLEO... ]
        </p>
        <p className="text-sm transition-all duration-300" style={{ fontFamily: MONO, color: CYAN }}>
          {'> '}{msgs[msgIdx]}
          <span style={{ animation:'lg-blink 1s step-end infinite' }}>_</span>
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-64">
        <div className="h-px rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full" style={{
            background:`linear-gradient(90deg, ${VIOLET}, ${CYAN})`,
            animation:'lg-progress 2.6s ease-out forwards',
            boxShadow:`0 0 8px ${CYAN}80`,
          }}/>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Pulsing container border ─────────────────────────────────────────────────
function PulsingBorder({ active }: { active: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-3xl pointer-events-none"
      animate={{
        boxShadow: active
          ? [`0 0 0 1px ${VIOLET}90, 0 0 40px ${VIOLET}50`, `0 0 0 1px ${VIOLET}ff, 0 0 70px ${VIOLET}80`, `0 0 0 1px ${VIOLET}90, 0 0 40px ${VIOLET}50`]
          : [`0 0 0 1px ${VIOLET}45, 0 0 20px ${VIOLET}22`, `0 0 0 1px ${VIOLET}65, 0 0 40px ${VIOLET}38`, `0 0 0 1px ${VIOLET}45, 0 0 20px ${VIOLET}22`],
      }}
      transition={{ duration: active ? 1.2 : 2.0, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// ─── Terminal input field ─────────────────────────────────────────────────────
interface TerminalFieldProps {
  label: string;
  prefix?: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  hasValue: boolean;
}

function TerminalField({ label, prefix, type = 'text', placeholder, value, onChange, autoComplete, hasValue }: TerminalFieldProps) {
  const [focused, setFocused] = useState(false);
  const active = focused || hasValue;

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label */}
      <label style={{
        fontSize: 10,
        fontFamily: MONO,
        letterSpacing: '0.18em',
        color: active ? `${CYAN}cc` : `${CYAN}60`,
        transition: 'color 0.25s',
      }}>
        {'> [ '}{label}{' ]'}
      </label>

      {/* Input wrapper */}
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none select-none"
            style={{ fontFamily: MONO, color: active ? `${VIOLET}cc` : `${VIOLET}50`, transition:'color 0.25s' }}>
            {prefix}
          </span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={autoComplete}
          required
          className="w-full rounded-xl py-4 text-sm text-white outline-none transition-all duration-300 placeholder-slate-700"
          style={{
            fontFamily:    MONO,
            background:    'rgba(0,0,0,0.55)',
            border:        `1px solid ${active ? `${VIOLET}80` : 'rgba(124,58,237,0.28)'}`,
            boxShadow:     active ? `0 0 18px ${VIOLET}25, inset 0 0 10px ${VIOLET}06` : 'none',
            caretColor:    NEON,
            letterSpacing: '0.02em',
            paddingLeft:   prefix ? '2.5rem' : '1rem',
            paddingRight:  '1rem',
          }}
        />
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface LeadGateProps {
  health:      number;
  subjectName: string;
  onSubmit:    (name: string, email: string, whatsapp: string) => Promise<void>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LeadGate({ health, subjectName, onSubmit }: LeadGateProps) {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [sending,  setSending]  = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  // "has any input" drives the border pulse intensity
  const hasInput = name.length > 0 || email.length > 0 || phone.length > 0;

  function handlePhone(v: string) {
    setPhone(maskPhone(v));
    setErrors(e => ({ ...e, phone: '' }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim())                                   errs.name  = '[ERR] Campo obrigatório';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))     errs.email = '[ERR] E-mail inválido';
    if (phone.replace(/\D/g,'').length < 10)            errs.phone = '[ERR] Número inválido';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSending(true);
    setTimeout(async () => {
      await onSubmit(name.trim(), email.trim().toLowerCase(), phone.replace(/\D/g,''));
    }, 2800);
  }

  return (
    <>
      {/* ── Keyframes ── */}
      <style>{`
        @keyframes lg-spin     { to { transform: rotate(360deg); } }
        @keyframes lg-blink    { 0%,100% { opacity:1; } 50% { opacity:0; } }
        @keyframes lg-progress { from { width:0; } to { width:100%; } }
        @keyframes lg-scanline { 0% { top:-2%; } 100% { top:105%; } }
      `}</style>

      {/* ── Sending overlay ── */}
      <AnimatePresence>
        {sending && <SendingOverlay />}
      </AnimatePresence>

      {/* ── Full-screen wrapper ── */}
      <div
        className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden"
        style={{ background: '#08040f' }}
      >
        <DataBackground />

        {/* Scanline */}
        <div className="pointer-events-none absolute inset-x-0 h-px z-10" aria-hidden="true"
          style={{
            background: `linear-gradient(90deg, transparent, ${VIOLET}50, ${CYAN}35, transparent)`,
            animation: 'lg-scanline 7s linear infinite',
            opacity: 0.45,
          }}
        />

        {/* ── Glass card ── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative w-full max-w-md z-20"
        >
          <div
            className="relative rounded-3xl p-8 sm:p-10 overflow-hidden"
            style={{
              background:           'rgba(6,3,18,0.84)',
              backdropFilter:       'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border:               `1px solid ${VIOLET}50`,
            }}
          >
            <PulsingBorder active={hasInput} />

            {/* Top shimmer */}
            <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl"
              style={{ background:`linear-gradient(90deg, transparent, ${VIOLET}90, ${CYAN}60, transparent)` }}/>

            {/* ── Status badge ── */}
            <div className="flex items-center gap-2 mb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-widest"
                style={{
                  background: `${RED}15`, border:`1px solid ${RED}50`,
                  color: RED, fontFamily: MONO,
                }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background:RED, animation:'lg-blink 1s step-end infinite' }}/>
                ACESSO RESTRITO
              </div>
            </div>

            {/* ── Title ── */}
            <h1 className="text-white font-black text-2xl sm:text-3xl leading-tight mb-3 tracking-tight"
              style={{ fontFamily: MONO }}>
              <span style={{ color: VIOLET }}>[</span>
              {' '}VEREDITO PRONTO{' '}
              <span style={{ color: NEON, textShadow:`0 0 20px ${NEON}80, 0 0 40px ${NEON}40` }}>
                PARA EMISSÃO
              </span>
              {' '}<span style={{ color: VIOLET }}>]</span>
            </h1>

            {/* ── Subhead ── */}
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              Sincronize seus dados para desbloquear o{' '}
              <span className="font-black text-white">Raio-X de Memória</span>{' '}
              e o{' '}
              <span className="font-black" style={{ color: CYAN }}>
                Protocolo de Reparo de {subjectName}
              </span>
              .
            </p>

            {/* ── Memory health teaser ── */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6"
              style={{
                background: health < 50 ? `${RED}10` : `${ORANGE}10`,
                border: `1px solid ${health < 50 ? RED : ORANGE}35`,
              }}>
              <span style={{ fontSize:20 }}>{health < 50 ? '⚠️' : '📊'}</span>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: health < 50 ? RED : ORANGE, fontFamily: MONO }}>
                  Saúde da Memória: {health}%
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {health < 50
                    ? 'Nível crítico — intervenção imediata necessária'
                    : 'Lacunas identificadas — protocolo disponível'}
                </p>
              </div>
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

              {/* Nome */}
              <div>
                <TerminalField
                  label="IDENTIFICAÇÃO"
                  prefix="ID:"
                  placeholder="como devemos te chamar?"
                  value={name}
                  onChange={v => { setName(v); setErrors(e => ({ ...e, name:'' })); }}
                  autoComplete="name"
                  hasValue={name.length > 0}
                />
                {errors.name && (
                  <p className="text-xs mt-1" style={{ fontFamily:MONO, color:RED }}>{errors.name}</p>
                )}
              </div>

              {/* E-mail */}
              <div>
                <TerminalField
                  label="COMUNICAÇÃO_OFICIAL"
                  prefix="@"
                  type="email"
                  placeholder="seu melhor e-mail..."
                  value={email}
                  onChange={v => { setEmail(v); setErrors(e => ({ ...e, email:'' })); }}
                  autoComplete="email"
                  hasValue={email.length > 0}
                />
                {errors.email && (
                  <p className="text-xs mt-1" style={{ fontFamily:MONO, color:RED }}>{errors.email}</p>
                )}
              </div>

              {/* WhatsApp */}
              <div>
                <TerminalField
                  label="DISPARO_DO_RELATÓRIO"
                  prefix="📲"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={handlePhone}
                  autoComplete="tel"
                  hasValue={phone.length > 0}
                />
                {errors.phone && (
                  <p className="text-xs mt-1" style={{ fontFamily:MONO, color:RED }}>{errors.phone}</p>
                )}
              </div>

              {/* ── Submit button ── */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="mt-1 w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase"
                style={{
                  fontFamily:    MONO,
                  background:    `linear-gradient(135deg, ${VIOLET} 0%, #5b21b6 100%)`,
                  color:         '#fff',
                  letterSpacing: '0.10em',
                  border:        `1px solid ${VIOLET}70`,
                  boxShadow: hasInput
                    ? `0 0 50px ${VIOLET}80, 0 0 100px ${VIOLET}40, 0 4px 24px ${VIOLET}50, inset 0 1px 0 rgba(255,255,255,0.12)`
                    : `0 0 20px ${VIOLET}35, 0 2px 12px ${VIOLET}20`,
                  transition: 'box-shadow 0.35s ease',
                }}
              >
                [ DESBLOQUEAR MEU RAIO-X ]
              </motion.button>

              {/* ── Micro-copy ── */}
              <p className="text-center text-xs mt-1 leading-relaxed"
                style={{ fontFamily:MONO, color:'rgba(255,255,255,0.20)' }}>
                Seus dados estão protegidos sob o protocolo de<br/>
                segurança <span style={{ color:`${VIOLET}80` }}>AetherX</span>.
                Não enviamos spam, apenas o seu veredito.
              </p>
            </form>

            {/* Bottom shimmer */}
            <div className="absolute inset-x-0 bottom-0 h-px rounded-b-3xl"
              style={{ background:`linear-gradient(90deg, transparent, ${VIOLET}40, transparent)` }}/>
          </div>
        </motion.div>
      </div>
    </>
  );
}
