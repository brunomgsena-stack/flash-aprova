'use client';

import { useState } from 'react';

const NEON   = '#00FF73';
const VIOLET = '#7C3AED';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚨 TODO PARA O DONO: Componente do Programa de Indicação (B.5 do PLANO)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Este componente é a face PÚBLICA do programa — mora na landing pra
 * gerar interesse. A versão para usuário logado (dentro do dashboard)
 * deve ser um componente irmão: `components/dashboard/MyReferrals.tsx`
 * que faz GET /api/referrals e renderiza código + stats.
 *
 * O QUE ESTE COMPONENTE FAZ HOJE:
 *   ✓ Mostra o pitch (Indique 1 amigo, ganhem 30 dias os dois)
 *   ✓ Botão CTA leva pra /login com next=/dashboard?tab=indique
 *   ✓ Mockup visual de como funciona
 *
 * O QUE FALTA (TODO):
 *   1. Criar /app/dashboard/indique/page.tsx que mostra:
 *      • Código do usuário (chama GET /api/referrals)
 *      • Link compartilhável: https://flashaprova.com.br/?ref=ABC12XYZ
 *      • Botão "Copiar link"
 *      • Stats: cliques, cadastros, pagantes, recompensa atual
 *      • Botão compartilhar WhatsApp/Email
 *   2. Middleware: quando alguém entrar com ?ref=CODE, fazer POST
 *      /api/referrals e guardar referral_id em cookie httpOnly por 30 dias.
 *      Quando essa pessoa pagar, ler o cookie e passar pro webhook do
 *      gateway pra associar.
 *   3. Webhook do gateway (Stripe/Hotmart/Eduzz) checar
 *      `metadata.referral_id` e disparar reward.
 *   4. Email transacional pro referrer ("Você indicou X — ela acabou de
 *      pagar! Suas 30 dias extras foram adicionadas.")
 *
 * REGRA DE RECOMPENSA (TODO confirmar):
 *   • Referrer: +30 dias na assinatura ativa
 *   • Referred: +30 dias também (incentivo de cadastro)
 *   • Limite: 12 indicações pagas por usuário/ano (anti-fraude)
 *
 * Confirme essa regra antes de comunicar publicamente — mudar depois
 * é tóxico pra confiança.
 * ═══════════════════════════════════════════════════════════════════════════
 */
export default function ReferralProgram() {
  const [copied, setCopied] = useState(false);

  // No estado "público" da landing, mostra apenas exemplo de link
  const exampleLink = 'flashaprova.com.br/?ref=SEUCODIGO';

  function copyExample() {
    navigator.clipboard?.writeText(`https://${exampleLink}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-10 pb-12 sm:pb-24">
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-10"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.10) 0%, rgba(0,255,115,0.06) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Top shimmer */}
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${NEON}70, ${VIOLET}70, transparent)` }}
        />

        <div className="text-center mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: VIOLET }}>
            Programa de indicação
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
            Indique 1 amigo,{' '}
            <span style={{ color: NEON }}>ganhem 30 dias os dois.</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Você compartilha seu link pessoal. Quando seu amigo assina, você ganha 30 dias extras na sua assinatura — e ele também. Sem limite até 12 indicações pagas por ano.
          </p>
        </div>

        {/* Mockup do link compartilhável */}
        <div
          className="mx-auto rounded-xl p-4 flex items-center gap-3 mb-6"
          style={{
            maxWidth: 480,
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}
        >
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>https://</span>
          <span className="flex-1 text-sm text-white truncate">{exampleLink}</span>
          <button
            onClick={copyExample}
            className="shrink-0 text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded transition-colors"
            style={{
              background: copied ? `${NEON}20` : 'rgba(255,255,255,0.05)',
              border: `1px solid ${copied ? `${NEON}60` : 'rgba(255,255,255,0.10)'}`,
              color: copied ? NEON : 'rgba(255,255,255,0.60)',
            }}
          >
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>

        {/* 3 passos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          {[
            { num: '01', title: 'Pegue seu link', desc: 'Disponível no seu painel após assinar' },
            { num: '02', title: 'Compartilhe',    desc: 'WhatsApp, Insta, grupo do cursinho' },
            { num: '03', title: 'Ambos ganham',   desc: '+30 dias quando seu amigo assinar' },
          ].map(s => (
            <div
              key={s.num}
              className="rounded-xl p-4"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p className="text-xs font-mono tracking-widest mb-2" style={{ color: NEON }}>{s.num}</p>
              <p className="text-white font-bold text-sm mb-1">{s.title}</p>
              <p className="text-slate-500 text-xs leading-snug">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="/login?next=/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-black text-sm tracking-wide transition-all hover:-translate-y-0.5"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${NEON}40`,
              color: NEON,
              boxShadow: `0 0 24px ${NEON}15`,
            }}
          >
            QUERO MEU LINK DE INDICAÇÃO
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/>
              <path d="m12 5 7 7-7 7"/>
            </svg>
          </a>
          <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Disponível pra quem já é assinante. Não é assinante?{' '}
            <a href="/quizz" className="underline" style={{ color: 'rgba(255,255,255,0.50)' }}>
              comece pelo diagnóstico grátis
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
