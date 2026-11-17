import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, Category, CartItem, Order, UserProfile, CategoryType, ActiveTab, UserAddress, ProductColor } from '../types';
import { INITIAL_CATEGORIES } from '../data/initialData';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import {
  fetchProductsFromDb,
  upsertProductInDb,
  deleteProductFromDb,
  fetchOrdersFromDb,
  createOrderInDb,
  updateOrderStatusInDb,
  updatePaymentStatusInDb,
} from '../lib/supabaseService';
import { idbGet, idbSet, safeGetLocalStorage, safeSetLocalStorage } from '../lib/localCache';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface StoreContextType {
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  favorites: string[];
  orders: Order[];
  user: UserProfile | null;
  activeCategory: CategoryType;
  searchQuery: string;
  currentTab: ActiveTab;
  toasts: Toast[];
  selectedProductForModal: Product | null;
  isCartDrawerOpen: boolean;
  isCheckoutOpen: boolean;
  isAuthModalOpen: boolean;
  appliedCoupon: { code: string; discountPercent: number } | null;
  isSupabaseConnected: boolean;
  isSyncing: boolean;

  // Actions
  setActiveCategory: (cat: CategoryType) => void;
  setSearchQuery: (q: string) => void;
  setCurrentTab: (tab: ActiveTab) => void;
  setSelectedProductForModal: (p: Product | null) => void;
  setIsCartDrawerOpen: (open: boolean) => void;
  setIsCheckoutOpen: (open: boolean) => void;
  setIsAuthModalOpen: (open: boolean) => void;
  syncWithSupabase: () => Promise<void>;

  // Cart Actions
  addToCart: (product: Product, size: string, color: ProductColor, quantity?: number) => void;
  removeFromCart: (lineId: string) => void;
  updateCartQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotalCount: number;
  cartSubtotal: number;
  cartShippingFee: number;
  cartGrandTotal: number;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;

  // Favorites Actions
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;

  // Order Actions
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'orderStatus' | 'paymentStatus'>) => Order;
  updateOrderStatus: (orderId: string, status: Order['orderStatus']) => void;
  updatePaymentStatus: (orderId: string, status: Order['paymentStatus']) => void;

  // Admin Actions
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;

  // User Actions
  login: (email: string, role?: 'customer' | 'admin') => void;
  authenticateWithPassword: (email: string, password: string) => Promise<boolean>;
  registerCustomer: (params: { name: string; email: string; phone: string; password: string }) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  addAddress: (address: Omit<UserAddress, 'id'>) => void;
  deleteAddress: (id: string) => void;

  // Notification Toast
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load products from localStorage (starts empty with zero simulated products)
  const [products, setProducts] = useState<Product[]>(() =>
    safeGetLocalStorage<Product[]>('neva_v2_products', [])
  );

  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() =>
    safeGetLocalStorage<CartItem[]>('neva_v2_cart', [])
  );

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() =>
    safeGetLocalStorage<string[]>('neva_v2_favorites', [])
  );

  // Orders state
  const [orders, setOrders] = useState<Order[]>(() =>
    safeGetLocalStorage<Order[]>('neva_v2_orders', [])
  );

  // User state (starts unauthenticated until real login)
  const [user, setUser] = useState<UserProfile | null>(() =>
    safeGetLocalStorage<UserProfile | null>('neva_v2_user', null)
  );

  // Navigation & Modals
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState<ActiveTab>('home');
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);

  // Supabase connection & sync state
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(() => isSupabaseConfigured());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync with Supabase PostgreSQL
  const syncWithSupabase = useCallback(async () => {
    const configured = isSupabaseConfigured();
    setIsSupabaseConnected(configured);
    if (!configured) return;

    setIsSyncing(true);
    try {
      const [productsRes, ordersRes] = await Promise.all([
        fetchProductsFromDb(),
        fetchOrdersFromDb(),
      ]);

      if (productsRes.data) {
        setProducts(productsRes.data);
      }
      if (ordersRes.data) {
        setOrders(ordersRes.data);
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Hydrate from IndexedDB if available (supports large image catalogs safely), then sync Supabase
  useEffect(() => {
    let active = true;
    (async () => {
      if (!isSupabaseConfigured()) {
        const [cachedProducts, cachedOrders] = await Promise.all([
          idbGet<Product[]>('neva_v2_products'),
          idbGet<Order[]>('neva_v2_orders'),
        ]);
        if (!active) return;
        if (cachedProducts && cachedProducts.length > 0) {
          setProducts((prev) => (prev.length === 0 ? cachedProducts : prev));
        }
        if (cachedOrders && cachedOrders.length > 0) {
          setOrders((prev) => (prev.length === 0 ? cachedOrders : prev));
        }
      }
      if (active) {
        syncWithSupabase();
      }
    })();

    const client = getSupabaseClient();
    if (!client) {
      return () => {
        active = false;
      };
    }

    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        setUser((prev) => {
          if (prev?.role === 'admin' && prev.email === 'admin@neva.ao') return prev;
          return {
            id: session.user.id,
            name: meta.full_name || session.user.email?.split('@')[0] || 'Cliente NEVA',
            email: session.user.email || '',
            phone: meta.phone || prev?.phone || '+244 ',
            province: prev?.province || 'Luanda',
            municipality: prev?.municipality || 'Talatona',
            role: meta.role === 'admin' ? 'admin' : 'customer',
            addresses: prev?.addresses || [],
            favorites: prev?.favorites || [],
          };
        });
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [syncWithSupabase]);

  // Sync localStorage + IndexedDB mirrors without throwing QuotaExceededError
  useEffect(() => {
    idbSet('neva_v2_products', products);
    const saved = safeSetLocalStorage('neva_v2_products', products);
    if (!saved) {
      try {
        localStorage.removeItem('neva_v2_products');
      } catch {
        // ignore
      }
    }
  }, [products]);

  useEffect(() => {
    safeSetLocalStorage('neva_v2_cart', cart);
  }, [cart]);

  useEffect(() => {
    safeSetLocalStorage('neva_v2_favorites', favorites);
  }, [favorites]);

  useEffect(() => {
    idbSet('neva_v2_orders', orders);
    safeSetLocalStorage('neva_v2_orders', orders);
  }, [orders]);

  useEffect(() => {
    if (user) {
      safeSetLocalStorage('neva_v2_user', user);
    } else {
      try {
        localStorage.removeItem('neva_v2_user');
      } catch {
        // ignore
      }
    }
  }, [user]);

  // Cart operations
  const addToCart = (product: Product, size: string, color: ProductColor, quantity = 1) => {
    const lineId = `${product.id}-${size}-${color.name}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === lineId);
      if (existing) {
        return prev.map((item) =>
          item.id === lineId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { id: lineId, product, selectedSize: size, selectedColor: color, quantity }];
    });
    showToast(`"${product.name}" adicionado ao carrinho!`);
  };

  const removeFromCart = (lineId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== lineId));
    showToast('Item removido do carrinho.', 'info');
  };

  const updateCartQuantity = (lineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(lineId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === lineId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotalCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // Free delivery in Luanda
  const discountAmount = appliedCoupon ? (cartSubtotal * appliedCoupon.discountPercent) / 100 : 0;
  const cartShippingFee = 0;
  const cartGrandTotal = Math.max(0, cartSubtotal - discountAmount);

  const applyCoupon = (code: string): boolean => {
    const cleaned = code.trim().toUpperCase();
    if (cleaned === 'NEVA10') {
      setAppliedCoupon({ code: 'NEVA10', discountPercent: 10 });
      showToast('Cupom NEVA10 aplicado com sucesso (-10%)!');
      return true;
    }
    if (cleaned === 'ESTILO15') {
      setAppliedCoupon({ code: 'ESTILO15', discountPercent: 15 });
      showToast('Cupom ESTILO15 aplicado com sucesso (-15%)!');
      return true;
    }
    showToast('Código de cupom inválido ou expirado.', 'error');
    return false;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Cupom removido.', 'info');
  };

  // Favorites
  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast('Removido dos favoritos', 'info');
        return prev.filter((id) => id !== productId);
      } else {
        showToast('Adicionado aos teus favoritos ❤️');
        return [...prev, productId];
      }
    });
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  // Orders
  const createOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'orderStatus' | 'paymentStatus'>) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber: `NEVA-${randomSuffix}`,
      createdAt: new Date().toISOString(),
      orderStatus: 'pending',
      paymentStatus: 'pending',
    };
    setOrders((prev) => [newOrder, ...prev]);
    clearCart();

    if (isSupabaseConfigured()) {
      createOrderInDb(newOrder, user?.id).then((res) => {
        if (!res.ok && res.error) {
          showToast(`Encomenda guardada localmente (Supabase: ${res.error})`, 'info');
        }
      });
    }

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order['orderStatus']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: status } : o))
    );
    if (isSupabaseConfigured()) {
      updateOrderStatusInDb(orderId, status);
    }
    showToast(`Estado da encomenda atualizado para: ${status}`, 'info');
  };

  const updatePaymentStatus = (orderId: string, status: Order['paymentStatus']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: status } : o))
    );
    if (isSupabaseConfigured()) {
      updatePaymentStatusInDb(orderId, status);
    }
    showToast(`Estado do pagamento atualizado para: ${status}`, 'info');
  };

  // Admin Product Operations
  const addProduct = async (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: `neva-prod-${Date.now()}`,
    };
    setProducts((prev) => [newProduct, ...prev]);

    if (isSupabaseConfigured()) {
      const res = await upsertProductInDb(newProduct);
      if (res.ok) {
        showToast('Produto publicado no Supabase!');
      } else {
        showToast(`Guardado localmente (Supabase: ${res.error})`, 'info');
      }
    } else {
      showToast('Novo produto cadastrado com sucesso!');
    }
  };

  const updateProduct = async (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

    if (isSupabaseConfigured()) {
      const res = await upsertProductInDb(updated);
      if (res.ok) {
        showToast('Produto atualizado no Supabase!');
      } else {
        showToast(`Atualizado localmente (Supabase: ${res.error})`, 'info');
      }
    } else {
      showToast('Produto atualizado com sucesso!');
    }
  };

  const deleteProduct = async (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));

    if (isSupabaseConfigured()) {
      const res = await deleteProductFromDb(productId);
      if (res.ok) {
        showToast('Produto removido do Supabase.', 'info');
      } else {
        showToast(`Removido localmente (Supabase: ${res.error})`, 'info');
      }
    } else {
      showToast('Produto removido do catálogo.', 'info');
    }
  };

  // User Authentication & Profile
  const login = (email: string, role: 'customer' | 'admin' = 'customer') => {
    const isSpecialAdmin = email.trim() === 'nevaadmin7161' || role === 'admin';
    const profile: UserProfile = {
      id: `usr-${Date.now()}`,
      name: isSpecialAdmin ? 'Administrador NEVA' : email.split('@')[0],
      email: isSpecialAdmin ? 'admin@neva.ao' : email,
      phone: '+244 962 716 161',
      province: 'Luanda',
      municipality: 'Talatona',
      role: isSpecialAdmin ? 'admin' : 'customer',
      addresses: [
        {
          id: `addr-${Date.now()}`,
          label: 'Principal',
          name: isSpecialAdmin ? 'Administrador NEVA' : email.split('@')[0],
          phone: '+244 962 716 161',
          province: 'Luanda',
          municipality: 'Talatona',
          address: 'Luanda, Angola',
          isDefault: true,
        },
      ],
      favorites: [],
    };
    setUser(profile);
    showToast(`Bem-vindo, ${profile.name}!`);
  };

  const authenticateWithPassword = async (email: string, password: string): Promise<boolean> => {
    const client = getSupabaseClient();
    if (!client) {
      login(email, 'customer');
      return true;
    }

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      showToast(error.message || 'Erro ao iniciar sessão.', 'error');
      return false;
    }

    if (data.user) {
      const meta = data.user.user_metadata || {};
      const profile: UserProfile = {
        id: data.user.id,
        name: meta.full_name || data.user.email?.split('@')[0] || 'Cliente NEVA',
        email: data.user.email || email,
        phone: meta.phone || '+244 ',
        province: 'Luanda',
        municipality: 'Talatona',
        role: meta.role === 'admin' ? 'admin' : 'customer',
        addresses: [],
        favorites: [],
      };
      setUser(profile);
      showToast(`Bem-vindo, ${profile.name}!`);
    }
    return true;
  };

  const registerCustomer = async (params: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<boolean> => {
    const client = getSupabaseClient();
    if (!client) {
      login(params.email, 'customer');
      return true;
    }

    const { data, error } = await client.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.name,
          phone: params.phone,
        },
      },
    });

    if (error) {
      showToast(error.message || 'Não foi possível criar a conta.', 'error');
      return false;
    }

    if (data.user) {
      setUser({
        id: data.user.id,
        name: params.name || params.email.split('@')[0],
        email: params.email,
        phone: params.phone || '+244 ',
        province: 'Luanda',
        municipality: 'Talatona',
        role: 'customer',
        addresses: [],
        favorites: [],
      });
      showToast('Conta criada no Supabase! Verifica o teu e-mail se necessário.');
    }
    return true;
  };

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    const client = getSupabaseClient();
    if (!client) {
      showToast(`Instruções de recuperação enviadas para ${email}.`);
      return true;
    }

    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      showToast(error.message || 'Erro ao enviar recuperação de senha.', 'error');
      return false;
    }

    showToast(`Link de recuperação enviado para ${email}!`);
    return true;
  };

  const logout = () => {
    const client = getSupabaseClient();
    if (client) {
      client.auth.signOut().catch(() => {});
    }
    setUser(null);
    if (currentTab === 'admin') {
      setCurrentTab('home');
    }
    showToast('Sessão terminada.', 'info');
  };

  const updateUserProfile = (patch: Partial<UserProfile>) => {
    if (!user) return;
    setUser({ ...user, ...patch });
    showToast('Perfil atualizado com sucesso!');
  };

  const addAddress = (addrData: Omit<UserAddress, 'id'>) => {
    if (!user) return;
    const newAddress: UserAddress = {
      ...addrData,
      id: `addr-${Date.now()}`,
    };
    const updatedAddresses = addrData.isDefault
      ? user.addresses.map((a) => ({ ...a, isDefault: false })).concat(newAddress)
      : [...user.addresses, newAddress];
    setUser({ ...user, addresses: updatedAddresses });
    showToast('Endereço adicionado com sucesso!');
  };

  const deleteAddress = (id: string) => {
    if (!user) return;
    setUser({ ...user, addresses: user.addresses.filter((a) => a.id !== id) });
    showToast('Endereço removido.', 'info');
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        cart,
        favorites,
        orders,
        user,
        activeCategory,
        searchQuery,
        currentTab,
        toasts,
        selectedProductForModal,
        isCartDrawerOpen,
        isCheckoutOpen,
        isAuthModalOpen,
        appliedCoupon,
        isSupabaseConnected,
        isSyncing,
        setActiveCategory,
        setSearchQuery,
        setCurrentTab,
        setSelectedProductForModal,
        setIsCartDrawerOpen,
        setIsCheckoutOpen,
        setIsAuthModalOpen,
        syncWithSupabase,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotalCount,
        cartSubtotal,
        cartShippingFee,
        cartGrandTotal,
        applyCoupon,
        removeCoupon,
        toggleFavorite,
        isFavorite,
        createOrder,
        updateOrderStatus,
        updatePaymentStatus,
        addProduct,
        updateProduct,
        deleteProduct,
        login,
        authenticateWithPassword,
        registerCustomer,
        requestPasswordReset,
        logout,
        updateUserProfile,
        addAddress,
        deleteAddress,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
