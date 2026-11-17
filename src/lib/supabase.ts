import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const PRODUCT_IMAGES_BUCKET = 'neva-products';
const RUNTIME_CONFIG_KEY = 'neva_supabase_config';

interface RuntimeSupabaseConfig {
  url: string;
  anonKey: string;
}

const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const envAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let cachedClient: SupabaseClient | null = null;
let cachedSignature = '';

function readRuntimeConfig(): RuntimeSupabaseConfig | null {
  try {
    const raw = localStorage.getItem(RUNTIME_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.url === 'string' && typeof parsed.anonKey === 'string') {
      return {
        url: parsed.url.trim(),
        anonKey: parsed.anonKey.trim(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function getActiveSupabaseCredentials(): {
  url: string;
  anonKey: string;
  source: 'env' | 'runtime' | 'none';
} {
  if (envUrl && envAnonKey && !envUrl.includes('placeholder')) {
    return { url: envUrl, anonKey: envAnonKey, source: 'env' };
  }

  const runtime = readRuntimeConfig();
  if (runtime && runtime.url && runtime.anonKey && !runtime.url.includes('placeholder')) {
    return { url: runtime.url, anonKey: runtime.anonKey, source: 'runtime' };
  }

  return { url: '', anonKey: '', source: 'none' };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getActiveSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('http'));
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getActiveSupabaseCredentials();
  if (!url || !anonKey || !url.startsWith('http')) {
    cachedClient = null;
    cachedSignature = '';
    return null;
  }

  const signature = `${url}::${anonKey}`;
  if (cachedClient && cachedSignature === signature) {
    return cachedClient;
  }

  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  cachedSignature = signature;
  return cachedClient;
}

export function saveRuntimeSupabaseConfig(url: string, anonKey: string): boolean {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  const cleanKey = anonKey.trim();

  if (!cleanUrl.startsWith('http') || !cleanKey) {
    return false;
  }

  const payload = JSON.stringify({ url: cleanUrl, anonKey: cleanKey });
  try {
    localStorage.setItem(RUNTIME_CONFIG_KEY, payload);
  } catch {
    try {
      localStorage.removeItem('neva_v2_products');
      localStorage.setItem(RUNTIME_CONFIG_KEY, payload);
    } catch {
      return false;
    }
  }
  cachedClient = null;
  cachedSignature = '';
  return true;
}

export function clearRuntimeSupabaseConfig(): void {
  localStorage.removeItem(RUNTIME_CONFIG_KEY);
  cachedClient = null;
  cachedSignature = '';
}

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  source: 'env' | 'runtime' | 'none';
  url: string;
  urlRaw: string;
}

export function getSupabaseStatus(): SupabaseConfigStatus {
  const { url, source } = getActiveSupabaseCredentials();
  const configured = isSupabaseConfigured();
  return {
    isConfigured: configured,
    source,
    url: url ? url.replace(/https?:\/\//, '').split('.')[0] + '.supabase.co' : 'Não configurado',
    urlRaw: url,
  };
}

export interface SupabaseConnectionCheck {
  ok: boolean;
  dbReady: boolean;
  storageReady: boolean;
  message: string;
}

export async function testSupabaseConnection(): Promise<SupabaseConnectionCheck> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      dbReady: false,
      storageReady: false,
      message: 'Credenciais do Supabase inválidas ou não configuradas.',
    };
  }

  let dbReady = false;
  let storageReady = false;
  let errorDetail = '';

  try {
    const { error: dbError } = await client.from('products').select('id').limit(1);
    if (!dbError) {
      dbReady = true;
    } else {
      errorDetail = dbError.message;
    }
  } catch (err: any) {
    errorDetail = err?.message || 'Erro de rede ao contactar PostgreSQL';
  }

  try {
    const { error: storageError } = await client.storage.from(PRODUCT_IMAGES_BUCKET).list('', { limit: 1 });
    if (!storageError) {
      storageReady = true;
    } else if (!errorDetail) {
      errorDetail = storageError.message;
    }
  } catch (err: any) {
    if (!errorDetail) {
      errorDetail = err?.message || 'Erro ao aceder ao bucket de imagens';
    }
  }

  if (dbReady && storageReady) {
    return {
      ok: true,
      dbReady: true,
      storageReady: true,
      message: 'Ligação verificada: Base de Dados PostgreSQL e Storage (neva-products) operacionais.',
    };
  }

  if (dbReady && !storageReady) {
    return {
      ok: false,
      dbReady: true,
      storageReady: false,
      message: `Tabelas OK, mas o bucket "${PRODUCT_IMAGES_BUCKET}" precisa de ser criado no SQL Editor. (${errorDetail})`,
    };
  }

  return {
    ok: false,
    dbReady: false,
    storageReady,
    message: errorDetail || 'Executa o script supabase_schema.sql no SQL Editor do teu projeto Supabase.',
  };
}
