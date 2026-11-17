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
  fetchUserFavoritesFromDb,
  addFavoriteInDb,
  removeFavoriteInDb,
  fetchAddressesFromDb,
  addAddressInDb,
  deleteAddressInDb,
  updateProfileInDb,
} from '../lib/supabaseService';

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
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'orderStatus' | 'paymentStatus'>) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: Order['orderStatus']) => Promise<void>;
  updatePaymentStatus: (orderId: string, status: Order['paymentStatus']) => Promise<void>;

  // Admin Actions
  addProduct: (product: Omit<Product, 'id'>) => Promise<boolean>;
  updateProduct: (product: Product) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;

  // User Actions
  login: (email: string, role?: 'customer' | 'admin') => void;
  authenticateWithPassword: (email: string, password: string) => Promise<boolean>;
  registerCustomer: (params: { name: string; email: string; phone: string; password: string }) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  addAddress: (address: Omit<UserAddress, 'id'>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;

  // Notification Toast
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);

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
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const hydrateUserRelations = useCallback(async (userId: string) => {
    const [dbFavs, dbAddresses] = await Promise.all([
      fetchUserFavoritesFromDb(userId),
      fetchAddressesFromDb(userId),
    ]);
    setFavorites(dbFavs);
    setUser((prev) => (prev && prev.id === userId ? { ...prev, addresses: dbAddresses, favorites: dbFavs } : prev));
  }, []);

  // Sync catalog & orders directly from Supabase PostgreSQL
  const syncWithSupabase = useCallback(async () => {
    const configured = isSupabaseConfigured();
    setIsSupabaseConnected(configured);
    if (!configured) {
      setProducts([]);
      setOrders([]);
      return;
    }

    setIsSyncing(true);
    try {
      const [productsRes, ordersRes] = await Promise.all([
        fetchProductsFromDb(),
        fetchOrdersFromDb(),
      ]);

      if (productsRes.data) {
        setProducts(productsRes.data);
      } else if (productsRes.error) {
        showToast(`Erro ao carregar produtos do Supabase: ${productsRes.error}`, 'error');
      }

      if (ordersRes.data) {
        setOrders(ordersRes.data);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [showToast]);

  // Initial Supabase load & auth state listener
  useEffect(() => {
    syncWithSupabase();

    const client = getSupabaseClient();
    if (!client) return;

    client.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user;
      if (sessionUser) {
        const meta = sessionUser.user_metadata || {};
        setUser({
          id: sessionUser.id,
          name: meta.full_name || sessionUser.email?.split('@')[0] || 'Cliente NEVA',
          email: sessionUser.email || '',
          phone: meta.phone || '+244 ',
          province: 'Luanda',
          municipality: 'Talatona',
          role: meta.role === 'admin' ? 'admin' : 'customer',
          addresses: [],
          favorites: [],
        });
        hydrateUserRelations(sessionUser.id);
      }
    });

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
        hydrateUserRelations(session.user.id);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [syncWithSupabase, hydrateUserRelations]);

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

  // Favorites (persisted in Supabase when logged in)
  const toggleFavorite = (productId: string) => {
    const exists = favorites.includes(productId);
    if (exists) {
      setFavorites((prev) => prev.filter((id) => id !== productId));
      if (user?.id) {
        removeFavoriteInDb(user.id, productId);
      }
      showToast('Removido dos favoritos', 'info');
    } else {
      setFavorites((prev) => [...prev, productId]);
      if (user?.id) {
        addFavoriteInDb(user.id, productId);
      }
      showToast('Adicionado aos teus favoritos ❤️');
    }
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  // Orders (strictly Supabase)
  const createOrder = async (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'orderStatus' | 'paymentStatus'>
  ): Promise<Order | null> => {
    if (!isSupabaseConfigured()) {
      showToast('Supabase não configurado. Não é possível registar encomendas sem ligação à base de dados.', 'error');
      return null;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber: `NEVA-${randomSuffix}`,
      createdAt: new Date().toISOString(),
      orderStatus: 'pending',
      paymentStatus: 'pending',
    };

    const res = await createOrderInDb(newOrder, user?.id);
    if (!res.ok) {
      showToast(`Erro ao guardar encomenda no Supabase: ${res.error || 'Tenta novamente.'}`, 'error');
      return null;
    }

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: Order['orderStatus']) => {
    if (!isSupabaseConfigured()) {
      showToast('Supabase não configurado.', 'error');
      return;
    }

    const res = await updateOrderStatusInDb(orderId, status);
    if (!res.ok) {
      showToast(`Erro ao atualizar encomenda no Supabase: ${res.error}`, 'error');
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: status } : o))
    );
    showToast(`Estado da encomenda atualizado para: ${status}`, 'info');
  };

  const updatePaymentStatus = async (orderId: string, status: Order['paymentStatus']) => {
    if (!isSupabaseConfigured()) {
      showToast('Supabase não configurado.', 'error');
      return;
    }

    const res = await updatePaymentStatusInDb(orderId, status);
    if (!res.ok) {
      showToast(`Erro ao atualizar pagamento no Supabase: ${res.error}`, 'error');
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: status } : o))
    );
    showToast(`Estado do pagamento atualizado para: ${status}`, 'info');
  };

  // Admin Product Operations (strictly Supabase)
  const addProduct = async (productData: Omit<Product, 'id'>): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      showToast('Conecta o Supabase primeiro na aba "Supabase & Storage" para publicar produtos.', 'error');
      return false;
    }

    const newProduct: Product = {
      ...productData,
      id: `neva-prod-${Date.now()}`,
    };

    const res = await upsertProductInDb(newProduct);
    if (!res.ok) {
      showToast(`Erro ao publicar produto no Supabase: ${res.error}`, 'error');
      return false;
    }

    setProducts((prev) => [newProduct, ...prev]);
    showToast('Produto publicado no Supabase!');
    return true;
  };

  const updateProduct = async (updated: Product): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      showToast('Supabase não configurado.', 'error');
      return false;
    }

    const res = await upsertProductInDb(updated);
    if (!res.ok) {
      showToast(`Erro ao atualizar produto no Supabase: ${res.error}`, 'error');
      return false;
    }

    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    showToast('Produto atualizado no Supabase!');
    return true;
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      showToast('Supabase não configurado.', 'error');
      return false;
    }

    const res = await deleteProductFromDb(productId);
    if (!res.ok) {
      showToast(`Erro ao remover produto do Supabase: ${res.error}`, 'error');
      return false;
    }

    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showToast('Produto removido do Supabase.', 'info');
    return true;
  };

  // Admin portal access (`nevaadmin7161`) & Supabase Auth
  const login = (email: string, role: 'customer' | 'admin' = 'customer') => {
    const isSpecialAdmin = email.trim() === 'nevaadmin7161' || role === 'admin';
    if (!isSpecialAdmin) {
      showToast('Autenticação de cliente requer ligação ao Supabase Auth.', 'error');
      return;
    }
    const profile: UserProfile = {
      id: `admin-neva`,
      name: 'Administrador NEVA',
      email: 'admin@neva.ao',
      phone: '+244 962 716 161',
      province: 'Luanda',
      municipality: 'Talatona',
      role: 'admin',
      addresses: [],
      favorites: [],
    };
    setUser(profile);
    showToast('Bem-vindo, Administrador NEVA!');
  };

  const authenticateWithPassword = async (email: string, password: string): Promise<boolean> => {
    const client = getSupabaseClient();
    if (!client) {
      showToast('Supabase não configurado. Configura VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.', 'error');
      return false;
    }

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      showToast(error.message || 'Erro ao iniciar sessão no Supabase.', 'error');
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
      hydrateUserRelations(data.user.id);
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
      showToast('Supabase não configurado. Não é possível criar conta sem Supabase.', 'error');
      return false;
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
      showToast(error.message || 'Não foi possível criar a conta no Supabase.', 'error');
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
      showToast('Conta criada no Supabase!');
    }
    return true;
  };

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    const client = getSupabaseClient();
    if (!client) {
      showToast('Supabase não configurado.', 'error');
      return false;
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
    setFavorites([]);
    if (currentTab === 'admin') {
      setCurrentTab('home');
    }
    showToast('Sessão terminada.', 'info');
  };

  const updateUserProfile = async (patch: Partial<UserProfile>) => {
    if (!user) return;
    await updateProfileInDb(user.id, patch);
    setUser({ ...user, ...patch });
    showToast('Perfil atualizado no Supabase!');
  };

  const addAddress = async (addrData: Omit<UserAddress, 'id'>) => {
    if (!user) return;
    const res = await addAddressInDb(user.id, addrData);
    if (!res.data) {
      showToast(res.error || 'Erro ao guardar morada no Supabase.', 'error');
      return;
    }
    const newAddress = res.data;
    const updatedAddresses = addrData.isDefault
      ? user.addresses.map((a) => ({ ...a, isDefault: false })).concat(newAddress)
      : [...user.addresses, newAddress];
    setUser({ ...user, addresses: updatedAddresses });
    showToast('Endereço guardado no Supabase!');
  };

  const deleteAddress = async (id: string) => {
    if (!user) return;
    const res = await deleteAddressInDb(user.id, id);
    if (!res.ok) {
      showToast(res.error || 'Erro ao remover morada do Supabase.', 'error');
      return;
    }
    setUser({ ...user, addresses: user.addresses.filter((a) => a.id !== id) });
    showToast('Endereço removido do Supabase.', 'info');
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
