'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// ─── Design tokens ─────────────────────────────────────────────────────────
const NEON   = '#00FF73';
const VIOLET = '#7C3AED';

// ─── Timing ────────────────────────────────────────────────────────────────
const CYCLE_DELAY_MS  = 5_000;
const MANUAL_PAUSE_MS = 30_000;

// ─── Avatar helper ───────────────────────────────────────────────────────────
const av = (seed: string, _params?: string) => `/images/avatars/${seed}.svg`;

// ─── Ring constants ──────────────────────────────────────────────────────────
const RING_R = 30;
const RING_C = 2 * Math.PI * RING_R;

// ─── Types ───────────────────────────────────────────────────────────────────
interface AgentDef {
  id:        string;
  codename:  string;
  specialty: string;
  focus:     string;
  color:     string;
  avatar:    string;
  userMsg:   string;
  agentMsg:  string;
  tip:       string;
}

// ─── Agent roster — Engenharia de Aprovação ──────────────────────────────────
const AGENTS: AgentDef[] = [
  {
    id:        'norma',
    codename:  'NORMA',
    specialty: 'Engenharia de Persuasão',
    focus:     'Dissecação de teses e blindagem textual.',
    color:     VIOLET,
    avatar:    '/images/tutor-redacao.avif',
    userMsg:   'Como subo minha nota de Redação de 600 para 1000?',
    agentMsg:  'Não passo a mão na cabeça. Você erra nos mesmos 3 pontos: coesão fraca, proposta de intervenção genérica e introdução sem gancho. Cada um desses te custa 40 pontos. Corrija os 3 e o 1000 é consequência — não sorte.',
    tip:       'Diagnóstico preciso antes de correção. Foca no padrão de erro.',
  },
  {
    id:        'vektor',
    codename:  'VEKTOR',
    specialty: 'Otimização de Sistemas Físicos',
    focus:     'Vetores de impacto e termodinâmica aplicada.',
    color:     '#f97316',
    avatar:    '/images/tutor-fisica.avif',
    userMsg:   'Preciso entender MRU e MRUV antes da prova.',
    agentMsg:  'Menos conversa, mais vetores. MRU: v = s/t. Fim. MRUV: v = v₀ + at e s = v₀t + ½at². Plug and play. Memoriza as 2 equações e você resolve 80% das questões de cinemática.',
    tip:       'As 2 equações do MRUV cobrem quase tudo no ENEM.',
  },
  {
    id:        'chronos',
    codename:  'CHRONOS',
    specialty: 'Mapeamento de Ciclos de Poder',
    focus:     'Análise de causalidade e rupturas sócio-políticas.',
    color:     '#a78bfa',
    avatar:    '/images/tutor-historia.avif',
    userMsg:   'Era Vargas confunde. Como diferencio os 3 períodos?',
    agentMsg:  '3 fases, 3 lógicas. ① 1930-37: poder provisório, jogo político. ② 1937-45: Estado Novo = ditadura + DIP + censura. ③ 1951-54: volta democrática, suicídio como ato político. O ENEM ama comparar as três.',
    tip:       'Domine as características de cada fase e nunca mais confunde.',
  },
  {
    id:        'atlas',
    codename:  'ATLAS',
    specialty: 'Dinâmicas de Espaço e Geopolítica',
    focus:     'Análise sistêmica de biomas e fluxos globais de poder.',
    color:     '#34d399',
    avatar:    '/images/tutor-geografia.avif',
    userMsg:   'Nunca lembro os 6 biomas brasileiros na prova.',
    agentMsg:  'Ancora em característica única. Amazônia = densa, úmida, maior. Cerrado = raízes profundas pra seca. Caatinga = xerófita. Mata Atlântica = costeira, fragmentada. Pampa = subtropical. Pantanal = maior planície alagável.',
    tip:       'O ENEM cruza bioma + clima + solo. Aprenda o trio, não o isolado.',
  },
  {
    id:        'atomo',
    codename:  'ÁTOMO',
    specialty: 'Reatividade e Equilíbrio',
    focus:     'Estequiometria avançada e engenharia molecular.',
    color:     '#06b6d4',
    avatar:    '/images/tutor-quimica.avif',
    userMsg:   'Estequiometria sempre me trava na hora H.',
    agentMsg:  '3 passos. ① Equação balanceada — coeficiente = proporção em mol. ② Regra de 3 com massas molares (H=1, O=16, C=12). ③ Confere unidade — se pedir gramas, multiplica pelo peso molecular.',
    tip:       'Coeficiente = proporção = regra de 3. Nunca mude esse fluxo.',
  },
  {
    id:        'pi',
    codename:  'PI',
    specialty: 'Lógica Analítica',
    focus:     'Geometria de precisão e padrões estatísticos.',
    color:     NEON,
    avatar:    '/images/tutor-matematica.avif',
    userMsg:   'Quando delta é negativo, o que acontece com a função?',
    agentMsg:  'Delta < 0 = sem raízes reais = parábola não toca o eixo x. Delta = 0 = uma raiz. Delta > 0 = duas raízes. Fluxo: calcula delta → classifica → decide o caminho. Sempre esse fluxo.',
    tip:       'O ENEM ama delta em contexto (lucro, área, trajetória). O raciocínio é sempre igual.',
  },
  {
    id:        'bio',
    codename:  'BIO',
    specialty: 'Sistemas Vivos e Evolução',
    focus:     'Genética molecular e ecossistemas complexos.',
    color:     '#22c55e',
    avatar:    '/images/tutor-biologia.avif',
    userMsg:   'Fotossíntese parece complexo demais pra memorizar.',
    agentMsg:  'Imagina a folha como uma fábrica solar. Sol = energia da tomada. CO₂ = matéria-prima pela janela. H₂O = correia transportadora. Glicose = produto na esteira. A planta só juntou sol + gás + água e fabricou açúcar.',
    tip:       'Analogia resolve mais rápido que decoreba. O ENEM ama lógica de processo.',
  },
  {
    id:        'sintaxe',
    codename:  'SINTAXE',
    specialty: 'Decodificação Textual',
    focus:     'Argumentação, interpretação e semiótica.',
    color:     '#f59e0b',
    avatar:    av('ProfSintaxe'),
    userMsg:   'Interpretação de texto — sempre erro nas alternativas finais.',
    agentMsg:  'O ENEM não testa leitura — testa argumentação. Antes das alternativas, responde em uma frase qual a ideia central. Com essa âncora, as alternativas erradas se eliminam sozinhas. Você não lê o texto — você o interroga.',
    tip:       'Tese antes de alternativa. Sempre. Sem exceção.',
  },
  {
    id:        'praxis',
    codename:  'PRÁXIS',
    specialty: 'Sistemas de Pensamento Crítico',
    focus:     'Filosofia aplicada e ética como argumento.',
    color:     '#e879f9',
    avatar:    av('ProfPraxis'),
    userMsg:   'Filosofia no ENEM é só decoreba de filósofo?',
    agentMsg:  'Não. O ENEM usa Filosofia como lente crítica. Kant: separa fenômeno do noumeno. Rousseau: o homem é bom, a sociedade o corrompe. Cada filósofo é uma lente — o ENEM pede que você a aplique em situações reais.',
    tip:       'Filósofo = lente de análise. O ENEM dá o contexto, você aplica a lente certa.',
  },
  {
    id:        'nexus',
    codename:  'NEXUS',
    specialty: 'Dinâmicas de Estratificação Social',
    focus:     'Movimentos sociais e estruturas de poder.',
    color:     '#60a5fa',
    avatar:    av('ProfNexus'),
    userMsg:   'Como abordar questões de Sociologia no ENEM?',
    agentMsg:  'Sociologia no ENEM é sempre: identifique o fenômeno → localize no contexto → aplique o conceito. Durkheim = coesão social. Weber = dominação. Marx = conflito de classes. O enunciado sempre pede o conceito certo pra situação certa.',
    tip:       'Mapeie: fenômeno → teórico → conceito. Essa é a equação da Sociologia no ENEM.',
  },
  {
    id:        'vanguarda',
    codename:  'VANGUARDA',
    specialty: 'Linguagem Visual e Cultura',
    focus:     'Leitura de imagem e manifestos artísticos.',
    color:     '#fb7185',
    avatar:    av('MsVanguarda'),
    userMsg:   'Como o ENEM cobra Artes? Parece impossível estudar.',
    agentMsg:  'Artes no ENEM é leitura de imagem + contexto histórico. Movimento artístico + o que ele representa politicamente. Uma tela não é decoração — é manifesto. Modernismo de 22? Ruptura com o academicismo, afirmação da identidade nacional.',
    tip:       'Lê cada obra como texto com argumento. Contexto histórico é sempre a chave.',
  },
  {
    id:        'soneto',
    codename:  'SONETO',
    specialty: 'Literatura e Intertextualidade',
    focus:     'Análise de obras e escolas literárias.',
    color:     '#818cf8',
    avatar:    av('SrtaSoneto'),
    userMsg:   'Como estudo Literatura pra cair no ENEM?',
    agentMsg:  'O ENEM cobra contexto, não decoreba de obra. Romantismo = idealização + nacionalismo. Realismo = crítica social + ironia. Modernismo = ruptura + identidade. Lê trechos curtos e identifica o movimento pelo tom — isso resolve 90% das questões.',
    tip:       'Tom + vocabulário = movimento literário. O trecho sempre entrega a resposta.',
  },
  {
    id:        'link',
    codename:  'LINK',
    specialty: 'Decodificação de Texto em Inglês',
    focus:     'Leitura estratégica e falsos cognatos.',
    color:     '#38bdf8',
    avatar:    av('TeacherLink'),
    userMsg:   'Nunca sei o que fazer com textos em inglês na prova.',
    agentMsg:  'Regra de ouro: você não precisa entender tudo. O ENEM testa leitura, não tradução. Primeiro, leia a pergunta. Depois, caça no texto as palavras-chave da pergunta. A resposta está no texto — só precisa saber onde olhar.',
    tip:       'Pergunta → palavras-chave → localiza no texto. Esse fluxo resolve 80% das questões.',
  },
  {
    id:        'sol',
    codename:  'SOL',
    specialty: 'Decodificação de Texto em Espanhol',
    focus:     'Contexto, falsos amigos e leitura.',
    color:     '#fbbf24',
    avatar:    av('ProfaSol'),
    userMsg:   'Espanhol parece fácil mas sempre erro por confundir com português.',
    agentMsg:  'Exatamente aí está a armadilha. "Embarazada" = grávida, não embaraçada. "Borracha" = bêbada, não borracha. O espanhol parece próximo mas tem minas espalhadas. Regra: sempre confirma pelo contexto antes de confiar na aparência da palavra.',
    tip:       'Falso amigo é a armadilha número 1. Contexto sempre vence aparência.',
  },
  {
    id:        'mundi',
    codename:  'MUNDI',
    specialty: 'Análise do Mundo Contemporâneo',
    focus:     'Geopolítica, fatos e contexto ENEM.',
    color:     '#a3e635',
    avatar:    av('DrMundi'),
    userMsg:   'Como atualidades cai no ENEM? Preciso acompanhar tudo?',
    agentMsg:  'Não. O ENEM não cobra notícia — cobra conexão. Pega um tema atual (crise climática, conflito geopolítico) e conecta com conceitos das disciplinas. A pergunta real é: "o que esse fato revela sobre a sociedade/natureza/economia?". Sabe o conceito, você responde qualquer contexto.',
    tip:       'Fato atual = gancho. O conceito de base é sempre o que a questão mede.',
  },
];

