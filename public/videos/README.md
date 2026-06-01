# Vídeos da landing

## app-demo (B.2 do PLANO_LANDING_REVAMP)

Substituir estes arquivos pelos vídeos reais:

| Arquivo | Especificação |
|---|---|
| `app-demo.mp4` | MP4 H.264, 15-30s, 1080x1920 vertical, sem áudio, máx 10MB |
| `app-demo.webm` | Mesma fonte em VP9 ou AV1 (melhor compressão pra Chrome/Firefox) |
| `app-demo-poster.jpg` | Frame de capa 1080x1920, ~80KB, JPEG progressivo |

### Como gerar com ffmpeg

```bash
# MP4 H.264 (universal)
ffmpeg -i raw.mov -vcodec libx264 -crf 28 -preset slow \
  -vf "scale=1080:-2" -an app-demo.mp4

# WebM VP9 (Chrome/Firefox)
ffmpeg -i raw.mov -c:v libvpx-vp9 -crf 32 -b:v 0 \
  -vf "scale=1080:-2" -an app-demo.webm

# Poster (primeiro frame)
ffmpeg -i raw.mov -ss 00:00:00.100 -vframes 1 \
  -q:v 4 app-demo-poster.jpg
```

### Conteúdo recomendado (15-30s)

1. Abrir flashcard de Medicina (2-3s)
2. Responder com acerto/erro (3-5s)
3. Próximo card aparece (3s)
4. Cut rápido pro dashboard ou Radar de Lacunas (5s)
5. Card sendo agendado pra próxima revisão (3-5s)

Sem áudio, sem voiceover. A UI da landing já contextualiza.

### O que NÃO incluir

- Logos de outros apps
- Dados pessoais reais (use conta de teste)
- Texto sobreposto no vídeo (a copy da landing faz isso)
- Música com copyright

### Após colocar os arquivos

Nenhum código precisa mudar. O componente `components/AppDemo.tsx` já está
configurado pra carregar `/videos/app-demo.{mp4,webm}` e mostrar o poster.
O placeholder "EM BREVE" some automaticamente quando o vídeo carrega.
