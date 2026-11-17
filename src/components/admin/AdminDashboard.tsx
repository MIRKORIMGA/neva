import React, { useState, useRef } from 'react';
import {
  Shield,
  TrendingUp,
  Package,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Database,
  X,
  Upload,
  ArrowLeft,
  Image as ImageIcon,
  Star,
  Loader2,
  Check,
  Copy,
  RefreshCw,
  Link2,
  Unplug,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatKz } from '../../data/initialData';
import { Product, OrderStatus, CategoryType } from '../../types';
import {
  getSupabaseStatus,
  getActiveSupabaseCredentials,
  saveRuntimeSupabaseConfig,
  clearRuntimeSupabaseConfig,
  testSupabaseConnection,
  SupabaseConnectionCheck,
} from '../../lib/supabase';
import {
  uploadProductImageToStorage,
  deleteProductImageFromStorage,
} from '../../lib/supabaseService';

const QUICK_SCHEMA_SQL = `-- NEVA STORE - SUPABASE SCHEMA + STORAGE ('neva-products')
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  province TEXT DEFAULT 'Luanda',
  municipality TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.categories (id, name, label, slug, display_order) VALUES
  ('t-shirts', 'T-Shirts', 'T-Shirts', 't-shirts', 1),
  ('tenis', 'Ténis', 'Ténis', 'tenis', 2),
  ('casacos', 'Casacos', 'Casacos', 'casacos', 3),
  ('chapeus', 'Chapéus', 'Chapéus', 'chapeus', 4)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  original_price NUMERIC(12, 2),
  description TEXT,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  sizes TEXT[] DEFAULT ARRAY['S', 'M', 'L', 'XL']::TEXT[],
  colors JSONB DEFAULT '[]'::JSONB,
  stock_quantity INT DEFAULT 10,
  is_featured BOOLEAN DEFAULT false,
  is_new_arrival BOOLEAN DEFAULT false,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  reviews_count INT DEFAULT 0,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  details JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  province TEXT NOT NULL,
  municipality TEXT NOT NULL,
  address TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  order_status TEXT DEFAULT 'pending',
  subtotal NUMERIC(12, 2) NOT NULL,
  shipping_fee NUMERIC(12, 2) NOT NULL,
  total NUMERIC(12, 2) NOT NULL,
  payment_proof_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  size TEXT NOT NULL,
  color_name TEXT NOT NULL,
  color_hex TEXT,
  unit_price NUMERIC(12, 2) NOT NULL,
  quantity INT NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public categories viewable by all" ON public.categories;
CREATE POLICY "Public categories viewable by all" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public products viewable by all" ON public.products;
DROP POLICY IF EXISTS "Manage products" ON public.products;
CREATE POLICY "Public products viewable by all" ON public.products FOR SELECT USING (true);
CREATE POLICY "Manage products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create an order" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
CREATE POLICY "Anyone can view orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Anyone can create an order" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update orders" ON public.orders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Order items viewable" ON public.order_items;
DROP POLICY IF EXISTS "Order items insertable on checkout" ON public.order_items;
CREATE POLICY "Order items viewable" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Order items insertable on checkout" ON public.order_items FOR INSERT WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('neva-products', 'neva-products', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access neva-products" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload neva-products" ON storage.objects;
DROP POLICY IF EXISTS "Public Update neva-products" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete neva-products" ON storage.objects;

CREATE POLICY "Public Access neva-products" ON storage.objects FOR SELECT USING (bucket_id = 'neva-products');
CREATE POLICY "Public Upload neva-products" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'neva-products');
CREATE POLICY "Public Update neva-products" ON storage.objects FOR UPDATE USING (bucket_id = 'neva-products');
CREATE POLICY "Public Delete neva-products" ON storage.objects FOR DELETE USING (bucket_id = 'neva-products');`;

