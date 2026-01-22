
import React from 'react';
import { Button } from './CommonUI';

interface LandingHeroProps {
  onCreateTrip: () => void;
}

const LandingHero: React.FC<LandingHeroProps> = ({ onCreateTrip }) => {
  const scrollToHow = () => {
    document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative w-full h-[95vh] md:h-screen overflow-hidden flex items-center justify-center bg-[#02040a]">
      {/* 1. Cinematic Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&q=80&w=2000"
          className="w-full h-full object-cover opacity-40 scale-110"
          style={{ filter: 'brightness(0.7) contrast(1.2) saturate(0.8) blur(1px)' }}
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-night-city-traffic-in-a-time-lapse-4444-large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 z-[1] pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        <div className="absolute inset-0 z-[2] bg-[radial-gradient(circle_at_center,_transparent_0%,_#02040a_120%)]" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-[#02040a]/80 via-transparent to-[#02040a]" />
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-cyan-500/20 blur-[100px] z-[3] animate-pulse" />
      </div>

      {/* 2. Conteúdo Central */}
      <div className="relative z-10 container mx-auto px-6 flex flex-col items-center text-center">
        <div className="mb-12 relative group">
          <div className="absolute -inset-8 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/40 transition-all duration-1000 animate-pulse"></div>
          <div className="relative p-6 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-700">
            <img 
              src="logo.png" 
              alt="TripDivide Logo" 
              className="h-20 md:h-28 w-auto object-contain brightness-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="flex flex-col items-center">
                      <div class="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-2xl flex items-center justify-center text-3xl font-black italic shadow-lg">TD</div>
                      <span class="mt-2 text-xl font-black text-white uppercase tracking-tighter">TripDivide</span>
                    </div>
                  `;
                }
              }}
            />
          </div>
        </div>

        <div className="space-y-4 max-w-4xl mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em]">Cálculo em centavos exatos</span>
           </div>
           
           <h1 className="text-6xl md:text-9xl font-black text-white uppercase tracking-tighter leading-[0.85] select-none italic">
             O racha <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-500">perfeito</span><br/>
             <span className="text-indigo-500 drop-shadow-[0_0_30px_rgba(79,70,229,0.5)]">começa aqui.</span>
           </h1>
           
           <p className="text-gray-400 text-lg md:text-2xl max-w-2xl mx-auto font-light leading-tight tracking-tight mt-6">
             Planeje, vote e divida custos da sua viagem em grupo com <span className="text-white font-bold">precisão absoluta</span>. 
             <span className="block text-sm text-gray-600 mt-2 uppercase font-black tracking-widest">Sem planilhas • Sem confusão</span>
           </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 mb-20">
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-2xl blur-md opacity-40 group-hover:opacity-100 transition duration-500"></div>
            <Button 
              variant="primary" 
              className="relative !px-14 !py-6 !text-2xl !rounded-2xl !bg-indigo-600 hover:!bg-indigo-500 transition-all transform hover:scale-105 active:scale-95 font-black uppercase tracking-tight shadow-2xl"
              onClick={onCreateTrip}
            >
              Criar Viagem Agora
            </Button>
          </div>
          <Button 
            variant="outline" 
            className="!px-12 !py-6 !text-2xl !rounded-2xl !border-white/10 hover:!bg-white/5 transition-all text-white/70 font-bold uppercase tracking-tight"
            onClick={scrollToHow}
          >
            Ver como funciona
          </Button>
        </div>

        <div className="flex flex-col items-center gap-4 border-t border-white/5 pt-12 w-full max-w-xl">
           <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em]">Ideal para grupos de 6 a 20 pessoas</p>
           <div className="flex gap-8 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
              <span className="text-xs font-black text-white">ORLANDO 2026</span>
              <span className="text-xs font-black text-white">EUROTRIP</span>
              <span className="text-xs font-black text-white">MIAMI NIGHTS</span>
           </div>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] z-20" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
        <div className="w-[1px] h-12 bg-gradient-to-b from-indigo-500 to-transparent animate-bounce"></div>
      </div>
    </section>
  );
};

export default LandingHero;
