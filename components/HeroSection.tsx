'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';

// ── Palette ───────────────────────────────────────────────────────────────────
const OBSIDIAN = '#0A0A0A';
const PURPLE   = '#7C3AED';
const PURPLE_L = '#a78bfa';
const EMERALD  = '#10B981';
const CYAN     = '#00e5ff';
const NEON_G   = '#00ff80';

// ── Flashcard data (from app study interface) ─────────────────────────────────
const FLASHCARDS = [
  {
    q: 'Qual é a função das mitocôndrias?',
    a: 'Produção de ATP via respiração celular aeróbica',
    subject: 'Biologia', color: '#34d399',
  },
  {
    q: 'Defina a 2ª Lei de Newton',
    a: 'F = m·a — força resultante é proporcional à aceleração',
    subject: 'Física', color: PURPLE_L,
  },
  {
    q: 'O que é o Iluminismo?',
    a: 'Movimento do séc. XVIII que valorizou a razão sobre a fé',
    subject: 'História', color: '#fb923c',
  },
  {
    q: 'Reação de fotossíntese (resumo)',
    a: '6CO₂ + 6H₂O + luz → C₆H₁₂O₆ + 6O₂',
    subject: 'Biologia', color: '#34d399',
  },
];

// ── Terminal log lines ────────────────────────────────────────────────────────
const TERMINAL_LINES = [
  '> Inicializando FlashAprova v3.1...       ✅',
  '> Carregando curva de Ebbinghaus...       ✅',
  '> Otimizando SRS: Ciclo de Krebs...       ✅',
  '> Analisando lacunas: Eq. Químico...      ⚡',
  '> Agendando revisão: Leis de Newton...    ✅',
  '> Blindando memória: Rev. Francesa...     ✅',
  '> Otimizando: Funções Trigonométricas...  ⚡',
  '> Neural sync — 97% retenção garantida    ✅',
];

// ── Sidebar nav items (used in Estudar scroll animation) ─────────────────────
const SIDEBAR_NAV = [
  { icon: '🏠', label: 'Home'   },
  { icon: '📚', label: 'Deck'   },
  { icon: '📊', label: 'Stats'  },
  { icon: '🤖', label: 'IA'     },
  { icon: '🎯', label: 'Metas'  },
  { icon: '🔔', label: 'Alertas'},
];

// ── Chat tutors — full roster mirroring AiTutorsSection ─────────────────────
const CHAT_TUTORS = [
  { name: 'NORMA',    subject: 'Redação',    color: '#7C3AED',
    avatar: '/images/avatars/ProfNorma.svg',
    msgs: ['Coesão fraca e proposta genérica custam 80 pts. Corrija os dois!', 'Diagnóstico preciso antes da correção. Padrão de erro é o foco.'] },
  { name: 'VEKTOR',   subject: 'Física',     color: '#f97316',
    avatar: '/images/avatars/ProfVektor.svg',
    msgs: ['MRU: v = s/t. MRUV: v = v₀ + at e s = v₀t + ½at². Plug and play!', 'Menos conversa, mais vetores. 2 equações = 80% da Física no ENEM.'] },
  { name: 'CHRONOS',  subject: 'História',   color: '#a78bfa',
    avatar: '/images/tutor-historia.avif',
    msgs: ['Era Vargas: 3 fases, 3 lógicas. O ENEM ama comparar as três. 🏛️', 'Causalidade histórica > decoreba de datas. Sempre!'] },
  { name: 'ATLAS',    subject: 'Geografia',  color: '#34d399',
    avatar: '/images/avatars/DrAtlasGeo.svg',
    msgs: ['Bioma + clima + solo: aprenda o trio, não o isolado. 🌿', 'Amazônia = densa; Cerrado = raízes profundas; Caatinga = xerófita.'] },
  { name: 'ÁTOMO',    subject: 'Química',    color: '#06b6d4',
    avatar: '/images/tutor-quimica.avif',
    msgs: ['Estequiometria: coeficiente = proporção = regra de 3. Simples! 🧪', 'Le Chatelier: equilíbrio dinâmico é certeiro no ENEM.'] },
  { name: 'PI',       subject: 'Matemática', color: '#00FF73',
    avatar: '/images/avatars/MestrePiMat.svg',
    msgs: ['Delta < 0 = sem raízes reais. Fluxo: calcula → classifica → decide.', 'Geometria plana: o ENEM adora área de figuras compostas. 📐'] },
  { name: 'BIO',      subject: 'Biologia',   color: '#22c55e',
    avatar: '/images/avatars/DrBio.svg',
    msgs: ['Fotossíntese: sol + CO₂ + H₂O → glicose. Analogia resolve! 🧬', 'Genética: meiose gera variabilidade; mitose = cópia exata.'] },
  { name: 'SINTAXE',  subject: 'Português',  color: '#f59e0b',
    avatar: '/images/avatars/ProfSintaxe.svg',
    msgs: ['Tese antes de alternativa. Sempre. Sem exceção.', 'O ENEM não testa leitura — testa argumentação. Interrogue o texto!'] },
  { name: 'PRÁXIS',   subject: 'Filosofia',  color: '#e879f9',
    avatar: '/images/avatars/ProfPraxis.svg',
    msgs: ['Filósofo = lente de análise. Aplique a certa ao contexto. 🔍', 'Kant: fenômeno ≠ coisa em si. Rousseau: natureza boa, soc. corrompe.'] },
  { name: 'NEXUS',    subject: 'Sociologia', color: '#60a5fa',
    avatar: '/images/avatars/ProfNexus.svg',
    msgs: ['Durkheim = coesão. Weber = dominação. Marx = conflito. Grave!', 'Fenômeno → teórico → conceito. Equação da Sociologia no ENEM.'] },
  { name: 'VANGUARDA',subject: 'Artes',      color: '#fb7185',
    avatar: '/images/avatars/MsVanguarda.svg',
    msgs: ['Obra = manifesto. Contexto histórico é sempre a chave. 🎨', 'Modernismo 22: ruptura + afirmação da identidade nacional.'] },
  { name: 'SONETO',   subject: 'Literatura', color: '#818cf8',
    avatar: '/images/avatars/SrtaSoneto.svg',
    msgs: ['Tom + vocabulário = movimento literário. O trecho entrega tudo. 📖', 'Romantismo: idealização. Realismo: crítica. Modernismo: ruptura.'] },
  { name: 'LINK',     subject: 'Inglês',     color: '#38bdf8',
    avatar: '/images/avatars/TeacherLink.svg',
    msgs: ['Pergunta → palavras-chave → localiza no texto. 80% resolvido!', 'No ENEM: você não traduz — você localiza informação. 🇺🇸'] },
  { name: 'SOL',      subject: 'Espanhol',   color: '#fbbf24',
    avatar: '/images/avatars/ProfaSol.svg',
    msgs: ['Falso amigo é armadilha nº 1. Contexto sempre vence aparência.', '"Embarazada" = grávida. "Borracha" = bêbada. Cuidado! 🇪🇸'] },
  { name: 'MUNDI',    subject: 'Atualidades',color: '#a3e635',
    avatar: '/images/avatars/DrMundi.svg',
    msgs: ['Fato atual = gancho. Conceito de base é o que a questão mede. 🌍', 'O ENEM não cobra notícia — cobra conexão com conceitos.'] },
];

// ── ENEM masters data ─────────────────────────────────────────────────────────
const MESTRES = [
  { initials: 'AL', name: 'Ana Lima',      subject: 'Biologia',   color: '#34d399', emoji: '🧬',
    tips: ['Mitocôndria cai todo ENEM!', 'Fotossíntese: grave a equação!', 'Foco em Genética hoje'] },
  { initials: 'CM', name: 'Carlos Matos',  subject: 'Física',     color: '#a78bfa', emoji: '⚛️',
    tips: ['Newton: entenda, não decore!', 'Termodinâmica: 3 leis', 'Ondulatória é ponto certo'] },
  { initials: 'JR', name: 'Juliana Reis',  subject: 'Matemática', color: '#fb923c', emoji: '📐',
    tips: ['Geometria vale 3 questões!', 'PA e PG: pratique hoje', 'Probabilidade é garantido'] },
  { initials: 'RS', name: 'Ricardo Silva', subject: 'Química',    color: '#00e5ff', emoji: '🧪',
    tips: ['Le Chatelier é certeiro!', 'Estequiometria: treino!', 'Orgânica: nomenclatura fácil'] },
  { initials: 'FC', name: 'Fernanda Costa',subject: 'História',   color: '#f59e0b', emoji: '🏛️',
    tips: ['Rev. Francesa conecta tudo!', 'Brasil República: foco!', 'Getúlio é essencial'] },
];

// ── Floating concepts ─────────────────────────────────────────────────────────
const CONCEPTS = [
  'Mitocôndria', 'Equilíbrio Químico', 'Orações Subordinadas',
  'Segunda Lei de Newton', 'Fotossíntese', 'Revolução Francesa',
  'Função Quadrática', 'Ciclo de Krebs', 'Imperialismo', 'Hidrólise',
];

// ── Deterministic particles ───────────────────────────────────────────────────
function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return (s >>> 0) / 0xffffffff;
  };
}
const rng = lcg(0xabcdef12);
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: rng() * 100,
  size: rng() * 2 + 1,
  duration: rng() * 12 + 8,
  delay: -(rng() * 15),
  opacity: rng() * 0.18 + 0.04,
}));

// ── Glass card ────────────────────────────────────────────────────────────────
function GlassCard({
  children, className = '', style = {},
}: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-2xl p-4 ${className}`}
      style={{
        background: 'rgba(12,8,24,0.95)',
        border: '1px solid rgba(124,58,237,0.28)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Float wrapper ─────────────────────────────────────────────────────────────
function FloatWrapper({ children, delay = 0, intensity = 10 }: {
  children: React.ReactNode; delay?: number; intensity?: number;
}) {
  return (
    <motion.div
      animate={{ y: [-intensity / 2, intensity / 2, -intensity / 2] }}
      transition={{ duration: 4 + delay * 0.5, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {children}
    </motion.div>
  );
}

// ── AI Terminal widget (replaces Métricas de Retenção) ────────────────────────
function TerminalWidget({ className = 'w-60', lines }: { className?: string; lines: string[] }) {

  return (
    <GlassCard className={className}>
      <div className="text-xs font-bold mb-2" style={{ color: PURPLE_L }}>
        ⚙️ AI Memory Engine
      </div>
      <div
        style={{
          background: 'rgba(0,0,0,0.6)',
          borderRadius: 8,
          padding: '8px 10px',
          fontFamily: "'JetBrains Mono','Courier New',ui-monospace,monospace",
          fontSize: '9px',
          border: '1px solid rgba(124,58,237,0.18)',
          minHeight: 96,
        }}
      >
        <div style={{ color: `${PURPLE_L}60`, marginBottom: 4 }}>// v3.1 · live</div>
        {lines.map((line, i) => (
          <motion.div
            key={`${i}-${line}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              color: line.includes('✅') ? '#34d399'
                : line.includes('⚡') ? PURPLE_L
                : 'rgba(255,255,255,0.5)',
              marginBottom: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {line}
          </motion.div>
        ))}
        <motion.span
          style={{ color: PURPLE_L }}
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >▮</motion.span>
      </div>
    </GlassCard>
  );
}

