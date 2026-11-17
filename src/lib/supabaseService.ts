import { CategoryType, Order, Product, ProductColor } from '../types';
import { getSupabaseClient, PRODUCT_IMAGES_BUCKET } from './supabase';

const CATEGORY_LABELS: Record<CategoryType, string> = {
  all: 'Geral',
  't-shirts': 'T-Shirts',
  tenis: 'Ténis',
  casacos: 'Casacos',
  chapeus: 'Chapéus',
  calcas: 'Calças',
};

function mapDbRowToProduct(row: any): Product {
  const category = (row.category_id || 't-shirts') as CategoryType;
  const parsedColors: ProductColor[] = Array.isArray(row.colors) && row.colors.length > 0
    ? row.colors
    : [
        { name: 'Preto', hex: '#111111' },
        { name: 'Branco', hex: '#FFFFFF' },
      ];

  return {
    id: String(row.id),
    name: String(row.name || ''),
    slug: String(row.slug || row.id),
    price: Number(row.price || 0),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    description: String(row.description || ''),
    category,
    categoryLabel: CATEGORY_LABELS[category] || 'Coleção',
    images: Array.isArray(row.images) ? row.images.filter(Boolean) : [],
    sizes: Array.isArray(row.sizes) && row.sizes.length > 0 ? row.sizes : ['Tamanho Único'],
    colors: parsedColors,
    stockQuantity: Number(row.stock_quantity ?? 0),
    isFeatured: Boolean(row.is_featured),
    isNewArrival: Boolean(row.is_new_arrival),
    rating: row.rating != null ? Number(row.rating) : 5.0,
    reviewsCount: row.reviews_count != null ? Number(row.reviews_count) : 0,
    tags: Array.isArray(row.tags) ? row.tags : [],
    details: row.details && typeof row.details === 'object' ? row.details : undefined,
  };
}

function mapProductToDbRow(product: Product) {
  return {
    id: product.id,
    name: product.name,
    slug: `${product.slug || 'item'}-${product.id.slice(-5)}`.toLowerCase(),
    price: product.price,
    original_price: product.originalPrice ?? null,
    description: product.description || '',
    category_id: product.category === 'all' ? null : product.category,
    images: product.images || [],
    sizes: product.sizes || ['Tamanho Único'],
    colors: product.colors || [],
    stock_quantity: product.stockQuantity ?? 0,
    is_featured: Boolean(product.isFeatured),
    is_new_arrival: Boolean(product.isNewArrival),
    rating: product.rating ?? 5.0,
    reviews_count: product.reviewsCount ?? 0,
    tags: product.tags || [],
    details: product.details || {},
    updated_at: new Date().toISOString(),
  };
}

export async function fetchProductsFromDb(): Promise<{ data: Product[] | null; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { data: null };

  const { data, error } = await client
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data || []).map(mapDbRowToProduct) };
}

export async function upsertProductInDb(product: Product): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: 'Supabase não configurado' };

  const row = mapProductToDbRow(product);
  const { error } = await client.from('products').upsert(row, { onConflict: 'id' });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function deleteProductFromDb(productId: string): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: 'Supabase não configurado' };

  const { error } = await client.from('products').delete().eq('id', productId);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function fetchOrdersFromDb(): Promise<{ data: Order[] | null; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { data: null };

  const { data, error } = await client
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  const mapped: Order[] = (data || []).map((row: any) => ({
    id: String(row.id),
    orderNumber: String(row.order_number),
    customerName: String(row.customer_name),
    customerEmail: String(row.customer_email),
    customerPhone: String(row.customer_phone),
    province: String(row.province),
    municipality: String(row.municipality),
    address: String(row.address),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    subtotal: Number(row.subtotal || 0),
    shippingFee: Number(row.shipping_fee || 0),
    total: Number(row.total || 0),
    createdAt: row.created_at || new Date().toISOString(),
    notes: row.notes || undefined,
    paymentProofUrl: row.payment_proof_url || undefined,
    items: Array.isArray(row.order_items)
      ? row.order_items.map((item: any, index: number) => ({
          id: `${item.product_id || index}-${item.size}-${item.color_name}`,
          selectedSize: item.size || 'Único',
          selectedColor: {
            name: item.color_name || 'Padrão',
            hex: item.color_hex || '#111111',
          },
          quantity: Number(item.quantity || 1),
          product: {
            id: String(item.product_id || `item-${index}`),
            name: String(item.product_name || 'Artigo NEVA'),
            slug: String(item.product_id || `item-${index}`),
            price: Number(item.unit_price || 0),
            description: '',
            category: 't-shirts',
            categoryLabel: 'Coleção',
            images: item.product_image ? [item.product_image] : [],
            sizes: [item.size || 'Único'],
            colors: [{ name: item.color_name || 'Padrão', hex: item.color_hex || '#111111' }],
            stockQuantity: 1,
          },
        }))
      : [],
  }));

  return { data: mapped };
}

