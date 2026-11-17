export type CategoryType = 'all' | 't-shirts' | 'tenis' | 'casacos' | 'chapeus' | 'calcas';

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number; // in Angolan Kwanza (Kz)
  originalPrice?: number;
  description: string;
  category: CategoryType;
  categoryLabel: string;
  images: string[];
  sizes: string[];
  colors: ProductColor[];
  stockQuantity: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  rating?: number;
  reviewsCount?: number;
  tags?: string[];
  details?: {
    material: string;
    fit: string;
    care: string;
  };
}

export interface Category {
  id: CategoryType;
  name: string;
  label: string;
  image: string;
  itemCount: number;
  description: string;
}

export interface CartItem {
  id: string; // unique cart line id: productId-size-color
  product: Product;
  selectedSize: string;
  selectedColor: ProductColor;
  quantity: number;
}

export type PaymentMethod = 'transfer' | 'delivery' | 'multicaixa_express';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  province: string;
  municipality: string;
  address: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'verified';
  orderStatus: OrderStatus;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  notes?: string;
  paymentProofUrl?: string;
}

export interface UserAddress {
  id: string;
  label: string;
  name: string;
  phone: string;
  province: string;
  municipality: string;
  address: string;
  isDefault: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  province?: string;
  municipality?: string;
  role: 'customer' | 'admin';
  addresses: UserAddress[];
  favorites: string[]; // product IDs
}

export type ActiveTab = 'home' | 'catalog' | 'favorites' | 'cart' | 'account' | 'admin';
