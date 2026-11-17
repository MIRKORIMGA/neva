import { Category, Product } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 't-shirts',
    name: 'T-Shirts',
    label: 'T-Shirts',
    image: '/images/cat_tshirt.png',
    itemCount: 0,
    description: 'Camisetas oversized e minimalistas com caimento streetwear premium.',
  },
  {
    id: 'tenis',
    name: 'Ténis',
    label: 'Tenis',
    image: '/images/cat_sneakers.png',
    itemCount: 0,
    description: 'Sneakers urbanos e modelos clássicos para compor o teu visual.',
  },
  {
    id: 'casacos',
    name: 'Casacos',
    label: 'Casacos',
    image: '/images/cat_hoodies.png',
    itemCount: 0,
    description: 'Hoodies, corta-ventos e casacos pesados com acabamentos exclusivos.',
  },
  {
    id: 'chapeus',
    name: 'Chapéus',
    label: 'Chapeus',
    image: '/images/cat_caps.png',
    itemCount: 0,
    description: 'Bonés estruturados aba curva e bucket hats com bordados NEVA.',
  },
];

export const INITIAL_PRODUCTS: Product[] = [];

export const ANGOLA_PROVINCES: Record<string, string[]> = {
  Luanda: [
    'Luanda (Central)',
    'Talatona',
    'Kilamba Kiaxi',
    'Belas',
    'Viana',
    'Cazenga',
    'Cacuaco',
    'Icolo e Bengo',
    'Quiçama',
  ],
  Benguela: ['Benguela', 'Lobito', 'Catumbela', 'Baía Farta', 'Cubal'],
  Huíla: ['Lubango', 'Chibia', 'Humpata', 'Matala', 'Quilengues'],
  Huambo: ['Huambo', 'Caála', 'Bailundo', 'Longonjo'],
  Cabinda: ['Cabinda', 'Cacongo', 'Buco-Zau', 'Belize'],
  'Cuanza Sul': ['Sumbe', 'Porto Amboim', 'Gabela', 'Waku Kungo'],
  Namibe: ['Moçâmedes', 'Tômbwa', 'Bibala'],
  Uíge: ['Uíge', 'Negage', 'Songo'],
  Malanje: ['Malanje', 'Calandula', 'Cangandala'],
  Zaire: ['Mbanza Kongo', 'Soyo', 'Nzeto'],
};

export const BANKING_INFO = {
  bankName: 'Transferência Bancária',
  accountHolder: 'NEVA',
  accountNumber: '',
  iban: '',
  multicaixaExpressPhone: '936 842 307',
  whatsappSupport: '962 716 161',
  whatsappLink: 'https://wa.me/244962716161',
  instagram: '@_neva7161',
  instagramLink: 'https://instagram.com/_neva7161',
  tiktok: '@neva7161',
  tiktokLink: 'https://www.tiktok.com/@neva7161',
  email: '',
  location: 'Online',
  address: 'Online · Entrega Rápida',
};

export function formatKz(amount: number): string {
  const formatted = new Intl.NumberFormat('pt-AO', {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted.replace(/\s/g, '.')} Kz`;
}
