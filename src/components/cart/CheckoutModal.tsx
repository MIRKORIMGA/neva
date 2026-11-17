import React, { useState } from 'react';
import { X, Check, Copy, ShieldCheck, Truck, MessageCircle, AlertCircle, ShoppingBag, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../../context/StoreContext';
import { formatKz, ANGOLA_PROVINCES, BANKING_INFO } from '../../data/initialData';
import { PaymentMethod, Order } from '../../types';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    cartSubtotal,
    cartShippingFee,
    cartGrandTotal,
    appliedCoupon,
    createOrder,
    user,
    setCurrentTab,
    showToast,
  } = useStore();

  // Form State
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '+244 ');
  const [email, setEmail] = useState(user?.email || '');
  const [province, setProvince] = useState<string>('Luanda');
  const [municipality, setMunicipality] = useState<string>('Talatona');
  const [address, setAddress] = useState(user?.addresses[0]?.address || '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('multicaixa_express');

  // Completed Order State
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isCheckoutOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast(`${label} copiado!`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      showToast('Por favor insere o teu nome completo.', 'error');
      return;
    }
    if (!phone.trim() || phone.length < 9) {
      showToast('Por favor insere um número de telefone angolano válido.', 'error');
      return;
    }
    if (!address.trim()) {
      showToast('Por favor indica a tua morada de entrega ou ponto de referência.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await createOrder({
        customerName: fullName,
        customerEmail: email || 'cliente@neva.ao',
        customerPhone: phone,
        province,
        municipality,
        address,
        paymentMethod,
        items: [...cart],
        subtotal: cartSubtotal,
        shippingFee: cartShippingFee,
        total: cartGrandTotal,
        notes,
      });

      if (!order) {
        return;
      }

      setCompletedOrder(order);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFFFFF', '#BDBDBD', '#4ADE80', '#F59E0B'],
        });
      } catch {
        // ignore if not supported
      }

      showToast('Encomenda realizada com sucesso!', 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppConfirmation = () => {
    if (!completedOrder) return;
    const itemsText = completedOrder.items
      .map((it) => `- ${it.quantity}x ${it.product.name} (${it.selectedSize})`)
      .join('%0A');

    const msg = `Olá NEVA! Acabei de fazer uma encomenda no vosso site:%0A%0A*Pedido:* %23${completedOrder.orderNumber}%0A*Nome:* ${completedOrder.customerName}%0A*Total:* ${formatKz(completedOrder.total)}%0A*Método:* ${completedOrder.paymentMethod}%0A*Entrega:* ${completedOrder.municipality}, ${completedOrder.province}%0A%0A*Itens:*%0A${itemsText}%0A%0AEnvio aqui o meu comprovativo de pagamento. Obrigado!`;

    window.open(`https://wa.me/244962716161?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={() => {
          if (!completedOrder) setIsCheckoutOpen(false);
        }}
      />

      {/* Main Container */}
      <div className="relative w-full max-w-2xl bg-[#111111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#141414] shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white uppercase tracking-tight font-display">
              {completedOrder ? 'Encomenda Confirmada' : 'Finalizar Encomenda'}
            </h2>
          </div>

          <button
            onClick={() => {
              setIsCheckoutOpen(false);
              setCompletedOrder(null);
            }}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto">
          {completedOrder ? (
            /* Order Success View */
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-600/40 text-emerald-400 mx-auto flex items-center justify-center">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Obrigado pela tua preferência!
                </span>
                <h3 className="text-2xl font-black text-white font-display mt-1">
                  Pedido #{completedOrder.orderNumber}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-md mx-auto">
                  A tua encomenda foi registada com sucesso. Em breve a nossa equipa entrará em contacto para agendar a entrega.
                </p>
              </div>

              {/* Payment instructions card */}
              <div className="bg-[#181818] border border-white/10 rounded-2xl p-5 text-left space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Detalhes para Pagamento & Confirmação
                </h4>

                {completedOrder.paymentMethod === 'multicaixa_express' && (
                  <div className="space-y-2 text-xs">
                    <p className="text-neutral-300">
                      Transfere via <strong>Multicaixa Express</strong> para o terminal:
                    </p>
                    <div className="flex items-center justify-between p-3 bg-black/50 rounded-xl border border-white/5">
                      <span className="font-mono text-sm text-white font-bold">
                        {BANKING_INFO.multicaixaExpressPhone}
                      </span>
                      <button
                        onClick={() => handleCopy(BANKING_INFO.multicaixaExpressPhone.replace(/\s+/g, ''), 'Número Multicaixa')}
                        className="text-xs text-neutral-300 hover:text-white flex items-center gap-1 underline"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedField === 'Número Multicaixa' ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                )}

                {completedOrder.paymentMethod === 'transfer' && (
                  <div className="space-y-2 text-xs">
                    <p className="text-neutral-300">
                      Solicita os dados bancários atualizados e envia o comprovativo diretamente pelo WhatsApp oficial da NEVA:
                    </p>
                    <div className="flex items-center justify-between p-3 bg-black/50 rounded-xl border border-white/5">
                      <span className="font-mono text-sm text-white font-bold">
                        {BANKING_INFO.whatsappSupport}
                      </span>
                      <button
                        onClick={() => handleCopy(BANKING_INFO.whatsappSupport, 'WhatsApp NEVA')}
                        className="text-xs text-neutral-300 hover:text-white flex items-center gap-1 underline"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedField === 'WhatsApp NEVA' ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                )}

                {completedOrder.paymentMethod === 'delivery' && (
                  <p className="text-xs text-neutral-300">
                    O pagamento será efetuado em dinheiro ou TPA Multicaixa no momento da receção da encomenda em Luanda.
                  </p>
                )}

                {/* WhatsApp validation callout */}
                <div className="pt-2">
                  <button
                    onClick={handleWhatsAppConfirmation}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar Comprovativo via WhatsApp</span>
                  </button>
                  <p className="text-[11px] text-neutral-500 text-center mt-2">
                    Clica acima para abrir o WhatsApp com os dados da encomenda pré-preenchidos.
                  </p>
                </div>
              </div>

              {/* Order Items summary */}
              <div className="bg-[#141414] p-4 rounded-xl border border-white/5 text-left text-xs space-y-2">
                <div className="flex justify-between font-bold text-white border-b border-white/5 pb-2">
                  <span>Resumo da Encomenda:</span>
                  <span className="tabular-nums font-mono text-sm">{formatKz(completedOrder.total)}</span>
                </div>
                <p className="text-neutral-400">
                  Destinatário: <strong className="text-white">{completedOrder.customerName}</strong> ({completedOrder.customerPhone})
                </p>
                <p className="text-neutral-400">
                  Endereço: <strong className="text-white">{completedOrder.address}, {completedOrder.municipality}, {completedOrder.province}</strong>
                </p>
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setCompletedOrder(null);
                    setCurrentTab('account');
                  }}
                  className="flex-1 py-3 bg-[#1e1e1e] hover:bg-[#282828] text-white font-bold text-xs uppercase tracking-wider rounded-full transition-colors cursor-pointer"
                >
                  Ver Minhas Encomendas
                </button>
                <button
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setCompletedOrder(null);
                    setCurrentTab('home');
                  }}
                  className="flex-1 py-3 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-full hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  Continuar a Comprar
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form View */
            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {/* Customer Personal Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                  <span>1. Dados Pessoais</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="O teu nome completo"
                      className="w-full bg-[#181818] border border-[#2b2b2b] text-sm text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-white/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Telefone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+244 9XX XXX XXX"
                      className="w-full bg-[#181818] border border-[#2b2b2b] text-sm text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-white/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    E-mail (opcional para recibo)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="o-teu-email@exemplo.ao"
                    className="w-full bg-[#181818] border border-[#2b2b2b] text-sm text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-white/50"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-white" />
                  <span>2. Endereço de Entrega em Angola</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Província *
                    </label>
                    <select
                      value={province}
                      onChange={(e) => {
                        const newProv = e.target.value;
                        setProvince(newProv);
                        const firstMuni = ANGOLA_PROVINCES[newProv]?.[0] || 'Central';
                        setMunicipality(firstMuni);
                      }}
                      className="w-full bg-[#181818] border border-[#2b2b2b] text-sm text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-white/50 cursor-pointer"
                    >
                      {Object.keys(ANGOLA_PROVINCES).map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Município *
                    </label>
                    <select
                      value={municipality}
                      onChange={(e) => setMunicipality(e.target.value)}
                      className="w-full bg-[#181818] border border-[#2b2b2b] text-sm text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-white/50 cursor-pointer"
                    >
                      {(ANGOLA_PROVINCES[province] || ['Central']).map((muni) => (
                        <option key={muni} value={muni}>
                          {muni}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Endereço Completo & Ponto de Referência *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Bairro, Rua, Edifício, nº da casa ou ponto de referência conhecido..."
                    className="w-full bg-[#181818] border border-[#2b2b2b] text-sm text-white rounded-xl px-3.5 py-2 focus:outline-none focus:border-white/50 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Instruções adicionais (opcional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Ligar antes de entregar, deixar na portaria..."
                    className="w-full bg-[#181818] border border-[#2b2b2b] text-sm text-white rounded-xl px-3.5 py-2 focus:outline-none focus:border-white/50"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  3. Forma de Pagamento
                </h3>

                <div className="space-y-2">
                  {/* Option 1: Multicaixa Express */}
                  <label
                    onClick={() => setPaymentMethod('multicaixa_express')}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'multicaixa_express'
                        ? 'bg-[#181818] border-white text-white'
                        : 'bg-[#141414] border-white/5 text-neutral-400 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'multicaixa_express'}
                      onChange={() => setPaymentMethod('multicaixa_express')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Multicaixa Express</span>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white font-medium">Recomendado</span>
                      </div>
                      <p className="text-[11px] text-[#8E8E93] mt-0.5">
                        Transfere via telemóvel para o número oficial NEVA ({BANKING_INFO.multicaixaExpressPhone})
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Bank Transfer BAI */}
                  <label
                    onClick={() => setPaymentMethod('transfer')}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'transfer'
                        ? 'bg-[#181818] border-white text-white'
                        : 'bg-[#141414] border-white/5 text-neutral-400 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'transfer'}
                      onChange={() => setPaymentMethod('transfer')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-white">Transferência Bancária (IBAN)</span>
                      <p className="text-[11px] text-[#8E8E93] mt-0.5">
                        Transfere diretamente para a conta BAI da NEVA Store
                      </p>
                    </div>
                  </label>

                  {/* Option 3: Cash on Delivery (Luanda) */}
                  <label
                    onClick={() => setPaymentMethod('delivery')}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'delivery'
                        ? 'bg-[#181818] border-white text-white'
                        : 'bg-[#141414] border-white/5 text-neutral-400 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'delivery'}
                      onChange={() => setPaymentMethod('delivery')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-white">Pagamento na Entrega (TPA / Dinheiro)</span>
                      <p className="text-[11px] text-[#8E8E93] mt-0.5">
                        Disponível exclusivamente para entregas na província de Luanda
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Total Summary Breakdown */}
              <div className="bg-[#161616] p-4 rounded-2xl border border-white/5 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Itens ({cart.length}):</span>
                  <span className="text-white tabular-nums font-semibold">{formatKz(cartSubtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Cupom ({appliedCoupon.code}):</span>
                    <span className="tabular-nums font-semibold">
                      -{formatKz((cartSubtotal * appliedCoupon.discountPercent) / 100)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-400">
                  <span>Taxa de Entrega:</span>
                  <span className="text-white tabular-nums font-semibold">
                    {cartShippingFee === 0 ? 'Grátis' : formatKz(cartShippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/5">
                  <span>Total a Pagar:</span>
                  <span className="text-xl font-black text-white tabular-nums font-display">
                    {formatKz(cartGrandTotal)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-white/10 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>A processar encomenda...</span>
                ) : (
                  <>
                    <span>Confirmar Encomenda ({formatKz(cartGrandTotal)})</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
