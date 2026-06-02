'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NEON = '#00FF73';
const VIOLET = '#7C3AED';

export default function StickyMobileCta() {
  const [visible, setVisible]   = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const handleScroll = () => {
      // Appear after ~30vh of scroll, hide near the bottom (avoid covering pricing CTAs)
      const scrolled    = window.scrollY;
      const viewportH   = window.innerHeight;
      const docH        = document.documentElement.scrollHeight;
      const nearBottom  = scrolled + viewportH > docH - 600;
      setVisible(scrolled > viewportH * 0.3 && !nearBottom);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="sticky-cta"
          className="fixed bottom-0 inset-x-0 z-50 lg:hidden px-3 pb-3 pt-2"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'linear-gradient(to top, rgba(8,8,12,0.97) 60%, rgba(8,8,12,0))',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-stretch gap-2 max-w-md mx-auto">
            <a
              href="/checkout?from=sticky-mobile&plan=neural"
              className="flex-1 flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-black text-sm tracking-wide transition-all active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${NEON} 0%, ${VIOLET} 100%)`,
                color: '#fff',
                boxShadow: `0 0 28px ${NEON}40, 0 4px 16px rgba(0,0,0,0.55)`,
              }}
            >
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[10px] font-bold opacity-80 tracking-widest">7 DIAS GRÁTIS</span>
                <span className="text-sm">Começar · R$ 0,90/dia</span>
              </span>
              <span className="text-base">→</span>
            </a>
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setDismissed(true)}
              className="shrink-0 w-10 rounded-xl flex items-center justify-center transition-colors active:bg-white/10"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
