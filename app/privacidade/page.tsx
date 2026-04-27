import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politica de Privacidade — FlashAprova',
  description: 'Saiba como a FlashAprova coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.',
};

export default function PrivacidadePage() {
  return (
    <div
      className="min-h-screen px-4 py-12"
      style={{ background: 'radial-gradient(ellipse at 30% 0%, #0a0514 0%, #050505 65%)' }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Logo */}
        <div className="mb-10">
          <Link href="/" className="font-black text-white text-xl">
            Flash<span style={{ background: 'linear-gradient(90deg,#22c55e,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Aprova</span>
          </Link>
        </div>

        <div
          className="rounded-2xl p-8 sm:p-10"
          style={{ background: 'rgba(10,5,20,0.85)', border: '1px solid rgba(124,58,237,0.18)', backdropFilter: 'blur(20px)' }}
        >
          <h1 className="text-3xl font-black text-white mb-2">Politica de Privacidade</h1>
          <p className="text-slate-500 text-sm mb-8">Ultima atualizacao: 25 de abril de 2026</p>

          <div className="space-y-8 text-slate-300 text-sm leading-relaxed">

            <Section title="1. Controlador dos Dados">
              <p>
                A FlashAprova Tecnologia Educacional LTDA, com sede no Brasil, e a controladora dos dados pessoais tratados por meio desta Plataforma. Para exercer seus direitos ou tirar duvidas, entre em contato pelo e-mail{' '}
                <a href="mailto:privacidade@flashaprova.com.br" className="text-violet-400 hover:text-violet-300 underline">
                  privacidade@flashaprova.com.br
                </a>.
              </p>
            </Section>

            <Section title="2. Dados que Coletamos">
              <p>Coletamos os seguintes dados pessoais:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong className="text-white">Dados de cadastro:</strong> nome, e-mail e senha (armazenada de forma criptografada via Supabase Auth).</li>
                <li><strong className="text-white">Dados de uso:</strong> progresso nos flashcards, intervalos de revisao, historico de estudos e resultados do onboarding.</li>
                <li><strong className="text-white">Dados de redacao:</strong> textos submetidos para correcao pela Prof.a Norma (armazenados no banco de dados e processados via OpenAI API).</li>
                <li><strong className="text-white">Dados de pagamento:</strong> processados diretamente pela Asaas. Nao armazenamos dados de cartao de credito.</li>
                <li><strong className="text-white">Dados tecnicos:</strong> endereco IP, tipo de navegador e cookies de sessao (necessarios para autenticacao).</li>
              </ul>
            </Section>

            <Section title="3. Finalidade do Tratamento">
              <p>Seus dados sao utilizados para:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Fornecer e personalizar os servicos da Plataforma;</li>
                <li>Processar pagamentos e gerenciar assinaturas;</li>
                <li>Calcular metricas de desempenho e algoritmo de repeticao espacada (SRS);</li>
                <li>Enviar comunicacoes transacionais (confirmacao de pagamento, convite de acesso);</li>
                <li>Cumprir obrigacoes legais e regulatorias.</li>
              </ul>
            </Section>

            <Section title="4. Base Legal (LGPD)">
              <p>O tratamento de dados e realizado com base nas seguintes hipoteses previstas na Lei 13.709/2018 (LGPD):</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong className="text-white">Execucao de contrato</strong> — para prestacao dos servicos contratados;</li>
                <li><strong className="text-white">Consentimento</strong> — para comunicacoes de marketing, quando aplicavel;</li>
                <li><strong className="text-white">Cumprimento de obrigacao legal</strong> — quando exigido por lei.</li>
              </ul>
            </Section>

            <Section title="5. Compartilhamento de Dados">
              <p>Seus dados podem ser compartilhados com:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong className="text-white">Supabase</strong> — banco de dados e autenticacao (servidores com conformidade SOC 2);</li>
                <li><strong className="text-white">OpenAI</strong> — processamento dos tutores de IA e correcao de redacoes (dados enviados conforme a politica de privacidade da OpenAI para uso via API — nao sao usados para treinamento);</li>
                <li><strong className="text-white">Asaas</strong> — processamento de pagamentos;</li>
                <li><strong className="text-white">Resend</strong> — envio de e-mails transacionais;</li>
                <li><strong className="text-white">Upstash</strong> — rate limiting (dados anonimizados).</li>
              </ul>
              <p className="mt-2">Nao vendemos nem compartilhamos seus dados com terceiros para fins publicitarios.</p>
            </Section>

            <Section title="6. Retencao de Dados">
              <p>
                Seus dados sao retidos enquanto sua conta estiver ativa. Apos a exclusao da conta, os dados sao removidos em ate 30 dias, exceto quando houver obrigacao legal de retencao por prazo maior.
              </p>
            </Section>

            <Section title="7. Seus Direitos (LGPD)">
              <p>Voce tem direito a:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Confirmar a existencia de tratamento e acessar seus dados;</li>
                <li>Solicitar correcao de dados incompletos ou incorretos;</li>
                <li>Solicitar anonimizacao, bloqueio ou eliminacao de dados desnecessarios;</li>
                <li>Solicitar portabilidade dos dados a outro fornecedor;</li>
                <li>Revogar consentimento a qualquer momento;</li>
                <li>Peticionar a Autoridade Nacional de Protecao de Dados (ANPD).</li>
              </ul>
              <p className="mt-2">
                Para exercer seus direitos, envie um e-mail para{' '}
                <a href="mailto:privacidade@flashaprova.com.br" className="text-violet-400 hover:text-violet-300 underline">
                  privacidade@flashaprova.com.br
                </a>{' '}
                com assunto &quot;Direitos LGPD&quot;. Respondemos em ate 15 dias uteis.
              </p>
            </Section>

            <Section title="8. Cookies">
              <p>
                Utilizamos cookies estritamente necessarios para autenticacao e manutencao da sessao do usuario. Nao utilizamos cookies de rastreamento publicitario ou de terceiros para fins de marketing.
              </p>
            </Section>

            <Section title="9. Seguranca">
              <p>
                Adotamos medidas tecnicas e organizacionais adequadas para proteger seus dados contra acesso nao autorizado, perda ou destruicao, incluindo criptografia em transito (TLS) e em repouso, controle de acesso por Row Level Security (RLS) no banco de dados e autenticacao segura via Supabase Auth.
              </p>
            </Section>

            <Section title="10. Alteracoes nesta Politica">
              <p>
                Podemos atualizar esta Politica periodicamente. Alteracoes relevantes serao comunicadas por e-mail ou aviso na Plataforma com antecedencia minima de 15 dias. O uso continuado apos a vigencia das alteracoes implica aceitacao.
              </p>
            </Section>

            <Section title="11. Contato">
              <p>
                Encarregado de Protecao de Dados (DPO):{' '}
                <a href="mailto:privacidade@flashaprova.com.br" className="text-violet-400 hover:text-violet-300 underline">
                  privacidade@flashaprova.com.br
                </a>
              </p>
            </Section>
          </div>

          <div className="mt-10 pt-6 border-t border-white/5 flex gap-4 text-xs text-slate-600">
            <Link href="/termos" className="hover:text-slate-400 transition-colors">Termos de Uso</Link>
            <Link href="/" className="hover:text-slate-400 transition-colors">Voltar ao inicio</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-white font-bold text-base mb-3" style={{ color: '#a78bfa' }}>{title}</h2>
      {children}
    </div>
  );
}