// ─── Mono style helper ───────────────────────────────────────────────────────
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace" };

// ─── Typing dots ─────────────────────────────────────────────────────────────
function TypingDots({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="block w-2 h-2 rounded-full"
          style={{ background: color }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.14, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── Agent Card (Command Rail) ────────────────────────────────────────────────
function AgentCard({ agent, isActive, ringActive, ringKey, onClick }: {
  agent:      AgentDef;
  isActive:   boolean;
  ringActive: boolean;
  ringKey:    number;
  onClick:    () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      aria-label={`Selecionar agente ${agent.codename}`}
      className="relative flex flex-col items-center shrink-0 rounded-2xl cursor-pointer select-none"
      style={{
        minWidth: 108,
        padding: '14px 12px 12px',
        background: isActive
          ? `linear-gradient(145deg, ${agent.color}14 0%, ${agent.color}06 100%)`
          : 'rgba(255,255,255,0.02)',
        border: `0.5px solid ${isActive ? agent.color + '80' : 'rgba(255,255,255,0.07)'}`,
        transition: 'border-color 0.25s, background 0.25s',
      }}
      animate={{ scale: isActive ? 1.045 : 1 }}
      whileHover={{ scale: isActive ? 1.045 : 1.025 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {/* Hairline top shimmer when active */}
      {isActive && (
        <motion.div
          className="absolute inset-x-0 top-0 h-px rounded-full pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${agent.color}90, transparent)` }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Avatar with progress ring ── */}
      <div className="relative" style={{ width: 64, height: 64 }}>

        {/* Progress ring SVG */}
        {isActive && (
          <svg
            className="absolute inset-0 pointer-events-none"
            viewBox="0 0 64 64"
            width={64} height={64}
            style={{ transform: 'rotate(-90deg)', zIndex: 2 }}
          >
            <circle cx="32" cy="32" r={RING_R} fill="none" stroke={agent.color} strokeWidth="2" strokeOpacity="0.15" />
            <motion.circle
              key={`ring-${agent.id}-${ringKey}`}
              cx="32" cy="32" r={RING_R}
              fill="none" stroke={agent.color} strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={RING_C}
              initial={{ strokeDashoffset: RING_C }}
              animate={ringActive ? { strokeDashoffset: 0 } : { strokeDashoffset: RING_C }}
              transition={ringActive ? { duration: CYCLE_DELAY_MS / 1000, ease: 'linear' } : { duration: 0.2 }}
              style={{ filter: `drop-shadow(0 0 4px ${agent.color}90)` }}
            />
          </svg>
        )}

        {/* Pulse rings */}
        {isActive && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: `1px solid ${agent.color}55`, zIndex: 1 }}
              animate={{ opacity: [0.8, 0], scale: [0.88, 1.55] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: `1px solid ${agent.color}30`, zIndex: 1 }}
              animate={{ opacity: [0.5, 0], scale: [0.88, 1.85] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
            />
          </>
        )}

        {/* Avatar circle */}
        <motion.div
          className="absolute rounded-full overflow-hidden"
          style={{ inset: 4, background: '#0a0812', zIndex: 3 }}
          animate={{
            borderWidth: isActive ? '1.5px' : '1px',
            borderStyle: 'solid',
            borderColor: isActive ? agent.color : 'rgba(255,255,255,0.1)',
            boxShadow: isActive
              ? `0 0 16px ${agent.color}60, 0 0 32px ${agent.color}28`
              : '0 0 0 transparent',
          }}
          transition={{ duration: 0.28 }}
        >
          <Image
            src={agent.avatar}
            alt={agent.codename}
            width={56} height={56}
            className="w-full h-full object-cover"
            unoptimized
          />
          {/* Inner glow aura */}
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${agent.color}28 0%, transparent 72%)` }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </motion.div>
      </div>

      {/* Codename + READY badge */}
      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap justify-center">
        <p
          className="text-[11px] font-bold tracking-widest leading-none"
          style={{
            ...MONO,
            color: isActive ? '#fff' : 'rgba(255,255,255,0.38)',
          }}
        >
          {agent.codename}
        </p>
        <span
          className="text-[8px] font-bold px-1.5 py-0.5 rounded-sm leading-none"
          style={{
            ...MONO,
            background: isActive ? `${agent.color}22` : 'rgba(255,255,255,0.04)',
            color:      isActive ? agent.color : 'rgba(255,255,255,0.22)',
            border:     `0.5px solid ${isActive ? agent.color + '55' : 'rgba(255,255,255,0.08)'}`,
            letterSpacing: '0.04em',
          }}
        >
          ONLINE
        </span>
      </div>

      {/* Specs — fixed height, only opacity changes */}
      <div
        className="w-full mt-2 text-center"
        style={{ height: 34, transition: 'opacity 0.22s ease', opacity: isActive ? 1 : 0 }}
      >
        <p
          className="text-[9px] leading-snug truncate"
          style={{ ...MONO, color: agent.color + 'cc' }}
        >
          {agent.specialty}
        </p>
        <p
          className="text-[8px] leading-snug mt-0.5"
          style={{ ...MONO, color: 'rgba(255,255,255,0.32)', whiteSpace: 'normal' }}
        >
          {agent.focus}
        </p>
      </div>
    </motion.button>
  );
}

// ─── Command Rail ─────────────────────────────────────────────────────────────
function CommandRail({ agents, activeId, onSelect, ringActive, ringKey }: {
  agents:     AgentDef[];
  activeId:   string;
  onSelect:   (id: string) => void;
  ringActive: boolean;
  ringKey:    number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState({ x: 0, y: 0, visible: false });
  const activeAgent = agents.find(a => a.id === activeId)!;

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    setSpot({ x: e.clientX - r.left, y: e.clientY - r.top, visible: true });
  }, []);

  const onMouseLeave = useCallback(() => setSpot(s => ({ ...s, visible: false })), []);

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl mb-5 overflow-hidden"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        background:         'rgba(9,9,11,0.92)',
        border:             '0.5px solid rgba(255,255,255,0.06)',
        padding:            '14px 16px',
      }}
    >
      {/* Spotlight glow following cursor */}
      <AnimatePresence>
        {spot.visible && (
          <motion.div
            className="absolute pointer-events-none"
            style={{ inset: 0, zIndex: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(220px circle at ${spot.x}px ${spot.y}px, ${activeAgent.color}18, transparent 70%)`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rail label */}
      <div className="flex items-center gap-2 mb-3 relative" style={{ zIndex: 1 }}>
        <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: activeAgent.color }} />
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase" style={{ ...MONO, color: 'rgba(255,255,255,0.25)' }}>
          · Selecione o Agente
        </p>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <p className="text-[9px]" style={{ ...MONO, color: activeAgent.color + '99' }}>
          [ONLINE]
        </p>
      </div>

      {/* Scrollable cards */}
      <div
        className="flex gap-3 overflow-x-auto relative pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', zIndex: 1 }}
      >
        {agents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            isActive={agent.id === activeId}
            ringActive={ringActive && agent.id === activeId}
            ringKey={ringKey}
            onClick={() => onSelect(agent.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AiTutorsSection() {
  const [activeId,    setActiveId]    = useState(AGENTS[0].id);
  // 0=blank  1=user msg  2=typing  3=reply  4=tip+idle
  const [phase,       setPhase]       = useState(0);
  const [autoCycling, setAutoCycling] = useState(true);
  const [ringKey,     setRingKey]     = useState(0);

  const pauseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (pauseRef.current) clearTimeout(pauseRef.current); };
  }, []);

  // ── Chat animation phases ──────────────────────────────────────────────────
  useEffect(() => {
    setPhase(0);
    setRingKey(k => k + 1);
    const t1 = setTimeout(() => setPhase(1), 350);
    const t2 = setTimeout(() => setPhase(2), 1700);
    const t3 = setTimeout(() => setPhase(3), 3600);
    const t4 = setTimeout(() => setPhase(4), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [activeId]);

  // ── Auto-cycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoCycling || phase < 4) return;
    const idx  = AGENTS.findIndex(a => a.id === activeId);
    const next = AGENTS[(idx + 1) % AGENTS.length];
    const t    = setTimeout(() => setActiveId(next.id), CYCLE_DELAY_MS);
    return () => clearTimeout(t);
  }, [phase, autoCycling, activeId]);

  // ── Manual selection ───────────────────────────────────────────────────────
  function selectAgent(id: string) {
    if (id === activeId) return;
    setAutoCycling(false);
    if (pauseRef.current) clearTimeout(pauseRef.current);
    pauseRef.current = setTimeout(() => setAutoCycling(true), MANUAL_PAUSE_MS);
    setActiveId(id);
  }

  const agent      = AGENTS.find(a => a.id === activeId)!;
  const ringActive = autoCycling && phase >= 4;

  return (
    <section className="max-w-4xl mx-auto px-5 sm:px-10 pb-24">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="text-center mb-8">
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: VIOLET }}>
          NÚCLEO ORÁCULO
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
          <span className="sm:hidden">
            <span style={{ color: '#00FF73' }}>Comando Tático</span>{' '}24/7
          </span>
          <span className="hidden sm:inline">O seu Comando Tático 24/7</span>
        </h2>
        <p className="text-slate-500 text-base max-w-xl mx-auto">
          Tire dúvidas com os{' '}
          <span className="font-bold text-white">'Mestres do ENEM'</span>.{' '}
          Nossa{' '}
          <span className="font-bold text-white">Rede Neural de 15 agentes especializados</span>{' '}
          com banco de dados focado no ENEM.
        </p>
      </div>

      {/* ── Command Rail ─────────────────────────────────────────── */}
      <CommandRail
        agents={AGENTS}
        activeId={activeId}
        onSelect={selectAgent}
        ringActive={ringActive}
        ringKey={ringKey}
      />

      {/* ── Chat container ───────────────────────────────────────── */}
      <motion.div
        className="relative rounded-3xl overflow-hidden flex flex-col"
        animate={{
          borderColor: `${agent.color}30`,
          boxShadow:   `0 0 48px ${agent.color}14, 0 0 0 0.5px ${agent.color}18`,
        }}
        transition={{ duration: 0.4 }}
        style={{
          height:               440,
          background:           'rgba(9,9,11,0.92)',
          border:               '0.5px solid transparent',
        }}
      >
        {/* Shimmer top line */}
        <motion.div
          className="absolute inset-x-0 top-0 h-px"
          animate={{ background: `linear-gradient(90deg, transparent, ${agent.color}70, transparent)` }}
          transition={{ duration: 0.4 }}
        />

        {/* Chat header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <div
            className="w-10 h-10 rounded-full overflow-hidden shrink-0"
            style={{ background: '#0a0812', border: `0.5px solid ${agent.color}55` }}
          >
            <Image src={agent.avatar} alt={agent.codename} width={40} height={40} className="w-full h-full object-cover" unoptimized />
          </div>
          <div>
            <p className="text-white font-bold text-sm">
              <span style={MONO}>{agent.codename}</span>
              <span className="text-slate-500 font-normal mx-1.5">·</span>
              <span className="text-slate-400 font-normal text-xs" style={MONO}>{agent.specialty}</span>
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: agent.color }}
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
              <span className="text-slate-600 text-xs" style={MONO}>{agent.focus}</span>
            </div>
          </div>

          {/* Manual pause pill */}
          {!autoCycling && (
            <motion.div
              className="ml-auto flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.28)',
                border: '0.5px solid rgba(255,255,255,0.08)',
                ...MONO,
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              ⏸ manual
            </motion.div>
          )}
        </div>

        {/* Messages area */}
        <div className="px-5 py-6 flex flex-col gap-4 flex-1 overflow-hidden">
          <AnimatePresence mode="popLayout">

            {/* User message */}
            {phase >= 1 && (
              <motion.div
                key={`user-${activeId}`}
                className="flex justify-end"
                initial={{ opacity: 0, x: 24, scale: 0.96 }}
                animate={{ opacity: 1, x: 0,  scale: 1 }}
                exit={{    opacity: 0, x: 16,  scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <div
                  className="max-w-xs sm:max-w-sm rounded-2xl rounded-tr-sm px-4 py-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)',
                    border: '0.5px solid rgba(255,255,255,0.10)',
                  }}
                >
                  <p className="text-slate-300 text-sm leading-relaxed">{agent.userMsg}</p>
                  <p className="text-slate-700 text-xs mt-1.5 text-right">Você · agora</p>
                </div>
              </motion.div>
            )}

            {/* Typing indicator */}
            {phase === 2 && (
              <motion.div
                key={`typing-${activeId}`}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10, transition: { duration: 0.18 } }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 mt-0.5"
                  style={{ border: `0.5px solid ${agent.color}40`, background: '#0a0812' }}>
                  <Image src={agent.avatar} alt="" width={36} height={36} className="w-full h-full object-cover" unoptimized />
                </div>
                <div
                  className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3"
                  style={{
                    background: `linear-gradient(135deg, ${agent.color}1a 0%, ${agent.color}08 100%)`,
                    border: `0.5px solid ${agent.color}28`,
                  }}
                >
                  <TypingDots color={agent.color} />
                  <span className="text-slate-500 text-xs" style={MONO}>{agent.codename} processando…</span>
                </div>
              </motion.div>
            )}

            {/* Agent response */}
            {phase >= 3 && (
              <motion.div
                key={`reply-${activeId}`}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -20, scale: 0.97 }}
                animate={{ opacity: 1, x: 0,   scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.38, ease: 'easeOut' }}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 mt-0.5"
                  style={{ border: `0.5px solid ${agent.color}40`, background: '#0a0812' }}>
                  <Image src={agent.avatar} alt="" width={36} height={36} className="w-full h-full object-cover" unoptimized />
                </div>
                <div
                  className="max-w-xs sm:max-w-md rounded-2xl rounded-tl-sm px-4 py-3"
                  style={{
                    background: `linear-gradient(135deg, ${agent.color}1c 0%, ${agent.color}08 100%)`,
                    border: `0.5px solid ${agent.color}30`,
                  }}
                >
                  <p className="text-white text-sm leading-relaxed">{agent.agentMsg}</p>

                  {/* Tip card */}
                  <AnimatePresence>
                    {phase >= 4 && (
                      <motion.div
                        key={`tip-${activeId}`}
                        className="mt-3 px-3 py-2 rounded-xl text-xs"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: `0.5px solid ${agent.color}22`,
                        }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                      >
                        <span className="font-bold" style={{ color: agent.color }}>⚡ Operação ENEM:</span>
                        <span className="text-slate-400 ml-1">{agent.tip}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <p className="text-slate-700 text-xs mt-2" style={MONO}>{agent.codename} · agora</p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Decorative input bar */}
        <div className="px-5 pb-5">
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '0.5px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="flex-1" />
            <motion.div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: `${agent.color}20`, border: `0.5px solid ${agent.color}50` }}
              animate={{ boxShadow: [`0 0 6px ${agent.color}30`, `0 0 14px ${agent.color}60`, `0 0 6px ${agent.color}30`] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M7 3l3 3-3 3" stroke={agent.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
