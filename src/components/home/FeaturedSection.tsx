import React from 'react';
import { ArrowRight, Heart, ShoppingBag, Eye, Package } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatKz } from '../../data/initialData';
import { Product } from '../../types';

export const FeaturedSection: React.FC = () => {
  const {
    products,
    setCurrentTab,
    setActiveCategory,
    setSelectedProductForModal,
    addToCart,
    toggleFavorite,
    isFavorite,
  } = useStore();

  const flaggedFeatured = products.filter((p) => p.isFeatured);
  const featured = (flaggedFeatured.length > 0 ? flaggedFeatured : products).slice(0, 6);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(
      product,
      product.sizes[0] || 'Tamanho Único',
      product.colors[0] || { name: 'Padrão', hex: '#111111' },
      1
    );
  };

  const handleCardClick = (product: Product) => {
    setSelectedProductForModal(product);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
            Produtos em Destaque
          </h2>
          <p className="text-xs sm:text-sm text-[#8E8E93] mt-0.5">
            {featured.length > 0
              ? 'Os itens mais procurados da temporada'
              : 'Lançamentos exclusivos serão exibidos aqui'}
          </p>
        </div>

        <button
          onClick={() => {
            setActiveCategory('all');
            setCurrentTab('catalog');
          }}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer group"
        >
          <span>Ver Todos</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {featured.length === 0 ? (
        <div className="bg-[#121212] border border-white/5 rounded-3xl p-10 sm:p-14 text-center">
          <div className="w-14 h-14 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-neutral-400" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-1">
            Nenhum produto publicado ainda
          </h3>
          <p className="text-xs sm:text-sm text-[#8E8E93] max-w-md mx-auto">
            Assim que novos artigos forem adicionados à loja, aparecerão aqui em destaque.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-6">
          {featured.map((product) => {
            const favorite = isFavorite(product.id);

            return (
              <div
                key={product.id}
                onClick={() => handleCardClick(product)}
                className="group relative bg-[#121212] hover:bg-[#161616] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-white/5 hover:border-white/15 transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-lg"
              >
                {/* Top Bar inside card: Tag & Heart Button */}
                <div className="flex items-center justify-between z-10">
                  {product.isNewArrival ? (
                    <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                      Novo
                    </span>
                  ) : (
                    <span className="text-[10px] text-transparent select-none">.</span>
                  )}

                  {/* Heart Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    }}
                    className="p-1.5 sm:p-2 rounded-full bg-black/40 hover:bg-black/80 transition-colors text-white"
                    aria-label="Adicionar aos Favoritos"
                  >
                    <Heart
                      className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform active:scale-125 ${
                        favorite ? 'fill-red-500 text-red-500' : 'text-neutral-400 hover:text-white'
                      }`}
                    />
                  </button>
                </div>

                {/* Centered Image Showcase */}
                <div className="relative aspect-square w-full my-2 flex items-center justify-center overflow-hidden">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-contain filter drop-shadow-xl group-hover:scale-105 transition-transform duration-300 ease-out"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Package className="w-12 h-12 text-neutral-600" />
                  )}

                  {/* Hover overlay hint on desktop */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-black/80 text-white text-[11px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                      <Eye className="w-3.5 h-3.5" /> Ver Detalhes
                    </span>
                  </div>
                </div>

                {/* Product Info & Action */}
                <div className="mt-2">
                  <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight truncate">
                    {product.name}
                  </h3>

                  <div className="flex items-baseline gap-2 mt-1 mb-3">
                    <span className="text-sm sm:text-base font-extrabold text-white tabular-nums">
                      {formatKz(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-[#737373] line-through tabular-nums hidden sm:inline">
                        {formatKz(product.originalPrice)}
                      </span>
                    )}
                  </div>

                  {/* White Add to Cart Button */}
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(e, product)}
                    className="w-full py-2.5 sm:py-3 bg-white hover:bg-neutral-200 text-black font-bold text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
