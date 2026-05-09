'use client';

import { useState, useEffect, useRef } from 'react';

const EMERALD = '#10B981';

type Browser = 'safari' | 'chrome';

type AnimStep = {
  label: string;
  duration: number; // ms
};

const SAFARI_STEPS: AnimStep[] = [
  { label: 'Toque no botão Compartilhar ⬆️ na barra inferior', duration: 2800 },
  { label: 'Role e toque em "Adicionar à Tela de Início"',      duration: 3000 },
  { label: 'Toque em "Adicionar" no canto superior direito',    duration: 2800 },
  { label: 'Pronto! O ícone aparece na sua tela inicial 🎉',    duration: 2600 },
];

const CHROME_STEPS: AnimStep[] = [
  { label: 'Toque no menu ⋮ no canto superior direito',        duration: 2800 },
  { label: 'Toque em "Adicionar à tela inicial"',              duration: 3000 },
  { label: 'Pronto! O ícone aparece na sua tela inicial 🎉',   duration: 2600 },
];

// ─── Touch indicator ──────────────────────────────────────────────────────────
function TouchDot({ x, y, visible }: { x: number | string; y: number | string; visible: boolean }) {
  return (
    <div
      style={{
        position:   'absolute',
        left:       x,
        top:        y,
        width:      28,
        height:     28,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.85)',
        boxShadow:  '0 0 0 6px rgba(255,255,255,0.25)',
        transform:  `translate(-50%,-50%) scale(${visible ? 1 : 0})`,
        transition: 'transform 0.2s cubic-bezier(.34,1.56,.64,1), opacity 0.2s',
        opacity:    visible ? 1 : 0,
        zIndex:     100,
        pointerEvents: 'none',
      }}
    />
  );
}

// ─── App icon (mini FlashAprova) ──────────────────────────────────────────────
function AppIcon({ size = 48 }: { size?: number }) {
  return (
    <div
      style={{
        width:        size,
        height:       size,
        borderRadius: size * 0.22,
        background:   `linear-gradient(135deg, ${EMERALD}, #059669)`,
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        fontSize:     size * 0.45,
        boxShadow:    `0 2px 8px rgba(0,0,0,0.35)`,
        flexShrink:   0,
      }}
    >
      ⚡
    </div>
  );
}

