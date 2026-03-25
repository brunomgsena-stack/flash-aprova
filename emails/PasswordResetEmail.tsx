import {
  Body, Button, Container, Head, Heading, Hr,
  Html, Preview, Section, Text,
} from '@react-email/components';

const VIOLET = '#7C3AED';
const NEON   = '#00FF73';
const BG     = '#0f0f0f';
const CARD   = '#1a1a1a';
const TEXT   = '#e2e8f0';
const MUTED  = '#64748b';

export function PasswordResetEmail({ resetUrl }: { resetUrl: string }) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Redefinir senha do FlashAprova — link válido por 24 horas.</Preview>

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

          {/* ── Card ───────────────────────────────────────────────────────── */}
          <Section style={{
            backgroundColor: CARD,
            border:          `1px solid ${VIOLET}40`,
            borderRadius:    16,
            padding:         '40px 32px',
            marginBottom:    24,
          }}>
            {/* Ícone */}
            <Section style={{ textAlign: 'center', marginBottom: 20 }}>
              <Text style={{
                fontSize: 40, margin: 0, lineHeight: 1,
              }}>🔐</Text>
            </Section>

            <Heading style={{
              fontSize:   26,
              fontWeight: 900,
              color:      '#ffffff',
              textAlign:  'center',
              margin:     '0 0 8px',
              lineHeight: 1.2,
            }}>
              Redefinir sua senha
            </Heading>

            <Text style={{
              fontSize:  15, color: MUTED, textAlign: 'center',
              margin:    '0 0 32px', lineHeight: 1.6,
            }}>
              Recebemos uma solicitação para redefinir a senha da sua conta.
              Clique no botão abaixo para criar uma nova senha.
            </Text>

            {/* CTA principal */}
            <Section style={{ textAlign: 'center', marginBottom: 28 }}>
              <Button
                href={resetUrl}
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
                Redefinir senha
              </Button>
            </Section>

            {/* Validade */}
            <Section style={{
              backgroundColor: `${VIOLET}10`,
              border:          `1px solid ${VIOLET}25`,
              borderRadius:    10,
              padding:         '12px 16px',
              marginBottom:    24,
            }}>
              <Text style={{ margin: 0, fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 1.5 }}>
                ⏱ Este link expira em <strong style={{ color: TEXT }}>24 horas</strong>.
              </Text>
            </Section>

            {/* Aviso de segurança */}
            <Text style={{
              fontSize: 13, color: MUTED, textAlign: 'center',
              margin: 0, lineHeight: 1.6,
            }}>
              Se você não solicitou a redefinição de senha, ignore este e-mail.
              Sua senha não será alterada.
            </Text>
          </Section>

          {/* ── Fallback URL ───────────────────────────────────────────────── */}
          <Section style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 12, color: MUTED, textAlign: 'center', margin: '0 0 4px' }}>
              Botão não funcionou? Copie e cole o link abaixo no navegador:
            </Text>
            <Text style={{
              fontSize:        12,
              color:           VIOLET,
              textAlign:       'center',
              margin:          0,
              wordBreak:       'break-all',
              textDecoration:  'underline',
            }}>
              {resetUrl}
            </Text>
          </Section>

          {/* ── Footer ─────────────────────────────────────────────────────── */}
          <Hr style={{ borderColor: '#ffffff0f', margin: '0 0 24px' }} />
          <Text style={{ fontSize: 12, color: MUTED, textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
            © 2026 FlashAprova · Tecnologia de aprovação com IA
          </Text>

        </Container>
      </Body>
    </Html>
  );
}
