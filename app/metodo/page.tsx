import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'O Método FlashAprova | Fundamentação Científica',
  description:
    'Entenda por que o FlashAprova funciona: Curva de Ebbinghaus (1885), Spaced Repetition System e 140 anos de pesquisa em memória aplicados em 15 minutos por dia.',
};

// ─── Paleta da landing ──────────────────────────────────────────────────────────
const NEON   = '#00FF73';
const VIOLET = '#7C3AED';
const BG     = '#121212';

export default function MetodoPage() {
  return (
    <div style={{ background: BG, minHeight: '100vh', color: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ══ NAVBAR ══════════════════════════════════════════════════════════════ */}
      <nav
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)', maxWidth: '100%' }}
      >
        <Link href="/" className="text-white font-black text-lg tracking-tight">
          Flash<span style={{ color: NEON }}>Aprova</span>
        </Link>
        <Link
          href="/login"
          className="text-sm font-semibold px-4 py-1.5 rounded-full border transition-colors hover:bg-white/10"
          style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
        >
          Entrar
        </Link>
      </nav>

      {/* ══ CONTAINER PRINCIPAL ═════════════════════════════════════════════════ */}
      <div className="mx-auto px-5 pb-24" style={{ maxWidth: '48rem' }}>

        {/* ══ HERO ════════════════════════════════════════════════════════════ */}
        <header className="pt-14 pb-12 text-center">
          <p
            className="text-xs font-black tracking-widest mb-4 uppercase"
            style={{ color: NEON, letterSpacing: '0.2em' }}
          >
            Fundamentação Científica
          </p>
          <h1
            className="text-3xl sm:text-5xl font-black leading-tight mb-5"
            style={{ color: '#ffffff' }}
          >
            Por que o FlashAprova funciona.
          </h1>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Não é mágica. É 140 anos de pesquisa em memória aplicados em 15 minutos por dia.
          </p>
        </header>

        <hr style={{ borderColor: 'rgba(255,255,255,0.06)', marginBottom: '3.5rem' }} />

        {/* ─── Seção: O Protocolo Neural ─── */}
        <section className="max-w-3xl mx-auto px-6 py-12">
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(0,255,115,0.04))',
              border: '1px solid rgba(124,58,237,0.25)',
            }}
          >
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#a78bfa' }}>
              O método
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 leading-tight">
              Protocolo Neural
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              Método em 4 fases que combina a Curva de Ebbinghaus (1885) com algoritmo SRS adaptativo por IA. O sistema decide quando você revisa cada conteúdo — você só precisa abrir o app 15 minutos por dia.
            </p>
            <ol className="space-y-3 mb-6">
              {[
                { num: '01', name: 'Diagnóstico', desc: 'Quiz mapeia suas lacunas em 3 minutos.' },
                { num: '02', name: 'Radar', desc: 'Algoritmo identifica o que você está prestes a esquecer.' },
                { num: '03', name: 'Revisão', desc: 'Card certo no dia certo, 15 min/dia.' },
                { num: '04', name: 'Retenção', desc: 'Conteúdo fixado, blindado pro dia da prova.' },
              ].map((p) => (
                <li key={p.num} className="flex gap-3">
                  <span className="font-mono text-xs font-black tracking-widest shrink-0" style={{ color: '#00FF73' }}>
                    {p.num}
                  </span>
                  <div>
                    <p className="font-bold text-white text-sm">{p.name}</p>
                    <p className="text-slate-400 text-sm">{p.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Inimigo do Protocolo: o estudo às cegas — estudar muito e esquecer tudo na hora da prova.
            </p>
          </div>
        </section>

        {/* ══ SEÇÃO 1 — Curva do Esquecimento ════════════════════════════════ */}
        <section className="mb-14">
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: VIOLET }}>
            Ebbinghaus, 1885
          </p>
          <h2 className="text-2xl sm:text-3xl font-black mb-4" style={{ color: '#ffffff' }}>
            Seu cérebro foi programado para esquecer.
          </h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Hermann Ebbinghaus descobriu em 1885 que, sem revisão, perdemos cerca de 70% do que
            aprendemos em apenas 24 horas. Esse padrão se repete de forma sistemática para qualquer
            tipo de conteúdo — é exatamente o que faz alunos "esquecerem tudo" no dia da prova,
            mesmo depois de horas estudando.
          </p>

          {/* Mini-gráfico SVG da curva descendente */}
          <div
            className="rounded-2xl p-6 mb-6"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            aria-label="Gráfico ilustrativo da Curva do Esquecimento"
          >
            <p className="text-xs font-semibold mb-4 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Curva do Esquecimento (Ebbinghaus)
            </p>
            <svg
              viewBox="0 0 320 140"
              className="w-full"
              style={{ maxHeight: 160 }}
              aria-hidden="true"
            >
              {/* Eixos */}
              <line x1="30" y1="10" x2="30" y2="120" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <line x1="30" y1="120" x2="310" y2="120" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

              {/* Labels eixo Y */}
              <text x="22" y="18" fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="end">100%</text>
              <text x="22" y="60" fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="end">50%</text>
              <text x="22" y="100" fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="end">20%</text>

              {/* Labels eixo X */}
              <text x="30"  y="133" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">0</text>
              <text x="100" y="133" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">6h</text>
              <text x="170" y="133" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">24h</text>
              <text x="240" y="133" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">3d</text>
              <text x="305" y="133" fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">7d</text>

              {/* Área sob a curva */}
              <path
                d="M30,18 C50,22 80,48 100,65 C130,82 155,93 170,98 C200,106 240,111 310,114 L310,120 L30,120 Z"
                fill="rgba(124,58,237,0.12)"
              />

              {/* Curva de esquecimento */}
              <path
                d="M30,18 C50,22 80,48 100,65 C130,82 155,93 170,98 C200,106 240,111 310,114"
                fill="none"
                stroke={VIOLET}
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Ponto marcado em 24h */}
              <circle cx="170" cy="98" r="4" fill={NEON} />
              <text x="178" y="94" fill={NEON} fontSize="8" fontWeight="bold">~30% lembrado</text>
            </svg>
            <p className="text-xs mt-3 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Sem revisão ativa, resta menos de 1/3 do conteúdo após 24h.
            </p>
          </div>

          <p className="text-xs leading-relaxed p-4 rounded-xl italic" style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <strong style={{ color: 'rgba(255,255,255,0.55)' }}>Fonte:</strong>{' '}
            Ebbinghaus, H. (1885).{' '}
            <em>Über das Gedächtnis</em>. Reeditado em inglês como{' '}
            <em>Memory: A Contribution to Experimental Psychology</em>. Teachers College, Columbia University (1913).
          </p>
        </section>

        {/* ══ SEÇÃO 2 — Spaced Repetition System ═════════════════════════════ */}
        <section className="mb-14">
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: NEON }}>
            Spaced Repetition System (SRS)
          </p>
          <h2 className="text-2xl sm:text-3xl font-black mb-4" style={{ color: '#ffffff' }}>
            A solução: revisar 1 dia antes de esquecer.
          </h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.65)' }}>
            O algoritmo SRS (Spaced Repetition System), consolidado em pesquisas de{' '}
            <strong style={{ color: '#f1f5f9' }}>Cepeda et al. (2006)</strong>, agenda revisões em
            intervalos crescentes — quanto mais você acerta, mais distante a próxima revisão. Isso
            treina o cérebro a converter memória de curto prazo em memória de longo prazo de forma
            eficiente, exigindo muito menos tempo por sessão do que o estudo tradicional em bloco.
          </p>
          <p className="text-base leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.65)' }}>
            <strong style={{ color: '#f1f5f9' }}>Karpicke & Roediger (2008)</strong> reforçaram que
            a recuperação ativa — ser forçado a lembrar, não apenas reler — é o mecanismo central
            que consolida o aprendizado. Flashcards com SRS aplicam exatamente esse princípio: cada
            card é um teste de recuperação, não um relembrete passivo.
          </p>

          <div className="space-y-3">
            <p className="text-xs leading-relaxed p-4 rounded-xl italic" style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <strong style={{ color: 'rgba(255,255,255,0.55)' }}>Fonte:</strong>{' '}
              Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006).{' '}
              <em>Distributed practice in verbal recall tasks: A review and quantitative synthesis</em>.{' '}
              Psychological Bulletin, 132(3), 354–380.
            </p>
            <p className="text-xs leading-relaxed p-4 rounded-xl italic" style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <strong style={{ color: 'rgba(255,255,255,0.55)' }}>Fonte:</strong>{' '}
              Karpicke, J. D., & Roediger, H. L. (2008).{' '}
              <em>The critical importance of retrieval for learning</em>.{' '}
              Science, 319(5865), 966–968.
            </p>
          </div>
        </section>

        {/* ══ SEÇÃO 3 — Como aplicamos no FlashAprova ════════════════════════ */}
        <section className="mb-14">
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: VIOLET }}>
            Aplicação prática
          </p>
          <h2 className="text-2xl sm:text-3xl font-black mb-6" style={{ color: '#ffffff' }}>
            Como aplicamos no FlashAprova.
          </h2>

          <div className="space-y-4">
            {[
              {
                title: 'Algoritmo SRS adaptativo',
                desc: 'Calcula o intervalo ideal de revisão de cada card com base no seu desempenho individual — não numa curva genérica.',
              },
              {
                title: 'Recall ativo (não reconhecimento)',
                desc: 'Cada card te obriga a recuperar a resposta da memória antes de ver o gabarito. É o mecanismo que a ciência identifica como determinante para fixação.',
              },
              {
                title: 'Curadoria editorial TRI/ENEM',
                desc: 'Cards organizados segundo a Teoria de Resposta ao Item (TRI), com foco no 80/20 dos conteúdos mais cobrados nas últimas edições do ENEM.',
              },
              {
                title: 'Diagnóstico contínuo — Radar de Lacunas',
                desc: 'Identifica automaticamente quais matérias estão frágeis antes da prova, para você revisar o que importa, não o que já sabe.',
              },
              {
                title: 'Norma IA — Redação ENEM',
                desc: 'Correção de redação seguindo as 5 competências oficiais do INEP, com parecer detalhado em segundos para cada texto enviado.',
              },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="flex gap-4 p-5 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="flex-shrink-0 w-2 rounded-full mt-1"
                  style={{ background: `linear-gradient(180deg, ${NEON}, ${VIOLET})`, minHeight: '1.25rem' }}
                />
                <div>
                  <p className="text-sm font-black mb-1" style={{ color: '#f1f5f9' }}>{title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ SEÇÃO 4 — Transparência sobre os claims ════════════════════════ */}
        <section
          className="mb-14 p-6 sm:p-8 rounded-2xl"
          style={{ background: 'rgba(255, 138, 0, 0.06)', border: '1px solid rgba(255, 138, 0, 0.2)' }}
        >
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#FF8A00' }}>
            Transparência
          </p>
          <h2 className="text-xl sm:text-2xl font-black mb-4" style={{ color: '#ffffff' }}>
            Transparência sobre os números que usamos.
          </h2>
          <p className="text-sm sm:text-base leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Quando dizemos <strong style={{ color: '#f1f5f9' }}>"Até 97% de retenção"</strong>, estamos nos
            referindo ao desempenho esperado do modelo de Ebbinghaus aplicado ao SRS — não a uma média de
            alunos auditada. O FlashAprova é uma plataforma jovem; nossos dados internos crescem a cada
            semana e serão publicados aqui conforme amadurecem.
          </p>
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Os depoimentos da landing são de estudantes em jornada de aprovação, usando o método.
            Quando tivermos casos de aprovação confirmados pelo SISU, eles aparecerão aqui com{' '}
            <strong style={{ color: '#f1f5f9' }}>nome completo, nota e universidade</strong>.
          </p>
        </section>

        {/* ══ CTA FINAL ═══════════════════════════════════════════════════════ */}
        <section className="text-center py-10">
          <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: '#ffffff' }}>
            Pronto pra experimentar?
          </h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
            O método está aqui. O diagnóstico é gratuito e leva 3 minutos.
          </p>
          <Link
            href="/quizz"
            className="inline-block font-black text-sm sm:text-base px-8 py-4 rounded-full transition-transform hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${NEON}, #00cc5a)`,
              color: '#0a0a0a',
              letterSpacing: '0.05em',
            }}
          >
            GERAR MEU DIAGNÓSTICO GRÁTIS
          </Link>
          <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Grátis · 3 min · sem cadastro · sem cartão
          </p>
        </section>

      </div>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════════ */}
      <footer
        className="border-t py-10 px-6 sm:px-10"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6" style={{ maxWidth: '48rem' }}>
          <div>
            <p className="text-white font-black mb-1">
              Flash<span style={{ color: NEON }}>Aprova</span>
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2026 · Tecnologia de aprovação com IA</p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Link href="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
            <Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
            <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
            <a href="mailto:contato@flashaprova.com.br" className="hover:text-white transition-colors">Suporte</a>
          </nav>
        </div>
      </footer>

    </div>
  );
}
