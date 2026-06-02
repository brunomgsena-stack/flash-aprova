'use client';

const NEON   = '#00FF73';
const VIOLET = '#7C3AED';

export default function AppDemo() {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-10 pb-12 sm:pb-24">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
          Veja o APP por dentro
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Demonstração ao vivo: flashcard ativo, radar de fragilidades e dashboard com próxima revisão.
        </p>
      </div>

      {/* Video player */}
      <div
        className="relative mx-auto rounded-2xl overflow-hidden"
        style={{
          maxWidth:  720,
          background: 'rgba(255,255,255,0.04)',
          border:     '1px solid rgba(255,255,255,0.08)',
          boxShadow:  `0 0 60px ${NEON}15, 0 0 120px ${VIOLET}10`,
        }}
      >
        <video
          src="/videos/demo-flashaprova.mp4"
          poster="/videos/demo-flashaprova-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          controls
          className="block w-full h-auto"
          style={{ background: '#000' }}
        />
      </div>

      <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.30)' }}>
        Tela real do app. Sem efeitos, sem corte.
      </p>
    </section>
  );
}
