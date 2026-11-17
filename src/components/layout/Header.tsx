import React, { useState } from 'react';
import { Menu, Search, ShoppingBag, Heart, User, X, ArrowRight } from 'lucide-react';
import { NevaLogo } from '../common/NevaLogo';
import { useStore } from '../../context/StoreContext';
import { CategoryType } from '../../types';

export const Header: React.FC = () => {
  const {
    cartTotalCount,
    favorites,
    setIsCartDrawerOpen,
    searchQuery,
    setSearchQuery,
    currentTab,
    setCurrentTab,
    setActiveCategory,
    user,
    setIsAuthModalOpen,
  } = useStore();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks: { label: string; category?: CategoryType; tab?: 'home' | 'catalog' }[] = [
    { label: 'Início', tab: 'home' },
    { label: 'T-Shirts', category: 't-shirts', tab: 'catalog' },
    { label: 'Ténis', category: 'tenis', tab: 'catalog' },
    { label: 'Casacos', category: 'casacos', tab: 'catalog' },
    { label: 'Chapéus', category: 'chapeus', tab: 'catalog' },
  ];

  const handleNavClick = (link: { label: string; category?: CategoryType; tab?: 'home' | 'catalog' }) => {
    if (link.category) {
      setActiveCategory(link.category);
      setCurrentTab('catalog');
    } else if (link.tab === 'home') {
      setActiveCategory('all');
      setCurrentTab('home');
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-black/95 backdrop-blur-md border-b border-[#1f1f1f]">
      {/* Top micro announcement bar */}
      <div className="bg-[#121212] border-b border-white/5 py-1.5 px-4 text-center">
        <p className="text-[11px] font-medium tracking-wider text-[#BDBDBD] uppercase flex items-center justify-center">
          <span>Entrega Grátis em Luanda</span>
        </p>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Mobile menu button */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-white hover:text-white/80 transition-colors focus:outline-none"
            aria-label="Abrir Menu"
          >
            <Menu className="w-6 h-6 stroke-[2.2]" />
          </button>
        </div>

        {/* Center / Left Logo */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => {
              setCurrentTab('home');
              setActiveCategory('all');
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <NevaLogo size="lg" className="h-7 sm:h-9" />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link)}
                className={`transition-colors whitespace-nowrap cursor-pointer tracking-wide ${
                  currentTab === link.tab && (link.category ? false : true)
                    ? 'text-white font-semibold'
                    : 'text-[#BDBDBD] hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Action Controls: Search, Favorites, Cart, Account */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Quick search input on desktop */}
          <div className="hidden lg:flex items-center relative w-56">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (currentTab !== 'catalog') setCurrentTab('catalog');
              }}
              placeholder="Pesquisar estilo..."
              className="w-full bg-[#171717] border border-[#282828] text-xs text-white rounded-full pl-9 pr-3 py-2 focus:outline-none focus:border-white/40 transition-colors placeholder-[#737373]"
            />
            <Search className="w-4 h-4 text-[#737373] absolute left-3 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-[#737373] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile search button */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2 text-white hover:text-white/80 transition-colors lg:hidden"
            aria-label="Pesquisar"
          >
            <Search className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
          </button>

          {/* Favorites (desktop) */}
          <button
            onClick={() => setCurrentTab('favorites')}
            className="hidden sm:flex relative p-2 text-white hover:text-white/80 transition-colors cursor-pointer"
            aria-label="Favoritos"
          >
            <Heart className="w-5 h-5 stroke-[2]" />
            {favorites.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {/* Cart Icon with Red Badge (matching uploaded design) */}
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="relative p-2 text-white hover:text-white/80 transition-colors cursor-pointer group"
            aria-label="Carrinho de Compras"
          >
            <ShoppingBag className="w-6 h-6 stroke-[2] group-hover:scale-105 transition-transform" />
            {cartTotalCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white font-bold text-[11px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-black animate-scale-in">
                {cartTotalCount}
              </span>
            )}
          </button>

          {/* User Account button */}
          <button
            onClick={() => {
              if (user) {
                setCurrentTab('account');
              } else {
                setIsAuthModalOpen(true);
              }
            }}
            className="hidden sm:flex items-center gap-2 p-2 text-white hover:text-white/80 transition-colors cursor-pointer"
            aria-label="Minha Conta"
          >
            <User className="w-5 h-5 stroke-[2]" />
            <span className="text-xs font-medium text-[#BDBDBD] hidden xl:inline">
              {user ? user.name.split(' ')[0] : 'Entrar'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Search Bar toggle */}
      {isSearchOpen && (
        <div className="lg:hidden px-4 py-3 bg-[#111111] border-b border-[#222222]">
          <div className="relative">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (currentTab !== 'catalog') setCurrentTab('catalog');
              }}
              placeholder="Pesquisar T-Shirts, Ténis, Casacos..."
              className="w-full bg-[#1c1c1c] border border-[#333333] text-sm text-white rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:border-white/40"
            />
            <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-3" />
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-3 top-2.5 p-1 text-[#888888] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Content */}
          <div className="relative w-4/5 max-w-xs bg-[#111111] h-full shadow-2xl p-6 flex flex-col justify-between z-10 border-r border-[#222222]">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-[#222222]">
                <NevaLogo size="md" />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-[#BDBDBD] hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation links */}
              <div className="mt-6 flex flex-col space-y-1">
                <p className="text-[11px] font-semibold text-[#777777] uppercase tracking-wider mb-2">
                  Coleções
                </p>
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => handleNavClick(link)}
                    className="flex items-center justify-between py-3 text-base font-medium text-white hover:text-neutral-300 transition-colors text-left"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="w-4 h-4 text-[#555]" />
                  </button>
                ))}

                <div className="pt-4 mt-4 border-t border-[#222222] space-y-1">
                  <p className="text-[11px] font-semibold text-[#777777] uppercase tracking-wider mb-2">
                    Minha Área
                  </p>
                  <button
                    onClick={() => {
                      setCurrentTab('favorites');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between w-full py-2.5 text-sm text-[#BDBDBD] hover:text-white"
                  >
                    <span className="flex items-center gap-2">
                      <Heart className="w-4 h-4" /> Favoritos
                    </span>
                    <span className="text-xs text-[#777]">{favorites.length}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (user) {
                        setCurrentTab('account');
                      } else {
                        setIsAuthModalOpen(true);
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between w-full py-2.5 text-sm text-[#BDBDBD] hover:text-white"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4" /> Minha Conta
                    </span>
                    <span className="text-xs text-[#777]">{user ? user.name.split(' ')[0] : 'Entrar'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Slogan at bottom */}
            <div className="pt-6 border-t border-[#222222]">
              <p className="text-xs tracking-widest text-[#777777] uppercase font-bold">
                DEFINE O TEU ESTILO.
              </p>
              <p className="text-[11px] text-[#555555] mt-1">
                Luanda, Angola · Entrega Rápida
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
