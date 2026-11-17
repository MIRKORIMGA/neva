/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { Footer } from './components/layout/Footer';
import { HeroBanner } from './components/home/HeroBanner';
import { CategoryRow } from './components/home/CategoryRow';
import { FeaturedSection } from './components/home/FeaturedSection';
import { TrustBadges } from './components/home/TrustBadges';
import { BrandStory } from './components/home/BrandStory';
import { CatalogView } from './components/catalog/CatalogView';
import { FavoritesView } from './components/favorites/FavoritesView';
import { AccountView } from './components/account/AccountView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ProductDetailModal } from './components/catalog/ProductDetailModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutModal } from './components/cart/CheckoutModal';
import { AuthModal } from './components/account/AuthModal';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
          error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
          info: <Info className="w-4 h-4 text-neutral-300 shrink-0" />,
        };

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-[#181818] border border-white/10 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs animate-slide-up"
          >
            <div className="flex items-center gap-2.5">
              {icons[toast.type]}
              <span className="font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-neutral-500 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

const MainContent: React.FC = () => {
  const { currentTab, user } = useStore();

  return (
    <main className="flex-1">
      {currentTab === 'home' && (
        <div className="space-y-2">
          <HeroBanner />
          <CategoryRow />
          <FeaturedSection />
          <TrustBadges />
          <BrandStory />
        </div>
      )}

      {currentTab === 'catalog' && <CatalogView />}

      {currentTab === 'favorites' && <FavoritesView />}

      {currentTab === 'account' && <AccountView />}

      {currentTab === 'admin' && (user?.role === 'admin' ? <AdminDashboard /> : <AccountView />)}

      {currentTab === 'cart' && (
        <div className="py-8">
          <CatalogView />
        </div>
      )}
    </main>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white selection:text-black">
        {/* Navigation Header */}
        <Header />

        {/* Dynamic Route Content */}
        <MainContent />

        {/* Global Footer */}
        <Footer />

        {/* Mobile App-Style Bottom Navigation */}
        <BottomNav />

        {/* Modals and Slide-over Drawers */}
        <ProductDetailModal />
        <CartDrawer />
        <CheckoutModal />
        <AuthModal />

        {/* Toast Notification Layer */}
        <ToastContainer />
      </div>
    </StoreProvider>
  );
}