// ── Concepts widget ───────────────────────────────────────────────────────────
function ConceptsWidget({ visible }: { visible: number[] }) {
  return (
    <div className="flex flex-col gap-1.5" style={{ minHeight: 88 }}>
      {visible.map((ci) => (
        <motion.div
          key={ci}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.45 }}
          className="px-3 py-1.5 rounded-full text-xs font-semibold text-center"
          style={{
            background: `${PURPLE}1a`,
            border: `1px solid ${PURPLE}45`,
            color: PURPLE_L,
          }}
        >
          🔒 {CONCEPTS[ci]}
        </motion.div>
      ))}
    </div>
  );
}

// ── SVG connection lines ──────────────────────────────────────────────────────
const CONN_LINES = [
  { d: 'M 148,155 C 290,190 390,250 500,308', color: PURPLE_L,  delay: 0,    gradId: 'cg0', cx: 148, cy: 155 },
  { d: 'M 148,455 C 290,420 390,375 500,308', color: '#34d399', delay: 0.75, gradId: 'cg1', cx: 148, cy: 455 },
  { d: 'M 852,155 C 710,190 610,250 500,308', color: '#fb923c', delay: 1.5,  gradId: 'cg2', cx: 852, cy: 155 },
  { d: 'M 852,455 C 710,420 610,375 500,308', color: CYAN,      delay: 2.25, gradId: 'cg3', cx: 852, cy: 455 },
];
const PACKET_DUR   = 2.2; // seconds per packet to travel full path
const PACKETS      = [0, 1, 2]; // 3 staggered packets per line

function ConnectionLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      viewBox="0 0 1000 600"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {CONN_LINES.map((l) => (
          <linearGradient key={l.gradId} id={l.gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={l.color} stopOpacity="0.05" />
            <stop offset="45%"  stopColor={l.color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={l.color} stopOpacity="0" />
          </linearGradient>
        ))}
        {CONN_LINES.map((l) => (
          <filter key={`f-${l.gradId}`} id={`glow-${l.gradId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        ))}
        {/* Soft glow for endpoint dots */}
        <filter id="dot-glow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Center arrival burst filter */}
        <filter id="center-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {CONN_LINES.map((l, i) => (
        <g key={i}>
          {/* Hidden path reference for animateMotion */}
          <path id={`path-${i}`} d={l.d} fill="none" stroke="none" />

          {/* Static dim base cable */}
          <path
            d={l.d} fill="none"
            stroke={l.color} strokeWidth="0.7"
            strokeOpacity="0.18"
            strokeDasharray="3 9"
          />

          {/* 3 traveling pulse packets along the line */}
          {PACKETS.map((p) => {
            const pktDelay = l.delay + p * (PACKET_DUR / PACKETS.length);
            return (
              <motion.path
                key={`pkt-${p}`}
                d={l.d} fill="none"
                stroke={`url(#${l.gradId})`}
                strokeWidth="2.2"
                filter={`url(#glow-${l.gradId})`}
                initial={{ pathLength: 0, opacity: 0, pathOffset: 0 }}
                animate={{
                  pathLength: [0, 0.32, 0],
                  pathOffset: [0, 0.68, 1],
                  opacity:    [0, 1,    0],
                }}
                transition={{
                  duration: PACKET_DUR,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: pktDelay,
                  repeatDelay: 0,
                }}
              />
            );
          })}

          {/* 3 bright dots traveling along the path */}
          {PACKETS.map((p) => {
            const pktDelay = l.delay + p * (PACKET_DUR / PACKETS.length);
            return (
              <g key={`dot-${p}`}>
                {/* Glow halo */}
                <circle r="4" fill={l.color} opacity="0.25" filter="url(#dot-glow)">
                  <animateMotion
                    dur={`${PACKET_DUR}s`}
                    repeatCount="indefinite"
                    begin={`${pktDelay}s`}
                    calcMode="spline"
                    keySplines="0.4 0 0.6 1"
                    keyTimes="0;1"
                  >
                    <mpath href={`#path-${i}`} />
                  </animateMotion>
                  <animate
                    attributeName="opacity"
                    values="0;0.35;0"
                    dur={`${PACKET_DUR}s`}
                    begin={`${pktDelay}s`}
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                    keyTimes="0;0.5;1"
                  />
                </circle>
                {/* Core dot */}
                <circle r="2.2" fill={l.color}>
                  <animateMotion
                    dur={`${PACKET_DUR}s`}
                    repeatCount="indefinite"
                    begin={`${pktDelay}s`}
                    calcMode="spline"
                    keySplines="0.4 0 0.6 1"
                    keyTimes="0;1"
                  >
                    <mpath href={`#path-${i}`} />
                  </animateMotion>
                  <animate
                    attributeName="opacity"
                    values="0;1;0"
                    dur={`${PACKET_DUR}s`}
                    begin={`${pktDelay}s`}
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                    keyTimes="0;0.5;1"
                  />
                </circle>
              </g>
            );
          })}

          {/* Pulsing origin dot at card corner */}
          <motion.circle
            cx={l.cx} cy={l.cy} r="4"
            fill={l.color}
            filter="url(#dot-glow)"
            animate={{ opacity: [0.25, 0.85, 0.25], r: [3, 5.5, 3] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: l.delay }}
          />
          <circle cx={l.cx} cy={l.cy} r="2" fill={l.color} opacity="0.9" />
        </g>
      ))}

      {/* Center MacBook receiver glow — pulses when packets "arrive" */}
      <motion.circle
        cx="500" cy="308" r="7"
        fill={PURPLE_L}
        filter="url(#center-glow)"
        animate={{ opacity: [0.2, 0.75, 0.2], r: [5, 10, 5] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Expanding ring */}
      <motion.circle
        cx="500" cy="308" r="14"
        fill="none"
        stroke={PURPLE_L}
        strokeWidth="1.2"
        animate={{ opacity: [0, 0.55, 0], r: [8, 26, 8] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Second ring offset */}
      <motion.circle
        cx="500" cy="308" r="20"
        fill="none"
        stroke={PURPLE_L}
        strokeWidth="0.6"
        animate={{ opacity: [0, 0.25, 0], r: [14, 38, 14] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      />
    </svg>
  );
}

// ── Tutores IA screen — chat with real tutor avatars ─────────────────────────
function TutoresScreen({ fill = false }: { fill?: boolean }) {
  type FeedItem = { id: number; tutorIdx: number; msgIdx: number };

  const [feed, setFeed] = useState<FeedItem[]>(
    fill
      ? [
          { id: 0, tutorIdx: 0, msgIdx: 0 },
          { id: 1, tutorIdx: 1, msgIdx: 0 },
          { id: 2, tutorIdx: 2, msgIdx: 0 },
          { id: 3, tutorIdx: 0, msgIdx: 1 },
          { id: 4, tutorIdx: 1, msgIdx: 1 },
        ]
      : [
          { id: 0, tutorIdx: 0, msgIdx: 0 },
          { id: 1, tutorIdx: 1, msgIdx: 0 },
          { id: 2, tutorIdx: 2, msgIdx: 0 },
        ]
  );
  const nextRef = useRef({ counter: fill ? 5 : 3, tIdx: fill ? 1 : 0, mIdx: 1 });

  const [typingIdx, setTypingIdx] = useState(0);
  const [showTyping, setShowTyping] = useState(true);

  // Single interval drives both feed rotation and typing indicator
  useEffect(() => {
    const iv = setInterval(() => {
      const { counter, tIdx, mIdx } = nextRef.current;
      const nextT = (tIdx + 1) % CHAT_TUTORS.length;
      const msgs = CHAT_TUTORS[nextT].msgs;
      const nextM = (mIdx + 1) % msgs.length;
      nextRef.current = { counter: counter + 1, tIdx: nextT, mIdx: nextM };
      setFeed((prev) => [...prev.slice(fill ? -4 : -2), { id: counter, tutorIdx: nextT, msgIdx: nextM }]);
      setShowTyping(false);
      setTimeout(() => {
        setTypingIdx(nextT);
        setShowTyping(true);
      }, 300);
    }, 2200);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      padding: '9px 11px', gap: 6, overflow: 'hidden',
      background: 'linear-gradient(160deg, #0d0d1a 0%, #080c18 100%)',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
          🎓 Tutores IA
        </span>
        <motion.div
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
            borderRadius: 999, padding: '1px 6px',
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: EMERALD, boxShadow: `0 0 5px ${EMERALD}` }} />
          <span style={{ fontSize: 6, color: EMERALD, fontWeight: 700, letterSpacing: '0.06em' }}>ONLINE</span>
        </motion.div>
      </div>

      {/* Tutor avatar strip — all tutors scrolling horizontally */}
      <div style={{ overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
        {/* fade edges */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 16, zIndex: 1,
          background: 'linear-gradient(90deg, #0d0d1a, transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 16, zIndex: 1,
          background: 'linear-gradient(-90deg, #0d0d1a, transparent)', pointerEvents: 'none' }} />
        <motion.div
          style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}
          animate={{ x: [0, -(26 * CHAT_TUTORS.length)] }}
          transition={{ duration: CHAT_TUTORS.length * 0.9, repeat: Infinity, repeatType: 'loop', ease: 'linear' }}
        >
          {[...CHAT_TUTORS, ...CHAT_TUTORS].map((t, i) => {
            const isActive = (i % CHAT_TUTORS.length) === typingIdx && showTyping;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <div style={{ position: 'relative' }}>
                  <img src={t.avatar} alt={t.name} width={22} height={22}
                    style={{
                      borderRadius: '50%', display: 'block', objectFit: 'cover', background: '#0d0a1e',
                      border: `1.5px solid ${isActive ? t.color : t.color + '35'}`,
                      boxShadow: isActive ? `0 0 8px ${t.color}80` : 'none',
                      transition: 'border-color 0.3s, box-shadow 0.3s',
                    }} />
                  {isActive && (
                    <div style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 6, height: 6, borderRadius: '50%',
                      background: t.color, border: '1px solid #080c18',
                    }} />
                  )}
                </div>
                <span style={{ fontSize: 5.5, color: isActive ? t.color : 'rgba(255,255,255,0.28)', fontWeight: isActive ? 700 : 400, lineHeight: 1 }}>
                  {t.name}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Divider */}
      <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

      {/* Chat feed */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: fill ? 'flex-start' : 'flex-end', gap: fill ? 8 : 5, overflow: 'hidden' }}>
        <AnimatePresence initial={false}>
          {feed.map((item) => {
            const t = CHAT_TUTORS[item.tutorIdx];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 14, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}
              >
                <img src={t.avatar} alt={t.name} width={20} height={20}
                  style={{ borderRadius: '50%', flexShrink: 0, marginTop: 1, objectFit: 'cover', background: '#0d0a1e', border: `1px solid ${t.color}55` }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: fill ? 8 : 6, fontWeight: 700, color: t.color, marginBottom: 2 }}>
                    {t.name} · {t.subject}
                  </div>
                  <div style={{
                    fontSize: fill ? 10 : 7.5, color: 'rgba(255,255,255,0.82)', lineHeight: 1.45,
                    background: `${t.color}0e`, border: `1px solid ${t.color}28`,
                    borderRadius: '2px 8px 8px 8px', padding: '4px 8px',
                  }}>
                    {t.msgs[item.msgIdx]}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {showTyping && (
            <motion.div
              key={typingIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ display: 'flex', gap: 6, alignItems: 'center' }}
            >
              <img src={CHAT_TUTORS[typingIdx].avatar} alt="" width={20} height={20}
                style={{ borderRadius: '50%', flexShrink: 0, objectFit: 'cover', background: '#0d0a1e', border: `1px solid ${CHAT_TUTORS[typingIdx].color}55` }} />
              <div style={{
                display: 'flex', alignItems: 'center', gap: 3,
                background: `${CHAT_TUTORS[typingIdx].color}0d`,
                border: `1px solid ${CHAT_TUTORS[typingIdx].color}25`,
                borderRadius: '2px 8px 8px 8px', padding: '5px 9px',
              }}>
                {[0, 0.18, 0.36].map((delay, i) => (
                  <motion.div key={i}
                    style={{ width: 4, height: 4, borderRadius: '50%', background: CHAT_TUTORS[typingIdx].color }}
                    animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.7, repeat: Infinity, delay }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── App dashboard rendered inside the MacBook screen ─────────────────────────
function AppScreen({ termLines, visibleConcepts }: { termLines: string[]; visibleConcepts: number[] }) {
  const [activeTab, setActiveTab] = useState<'TutoresIA' | 'Estudar' | 'CommandCenter' | 'Redacao'>('Estudar');
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Auto-switch: Estudar 3.5s → TutoresIA 4s → CommandCenter 4.5s → Redacao 4s → repeat
  useEffect(() => {
    const DUR: Record<typeof activeTab, number> = {
      Estudar: 3500, TutoresIA: 4500, CommandCenter: 4500, Redacao: 5000,
    };
    const NEXT: Record<typeof activeTab, typeof activeTab> = {
      Estudar: 'TutoresIA', TutoresIA: 'CommandCenter', CommandCenter: 'Redacao', Redacao: 'Estudar',
    };
    const timer = setTimeout(() => setActiveTab((t) => NEXT[t]), DUR[activeTab]);
    return () => clearTimeout(timer);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'Estudar') return;
    const t1 = setTimeout(() => setFlipped(true), 2200);
    const t2 = setTimeout(() => {
      setCardIdx((i) => (i + 1) % FLASHCARDS.length);
      setFlipped(false);
    }, 4400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [cardIdx, activeTab]);

  // Sidebar nav active highlight cycles upward in sync with scroll
  const [navIdx, setNavIdx] = useState(1);
  useEffect(() => {
    if (activeTab !== 'Estudar') return;
    const iv = setInterval(() => setNavIdx((i) => (i + 1) % SIDEBAR_NAV.length), 833);
    return () => clearInterval(iv);
  }, [activeTab]);

  const card = FLASHCARDS[cardIdx];

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(160deg, #0d0d1a 0%, #080c18 100%)',
      overflow: 'hidden',
    }}>
      {/* ── macOS-style title bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(18,18,18,0.92)',
        flexShrink: 0,
      }}>
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.85 }} />
          ))}
        </div>
        {/* Tab bar */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
          {([
            { id: 'Estudar',       label: 'Estudar',    ac: PURPLE    },
            { id: 'TutoresIA',     label: 'Tutores IA', ac: '#a855f7' },
            { id: 'CommandCenter', label: '⚡ Central',  ac: NEON_G    },
            { id: 'Redacao',       label: 'Redação',    ac: '#10b981' },
          ] as const).map(({ id, label, ac }) => {
            const isActive = id === activeTab;
            return (
              <div key={id} onClick={() => setActiveTab(id)} style={{
                fontSize: 7, fontWeight: isActive ? 700 : 500,
                color: isActive ? (id === 'CommandCenter' ? NEON_G : id === 'Redacao' ? '#10b981' : id === 'TutoresIA' ? '#a855f7' : '#fff') : 'rgba(255,255,255,0.28)',
                padding: '2px 5px', borderRadius: 5,
                background: isActive ? `${ac}20` : 'transparent',
                border: isActive ? `1px solid ${ac}42` : '1px solid transparent',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}>{label}</div>
            );
          })}
        </div>
        {/* Streak badge */}
        <div style={{
          fontSize: 9, color: '#fb923c', fontWeight: 700,
          background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)',
          padding: '2px 8px', borderRadius: 999, letterSpacing: '0.02em',
        }}>🔥 12</div>
      </div>

      {/* ── Body ── */}
      {activeTab === 'TutoresIA' && (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <TutoresScreen />
        </div>
      )}

      {activeTab === 'Redacao' && (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <RedacaoScreen />
        </div>
      )}

      {activeTab === 'CommandCenter' && (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <CommandCenterScreen termLines={termLines} visibleConcepts={visibleConcepts} />
        </div>
      )}

      {activeTab === 'Estudar' && <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '88px 1fr',
        overflow: 'hidden',
      }}>

        {/* ── Left sidebar ── */}
        <div style={{
          borderRight: '1px solid rgba(255,255,255,0.05)',
          padding: '10px 0',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          background: 'rgba(0,0,0,0.2)',
        }}>
          {/* Logo */}
          <div style={{
            width: 28, height: 28, borderRadius: 8, marginBottom: 6,
            background: `linear-gradient(135deg, ${PURPLE}, #6d28d9)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, boxShadow: `0 0 12px ${PURPLE}60`,
          }}>⚡</div>
          {/* Nav items — continuous upward scroll */}
          <div style={{ overflow: 'hidden', flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <motion.div
              style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}
              animate={{ y: [0, -(38 * SIDEBAR_NAV.length)] }}
              transition={{ duration: SIDEBAR_NAV.length * 0.833, repeat: Infinity, repeatType: 'loop', ease: 'linear' }}
            >
              {[...SIDEBAR_NAV, ...SIDEBAR_NAV].map((n, i) => {
                const isActive = (i % SIDEBAR_NAV.length) === navIdx;
                return (
                  <div key={i} style={{
                    width: 40, height: 34, borderRadius: 8, flexShrink: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? `${PURPLE}22` : 'transparent',
                    border: isActive ? `1px solid ${PURPLE}45` : '1px solid transparent',
                    boxShadow: isActive ? `0 0 10px ${PURPLE}40` : 'none',
                    cursor: 'default',
                    transition: 'background 0.3s, border-color 0.3s',
                  }}>
                    <span style={{ fontSize: 11, color: isActive ? PURPLE_L : 'rgba(255,255,255,0.22)' }}>{n.icon}</span>
                    <span style={{ fontSize: 7, color: isActive ? PURPLE_L : 'rgba(255,255,255,0.18)', marginTop: 1 }}>{n.label}</span>
                  </div>
                );
              })}
            </motion.div>
          </div>
          {/* ENEM countdown at bottom */}
          <div style={{ marginTop: 'auto', marginBottom: 4, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: PURPLE_L, lineHeight: 1 }}>142</div>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.04em' }}>dias</div>
            <div style={{ fontSize: 6, color: `${PURPLE_L}80` }}>ENEM</div>
          </div>
        </div>

        {/* ── Main area ── */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 10, gap: 8 }}>

          {/* Top stats row */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {[
              { label: 'Cards hoje', value: '32', sub: 'de 50', color: EMERALD },
              { label: 'Retenção', value: '94%', sub: '+3% semana', color: PURPLE_L },
              { label: 'Sequência', value: '12d', sub: 'recorde!', color: '#fb923c' },
            ].map((s) => (
              <div key={s.label} style={{
                flex: 1, background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8, padding: '6px 8px',
              }}>
                <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 7, color: `${s.color}80`, marginTop: 1 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Flashcard + subject mini-list */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 72px', gap: 8, minHeight: 0 }}>

            {/* 3-D flip card */}
            <div style={{ perspective: 800, minHeight: 0 }}>
              <motion.div
                style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Front */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  background: `linear-gradient(135deg, rgba(0,229,255,0.06) 0%, rgba(124,58,237,0.08) 100%)`,
                  border: `1px solid rgba(0,229,255,0.2)`,
                  borderRadius: 12, padding: '10px 12px',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{
                      fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', color: CYAN,
                      background: `${CYAN}15`, border: `1px solid ${CYAN}30`,
                      padding: '2px 6px', borderRadius: 4,
                    }}>PERGUNTA</span>
                    <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)' }}>{card.subject}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#fff', lineHeight: 1.5, fontWeight: 600, flex: 1 }}>
                    {card.q}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 7, color: 'rgba(255,255,255,0.2)', marginTop: 8,
                  }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}>▶</span>
                    Toque para revelar
                  </div>
                </div>

                {/* Back */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: `linear-gradient(135deg, rgba(0,255,128,0.06) 0%, rgba(16,185,129,0.08) 100%)`,
                  border: `1px solid rgba(0,255,128,0.2)`,
                  borderRadius: 12, padding: '10px 12px',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <span style={{
                    fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', color: NEON_G,
                    background: `${NEON_G}15`, border: `1px solid ${NEON_G}30`,
                    padding: '2px 6px', borderRadius: 4, marginBottom: 8, alignSelf: 'flex-start',
                  }}>RESPOSTA</span>
                  <div style={{ fontSize: 10, color: '#fff', lineHeight: 1.5, fontWeight: 500, flex: 1 }}>
                    {card.a}
                  </div>
                  {/* Rating row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 3, marginTop: 8 }}>
                    {[
                      { label: 'Errei', color: '#ef4444' },
                      { label: 'Hard',  color: '#f97316' },
                      { label: 'Bom',   color: '#3b82f6' },
                      { label: 'Fácil', color: NEON_G    },
                    ].map((b) => (
                      <div key={b.label} style={{
                        fontSize: 7, color: b.color, fontWeight: 700, textAlign: 'center',
                        background: `${b.color}14`, border: `1px solid ${b.color}35`,
                        borderRadius: 5, padding: '3px 2px',
                      }}>{b.label}</div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Subject mini-list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { icon: '🧬', pct: 78, color: '#34d399' },
                { icon: '⚛️', pct: 54, color: PURPLE_L  },
                { icon: '🏛️', pct: 65, color: '#fb923c' },
                { icon: '🧪', pct: 41, color: CYAN      },
              ].map((s) => (
                <div key={s.icon} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${s.color}18`,
                  borderRadius: 7, padding: '5px 6px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1,
                }}>
                  <span style={{ fontSize: 12 }}>{s.icon}</span>
                  {/* Radial arc substitute — simple pill bar */}
                  <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <motion.div
                      style={{ height: '100%', background: `linear-gradient(90deg, ${s.color}99, ${s.color})`, borderRadius: 2 }}
                      initial={{ width: 0 }}
                      animate={{ width: `${s.pct}%` }}
                      transition={{ duration: 1.4, delay: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <span style={{ fontSize: 8, color: s.color, fontWeight: 700 }}>{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dot pagination */}
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexShrink: 0 }}>
            {FLASHCARDS.map((fc, i) => (
              <motion.div
                key={i}
                animate={{ width: i === cardIdx ? 20 : 5, opacity: i === cardIdx ? 1 : 0.3 }}
                transition={{ duration: 0.3 }}
                style={{ height: 3, borderRadius: 2, background: i === cardIdx ? fc.color : 'rgba(255,255,255,0.3)' }}
              />
            ))}
          </div>
        </div>
      </div>}
    </div>
  );
}

// ── Redação screen — writing → sending → processing → verdict ────────────────
function RedacaoScreen() {
  type Stage = 'writing' | 'sending' | 'processing' | 'verdict';
  const [stage, setStage] = useState<Stage>('writing');
  const [score, setScore] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage('sending'),    1000);
    const t2 = setTimeout(() => setStage('processing'), 1900);
    const t3 = setTimeout(() => setStage('verdict'),    2900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    if (stage !== 'verdict') return;
    let cur = 0;
    const iv = setInterval(() => {
      cur = Math.min(cur + 54, 960);
      setScore(Math.round(cur));
      if (cur >= 960) clearInterval(iv);
    }, 60);
    return () => clearInterval(iv);
  }, [stage]);

  const COMPS = [
    { id: 'C1', label: 'Norma Culta',  val: 200, color: '#10b981' },
    { id: 'C2', label: 'Tema/Argum.',  val: 160, color: '#00FF73' },
    { id: 'C3', label: 'Organização',  val: 200, color: '#f59e0b' },
    { id: 'C4', label: 'Coesão',       val: 200, color: '#f97316' },
    { id: 'C5', label: 'Intervenção',  val: 200, color: '#a855f7' },
  ];

  const NORMA_AV = '/images/avatars/ProfNorma.svg';

  const ESSAY = [
    'A exclusão digital no Brasil perpetua desigualdades estruturais históricas e limita o exercício pleno da cidadania.',
    'Segundo o IBGE, 46% dos lares de baixa renda não possuem acesso à internet de qualidade.',
    'Cabe ao Estado garantir infraestrutura tecnológica universal, priorizando regiões vulneráveis. ▌',
  ];

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      padding: '8px 11px', gap: 6, overflow: 'hidden',
      background: 'linear-gradient(160deg, #0d0d1a 0%, #080c18 100%)',
    }}>
      <AnimatePresence mode="wait">

        {/* ── WRITING + SENDING ── */}
        {(stage === 'writing' || stage === 'sending') && (
          <motion.div key="write"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            {/* Editor header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#fff' }}>📄 Rascunho · ENEM</span>
              <span style={{
                fontSize: 6, color: '#f59e0b', fontWeight: 700,
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                padding: '1px 6px', borderRadius: 999,
              }}>Exclusão Digital</span>
              <motion.span style={{ marginLeft: 'auto', fontSize: 7, color: 'rgba(255,255,255,0.3)' }}
                animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }}>
                ●
              </motion.span>
            </div>

            {/* Essay text editor */}
            <div style={{
              flex: 1, background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
              padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden',
            }}>
              {ESSAY.map((para, i) => (
                <motion.p key={i}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.22 }}
                  style={{ fontSize: 7, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0,
                    fontFamily: "'Georgia', serif" }}
                >{para}</motion.p>
              ))}
            </div>

            {/* Upload bar (only in 'sending') */}
            {stage === 'sending' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 6, color: '#a855f7', fontWeight: 700 }}>Enviando para Norma IA...</span>
                  <motion.span style={{ fontSize: 8 }}
                    animate={{ rotate: [0, 360] }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    ⏳
                  </motion.span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                  <motion.div style={{ height: '100%', borderRadius: 2,
                    background: 'linear-gradient(90deg, #a855f7, #7c3aed, #a855f7)',
                    backgroundSize: '200% 100%' }}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.85, ease: 'easeInOut' }}
                  />
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── PROCESSING ── */}
        {stage === 'processing' && (
          <motion.div key="proc"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
              <img src={NORMA_AV} width={28} height={28} alt="Norma"
                style={{ borderRadius: '50%', border: '2px solid #a855f780', background: '#0d0a1e', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 8, fontWeight: 800, color: '#fff' }}>Norma IA analisando...</div>
                <motion.div style={{ fontSize: 6, color: '#a78bfa', marginTop: 1 }}
                  animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.7, repeat: Infinity }}>
                  Verificando 5 competências...
                </motion.div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {COMPS.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 6, fontWeight: 700, color: c.color, width: 14, flexShrink: 0 }}>{c.id}</span>
                  <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.35)', width: 54, flexShrink: 0 }}>{c.label}</span>
                  <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                    <motion.div style={{ height: '100%', borderRadius: 2,
                      background: `linear-gradient(90deg, ${c.color}88, ${c.color})` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.val / 200) * 100}%` }}
                      transition={{ duration: 0.55, delay: i * 0.07, ease: 'easeOut' }}
                    />
                  </div>
                  <motion.span style={{ fontSize: 7, fontWeight: 700, color: c.color, width: 24, textAlign: 'right', flexShrink: 0 }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 + i * 0.07 }}
                  >{c.val}</motion.span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── VERDICT ── */}
        {stage === 'verdict' && (
          <motion.div key="verdict"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
              <img src={NORMA_AV} width={28} height={28} alt="Norma"
                style={{ borderRadius: '50%', border: '2px solid #10b98180', background: '#0d0a1e', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: '#fff' }}>Norma IA · Laudo Final</div>
                <div style={{ fontSize: 6, color: '#10b981', marginTop: 1 }}>✅ Análise concluída</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 5.5, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>SCORE</div>
                <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1,
                  background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{score}</div>
                <div style={{ fontSize: 5.5, color: 'rgba(255,255,255,0.25)' }}>/ 1000</div>
              </div>
            </div>

            {/* Compact competency bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {COMPS.map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 6, fontWeight: 700, color: c.color, width: 14, flexShrink: 0 }}>{c.id}</span>
                  <span style={{ fontSize: 5.5, color: 'rgba(255,255,255,0.3)', width: 54, flexShrink: 0 }}>{c.label}</span>
                  <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.07)', borderRadius: 1, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(c.val / 200) * 100}%`, background: c.color, borderRadius: 1 }} />
                  </div>
                  <span style={{ fontSize: 6.5, fontWeight: 700, color: c.color, width: 24, textAlign: 'right', flexShrink: 0 }}>{c.val}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

            {/* Feedback bubble */}
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}
            >
              <img src={NORMA_AV} width={14} height={14} alt="Norma"
                style={{ borderRadius: '50%', border: '1px solid #a855f755', background: '#0d0a1e', flexShrink: 0, marginTop: 1 }} />
              <div style={{
                fontSize: 7, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, flex: 1,
                background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.22)',
                borderRadius: '2px 8px 8px 8px', padding: '4px 8px',
              }}>
                ✍️ Intervenção impecável. C1 e C3 perfeitos —{' '}
                <span style={{ color: '#FFD700', fontWeight: 700 }}>960/1000</span> nota máxima! ⭐
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Command Center 2×2 grid — shown inside the MacBook screen on mobile ───────
function CommandCenterScreen({ termLines, visibleConcepts }: { termLines: string[]; visibleConcepts: number[] }) {

  const mono = "'JetBrains Mono','Courier New',ui-monospace,monospace";

  const cell = (border: string): React.CSSProperties => ({
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'rgba(6,10,20,0.97)',
    border,
  });

  const hdr: React.CSSProperties = {
    fontSize: 7,
    fontWeight: 700,
    color: PURPLE_L,
    marginBottom: 5,
    fontFamily: mono,
    letterSpacing: '0.06em',
    flexShrink: 0,
  };

  return (
    <div style={{
      height: '100%',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      background: '#060a14',
    }}>

      {/* TL — Arsenal de Revisão */}
      <div style={cell('none')}>
        <div style={{ ...hdr, borderBottom: '0.5px solid rgba(255,255,255,0.08)', paddingBottom: 4, marginBottom: 6 }}>
          📚 Arsenal
        </div>
        {[
          { name: 'Bio',  pct: 78, color: '#34d399' },
          { name: 'Quím', pct: 54, color: '#fb923c' },
          { name: 'Fís',  pct: 91, color: PURPLE_L  },
        ].map((s) => (
          <div key={s.name} style={{ marginBottom: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.55)', fontFamily: mono }}>{s.name}</span>
              <motion.span
                style={{ fontSize: 7, color: s.color, fontFamily: mono, fontWeight: 700 }}
                animate={{ textShadow: [`0 0 6px ${s.color}80`, `0 0 14px ${s.color}cc`, `0 0 6px ${s.color}80`] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: Math.random() }}
              >{s.pct}%</motion.span>
            </div>
            <div style={{ height: 2, background: 'rgba(255,255,255,0.07)', borderRadius: 1, overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', background: `linear-gradient(90deg, ${s.color}99, ${s.color})`, borderRadius: 1 }}
                initial={{ width: 0 }}
                animate={{ width: `${s.pct}%` }}
                transition={{ duration: 1.4, delay: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* TR — Agenda IA */}
      <div style={cell('none')}>
        <div style={{ ...hdr, borderBottom: '0.5px solid rgba(255,255,255,0.08)', paddingBottom: 4, marginBottom: 6 }}>
          🤖 Agenda IA
        </div>
        {[
          { time: '14:00', subject: 'Termodinâmica', icon: '⚛️' },
          { time: '16:30', subject: 'Genética',      icon: '🧬' },
          { time: '19:00', subject: 'Literatura',    icon: '📖' },
        ].map((s) => (
          <div key={s.time} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            marginBottom: 4, padding: '3px 5px', borderRadius: 5,
            background: `${PURPLE}18`, border: `1px solid ${PURPLE}28`,
          }}>
            <span style={{ fontSize: 9 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 7, color: '#fff', fontWeight: 700 }}>{s.subject}</div>
              <div style={{ fontSize: 6, color: PURPLE_L, fontFamily: mono }}>{s.time} · IA</div>
            </div>
          </div>
        ))}
      </div>

      {/* BL — AI Memory Engine */}
      <div style={cell('none')}>
        <div style={{ ...hdr, borderBottom: '0.5px solid rgba(255,255,255,0.08)', paddingBottom: 4, marginBottom: 5 }}>
          ⚙️ AI Engine
        </div>
        <div style={{
          flex: 1,
          background: 'rgba(0,0,0,0.55)',
          borderRadius: 4,
          padding: '4px 6px',
          fontFamily: mono,
          fontSize: 6,
          overflow: 'hidden',
          border: '1px solid rgba(124,58,237,0.18)',
        }}>
          <div style={{ color: `${PURPLE_L}55`, marginBottom: 2 }}>// v3.1 · live</div>
          {termLines.map((line, i) => (
            <motion.div
              key={`${i}-${line}`}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                color: line.includes('✅') ? '#34d399' : line.includes('⚡') ? PURPLE_L : 'rgba(255,255,255,0.4)',
                marginBottom: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >{line}</motion.div>
          ))}
          <motion.span
            style={{ color: PURPLE_L }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >▮</motion.span>
        </div>
      </div>

      {/* BR — Conceitos Blindados */}
      <div style={cell('none')}>
        <div style={{ ...hdr, borderBottom: '0.5px solid rgba(255,255,255,0.08)', paddingBottom: 4, marginBottom: 6 }}>
          🔒 Blindados
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
          {visibleConcepts.map((ci) => (
            <motion.div
              key={ci}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                padding: '4px 6px', borderRadius: 999,
                background: `${PURPLE}1a`, border: `1px solid ${PURPLE}45`,
                color: PURPLE_L, fontSize: 7, fontWeight: 700,
                textAlign: 'center', fontFamily: mono,
              }}
            >🔒 {CONCEPTS[ci]}</motion.div>
          ))}
        </div>
        <motion.div
          style={{ height: 1, background: `linear-gradient(90deg, transparent, ${NEON_G}, transparent)`, marginTop: 6 }}
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        />
      </div>

      {/* 0.5px cross dividers */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
      }}>
        {/* Vertical center line */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: '0.5px',
          background: 'rgba(255,255,255,0.1)',
        }} />
        {/* Horizontal center line */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '0.5px',
          background: 'rgba(255,255,255,0.1)',
        }} />
      </div>
    </div>
  );
}

// ── Redação full-screen (mobile iPhone) — espelha a auditoria TRI da pág. de vendas ──
function PhoneRedacaoScreen() {
  const MONO = "'JetBrains Mono','Courier New',ui-monospace,monospace";
  const TOTAL = 960;
  const COMPS = [
    { id: 'C1', label: 'Norma Culta',   score: 200, color: '#10b981' },
    { id: 'C2', label: 'Tema / Argum.', score: 160, color: '#00FF73' },
    { id: 'C3', label: 'Organização',   score: 200, color: '#f59e0b' },
    { id: 'C4', label: 'Coesão',        score: 200, color: '#f97316' },
    { id: 'C5', label: 'Intervenção',   score: 200, color: '#00FF73' },
  ];
  const FEED = [
    { t: '> C1 — Norma Culta...',     c: 'dim' },
    { t: '  ✓ 200/200 NOMINAL',       c: '#10b981' },
    { t: '> C2 — Argumentação...',    c: 'dim' },
    { t: '  ! 160/200 WARN REP-007',  c: '#f97316' },
    { t: '> C3 — Organização...',     c: 'dim' },
    { t: '  ✓ 200/200 NOMINAL',       c: '#f59e0b' },
    { t: '> C4 — Coesão...',          c: 'dim' },
    { t: '  ✓ 200/200 NOMINAL',       c: '#f97316' },
    { t: '> C5 — Intervenção...',     c: 'dim' },
    { t: '  ✓ 200/200 NOMINAL',       c: '#00FF73' },
    { t: '> score TRI calculado',     c: '#a855f7' },
  ];

  const [shown, setShown] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (shown < FEED.length) {
      const t = setTimeout(() => setShown((s) => s + 1), 320);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setShown(0); setScore(0); }, 4200);
    return () => clearTimeout(t);
  }, [shown]);

  useEffect(() => {
    if (shown < FEED.length) return;
    let cur = 0;
    const iv = setInterval(() => {
      cur = Math.min(cur + 60, TOTAL);
      setScore(cur);
      if (cur >= TOTAL) clearInterval(iv);
    }, 45);
    return () => clearInterval(iv);
  }, [shown]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '10px 12px', gap: 8,
      background: 'linear-gradient(160deg,#0d0d1a 0%,#080c18 100%)', fontFamily: MONO, overflow: 'hidden' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: '#fff' }}>✍️ Redação · Norma IA</span>
        <span style={{ fontSize: 6, color: '#a855f7', letterSpacing: '0.18em', fontWeight: 700 }}>AUDITORIA TRI</span>
      </div>

      {/* terminal feed — fills */}
      <div style={{ flex: 1, minHeight: 0, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(124,58,237,0.18)',
        borderRadius: 8, padding: '8px 9px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {FEED.slice(0, shown).map((l, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}
            style={{ fontSize: 8, lineHeight: 1.5, whiteSpace: 'nowrap',
              color: l.c === 'dim' ? 'rgba(255,255,255,0.4)' : l.c }}>
            {l.t}
          </motion.div>
        ))}
        {shown < FEED.length && (
          <motion.span style={{ fontSize: 8, color: '#a855f7' }} animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}>▮</motion.span>
        )}
      </div>

      {/* competency bars */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {COMPS.map((c, i) => {
          const revealed = shown >= i * 2 + 2;
          return (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 7, fontWeight: 700, color: c.color, width: 16 }}>{c.id}</span>
              <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.6)', width: 56 }}>{c.label}</span>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <motion.div style={{ height: '100%', borderRadius: 2, background: c.color }}
                  initial={{ width: 0 }} animate={{ width: revealed ? `${(c.score / 200) * 100}%` : 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }} />
              </div>
              <span style={{ fontSize: 7, fontWeight: 700, color: c.color, width: 24, textAlign: 'right' }}>{c.score}</span>
            </div>
          );
        })}
      </div>

      {/* final TRI score */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6 }}>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>SCORE TRI</span>
        <span style={{ fontSize: 18, fontWeight: 900, color: score >= TOTAL ? '#00FF73' : '#a855f7', lineHeight: 1 }}>
          {score}<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>/1000</span>
        </span>
      </div>
    </div>
  );
}