export async function createOrderInDb(order: Order, userId?: string): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: 'Supabase não configurado' };

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const validUserId = userId && uuidRegex.test(userId) ? userId : null;

  const { error: orderError } = await client.from('orders').insert({
    id: order.id,
    order_number: order.orderNumber,
    user_id: validUserId,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    customer_phone: order.customerPhone,
    province: order.province,
    municipality: order.municipality,
    address: order.address,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    order_status: order.orderStatus,
    subtotal: order.subtotal,
    shipping_fee: order.shippingFee,
    total: order.total,
    payment_proof_url: order.paymentProofUrl ?? null,
    notes: order.notes ?? null,
    created_at: order.createdAt,
  });

  if (orderError) {
    return { ok: false, error: orderError.message };
  }

  if (order.items.length > 0) {
    const itemsPayload = order.items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      product_image: item.product.images[0] || null,
      size: item.selectedSize,
      color_name: item.selectedColor.name,
      color_hex: item.selectedColor.hex,
      unit_price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    }));

    const { error: itemsError } = await client.from('order_items').insert(itemsPayload);
    if (itemsError) {
      return { ok: false, error: itemsError.message };
    }
  }

  return { ok: true };
}

export async function updateOrderStatusInDb(
  orderId: string,
  orderStatus: Order['orderStatus']
): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false };

  const { error } = await client
    .from('orders')
    .update({ order_status: orderStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updatePaymentStatusInDb(
  orderId: string,
  paymentStatus: Order['paymentStatus']
): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false };

  const { error } = await client
    .from('orders')
    .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Falha ao ler ficheiro de imagem.'));
        return;
      }

      const rawDataUrl = reader.result;
      // If small enough (< 180KB), keep directly without re-encoding
      if (file.size <= 180 * 1024) {
        resolve(rawDataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 960;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width >= height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const outputType = file.type === 'image/png' ? 'image/webp' : 'image/jpeg';
          const compressed = canvas.toDataURL(outputType, 0.8);
          resolve(compressed.length < rawDataUrl.length ? compressed : rawDataUrl);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.onerror = () => reject(new Error('Erro ao ler imagem.'));
    reader.readAsDataURL(file);
  });
}

export interface UploadedImageResult {
  url: string;
  storage: 'supabase' | 'local';
  warning?: string;
}

export async function uploadProductImageToStorage(file: File): Promise<UploadedImageResult> {
  const client = getSupabaseClient();

  if (client) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const baseName = file.name
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .slice(0, 40);
    const filePath = `products/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${baseName || 'neva'}.${ext}`;

    try {
      const { error: uploadError } = await client.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/png',
        });

      if (!uploadError) {
        const { data: publicUrlData } = client.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return {
            url: publicUrlData.publicUrl,
            storage: 'supabase',
          };
        }
      }

      const fallbackUrl = await readFileAsDataUrl(file);
      return {
        url: fallbackUrl,
        storage: 'local',
        warning: uploadError?.message || 'Bucket Storage não encontrado; imagem guardada localmente.',
      };
    } catch (err: any) {
      const fallbackUrl = await readFileAsDataUrl(file);
      return {
        url: fallbackUrl,
        storage: 'local',
        warning: err?.message || 'Erro no Supabase Storage; imagem guardada localmente.',
      };
    }
  }

  const localUrl = await readFileAsDataUrl(file);
  return {
    url: localUrl,
    storage: 'local',
  };
}

export async function deleteProductImageFromStorage(imageUrl: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return;

  const objectPath = decodeURIComponent(imageUrl.slice(idx + marker.length));
  if (!objectPath) return;

  await client.storage.from(PRODUCT_IMAGES_BUCKET).remove([objectPath]);
}
