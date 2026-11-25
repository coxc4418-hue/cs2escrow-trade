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
  solanaRentUsdc: number; // ~$0.001 red / $0.22 ATA primera vez
  status: EscrowStatus;
  tradeHoldDays: number;
  createdAt: string;
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
  steamId64: string;
  username: string;
  joinedAt: string;
  tradesCount: number;
  volumeUsdc: number;
  earnedUsdc: number; // 50% de las comisiones vitalicio
}

export interface UserSession {
  loggedIn: boolean;
  steamId64: string;
  steamName: string;
  steamLevel: number;
  cs2Hours: number;
  accountYears: number;
  vacBanned: boolean;
  tradeBanned: boolean;
  publicInventory: boolean;
  steamGuardMobile: boolean;
  tradeUrl: string;
  walletAddress: string;
  walletProvider: 'Demo' | 'Phantom' | 'Solflare';
  walletSigned: boolean;
  balanceUsdc: number;
  referralCode: string;
  referredByCode: string | null;
}

export const PLATFORM_FEE_RATE = 0.03; // 3.0% (97.0% vendedor / 1.5% plataforma / 1.5% referidor)
export const REFERRER_SHARE_OF_FEE = 0.5; // 50% vitalicio

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

export const DEFAULT_SESSION: UserSession = {
  loggedIn: true,
  steamId64: '76561198842019412',
  steamName: 'Operador_CS2',
  steamLevel: 58,
  cs2Hours: 2340,
  accountYears: 7,
  vacBanned: false,
  tradeBanned: false,
  publicInventory: true,
  steamGuardMobile: true,
  tradeUrl: 'https://steamcommunity.com/tradeoffer/new/?partner=842019412&token=aB9xK2mQ',
  walletAddress: '7xKq9mP3vN8wR2tL6sY1cF4hJ5bD9eG2uA8zX4nM9vP2',
  walletProvider: 'Demo',
  walletSigned: true,
  balanceUsdc: 2450.0,
  referralCode: 'CS2PRO50',
  referredByCode: 'VALKYRIE',
};

export const INITIAL_REFERRALS: ReferralRecord[] = [
  {
    id: 'ref-1',
    steamId64: '76561199104822109',
    username: 'Kuroi_AWP',
    joinedAt: 'Hace 14 días',
    tradesCount: 6,
    volumeUsdc: 1840.5,
    earnedUsdc: 27.61,
  },
  {
    id: 'ref-2',
    steamId64: '76561198339104582',
    username: 'M4A1_Tactical',
    joinedAt: 'Hace 9 días',
    tradesCount: 3,
    volumeUsdc: 920.0,
    earnedUsdc: 13.8,
  },
  {
    id: 'ref-3',
    steamId64: '76561198772011894',
    username: 'KnifeHunter_VE',
    joinedAt: 'Hace 2 días',
    tradesCount: 2,
    volumeUsdc: 1490.0,
    earnedUsdc: 22.35,
  },
];

export function computeSplit(grossUsdc: number, hasReferrer: boolean) {
  const feeTotal = Number((grossUsdc * PLATFORM_FEE_RATE).toFixed(2));
  const referrerPayout = hasReferrer ? Number((feeTotal * REFERRER_SHARE_OF_FEE).toFixed(2)) : 0;
  const platformNet = Number((feeTotal - referrerPayout).toFixed(2));
  const sellerNet = Number((grossUsdc - feeTotal).toFixed(2));
  return { feeTotal, referrerPayout, platformNet, sellerNet };
}

export function buildInitialOrders(catalog: MarketItem[]): EscrowOrder[] {
  const first = catalog.find((c) => c.tradeHoldDays === 7) || catalog[0];
  const second = catalog.find((c) => c.tradeHoldDays === 0 && c.id !== first?.id) || catalog[1];
  if (!first || !second) return [];

  const s1 = computeSplit(first.priceUsdc, true);
  const s2 = computeSplit(second.priceUsdc, true);

  return [
    {
      id: 'ESC-9041',
      item: first,
      buyerName: 'Operador_CS2',
      sellerName: first.seller.steamName,
      currency: 'USDC',
      grossUsdc: first.priceUsdc,
      platformFeeRate: PLATFORM_FEE_RATE,
      platformFeeUsdc: s1.feeTotal,
      platformNetUsdc: s1.platformNet,
      referrerCode: 'VALKYRIE',
      referrerPayoutUsdc: s1.referrerPayout,
      sellerNetPayoutUsdc: s1.sellerNet,
      solanaRentUsdc: 0.001,
      status: 'ESCROW_HELD',
      tradeHoldDays: 7,
      createdAt: 'Hace 2 días',
      solanaTxHash: '5kP9mQv3n8xR2tL6sY1cF4hJ5bD9eG2uA8zX4nM9vP2wQ3kR',
      buyerTradeUrl: DEFAULT_SESSION.tradeUrl,
      logs: [
        {
          at: '14:02:11',
          actor: 'SOLANA_RPC',
          action: `Pago verificado on-chain (${first.priceUsdc.toFixed(2)} USDC) en 420ms. Fondos bloqueados en Escrow.`,
        },
        {
          at: '14:03:05',
          actor: 'STEAM_P2P',
          action:
            'Vendedor sin Steam Guard Móvil >7 días: activada retención obligatoria de seguridad Valve (7 días). Capital resguardado en USDC.',
        },
      ],
    },
    {
      id: 'ESC-9038',
      item: second,
      buyerName: 'DeltaBuyer_LATAM',
      sellerName: second.seller.steamName,
      currency: 'USDC',
      grossUsdc: second.priceUsdc,
      platformFeeRate: PLATFORM_FEE_RATE,
      platformFeeUsdc: s2.feeTotal,
      platformNetUsdc: s2.platformNet,
      referrerCode: 'CS2PRO50',
      referrerPayoutUsdc: s2.referrerPayout,
      sellerNetPayoutUsdc: s2.sellerNet,
      solanaRentUsdc: 0.001,
      status: 'DISPUTED',
      tradeHoldDays: 0,
      createdAt: 'Hace 5h',
      solanaTxHash: '3mX7qW9rT2pL8vN4kC6hJ1fB5dE9gU2aS8yZ4nM7cR1pK9',
      buyerTradeUrl: 'https://steamcommunity.com/tradeoffer/new/?partner=711220391&token=kM8pZ1qW',
      disputeReason: 'El vendedor canceló el Trade Offer P2P antes de que el comprador aceptara.',
      disputeEvidence: 'Verificación de inventario público Steam: asset_id sigue en mochila del vendedor.',
      logs: [
        {
          at: '11:10:02',
          actor: 'SOLANA_RPC',
          action: `Depósito confirmado (${second.priceUsdc.toFixed(2)} USDC) en Wallet Escrow.`,
        },
        {
          at: '12:48:19',
          actor: 'COMPRADOR',
          action: 'Disputa abierta (<48h SLA). Fondos congelados hasta resolución del administrador.',
        },
      ],
    },
  ];
}
