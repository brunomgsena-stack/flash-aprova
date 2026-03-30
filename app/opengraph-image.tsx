import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt    = 'FlashAprova — Sistema HUD de Estudo com IA para o ENEM';
export const size   = { width: 1200, height: 630 };
export const contentType = 'image/png';

const NEON   = '#00FF73';
const VIOLET = '#7C3AED';
const ORANGE = '#FF8A00';
const BG     = '#0a0a0f';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: `linear-gradient(135deg, #121212 0%, ${BG} 100%)`,
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '56px 72px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid texture */}
        <div
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `linear-gradient(rgba(0,255,115,0.045) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,115,0.045) 1px, transparent 1px)`,
            backgroundSize: '56px 56px',
            display: 'flex',
          }}
        />

        {/* Ambient orb — top left */}
        <div
          style={{
            position: 'absolute', top: -120, left: -120,
            width: 480, height: 480,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%)`,
            display: 'flex',
          }}
        />
        {/* Ambient orb — bottom right */}
        <div
          style={{
            position: 'absolute', bottom: -80, right: -80,
            width: 360, height: 360,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(0,255,115,0.12) 0%, transparent 70%)`,
            display: 'flex',
          }}
        />

        {/* HUD — top left */}
        <div
          style={{
            position: 'absolute', top: 28, left: 40,
            color: `rgba(0,255,115,0.55)`, fontSize: 12,
            fontFamily: 'monospace', display: 'flex',
          }}
        >
          [ SYSTEM_STATUS: ACTIVE ]
        </div>
        {/* HUD — top right */}
        <div
          style={{
            position: 'absolute', top: 28, right: 40,
            color: `rgba(0,255,115,0.55)`, fontSize: 12,
            fontFamily: 'monospace', display: 'flex',
          }}
        >
          [ NEURAL_SYNC: 100% ]
        </div>

        {/* Badge */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 999, marginBottom: 28,
            background: 'rgba(0,255,115,0.08)',
            border: '1px solid rgba(0,255,115,0.28)',
            color: NEON, fontSize: 13, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
          }}
        >
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: NEON, display: 'flex',
          }} />
          Retenção Cognitiva · IA Especialista · SRS Automático
        </div>

        {/* Logo */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 20 }}>
          <span style={{ color: 'white', fontSize: 28, fontWeight: 900 }}>Flash</span>
          <span style={{
            fontSize: 28, fontWeight: 900,
            color: NEON,
          }}>
            Aprova
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center', gap: 6,
          }}
        >
          <div style={{ color: 'white', fontSize: 54, fontWeight: 900, lineHeight: 1.15, display: 'flex' }}>
            Pare de estudar para
          </div>
          <div style={{ color: ORANGE, fontSize: 54, fontWeight: 900, lineHeight: 1.15, display: 'flex' }}>
            esquecer.
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ color: 'white', fontSize: 44, fontWeight: 900, display: 'flex' }}>Garanta</span>
            <span style={{ color: NEON, fontSize: 44, fontWeight: 900, display: 'flex' }}>
              97% de retenção
            </span>
          </div>
          <div style={{ color: VIOLET, fontSize: 40, fontWeight: 900, display: 'flex' }}>
            até o dia do ENEM.
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'flex', gap: 56, marginTop: 36,
            paddingTop: 28,
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {[
            { n: '97%',    label: 'retenção com SRS',    color: NEON   },
            { n: '5.700+', label: 'flashcards táticos',  color: VIOLET },
            { n: '8.000+', label: 'estudantes aprovados', color: '#22c55e' },
          ].map(({ n, label, color }) => (
            <div
              key={n}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}
            >
              <span style={{ color, fontSize: 30, fontWeight: 900 }}>{n}</span>
              <span style={{ color: 'rgba(226,232,240,0.40)', fontSize: 14 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