// ── App screen renderizado dentro do iPhone (mobile) ─────────────────────────
function PhoneAppScreen() {
  const [activeTab, setActiveTab] = useState<'Estudar' | 'TutoresIA' | 'Redacao'>('Estudar');
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Ciclo: Estudar 4s → Tutores 4.5s → Redação 5s → repeat
  useEffect(() => {
    const DUR: Record<typeof activeTab, number> = { Estudar: 4000, TutoresIA: 4500, Redacao: 5000 };
    const NEXT: Record<typeof activeTab, typeof activeTab> = {
      Estudar: 'TutoresIA', TutoresIA: 'Redacao', Redacao: 'Estudar',
    };
    const t = setTimeout(() => setActiveTab((x) => NEXT[x]), DUR[activeTab]);
    return () => clearTimeout(t);
  }, [activeTab]);

  // Flip do card quando em Estudar
  useEffect(() => {
    if (activeTab !== 'Estudar') return;
    const t1 = setTimeout(() => setFlipped(true), 2000);
    const t2 = setTimeout(() => { setCardIdx((i) => (i + 1) % FLASHCARDS.length); setFlipped(false); }, 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [cardIdx, activeTab]);

  const card = FLASHCARDS[cardIdx];

  const NAV = [
    { id: 'Estudar',   icon: '📚', label: 'Estudar', ac: PURPLE_L },
    { id: 'TutoresIA', icon: '🤖', label: 'Tutores', ac: '#a855f7' },
    { id: 'Redacao',   icon: '✍️', label: 'Redação', ac: EMERALD  },
  ] as const;

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(160deg, #0d0d1a 0%, #080c18 100%)', overflow: 'hidden',
    }}>
      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px 6px', flexShrink: 0, fontSize: 9, color: 'rgba(255,255,255,0.55)',
      }}>
        <span style={{ fontWeight: 800, color: '#fff' }}>
          <span style={{ color: PURPLE_L }}>●</span> FlashAprova
        </span>
        <span style={{ fontWeight: 600 }}>9:41</span>
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTab === 'TutoresIA' && <TutoresScreen fill />}
        {activeTab === 'Redacao' && <PhoneRedacaoScreen />}
        {activeTab === 'Estudar' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '8px 12px 6px', gap: 8 }}>
            {/* stat chips */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {[
                { label: 'Hoje', value: '32', color: EMERALD },
                { label: 'Retenção', value: '94%', color: PURPLE_L },
                { label: 'Streak', value: '12d', color: '#fb923c' },
              ].map((s) => (
                <div key={s.label} style={{
                  flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 8, padding: '5px 7px',
                }}>
                  <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)' }}>{s.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                </div>
              ))}
            </div>
            {/* flip card */}
            <div style={{ flex: 1, perspective: 800, minHeight: 0 }}>
              <motion.div
                style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Front */}
                <div style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  background: 'linear-gradient(135deg, rgba(0,229,255,0.06) 0%, rgba(124,58,237,0.08) 100%)',
                  border: '1px solid rgba(0,229,255,0.2)', borderRadius: 14, padding: '12px 14px',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{
                      fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: CYAN,
                      background: `${CYAN}15`, border: `1px solid ${CYAN}30`, padding: '2px 6px', borderRadius: 4,
                    }}>PERGUNTA</span>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>{card.subject}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#fff', lineHeight: 1.5, fontWeight: 600, flex: 1 }}>{card.q}</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>▶ Toque para revelar</div>
                </div>
                {/* Back */}
                <div style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: 'linear-gradient(135deg, rgba(0,255,128,0.06) 0%, rgba(16,185,129,0.08) 100%)',
                  border: '1px solid rgba(0,255,128,0.2)', borderRadius: 14, padding: '12px 14px',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <span style={{
                    fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: NEON_G, alignSelf: 'flex-start',
                    background: `${NEON_G}15`, border: `1px solid ${NEON_G}30`, padding: '2px 6px', borderRadius: 4, marginBottom: 10,
                  }}>RESPOSTA</span>
                  <div style={{ fontSize: 12, color: '#fff', lineHeight: 1.5, flex: 1 }}>{card.a}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 3, marginTop: 8 }}>
                    {[
                      { label: 'Errei', color: '#ef4444' }, { label: 'Hard', color: '#f97316' },
                      { label: 'Bom', color: '#3b82f6' }, { label: 'Fácil', color: NEON_G },
                    ].map((b) => (
                      <div key={b.label} style={{
                        fontSize: 8, color: b.color, fontWeight: 700, textAlign: 'center',
                        background: `${b.color}14`, border: `1px solid ${b.color}35`, borderRadius: 5, padding: '3px 2px',
                      }}>{b.label}</div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
            {/* dots */}
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexShrink: 0 }}>
              {FLASHCARDS.map((fc, i) => (
                <motion.div key={i}
                  animate={{ width: i === cardIdx ? 18 : 5, opacity: i === cardIdx ? 1 : 0.3 }}
                  transition={{ duration: 0.3 }}
                  style={{ height: 3, borderRadius: 2, background: i === cardIdx ? fc.color : 'rgba(255,255,255,0.3)' }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        flexShrink: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '6px 0 8px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(18,18,18,0.92)',
      }}>
        {NAV.map((n) => {
          const on = n.id === activeTab;
          return (
            <div key={n.id} onClick={() => setActiveTab(n.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              cursor: 'pointer', opacity: on ? 1 : 0.4, transition: 'opacity 0.3s',
            }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              <span style={{ fontSize: 7, fontWeight: 700, color: on ? n.ac : 'rgba(255,255,255,0.4)' }}>{n.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── iPhone frame (mobile) ─────────────────────────────────────────────────────
function IPhoneMockup() {
  return (
    <div style={{
      width: 212, height: 430, borderRadius: 40, position: 'relative',
      background: 'linear-gradient(160deg, #2c2c2e 0%, #1c1c1e 100%)',
      padding: 7, border: '1px solid rgba(255,255,255,0.09)',
      boxShadow: `0 0 70px ${PURPLE}33, inset 0 1px 0 rgba(255,255,255,0.08), 0 30px 70px rgba(0,0,0,0.75)`,
    }}>
      {/* Notch */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        width: 64, height: 14, borderRadius: 10, background: '#000', zIndex: 6,
      }} />
      {/* Screen */}
      <div style={{
        width: '100%', height: '100%', borderRadius: 33, overflow: 'hidden',
        background: '#050b14', border: '1px solid rgba(0,0,0,0.5)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
      }}>
        <PhoneAppScreen />
      </div>
    </div>
  );
}

// ── 4 satélites em overlap ao redor do iPhone (mobile) ───────────────────────
function MobileSatellites({ termLines, visibleConcepts }: { termLines: string[]; visibleConcepts: number[] }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setActive((a) => (a + 1) % 4), 2100);
    return () => clearInterval(iv);
  }, []);

  const ARSENAL = (
    <GlassCard className="!p-3" style={{ width: 142 }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-bold" style={{ color: PURPLE_L }}>📚 Arsenal</div>
        <motion.span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ color: '#fb923c', background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.3)' }}
          animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity }}>
          revisando
        </motion.span>
      </div>
      {[{ name: 'Biologia', pct: 78, color: '#34d399' }, { name: 'Física', pct: 91, color: PURPLE_L }].map((s, idx) => (
        <div key={s.name} className="mb-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.72)' }}>{s.name}</span>
            <motion.span className="text-[8px] font-bold" style={{ color: s.color }}
              animate={{ opacity: [0.55, 1, 0.55] }} transition={{ duration: 2, repeat: Infinity, delay: idx * 0.4 }}>
              {s.pct}%
            </motion.span>
          </div>
          <div className="relative h-1 rounded-full overflow-hidden mt-1" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <motion.div className="h-full rounded-full" style={{ background: s.color }}
              animate={{ width: [`${s.pct - 6}%`, `${s.pct}%`, `${s.pct - 6}%`] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.5 }} />
            <motion.div className="absolute inset-y-0" style={{ width: '34%', background: `linear-gradient(90deg, transparent, ${s.color}cc, transparent)` }}
              animate={{ x: ['-120%', '320%'] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.6 }} />
          </div>
        </div>
      ))}
    </GlassCard>
  );

  const MEMORY = <TerminalWidget className="!w-[142px] !p-3" lines={termLines} />;

  const AGENDA = (
    <GlassCard className="!p-3" style={{ width: 142 }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-bold" style={{ color: PURPLE_L }}>🤖 Agenda IA</div>
        <motion.span style={{ width: 5, height: 5, borderRadius: '50%', background: NEON_G, boxShadow: `0 0 6px ${NEON_G}` }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.25, 0.8] }} transition={{ duration: 1.4, repeat: Infinity }} />
      </div>
      {[{ time: '14:00', subject: 'Termo', icon: '⚛️' }, { time: '16:30', subject: 'Genética', icon: '🧬' }].map((s, idx) => (
        <motion.div key={s.time} className="flex items-center gap-2 mb-1.5 p-1.5 rounded-lg"
          style={{ background: `${PURPLE}12`, border: '1px solid rgba(124,58,237,0.18)' }}
          animate={idx === 0
            ? { borderColor: ['rgba(124,58,237,0.18)', 'rgba(124,58,237,0.6)', 'rgba(124,58,237,0.18)'], boxShadow: ['0 0 0px rgba(124,58,237,0)', `0 0 10px ${PURPLE}55`, '0 0 0px rgba(124,58,237,0)'] }
            : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
          <motion.span className="text-sm" animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: idx * 0.5 }}>{s.icon}</motion.span>
          <div className="flex-1">
            <div className="text-[9px] font-semibold" style={{ color: '#fff' }}>{s.subject}</div>
            <div className="text-[8px]" style={{ color: PURPLE_L }}>{s.time}</div>
          </div>
          {idx === 0 && (
            <motion.span className="text-[6px] font-bold" style={{ color: NEON_G }}
              animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}>agora</motion.span>
          )}
        </motion.div>
      ))}
      <div className="h-0.5 rounded-full overflow-hidden mt-1" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <motion.div className="h-full rounded-full" style={{ background: PURPLE_L }}
          animate={{ width: ['10%', '100%'] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} />
      </div>
    </GlassCard>
  );

  const CONCEITOS = (
    <GlassCard className="!p-3" style={{ width: 142 }}>
      <div className="text-[10px] font-bold mb-2" style={{ color: PURPLE_L }}>🔒 Conceitos</div>
      <ConceptsWidget visible={visibleConcepts} />
    </GlassCard>
  );

  // 2 linhas simétricas: topo (top:58) e baixo (top:300); esquerda/direita espelhados.
  const SATS = [
    { node: ARSENAL,   side: 'left'  as const, top: 58,  floatDelay: 0   },
    { node: MEMORY,    side: 'right' as const, top: 58,  floatDelay: 0.6 },
    { node: AGENDA,    side: 'left'  as const, top: 300, floatDelay: 1.2 },
    { node: CONCEITOS, side: 'right' as const, top: 300, floatDelay: 1.8 },
  ];

  return (
    <>
      {SATS.map((s, i) => {
        const isActive = i === active;
        const out = s.side === 'left' ? -30 : 30;
        const sidePos = s.side === 'left' ? { left: 0 } : { right: 0 };
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ ...sidePos, top: s.top, width: 142, zIndex: isActive ? 20 : 2 }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: isActive ? 1 : 0.3,
              scale: isActive ? 1 : 0.88,
              x: isActive ? out : 0,
            }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <FloatWrapper delay={s.floatDelay} intensity={5}>
              {/* key força remount → re-dispara o glitch toda vez que vira ativo */}
              <div key={isActive ? `on-${active}` : 'off'} className={isActive ? 'sat-glitch-in' : ''}>
                {s.node}
              </div>
            </FloatWrapper>
          </motion.div>
        );
      })}
    </>
  );
}

