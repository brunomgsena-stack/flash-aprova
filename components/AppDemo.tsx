'use client';

import { useRef, useState, useEffect } from 'react';

const NEON = '#00FF73';
const VIOLET = '#7C3AED';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📹 AppDemo — Seção "Veja o app por dentro"
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ TODO PARA O DONO: SUBSTITUIR PLACEHOLDER POR VÍDEO REAL                 │
 * │                                                                          │
 * │ 1. GRAVAR O VÍDEO:                                                       │
 * │    • Duração: 15-30 segundos                                             │
 * │    • Orientação: VERTICAL 1080x1920 (mobile-first) OU 1920x1080          │
 * │      horizontal se preferir landscape. Vertical converte mais            │
 * │    • Conteúdo: gravação de tela do app real fazendo:                     │
 * │       a) Abrir um flashcard de Medicina                                  │
 * │       b) Responder (acerto/erro)                                         │
 * │       c) Próximo card aparece                                            │
 * │       d) Mostrar o Radar de Lacunas ou dashboard rapidamente             │
 * │    • Sem áudio obrigatório (vai rodar muted/autoplay)                    │
 * │    • Sem texto na tela do vídeo (a UI da landing já contextualiza)       │
 * │                                                                          │
 * │ 2. EXPORTAR EM 2 FORMATOS (pra cobrir Safari/Chrome/Firefox):            │
 * │    • MP4 (H.264) — fallback universal                                    │
 * │    • WebM (VP9 ou AV1) — melhor compressão, Chrome/Firefox usam          │
 * │    • Cap de tamanho: ~3-5MB ideal, máx 10MB. Se passar, comprima         │
 * │      com Handbrake ou ffmpeg:                                            │
 * │      ffmpeg -i input.mov -vcodec libx264 -crf 28 -preset slow            │
 * │             -vf "scale=1080:-2" -an output.mp4                           │
 * │                                                                          │
 * │ 3. SALVAR EM:                                                            │
 * │    • public/videos/app-demo.mp4                                          │
 * │    • public/videos/app-demo.webm                                         │
 * │    • public/videos/app-demo-poster.jpg  (frame de capa 1080x1920, ~80KB) │
 * │                                                                          │
 * │ 4. NÃO PRECISA TOCAR ESTE CÓDIGO depois — basta colocar os arquivos      │
 * │    nesses caminhos e remover o estado `showPlaceholder` (linha ~84)      │
 * │    OU manter (ele só aparece se o vídeo falhar).                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
export default function AppDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  // Tenta carregar o vídeo. Se 404 ou erro, mantém placeholder visível.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => setShowPlaceholder(false);
    const onError = () => setShowPlaceholder(true);
    v.addEventListener('loadeddata', onLoaded);
    v.addEventListener('error', onError);
    return () => {
      v.removeEventListener('loadeddata', onLoaded);
      v.removeEventListener('error', onError);
    };
  }, []);

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-10 pb-12 sm:pb-24">
      <div className="text-center mb-8">
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: NEON }}>
          Veja o app por dentro
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
          Sem mockup. Sem promessa.{' '}
          <span style={{ color: NEON }}>Tela real do FlashAprova.</span>
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          15 segundos pra ver como uma sessão de estudo realmente acontece — do card que aparece à revisão que o algoritmo agenda sozinho.
        </p>
      </div>

      <div
        className="relative mx-auto rounded-2xl overflow-hidden"
        style={{
          maxWidth: 420,
          aspectRatio: '9 / 16',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid rgba(255,255,255,0.08)`,
          boxShadow: `0 0 60px ${NEON}15, 0 0 120px ${VIOLET}10`,
        }}
      >
        {/* Vídeo real — autoplay muted loop, com poster pra primeira pintura */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="/videos/app-demo-poster.jpg"
          style={{ display: 'block' }}
        >
          <source src="/videos/app-demo.webm" type="video/webm" />
          <source src="/videos/app-demo.mp4" type="video/mp4" />
        </video>

        {/* Placeholder — aparece quando o vídeo ainda não existe */}
        {showPlaceholder && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(0,255,115,0.10))',
              backdropFilter: 'blur(2px)',
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: `${NEON}20`, border: `1px solid ${NEON}50` }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill={NEON}>
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-base mb-1">Vídeo do app em produção</p>
              <p className="text-slate-400 text-xs leading-relaxed max-w-[260px]">
                Em breve aqui: gravação real de tela mostrando flashcards, Radar de Lacunas e Norma IA em ação.
              </p>
            </div>
            <span
              className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.40)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              EM BREVE
            </span>
          </div>
        )}
      </div>

      {/* Nota discreta abaixo */}
      <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.30)' }}>
        Vídeo sem áudio · loop · representativo de uma sessão real
      </p>
    </section>
  );
}