// ─── Safari Animation ─────────────────────────────────────────────────────────
function SafariAnim({ step }: { step: number }) {
  // step 0: share button tap → menu appears
  // step 1: menu scrolled, item highlighted → tap
  // step 2: confirm dialog → tap add
  // step 3: home screen with icon

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#F2F2F7', borderRadius: 'inherit', display: 'flex', flexDirection: 'column' }}>

      {/* Status bar */}
      <div style={{ height: 28, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', fontSize: 9, fontWeight: 600, color: '#000', flexShrink: 0 }}>
        <span>9:41</span>
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <span>●●●</span>
          <span>WiFi</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Browser content area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Page content mockup */}
        <div style={{ padding: '10px 10px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ height: 8, borderRadius: 4, background: '#E5E5EA', width: '80%' }} />
          <div style={{ height: 6, borderRadius: 4, background: '#E5E5EA', width: '60%' }} />
          <div style={{ height: 6, borderRadius: 4, background: '#E5E5EA', width: '70%' }} />
          <div style={{ height: 40, borderRadius: 8, background: `${EMERALD}22`, border: `1px solid ${EMERALD}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AppIcon size={24} />
          </div>
          <div style={{ height: 6, borderRadius: 4, background: '#E5E5EA', width: '55%' }} />
          <div style={{ height: 6, borderRadius: 4, background: '#E5E5EA', width: '75%' }} />
        </div>

        {/* Step 1: Share menu */}
        {step === 1 && (
          <div
            style={{
              position:   'absolute',
              bottom:     0,
              left:       0,
              right:      0,
              background: '#FFFFFF',
              borderRadius: '16px 16px 0 0',
              boxShadow:  '0 -4px 20px rgba(0,0,0,0.18)',
              padding:    '12px 0 8px',
              animation:  'slideUp 0.35s ease',
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#C7C7CC', margin: '0 auto 10px' }} />
            {/* AirDrop row */}
            <div style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#E5E5EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📡</div>
              <span>AirDrop</span>
            </div>
            {/* Add to Home Screen — highlighted */}
            <div
              style={{
                padding:    '6px 14px',
                display:    'flex',
                alignItems: 'center',
                gap:        10,
                fontSize:   10,
                background: `${EMERALD}18`,
                border:     `1px solid ${EMERALD}44`,
                margin:     '2px 6px',
                borderRadius: 8,
                animation:  'pulseGlow 1.2s ease-in-out infinite',
              }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#E5E5EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>＋</div>
              <span style={{ fontWeight: 700, color: '#000' }}>Adicionar à Tela de Início</span>
            </div>
            {/* Copy row */}
            <div style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#E5E5EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📋</div>
              <span>Copiar</span>
            </div>
          </div>
        )}

        {/* Step 2: Confirm dialog */}
        {step === 2 && (
          <div
            style={{
              position:   'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.45)',
              display:    'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation:  'fadeIn 0.3s ease',
            }}
          >
            <div style={{ background: '#FFF', borderRadius: 14, width: '85%', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
              {/* Header */}
              <div style={{ padding: '10px 12px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E5E5EA' }}>
                <span style={{ fontSize: 9, color: '#007AFF' }}>Cancelar</span>
                <span style={{ fontSize: 10, fontWeight: 700 }}>Adicionar à Tela</span>
                <span
                  style={{
                    fontSize:   9,
                    color:      '#007AFF',
                    fontWeight: 700,
                    padding:    '2px 6px',
                    background: `${EMERALD}22`,
                    borderRadius: 6,
                    border:     `1px solid ${EMERALD}55`,
                    animation:  'pulseGlow 1s ease-in-out infinite',
                  }}
                >
                  Adicionar
                </span>
              </div>
              {/* App info */}
              <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <AppIcon size={36} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>FlashAprova</div>
                  <div style={{ fontSize: 9, color: '#8E8E93' }}>flashaprova.com</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Home screen with icon */}
        {step === 3 && (
          <div
            style={{
              position:   'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(145deg, #1a1a2e, #16213e, #0f3460)',
              display:    'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap:        8,
              padding:    '12px 8px',
              alignContent: 'start',
            }}
          >
            {/* Dummy icons */}
            {[...Array(7)].map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `hsl(${i * 40}, 60%, 55%)` }} />
                <div style={{ width: 24, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.4)' }} />
              </div>
            ))}
            {/* FlashAprova icon — animated pop */}
            <div
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                animation: 'iconPop 0.5s cubic-bezier(.34,1.56,.64,1) 0.2s both',
              }}
            >
              <AppIcon size={36} />
              <div style={{ fontSize: 7, color: 'white', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>FlashAprova</div>
            </div>
          </div>
        )}
      </div>

      {/* Safari bottom bar */}
      <div
        style={{
          height:     44,
          background: '#FFFFFF',
          borderTop:  '1px solid #E5E5EA',
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 16, opacity: 0.4 }}>←</span>
        <span style={{ fontSize: 16, opacity: 0.4 }}>→</span>
        {/* Share button — highlighted on step 0 */}
        <span
          style={{
            fontSize:   16,
            padding:    '4px 8px',
            borderRadius: 8,
            background: step === 0 ? `${EMERALD}22` : 'transparent',
            border:     step === 0 ? `1px solid ${EMERALD}55` : '1px solid transparent',
            animation:  step === 0 ? 'pulseGlow 1s ease-in-out infinite' : 'none',
            transition: 'all 0.3s',
          }}
        >
          ⬆️
        </span>
        <span style={{ fontSize: 16, opacity: 0.4 }}>📚</span>
        <span style={{ fontSize: 16, opacity: 0.4 }}>⧉</span>
      </div>

      {/* Touch indicator positions per step */}
      {step === 0 && <TouchDot x="50%" y={218} visible />}
      {step === 1 && <TouchDot x={120} y={172} visible />}
      {step === 2 && <TouchDot x="78%" y={96} visible />}
    </div>
  );
}

// ─── Chrome Animation ────────────────────────────────────────────────────────
function ChromeAnim({ step }: { step: number }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#F2F2F7', borderRadius: 'inherit', display: 'flex', flexDirection: 'column' }}>

      {/* Status bar */}
      <div style={{ height: 24, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', fontSize: 9, fontWeight: 600, color: '#000', flexShrink: 0 }}>
        <span>9:41</span>
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <span>▲▲▲</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Chrome address bar */}
      <div
        style={{
          height:     40,
          background: '#FFFFFF',
          borderBottom: '1px solid #E5E5EA',
          display:    'flex',
          alignItems: 'center',
          padding:    '0 10px',
          gap:        8,
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1, height: 26, borderRadius: 13, background: '#F2F2F7', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 4 }}>
          <span style={{ fontSize: 9 }}>🔒</span>
          <span style={{ fontSize: 8, color: '#6E6E6E' }}>flashaprova.com</span>
        </div>
        {/* Three dots — highlighted on step 0 */}
        <div
          style={{
            width:      26,
            height:     26,
            borderRadius: '50%',
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize:   14,
            background: step === 0 ? `${EMERALD}22` : 'transparent',
            border:     step === 0 ? `1px solid ${EMERALD}55` : '1px solid transparent',
            animation:  step === 0 ? 'pulseGlow 1s ease-in-out infinite' : 'none',
            transition: 'all 0.3s',
          }}
        >
          ⋮
        </div>
      </div>

      {/* Page content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ padding: '10px 10px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ height: 8, borderRadius: 4, background: '#E5E5EA', width: '80%' }} />
          <div style={{ height: 6, borderRadius: 4, background: '#E5E5EA', width: '60%' }} />
          <div style={{ height: 40, borderRadius: 8, background: `${EMERALD}22`, border: `1px solid ${EMERALD}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AppIcon size={24} />
          </div>
          <div style={{ height: 6, borderRadius: 4, background: '#E5E5EA', width: '70%' }} />
        </div>

        {/* Step 1: Chrome dropdown menu */}
        {step === 1 && (
          <div
            style={{
              position:   'absolute',
              top:        0,
              right:      8,
              background: '#FFFFFF',
              borderRadius: 10,
              boxShadow:  '0 4px 20px rgba(0,0,0,0.2)',
              minWidth:   140,
              overflow:   'hidden',
              animation:  'slideDown 0.25s ease',
            }}
          >
            <div style={{ padding: '6px 12px', fontSize: 10, borderBottom: '1px solid #F2F2F7', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🔖</span><span>Favoritos</span>
            </div>
            {/* Highlighted item */}
            <div
              style={{
                padding:    '6px 12px',
                fontSize:   10,
                fontWeight: 700,
                color:      '#000',
                background: `${EMERALD}18`,
                border:     `1px solid ${EMERALD}44`,
                margin:     '2px 4px',
                borderRadius: 6,
                display:    'flex',
                alignItems: 'center',
                gap:        8,
                animation:  'pulseGlow 1.2s ease-in-out infinite',
              }}
            >
              <span>＋</span><span>Adicionar à tela inicial</span>
            </div>
            <div style={{ padding: '6px 12px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📤</span><span>Compartilhar</span>
            </div>
          </div>
        )}

        {/* Step 2: Home screen */}
        {step === 2 && (
          <div
            style={{
              position:   'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(145deg, #1a1a2e, #16213e, #0f3460)',
              display:    'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap:        8,
              padding:    '12px 8px',
              alignContent: 'start',
            }}
          >
            {[...Array(7)].map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `hsl(${i * 40}, 60%, 55%)` }} />
                <div style={{ width: 24, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.4)' }} />
              </div>
            ))}
            <div
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                animation: 'iconPop 0.5s cubic-bezier(.34,1.56,.64,1) 0.2s both',
              }}
            >
              <AppIcon size={36} />
              <div style={{ fontSize: 7, color: 'white', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>FlashAprova</div>
            </div>
          </div>
        )}
      </div>

      {/* Touch indicator */}
      {step === 0 && (
        <div style={{ position: 'absolute', top: 49, right: 22, zIndex: 100 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,0.85)',
              boxShadow: '0 0 0 6px rgba(255,255,255,0.25)',
              animation: 'touchPulse 1s ease-in-out infinite',
            }}
          />
        </div>
      )}
      {step === 1 && (
        <div style={{ position: 'absolute', top: 80, right: 60, zIndex: 100 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', boxShadow: '0 0 0 6px rgba(255,255,255,0.25)', animation: 'touchPulse 1s ease-in-out infinite' }} />
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function PWAInstallAnimation() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const defaultBrowser: Browser = /iphone|ipad|ipod/i.test(ua) ? 'safari' : 'chrome';

  const [browser,  setBrowser]  = useState<Browser>(defaultBrowser);
  const [animStep, setAnimStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const steps = browser === 'safari' ? SAFARI_STEPS : CHROME_STEPS;

  // Auto-advance through animation sub-steps
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setAnimStep(s => (s + 1) % steps.length);
    }, steps[animStep]?.duration ?? 3000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [animStep, steps]);

  // Reset step when browser tab changes
  const switchBrowser = (b: Browser) => {
    setBrowser(b);
    setAnimStep(0);
  };

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50%       { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
        }
        @keyframes touchPulse {
          0%, 100% { transform: scale(1);   opacity: 1; }
          50%       { transform: scale(0.85); opacity: 0.7; }
        }
        @keyframes iconPop {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>

        {/* Browser tabs */}
        <div
          style={{
            display:      'flex',
            borderRadius: 10,
            overflow:     'hidden',
            border:       '1px solid rgba(255,255,255,0.12)',
            background:   'rgba(255,255,255,0.06)',
          }}
        >
          {(['safari', 'chrome'] as Browser[]).map(b => (
            <button
              key={b}
              onClick={() => switchBrowser(b)}
              style={{
                padding:    '7px 20px',
                fontSize:   12,
                fontWeight: 700,
                color:      browser === b ? '#000' : 'rgba(255,255,255,0.5)',
                background: browser === b ? EMERALD : 'transparent',
                border:     'none',
                cursor:     'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize',
              }}
            >
              {b === 'safari' ? '🧭 Safari' : '🌐 Chrome'}
            </button>
          ))}
        </div>

        {/* Phone mockup */}
        <div
          style={{
            width:        180,
            height:       280,
            borderRadius: 24,
            border:       '3px solid rgba(255,255,255,0.18)',
            overflow:     'hidden',
            position:     'relative',
            boxShadow:    '0 8px 32px rgba(0,0,0,0.5)',
            background:   '#FFF',
          }}
        >
          {/* Notch */}
          <div
            style={{
              position:      'absolute',
              top:           0,
              left:          '50%',
              transform:     'translateX(-50%)',
              width:         60,
              height:        10,
              background:    'rgba(255,255,255,0.15)',
              borderRadius:  '0 0 8px 8px',
              zIndex:        50,
              backdropFilter: 'blur(4px)',
            }}
          />
          {browser === 'safari'
            ? <SafariAnim step={animStep} />
            : <ChromeAnim step={animStep} />
          }
        </div>

        {/* Step label */}
        <div
          style={{
            fontSize:   12,
            color:      'rgba(255,255,255,0.75)',
            textAlign:  'center',
            minHeight:  32,
            lineHeight: 1.4,
            padding:    '0 8px',
            transition: 'opacity 0.3s',
          }}
        >
          {steps[animStep]?.label}
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6 }}>
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setAnimStep(i)}
              style={{
                width:        i === animStep ? 20 : 7,
                height:       7,
                borderRadius: 4,
                background:   i === animStep ? EMERALD : i < animStep ? `${EMERALD}60` : 'rgba(255,255,255,0.18)',
                border:       'none',
                cursor:       'pointer',
                transition:   'all 0.3s',
                padding:      0,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
