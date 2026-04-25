'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Número do WhatsApp (DDI + DDD + número, sem símbolos) ──────────────────
const WA_NUMBER = '5511999999999'; // substitua pelo número real
const WA_MESSAGE = encodeURIComponent(
  'Olá! Quero garantir minha vaga no FlashAprova e acelerar minha aprovação em Medicina. Pode me tirar uma dúvida rápida antes de eu finalizar?',
);
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

// ── Shake keyframes via Framer Motion ─────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const shakeVariants: any = {
  idle: { rotate: 0, x: 0 },
  shake: {
    rotate: [0, -8, 8, -6, 6, -3, 3, 0],
    x: [0, -4, 4, -3, 3, -1, 1, 0],
    transition: { duration: 0.55, ease: 'easeInOut' },
  },
};

export default function WhatsAppFloat() {
  const [showTooltip, setShowTooltip]   = useState(false);
  const [showBadge,   setShowBadge]     = useState(false);
  const [shaking,     setShaking]       = useState(false);
  const [dismissed,   setDismissed]     = useState(false);
  const [reached,     setReached]       = useState(false);

  // Só aparece após o usuário chegar no mural dos aprovados
  useEffect(() => {
    const target = document.getElementById('mural-aprovados');
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setReached(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Tooltip após 5s do mural ser atingido + shake
  useEffect(() => {
    if (!reached) return;
    const t = setTimeout(() => {
      setShowTooltip(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    }, 5_000);
    return () => clearTimeout(t);
  }, [reached]);

  // Badge após 8s do mural ser atingido
  useEffect(() => {
    if (!reached) return;
    const t = setTimeout(() => setShowBadge(true), 8_000);
    return () => clearTimeout(t);
  }, [reached]);

  if (!reached || dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <style>{`
        @keyframes wa-glow {
          0%, 100% { box-shadow: 0 0 12px 2px rgba(16,185,129,0.45); }
          50%       { box-shadow: 0 0 28px 8px rgba(16,185,129,0.75); }
        }
        .wa-glow { animation: wa-glow 2s ease-in-out infinite; }
      `}</style>

      {/* ── Tooltip ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.92 }}
            animate={{ opacity: 1, x: 0,  scale: 1 }}
            exit={{    opacity: 0, x: 20, scale: 0.92 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative max-w-[260px] rounded-2xl border border-emerald-500/30 bg-[#0d1117]/80 px-4 py-3 text-sm leading-snug text-white shadow-xl backdrop-blur-lg"
          >
            {/* Seta apontando para o botão */}
            <span className="absolute -bottom-2 right-5 h-3 w-3 rotate-45 border-b border-r border-emerald-500/30 bg-[#0d1117]/80" />

            <p className="font-semibold text-emerald-400">
              Dúvida final antes de garantir sua vaga?
            </p>
            <p className="mt-0.5 text-white/75">
              Fale com o consultor agora.
            </p>

            {/* Fechar tooltip */}
            <button
              aria-label="Fechar"
              onClick={() => setDismissed(true)}
              className="absolute right-2 top-2 text-white/30 transition hover:text-white/70"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Botão principal ─────────────────────────────────────────────── */}
      <motion.a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar com consultor no WhatsApp"
        variants={shakeVariants}
        animate={shaking ? 'shake' : 'idle'}
        className="wa-glow relative flex h-[58px] w-[58px] items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 backdrop-blur-lg transition-transform hover:scale-105 active:scale-95"
        onClick={() => setShowTooltip(false)}
      >
        {/* Ícone WhatsApp SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <path
            d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.17 1.6 5.99L0 24l6.18-1.62A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.21-1.25-6.22-3.48-8.52ZM12 22c-1.85 0-3.67-.5-5.25-1.43l-.38-.22-3.67.96.98-3.57-.24-.38A9.96 9.96 0 0 1 2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10Zm5.47-7.4c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.63-.93-2.23-.25-.59-.5-.51-.68-.52h-.58c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"
            fill="#10b981"
          />
        </svg>

        {/* Badge de notificação */}
        <AnimatePresence>
          {showBadge && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{    scale: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold leading-none text-black shadow-md"
            >
              1
            </motion.span>
          )}
        </AnimatePresence>
      </motion.a>
    </div>
  );
}