// ── Linhas de conexão satélite→iPhone (mobile) ───────────────────────────────
// viewBox 360×500; centro do iPhone ≈ (180,250). Origens nas bordas dos satélites.
const MCONN_LINES = [
  { d: 'M 52,100 C 110,150 160,210 180,242',  color: PURPLE_L,  delay: 0,   gradId: 'mcg0', cx: 52,  cy: 100 },  // Arsenal (topo-esq)
  { d: 'M 308,100 C 250,150 200,210 180,242', color: '#34d399', delay: 0.5, gradId: 'mcg1', cx: 308, cy: 100 },  // AI Memory (topo-dir)
  { d: 'M 52,330 C 110,310 160,275 180,258',  color: '#fb923c', delay: 1.0, gradId: 'mcg2', cx: 52,  cy: 330 },  // Agenda (baixo-esq)
  { d: 'M 308,330 C 250,310 200,275 180,258', color: CYAN,      delay: 1.5, gradId: 'mcg3', cx: 308, cy: 330 },  // Conceitos (baixo-dir)
];

function MobileConnectionLines() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}
      viewBox="0 0 360 500" preserveAspectRatio="xMidYMid meet">
      <defs>
        {MCONN_LINES.map((l) => (
          <linearGradient key={l.gradId} id={l.gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={l.color} stopOpacity="0.05" />
            <stop offset="45%" stopColor={l.color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={l.color} stopOpacity="0" />
          </linearGradient>
        ))}
        {MCONN_LINES.map((l) => (
          <filter key={`f-${l.gradId}`} id={`mglow-${l.gradId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        ))}
        <filter id="mdot-glow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="mcenter-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {MCONN_LINES.map((l, i) => (
        <g key={i}>
          <path id={`mpath-${i}`} d={l.d} fill="none" stroke="none" />
          <path d={l.d} fill="none" stroke={l.color} strokeWidth="0.7" strokeOpacity="0.18" strokeDasharray="3 9" />
          {PACKETS.map((p) => {
            const pktDelay = l.delay + p * (PACKET_DUR / PACKETS.length);
            return (
              <motion.path key={`pkt-${p}`} d={l.d} fill="none" stroke={`url(#${l.gradId})`} strokeWidth="2"
                filter={`url(#mglow-${l.gradId})`}
                initial={{ pathLength: 0, opacity: 0, pathOffset: 0 }}
                animate={{ pathLength: [0, 0.32, 0], pathOffset: [0, 0.68, 1], opacity: [0, 1, 0] }}
                transition={{ duration: PACKET_DUR, repeat: Infinity, ease: 'easeInOut', delay: pktDelay }} />
            );
          })}
          {PACKETS.map((p) => {
            const pktDelay = l.delay + p * (PACKET_DUR / PACKETS.length);
            return (
              <circle key={`dot-${p}`} r="2" fill={l.color} filter="url(#mdot-glow)">
                <animateMotion dur={`${PACKET_DUR}s`} repeatCount="indefinite" begin={`${pktDelay}s`}
                  calcMode="spline" keySplines="0.4 0 0.6 1" keyTimes="0;1">
                  <mpath href={`#mpath-${i}`} />
                </animateMotion>
                <animate attributeName="opacity" values="0;1;0" dur={`${PACKET_DUR}s`} begin={`${pktDelay}s`}
                  repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" keyTimes="0;0.5;1" />
              </circle>
            );
          })}
          <motion.circle cx={l.cx} cy={l.cy} r="3.5" fill={l.color} filter="url(#mdot-glow)"
            animate={{ opacity: [0.25, 0.85, 0.25], r: [2.5, 4.5, 2.5] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: l.delay }} />
        </g>
      ))}

      {/* Glow de chegada no centro do iPhone */}
      <motion.circle cx="180" cy="250" r="6" fill={PURPLE_L} filter="url(#mcenter-glow)"
        animate={{ opacity: [0.2, 0.7, 0.2], r: [4, 9, 4] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} />
    </svg>
  );
}

