import React from 'react';
import { Truck, ShieldCheck, Headphones } from 'lucide-react';

export const TrustBadges: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5 gap-4 md:gap-0">
        {/* Badge 1: Entrega Grátis */}
        <div className="flex items-center gap-3.5 sm:justify-center px-4 py-2">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-white stroke-[2]" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
              Entrega Grátis em Luanda
            </h4>
            <p className="text-[11px] text-[#8E8E93]">
              Envio rápido e seguro
            </p>
          </div>
        </div>

        {/* Badge 2: Compra Segura */}
        <div className="flex items-center gap-3.5 sm:justify-center px-4 py-2">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-white stroke-[2]" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
              Compra 100% Segura
            </h4>
            <p className="text-[11px] text-[#8E8E93]">
              Multicaixa Express e Transferência Bancária
            </p>
          </div>
        </div>

        {/* Badge 3: Suporte 24/7 */}
        <div className="flex items-center gap-3.5 sm:justify-center px-4 py-2">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
            <Headphones className="w-5 h-5 text-white stroke-[2]" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
              Suporte Personalizado
            </h4>
            <p className="text-[11px] text-[#8E8E93]">
              Atendimento direto via WhatsApp em Angola
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
