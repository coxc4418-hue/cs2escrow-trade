export type MarketCategory = 'featured' | 'rifles' | 'pistols' | 'knives' | 'gloves' | 'cases';
export type Rarity = 'gold' | 'covert' | 'classified' | 'restricted' | 'milspec';
export type WearCode = 'FN' | 'MW' | 'FT' | 'WW' | 'BS' | 'NONE';
export type PayCurrency = 'USDC' | 'SOL';

export type EscrowStatus =
  | 'CREATED'
  | 'PAID'
  | 'ESCROW_HELD'
  | 'TRADE_SENT'
  | 'RELEASED'
  | 'DISPUTED'
  | 'REFUNDED';

export interface MarketItem {
  id: string;
  marketHashName: string;
  name: string;
  weapon: string;
  skinName: string;
  category: Exclude<MarketCategory, 'featured'>;
  rarity: Rarity;
  rarityName: string;
  rarityColor: string;
  wear: WearCode;
  wearName: string;
  floatValue?: number;
  minFloat?: number;
  maxFloat?: number;
  patternSeed?: number;
  statTrak?: boolean;
  priceUsdc: number;
  steamMarketPrice: number;
  image: string;
  inspectLink: string;
  tradeHoldDays: number; // 0 = entrega instantánea P2P, 7 = retención seguridad Steam Guard
  escrowDaysElapsed?: number;
  featured?: boolean;
  isLiveListing?: boolean;
  sellerUid?: string;
  seller: {
    steamName: string;
    steamLevel: number;
    cs2Hours: number;
    accountYears: number;
    vacClean: boolean;
    completedTrades: number;
    steamGuardMobile: boolean;
  };
}

export interface AuditEntry {
  at: string;
  actor: 'SISTEMA' | 'COMPRADOR' | 'VENDEDOR' | 'SOLANA_RPC' | 'STEAM_P2P' | 'ADMIN';
  action: string;
}

export interface EscrowOrder {
  id: string;
  buyerUid: string;
  sellerUid: string;
  item: MarketItem;
  buyerName: string;
  sellerName: string;
  currency: PayCurrency;
  grossUsdc: number;
  platformFeeRate: number; // 0.03 (3.0%)
  platformFeeUsdc: number;
  platformNetUsdc: number; // 1.5% si hay referidor, 3.0% si no
  referrerCode?: string | null;
  referrerPayoutUsdc: number; // 50% de la comisión (1.5%)
  sellerNetPayoutUsdc: number; // 97.0%
  solanaRentUsdc: number;
  status: EscrowStatus;
  tradeHoldDays: number;
  createdAt: string;
  createdAtMs: number;
  solanaTxHash?: string;
  payoutTxHash?: string;
  buyerTradeUrl?: string;
  disputeReason?: string;
  disputeEvidence?: string;
  adminResolution?: string;
  logs: AuditEntry[];
}

export interface ReferralRecord {
  id: string;
  referrerUid: string;
  referredUid: string;
  steamId64: string;
  username: string;
  email?: string;
  joinedAt: string;
  tradesCount: number;
  volumeUsdc: number;
  earnedUsdc: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'user' | 'admin';
  steamId64: string;
  tradeUrl: string;
  steamGuardMobile: boolean;
  walletAddress: string;
  walletProvider: 'Phantom' | 'Solflare' | 'Manual' | null;
  walletSigned: boolean;
  balanceUsdc: number; // Inicia siempre en 0.00
  referralCode: string;
  referredByCode: string | null;
  referredByUid: string | null;
  createdAt: string;
}

export const PLATFORM_FEE_RATE = 0.03; // 3.0% (97.0% vendedor / 1.5% plataforma / 1.5% referidor)
export const REFERRER_SHARE_OF_FEE = 0.5; // 50% vitalicio

// Wallet receptora de custodia Solana (configurable por el cliente antes de operar en Mainnet)
export const ESCROW_CUSTODY_WALLET = 'PENDIENTE_WALLET_CUSTODIA_SOLANA';

export const ADMIN_EMAILS = ['levayjorge@gmail.com', 'jhinnoriega567@gmail.com'];

export const RARITY_META: Record<
  Rarity,
  { label: string; color: string; dot: string; badge: string }
> = {
  gold: {
    label: 'Extraordinario ★',
    color: '#e4ae39',
    dot: 'bg-amber-400',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-400/35',
  },
  covert: {
    label: 'Encubierto',
    color: '#eb4b4b',
    dot: 'bg-rose-500',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-400/35',
  },
  classified: {
    label: 'Clasificado',
    color: '#d32ce6',
    dot: 'bg-fuchsia-500',
    badge: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/35',
  },
  restricted: {
    label: 'Restringido',
    color: '#8847ff',
    dot: 'bg-violet-500',
    badge: 'bg-violet-500/15 text-violet-300 border-violet-400/35',
  },
  milspec: {
    label: 'Grado Militar',
    color: '#4b69ff',
    dot: 'bg-blue-500',
    badge: 'bg-blue-500/15 text-blue-300 border-blue-400/35',
  },
};

export const WEAR_DOT_COLOR: Record<WearCode, string> = {
  FN: '#34d399',
  MW: '#a3e635',
  FT: '#facc15',
  WW: '#fb923c',
  BS: '#f87171',
  NONE: '#60a5fa',
};

export function makeReferralCode(uid: string): string {
  const clean = uid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `CS2${clean.slice(0, 6)}`;
}

export function isValidSolanaAddress(addr: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr.trim());
}

export function computeSplit(grossUsdc: number, hasReferrer: boolean) {
  const feeTotal = Number((grossUsdc * PLATFORM_FEE_RATE).toFixed(2));
  const referrerPayout = hasReferrer ? Number((feeTotal * REFERRER_SHARE_OF_FEE).toFixed(2)) : 0;
  const platformNet = Number((feeTotal - referrerPayout).toFixed(2));
  const sellerNet = Number((grossUsdc - feeTotal).toFixed(2));
  return { feeTotal, referrerPayout, platformNet, sellerNet };
}