// ── MacBook frame ─────────────────────────────────────────────────────────────
function MacBookMockup({ termLines, visibleConcepts }: { termLines: string[]; visibleConcepts: number[] }) {
  return (
    <div style={{ width: '100%', maxWidth: 560, position: 'relative' }}>
      {/* Lid */}
      <div style={{
        background: 'linear-gradient(175deg, #2c2c2e 0%, #1c1c1e 100%)',
        borderRadius: '14px 14px 4px 4px',
        padding: '10px 10px 6px',
        boxShadow: `0 0 80px ${PURPLE}28, 0 -2px 0 rgba(255,255,255,0.06) inset, 0 32px 80px rgba(0,0,0,0.8)`,
        border: '1px solid rgba(255,255,255,0.09)',
        borderBottom: 'none',
      }}>
        {/* Camera notch row */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#1a1a1c',
            boxShadow: 'inset 0 0 3px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)',
          }} />
        </div>

        {/* Screen bezel */}
        <div className="macbook-screen" style={{
          background: '#050b14',
          borderRadius: 8,
          overflow: 'hidden',
          height: 320,
          border: '1px solid rgba(0,0,0,0.5)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
        }}>
          <AppScreen termLines={termLines} visibleConcepts={visibleConcepts} />
        </div>
      </div>

      {/* Hinge bar */}
      <div style={{
        height: 5,
        background: 'linear-gradient(180deg, #3a3a3c 0%, #2c2c2e 100%)',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }} />

      {/* Base / keyboard */}
      <div style={{
        background: 'linear-gradient(180deg, #2c2c2e 0%, #1c1c1e 100%)',
        borderRadius: '2px 2px 14px 14px',
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.07)',
        borderTop: 'none',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}>
        {/* Trackpad */}
        <div style={{
          width: 90, height: 18, borderRadius: 5,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }} />
      </div>
    </div>
  );
}

