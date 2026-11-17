import React, { useState, useEffect } from 'react';
import { X, Heart, ShoppingBag, ShieldCheck, Truck, ArrowRight, Check, Minus, Plus, Package } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatKz } from '../../data/initialData';
import { Product, ProductColor } from '../../types';

export const ProductDetailModal: React.FC = () => {
  const {
    selectedProductForModal,
    setSelectedProductForModal,
    addToCart,
    toggleFavorite,
    isFavorite,
    setIsCheckoutOpen,
    products,
  } = useStore();

  const product = selectedProductForModal;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Sync default size and color when product changes
  useEffect(() => {
    if (product) {
      setActiveImageIndex(0);
      setSelectedSize(product.sizes[0] || 'L');
      setSelectedColor(product.colors[0] || { name: 'Padrão', hex: '#000000' });
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  const favorite = isFavorite(product.id);

  const handleAddToCart = () => {
    if (!selectedColor) return;
    addToCart(product, selectedSize, selectedColor, quantity);
  };

  const handleBuyNow = () => {
    if (!selectedColor) return;
    addToCart(product, selectedSize, selectedColor, quantity);
    setSelectedProductForModal(null);
    setIsCheckoutOpen(true);
  };

  // Related products in the same category
  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={() => setSelectedProductForModal(null)}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-[#111111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto max-h-[92vh] flex flex-col">
        {/* Sticky Header with Close and Title */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#111111] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">
              {product.categoryLabel}
            </span>
            <span className="text-white/20">/</span>
            <span className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
              {product.name}
            </span>
          </div>

          <button
            onClick={() => setSelectedProductForModal(null)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left: Gallery Column */}
            <div className="md:col-span-6 flex flex-col gap-4">
              {/* Main Image Display */}
              <div className="relative aspect-square w-full rounded-2xl bg-[#171717] border border-white/5 p-6 flex items-center justify-center overflow-hidden">
                {product.images[activeImageIndex] || product.images[0] ? (
                  <img
                    src={product.images[activeImageIndex] || product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-contain filter drop-shadow-2xl transition-all duration-300"
                  />
                ) : (
                  <Package className="w-16 h-16 text-neutral-600" />
                )}

                {/* Favorite Heart on Image */}
                <button
                  type="button"
                  onClick={() => toggleFavorite(product.id)}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 hover:bg-black/90 transition-colors text-white backdrop-blur-sm"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      favorite ? 'fill-red-500 text-red-500' : 'text-neutral-400 hover:text-white'
                    }`}
                  />
                </button>
              </div>

              {/* Thumbnail row if multiple images exist */}
              {product.images.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-16 h-16 rounded-xl bg-[#181818] border p-1 transition-all overflow-hidden flex items-center justify-center cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-white ring-2 ring-white/20'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Details & Controls */}
            <div className="md:col-span-6 flex flex-col justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight font-display mb-2">
                  {product.name}
                </h2>

                {/* Price block */}
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-2xl sm:text-3xl font-black text-white tabular-nums font-display">
                    {formatKz(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-neutral-400 line-through tabular-nums">
                      {formatKz(product.originalPrice)}
                    </span>
                  )}
                  <span className="text-[11px] text-emerald-400 font-semibold px-2 py-0.5 bg-emerald-950/40 border border-emerald-800/40 rounded-full">
                    Em Stock ({product.stockQuantity} un.)
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[#BDBDBD] leading-relaxed mb-6">
                  {product.description}
                </p>

                {/* Color Selector */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mb-5">
                    <label className="text-xs font-semibold text-neutral-300 block mb-2">
                      Cor: <span className="text-white font-bold">{selectedColor?.name}</span>
                    </label>
                    <div className="flex items-center gap-2.5">
                      {product.colors.map((color) => {
                        const isSelected = selectedColor?.name === color.name;
                        return (
                          <button
                            key={color.name}
                            onClick={() => setSelectedColor(color)}
                            title={color.name}
                            className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                              isSelected
                                ? 'border-white scale-110 shadow-lg'
                                : 'border-neutral-700 hover:border-neutral-500'
                            }`}
                            style={{ backgroundColor: color.hex }}
                          >
                            {isSelected && (
                              <Check
                                className={`w-4 h-4 ${
                                  color.hex === '#FFFFFF' ? 'text-black' : 'text-white'
                                }`}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Size Selector */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-neutral-300">
                      Tamanho: <span className="text-white font-bold">{selectedSize}</span>
                    </label>
                    <span className="text-[11px] text-neutral-400 underline">
                      Guia de Medidas
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[44px] px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          selectedSize === size
                            ? 'bg-white text-black border-white shadow-md'
                            : 'bg-[#181818] text-neutral-300 border-white/10 hover:border-white/30'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="mb-6 flex items-center gap-4">
                  <span className="text-xs font-semibold text-neutral-300">Quantidade:</span>
                  <div className="flex items-center bg-[#181818] border border-white/10 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-xs font-bold text-white tabular-nums">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                      className="p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Add to Cart and Buy Now */}
              <div className="space-y-2.5 pt-4 border-t border-white/10">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="w-full py-3.5 bg-[#202020] hover:bg-[#282828] text-white font-bold text-xs uppercase tracking-wider rounded-full border border-white/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Adicionar</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    className="w-full py-3.5 bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-wider rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-white/10"
                  >
                    <span>Comprar Agora</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Delivery reassurance */}
                <div className="pt-3 flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-white" /> Entrega em 24-48h em Luanda
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Garantia Oficial NEVA
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          {related.length > 0 && (
            <div className="pt-6 border-t border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">
                Poderás também gostar
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {related.map((rel) => (
                  <button
                    key={rel.id}
                    onClick={() => setSelectedProductForModal(rel)}
                    className="bg-[#161616] hover:bg-[#202020] border border-white/5 rounded-2xl p-3 text-left transition-colors cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="aspect-square w-full mb-2 flex items-center justify-center">
                      {rel.images[0] ? (
                        <img
                          src={rel.images[0]}
                          alt={rel.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-neutral-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white truncate">{rel.name}</p>
                      <p className="text-xs font-bold text-white tabular-nums mt-0.5">
                        {formatKz(rel.price)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
