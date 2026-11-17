import React from 'react';
import { useStore } from '../../context/StoreContext';
import { CategoryType } from '../../types';

export const CategoryRow: React.FC = () => {
  const { categories, setActiveCategory, setCurrentTab } = useStore();

  const handleCategorySelect = (categoryId: CategoryType) => {
    setActiveCategory(categoryId);
    setCurrentTab('catalog');
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* 4 Category Cards matching the mockup layout */}
      <div className="grid grid-cols-4 gap-3 sm:gap-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategorySelect(cat.id)}
            className="flex flex-col items-center group cursor-pointer focus:outline-none"
          >
            {/* Dark squarish card with subtle border and rounded corners */}
            <div className="w-full aspect-square bg-[#171717] hover:bg-[#202020] rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all duration-300 transform group-hover:-translate-y-1 group-active:scale-95 shadow-lg relative overflow-hidden">
              {/* Product Thumbnail inside category */}
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            {/* Label below matching mockup */}
            <span className="mt-2 sm:mt-3 text-xs sm:text-sm font-semibold tracking-wide text-neutral-300 group-hover:text-white transition-colors">
              {cat.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