export const AdminDashboard: React.FC = () => {
  const {
    products,
    orders,
    addProduct,
    updateProduct,
    deleteProduct,
    updateOrderStatus,
    updatePaymentStatus,
    setCurrentTab,
    showToast,
    isSupabaseConnected,
    isSyncing,
    syncWithSupabase,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'stats' | 'products' | 'orders' | 'supabase'>('stats');

  // Product modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Form fields for new/edit product
  const [name, setName] = useState('');
  const [price, setPrice] = useState<string>('');
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryType>('t-shirts');
  const [stockQuantity, setStockQuantity] = useState<string>('1');
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [sizesInput, setSizesInput] = useState('S, M, L, XL');
  const [isFeatured, setIsFeatured] = useState(true);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Supabase connection form state
  const activeCreds = getActiveSupabaseCredentials();
  const [sbUrl, setSbUrl] = useState(activeCreds.url);
  const [sbAnonKey, setSbAnonKey] = useState(activeCreds.anonKey);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionCheck, setConnectionCheck] = useState<SupabaseConnectionCheck | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Statistics calculations
  const totalSales = orders.reduce((sum, ord) => sum + ord.total, 0);
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'pending').length;
  const totalProductsCount = products.length;
  const totalUnitsInStock = products.reduce((sum, p) => sum + p.stockQuantity, 0);

  const supabaseStatus = getSupabaseStatus();

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setOriginalPrice('');
    setDescription('');
    setCategory('t-shirts');
    setStockQuantity('1');
    setImagesList([]);
    setImageUrlInput('');
    setSizesInput('S, M, L, XL');
    setIsFeatured(true);
    setIsNewArrival(true);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setPrice(String(prod.price));
    setOriginalPrice(prod.originalPrice ? String(prod.originalPrice) : '');
    setDescription(prod.description);
    setCategory(prod.category);
    setStockQuantity(String(prod.stockQuantity));
    setImagesList([...prod.images]);
    setImageUrlInput('');
    setSizesInput(prod.sizes.join(', '));
    setIsFeatured(prod.isFeatured || false);
    setIsNewArrival(prod.isNewArrival || false);
    setIsProductModalOpen(true);
  };

  const processSelectedFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        showToast(`"${file.name}" não é uma imagem válida.`, 'error');
        return false;
      }
      if (file.size > 6 * 1024 * 1024) {
        showToast(`"${file.name}" excede o limite de 6MB.`, 'error');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploadingImages(true);
    try {
      const uploadedUrls: string[] = [];
      let supabaseCount = 0;
      let fallbackWarning = '';

      for (const file of validFiles) {
        const result = await uploadProductImageToStorage(file);
        uploadedUrls.push(result.url);
        if (result.storage === 'supabase') {
          supabaseCount++;
        } else if (result.warning) {
          fallbackWarning = result.warning;
        }
      }

      setImagesList((prev) => [...prev, ...uploadedUrls]);

      if (supabaseCount > 0) {
        showToast(
          supabaseCount === 1
            ? 'Imagem carregada para o Supabase Storage!'
            : `${supabaseCount} imagens carregadas para o Supabase Storage!`
        );
      } else if (fallbackWarning) {
        showToast(`Guardado localmente (${fallbackWarning})`, 'info');
      } else {
        showToast(
          uploadedUrls.length === 1
            ? 'Imagem adicionada!'
            : `${uploadedUrls.length} imagens adicionadas!`
        );
      }
    } finally {
      setIsUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    processSelectedFiles(e.target.files);
  };

  const handleDropImages = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    processSelectedFiles(e.dataTransfer.files);
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    setImagesList((prev) => [...prev, trimmed]);
    setImageUrlInput('');
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImagesList((prev) => {
      const next = [...prev];
      const [chosen] = next.splice(index, 1);
      next.unshift(chosen);
      return next;
    });
  };

  const handleRemoveImage = async (index: number) => {
    const urlToRemove = imagesList[index];
    setImagesList((prev) => prev.filter((_, idx) => idx !== index));
    if (urlToRemove && urlToRemove.includes('/neva-products/')) {
      deleteProductImageFromStorage(urlToRemove).catch(() => {});
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('O nome do produto é obrigatório.', 'error');
      return;
    }

    const numericPrice = Number(price);
    if (!numericPrice || numericPrice <= 0) {
      showToast('Insere um preço válido em Kz.', 'error');
      return;
    }

    const numericOriginalPrice = originalPrice ? Number(originalPrice) : undefined;
    const numericStock = Math.max(0, Number(stockQuantity) || 0);
    const sizesArr = sizesInput.split(',').map((s) => s.trim()).filter(Boolean);

    const categoryLabels: Record<CategoryType, string> = {
      all: 'Geral',
      't-shirts': 'T-Shirts',
      tenis: 'Ténis',
      casacos: 'Casacos',
      chapeus: 'Chapéus',
      calcas: 'Calças',
    };

    const finalImages = imageUrlInput.trim()
      ? [...imagesList, imageUrlInput.trim()]
      : [...imagesList];

    setIsSavingProduct(true);
    try {
      if (editingProduct) {
        await updateProduct({
          ...editingProduct,
          name: name.trim(),
          price: numericPrice,
          originalPrice: numericOriginalPrice,
          description: description.trim(),
          category,
          categoryLabel: categoryLabels[category] || 'Coleção',
          stockQuantity: numericStock,
          images: finalImages,
          sizes: sizesArr.length ? sizesArr : ['Tamanho Único'],
          isFeatured,
          isNewArrival,
        });
      } else {
        await addProduct({
          name: name.trim(),
          slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
          price: numericPrice,
          originalPrice: numericOriginalPrice,
          description: description.trim(),
          category,
          categoryLabel: categoryLabels[category] || 'Coleção',
          images: finalImages,
          sizes: sizesArr.length ? sizesArr : ['Tamanho Único'],
          colors: [
            { name: 'Preto', hex: '#111111' },
            { name: 'Branco', hex: '#FFFFFF' },
          ],
          stockQuantity: numericStock,
          isFeatured,
          isNewArrival,
          rating: 5.0,
          reviewsCount: 0,
        });
      }

      setIsProductModalOpen(false);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleSaveAndTestSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sbUrl.trim().startsWith('http') || !sbAnonKey.trim()) {
      showToast('Insere um Project URL (https://...) e uma Anon Key válida.', 'error');
      return;
    }

    const saved = saveRuntimeSupabaseConfig(sbUrl, sbAnonKey);
    if (!saved) {
      showToast('Credenciais inválidas.', 'error');
      return;
    }

    setIsTestingConnection(true);
    try {
      const result = await testSupabaseConnection();
      setConnectionCheck(result);
      await syncWithSupabase();
      if (result.ok) {
        showToast('Conectado ao Supabase com sucesso!');
      } else {
        showToast(result.message, 'info');
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleDisconnectSupabase = async () => {
    clearRuntimeSupabaseConfig();
    setSbUrl('');
    setSbAnonKey('');
    setConnectionCheck(null);
    await syncWithSupabase();
    showToast('Credenciais locais do Supabase removidas.', 'info');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(QUICK_SCHEMA_SQL);
    setCopiedSql(true);
    showToast('SQL Schema copiado! Cola no SQL Editor do Supabase.');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Admin Title & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Painel Administrativo</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white font-display uppercase tracking-tight">
            Gestão NEVA Store
          </h1>
          <p className="text-xs sm:text-sm text-[#8E8E93]">
            Controlo de catálogo, upload de imagens, encomendas e base de dados Supabase.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTab('home')}
            className="px-4 py-3 bg-[#181818] hover:bg-[#222222] text-neutral-300 hover:text-white font-semibold text-xs uppercase tracking-wider rounded-xl border border-white/10 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ver Loja</span>
          </button>

          <button
            onClick={handleOpenAddProduct}
            className="px-5 py-3 bg-white hover:bg-neutral-200 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-white/10"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Admin Sub Navigation Tabs */}
      <div className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-3 mb-8">
        {[
          { id: 'stats', label: 'Dashboard & Vendas', icon: TrendingUp },
          { id: 'products', label: `Produtos (${products.length})`, icon: Package },
          { id: 'orders', label: `Encomendas (${orders.length})`, icon: Clock },
          { id: 'supabase', label: 'Supabase & Storage', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-white text-black font-bold shadow-md'
                  : 'bg-[#141414] text-[#BDBDBD] hover:text-white border border-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: STATS DASHBOARD */}
      {activeTab === 'stats' && (
        <div className="space-y-8">
          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 sm:p-6">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                Total de Vendas
              </span>
              <p className="text-2xl sm:text-3xl font-black text-white tabular-nums font-display">
                {formatKz(totalSales)}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-2 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Receita acumulada</span>
              </div>
            </div>

            <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 sm:p-6">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                Total de Encomendas
              </span>
              <p className="text-2xl sm:text-3xl font-black text-white tabular-nums font-display">
                {totalOrdersCount}
              </p>
              <p className="text-[11px] text-neutral-400 mt-2">
                {pendingOrdersCount} pendentes de envio
              </p>
            </div>

            <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 sm:p-6">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                Produtos Ativos
              </span>
              <p className="text-2xl sm:text-3xl font-black text-white tabular-nums font-display">
                {totalProductsCount}
              </p>
              <p className="text-[11px] text-neutral-400 mt-2">
                {totalUnitsInStock} unidades no stock total
              </p>
            </div>

            <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 sm:p-6">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                Pendentes de Validação
              </span>
              <p className="text-2xl sm:text-3xl font-black text-amber-400 tabular-nums font-display">
                {pendingOrdersCount}
              </p>
              <p className="text-[11px] text-neutral-400 mt-2">
                Aguardam confirmação
              </p>
            </div>
          </div>

          {/* Quick Recent Orders inside Stats */}
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Últimas Encomendas Recebidas
              </h3>
              {orders.length > 0 && (
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
                >
                  Gerir todas as encomendas
                </button>
              )}
            </div>

            {orders.length === 0 ? (
              <div className="py-10 text-center text-xs text-neutral-400">
                Nenhuma encomenda recebida até ao momento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-300">
                  <thead className="bg-[#181818] text-neutral-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Pedido</th>
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Província / Município</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Método</th>
                      <th className="p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.slice(0, 5).map((ord) => (
                      <tr key={ord.id} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-mono font-bold text-white">#{ord.orderNumber}</td>
                        <td className="p-3 font-medium text-white">{ord.customerName}</td>
                        <td className="p-3 text-neutral-400">{ord.municipality}, {ord.province}</td>
                        <td className="p-3 font-bold tabular-nums text-white">{formatKz(ord.total)}</td>
                        <td className="p-3 text-neutral-400 capitalize">{ord.paymentMethod.replace('_', ' ')}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white/10 text-white">
                            {ord.orderStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Inventário de Produtos ({products.length})
            </h3>
            <button
              onClick={handleOpenAddProduct}
              className="px-4 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Produto</span>
            </button>
          </div>

          {products.length === 0 ? (
            <div className="bg-[#141414] border border-white/5 rounded-3xl p-12 text-center">
              <Package className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white mb-1">Nenhum produto no catálogo</h4>
              <p className="text-xs text-neutral-400 mb-6">
                Adiciona o primeiro produto real da NEVA e carrega as fotografias diretamente no painel.
              </p>
              <button
                onClick={handleOpenAddProduct}
                className="px-6 py-3 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-full hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                + Adicionar Primeiro Produto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-[#141414] border border-white/5 rounded-2xl p-4 flex gap-4 items-center justify-between"
                >
                  <div className="w-16 h-16 bg-[#1a1a1a] rounded-xl p-1 shrink-0 flex items-center justify-center overflow-hidden relative">
                    {prod.images[0] ? (
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-neutral-600" />
                    )}
                    {prod.images.length > 1 && (
                      <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[9px] text-white font-bold px-1 rounded">
                        +{prod.images.length - 1}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                      {prod.categoryLabel}
                    </span>
                    <h4 className="text-xs font-bold text-white truncate">{prod.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-white tabular-nums">
                        {formatKz(prod.price)}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        Stock: <strong className="text-white">{prod.stockQuantity}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEditProduct(prod)}
                      className="p-2 text-neutral-400 hover:text-white rounded-lg bg-[#202020] hover:bg-[#282828] transition-colors"
                      title="Editar produto"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Tens a certeza que queres eliminar "${prod.name}"?`)) {
                          deleteProduct(prod.id);
                        }
                      }}
                      className="p-2 text-neutral-400 hover:text-red-400 rounded-lg bg-[#202020] hover:bg-red-950/40 transition-colors"
                      title="Eliminar produto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Gestão de Encomendas Recebidas ({orders.length})
            </h3>
          </div>

          {orders.length === 0 ? (
            <div className="bg-[#141414] border border-white/5 rounded-3xl p-12 text-center">
              <Clock className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white mb-1">Sem encomendas registadas</h4>
              <p className="text-xs text-neutral-400">
                As encomendas feitas pelos clientes aparecerão aqui para validação e gestão de envio.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-[#121212] border border-white/5 rounded-2xl p-5 sm:p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div>
                      <span className="text-xs text-neutral-400">Encomenda #</span>
                      <h4 className="text-base font-bold text-white font-mono">{ord.orderNumber}</h4>
                      <p className="text-xs text-neutral-400">
                        Cliente: <strong className="text-white">{ord.customerName}</strong> ({ord.customerPhone}) · {ord.customerEmail}
                      </p>
                    </div>

                    {/* Status Controllers */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <label className="text-[10px] text-neutral-400 block mb-1">Estado do Pedido:</label>
                        <select
                          value={ord.orderStatus}
                          onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                          className="bg-[#1a1a1a] border border-[#333] text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                        >
                          <option value="pending">Pendente</option>
                          <option value="confirmed">Confirmado</option>
                          <option value="processing">Em Preparação</option>
                          <option value="shipped">Em Trânsito / Enviado</option>
                          <option value="delivered">Entregue</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-neutral-400 block mb-1">Pagamento:</label>
                        <select
                          value={ord.paymentStatus}
                          onChange={(e) => updatePaymentStatus(ord.id, e.target.value as any)}
                          className="bg-[#1a1a1a] border border-[#333] text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                        >
                          <option value="pending">Pendente</option>
                          <option value="verified">Verificado / Pago</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Delivery details */}
                  <div className="bg-[#171717] p-3 rounded-xl border border-white/5 text-xs text-neutral-300">
                    <p>
                      <strong>Endereço de Entrega:</strong> {ord.address}, {ord.municipality}, {ord.province}
                    </p>
                    {ord.notes && (
                      <p className="text-neutral-400 mt-1">
                        <strong>Instruções do Cliente:</strong> "{ord.notes}"
                      </p>
                    )}
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    {ord.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-white">
                          {item.quantity}x {item.product.name} (Tam: {item.selectedSize}, Cor: {item.selectedColor.name})
                        </span>
                        <span className="text-neutral-400 font-mono tabular-nums">
                          {formatKz(item.product.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-white/5">
                      <span>Total da Encomenda:</span>
                      <span className="text-base tabular-nums font-mono text-emerald-400">
                        {formatKz(ord.total)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SUPABASE & DATABASE CONFIGURATION */}
      {activeTab === 'supabase' && (
        <div className="space-y-6">
          <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-600/40 flex items-center justify-center shrink-0">
                  <Database className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">
                    Conexão Supabase (PostgreSQL + Storage)
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Liga a loja ao teu projeto Supabase para guardar produtos, imagens e encomendas na nuvem.
                  </p>
                </div>
              </div>

              {isSupabaseConnected && (
                <button
                  type="button"
                  onClick={syncWithSupabase}
                  disabled={isSyncing}
                  className="px-4 py-2 bg-[#1c1c1c] hover:bg-[#262626] border border-white/10 text-white text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'A sincronizar...' : 'Sincronizar Agora'}</span>
                </button>
              )}
            </div>

            {/* Connection Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#181818] p-4 rounded-2xl border border-white/5">
                <span className="text-xs text-neutral-400 block mb-1">Estado Atual:</span>
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  {supabaseStatus.isConfigured ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Conectado ({supabaseStatus.url})</span>
                    </>
                  ) : (
                    <span>Armazenamento Local (Aguardando Credenciais)</span>
                  )}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {supabaseStatus.source === 'env'
                    ? 'Configurado via variáveis de ambiente (.env)'
                    : supabaseStatus.source === 'runtime'
                    ? 'Configurado via painel administrativo'
                    : 'Insere as chaves públicas do teu projeto Supabase abaixo.'}
                </p>
              </div>

              <div className="bg-[#181818] p-4 rounded-2xl border border-white/5">
                <span className="text-xs text-neutral-400 block mb-1">Bucket de Imagens:</span>
                <p className="text-sm font-bold text-white font-mono">neva-products</p>
                <p className="text-[11px] text-neutral-400 mt-1">
                  As fotos carregadas no modal de produtos são enviadas para este bucket público.
                </p>
              </div>
            </div>

            {connectionCheck && (
              <div
                className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                  connectionCheck.ok
                    ? 'bg-emerald-950/30 border-emerald-700/40 text-emerald-300'
                    : 'bg-amber-950/30 border-amber-700/40 text-amber-300'
                }`}
              >
                {connectionCheck.ok ? (
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{connectionCheck.message}</p>
                  <p className="text-[11px] opacity-80 mt-1">
                    Base de Dados: {connectionCheck.dbReady ? 'Pronta' : 'Pendente'} · Storage (neva-products):{' '}
                    {connectionCheck.storageReady ? 'Pronto' : 'Pendente'}
                  </p>
                </div>
              </div>
            )}

            {/* Supabase Credentials Form */}
            <form onSubmit={handleSaveAndTestSupabase} className="space-y-4 bg-[#161616] p-5 rounded-2xl border border-white/5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                <span>Credenciais do Projeto Supabase</span>
              </h4>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Project URL (VITE_SUPABASE_URL)
                  </label>
                  <input
                    type="url"
                    required
                    value={sbUrl}
                    onChange={(e) => setSbUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    disabled={supabaseStatus.source === 'env'}
                    className="w-full bg-[#1c1c1c] border border-[#333] text-xs sm:text-sm text-white rounded-xl p-3 font-mono disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Public Anon Key (VITE_SUPABASE_ANON_KEY)
                  </label>
                  <input
                    type="password"
                    required
                    value={sbAnonKey}
                    onChange={(e) => setSbAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    disabled={supabaseStatus.source === 'env'}
                    className="w-full bg-[#1c1c1c] border border-[#333] text-xs sm:text-sm text-white rounded-xl p-3 font-mono disabled:opacity-60"
                  />
                </div>
              </div>

              {supabaseStatus.source !== 'env' && (
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={isTestingConnection}
                    className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isTestingConnection ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>A testar ligação...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Conectar & Testar Ligação</span>
                      </>
                    )}
                  </button>

                  {supabaseStatus.source === 'runtime' && (
                    <button
                      type="button"
                      onClick={handleDisconnectSupabase}
                      className="px-4 py-2.5 bg-[#202020] hover:bg-red-950/50 text-neutral-300 hover:text-red-400 text-xs font-semibold rounded-xl border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Unplug className="w-3.5 h-3.5" />
                      <span>Desconectar</span>
                    </button>
                  )}
                </div>
              )}
            </form>

            {/* Setup Guide & One-Click SQL Copy */}
            <div className="bg-[#161616] p-5 rounded-2xl border border-white/5 text-xs text-neutral-300 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-bold text-white uppercase tracking-wider">
                  Configuração das Tabelas & Bucket Storage
                </h4>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3.5 py-2 bg-[#222] hover:bg-white hover:text-black text-white font-bold text-[11px] uppercase tracking-wider rounded-lg border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'SQL Copiado!' : 'Copiar SQL Schema'}</span>
                </button>
              </div>
              <p>1. Cria um projeto gratuito em <strong>supabase.com</strong>.</p>
              <p>
                2. Clica em <strong>Copiar SQL Schema</strong> acima (ou usa o ficheiro{' '}
                <code>supabase_schema.sql</code>), cola no <strong>SQL Editor</strong> do Supabase e executa{' '}
                <strong>Run</strong>. Isso cria as tabelas e o bucket público <code>neva-products</code> para imagens.
              </p>
              <p>
                3. Cola acima o <strong>Project URL</strong> e a chave pública <strong>anon / public</strong> (em{' '}
                <em>Project Settings &rarr; API</em>) e clica em <strong>Conectar &amp; Testar Ligação</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsProductModalOpen(false)}
          />

          <div className="relative w-full max-w-xl bg-[#141414] border border-white/10 rounded-3xl p-6 shadow-2xl z-10 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white uppercase tracking-tight font-display">
                {editingProduct ? 'Editar Produto' : 'Novo Produto NEVA'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Nome do Produto</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do artigo"
                  className="w-full bg-[#1c1c1c] border border-[#333] text-sm text-white rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Preço em Kz</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#1c1c1c] border border-[#333] text-sm text-white rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Preço Original (opcional)</label>
                  <input
                    type="number"
                    min="0"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="Opcional"
                    className="w-full bg-[#1c1c1c] border border-[#333] text-sm text-white rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[#1c1c1c] border border-[#333] text-sm text-white rounded-xl p-2.5"
                  >
                    <option value="t-shirts">T-Shirts</option>
                    <option value="tenis">Ténis</option>
                    <option value="casacos">Casacos</option>
                    <option value="chapeus">Chapéus</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Stock Disponível</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-[#333] text-sm text-white rounded-xl p-2.5"
                  />
                </div>
              </div>

              {/* Multi-Image Upload Zone (Supabase Storage + Local Fallback) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300">
                    Imagens do Produto ({imagesList.length})
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    {isSupabaseConnected ? 'Upload direto para Supabase Storage' : 'Carregamento local'}
                  </span>
                </div>

                {/* Drag & Drop / Multi-file Picker */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={handleDropImages}
                  onClick={() => !isUploadingImages && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition-colors cursor-pointer ${
                    isDraggingOver
                      ? 'border-white bg-white/10'
                      : 'border-white/15 bg-[#191919] hover:border-white/35'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />

                  {isUploadingImages ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                      <span className="text-xs font-semibold text-white">
                        {isSupabaseConnected
                          ? 'A enviar imagens para o Supabase Storage...'
                          : 'A processar imagens...'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-1">
                        <Upload className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-xs font-bold text-white">
                        Clica para carregar fotos ou arrasta para aqui
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        PNG, JPG ou WEBP (até 6MB por imagem · múltiplas fotos suportadas)
                      </p>
                    </div>
                  )}
                </div>

                {/* Optional Link Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Ou cola o link de uma imagem (https://...)"
                    className="flex-1 bg-[#1c1c1c] border border-[#333] text-xs text-white rounded-xl p-2.5"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    disabled={!imageUrlInput.trim()}
                    className="px-3.5 py-2.5 bg-[#242424] hover:bg-[#303030] disabled:opacity-40 text-white text-xs font-semibold rounded-xl border border-white/10 transition-colors cursor-pointer"
                  >
                    Adicionar Link
                  </button>
                </div>

                {/* Gallery Preview Grid */}
                {imagesList.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                    {imagesList.map((imgUrl, idx) => {
                      const isPrimary = idx === 0;
                      const isSupabaseHosted = imgUrl.includes('supabase');
                      return (
                        <div
                          key={`${idx}-${imgUrl.slice(0, 24)}`}
                          className={`group relative aspect-square rounded-xl bg-[#1a1a1a] border overflow-hidden p-1 flex items-center justify-center ${
                            isPrimary ? 'border-white ring-1 ring-white/40' : 'border-white/10'
                          }`}
                        >
                          <img src={imgUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-contain" />

                          {/* Top badge */}
                          <span
                            className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              isPrimary
                                ? 'bg-white text-black'
                                : isSupabaseHosted
                                ? 'bg-emerald-950/90 text-emerald-300'
                                : 'bg-black/80 text-neutral-300'
                            }`}
                          >
                            {isPrimary ? 'Capa' : isSupabaseHosted ? 'Cloud' : `#${idx + 1}`}
                          </span>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Remover imagem"
                          >
                            <X className="w-3 h-3" />
                          </button>

                          {/* Set as cover button */}
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              className="absolute bottom-1 inset-x-1 py-0.5 bg-black/85 hover:bg-white hover:text-black text-[9px] font-bold text-white rounded flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <Star className="w-2.5 h-2.5" />
                              <span>Definir Capa</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {imagesList.length === 0 && (
                  <p className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> Nenhuma imagem selecionada para este produto.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Tamanhos (separados por vírgula)</label>
                <input
                  type="text"
                  value={sizesInput}
                  onChange={(e) => setSizesInput(e.target.value)}
                  placeholder="S, M, L, XL"
                  className="w-full bg-[#1c1c1c] border border-[#333] text-sm text-white rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes do material, corte e acabamento..."
                  className="w-full bg-[#1c1c1c] border border-[#333] text-sm text-white rounded-xl p-2.5 resize-none"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                  />
                  <span>Produto em Destaque</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewArrival}
                    onChange={(e) => setIsNewArrival(e.target.checked)}
                  />
                  <span>Novo Lançamento</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-[#202020] text-neutral-400 hover:text-white rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploadingImages || isSavingProduct}
                  className="px-5 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSavingProduct && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSavingProduct ? 'A guardar...' : 'Guardar Produto'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
