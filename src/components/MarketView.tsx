import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  WEAR_DOT_COLOR,
  type MarketCategory,
  type MarketItem,
  type WearCode,
} from '../data/market';

interface MarketViewProps {
  items: MarketItem[];
  loading: boolean;
  activeCategory: MarketCategory;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectItem: (item: MarketItem) => void;
  onAddToCart: (item: MarketItem) => void;
  onGoGuide: () => void;
}

const ITEMS_PER_PAGE = 21; // 3 filas x 7 columnas en 2xl (exacto al mockup)

function EscrowClockBadgeIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10 shrink-0" fill="none">
      <defs>
        <linearGradient id="escrowGrad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="26" r="14" stroke="url(#escrowGrad)" strokeWidth="3" strokeDasharray="68 20" />
      <path d="M24 18V26L29.5 29" stroke="url(#escrowGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 8H29" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
      <path d="M35 13L38 10" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function MarketView({
  items,
  loading,
  activeCategory,
  searchQuery,
  onSearchChange,
  onSelectItem,
  onAddToCart,
  onGoGuide,
}: MarketViewProps) {
  const [wearFilter, setWearFilter] = useState<WearCode | 'ALL'>('ALL');
  const [escrowFilter, setEscrowFilter] = useState<'ALL' | 'INSTANT' | 'ESCROW_7D'>('ALL');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'float-asc'>('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [openEscrowCardId, setOpenEscrowCardId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, searchQuery, wearFilter, escrowFilter, sortBy]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = items.filter((it) => {
      if (activeCategory !== 'featured' && it.category !== activeCategory) return false;
      if (wearFilter !== 'ALL' && it.wear !== wearFilter) return false;
      if (escrowFilter === 'INSTANT' && it.tradeHoldDays > 0) return false;
      if (escrowFilter === 'ESCROW_7D' && it.tradeHoldDays === 0) return false;
      if (q) {
        const hay = `${it.name} ${it.weapon} ${it.skinName} ${it.wearName} ${it.rarityName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.priceUsdc - b.priceUsdc;
      if (sortBy === 'price-desc') return b.priceUsdc - a.priceUsdc;
      if (sortBy === 'float-asc') return (a.floatValue ?? 9) - (b.floatValue ?? 9);
      return Number(!!b.featured) - Number(!!a.featured);
    });
  }, [items, activeCategory, searchQuery, wearFilter, escrowFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  return (
    <section className="space-y-4">
      {/* Mobile search + slim live catalog strip */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative w-full md:hidden">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar M4A1-S, AWP, Karambit, Cajas..."
            className="w-full rounded-lg border border-slate-800 bg-[#0f141d] py-2 pl-3.5 pr-9 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-slate-600"
          />
          <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-emerald-300">
            <Sparkles className="h-3 w-3" />
            {filtered.length} SKINS REALES · VALVE CDN + CSGOTRADER
          </span>
          <button
            type="button"
            onClick={() => {
              const next = escrowFilter === 'ESCROW_7D' ? 'ALL' : 'ESCROW_7D';
              setEscrowFilter(next);
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
              escrowFilter === 'ESCROW_7D'
                ? 'border-indigo-400 bg-indigo-500/20 text-indigo-200'
                : 'border-slate-700/80 bg-[#181e29] text-slate-300 hover:border-indigo-400/50'
            }`}
          >
            <Clock className="h-3 w-3 text-indigo-400" />
            Escrow 7 días
          </button>
          <button
            type="button"
            onClick={() => {
              const next = escrowFilter === 'INSTANT' ? 'ALL' : 'INSTANT';
              setEscrowFilter(next);
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
              escrowFilter === 'INSTANT'
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                : 'border-slate-700/80 bg-[#181e29] text-slate-300 hover:border-emerald-400/50'
            }`}
          >
            <Zap className="h-3 w-3 text-emerald-400" />
            Entrega P2P Inmediata
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              showFilters
                ? 'border-sky-400/60 bg-sky-500/15 text-sky-200'
                : 'border-slate-800 bg-[#181e29] text-slate-300 hover:border-slate-600'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
          </button>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="appearance-none rounded-lg border border-slate-800 bg-[#181e29] py-1.5 pl-3 pr-7 text-xs font-medium text-slate-200 outline-none hover:border-slate-600"
            >
              <option value="featured">Orden: Destacado</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="float-asc">Mejor Float (0.00)</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Collapsible Filter Drawer */}
      {showFilters && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#181e29] p-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase text-slate-400">Desgaste:</span>
            {(['ALL', 'FN', 'MW', 'FT', 'WW', 'BS'] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWearFilter(w)}
                className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold transition ${
                  wearFilter === w
                    ? 'bg-white text-slate-950'
                    : 'border border-slate-700 bg-[#121721] text-slate-300 hover:border-slate-500'
                }`}
              >
                {w === 'ALL' ? 'Todos' : w}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onGoGuide}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:text-sky-300"
          >
            <Info className="h-3.5 w-3.5" />
            ¿Por qué algunas skins tienen Escrow de 7 días?
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-slate-800 bg-[#181e29]">
              <div className="h-36 bg-slate-800/60" />
              <div className="space-y-2 p-3">
                <div className="h-3.5 w-3/4 rounded bg-slate-700/70" />
                <div className="h-3 w-1/2 rounded bg-slate-800" />
                <div className="h-6 w-full rounded bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : pageItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#181e29] p-12 text-center">
          <p className="font-cs text-xl text-white">SIN RESULTADOS</p>
          <p className="mt-1 text-sm text-slate-400">
            Prueba quitando un filtro o buscando otra arma (ej. M4A1-S, AWP, Karambit).
          </p>
        </div>
      ) : (
        /* Minimalist Grid — 100% Faithful to Mockups 1 & 2 */
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {pageItems.map((item) => {
            const hasEscrow = item.tradeHoldDays > 0;
            const elapsed = item.escrowDaysElapsed ?? 2;
            const progressPct = Math.min(92, Math.max(18, Math.round((elapsed / 7) * 100)));
            const isPopoverOpen = openEscrowCardId === item.id;

            return (
              <article
                key={item.id}
                className="skin-card group relative flex flex-col rounded-xl"
                onMouseLeave={() => {
                  if (isPopoverOpen) setOpenEscrowCardId(null);
                }}
              >
                {/* Top White Showcase Canvas (exact Mockup aesthetic) with Official Valve PNG */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectItem(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSelectItem(item);
                  }}
                  className="relative flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-t-xl bg-white p-2.5 sm:h-36"
                >
                  {/* Subtle Rarity Bottom Accent Line */}
                  <span
                    className="absolute inset-x-0 bottom-0 h-[3px]"
                    style={{ backgroundColor: item.rarityColor }}
                  />

                  {/* StatTrak tag */}
                  {item.statTrak && (
                    <span className="absolute left-2 top-2 rounded bg-orange-600/95 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white shadow">
                      ST™
                    </span>
                  )}

                  {/* Escrow 7-Day Interactive Badge (triggers Mockup 2 Popover) */}
                  {hasEscrow && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenEscrowCardId(isPopoverOpen ? null : item.id);
                      }}
                      onMouseEnter={() => setOpenEscrowCardId(item.id)}
                      className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-md border border-indigo-500/40 bg-[#151d2e]/92 px-1.5 py-0.5 text-[9px] font-bold text-indigo-200 shadow-md transition hover:border-sky-400 hover:bg-[#1a243a]"
                      title="Ver detalle de Escrow 7 días"
                    >
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
                      <span>7d</span>
                    </button>
                  )}

                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="skin-img max-h-24 w-auto max-w-[92%] object-contain drop-shadow-[0_6px_10px_rgba(15,23,42,0.28)] sm:max-h-28"
                  />
                </div>

                {/* Floating Escrow 7-Day Popover (Exact Match to Mockup 2) */}
                {hasEscrow && isPopoverOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="escrow-popover absolute left-1/2 top-[68%] z-30 w-[265px] -translate-x-1/2 rounded-xl p-3.5 text-left sm:w-[285px]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
                          <span className="font-display text-xs font-bold tracking-wide text-white">
                            EN ESPERA (ESCROW)
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-300">
                          Demora de 7 días por seguridad
                        </p>
                      </div>
                      <EscrowClockBadgeIcon />
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2.5">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-400"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between font-mono text-[9px] text-slate-400">
                        <span>Día {elapsed} de 7</span>
                        <span>Capital seguro en USDC</span>
                      </div>
                    </div>

                    <p className="mt-2 text-[10px] leading-relaxed text-slate-300">
                      Protección de Steam activada. Esta skin estará disponible al completar los{' '}
                      <strong className="text-white">7 días de retención</strong>. Esta medida
                      previene el fraude por robo de cuentas.
                    </p>
                  </div>
                )}

                {/* Bottom Dark Minimalist Info Panel (exact Mockup typography & colors) */}
                <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-3">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectItem(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSelectItem(item);
                    }}
                    className="cursor-pointer"
                  >
                    <h3 className="truncate text-xs font-semibold text-slate-100 sm:text-[13px]">
                      {item.name}
                    </h3>
                    <div className="mt-0.5 flex items-center justify-between gap-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5 truncate">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: WEAR_DOT_COLOR[item.wear] }}
                        />
                        <span className="truncate">{item.wearName}</span>
                      </span>
                      {item.floatValue !== undefined && (
                        <span className="font-mono text-[10px] text-slate-500">
                          {item.floatValue.toFixed(3)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price in Green + Compact Comprar button */}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 sm:text-[13px]">
                      ${item.priceUsdc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                      <span className="text-[10px] font-semibold text-emerald-500/90">USD</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onAddToCart(item)}
                      className="rounded-md border border-slate-600/80 bg-[#121721] px-2.5 py-1 text-[11px] font-semibold text-slate-100 transition hover:border-emerald-400 hover:bg-emerald-500 hover:text-slate-950"
                    >
                      Comprar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Minimalist Footer Pagination (Exact match to Mockups 1 & 2) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="hidden items-center gap-1.5 text-[11px] text-slate-500 sm:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Escrow Solana USDC · Comisión 3% · 50% vitalicio a referidos</span>
        </div>

        <div className="mx-auto flex items-center gap-3 text-xs text-slate-400 sm:mx-0">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition hover:bg-slate-800 hover:text-white disabled:opacity-35"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Page
          </button>
          <span className="font-mono text-xs text-slate-200">
            {safePage} <span className="text-slate-500">of</span> {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => {
              setPage((p) => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition hover:bg-slate-800 hover:text-white disabled:opacity-35"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
