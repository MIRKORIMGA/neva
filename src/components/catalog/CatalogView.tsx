import React, { useState, useMemo } from 'react';
import { Filter, SlidersHorizontal, Search, ArrowUpDown, X, Heart, ShoppingBag, Eye, Package } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatKz } from '../../data/initialData';
import { Product } from '../../types';

export const CatalogView: React.FC = () => {
  const {
    products,
    categories,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    setSelectedProductForModal,
    addToCart,
    toggleFavorite,
    isFavorite,
  } = useStore();

  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(500000);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Available sizes across catalog
  const allSizes = ['all', 'S', 'M', 'L', 'XL', 'XXL', '39', '40', '41', '42', '43', '44', 'Tamanho Único'];

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Category filter
        if (activeCategory !== 'all' && product.category !== activeCategory) {
          return false;
        }
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = product.name.toLowerCase().includes(q);
          const matchDesc = product.description.toLowerCase().includes(q);
          const matchTags = product.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchName && !matchDesc && !matchTags) return false;
        }
        // Price filter
        if (product.price > maxPrice) {
          return false;
        }
        // Size filter
        if (selectedSize !== 'all') {
          const matchSize = product.sizes.some((s) => s.toLowerCase().includes(selectedSize.toLowerCase()));
          if (!matchSize) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'newest') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [products, activeCategory, searchQuery, maxPrice, selectedSize, sortBy]);

  const handleCardClick = (product: Product) => {
    setSelectedProductForModal(product);
  };

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(
      product,
      product.sizes[0] || 'Tamanho Único',
      product.colors[0] || { name: 'Padrão', hex: '#111111' },
      1
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Catalog Title & Search Bar */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display uppercase tracking-tight">
          Catálogo NEVA
        </h1>
        <p className="text-xs sm:text-sm text-[#8E8E93] mt-1">
          Moda urbana minimalista desenhada para definir o teu estilo.
        </p>

        {/* Search input in catalog */}
        <div className="mt-4 relative max-w-xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome, modelo, cor ou tecido..."
            className="w-full bg-[#141414] border border-[#262626] text-sm text-white rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:border-white/50"
          />
          <Search className="w-4 h-4 text-[#737373] absolute left-3.5 top-3.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-[#737373] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Bar (Horizontal scrollable) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
            activeCategory === 'all'
              ? 'bg-white text-black shadow-md'
              : 'bg-[#171717] text-[#BDBDBD] hover:text-white border border-white/5'
          }`}
        >
          Todos os Produtos ({products.length})
        </button>

        {categories.map((cat) => {
          const count = products.filter((p) => p.category === cat.id).length;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-black shadow-md'
                  : 'bg-[#171717] text-[#BDBDBD] hover:text-white border border-white/5'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 mb-8 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Active Filters Summary & Mobile Filter trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#1c1c1c] hover:bg-[#252525] text-white text-xs font-semibold rounded-lg border border-white/10 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtros Avançados</span>
            {(selectedSize !== 'all' || maxPrice < 500000) && (
              <span className="w-2 h-2 rounded-full bg-white" />
            )}
          </button>

          <span className="text-xs text-[#8E8E93] hidden sm:inline">
            A mostrar <strong className="text-white">{filteredProducts.length}</strong> itens
          </span>
        </div>

        {/* Right: Sorting Select */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-[#8E8E93]" />
          <span className="text-xs text-[#8E8E93] hidden sm:inline">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#1a1a1a] border border-[#2e2e2e] text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-white/50 cursor-pointer"
          >
            <option value="featured">Destaques NEVA</option>
            <option value="newest">Lançamentos Recentes</option>
            <option value="price-asc">Preço: Menor para Maior</option>
            <option value="price-desc">Preço: Maior para Menor</option>
          </select>
        </div>
      </div>

      {/* Advanced Filter Collapse Drawer */}
      {isFilterDrawerOpen && (
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 mb-8 animate-fade-in">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" /> Opções de Filtragem
            </h4>
            <button
              onClick={() => {
                setSelectedSize('all');
                setMaxPrice(500000);
                setActiveCategory('all');
              }}
              className="text-[11px] text-[#BDBDBD] hover:text-white underline cursor-pointer"
            >
              Repor Tudo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Size Filter */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-2">
                Filtrar por Tamanho:
              </label>
              <div className="flex flex-wrap gap-2">
                {allSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      selectedSize === size
                        ? 'bg-white text-black border-white'
                        : 'bg-[#181818] text-[#8E8E93] border-white/5 hover:text-white'
                    }`}
                  >
                    {size === 'all' ? 'Todos' : size}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-neutral-300">
                  Preço Máximo:
                </label>
                <span className="text-xs font-bold text-white tabular-nums">
                  Até {formatKz(maxPrice)}
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="500000"
                step="5000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-white cursor-pointer bg-[#222]"
              />
              <div className="flex justify-between text-[10px] text-[#737373] mt-1">
                <span>5.000 Kz</span>
                <span>250.000 Kz</span>
                <span>500.000 Kz</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-[#121212] rounded-3xl border border-white/5 p-8">
          <div className="w-16 h-16 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-[#737373]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {products.length === 0 ? 'Catálogo sem produtos ainda' : 'Nenhum produto encontrado'}
          </h3>
          <p className="text-sm text-[#8E8E93] max-w-md mx-auto mb-6">
            {products.length === 0
              ? 'Ainda não existem artigos publicados nesta loja. Novos produtos estarão disponíveis em breve.'
              : 'Não encontramos peças com os filtros selecionados. Tenta mudar o tamanho, a categoria ou limpar a pesquisa.'}
          </p>
          {products.length > 0 && (
            <button
              onClick={() => {
                setActiveCategory('all');
                setSelectedSize('all');
                setMaxPrice(500000);
                setSearchQuery('');
              }}
              className="px-6 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-full hover:bg-neutral-200 transition-colors"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {filteredProducts.map((product) => {
            const favorite = isFavorite(product.id);

            return (
              <div
                key={product.id}
                onClick={() => handleCardClick(product)}
                className="group relative bg-[#121212] hover:bg-[#161616] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-white/5 hover:border-white/20 transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-lg"
              >
                {/* Top Row: Category tag and Favorite */}
                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                    {product.categoryLabel}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    }}
                    className="p-1.5 sm:p-2 rounded-full bg-black/40 hover:bg-black/80 transition-colors text-white"
                    aria-label="Favorito"
                  >
                    <Heart
                      className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform active:scale-125 ${
                        favorite ? 'fill-red-500 text-red-500' : 'text-neutral-400 hover:text-white'
                      }`}
                    />
                  </button>
                </div>

                {/* Centered Image */}
                <div className="relative aspect-square w-full my-3 flex items-center justify-center overflow-hidden">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-contain filter drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Package className="w-12 h-12 text-neutral-600" />
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-black/80 text-white text-[11px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                      <Eye className="w-3.5 h-3.5" /> Detalhes
                    </span>
                  </div>
                </div>

                {/* Details & Button */}
                <div className="mt-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-white tracking-tight truncate">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-baseline gap-2 mt-1 mb-3">
                    <span className="text-sm sm:text-base font-extrabold text-white tabular-nums">
                      {formatKz(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-[11px] text-[#737373] line-through tabular-nums hidden sm:inline">
                        {formatKz(product.originalPrice)}
                      </span>
                    )}
                  </div>

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
    </div>
  );
};
