'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// ─── Design tokens ─────────────────────────────────────────────────────────
const NEON   = '#00FF73';
const VIOLET = '#7C3AED';

// ─── Avatar factory ─────────────────────────────────────────────────────────
function av(seed: string, extra = '') {
  return `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}&backgroundColor=0d0a1e${extra ? '&' + extra : ''}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface TutorDef {
  id:         string;
  name:       string;
  subject:    string;
  color:      string;
  avatar:     string;
  statusText: string;
  userMsg:    string;
  tutorMsg:   string;
  tip:        string;
}

// ─── Tutor roster ────────────────────────────────────────────────────────────
const TUTORS: TutorDef[] = [
  {
    id:         'norma',
    name:       'Prof. Norma',
    subject:    'Redação',
    color:      VIOLET,
    avatar:     av('ProfNorma', 'hair=variant19&earrings=variant02'),
    statusText: 'Corrigindo sua estrutura textual',
    userMsg:    'Como subo minha nota de Redação de 600 para 1000?',
    tutorMsg:   'Não passo a mão na cabeça. Você erra nos mesmos 3 pontos: coesão fraca, proposta de intervenção genérica e introdução sem gancho. Cada um desses te custa 40 pontos. Corrija os 3 e o 1000 é consequência — não sorte.',
    tip:        'Foca em transformar um 600 em 1000. Diagnóstico preciso antes de correção.',
  },
  {
    id:         'bio',
    name:       'Dr. Bio',
    subject:    'Biologia',
    color:      '#22c55e',
    avatar:     av('DrBioENEM', 'hair=variant04'),
    statusText: 'Decodificando processos celulares',
    userMsg:    'Fotossíntese parece complexo demais pra memorizar.',
    tutorMsg:   'Imagina a folha como uma fábrica solar. Sol = energia da tomada. CO₂ = matéria-prima pela janela. H₂O = correia transportadora. Glicose = produto na esteira. A planta só juntou sol + gás + água e fabricou açúcar.',
    tip:        'Analogia resolve mais rápido que decoreba. O ENEM ama lógica de processo.',
  },
  {
    id:         'newton',
    name:       'Mestre Newton',
    subject:    'Física',
    color:      '#f97316',
    avatar:     av('MestreNewtonFis', 'hair=variant09&glasses=variant01'),
    statusText: 'Calculando vetores em tempo real',
    userMsg:    'Preciso entender MRU e MRUV antes da prova.',
    tutorMsg:   'Menos conversa, mais vetores. MRU: v = s/t. Fim. MRUV: v = v₀ + at e s = v₀t + ½at². Plug and play. Memoriza as 2 equações e você resolve 80% das questões de cinemática.',
    tip:        'Direto ao ponto: as 2 equações do MRUV cobrem quase tudo no ENEM.',
  },
  {
    id:         'atomo',
    name:       'Prof. Átomo',
    subject:    'Química',
    color:      '#06b6d4',
    avatar:     av('ProfAtomoQuim', 'hair=variant07&glasses=variant02'),
    statusText: 'Balanceando equações químicas',
    userMsg:    'Estequiometria sempre me trava na hora H.',
    tutorMsg:   '3 passos. ① Equação balanceada — coeficiente = proporção em mol. ② Regra de 3 com massas molares (H=1, O=16, C=12). ③ Confere unidade — se pedir gramas, multiplica pelo peso molecular.',
    tip:        'Coeficiente = proporção = regra de 3. Nunca mude esse fluxo.',
  },
  {
    id:         'pi',
    name:       'Mestre Pi',
    subject:    'Matemática',
    color:      NEON,
    avatar:     av('MestrePiMat', 'hair=variant11'),
    statusText: 'Dominando funções e inequações',
    userMsg:    'Quando delta é negativo, o que acontece com a função?',
    tutorMsg:   'Delta < 0 = sem raízes reais = parábola não toca o eixo x. Delta = 0 = uma raiz. Delta > 0 = duas raízes. Fluxo: calcula delta → classifica → decide o caminho. Sempre esse fluxo.',
    tip:        'O ENEM ama delta em contexto (lucro, área, trajetória). O raciocínio é sempre igual.',
  },
  {
    id:         'chronos',
    name:       'Dr. Chronos',
    subject:    'História',
    color:      '#a78bfa',
    avatar:     av('DrChronos', 'hair=variant02&beard=variant01'),
    statusText: 'Mapeando os eixos do tempo',
    userMsg:    'Era Vargas confunde. Como diferencio os 3 períodos?',
    tutorMsg:   '3 fases, 3 lógicas. ① 1930-37: poder provisório, jogo político. ② 1937-45: Estado Novo = ditadura + DIP + censura + Constituição de 37. ③ 1951-54: volta democrática, suicídio como ato político. O ENEM ama comparar as três.',
    tip:        'Domine as características de cada fase e nunca mais confunde.',
  },
  {
    id:         'atlas',
    name:       'Dr. Atlas',
    subject:    'Geografia',
    color:      '#34d399',
    avatar:     av('DrAtlasGeo', 'hair=variant06'),
    statusText: 'Analisando territórios e climas',
    userMsg:    'Nunca lembro os 6 biomas brasileiros na prova.',
    tutorMsg:   'Ancora em característica única. Amazônia = densa, úmida, maior. Cerrado = raízes profundas pra seca. Caatinga = xerófita. Mata Atlântica = costeira, fragmentada. Pampa = subtropical. Pantanal = maior planície alagável.',
    tip:        'O ENEM cruza bioma + clima + solo. Aprenda o trio, não o isolado.',
  },
  {
    id:         'sintaxe',
    name:       'Prof. Sintaxe',
    subject:    'Linguagens',
    color:      '#f59e0b',
    avatar:     av('ProfSintaxeLing', 'hair=variant05&glasses=variant01'),
    statusText: 'Decodificando argumentos textuais',
    userMsg:    'Interpretação de texto — sempre erro nas alternativas finais.',
    tutorMsg:   'O ENEM não testa leitura — testa argumentação. Antes das alternativas, responde em uma frase qual a ideia central. Com essa âncora, as alternativas erradas se eliminam sozinhas. Você não lê o texto — você o interroga.',
    tip:        'Tese antes de alternativa. Sempre. Sem exceção.',
  },
  {
    id:         'agora',
    name:       'Mestra Ágora',
    subject:    'Filosofia',
    color:      '#e879f9',
    avatar:     av('MestraAgora', 'hair=variant20&earrings=variant01'),
    statusText: 'Tecendo o pensamento crítico',
    userMsg:    'Filosofia no ENEM é só decoreba de filósofo?',
    tutorMsg:   'Não. O ENEM usa Filosofia como lente crítica. Kant: separa fenômeno (o que você vê) de noumeno (o real). Rousseau: o homem é bom, a sociedade o corrompe. Cada filósofo é uma lente — o ENEM pede que você aplique em situações reais.',
    tip:        'Filósofo = lente de análise. O ENEM dá o contexto, você aplica a lente certa.',
  },
  {
    id:         'vanguarda',
    name:       'Sr. Vanguarda',
    subject:    'Artes',
    color:      '#fb7185',
    avatar:     av('SrVanguardaArte', 'hair=variant08&glasses=variant03'),
    statusText: 'Lendo imagens e movimentos artísticos',
    userMsg:    'Como o ENEM cobra Artes? Parece impossível estudar.',
    tutorMsg:   'Artes no ENEM é leitura de imagem + contexto histórico. Movimento artístico + o que ele representa politicamente. Uma tela não é decoração — é manifesto. Modernismo de 22? Ruptura com o academicismo, afirmação da identidade nacional.',
    tip:        'Lê cada obra como um texto com argumento. Contexto histórico é sempre a chave.',
  },
];

// ─── Typing animation ────────────────────────────────────────────────────────
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

// ─── Avatar circle ────────────────────────────────────────────────────────────
function TutorAvatar({ tutor, isActive, onClick }: {
  tutor: TutorDef;
  isActive: boolean;
  onClick: () => void;
}) {
  const lastName = tutor.name.split(' ').slice(-1)[0];
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 shrink-0 transition-all duration-200"
      style={{ minWidth: 72, minHeight: 56 }}
      aria-label={`Selecionar ${tutor.name}`}
    >
      <motion.div
        className="relative w-14 h-14 rounded-full overflow-hidden"
        animate={{
          borderColor: isActive ? tutor.color : 'rgba(255,255,255,0.1)',
          boxShadow: isActive ? `0 0 18px ${tutor.color}55` : '0 0 0px transparent',
        }}
        transition={{ duration: 0.25 }}
        style={{ border: `2px solid rgba(255,255,255,0.1)`, background: '#0d0a1e' }}
      >
        <Image
          src={tutor.avatar}
          alt={tutor.name}
          width={56}
          height={56}
          className="w-full h-full object-cover"
          unoptimized
        />
        {/* Active aura — inner glow + two expanding rings */}
        {isActive && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ boxShadow: `0 0 0 3px ${tutor.color}50, 0 0 22px ${tutor.color}70, 0 0 44px ${tutor.color}30` }}
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{ inset: -10, border: `1.5px solid ${tutor.color}70` }}
              animate={{ opacity: [0.7, 0], scale: [0.88, 1.45] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{ inset: -10, border: `1px solid ${tutor.color}45` }}
              animate={{ opacity: [0.5, 0], scale: [0.88, 1.7] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut', delay: 0.55 }}
            />
          </>
        )}
      </motion.div>
      <p
        className="text-[11px] font-semibold leading-tight transition-colors duration-200"
        style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.38)' }}
      >
        {lastName}
      </p>
      <p
        className="text-[9px] leading-tight font-medium transition-colors duration-200"
        style={{ color: isActive ? tutor.color : 'rgba(255,255,255,0.2)' }}
      >
        {tutor.subject}
      </p>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AiTutorsSection() {
  const [activeId, setActiveId] = useState(TUTORS[0].id);
  // 0 = blank  1 = user message  2 = typing  3 = tutor reply  4 = tip card
  const [phase, setPhase] = useState(0);

  const tutor = TUTORS.find(t => t.id === activeId)!;

  function selectTutor(id: string) {
    if (id === activeId) return;
    setActiveId(id);
  }

  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 350);
    const t2 = setTimeout(() => setPhase(2), 1700);
    const t3 = setTimeout(() => setPhase(3), 3600);
    const t4 = setTimeout(() => setPhase(4), 4500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [activeId]);

  return (
    <section className="max-w-4xl mx-auto px-5 sm:px-10 pb-24">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="text-center mb-10">
        <p
          className="text-xs font-bold tracking-widest uppercase mb-3"
          style={{ color: VIOLET }}
        >
          Banca Examinadora IA
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
          O seu exército pessoal de{' '}
          <span
            style={{
              background: `linear-gradient(90deg, ${NEON}, ${VIOLET})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            10 Especialistas.
          </span>
        </h2>
        <p className="text-slate-500 text-base max-w-xl mx-auto">
          Não é apenas um chat. É uma banca examinadora completa, treinada nas provas do ENEM,
          disponível{' '}
          <span className="font-bold" style={{ color: NEON }}>24h</span>{' '}
          para você.
        </p>
      </div>

      {/* ── Tutor selector — horizontal scroll ──────────────────── */}
      <div
        className="flex gap-4 overflow-x-auto pb-4 mb-6 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {TUTORS.map(t => (
          <TutorAvatar
            key={t.id}
            tutor={t}
            isActive={t.id === activeId}
            onClick={() => selectTutor(t.id)}
          />
        ))}
      </div>

      {/* ── Chat container ───────────────────────────────────────── */}
      <motion.div
        className="relative rounded-3xl overflow-hidden"
        animate={{
          borderColor: `${tutor.color}30`,
          boxShadow: `0 0 48px ${tutor.color}14, 0 0 0 1px ${tutor.color}10`,
        }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'rgba(9,9,11,0.5)',      /* zinc-950/50 */
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid transparent',
        }}
      >
        {/* Shimmer top line */}
        <motion.div
          className="absolute inset-x-0 top-0 h-px"
          animate={{ background: `linear-gradient(90deg, transparent, ${tutor.color}70, transparent)` }}
          transition={{ duration: 0.4 }}
        />

        {/* Chat header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <div
            className="w-10 h-10 rounded-full overflow-hidden shrink-0"
            style={{ background: '#0d0a1e', border: `1px solid ${tutor.color}45` }}
          >
            <Image src={tutor.avatar} alt={tutor.name} width={40} height={40} className="w-full h-full object-cover" unoptimized />
          </div>
          <div>
            <p className="text-white font-bold text-sm">
              {tutor.name}
              <span className="text-slate-500 font-normal mx-1.5">·</span>
              {tutor.subject}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: tutor.color }}
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
              <span className="text-slate-600 text-xs">{tutor.statusText}</span>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="px-5 py-6 flex flex-col gap-4 min-h-[290px]">
          <AnimatePresence mode="popLayout">

            {/* User message */}
            {phase >= 1 && (
              <motion.div
                key={`user-${activeId}`}
                className="flex justify-end"
                initial={{ opacity: 0, x: 24, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 16, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <div
                  className="max-w-xs sm:max-w-sm rounded-2xl rounded-tr-sm px-4 py-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)',
                    border: '1px solid rgba(255,255,255,0.10)',
                  }}
                >
                  <p className="text-slate-300 text-sm leading-relaxed">{tutor.userMsg}</p>
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
                <div
                  className="w-9 h-9 rounded-full overflow-hidden shrink-0 mt-0.5"
                  style={{ border: `1px solid ${tutor.color}40`, background: '#0d0a1e' }}
                >
                  <Image src={tutor.avatar} alt="" width={36} height={36} className="w-full h-full object-cover" unoptimized />
                </div>
                <div
                  className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3"
                  style={{
                    background: `linear-gradient(135deg, ${tutor.color}1a 0%, ${tutor.color}08 100%)`,
                    border: `1px solid ${tutor.color}28`,
                  }}
                >
                  <TypingDots color={tutor.color} />
                  <span className="text-slate-500 text-xs">{tutor.name} está digitando…</span>
                </div>
              </motion.div>
            )}

            {/* Tutor response */}
            {phase >= 3 && (
              <motion.div
                key={`reply-${activeId}`}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -20, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.38, ease: 'easeOut' }}
              >
                <div
                  className="w-9 h-9 rounded-full overflow-hidden shrink-0 mt-0.5"
                  style={{ border: `1px solid ${tutor.color}40`, background: '#0d0a1e' }}
                >
                  <Image src={tutor.avatar} alt="" width={36} height={36} className="w-full h-full object-cover" unoptimized />
                </div>
                <div
                  className="max-w-xs sm:max-w-md rounded-2xl rounded-tl-sm px-4 py-3"
                  style={{
                    background: `linear-gradient(135deg, ${tutor.color}1c 0%, ${tutor.color}08 100%)`,
                    border: `1px solid ${tutor.color}30`,
                  }}
                >
                  <p className="text-white text-sm leading-relaxed">{tutor.tutorMsg}</p>

                  {/* Tip card */}
                  <AnimatePresence>
                    {phase >= 4 && (
                      <motion.div
                        key={`tip-${activeId}`}
                        className="mt-3 px-3 py-2 rounded-xl text-xs"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: `1px solid ${tutor.color}22`,
                        }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                      >
                        <span className="font-bold" style={{ color: tutor.color }}>
                          💡 Macete ENEM:
                        </span>
                        <span className="text-slate-400 ml-1">{tutor.tip}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <p className="text-slate-700 text-xs mt-2">{tutor.name} · agora</p>
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
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p className="flex-1 text-sm text-slate-700 select-none">
              Pergunte qualquer coisa sobre {tutor.subject}…
            </p>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: `${tutor.color}20`, border: `1px solid ${tutor.color}40` }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M7 3l3 3-3 3" stroke={tutor.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
