import {
  Body, Button, Container, Head, Heading, Hr,
  Html, Preview, Section, Text, Row, Column,
} from '@react-email/components';

const EMERALD = '#10b981';
const CYAN    = '#06b6d4';
const BG      = '#050505';
const CARD    = '#0a0a0a';
const CARD2   = '#111111';
const TEXT    = '#e2e8f0';
const MUTED   = '#475569';
const RED     = '#ef4444';

interface AccessGrantedEmailProps {
  name:        string;
  email:       string;
  planName:    string;
  loginUrl:    string;
  tempPassword?: string; // presente apenas para novos usuários
}

export function AccessGrantedEmail({
  name,
  email,
  planName,
  loginUrl,
  tempPassword,
}: AccessGrantedEmailProps) {
  const isNewUser = !!tempPassword;

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>[ VEREDITO: ACESSO CONCEDIDO ] — {planName} ativado. Acesse agora.</Preview>

      <Body style={{ backgroundColor: BG, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '40px 16px' }}>

          {/* ── Header ── */}
          <Section style={{ textAlign: 'center', marginBottom: 32 }}>
            <Text style={{
              fontSize: 22, fontWeight: 900, color: '#ffffff',
              margin: 0, letterSpacing: '-0.02em',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}>
              Flash<span style={{ color: EMERALD }}>Aprova</span>
            </Text>
            <Text style={{
              fontSize: 9, color: MUTED, letterSpacing: '0.20em',
              textTransform: 'uppercase', margin: '6px 0 0',
            }}>
              // sistema de engenharia de aprovação
            </Text>
          </Section>

          {/* ── Veredito banner ── */}
          <Section style={{
            backgroundColor: `${EMERALD}12`,
            border: `1px solid ${EMERALD}50`,
            borderRadius: 4,
            padding: '10px 20px',
            marginBottom: 24,
            textAlign: 'center',
          }}>
            <Text style={{
              margin: 0, fontSize: 11, fontWeight: 900,
              letterSpacing: '0.20em', textTransform: 'uppercase',
              color: EMERALD,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}>
              [ VEREDITO: ACESSO CONCEDIDO — {planName.toUpperCase()} ]
            </Text>
          </Section>

          {/* ── Card principal ── */}
          <Section style={{
            backgroundColor: CARD,
            border: `1px solid ${EMERALD}25`,
            borderRadius: 12,
            padding: '36px 32px',
            marginBottom: 20,
          }}>
            {/* Saudação */}
            <Text style={{
              fontSize: 10, color: MUTED, margin: '0 0 8px',
              letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>
              // operador identificado
            </Text>
            <Heading style={{
              fontSize: 26, fontWeight: 900, color: '#ffffff',
              margin: '0 0 6px', lineHeight: 1.2,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}>
              {name},
            </Heading>
            <Text style={{
              fontSize: 15, color: TEXT, margin: '0 0 28px', lineHeight: 1.7,
            }}>
              O protocolo foi ativado com sucesso.{' '}
              <span style={{ color: EMERALD, fontWeight: 700 }}>
                Sua vaga está garantida e o arsenal está em prontidão.
              </span>
            </Text>

            <Hr style={{ borderColor: '#ffffff0a', margin: '0 0 28px' }} />

            {/* Credenciais (apenas para novos usuários) */}
            {isNewUser && (
              <Section style={{ marginBottom: 28 }}>
                <Text style={{
                  fontSize: 10, color: CYAN, margin: '0 0 12px',
                  letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700,
                }}>
                  // credenciais de acesso
                </Text>

                <Section style={{
                  backgroundColor: CARD2,
                  border: `1px solid rgba(255,255,255,0.08)`,
                  borderRadius: 8,
                  padding: '16px 20px',
                  marginBottom: 8,
                }}>
                  <Row>
                    <Column style={{ width: 80 }}>
                      <Text style={{ margin: 0, fontSize: 10, color: MUTED, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                        login
                      </Text>
                    </Column>
                    <Column>
                      <Text style={{ margin: 0, fontSize: 13, color: TEXT, fontWeight: 700 }}>
                        {email}
                      </Text>
                    </Column>
                  </Row>
                </Section>

                <Section style={{
                  backgroundColor: CARD2,
                  border: `1px solid ${EMERALD}30`,
                  borderRadius: 8,
                  padding: '16px 20px',
                }}>
                  <Row>
                    <Column style={{ width: 80 }}>
                      <Text style={{ margin: 0, fontSize: 10, color: MUTED, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                        senha
                      </Text>
                    </Column>
                    <Column>
                      <Text style={{ margin: 0, fontSize: 15, color: EMERALD, fontWeight: 900, letterSpacing: '0.10em' }}>
                        {tempPassword}
                      </Text>
                    </Column>
                  </Row>
                </Section>

                <Section style={{
                  backgroundColor: `${RED}0f`,
                  border: `1px solid ${RED}25`,
                  borderRadius: 6,
                  padding: '10px 14px',
                  marginTop: 10,
                }}>
                  <Text style={{ margin: 0, fontSize: 11, color: '#fca5a5', lineHeight: 1.5 }}>
                    ⚠ Altere sua senha após o primeiro acesso em Configurações → Segurança.
                  </Text>
                </Section>
              </Section>
            )}

            {/* Mensagem para usuário existente */}
            {!isNewUser && (
              <Section style={{ marginBottom: 28 }}>
                <Text style={{
                  fontSize: 10, color: CYAN, margin: '0 0 12px',
                  letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700,
                }}>
                  // status da operação
                </Text>
                <Section style={{
                  backgroundColor: CARD2,
                  border: `1px solid ${EMERALD}25`,
                  borderRadius: 8,
                  padding: '16px 20px',
                }}>
                  <Text style={{ margin: 0, fontSize: 13, color: TEXT, lineHeight: 1.6 }}>
                    Sua conta existente foi atualizada para{' '}
                    <span style={{ color: EMERALD, fontWeight: 700 }}>{planName}</span>.{' '}
                    Use suas credenciais normais para acessar.
                  </Text>
                </Section>
              </Section>
            )}

            {/* CTA */}
            <Section style={{ textAlign: 'center' }}>
              <Button
                href={loginUrl}
                style={{
                  backgroundColor: EMERALD,
                  color: '#000000',
                  fontSize: 13,
                  fontWeight: 900,
                  borderRadius: 8,
                  padding: '14px 36px',
                  textDecoration: 'none',
                  display: 'inline-block',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
              >
                [ ACESSAR O PAINEL ]
              </Button>
            </Section>
          </Section>

          {/* ── O que está desbloqueado ── */}
          <Section style={{
            backgroundColor: CARD,
            border: `1px solid rgba(255,255,255,0.06)`,
            borderRadius: 12,
            padding: '24px 28px',
            marginBottom: 20,
          }}>
            <Text style={{
              fontSize: 10, color: MUTED, margin: '0 0 14px',
              letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>
              // arsenal ativado
            </Text>
            {[
              { icon: '⚡', label: '5.700+ Flashcards táticos com SRS inteligente' },
              { icon: '🧠', label: 'Neural Core — gestão automática de retenção' },
              { icon: '🤖', label: '15 Especialistas IA em prontidão 24/7' },
              { icon: '✍️', label: 'Prof.ª Norma — auditoria de redação em 30s' },
            ].map(({ icon, label }) => (
              <Row key={label} style={{ marginBottom: 10 }}>
                <Column style={{ width: 28 }}>
                  <Text style={{ margin: 0, fontSize: 16 }}>{icon}</Text>
                </Column>
                <Column>
                  <Text style={{ margin: 0, fontSize: 13, color: TEXT, lineHeight: 1.5 }}>
                    {label}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          {/* ── Footer ── */}
          <Hr style={{ borderColor: '#ffffff08', margin: '0 0 20px' }} />
          <Text style={{
            fontSize: 11, color: MUTED, textAlign: 'center',
            margin: 0, lineHeight: 1.6,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}>
            © 2026 FlashAprova · Tecnologia de aprovação com IA<br />
            Enviado para {email} · Suporte: suporte@flashaprova.app
          </Text>

        </Container>
      </Body>
    </Html>
  );
}
