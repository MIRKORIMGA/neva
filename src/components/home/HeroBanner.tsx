import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { NevaLogo } from '../common/NevaLogo';

export const HeroBanner: React.FC = () => {
  const { setCurrentTab, setActiveCategory } = useStore();

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121212] via-[#0d0d0d] to-[#050505] border border-white/5 shadow-2xl">
        {/* Subtle ambient lighting effects */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px] sm:min-h-[520px] items-stretch">
          {/* Left Column: Brand Statement & CTA */}
          <div className="md:col-span-7 p-6 sm:p-10 lg:p-14 flex flex-col justify-center z-10">
            <div>
              {/* Collection Label */}
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-8 sm:w-12 h-[2px] bg-white/80" />
                <span className="text-xs sm:text-sm font-semibold tracking-widest text-neutral-300 uppercase">
                  NEVA OFICIAL
                </span>
              </div>

              {/* NEVA Brand Wordmark Header */}
              <div className="mb-2 sm:mb-3">
                <NevaLogo size="xl" className="h-9 sm:h-12 text-white" />
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-[1.05] mt-2 mb-3 sm:mb-4 text-balance">
                DEFINE O TEU ESTILO.
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-lg text-[#BDBDBD] font-normal max-w-md leading-relaxed mb-6 sm:mb-8">
                Moda que representa a tua identidade.
              </p>

              {/* Primary Call To Action Button */}
              <div>
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    setCurrentTab('catalog');
                  }}
                  className="inline-flex items-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-black font-extrabold text-xs sm:text-sm tracking-wider uppercase rounded-full hover:bg-neutral-200 transition-all transform active:scale-95 shadow-lg shadow-white/10 cursor-pointer"
                >
                  <span>Explorar Coleção</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: High-Fashion Model Visual */}
          <div className="md:col-span-5 relative flex items-center justify-center overflow-hidden min-h-[320px] md:min-h-full">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:bg-gradient-to-r md:from-[#0d0d0d] md:to-transparent z-[1]" />

            <img
              src="/images/hero_model.png"
              alt="NEVA Streetwear Model"
              className="w-full h-full max-h-[540px] object-cover object-top transform hover:scale-105 transition-transform duration-700 ease-out"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
