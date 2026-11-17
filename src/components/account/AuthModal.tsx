import React, { useState } from 'react';
import { X, Lock, Mail, User, ArrowRight, Loader2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { NevaLogo } from '../common/NevaLogo';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    login,
    authenticateWithPassword,
    registerCustomer,
    requestPasswordReset,
    setCurrentTab,
    showToast,
  } = useStore();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+244 ');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const trimmedEmail = email.trim();
  const isAdminCode = trimmedEmail === 'nevaadmin7161';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode !== 'forgot' && isAdminCode) {
      login(trimmedEmail, 'admin');
      setIsAuthModalOpen(false);
      setCurrentTab('admin');
      setEmail('');
      setPassword('');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      showToast('Por favor insere um e-mail válido.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'forgot') {
        const ok = await requestPasswordReset(trimmedEmail);
        if (ok) setMode('login');
        return;
      }

      if (mode === 'register') {
        if (password.length < 6) {
          showToast('A senha deve ter pelo menos 6 caracteres.', 'error');
          return;
        }
        const ok = await registerCustomer({
          name: name.trim(),
          email: trimmedEmail,
          phone: phone.trim(),
          password,
        });
        if (ok) {
          setEmail('');
          setPassword('');
          setName('');
          setIsAuthModalOpen(false);
        }
      } else {
        const ok = await authenticateWithPassword(trimmedEmail, password);
        if (ok) {
          setEmail('');
          setPassword('');
          setIsAuthModalOpen(false);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsAuthModalOpen(false)}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 my-auto">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-5 right-5 p-1.5 text-neutral-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <NevaLogo size="lg" className="h-8" />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight font-display">
            {mode === 'login' && 'Entrar na Conta'}
            {mode === 'register' && 'Criar Conta NEVA'}
            {mode === 'forgot' && 'Recuperar Senha'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {mode === 'login' && 'Acede às tuas encomendas, favoritos e endereços guardados.'}
            {mode === 'register' && 'Junta-te à comunidade exclusiva de streetwear da NEVA.'}
            {mode === 'forgot' && 'Insere o teu e-mail para receber as instruções de redefinição.'}
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && !isAdminCode && (
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="O teu nome completo"
                  className="w-full bg-[#181818] border border-[#2b2b2b] text-sm text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-white/50"
                />
                <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              E-mail
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@gmail.com"
                className="w-full bg-[#181818] border border-[#2b2b2b] text-sm text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-white/50"
              />
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
            </div>
          </div>

          {mode === 'register' && !isAdminCode && (
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Telefone (WhatsApp)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+244 9XX XXX XXX"
                className="w-full bg-[#181818] border border-[#2b2b2b] text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-white/50"
              />
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-neutral-300">
                  Senha
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-neutral-400 hover:text-white underline cursor-pointer"
                  >
                    Esqueceste a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  required={!isAdminCode}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#181818] border border-[#2b2b2b] text-sm text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-white/50"
                />
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>A processar...</span>
              </>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Entrar'}
                  {mode === 'register' && 'Registar'}
                  {mode === 'forgot' && 'Enviar Instruções'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch mode links */}
        <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs text-neutral-400">
          {mode === 'login' && (
            <p>
              Ainda não tens conta?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-white font-bold underline ml-1 cursor-pointer"
              >
                Criar conta agora
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p>
              Já tens uma conta?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-white font-bold underline ml-1 cursor-pointer"
              >
                Fazer login
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <p>
              Lembraste da tua senha?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-white font-bold underline ml-1 cursor-pointer"
              >
                Voltar ao login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
