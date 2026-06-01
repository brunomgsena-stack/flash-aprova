'use client';

// TODO (pré-vídeo): estes 3 mockups são placeholders visuais que representam
// telas reais do FlashAprova enquanto o vídeo de gravação de tela não está pronto.
// Quando o vídeo existir em public/videos/app-demo.{mp4,webm}, substituir este
// componente pela tag <video> com autoPlay muted loop playsInline.

import { useState, useEffect } from 'react';

const NEON   = '#00FF73';
const VIOLET = '#7C3AED';
const ORANGE = '#FF8A00';

// ─── Mockup 01: Flashcard com Quiz de múltipla escolha ───────────────────────
function QuizMockup() {
  const alts = ['9.8 m/s²', '5.0 m/s²', '10 m/s²', '3.2 m/s²'];
  const selected = 0;

  return (
    <div className="w-full h-full flex flex-col justify-center items-center px-4 py-6">
      <div
        className="w-full rounded-2xl p-4 relative overflow-hidden"
        style={{
          background: 'rgba(9,9,11,0.95)',
          border:     '1px solid rgba(255,255,255,0.10)',
          boxShadow:  `0 0 40px ${NEON}12`,
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${NEON}60, transparent)` }}
        />

        <div className="flex items-center justify-between mb-3">
          <span
            className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded"
            style={{
              background:  `${ORANGE}15`,
              border:      `1px solid ${ORANGE}40`,
              color:       ORANGE,
              fontFamily:  "'JetBrains Mono', monospace",
            }}
          >
            FÍSICA · CINEMÁTICA
          </span>
          <span className="text-[9px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            04 / 12
          </span>
        </div>

        <p className="text-white text-xs leading-snug mb-3 font-medium">
          Qual a aceleração da gravidade na superfície da Terra (g)?
        </p>

        <div className="flex flex-col gap-1.5 mb-3">
          {alts.map((alt, i) => {
            const isSel = i === selected;
            return (
              <div
                key={i}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs"
                style={{
                  background: isSel ? `${NEON}12` : 'rgba(255,255,255,0.03)',
                  border:     `1px solid ${isSel ? `${NEON}50` : 'rgba(255,255,255,0.07)'}`,
                  color:      isSel ? '#fff' : '#94a3b8',
                }}
              >
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                  style={{
                    background: isSel ? NEON : 'rgba(255,255,255,0.06)',
                    color:      isSel ? '#000' : '#64748b',
                  }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{alt}</span>
                {isSel && (
                  <svg className="ml-auto" width="12" height="12" viewBox="0 0 24 24" fill={NEON}>
                    <path d="M20 6L9 17l-5-5" stroke={NEON} strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>

        <div className="h-1 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width:     `${(4 / 12) * 100}%`,
              background: `linear-gradient(90deg, ${NEON}, #00cc5a)`,
              boxShadow:  `0 0 8px ${NEON}80`,
            }}
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: 'Difícil', color: ORANGE, sub: '< 1d' },
            { label: 'Bom',     color: NEON,   sub: '3d'   },
            { label: 'Fácil',   color: NEON,   sub: '7d'   },
          ].map((btn, i) => (
            <div
              key={i}
              className="flex flex-col items-center py-1.5 rounded-lg"
              style={{
                background: `${btn.color}10`,
                border:     `1px solid ${btn.color}30`,
              }}
            >
              <span className="text-[10px] font-bold" style={{ color: btn.color }}>{btn.label}</span>
              <span className="text-[8px]" style={{ color: `${btn.color}99`, fontFamily: "'JetBrains Mono', monospace" }}>
                {btn.sub}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[9px] mt-3 text-center" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace" }}>
        FLASHCARD ATIVO · RESPOSTA MARCADA
      </p>
    </div>
  );
}

