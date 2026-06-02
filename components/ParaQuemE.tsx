'use client';

import Link from 'next/link';

const NEON   = '#00FF73';
const VIOLET = '#7C3AED';
const ORANGE = '#FF8A00';

interface DorCard {
  icon: string;
  headline: string;
  body: string;
  color: string;
}

const DORES: DorCard[] = [
  {
    icon: '📖',
    headline: 'Você releu o mesmo resumo 4 vezes — e ainda não fixou.',
    body: 'Releitura sente como aprendizado, mas não é. Só o recall ativo consolida memória de longo prazo.',
    color: ORANGE,
  },
  {
    icon: '🌪️',
    headline: 'Você não aguenta 30 minutos sem checar o celular.',
    body: 'Sessões de 5-15 minutos com cards. Sem PDF longo. Sem videoaula de 1h. Funciona com a sua atenção real.',
    color: VIOLET,
  },
  {
    icon: '🧊',
    headline: 'Você sabia a matéria. Na prova, deu branco.',
    body: 'Sem revisão espaçada no momento certo, 70% some em 24h. O Protocolo agenda o reforço antes do branco acontecer.',
    color: NEON,
  },
  {
    icon: '🎯',
    headline: 'Você assiste videoaula igual pra todo mundo — e seu ENEM é único.',
    body: 'Cada Radar de Lacunas é personalizado pelo SEU histórico. Não pelo "aluno médio".',
    color: '#06b6d4',
  },
];

const ANTI_TARGET = [
  'Você quer aprovação sem estudar 15 min por dia',
  'Você procura aula expositiva longa (somos revisão ativa, não substituto de teoria)',
  'Você quer chatbot pra responder trivia (somos método estruturado, não atalho)',
];

export default function ParaQuemE() {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-10 pb-12 sm:pb-24">
      {/* Header */}
      <div className="text-center mb-10">
        <p
          className="text-xs font-bold tracking-widest uppercase mb-3"
          style={{ color: VIOLET, fontFamily: "'JetBrains Mono', monospace" }}
        >
          [ DIAGNÓSTICO ]
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
          O Protocolo Neural é pra você{' '}
          <span style={{ color: NEON }}>se...</span>
        </h2>
        <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed">
          4 sintomas que indicam que seu método atual não está funcionando.
        </p>
      </div>

      {/* Grid 2x2 desktop / 1 col mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-12">
        {DORES.map((d) => (
          <div
            key={d.headline}
            className="relative rounded-2xl p-5 sm:p-6 overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Top accent line */}
            <div
              className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: `linear-gradient(90deg, transparent, ${d.color}60, transparent)` }}
            />

            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-2xl"
                style={{
                  background: `${d.color}12`,
                  border: `1px solid ${d.color}30`,
                }}
              >
                {d.icon}
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-base sm:text-lg leading-snug mb-2">
                  {d.headline}
                </p>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {d.body}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Anti-target */}
      <div
        className="max-w-3xl mx-auto rounded-xl p-5 sm:p-6 mb-10"
        style={{
          background: 'rgba(255,138,0,0.04)',
          border: '1px solid rgba(255,138,0,0.18)',
        }}
      >
        <p
          className="text-xs font-bold tracking-widest uppercase mb-3"
          style={{ color: ORANGE, fontFamily: "'JetBrains Mono', monospace" }}
        >
          Para quem NÃO é
        </p>
        <ul className="flex flex-col gap-2 text-sm">
          {ANTI_TARGET.map((line) => (
            <li key={line} className="flex items-start gap-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <span className="shrink-0 mt-0.5" style={{ color: 'rgba(255,138,0,0.65)' }}>✗</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="text-slate-400 text-sm sm:text-base mb-5 max-w-xl mx-auto">
          Se você se reconheceu em qualquer um dos 4 sintomas — comece pelo diagnóstico.
        </p>
        <Link
          href="/quizz"
          className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl font-black text-black text-sm tracking-wider transition-all hover:-translate-y-0.5"
          style={{
            background: `linear-gradient(135deg, ${NEON} 0%, #00cc5a 100%)`,
            letterSpacing: '-0.01em',
            boxShadow: `0 0 40px ${NEON}50, 0 4px 24px ${NEON}30`,
          }}
        >
          GERAR MEU DIAGNÓSTICO GRÁTIS
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/>
            <path d="m12 5 7 7-7 7"/>
          </svg>
        </Link>
        <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.30)' }}>
          Grátis · 3 min · sem cadastro · sem cartão
        </p>
      </div>
    </section>
  );
}
