import {
  CheckCircle2,
  Clock,
  Copy,
  ShieldCheck,
  ShoppingCart,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import {
  computeSplit,
  RARITY_META,
  type MarketItem,
  type UserSession,
} from '../data/market';

interface SkinModalProps {
  item: MarketItem | null;
  session: UserSession;
  onClose: () => void;
  onAddToCart: (item: MarketItem) => void;
  onBuyNow: (item: MarketItem) => void;
  onNotify: (msg: string) => void;
}

export function SkinModal({
  item,
  session,
  onClose,
  onAddToCart,
  onBuyNow,
  onNotify,
}: SkinModalProps) {
  if (!item) return null;

  const rMeta = RARITY_META[item.rarity];
  const hasReferrer = Boolean(session.referredByCode);
  const split = computeSplit(item.priceUsdc, hasReferrer);
  const savingsPct = Math.max(
    0,
    Math.round(((item.steamMarketPrice - item.priceUsdc) / Math.max(item.steamMarketPrice, 1)) * 100),
  );

  const copyInspect = async () => {
    try {
      await navigator.clipboard.writeText(item.inspectLink);
      onNotify('Inspect Link copiado al portapapeles.');
    } catch {
      onNotify('Inspect Link listo.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-5"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700/80 bg-[#151b26] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.rarityColor }}
            />
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300">
              {rMeta.label} · {item.wearName}
            </span>
            {item.statTrak && (
              <span className="rounded bg-orange-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-orange-300">
                StatTrak™
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-2">
          {/* Left: Official Valve Image + Float Bar + Inspect Link */}
          <div className="space-y-4">
            <div className="relative flex h-56 items-center justify-center rounded-xl bg-white p-5">
              <span
                className="absolute inset-x-0 bottom-0 h-1 rounded-b-xl"
                style={{ backgroundColor: item.rarityColor }}
              />
              <img
                src={item.image}
                alt={item.name}
                className="max-h-44 w-auto max-w-[90%] object-contain drop-shadow-[0_12px_18px_rgba(15,23,42,0.3)]"
              />
            </div>

            {item.floatValue !== undefined && (
              <div className="rounded-xl border border-slate-800 bg-[#10151f] p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Float Value</span>
                  <span className="font-mono font-bold text-white">
                    {item.floatValue.toFixed(6)}
                  </span>
                </div>
                <div className="relative mt-2.5 h-2.5 rounded-full float-bar-bg">
                  <span
                    className="absolute top-1/2 h-4 w-1.5 -translate-y-1/2 rounded-sm bg-white shadow"
                    style={{ left: `calc(${Math.min(98, item.floatValue * 100)}% - 3px)` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-slate-400">
                  <span>Pattern Seed #{item.patternSeed ?? 412}</span>
                  <span>
                    Rango: {(item.minFloat ?? 0).toFixed(2)} – {(item.maxFloat ?? 1).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Seller + Steam Guard status */}
            <div className="rounded-xl border border-slate-800 bg-[#10151f] p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-white">
                  <UserCheck className="h-4 w-4 text-emerald-400" />
                  {item.seller.steamName}
                </span>
                <span className="font-mono text-[10px] text-emerald-300">
                  VAC CLEAN · {item.seller.completedTrades} TRADES
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-slate-400">
                LVL {item.seller.steamLevel} · {item.seller.cs2Hours.toLocaleString()}h CS2 ·{' '}
                {item.seller.accountYears} años en Steam
              </p>
              <button
                type="button"
                onClick={copyInspect}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono text-[11px] text-slate-300 hover:border-slate-500 hover:text-white"
              >
                <Copy className="h-3.5 w-3.5" />
                Copiar Inspect Link CS2
              </button>
            </div>
          </div>

          {/* Right: Escrow 7d Banner + Solana Split + Actions */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">{item.name}</h2>
                <div className="mt-1 flex items-baseline gap-2.5">
                  <span className="font-mono text-2xl font-bold text-emerald-400">
                    ${item.priceUsdc.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC
                  </span>
                  {savingsPct > 0 && (
                    <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-300">
                      -{savingsPct}% vs Steam (${item.steamMarketPrice.toFixed(2)})
                    </span>
                  )}
                </div>
              </div>

              {/* Steam Escrow 7d vs Instant P2P Box */}
              {item.tradeHoldDays > 0 ? (
                <div className="escrow-popover rounded-xl p-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Clock className="h-4 w-4 text-sky-400" />
                    EN ESPERA (ESCROW) — Demora de 7 días por seguridad
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">
                    Este vendedor no cumple aún 7 días con Steam Guard Móvil. Tu USDC queda{' '}
                    <strong className="text-white">resguardado en el Escrow Solana</strong> durante
                    la cuenta regresiva y solo se libera cuando el{' '}
                    <code className="text-sky-300">asset_id</code> aparece en tu inventario.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <Zap className="h-4 w-4" />
                    ENTREGA P2P INMEDIATA (SIN BOTS · TRADE URL)
                  </div>
                  <p className="mt-1 text-[11px] text-slate-300">
                    Vendedor con Steam Guard Móvil activo (&gt;7 días). Recibes el Trade Offer
                    directo en minutos tras confirmar el pago en Solana (~400ms).
                  </p>
                </div>
              )}

              {/* Transparent 3-Way Solana Split (Cap. Pagos & Referidos 50%) */}
              <div className="rounded-xl border border-slate-800 bg-[#10151f] p-3.5 text-xs">
                <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Desglose Solana Escrow (Comisión 3.0% · Zero Chargebacks)
                </p>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-200">
                    <span>Pago neto al vendedor (97.0%)</span>
                    <span className="text-emerald-400">${split.sellerNet.toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Plataforma ({hasReferrer ? '1.5%' : '3.0%'})</span>
                    <span>${split.platformNet.toFixed(2)} USDC</span>
                  </div>
                  {hasReferrer && (
                    <div className="flex justify-between text-sky-300">
                      <span>Referidor vitalicio 50% ({session.referredByCode})</span>
                      <span>${split.referrerPayout.toFixed(2)} USDC</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-800 pt-1.5 text-slate-400">
                    <span>Gas red Solana</span>
                    <span>&lt; $0.001 USD</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onBuyNow(item);
                  onClose();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                <ShieldCheck className="h-4 w-4" />
                Comprar con Escrow Solana (${item.priceUsdc.toFixed(2)} USDC)
              </button>
              <button
                type="button"
                onClick={() => {
                  onAddToCart(item);
                  onClose();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#19202d] px-4 py-2.5 text-xs font-semibold text-slate-100 transition hover:border-slate-500"
              >
                <ShoppingCart className="h-4 w-4" />
                Añadir a Mi Carrito
              </button>
              <p className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Sin contracargos · Verificación on-chain en ~400ms
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
