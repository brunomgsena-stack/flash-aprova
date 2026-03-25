import {
  Body, Button, Container, Head, Heading, Hr,
  Html, Preview, Section, Text, Row, Column,
} from '@react-email/components';

const VIOLET = '#7C3AED';
const NEON   = '#00FF73';
const BG     = '#0f0f0f';
const CARD   = '#1a1a1a';
const TEXT   = '#e2e8f0';
const MUTED  = '#64748b';

const features = [
  { icon: '⚡', label: '+5.700 flashcards táticos ENEM' },
  { icon: '🤖', label: '7 Tutores IA Especialistas (24h)' },
  { icon: '✍️', label: 'Correção de Redação com IA (Norma)' },
  { icon: '🧠', label: 'Revisão Espaçada (SRS) inteligente' },
  { icon: '📊', label: 'Mapa de Domínio por disciplina' },
] as const;

export function WelcomeEmail({ name }: { name: string }) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_URL ?? 'https://flashaprova.com.br'}/dashboard`;

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Bem-vindo ao AiPro+! Seu acesso ao FlashAprova está liberado.</Preview>

      <Body style={{ backgroundColor: BG, fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '40px 16px' }}>

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <Section style={{ textAlign: 'center', marginBottom: 32 }}>
            <Text style={{
              fontSize: 24, fontWeight: 900, color: '#ffffff',
              margin: 0, letterSpacing: '-0.02em',
            }}>
              Flash<span style={{ color: NEON }}>Aprova</span>
            </Text>
          </Section>

          {/* ── Card principal ─────────────────────────────────────────────── */}
          <Section style={{
            backgroundColor: CARD,
            border:          `1px solid ${VIOLET}40`,
            borderRadius:    16,
            padding:         '40px 32px',
            marginBottom:    24,
          }}>
            {/* Badge */}
            <Section style={{ textAlign: 'center', marginBottom: 24 }}>
              <Text style={{
                display:       'inline-block',
                backgroundColor: `${NEON}18`,
                border:        `1px solid ${NEON}40`,
                color:         NEON,
                fontSize:      11,
                fontWeight:    700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                borderRadius:  999,
                padding:       '4px 14px',
                margin:        0,
              }}>
                ✦ AiPro+ Ativado
              </Text>
            </Section>

            <Heading style={{
              fontSize:    28,
              fontWeight:  900,
              color:       '#ffffff',
              textAlign:   'center',
              margin:      '0 0 8px',
              lineHeight:  1.2,
            }}>
              Bem-vindo, {name}!
            </Heading>
            <Text style={{
              fontSize:  16, color: MUTED, textAlign: 'center',
              margin:    '0 0 32px', lineHeight: 1.6,
            }}>
              Seu plano <strong style={{ color: NEON }}>AiPro+</strong> está ativo
              e pronto para blindar sua memória até o ENEM.
            </Text>

            {/* Features */}
            <Section style={{ marginBottom: 32 }}>
              {features.map(({ icon, label }) => (
                <Row key={label} style={{ marginBottom: 12 }}>
                  <Column style={{ width: 32 }}>
                    <Text style={{ margin: 0, fontSize: 18 }}>{icon}</Text>
                  </Column>
                  <Column>
                    <Text style={{ margin: 0, fontSize: 14, color: TEXT, lineHeight: 1.5 }}>
                      {label}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>

            {/* CTA */}
            <Section style={{ textAlign: 'center' }}>
              <Button
                href={dashboardUrl}
                style={{
                  backgroundColor: NEON,
                  color:           '#000000',
                  fontSize:        15,
                  fontWeight:      900,
                  borderRadius:    12,
                  padding:         '14px 32px',
                  textDecoration:  'none',
                  display:         'inline-block',
                  letterSpacing:   '-0.01em',
                }}
              >
                Acessar meu painel →
              </Button>
            </Section>
          </Section>

          {/* ── Dica rápida ────────────────────────────────────────────────── */}
          <Section style={{
            backgroundColor: `${VIOLET}14`,
            border:          `1px solid ${VIOLET}30`,
            borderRadius:    12,
            padding:         '20px 24px',
            marginBottom:    32,
          }}>
            <Text style={{ margin: 0, fontSize: 13, color: TEXT, lineHeight: 1.6 }}>
              <strong style={{ color: VIOLET }}>💡 Dica de início rápido:</strong>{' '}
              Acesse o <strong>Diagnóstico por IA</strong> no painel para mapear suas lacunas
              em menos de 3 minutos. Quanto antes você começar, mais memória você protege.
            </Text>
          </Section>

          {/* ── Footer ─────────────────────────────────────────────────────── */}
          <Hr style={{ borderColor: '#ffffff0f', margin: '0 0 24px' }} />
          <Text style={{ fontSize: 12, color: MUTED, textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
            © 2026 FlashAprova · Tecnologia de aprovação com IA<br />
            Este e-mail foi enviado para {'{'}email{'}'} porque você adquiriu o plano AiPro+.
          </Text>

        </Container>
      </Body>
    </Html>
  );
}