// ─── Mockup 02: Radar de Lacunas (SVG hexagonal) ─────────────────────────────
function RadarLacunasMockup() {
  const cx = 100, cy = 100, R = 68;
  const angles = [-90, -30, 30, 90, 150, 210].map(d => (d * Math.PI) / 180);
  const pt = (r: number, i: number) =>
    `${cx + r * Math.cos(angles[i])},${cy + r * Math.sin(angles[i])}`;

  const dataR = [0.78, 0.32, 0.65, 0.85, 0.28, 0.72].map(p => p * R);
  const labels = ['Bio', 'Quím', 'Fís', 'Hist', 'Geo', 'Mat'];
  const isLacuna = [false, true, false, false, true, false];

  return (
    <div className="w-full h-full flex flex-col justify-center items-center px-4 py-6">
      <div
        className="w-full rounded-2xl p-4 relative overflow-hidden"
        style={{
          background: 'rgba(9,9,11,0.95)',
          border:     '1px solid rgba(255,255,255,0.10)',
          boxShadow:  `0 0 40px ${ORANGE}12`,
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${ORANGE}60, transparent)` }}
        />

        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: NEON, fontFamily: "'JetBrains Mono', monospace" }}>
            RADAR · MAPA DE FRAGILIDADES
          </p>
          <span
            className="px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase"
            style={{
              background: `${ORANGE}15`,
              border:     `1px solid ${ORANGE}50`,
              color:       ORANGE,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            3 LACUNAS
          </span>
        </div>

        <svg viewBox="0 0 200 200" className="w-full" style={{ maxHeight: 170 }}>
          {[0.25, 0.50, 0.75, 1.0].map((pct) => (
            <polygon key={pct}
              points={angles.map((_, i) => pt(pct * R, i)).join(' ')}
              fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          ))}
          {angles.map((_, i) => (
            <line key={i}
              x1={cx} y1={cy}
              x2={cx + R * Math.cos(angles[i])} y2={cy + R * Math.sin(angles[i])}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          ))}
          <polygon
            points={dataR.map((r, i) => pt(r, i)).join(' ')}
            fill={`${NEON}20`} stroke={NEON} strokeWidth="1.5"
          />
          {dataR.map((r, i) => (
            <g key={i}>
              <circle
                cx={cx + r * Math.cos(angles[i])}
                cy={cy + r * Math.sin(angles[i])}
                r={isLacuna[i] ? 5 : 3}
                fill={isLacuna[i] ? ORANGE : NEON}
              />
              {isLacuna[i] && (
                <circle
                  cx={cx + r * Math.cos(angles[i])}
                  cy={cy + r * Math.sin(angles[i])}
                  r="9"
                  fill="none"
                  stroke={ORANGE}
                  strokeWidth="1"
                  opacity="0.5"
                >
                  <animate attributeName="r" values="5;13;5" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          ))}
          {angles.map((_, i) => {
            const lx = cx + (R + 15) * Math.cos(angles[i]);
            const ly = cy + (R + 15) * Math.sin(angles[i]);
            return (
              <text key={i} x={lx} y={ly + 3} textAnchor="middle"
                fill={isLacuna[i] ? ORANGE : 'rgba(255,255,255,0.55)'}
                fontSize="9" fontWeight="700" fontFamily="Inter,system-ui">
                {labels[i]}
              </text>
            );
          })}
        </svg>

        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: `${ORANGE}08`, border: `1px solid ${ORANGE}20` }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill={ORANGE} className="flex-shrink-0">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <p className="text-[9px]" style={{ color: `${ORANGE}cc`, fontFamily: "'JetBrains Mono', monospace" }}>
            Química e Geo: reforço prioritário hoje
          </p>
        </div>
      </div>

      <p className="text-[9px] mt-3 text-center" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace" }}>
        RADAR DE LACUNAS · GERADO PELA IA
      </p>
    </div>
  );
}

// ─── Mockup 03: Dashboard com heatmap e próxima revisão ──────────────────────
function DashboardMockup() {
  const HEAT_ALPHA = [0.05, 0.18, 0.38, 0.62, 0.85, 1.0];
  const grid = [
    [0, 2, 4, 5, 3, 0, 1],
    [1, 3, 5, 2, 0, 4, 2],
    [0, 0, 3, 5, 4, 1, 0],
    [2, 4, 1, 0, 5, 3, 0],
    [0, 5, 2, 3, 1, 0, 4],
    [3, 1, 0, 4, 5, 2, 0],
  ];
  const days = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

  return (
    <div className="w-full h-full flex flex-col justify-center items-center px-4 py-6">
      <div
        className="w-full rounded-2xl p-4 relative overflow-hidden"
        style={{
          background: 'rgba(9,9,11,0.95)',
          border:     '1px solid rgba(255,255,255,0.10)',
          boxShadow:  `0 0 40px ${VIOLET}12`,
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${VIOLET}60, transparent)` }}
        />

        <p className="text-[9px] font-bold tracking-widest uppercase mb-3" style={{ color: VIOLET, fontFamily: "'JetBrains Mono', monospace" }}>
          DASHBOARD · PROGRESSO GERAL
        </p>

        {/* Stat principal */}
        <div className="flex items-end gap-2 mb-3">
          <div>
            <p className="text-[8px] text-slate-500 mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>DOMÍNIO GERAL</p>
            <p className="text-3xl font-black" style={{ color: NEON, lineHeight: 1 }}>68<span className="text-lg">%</span></p>
          </div>
          <div className="flex flex-col gap-1 mb-1 ml-auto">
            <div className="text-right">
              <p className="text-[8px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>CARDS REVISADOS</p>
              <p className="text-sm font-bold text-white">1.240</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>RETENÇÃO</p>
              <p className="text-sm font-bold" style={{ color: NEON }}>84%</p>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <p className="text-[8px] text-slate-600 mb-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ATIVIDADE · ÚLTIMAS 6 SEMANAS
        </p>
        <div className="flex gap-0.5 mb-1">
          {days.map((d, i) => (
            <div key={i} className="flex-1 text-center text-[7px] text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {d}
            </div>
          ))}
        </div>
        <div className="flex gap-0.5 mb-3">
          {Array.from({ length: 7 }, (_, di) => (
            <div key={di} className="flex-1 flex flex-col gap-0.5">
              {grid.map((week, wi) => (
                <div
                  key={wi}
                  style={{
                    height:       8,
                    borderRadius: 1,
                    background:   grid[wi][di] === 0
                      ? 'rgba(255,255,255,0.05)'
                      : `rgba(0,255,115,${HEAT_ALPHA[grid[wi][di]]})`,
                    boxShadow:    grid[wi][di] >= 4 ? `0 0 4px rgba(0,255,115,0.5)` : 'none',
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Próxima revisão */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: `${NEON}08`, border: `1px solid ${NEON}25` }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: NEON, boxShadow: `0 0 6px ${NEON}` }}
          />
          <div className="min-w-0">
            <p className="text-[8px] text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>PRÓXIMA REVISÃO</p>
            <p className="text-[10px] font-bold text-white truncate">Química · hoje às 19h</p>
          </div>
          <span
            className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: `${NEON}15`, color: NEON, fontFamily: "'JetBrains Mono', monospace" }}
          >
            HOJE
          </span>
        </div>
      </div>

      <p className="text-[9px] mt-3 text-center" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace" }}>
        DASHBOARD · HEATMAP + PRÓXIMA REVISÃO
      </p>
    </div>
  );
}

// ─── Slides do carrossel ──────────────────────────────────────────────────────
const SLIDES = [
  { id: 0, label: 'Flashcard',  color: ORANGE,  Component: QuizMockup          },
  { id: 1, label: 'Radar IA',   color: NEON,    Component: RadarLacunasMockup  },
  { id: 2, label: 'Dashboard',  color: VIOLET,  Component: DashboardMockup     },
] as const;

// ─── AppDemo ─────────────────────────────────────────────────────────────────
export default function AppDemo() {
  const [active, setActive] = useState(0);

  // Auto-rotação a cada 4 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setActive(prev => (prev + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const ActiveComponent = SLIDES[active].Component;

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-10 pb-12 sm:pb-24">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: NEON }}>
          Veja o app por dentro
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
          Sem mockup. Sem promessa.{' '}
          <span style={{ color: NEON }}>Tela real do FlashAprova.</span>
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          3 telas reais do app: flashcard ativo, radar de fragilidades e dashboard com próxima revisão.
        </p>
      </div>

      {/* Frame 9:16 com carrossel */}
      <div
        className="relative mx-auto rounded-2xl overflow-hidden"
        style={{
          maxWidth:  420,
          aspectRatio: '9 / 16',
          background:  'rgba(255,255,255,0.04)',
          border:      `1px solid rgba(255,255,255,0.08)`,
          boxShadow:   `0 0 60px ${NEON}15, 0 0 120px ${VIOLET}10`,
        }}
      >
        {/* Conteúdo do slide ativo */}
        <div className="absolute inset-0 flex flex-col">
          {/* Barra de tabs no topo */}
          <div
            className="flex items-center justify-center gap-2 px-4 pt-4 pb-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            {SLIDES.map((slide) => {
              const isActive = slide.id === active;
              return (
                <button
                  key={slide.id}
                  onClick={() => setActive(slide.id)}
                  className="px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase transition-all duration-200"
                  style={{
                    background:  isActive ? `${slide.color}18` : 'transparent',
                    border:      `1px solid ${isActive ? `${slide.color}50` : 'rgba(255,255,255,0.08)'}`,
                    color:       isActive ? slide.color : 'rgba(255,255,255,0.35)',
                    fontFamily:  "'JetBrains Mono', monospace",
                  }}
                >
                  {slide.label}
                </button>
              );
            })}
          </div>

          {/* Área do mockup */}
          <div className="flex-1 overflow-hidden">
            <ActiveComponent />
          </div>

          {/* Indicadores de slide no fundo */}
          <div className="flex items-center justify-center gap-1.5 pb-4">
            {SLIDES.map((slide) => {
              const isActive = slide.id === active;
              return (
                <button
                  key={slide.id}
                  onClick={() => setActive(slide.id)}
                  className="transition-all duration-300"
                  style={{
                    width:        isActive ? 20 : 6,
                    height:       6,
                    borderRadius: 3,
                    background:   isActive ? slide.color : 'rgba(255,255,255,0.15)',
                    boxShadow:    isActive ? `0 0 8px ${slide.color}80` : 'none',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Nota discreta */}
      <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.30)' }}>
        Telas reais. Vídeo em produção — disponível em breve.
      </p>
    </section>
  );
}
