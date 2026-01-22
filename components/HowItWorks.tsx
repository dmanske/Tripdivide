
import React from 'react';
import { Button, Card } from './CommonUI';

const steps = [
  {
    number: '01',
    title: 'Destino e Logística',
    benefit: 'Organize o calendário sem esforço.',
    bullets: ['Defina datas e roteiros gerais', 'Crie segmentos (ex: Orlando vs Miami)'],
    icon: '📍'
  },
  {
    number: '02',
    title: 'Grupos e Viajantes',
    benefit: 'Gestão completa de participantes.',
    bullets: ['Organize por grupos/famílias', 'Cadastre documentos (passaporte, RG, visto)', 'Alertas de vencimento automáticos'],
    icon: '👥'
  },
  {
    number: '03',
    title: 'Cotações Inteligentes',
    benefit: 'Centralize tudo, do manual ao WhatsApp.',
    bullets: ['Cole textos brutos do WhatsApp', 'Anexe links e validade de preço', 'Compare lado a lado'],
    icon: '📑'
  },
  {
    number: '04',
    title: 'Votação e Consenso',
    benefit: 'Decisões democráticas e rápidas.',
    bullets: ['Compare opções lado a lado', 'Vote e oficialize o vencedor', 'Histórico de decisões'],
    icon: '⚖️'
  },
  {
    number: '05',
    title: 'Fechamento e Acerto',
    benefit: 'Paz financeira com centavos exatos.',
    bullets: ['Gere reembolsos automáticos', 'Acompanhe quem já pagou o quê', 'Rastreie cada transação'],
    icon: '💸'
  }
];

const features = [
  {
    icon: '💰',
    title: 'Centavos Exatos',
    benefit: 'Zero arredondamentos, zero confusão.',
    bullets: ['Algoritmo ajusta resto automaticamente', 'Último pagante recebe o ajuste']
  },
  {
    icon: '📱',
    title: 'Import WhatsApp',
    benefit: 'Cole e pronto. Sem digitação manual.',
    bullets: ['Extrai preços e datas automaticamente', 'Suporta textos brutos de fornecedores']
  },
  {
    icon: '🏢',
    title: 'Gestão de Fornecedores',
    benefit: 'Saiba com quem está fechando.',
    bullets: ['Avalie reputação e SLA', 'Marque favoritos e red flags']
  },
  {
    icon: '🔄',
    title: 'Reembolsos Automáticos',
    benefit: 'Quem pagou por quem, calculado.',
    bullets: ['Detecta pagamentos cruzados', 'Gera lista de transferências']
  },
  {
    icon: '🎯',
    title: 'Segmentos de Viagem',
    benefit: 'Nem todos vão a todos os lugares.',
    bullets: ['Divida em etapas (Orlando, Miami)', 'Racha só quem participa']
  },
  {
    icon: '💳',
    title: 'Multi-Moeda',
    benefit: 'Compare maçãs com maçãs.',
    bullets: ['Cotações em USD, BRL ou outras', 'Conversão automática para comparação']
  },
  {
    icon: '📄',
    title: 'Gestão de Documentos',
    benefit: 'Nunca mais perca um visto vencido.',
    bullets: ['Cadastre passaportes, vistos, RG, CNH', 'Alertas de vencimento automáticos', 'Criptografia de números sensíveis']
  },
  {
    icon: '👨‍👩‍👧',
    title: 'Racha Flexível',
    benefit: 'Divida do seu jeito.',
    bullets: ['Por grupo, pessoa ou percentual', 'Crianças com peso diferenciado']
  }
];

