import React from 'react';
import { Home, LayoutGrid, Heart, ShoppingBag, User } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ActiveTab } from '../../types';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, favorites, cartTotalCount, setActiveCategory } = useStore();

  const navItems: { tab: ActiveTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    {
      tab: 'home',
      label: 'Início',
      icon: Home,
    },
    {
      tab: 'catalog',
      label: 'Categorias',
      icon: LayoutGrid,
    },
    {
      tab: 'favorites',
      label: 'Favoritos',
      icon: Heart,
      badge: favorites.length,
    },
    {
      tab: 'cart',
      label: 'Encomendas',
      icon: ShoppingBag,
      badge: cartTotalCount,
    },
    {
      tab: 'account',
      label: 'Perfil',
      icon: User,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-lg border-t border-[#1c1c1c] pb-safe">
      <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentTab === item.tab;
          const Icon = item.icon;

          return (
            <button
              key={item.tab}
              onClick={() => {
                if (item.tab === 'catalog' && currentTab !== 'catalog') {
                  setActiveCategory('all');
                }
                setCurrentTab(item.tab);
              }}
              className="relative flex flex-col items-center justify-center flex-1 py-1 transition-colors duration-200 cursor-pointer"
            >
              {/* Icon Container with relative positioning for badge */}
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-transform duration-200 ${
                    isActive ? 'text-white scale-110 stroke-[2.4]' : 'text-[#8E8E93] stroke-[1.8]'
                  }`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-black">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] mt-1 font-medium transition-colors ${
                  isActive ? 'text-white font-semibold' : 'text-[#8E8E93]'
                }`}
              >
                {item.label}
              </span>

              {/* Active Indicator Underline matching the mockup */}
              {isActive && (
                <div className="w-5 h-0.5 bg-white rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
