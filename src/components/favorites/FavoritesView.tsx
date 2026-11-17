import React from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight, Package } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatKz } from '../../data/initialData';

export const FavoritesView: React.FC = () => {
  const {
    favorites,
    products,
    toggleFavorite,
    addToCart,
    setCurrentTab,
    setSelectedProductForModal,
  } = useStore();

  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display uppercase tracking-tight flex items-center gap-3">
          <Heart className="w-7 h-7 text-red-500 fill-red-500" />
          <span>Meus Favoritos</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#8E8E93] mt-1">
          {favoriteProducts.length} {favoriteProducts.length === 1 ? 'peça guardada' : 'peças guardadas'} na tua lista de desejos.
        </p>
      </div>

      {favoriteProducts.length === 0 ? (
        <div className="text-center py-20 bg-[#121212] rounded-3xl border border-white/5 p-8 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-neutral-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">A tua lista de favoritos está vazia</h3>
          <p className="text-xs sm:text-sm text-[#8E8E93] mb-6">
            Guarda as tuas peças preferidas clicando no ícone de coração para as encontrares mais tarde.
          </p>
          <button
            onClick={() => setCurrentTab('catalog')}
            className="px-6 py-3 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-full hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Explorar Catálogo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {favoriteProducts.map((product) => (
            <div
              key={product.id}
              className="bg-[#121212] hover:bg-[#161616] rounded-2xl sm:rounded-3xl p-4 border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between"
            >
              {/* Top Bar: Remove from favorites */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-semibold text-neutral-400">
                  {product.categoryLabel}
                </span>
                <button
                  onClick={() => toggleFavorite(product.id)}
                  className="p-1.5 text-red-500 hover:text-red-400 transition-colors"
                  title="Remover dos favoritos"
                >
                  <Heart className="w-4 h-4 fill-red-500" />
                </button>
              </div>

              {/* Product Image */}
              <div
                onClick={() => setSelectedProductForModal(product)}
                className="aspect-square w-full my-3 flex items-center justify-center cursor-pointer"
              >
                {product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-contain filter drop-shadow-lg hover:scale-105 transition-transform"
                  />
                ) : (
                  <Package className="w-12 h-12 text-neutral-600" />
                )}
              </div>

              {/* Product Info & Actions */}
              <div>
                <h3
                  onClick={() => setSelectedProductForModal(product)}
                  className="text-xs sm:text-sm font-semibold text-white tracking-tight truncate cursor-pointer hover:underline"
                >
                  {product.name}
                </h3>
                <p className="text-sm sm:text-base font-extrabold text-white tabular-nums my-1">
                  {formatKz(product.price)}
                </p>

                <button
                  onClick={() => addToCart(product, product.sizes[0], product.colors[0], 1)}
                  className="w-full mt-2 py-2.5 bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase rounded-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Mover para Carrinho</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