const HowItWorks: React.FC = () => {
  return (
    <section id="como-funciona" className="py-32 bg-[#02040a] relative overflow-hidden">
      {/* 1. Cinematic Background Image Overlay - VISIBILIDADE MELHORADA */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 grayscale-[0.3] animate-slow-zoom"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=2000')",
            filter: 'brightness(0.6)'
          }}
        />
        {/* Overlays de Mesclagem para garantir leitura */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#02040a] via-[#02040a]/70 to-[#02040a]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#02040a_100%)]" />
      </div>

      {/* 2. Abstract Light Effects */}
      <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-24 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-md">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em]">Metodologia TripDivide</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none italic">
            Como transformamos <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-600">caos em precisão.</span>
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-32">
          {steps.map((step, idx) => (
            <div key={idx} className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-b from-indigo-500/30 to-transparent rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition duration-500 blur-sm" />
              <div className="relative h-full bg-[#05070a]/40 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl flex flex-col hover:bg-white/[0.05] transition-all duration-500">
                <span className="text-5xl font-black text-white/5 mb-6 group-hover:text-indigo-500/20 transition-colors italic">{step.number}</span>
                <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-500">{step.icon}</div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 leading-tight">{step.title}</h3>
                <p className="text-indigo-400 text-[10px] font-black mb-6 leading-relaxed uppercase tracking-widest">{step.benefit}</p>
                <ul className="space-y-3 mt-auto border-t border-white/5 pt-6">
                  {step.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-gray-300 font-medium leading-snug group-hover:text-white transition-colors">
                      <span className="text-indigo-500/80 mt-0.5">→</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="mb-32">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-md">
              <span className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.4em]">Funcionalidades Exclusivas</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none italic">
              Tudo que você precisa<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-600">em um só lugar.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-b from-cyan-500/30 to-transparent rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition duration-500 blur-sm" />
                <div className="relative h-full bg-[#05070a]/40 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl flex flex-col hover:bg-white/[0.05] transition-all duration-500">
                  <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-500">{feature.icon}</div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 leading-tight">{feature.title}</h3>
                  <p className="text-cyan-400 text-[10px] font-black mb-6 leading-relaxed uppercase tracking-widest">{feature.benefit}</p>
                  <ul className="space-y-3 mt-auto border-t border-white/5 pt-6">
                    {feature.bullets.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-gray-300 font-medium leading-snug group-hover:text-white transition-colors">
                        <span className="text-cyan-500/80 mt-0.5">→</span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why Different Section */}
        <div className="max-w-5xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-cyan-500/20 to-indigo-500/20 rounded-[4rem] blur-2xl opacity-50" />
            <div className="relative bg-[#05070a]/90 border border-white/10 rounded-[4rem] p-10 md:p-16 backdrop-blur-3xl">
              <h3 className="text-center text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] mb-16">O diferencial tecnológico</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                <DifferenceItem 
                  title="Centavos Exatos" 
                  desc="Nosso algoritmo ajusta o resto matemático no último pagante automaticamente. Sem arredondamentos que geram desconforto." 
                />
                <DifferenceItem 
                  title="Racha Flexível" 
                  desc="Divida por casal, por pessoa ou participação customizada. O sistema recalcula tudo em tempo real." 
                />
                <DifferenceItem 
                  title="Auditoria SaaS" 
                  desc="Histórico imutável de cada orçamento e pagamento. Transparência bancária para sua viagem de amigos." 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Final CTAs */}
        <div className="mt-24 flex flex-col items-center gap-10">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="group relative">
              <div className="absolute -inset-1 bg-indigo-500 rounded-2xl blur opacity-25 group-hover:opacity-60 transition duration-500"></div>
              <Button 
                variant="primary" 
                className="relative !px-16 !py-6 !text-2xl !rounded-2xl !bg-indigo-600 hover:!bg-indigo-500 shadow-[0_25px_50px_rgba(79,70,229,0.3)] font-black uppercase tracking-tight"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Começar agora
              </Button>
            </div>
            <Button 
              variant="outline" 
              className="!px-12 !py-6 !text-2xl !rounded-2xl !border-white/10 hover:!bg-white/5 transition-all text-white font-bold uppercase tracking-tight backdrop-blur-md"
            >
              Importar WhatsApp 💬
            </Button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.5em]">Segurança ponta-a-ponta • Sem anúncios</p>
            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 30s linear infinite alternate;
        }
      `}</style>
    </section>
  );
};

const DifferenceItem = ({ title, desc }: { title: string, desc: string }) => (
  <div className="text-center md:text-left space-y-6 group">
    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto md:mx-0 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-xl">
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
    </div>
    <div className="space-y-2">
      <h4 className="text-xl font-black text-white uppercase tracking-tight italic">{title}</h4>
      <p className="text-sm text-gray-500 font-medium leading-relaxed group-hover:text-gray-400 transition-colors">{desc}</p>
    </div>
  </div>
);

export default HowItWorks;
