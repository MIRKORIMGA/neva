import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Minus, Plus, Tag, Check, Sparkles, Package } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatKz } from '../../data/initialData';

export const CartDrawer: React.FC = () => {
  const {
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    cart,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    cartShippingFee,
    cartGrandTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    setIsCheckoutOpen,
    setCurrentTab,
    setActiveCategory,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');

  if (!isCartDrawerOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const ok = applyCoupon(couponInput);
    if (ok) setCouponInput('');
  };

  const handleProceedToCheckout = () => {
    setIsCartDrawerOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      {/* Slide-over Drawer */}
      <div className="relative w-full max-w-md bg-[#101010] h-full shadow-2xl flex flex-col justify-between z-10 border-l border-white/10">
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#141414]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold text-white uppercase tracking-tight font-display">
              Carrinho de Compras
            </h2>
            <span className="text-xs text-neutral-400 font-mono">
              ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </span>
          </div>

          <button
            onClick={() => setIsCartDrawerOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-neutral-500" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">O teu carrinho está vazio</h3>
            <p className="text-xs text-neutral-400 max-w-xs mb-6">
              Explora os novos lançamentos da NEVA e adiciona peças exclusivas ao teu visual.
            </p>
            <button
              onClick={() => {
                setIsCartDrawerOpen(false);
                setActiveCategory('all');
                setCurrentTab('catalog');
              }}
              className="px-6 py-3 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-full hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Explorar Produtos
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Free Shipping Progress Indicator */}
            <div className="bg-[#171717] p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Entrega Grátis em Luanda
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">Grátis</span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 bg-[#161616] p-3 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 bg-[#202020] rounded-xl p-1 flex items-center justify-center shrink-0 overflow-hidden">
                    {item.product.images[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-neutral-600" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                          aria-label="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Size & Color tag */}
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Tam: <strong className="text-neutral-200">{item.selectedSize}</strong> · Cor:{' '}
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full align-middle border border-neutral-600 ml-1"
                          style={{ backgroundColor: item.selectedColor.hex }}
                        />{' '}
                        {item.selectedColor.name}
                      </p>
                    </div>

                    {/* Quantity & Line Total */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                      <div className="flex items-center bg-[#222222] border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-neutral-400 hover:text-white transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-white tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-neutral-400 hover:text-white transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-white tabular-nums">
                        {formatKz(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code input */}
            <div className="pt-2">
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs text-emerald-300">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>
                      Cupom <strong>{appliedCoupon.code}</strong> ativo (-{appliedCoupon.discountPercent}%)
                    </span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-neutral-400 hover:text-white underline text-[11px]"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Código promocional"
                    className="flex-1 bg-[#171717] border border-[#2c2c2c] text-xs text-white uppercase rounded-xl px-3 py-2.5 focus:outline-none focus:border-white/50"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-[#252525] hover:bg-neutral-200 hover:text-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Aplicar
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Drawer Footer with Subtotal & Checkout */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-white/10 bg-[#141414] space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal:</span>
                <span className="text-white tabular-nums font-semibold">
                  {formatKz(cartSubtotal)}
                </span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-400">
                  <span>Desconto ({appliedCoupon.discountPercent}%):</span>
                  <span className="tabular-nums font-semibold">
                    -{formatKz((cartSubtotal * appliedCoupon.discountPercent) / 100)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-neutral-400">
                <span>Entrega (Luanda):</span>
                <span className="text-white tabular-nums font-semibold">
                  {cartShippingFee === 0 ? 'Grátis' : formatKz(cartShippingFee)}
                </span>
              </div>

              <div className="flex justify-between text-sm sm:text-base font-bold text-white pt-2 border-t border-white/10">
                <span>Total Estimado:</span>
                <span className="text-lg font-black text-white tabular-nums font-display">
                  {formatKz(cartGrandTotal)}
                </span>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full py-4 bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-wider rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-white/10"
            >
              <span>Finalizar Encomenda</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
