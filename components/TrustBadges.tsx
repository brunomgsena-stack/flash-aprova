'use client';

const NEON = '#00FF73';

export default function TrustBadges() {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Linha de selos de pagamento */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {[
          { label: 'PIX',    bg: '#00B86B' },
          { label: 'VISA',   bg: '#1A1F71' },
          { label: 'MASTER', bg: '#000000' },
          { label: 'ELO',    bg: '#000000' },
          { label: 'HIPER',  bg: '#9B2C2C' },
          { label: 'BOLETO', bg: '#374151' },
        ].map(({ label, bg }) => (
          <span
            key={label}
            className="text-[10px] font-black tracking-wider px-2.5 py-1.5 rounded-md text-white"
            style={{ background: bg, border: '1px solid rgba(255,255,255,0.10)' }}
          >
            {label}
          </span>
        ))}
      </div>
      {/* Linha de segurança */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
        <span className="inline-flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Compra 100% segura
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Conexão criptografada (SSL)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span style={{ color: NEON, fontWeight: 700 }}>🛡️</span>
          Garantia 7 dias
        </span>
      </div>
    </div>
  );
}
