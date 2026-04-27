'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';

// ─── Design tokens ────────────────────────────────────────────────────────────
const RED    = '#ff2d55';
const PURPLE = '#7C3AED';
const GREEN  = '#22c55e';
const NEON   = '#00FF73';

// ─── Animation variants ───────────────────────────────────────────────────────
type AnyEase = [number, number, number, number];
const SWIFT: AnyEase = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 20 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: SWIFT as any } },
};

const listWrap: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.10, delayChildren: 0.15 } },
};

const rowItem: Variants = {
  hidden:  { opacity: 0, x: -10 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: SWIFT as any } },
};

const rowItemRight: Variants = {
  hidden:  { opacity: 0, x: 10 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: SWIFT as any } },
};

const cardPop: Variants = {
  hidden:  { opacity: 0, y: 24, scale: 0.95 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.42, ease: SWIFT as any } },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function AnkiComparison() {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const isInView = useInView(wrapRef, { once: true, margin: '-60px' });

  const [leftHover,  setLeftHover]  = useState(false);
  const [rightHover, setRightHover] = useState(false);

  return (
    <div ref={wrapRef} className="relative space-y-10">

      {/* ── CSS keyframes ── */}
      <style>{`
        @keyframes glitch-h {
          0%,90%,100% { clip-path: inset(0 0 100% 0); opacity: 0; }
          91%          { clip-path: inset(12% 0 80% 0);  opacity: 0.55; transform: translate(-4px,0); }
          92%          { clip-path: inset(55% 0 28% 0);  opacity: 0.40; transform: translate( 3px,0); }
          93%          { clip-path: inset(72% 0 10% 0);  opacity: 0.55; transform: translate(-2px,0); }
          94%          { clip-path: inset(0 0 100% 0);   opacity: 0; }
        }
        @keyframes scanlines {
          from { background-position: 0 0;    }
          to   { background-position: 0 48px; }
        }
        @keyframes pulse-glow {
          0%,100% { opacity: 0.55; }
          50%     { opacity: 1;    }
        }
        @keyframes status-blink {
          0%,49%  { opacity: 1;    }
          50%,100%{ opacity: 0.35; }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%);  }
        }
      `}</style>

      {/* ════════════ SECTION HEADER ════════════ */}
      <motion.div
        className="flex flex-col items-center text-center gap-4"
        variants={fadeUp}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"
          style={{
            background: `${RED}10`,
            border: `1px solid ${RED}30`,
            color: `${RED}cc`,
          }}
        >
          <span style={{
            display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
            background: RED, boxShadow: `0 0 6px ${RED}`,
            animation: 'status-blink 1.2s step-end infinite',
          }} />
          Método Tradicional
        </div>

        {/* Headline */}
        <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight"
          style={{ color: 'rgba(255,255,255,0.92)' }}>
          A Fábrica de{' '}
          <span style={{ color: RED, textShadow: `0 0 32px ${RED}60` }}>Reprovados</span>
        </h2>

        {/* Subtitle */}
        <p className="text-sm md:text-base leading-relaxed max-w-xl"
          style={{ color: 'rgba(255,255,255,0.42)' }}>
          Não é falta de inteligência. É o uso de ferramentas obsoletas que{' '}
          <span style={{ color: 'rgba(255,255,255,0.70)' }}>
            ignoram como o seu cérebro funciona.
          </span>
        </p>
      </motion.div>

      {/* ════════════ VERSUS GRID ════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative">

        {/* VS badge — desktop */}
        <motion.div
          className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30
                     items-center justify-center"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.7, type: 'spring', stiffness: 320, damping: 20 }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center
                       text-[11px] font-black tracking-widest select-none"
            style={{
              background: '#080810',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.22)',
              boxShadow: '0 0 0 6px rgba(0,0,0,0.6), 0 4px 24px rgba(0,0,0,0.8)',
            }}
          >
            VS
          </div>
        </motion.div>

        {/* ──────────── COLUNA ESQUERDA — ESTUDO AMADOR ──────────── */}
        <motion.div
          className="relative rounded-2xl p-6 overflow-hidden cursor-default"
          style={{
            background: 'rgba(8,4,12,0.95)',
            border: leftHover
              ? `1px solid ${RED}55`
              : '1px solid rgba(255,255,255,0.06)',
            boxShadow: leftHover
              ? `0 0 60px ${RED}18, 0 0 120px ${RED}08`
              : 'none',
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
          }}
          initial={{ opacity: 0, x: -28 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transition={{ duration: 0.52, ease: SWIFT as any }}
          onMouseEnter={() => setLeftHover(true)}
          onMouseLeave={() => setLeftHover(false)}
        >
          {/* Scanlines overlay — always present */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)',
              backgroundSize: '100% 4px',
              animation: 'scanlines 12s linear infinite',
            }} />
          </div>

          {/* Glitch bars — on hover */}
          {leftHover && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(180deg, transparent 30%, ${RED}22 50%, transparent 70%)`,
                animation: 'glitch-h 2.2s infinite',
              }} />
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(180deg, transparent 60%, ${RED}18 75%, transparent 90%)`,
                animation: 'glitch-h 3.1s 0.4s infinite',
              }} />
            </div>
          )}

          {/* Red top line */}
          <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ zIndex: 3,
            background: `linear-gradient(90deg, transparent, ${RED}50, transparent)` }} />

          {/* Header */}
          <div className="relative flex flex-col gap-3 mb-6" style={{ zIndex: 4 }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                style={{ background: `${RED}14`, border: `1px solid ${RED}28` }}>
                💀
              </div>
              <div>
                <p className="font-black text-base tracking-tight" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Estudo Amador
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.22)' }}>
                  Resumos · Apostilas · Intuição
                </p>
              </div>
            </div>
            {/* Status seal */}
            <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-lg"
              style={{ background: `${RED}10`, border: `1px solid ${RED}28` }}>
              <span style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                background: RED, animation: 'status-blink 1.2s step-end infinite',
                boxShadow: `0 0 6px ${RED}`,
              }} />
              <span className="text-[10px] font-black tracking-widest" style={{ color: RED }}>
                STATUS: BAIXA RETENÇÃO
              </span>
            </div>
          </div>

          {/* Pain list */}
          <motion.div
            className="relative flex flex-col gap-3"
            style={{ zIndex: 4 }}
            variants={listWrap}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            {[
              { icon: '✏️', label: 'Resumos Manuais',     sub: 'Você escreve. Você esquece. Repete.' },
              { icon: '📖', label: 'Apostilas Estáticas',  sub: 'Conteúdo morto, sem adaptação ao seu nível.' },
              { icon: '🎲', label: 'Revisão por Intuição', sub: 'Sem dados. Sem plano. Sem resultado.' },
            ].map(({ icon, label, sub }) => (
              <motion.div
                key={label}
                variants={rowItem}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <span className="text-lg shrink-0 mt-0.5 grayscale opacity-40">{icon}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.18)' }}>{sub}</p>
                </div>
                <span className="ml-auto shrink-0 text-xs font-bold mt-0.5" style={{ color: `${RED}70` }}>✕</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom score */}
          <div className="relative mt-5 pt-4" style={{ zIndex: 4, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.22)' }}>
              Retenção real
            </p>
            <p className="text-3xl font-black tabular-nums" style={{ color: `${RED}80` }}>~35%</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.18)' }}>após 1 semana sem revisão</p>
          </div>
        </motion.div>

        {/* ──────────── COLUNA DIREITA — ENGENHARIA FLASHAPROVA ──────────── */}
        <motion.div
          className="relative rounded-2xl p-6 overflow-hidden cursor-default"
          style={{
            background: 'rgba(5,4,18,0.97)',
            border: rightHover
              ? `1px solid ${PURPLE}80`
              : `1px solid ${PURPLE}35`,
            boxShadow: rightHover
              ? `0 0 80px ${PURPLE}35, 0 0 160px ${GREEN}10, 0 0 0 1px ${PURPLE}22`
              : `0 0 40px ${PURPLE}15, 0 0 80px ${PURPLE}08`,
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
          }}
          initial={{ opacity: 0, x: 28, scale: 0.93 }}
          animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transition={{ duration: 0.52, ease: SWIFT as any, delay: 0.18 }}
          whileHover={{ scale: 1.018, transition: { type: 'spring', stiffness: 280, damping: 22 } }}
          onMouseEnter={() => setRightHover(true)}
          onMouseLeave={() => setRightHover(false)}
        >
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(ellipse at top right, ${PURPLE}20 0%, transparent 60%)`,
          }} />
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(ellipse at bottom left, ${GREEN}08 0%, transparent 60%)`,
          }} />

          {/* Purple + green top accent */}
          <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${PURPLE}80, ${GREEN}60, transparent)` }} />

          {/* Pulsing border ring on hover */}
          {rightHover && (
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ border: `1px solid ${PURPLE}45` }}
              animate={{ opacity: [0.3, 0.85, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {/* Header */}
          <div className="relative flex flex-col gap-3 mb-6" style={{ zIndex: 4 }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                style={{
                  background: `${PURPLE}22`,
                  border: `1px solid ${PURPLE}50`,
                  boxShadow: `0 0 14px ${PURPLE}30`,
                }}>
                ⚡
              </div>
              <div>
                <p className="font-black text-base tracking-tight text-white">
                  Engenharia FlashAprova
                </p>
                <p className="text-xs" style={{ color: `${PURPLE}cc` }}>
                  IA + SRS + Tutoria Adaptativa
                </p>
              </div>
            </div>
            {/* Status seal */}
            <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${PURPLE}18, ${GREEN}12)`,
                border: `1px solid ${GREEN}40`,
                boxShadow: `0 0 12px ${GREEN}15`,
              }}>
              <span style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                background: GREEN, animation: 'pulse-glow 1.4s ease-in-out infinite',
                boxShadow: `0 0 8px ${GREEN}`,
              }} />
              <span className="text-[10px] font-black tracking-widest" style={{ color: GREEN }}>
                STATUS: MEMÓRIA BLINDADA
              </span>
            </div>
          </div>

          {/* Win list */}
          <motion.div
            className="relative flex flex-col gap-3"
            style={{ zIndex: 4 }}
            variants={listWrap}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            {[
              { icon: '🧠', label: 'Algoritmo SRS IA',  sub: 'Zero configuração. Máxima retenção automática.' },
              { icon: '📡', label: 'Radar de Lacunas',  sub: 'Sabe exatamente onde você está falhando.' },
              { icon: '🤖', label: 'Tutoria 24h',       sub: '7 tutores IA por disciplina, disponíveis agora.' },
            ].map(({ icon, label, sub }) => (
              <motion.div
                key={label}
                variants={rowItemRight}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${PURPLE}12, ${GREEN}06)`,
                  border: `1px solid ${PURPLE}25`,
                  boxShadow: `0 0 20px ${PURPLE}08`,
                }}
              >
                <span className="text-lg shrink-0 mt-0.5">{icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{sub}</p>
                </div>
                <span className="ml-auto shrink-0 text-xs font-black mt-0.5"
                  style={{ color: GREEN, textShadow: `0 0 8px ${GREEN}` }}>✓</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom score */}
          <div className="relative mt-5 pt-4" style={{ zIndex: 4, borderTop: `1px solid ${PURPLE}20` }}>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: `${PURPLE}90` }}>
              Retenção média
            </p>
            <p className="text-3xl font-black tabular-nums"
              style={{ color: GREEN, textShadow: `0 0 24px ${GREEN}80` }}>
              97%
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>com revisões espaçadas por IA</p>
          </div>

          {/* Bottom accent */}
          <div className="absolute inset-x-0 bottom-0 h-px pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${GREEN}40, ${PURPLE}50, transparent)` }} />
        </motion.div>
      </div>

      {/* ════════════ ENEMY CARDS ════════════ */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        variants={listWrap}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        {[
          {
            icon: '✏️',
            kill: 'Resumos Manuais',
            quote: '"Resumos são terapia, não memória."',
          },
          {
            icon: '📖',
            kill: 'Apostilas Estáticas',
            quote: '"Apostilas são depósitos de esquecimento."',
          },
          {
            icon: '⚙️',
            kill: 'Configuração Manual',
            quote: '"Se você precisa configurar, você está perdendo tempo."',
          },
        ].map(({ icon, kill, quote }) => (
          <motion.div
            key={kill}
            variants={cardPop}
            className="group relative flex items-start gap-4 p-4 rounded-2xl cursor-default overflow-hidden"
            style={{
              background: 'rgba(255,45,85,0.04)',
              border: '1px solid rgba(255,45,85,0.12)',
              transition: 'background 0.3s ease, border-color 0.3s ease',
            }}
            whileHover={{
              backgroundColor: 'rgba(255,45,85,0.08)',
              borderColor: 'rgba(255,45,85,0.28)',
              transition: { duration: 0.2 },
            }}
          >
            {/* Crossed-out icon */}
            <div className="relative shrink-0">
              <span className="text-2xl grayscale opacity-35">{icon}</span>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-black"
                style={{ color: RED, textShadow: `0 0 6px ${RED}` }}>
                ✕
              </span>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-1"
                style={{ color: `${RED}80` }}>
                {kill} — eliminado
              </p>
              <p className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {quote}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ════════════ CTA FINAL ════════════ */}
      <motion.div
        className="flex flex-col items-center gap-6 pt-2"
        variants={fadeUp}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        <p className="text-center text-base md:text-lg leading-relaxed max-w-xl"
          style={{ color: 'rgba(255,255,255,0.45)' }}>
          A escolha é sua: continuar no{' '}
          <span className="font-bold" style={{ color: `${RED}cc` }}>balde furado</span>
          {' '}ou assumir o controle da sua{' '}
          <span className="font-bold" style={{ color: GREEN }}>aprovação</span>.
        </p>

        <Link
          href="/quizz"
          className="cta-pulse relative flex sm:inline-flex w-full sm:w-auto justify-center items-center gap-3 rounded-2xl font-black text-black overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.99] px-8 py-5 text-lg"
          style={{
            background:    `linear-gradient(135deg, ${NEON} 0%, #00cc5a 100%)`,
            letterSpacing: '-0.01em',
            boxShadow:     `0 0 40px ${NEON}50, 0 4px 24px ${NEON}30`,
          }}
        >
          <span
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
              animation: 'shimmer 2.4s infinite',
            }}
          />
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className="relative">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          <span className="relative">[ DETECTAR VAZAMENTO DE NOTA ]</span>
        </Link>
      </motion.div>

    </div>
  );
}