// ── Desktop-only gate: filhos só montam em telas ≥ lg (1024px). ───────────────
// No mobile renderiza null (sem hidratar), evitando trabalho de JS desnecessário.
function DesktopOnly({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setShow(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setShow(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return show ? <>{children}</> : null;
}

// ── Mobile-only gate: filhos só montam em telas < lg (1024px). ────────────────
// No desktop renderiza null (sem hidratar), evitando trabalho de JS desnecessário.
function MobileOnly({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setShow(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setShow(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return show ? <>{children}</> : null;
}

// ── Main HeroSection ──────────────────────────────────────────────────────────
export default function HeroSection() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ctaState, setCtaState] = useState<'idle' | 'loading'>('idle');

  // ── Shared terminal state (drives TerminalWidget + CommandCenterScreen) ──────
  const [termLines, setTermLines] = useState<string[]>([TERMINAL_LINES[0]]);
  const termIdxRef = useRef(1);

  // ── Shared concepts state (drives ConceptsWidget + CommandCenterScreen) ──────
  const [visibleConcepts, setVisibleConcepts] = useState([0, 1, 2]);

  // Single interval drives terminal ticker (1400ms)
  useEffect(() => {
    const iv = setInterval(() => {
      setTermLines((prev) => {
        const next = TERMINAL_LINES[termIdxRef.current % TERMINAL_LINES.length];
        termIdxRef.current += 1;
        return [...prev, next].slice(-5);
      });
    }, 1400);
    return () => clearInterval(iv);
  }, []);

  // Concepts rotate at 1800ms — separate ticker to keep phase independent
  useEffect(() => {
    const iv = setInterval(() => {
      setVisibleConcepts((prev) => {
        const next = (prev[prev.length - 1] + 1) % CONCEPTS.length;
        return [...prev.slice(1), next];
      });
    }, 1800);
    return () => clearInterval(iv);
  }, []);

  const handleCtaClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (ctaState === 'loading') return;
    setCtaState('loading');
    setTimeout(() => router.push('/quizz'), 820);
  }, [ctaState, router]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 45, damping: 18 });
  const smoothY = useSpring(mouseY, { stiffness: 45, damping: 18 });

  const tlX = useTransform(smoothX, [-0.5, 0.5], [-20, 20]);
  const tlY = useTransform(smoothY, [-0.5, 0.5], [-14, 14]);
  const blX = useTransform(smoothX, [-0.5, 0.5], [14, -14]);
  const blY = useTransform(smoothY, [-0.5, 0.5], [14, -14]);
  const trX = useTransform(smoothX, [-0.5, 0.5], [20, -20]);
  const trY = useTransform(smoothY, [-0.5, 0.5], [-14, 14]);
  const brX = useTransform(smoothX, [-0.5, 0.5], [-14, 14]);
  const brY = useTransform(smoothY, [-0.5, 0.5], [14, -14]);
  const nbX = useTransform(smoothX, [-0.5, 0.5], [-5, 5]);
  const nbY = useTransform(smoothY, [-0.5, 0.5], [-3, 3]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mouseX.set((e.clientX - r.left) / r.width - 0.5);
      mouseY.set((e.clientY - r.top) / r.height - 0.5);
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, [mouseX, mouseY]);

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden sm:min-h-screen"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        @media (max-width: 640px) {
          .macbook-screen { height: 220px !important; }
        }
        @keyframes satGlitch {
          0%   { clip-path: inset(0 0 0 0);     opacity: 0.5; transform: translateX(0); }
          15%  { clip-path: inset(20% 0 50% 0); opacity: 0.9; transform: translateX(1.5px); }
          30%  { clip-path: inset(55% 0 10% 0); opacity: 0.7; transform: translateX(-1.5px); }
          45%  { clip-path: inset(10% 0 40% 0); opacity: 1;   transform: translateX(0.5px); }
          60%  { clip-path: inset(0 0 0 0);     opacity: 0.85; transform: translateX(1px); }
          100% { clip-path: inset(0 0 0 0);     opacity: 1;   transform: translateX(0); }
        }
        .sat-glitch-in { animation: satGlitch 0.5s steps(3, end) 1; }
      `}</style>

      {/* ── Particles ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        {PARTICLES.map((p) => (
          <motion.span
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`, bottom: 0,
              width: p.size, height: p.size,
              background: PURPLE_L, opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 4}px ${PURPLE}80`,
            }}
            animate={{ y: [0, -900] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </div>

      {/* ── Main content ── */}
      <div className="relative" style={{ zIndex: 2 }}>

        {/* Headline block — renderiza visível no SSR (LCP) */}
        <div
          className="text-center px-4 sm:px-6 pt-0 sm:pt-14 pb-2 sm:pb-4 mx-auto"
          style={{ maxWidth: 820 }}
        >
          {/* Badge */}
          <div
            className="inline-flex flex-wrap justify-center items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full mb-4 sm:mb-8 text-[9px] sm:text-xs font-bold tracking-widest uppercase"
            style={{ background: 'rgba(0,255,115,0.08)', border: '1px solid rgba(0,255,115,0.28)', color: '#00FF73' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: '#00FF73' }} />
            PAINEL IA <span className="hidden sm:inline">INTELIGENTE</span> • TUTORES IA • <span className="hidden sm:inline">ENGENHARIA DE </span>RETENÇÃO
          </div>

          {/* Main headline — Extra Bold / Giant */}
          <h1
            className="font-black leading-none"
            style={{
              fontSize: 'clamp(1.7rem, 4.6vw, 3.5rem)',
              color: '#ffffff',
              letterSpacing: '-0.03em',
            }}
          >
            O app de{' '}
            <motion.span
              style={{ color: '#7C3AED' }}
              animate={{
                textShadow: [
                  '0 0 10px rgba(124,58,237,0.55), 0 0 28px rgba(124,58,237,0.28)',
                  '0 0 22px rgba(124,58,237,0.9),  0 0 55px rgba(124,58,237,0.45)',
                  '0 0 10px rgba(124,58,237,0.55), 0 0 28px rgba(124,58,237,0.28)',
                ],
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              Flashcards+IA
            </motion.span>
            {' '}que blinda a sua memória para o{' '}
            <motion.span
              style={{ color: '#00FF73' }}
              animate={{
                textShadow: [
                  '0 0 12px rgba(0,255,115,0.4),  0 0 32px rgba(0,255,115,0.2)',
                  '0 0 20px rgba(0,255,115,0.65), 0 0 55px rgba(0,255,115,0.3)',
                  '0 0 12px rgba(0,255,115,0.4),  0 0 32px rgba(0,255,115,0.2)',
                ],
              }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            >
              ENEM
            </motion.span>
            .
          </h1>
        </div>

        {/* ── Central scene ── */}
        <div className="relative mx-auto px-4 pb-2" style={{ maxWidth: 1160 }}>

          {/* SVG lines behind everything — desktop apenas */}
          <DesktopOnly>
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
              <ConnectionLines />
            </div>
          </DesktopOnly>

          <div
            className="relative flex items-center justify-center"
            style={{ minHeight: 'clamp(280px, 55vw, 540px)', zIndex: 1 }}
          >

            {/* TL — Arsenal de Revisão */}
            <DesktopOnly>
            <motion.div
              className="absolute hidden lg:block"
              style={{ left: 0, top: 30, x: tlX, y: tlY }}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <FloatWrapper delay={0} intensity={10}>
                <GlassCard className="w-60">
                  <div className="text-xs font-bold mb-3" style={{ color: PURPLE_L }}>
                    📚 Arsenal de Revisão
                  </div>
                  {[
                    { name: 'Biologia', pct: 78, color: '#34d399' },
                    { name: 'Química',  pct: 54, color: '#fb923c' },
                    { name: 'Física',   pct: 91, color: PURPLE_L  },
                  ].map((s) => (
                    <div key={s.name} className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.72)' }}>
                          {s.name}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                          style={{
                            background: `${s.color}1e`, color: s.color,
                            border: `1px solid ${s.color}48`,
                          }}
                        >
                          Revisão Pendente
                        </span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: s.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${s.pct}%` }}
                          transition={{ duration: 1.6, delay: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </GlassCard>
              </FloatWrapper>
            </motion.div>
            </DesktopOnly>

            {/* BL — AI Memory Engine (replaces Métricas de Retenção) */}
            <DesktopOnly>
            <motion.div
              className="absolute hidden lg:block"
              style={{ left: 0, bottom: 30, x: blX, y: blY }}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <FloatWrapper delay={1.4} intensity={8}>
                <TerminalWidget lines={termLines} />
              </FloatWrapper>
            </motion.div>
            </DesktopOnly>

            {/* MacBook center — desktop apenas */}
            <motion.div
              className="relative hidden lg:block"
              style={{ zIndex: 10, x: nbX, y: nbY, width: '100%', maxWidth: 560 }}
            >
              <MacBookMockup termLines={termLines} visibleConcepts={visibleConcepts} />
            </motion.div>

            {/* iPhone + satélites — mobile apenas. Container relativo p/ overlap. */}
            <div
              className="relative lg:hidden mx-auto -mt-6 -mb-6"
              style={{ width: '100%', maxWidth: 360, height: 500 }}
            >
              {/* linhas atrás de tudo */}
              <MobileOnly>
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                  <MobileConnectionLines />
                </div>
              </MobileOnly>
              {/* iPhone centro — visível no SSR (LCP no mobile) */}
              <div
                className="absolute left-1/2 top-1/2"
                style={{ transform: 'translate(-50%,-50%)', zIndex: 5 }}
              >
                <IPhoneMockup />
              </div>
              {/* satélites em overlap */}
              <MobileOnly>
                <MobileSatellites termLines={termLines} visibleConcepts={visibleConcepts} />
              </MobileOnly>
            </div>

            {/* TR — Agenda IA */}
            <DesktopOnly>
            <motion.div
              className="absolute hidden lg:block"
              style={{ right: 0, top: 30, x: trX, y: trY }}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <FloatWrapper delay={0.8} intensity={9}>
                <GlassCard className="w-60">
                  <div className="text-xs font-bold mb-3" style={{ color: PURPLE_L }}>
                    🤖 Agenda IA
                  </div>
                  {[
                    { time: '14:00', subject: 'Termodinâmica', icon: '⚛️' },
                    { time: '16:30', subject: 'Genética',       icon: '🧬' },
                    { time: '19:00', subject: 'Literatura',     icon: '📖' },
                  ].map((session) => (
                    <div key={session.time}
                      className="flex items-center gap-3 mb-2 p-2.5 rounded-xl"
                      style={{ background: `${PURPLE}12`, border: '1px solid rgba(124,58,237,0.18)' }}
                    >
                      <span className="text-xl">{session.icon}</span>
                      <div>
                        <div className="text-xs font-semibold" style={{ color: '#ffffff' }}>
                          {session.subject}
                        </div>
                        <div className="text-[10px]" style={{ color: PURPLE_L }}>
                          {session.time} · IA otimizada
                        </div>
                      </div>
                    </div>
                  ))}
                </GlassCard>
              </FloatWrapper>
            </motion.div>
            </DesktopOnly>

            {/* BR — Conceitos Blindados */}
            <DesktopOnly>
            <motion.div
              className="absolute hidden lg:block"
              style={{ right: 0, bottom: 30, x: brX, y: brY }}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <FloatWrapper delay={2} intensity={11}>
                <GlassCard className="w-56">
                  <div className="text-xs font-bold mb-3" style={{ color: PURPLE_L }}>
                    🔒 Conceitos Blindados
                  </div>
                  <ConceptsWidget visible={visibleConcepts} />
                </GlassCard>
              </FloatWrapper>
            </motion.div>
            </DesktopOnly>
          </div>

        </div>

        {/* Subheadline + CTA */}
        <motion.div
          className="text-center px-4 sm:px-6 pt-3 sm:pt-2 pb-8 sm:pb-12 mx-auto"
          style={{ maxWidth: 720 }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <p
            className="text-base sm:text-lg leading-relaxed mx-auto mb-6 sm:mb-10"
            style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 640 }}
          >
            Substitua horas de estudo passivo por um{' '}
            <span style={{ color: '#ffffff', fontWeight: 600 }}>
              sistema 100% automático
            </span>
            . Acesse +18k Flashcards Táticos, 15 Tutores IA, Corretor de Redação Ilimitado e seja aprovado estudando{' '}
            <span style={{ color: '#ffffff', fontWeight: 600 }}>
              apenas 15 minutos por dia
            </span>
            .
          </p>

          <div className="flex flex-col items-center gap-3">
            {/* ── Industrial High-Ticket CTA ── */}
            <style>{`
              @keyframes cta-scan {
                0%   { transform: translateX(-110%) skewX(-12deg); opacity: 0; }
                15%  { opacity: 0.55; }
                85%  { opacity: 0.55; }
                100% { transform: translateX(210%) skewX(-12deg); opacity: 0; }
              }
              @keyframes cta-pulse-border {
                0%, 100% { box-shadow: 0 0 0px #a855f7, 0 0 18px #a855f730, inset 0 0 0px #a855f700; }
                50%      { box-shadow: 0 0 14px #a855f7, 0 0 32px #a855f755, inset 0 0 8px #a855f715; }
              }
              @keyframes hero-shimmer {
                0%   { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
              .cta-scan-btn { animation: cta-pulse-border 2.8s ease-in-out infinite; }
              .cta-scan-btn:hover .cta-scan-line { animation: cta-scan 0.55s ease-in-out; }
              .cta-scan-btn.loading-state { animation: none; opacity: 0.7; cursor: not-allowed; }
              @media (max-width: 639px) {
                .cta-scan-btn { animation: none !important; box-shadow: 0 0 40px #00ff8050, 0 4px 24px #00ff8030 !important; }
                .cta-scan-line { display: none; }
                .cta-shimmer { animation: hero-shimmer 2.4s infinite; }
              }
              @media (min-width: 640px) {
                .cta-shimmer { display: none; }
              }
            `}</style>
            <button
              onClick={handleCtaClick}
              className={`cta-scan-btn relative flex sm:inline-flex w-full sm:w-auto justify-center items-center gap-2 sm:gap-3 overflow-hidden px-6 sm:px-10 py-4 sm:py-4 text-sm sm:text-sm uppercase tracking-widest transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]${ctaState === 'loading' ? ' loading-state' : ''}`}
              style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                fontWeight: 900,
                color: '#000000',
                background: `linear-gradient(135deg, ${NEON_G} 0%, #00cc5a 100%)`,
                border: 'none',
                borderRadius: '16px',
                boxShadow: `0 0 50px ${NEON_G}55, 0 10px 36px rgba(0,0,0,0.45)`,
              }}
              disabled={ctaState === 'loading'}
            >
              {/* shimmer — mobile only */}
              <span
                className="cta-shimmer pointer-events-none absolute inset-0"
                style={{
                  background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
                }}
              />
              {/* scan line — desktop only */}
              <span
                className="cta-scan-line pointer-events-none absolute inset-y-0 w-12"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.25), transparent)',
                  left: 0,
                }}
              />
              {/* icon: waveform / activity */}
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ color: '#000000', flexShrink: 0 }}
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              {ctaState === 'loading' ? '[ ACESSANDO NÚCLEO... ]' : 'QUERO COMEÇAR AGORA'}
            </button>

            {/* micro-copy terminal */}
            <p
              style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                fontSize: '10px',
                letterSpacing: '0.04em',
                color: 'rgba(255,255,255,0.45)',
                lineHeight: 1.5,
              }}
            >
              Diagnóstico 100% grátis | Raio-X de Memória IA em 3 min
            </p>
          </div>
        </motion.div>

        {/* Avatar group — aprovados */}
        <div className="relative mx-auto px-4 pb-0 sm:pb-24" style={{ maxWidth: 1160 }}>
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center">
                {[
                  '/images/ana.med.ufpe.avif',
                  '/images/carlos.eng.usp.avif',
                  '/images/beatriz.dir.avif',
                  '/images/lucas.eng.ita.avif',
                  '/images/rafaela.medvet.avif',
                  '/images/sofia-usp.avif',
                  '/images/juliomed-ufrj.avif',
                ].map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt=""
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #060a14',
                      marginLeft: i === 0 ? 0 : -12,
                      position: 'relative',
                      zIndex: i,
                      display: 'block',
                    }}
                  />
                ))}
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                +8.000 aprovados no ENEM
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

