import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import {
  computeSplit,
  type MarketItem,
  type PayCurrency,
  type UserSession,
} from '../data/market';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: MarketItem[];
  session: UserSession;
  solPriceUsd: number;
  onRemove: (id: string) => void;
  onClear: () => void;
  onConnectWallet: () => void;
  onCheckout: (currency: PayCurrency) => void;
}

export function CartDrawer({
  open,
  onClose,
  cart,
  session,
  solPriceUsd,
  onRemove,
  onClear,
  onConnectWallet,
  onCheckout,
}: CartDrawerProps) {
  const [currency, setCurrency] = useState<PayCurrency>('USDC');

  if (!open) return null;

  const grossTotal = Number(cart.reduce((acc, it) => acc + it.priceUsdc, 0).toFixed(2));
  const split = computeSplit(grossTotal, Boolean(session.referredByCode));
  const totalSol = grossTotal / Math.max(solPriceUsd, 1);
  const hasEscrowItems = cart.some((it) => it.tradeHoldDays > 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-[#141a25] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="h-5 w-5 text-emerald-400" />
            <h2 className="font-cs text-lg tracking-wider text-white">MI CARRITO</h2>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300">
              {cart.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart items */}
        <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center text-slate-400">
              <ShoppingCart className="mb-3 h-10 w-10 text-slate-600" />
              <p className="text-sm font-semibold text-slate-200">Tu carrito está vacío</p>
              <p className="mt-1 text-xs text-slate-500">
                Haz clic en &ldquo;Comprar&rdquo; en cualquier skin del catálogo real.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#19202e] p-2.5"
              >
                <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
                  <img src={item.image} alt={item.name} className="max-h-11 w-auto object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">{item.name}</p>
                  <p className="text-[11px] text-slate-400">{item.wearName}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      ${item.priceUsdc.toFixed(2)} USD
                    </span>
                    {item.tradeHoldDays > 0 && (
                      <span className="inline-flex items-center gap-1 rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-300">
                        <Clock className="h-2.5 w-2.5" />
                        Escrow 7d
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-rose-400"
                  aria-label="Quitar del carrito"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer checkout */}
        {cart.length > 0 && (
          <div className="space-y-3 border-t border-slate-800 bg-[#10151f] p-4">
            {/* Currency Switcher: USDC vs SOL */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCurrency('USDC')}
                className={`rounded-lg border py-2 text-xs font-bold transition ${
                  currency === 'USDC'
                    ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                    : 'border-slate-700 bg-[#181e29] text-slate-400 hover:text-white'
                }`}
              >
                USDC (Estable · Recomendado)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('SOL')}
                className={`rounded-lg border py-2 text-xs font-bold transition ${
                  currency === 'SOL'
                    ? 'border-violet-400 bg-violet-500/15 text-violet-300'
                    : 'border-slate-700 bg-[#181e29] text-slate-400 hover:text-white'
                }`}
              >
                SOL (~${solPriceUsd.toFixed(0)}/SOL)
              </button>
            </div>

            {hasEscrowItems && (
              <div className="rounded-lg border border-indigo-500/35 bg-indigo-500/10 p-2.5 text-[11px] text-indigo-200">
                Incluye skins con <strong>retención de seguridad de 7 días</strong>. Tu pago queda
                protegido en el Escrow Solana hasta confirmar entrega en tu inventario.
              </div>
            )}

            {/* Split summary */}
            <div className="space-y-1 rounded-lg border border-slate-800 bg-[#161c27] p-3 font-mono text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span>Vendedor recibe (97.0%)</span>
                <span className="text-emerald-400">${split.sellerNet.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Comisión total (3.0%)</span>
                <span>${split.feeTotal.toFixed(2)}</span>
              </div>
              {session.referredByCode && (
                <div className="flex justify-between text-sky-300">
                  <span>↳ 50% Referidor ({session.referredByCode})</span>
                  <span>${split.referrerPayout.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-700 pt-1.5 text-sm font-bold text-white">
                <span>TOTAL ESCROW</span>
                <span className="text-emerald-400">
                  {currency === 'USDC'
                    ? `$${grossTotal.toFixed(2)} USDC`
                    : `${totalSol.toFixed(4)} SOL`}
                </span>
              </div>
            </div>

            {/* Connected Wallet */}
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#161c27] px-3 py-2 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                {session.walletProvider}:{' '}
                <code className="text-slate-400">
                  {session.walletAddress.slice(0, 6)}…{session.walletAddress.slice(-4)}
                </code>
              </span>
              <button
                type="button"
                onClick={onConnectWallet}
                className="font-semibold text-sky-400 hover:text-sky-300"
              >
                Cambiar / Phantom
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClear}
                className="rounded-xl border border-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:border-rose-400/50 hover:text-rose-300"
              >
                Vaciar
              </button>
              <button
                type="button"
                onClick={() => onCheckout(currency)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                <ShieldCheck className="h-4 w-4" />
                Pagar y Bloquear en Escrow Solana
              </button>
            </div>

            <p className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Trade URL P2P verificada · Gas &lt; $0.001 USD
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
