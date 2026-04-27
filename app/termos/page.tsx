import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso — FlashAprova',
  description: 'Termos e condições de uso da plataforma FlashAprova.',
};

export default function TermosPage() {
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
          <h1 className="text-3xl font-black text-white mb-2">Termos de Uso</h1>
          <p className="text-slate-500 text-sm mb-8">Última atualização: 25 de abril de 2026</p>

          <div className="space-y-8 text-slate-300 text-sm leading-relaxed">

            <Section title="1. Aceitação dos Termos">
              <p>
                Ao acessar ou utilizar a plataforma FlashAprova (&quot;Plataforma&quot;), operada por FlashAprova Tecnologia Educacional LTDA, com sede no Brasil, você concorda integralmente com estes Termos de Uso. Caso não concorde com qualquer disposição, não utilize a Plataforma.
              </p>
            </Section>

            <Section title="2. Descrição do Serviço">
              <p>
                A FlashAprova é uma plataforma de estudos baseada em repetição espaçada (SRS) e inteligência artificial, voltada à preparação para o ENEM e vestibulares. Os serviços incluem flashcards, dashboard de desempenho, tutores de IA e correção de redações.
              </p>
            </Section>

            <Section title="3. Cadastro e Conta">
              <ul className="list-disc pl-5 space-y-1">
                <li>Você deve ter pelo menos 16 anos para criar uma conta.</li>
                <li>As informações fornecidas no cadastro devem ser verídicas e atualizadas.</li>
                <li>Você é responsável pela confidencialidade de sua senha e por todas as atividades realizadas em sua conta.</li>
                <li>Em caso de uso não autorizado, notifique-nos imediatamente em contato@flashaprova.com.br.</li>
              </ul>
            </Section>

            <Section title="4. Planos e Pagamentos">
              <ul className="list-disc pl-5 space-y-1">
                <li>A Plataforma oferece planos gratuitos e pagos. Os preços e condições estão descritos na página de planos.</li>
                <li>Os pagamentos são processados por meio da plataforma Asaas, sujeitos aos termos desta.</li>
                <li>O acesso ao plano pago é ativado após a confirmação do pagamento.</li>
                <li><strong className="text-white">Garantia de 7 dias:</strong> caso não esteja satisfeito, solicite o reembolso integral em até 7 dias após a compra, sem necessidade de justificativa, pelo e-mail contato@flashaprova.com.br.</li>
              </ul>
            </Section>

            <Section title="5. Uso Permitido">
              <p>Você concorda em utilizar a Plataforma somente para fins pessoais e educacionais, sendo vedado:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Compartilhar sua conta com terceiros;</li>
                <li>Reproduzir, distribuir ou comercializar o conteúdo da Plataforma sem autorização;</li>
                <li>Utilizar ferramentas automatizadas (bots, scrapers) para acessar o conteúdo;</li>
                <li>Praticar qualquer ato que possa prejudicar a Plataforma ou outros usuários.</li>
              </ul>
            </Section>

            <Section title="6. Propriedade Intelectual">
              <p>
                Todo o conteúdo da Plataforma — incluindo flashcards, algoritmos, textos, imagens, marcas e software — é de propriedade exclusiva da FlashAprova ou de seus licenciantes. É proibida qualquer reprodução sem autorização prévia por escrito.
              </p>
            </Section>

            <Section title="7. Disponibilidade e Alterações">
              <p>
                A FlashAprova não garante disponibilidade ininterrupta da Plataforma e pode realizar manutenções a qualquer momento. Podemos alterar, suspender ou encerrar funcionalidades com aviso prévio razoável aos usuários pagantes.
              </p>
            </Section>

            <Section title="8. Limitação de Responsabilidade">
              <p>
                A FlashAprova não se responsabiliza por resultados específicos em provas ou vestibulares, nem por danos indiretos decorrentes do uso ou impossibilidade de uso da Plataforma. Nossa responsabilidade total fica limitada ao valor pago pelo usuário nos últimos 12 meses.
              </p>
            </Section>

            <Section title="9. Rescisão">
              <p>
                Você pode encerrar sua conta a qualquer momento. A FlashAprova pode suspender ou encerrar contas que violem estes Termos, sem obrigação de reembolso em caso de violação comprovada.
              </p>
            </Section>

            <Section title="10. Lei Aplicável e Foro">
              <p>
                Estes Termos são regidos pela legislação brasileira. Eventuais disputas serão submetidas ao foro da comarca de São Paulo/SP, salvo disposição legal em contrário.
              </p>
            </Section>

            <Section title="11. Contato">
              <p>
                Para dúvidas sobre estes Termos:{' '}
                <a href="mailto:contato@flashaprova.com.br" className="text-violet-400 hover:text-violet-300 underline">
                  contato@flashaprova.com.br
                </a>
              </p>
            </Section>
          </div>

          <div className="mt-10 pt-6 border-t border-white/5 flex gap-4 text-xs text-slate-600">
            <Link href="/privacidade" className="hover:text-slate-400 transition-colors">Politica de Privacidade</Link>
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
