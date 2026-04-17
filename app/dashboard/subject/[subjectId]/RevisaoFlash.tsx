'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const VIOLET = '#8B5CF6';
const NEON   = '#00FF73';

// ─── Tutor messages per intensity ────────────────────────────────────────────
const TUTOR_MESSAGES: Record<number, string> = {
  25:  'Treino rápido pra manter o hábito! ⚡',
  50:  'O equilíbrio perfeito. Vamos nessa! 🎯',
  75:  'Gás total! Prepare o café que o ritmo é puxado. 🔥',
  100: 'Modo Faca na Caveira! 💀 Maratona modo ON.',
};

const SIZES = [25, 50, 75, 100] as const;

type Props = {
  subjectId: string;
  color:     string;
};

export default function RevisaoFlash({ subjectId, color }: Props) {
  const router    = useRouter();
  const { theme } = useTheme();
  const isLight   = theme === 'light';

  const [size, setSize]   = useState<number>(50);
  const [hovered, setHovered] = useState(false);

  function handleStart() {
    router.push(`/study/revisao-flash?subjectId=${subjectId}&size=${size}`);
  }

  return (
    <div
      className="relative rounded-2xl px-6 py-5 mb-8 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${VIOLET}12 0%, rgba(0,255,115,0.06) 100%)`,
        border:     `1px solid ${VIOLET}45`,
        boxShadow:  `0 0 32px ${VIOLET}14`,
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}80, ${NEON}50, transparent)` }}
      />

      {/* ── Header row ── */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: `${VIOLET}20`, border: `1px solid ${VIOLET}50` }}
        >
          🤖
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="font-black text-lg leading-tight tracking-tight"
            style={{ color: VIOLET }}
          >
            RevisãoFlash
          </p>
          <p className="text-slate-400 text-sm mt-0.5 leading-snug">
            Sua dose diária de revisão sustentável. Mix inteligente de cards urgentes e novos na medida certa.
          </p>
        </div>
      </div>

      {/* ── Intensity selector + tutor bubble ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5">

        {/* Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 mr-1">Intensidade:</span>
          {SIZES.map(s => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
              style={
                size === s
                  ? {
                      background: `${VIOLET}30`,
                      border:     `1px solid ${VIOLET}80`,
                      color:      '#fff',
                      boxShadow:  `0 0 10px ${VIOLET}40`,
                    }
                  : {
                      background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                      border:     isLight ? '1px solid rgba(0,0,0,0.10)' : '1px solid rgba(255,255,255,0.10)',
                      color:      isLight ? '#475569' : 'rgba(255,255,255,0.40)',
                    }
              }
            >
              {s} cards
            </button>
          ))}
        </div>

        {/* Tutor speech bubble */}
        <div
          className="relative px-3.5 py-2 rounded-xl text-xs font-semibold text-white flex-1 min-w-0"
          style={{
            background:     isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
            border:         isLight ? `1px solid ${NEON}40` : `1px solid ${NEON}25`,
            color:          NEON,
            backdropFilter: isLight ? 'none' : 'blur(10px)',
          }}
        >
          {/* Arrow */}
          <div
            className="absolute top-3 -left-1.5 w-0 h-0 hidden sm:block"
            style={{
              borderTop:    '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderRight:  `6px solid ${NEON}25`,
            }}
          />
          {TUTOR_MESSAGES[size]}
        </div>
      </div>

      {/* ── Start button ── */}
      <button
        onClick={handleStart}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="w-full sm:w-auto px-8 py-3 rounded-xl font-black text-sm transition-all duration-200"
        style={{
          background: hovered
            ? `linear-gradient(135deg, ${VIOLET}, #6d28d9)`
            : `linear-gradient(135deg, ${VIOLET}cc, #6d28d9aa)`,
          color:     '#fff',
          boxShadow: hovered ? `0 0 24px ${VIOLET}60, 0 4px 16px rgba(0,0,0,0.4)` : `0 0 12px ${VIOLET}30`,
          transform: hovered ? 'translateY(-1px)' : 'none',
        }}
      >
        Iniciar {size} cards →
      </button>
    </div>
  );
}
