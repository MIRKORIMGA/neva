import React, { useState } from 'react';
import { ArrowRight, MessageCircle, Instagram, Globe, Phone, Copy, Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { NevaLogo } from '../common/NevaLogo';

export const BrandStory: React.FC = () => {
  const { setCurrentTab, setActiveCategory, showToast } = useStore();
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    showToast(`${label} copiado!`);
    setTimeout(() => setCopiedItem(null), 2500);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="relative rounded-3xl bg-[#0c0c0c] border border-white/5 overflow-hidden p-6 sm:p-12 lg:p-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Brand Info & Official Contacts */}
          <div className="lg:col-span-7">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/5 border border-white/10 rounded-full mb-4">
              <span className="text-[11px] font-semibold text-neutral-200 uppercase tracking-widest">
                Informações da NEVA
              </span>
            </div>

            <div className="mb-4">
              <NevaLogo size="lg" className="h-8 sm:h-10" />
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-tight mb-3">
              DEFINE O TEU ESTILO.<br />
              <span className="text-neutral-400 font-light">CONECTA-TE COM A NEVA.</span>
            </h2>

            <p className="text-sm sm:text-base text-[#BDBDBD] leading-relaxed mb-6 max-w-xl">
              Acompanha os lançamentos exclusivos, novos drops e entra em contacto direto connosco através dos nossos canais oficiais.
            </p>

            {/* Official Info Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
              {/* Card 1: WhatsApp / Contacto */}
              <div className="bg-[#141414] border border-white/10 hover:border-white/25 rounded-2xl p-4 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp / Contacto
                  </span>
                  <button
                    onClick={() => handleCopy('962716161', 'Número WhatsApp')}
                    className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                    title="Copiar número"
                  >
                    {copiedItem === 'Número WhatsApp' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-lg font-black text-white font-mono tracking-wide">
                  962 716 161
                </p>
                <a
                  href="https://wa.me/244962716161"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Iniciar Conversa
                </a>
              </div>

              {/* Card 2: Instagram */}
              <div className="bg-[#141414] border border-white/10 hover:border-white/25 rounded-2xl p-4 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5 text-pink-400" /> Instagram Oficial
                  </span>
                </div>
                <p className="text-lg font-black text-white font-display tracking-tight">
                  @_neva7161
                </p>
                <a
                  href="https://instagram.com/_neva7161"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-pink-400 hover:text-pink-300"
                >
                  Ver Perfil no Instagram →
                </a>
              </div>

              {/* Card 3: TikTok */}
              <div className="bg-[#141414] border border-white/10 hover:border-white/25 rounded-2xl p-4 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold flex items-center gap-1.5">
                    <span className="font-bold text-cyan-400 text-xs">TT</span> TikTok Oficial
                  </span>
                </div>
                <p className="text-lg font-black text-white font-display tracking-tight">
                  @neva7161
                </p>
                <a
                  href="https://www.tiktok.com/@neva7161"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300"
                >
                  Seguir no TikTok →
                </a>
              </div>

              {/* Card 4: Localização */}
              <div className="bg-[#141414] border border-white/10 hover:border-white/25 rounded-2xl p-4 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-400" /> Localização
                  </span>
                </div>
                <p className="text-lg font-black text-white font-display tracking-tight">
                  Online
                </p>
                <p className="mt-2.5 text-xs text-neutral-400">
                  Loja 100% digital com envio expresso
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setCurrentTab('catalog');
                }}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-black font-extrabold text-xs uppercase tracking-wider rounded-full hover:bg-neutral-200 transition-all cursor-pointer shadow-lg shadow-white/10"
              >
                <span>Explorar Todos os Produtos</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="https://wa.me/244962716161"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#181818] hover:bg-[#222222] text-white font-bold text-xs uppercase tracking-wider rounded-full border border-white/10 transition-all"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Falar no WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Right Column: Visual Composition */}
          <div className="lg:col-span-5 relative">
            <div className="aspect-square rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl bg-black">
              <img
                src="/assets/aistudio/Retrato_Streetwear_NEVA_em_Preto_e_Branco_c338d748.png"
                alt="NEVA Streetwear Editorial"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-lg font-bold text-white">
                  Define o Teu Estilo em Qualquer Lugar.
                </p>
                <p className="text-xs text-neutral-300 mt-1">
                  Atendimento direto: 962 716 161
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
