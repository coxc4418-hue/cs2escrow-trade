import {
  BookOpen,
  Gift,
  PlusCircle,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Store,
  User,
  Wallet,
} from 'lucide-react';
import type { MarketCategory, UserProfile } from '../data/market';

export type AppView = 'market' | 'sell' | 'escrow' | 'referrals' | 'guide' | 'admin';

interface NavbarProps {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  activeCategory: MarketCategory;
  onSelectCategory: (cat: MarketCategory) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  profile: UserProfile;
  isAdmin: boolean;
  onOpenProfile: () => void;
  activeEscrowCount: number;
  openDisputeCount: number;
}

const CATEGORIES: { id: MarketCategory; label: string }[] = [
  { id: 'featured', label: 'DESTACADO' },
  { id: 'rifles', label: 'RIFLES' },
  { id: 'pistols', label: 'PISTOLAS' },
  { id: 'knives', label: 'CUCHILLOS' },
  { id: 'gloves', label: 'GUANTES' },
  { id: 'cases', label: 'CAJAS' },
];

export function Navbar({
  activeView,
  onChangeView,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  cartCount,
  onOpenCart,
  profile,
  isAdmin,
  onOpenProfile,
  activeEscrowCount,
  openDisputeCount,
}: NavbarProps) {
  const mobileNav: {
    id: AppView;
    label: string;
    icon: typeof Store;
    badge?: number;
    badgeClass?: string;
  }[] = [
    { id: 'market', label: 'Mercado', icon: Store },
    { id: 'sell', label: 'Vender', icon: PlusCircle },
    {
      id: 'escrow',
      label: 'Escrow',
      icon: ShieldCheck,
      badge: activeEscrowCount,
      badgeClass: 'bg-sky-500 text-slate-950',
    },
    { id: 'referrals', label: '50% Ref', icon: Gift },
    { id: 'guide', label: '7d Info', icon: BookOpen },
  ];

  const hasWallet = Boolean(profile.walletAddress);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-[#161c27]/95 backdrop-blur-xl">
        {/* Main Minimalist Header Row */}
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-3.5 py-2.5 sm:px-5 lg:px-7">
          {/* Left: CS2 MARKET Logo + Authenticated User Chip */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => {
                onChangeView('market');
                onSelectCategory('featured');
              }}
              className="group flex items-center gap-2 text-left"
            >
              <span className="font-cs text-lg tracking-wider text-slate-100 transition group-hover:text-emerald-400 sm:text-xl">
                CS2 MARKET
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-[#1e2636] px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:bg-[#253044]"
              title={profile.email ? `Cuenta: ${profile.email}` : 'Mi Perfil'}
            >
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  referrerPolicy="no-referrer"
                  className="h-5 w-5 rounded-full border border-emerald-400/60 object-cover"
                />
              ) : (
                <User className="h-3.5 w-3.5 text-sky-400" />
              )}
              <span className="hidden max-w-[125px] truncate sm:inline">{profile.displayName}</span>
              <span className="rounded bg-slate-900/90 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                ${profile.balanceUsdc.toFixed(2)}
              </span>
            </button>
          </div>

          {/* Center: Minimalist Category Tabs (Desktop) */}
          <nav className="hidden items-center gap-1 lg:flex">
            {CATEGORIES.map((cat) => {
              const isActive = activeView === 'market' && activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onChangeView('market');
                    onSelectCategory(cat.id);
                  }}
                  className={`relative px-3.5 py-2 text-xs font-semibold tracking-wider transition ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                  {isActive && (
                    <span className="absolute inset-x-2.5 -bottom-[11px] h-[2px] rounded-full bg-white" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Compact Search + Mi Carrito */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative hidden w-44 md:block xl:w-56">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  if (activeView !== 'market') onChangeView('market');
                }}
                placeholder="Buscar skin..."
                className="w-full rounded-lg border border-slate-800 bg-[#0f141d] py-1.5 pl-3 pr-8 text-xs text-slate-100 placeholder-slate-500 outline-none transition focus:border-slate-600"
              />
              <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            </div>

            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex items-center gap-2 rounded-lg border border-slate-700/70 bg-[#1a2230] px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-emerald-400/50 hover:text-white sm:px-3"
            >
              <ShoppingCart className="h-4 w-4 text-slate-300" />
              <span className="hidden sm:inline">Mi Carrito</span>
              {cartCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 font-mono text-[10px] font-bold text-slate-950">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Secondary Slim Utility Bar */}
        <div className="border-t border-slate-800/70 bg-[#121721]/95">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 px-3.5 py-1.5 sm:px-5 lg:px-7">
            <div className="hidden items-center gap-1 md:flex">
              <button
                type="button"
                onClick={() => onChangeView('market')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeView === 'market'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Store className="h-3.5 w-3.5" />
                Mercado
              </button>
              <button
                type="button"
                onClick={() => onChangeView('sell')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeView === 'sell'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Vender Skin
              </button>
              <button
                type="button"
                onClick={() => onChangeView('escrow')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeView === 'escrow'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
                Mis Escrows
                {activeEscrowCount > 0 && (
                  <span className="rounded-full bg-sky-500/20 px-1.5 font-mono text-[10px] text-sky-300">
                    {activeEscrowCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => onChangeView('referrals')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeView === 'referrals'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'text-emerald-400/80 hover:bg-emerald-500/10 hover:text-emerald-300'
                }`}
              >
                <Gift className="h-3.5 w-3.5" />
                Referidos 50%
              </button>
              <button
                type="button"
                onClick={() => onChangeView('guide')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeView === 'guide'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                Escrow 7 Días
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onChangeView('admin')}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                    activeView === 'admin'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                  Admin
                  {openDisputeCount > 0 && (
                    <span className="rounded-full bg-rose-500 px-1.5 font-mono text-[10px] text-white">
                      {openDisputeCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Mobile horizontal categories */}
            <div className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto lg:hidden">
              {CATEGORIES.map((cat) => {
                const isActive = activeView === 'market' && activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onChangeView('market');
                      onSelectCategory(cat.id);
                    }}
                    className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wider transition ${
                      isActive
                        ? 'bg-white text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Solana Wallet Status Pill */}
            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={onOpenProfile}
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] transition ${
                  hasWallet
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400/60'
                    : 'border-amber-500/35 bg-amber-500/10 text-amber-300 hover:border-amber-400/60'
                }`}
              >
                <Wallet className="h-3.5 w-3.5" />
                {hasWallet ? (
                  <span>
                    {profile.walletProvider || 'Solana'}: {profile.walletAddress.slice(0, 4)}…
                    {profile.walletAddress.slice(-4)}
                  </span>
                ) : (
                  <span>Conectar Wallet Solana</span>
                )}
                <span className="text-slate-500">|</span>
                <span className="font-bold text-white">${profile.balanceUsdc.toFixed(2)} USDC</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Native Bottom Navigation Bar */}
      <nav
        aria-label="Navegación móvil"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-[#121721]/95 backdrop-blur-xl md:hidden"
      >
        <div className="grid grid-cols-5 px-1 pb-[env(safe-area-inset-bottom)]">
          {mobileNav.map((tab) => {
            const Icon = tab.icon;
            const active = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeView(tab.id)}
                className={`relative flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold transition ${
                  active ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {active && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-full bg-emerald-400" />
                )}
                <span className="relative">
                  <Icon className="h-4 w-4" />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold ${tab.badgeClass}`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
