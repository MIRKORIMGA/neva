import React, { useState } from 'react';
import { ArrowRight, Check, MessageCircle, Instagram } from 'lucide-react';
import { NevaLogo } from '../common/NevaLogo';
import { BANKING_INFO } from '../../data/initialData';
import { useStore } from '../../context/StoreContext';

export const Footer: React.FC = () => {
  const { showToast } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      showToast('Por favor insere um e-mail válido.', 'error');
      return;
    }
    setSubscribed(true);
    showToast('Inscrição confirmada! Receberás novidades exclusivas da NEVA.');
    setNewsletterEmail('');
  };

  return (
    <footer className="w-full bg-[#080808] border-t border-[#1a1a1a] text-white pt-12 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Section: Brand Statement & Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10 border-b border-[#1c1c1c]">
          <div className="lg:col-span-6">
            <NevaLogo size="lg" className="h-8 mb-4" />
            <p className="text-xl sm:text-2xl font-bold font-display uppercase tracking-tight text-white mb-2">
              DEFINE O TEU ESTILO.
            </p>
            <p className="text-sm text-[#8E8E93] max-w-md">
              A marca angolana que une a essência urbana internacional ao streetwear contemporâneo. Qualidade extrema, corte oversized e detalhes autênticos.
            </p>

            {/* Clean social channels */}
            <div className="flex items-center gap-3 pt-5">
              <a
                href={BANKING_INFO.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161616] hover:bg-emerald-600/30 border border-white/10 hover:border-emerald-500/50 text-xs text-neutral-300 hover:text-white transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp: {BANKING_INFO.whatsappSupport}</span>
              </a>

              <a
                href={BANKING_INFO.instagramLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161616] hover:bg-pink-600/30 border border-white/10 hover:border-pink-500/50 text-xs text-neutral-300 hover:text-white transition-colors"
              >
                <Instagram className="w-3.5 h-3.5 text-pink-400" />
                <span>{BANKING_INFO.instagram}</span>
              </a>

              <a
                href={BANKING_INFO.tiktokLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161616] hover:bg-neutral-800 border border-white/10 text-xs text-neutral-300 hover:text-white transition-colors"
              >
                <span className="font-bold text-[10px] text-cyan-400">TT</span>
                <span>{BANKING_INFO.tiktok}</span>
              </a>
            </div>
          </div>

          {/* Newsletter Box */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-2">
              Recebe os Próximos Drops em Primeira Mão
            </h4>
            <p className="text-xs text-[#8E8E93] mb-4">
              Inscreve o teu e-mail para teres acesso antecipado a coleções limitadas e ofertas secretas.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="O teu melhor e-mail..."
                  className="w-full bg-[#141414] border border-[#2b2b2b] text-sm text-white rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-white/50"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-neutral-200 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {subscribed ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Inscrito</span>
                  </>
                ) : (
                  <>
                    <span>Inscrever</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#737373] gap-3">
          <p>© {new Date().getFullYear()} NEVA FASHION STORE. Todos os direitos reservados. Localização: Online · Angola.</p>
          <div className="flex items-center gap-4">
            <span>Moeda: Kwanza Angolano (Kz)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
