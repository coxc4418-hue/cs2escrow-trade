import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  GitFork,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { EscrowOrder } from '../data/market';

interface EscrowCenterViewProps {
  orders: EscrowOrder[];
  onSimulatePay: (orderId: string) => void;
  onSimulateTradeSent: (orderId: string) => void;
  onConfirmRelease: (orderId: string) => void;
  onOpenDispute: (orderId: string, reason: string) => void;
}

const STEPS = [
  { key: 'CREATED', label: '1. Creada' },
  { key: 'PAID', label: '2. Pago Solana' },
  { key: 'ESCROW_HELD', label: '3. Retención / P2P' },
  { key: 'TRADE_SENT', label: '4. Trade Enviado' },
  { key: 'RELEASED', label: '5. Split 3 Vías' },
] as const;

function stepIndex(status: EscrowOrder['status']): number {
  if (status === 'CREATED') return 0;
  if (status === 'PAID') return 1;
  if (status === 'ESCROW_HELD') return 2;
  if (status === 'TRADE_SENT') return 3;
  if (status === 'RELEASED') return 4;
  return 2;
}

function SolanaQrSvg({ seed }: { seed: string }) {
  const cells: boolean[] = [];
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let r = 0; r < 11; r++) {
    for (let c = 0; c < 11; c++) {
      const finder =
        (r < 3 && c < 3) || (r < 3 && c >= 8) || (r >= 8 && c < 3);
      if (finder) {
        cells.push(true);
      } else {
        h ^= (r * 31 + c * 17) & 0xff;
        h = Math.imul(h, 16777619);
        cells.push((h & 1) === 1);
      }
    }
  }
  return (
    <svg viewBox="0 0 110 110" className="h-28 w-28 rounded-lg bg-white p-2">
      {cells.map((on, idx) =>
        on ? (
          <rect
            key={idx}
            x={(idx % 11) * 10}
            y={Math.floor(idx / 11) * 10}
            width="9"
            height="9"
            rx="1.5"
            fill="#0f172a"
          />
        ) : null,
      )}
    </svg>
  );
}

export function EscrowCenterView({
  orders,
  onSimulatePay,
  onSimulateTradeSent,
  onConfirmRelease,
  onOpenDispute,
}: EscrowCenterViewProps) {
  const [disputeDraftId, setDisputeDraftId] = useState<string | null>(null);
  const [disputeText, setDisputeText] = useState('');

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-slate-800 bg-[#181e29] p-5">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-sky-400">
            DOBLE ESCROW · SOLANA USDC + RETENCIÓN STEAM 7 DÍAS
          </span>
          <h1 className="mt-1 font-cs text-2xl tracking-wider text-white sm:text-3xl">
            CENTRO DE ESCROWS P2P
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-400 sm:text-sm">
            El dinero nunca llega al vendedor hasta verificar on-chain y en el inventario público de
            Steam que el <code className="text-sky-300">asset_id</code> cambió de dueño. Al
            liberarse, Solana ejecuta el split atómico 3 vías (97% vendedor / 1.5% plataforma /
            1.5% referidor).
          </p>
        </div>
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2 font-mono text-xs text-emerald-300">
          Confirmación Solana: ~400ms · Gas &lt; $0.001
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#181e29] p-10 text-center text-sm text-slate-400">
          No hay operaciones en Escrow aún. Compra cualquier skin en el catálogo para probar el
          flujo completo.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const currentIdx = stepIndex(order.status);
            const isDisputed = order.status === 'DISPUTED';
            const isRefunded = order.status === 'REFUNDED';
            const isReleased = order.status === 'RELEASED';

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-[#181e29]"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-[#141a24] px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-white p-1">
                      <img
                        src={order.item.image}
                        alt={order.item.name}
                        className="max-h-10 w-auto object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {order.id}
                        </span>
                        <h3 className="text-sm font-bold text-white">{order.item.name}</h3>
                        {order.tradeHoldDays > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-400/40 bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-200">
                            <Clock className="h-3 w-3" />
                            Escrow Steam 7 días
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                        Comprador: <strong className="text-slate-200">{order.buyerName}</strong> ·
                        Vendedor: <strong className="text-slate-200">{order.sellerName}</strong> ·{' '}
                        {order.createdAt}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-base font-bold text-emerald-400">
                      ${order.grossUsdc.toFixed(2)} {order.currency}
                    </p>
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                        isReleased
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : isDisputed
                            ? 'bg-rose-500/20 text-rose-300'
                            : isRefunded
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-sky-500/20 text-sky-300'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Pipeline */}
                <div className="grid grid-cols-5 gap-1.5 border-b border-slate-800/80 bg-[#121721] px-4 py-3">
                  {STEPS.map((st, idx) => {
                    const done = !isDisputed && !isRefunded && idx <= currentIdx;
                    return (
                      <div key={st.key} className="space-y-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            isDisputed && idx === 2
                              ? 'bg-rose-500'
                              : done
                                ? 'bg-emerald-400'
                                : 'bg-slate-800'
                          }`}
                        />
                        <p
                          className={`truncate font-mono text-[9px] sm:text-[10px] ${
                            done ? 'font-bold text-slate-200' : 'text-slate-500'
                          }`}
                        >
                          {st.label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Body */}
                <div className="grid gap-4 p-5 lg:grid-cols-3">
                  {/* Column 1: Action / QR / Atomic 3-way Split */}
                  <div className="space-y-3 lg:col-span-2">
                    {order.status === 'CREATED' && (
                      <div className="flex flex-col gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:flex-row sm:items-center">
                        <SolanaQrSvg seed={order.id + order.item.id} />
                        <div className="flex-1 space-y-2">
                          <p className="font-mono text-xs font-bold text-emerald-300">
                            SOLANA PAY · BLOQUEO EN ESCROW (~400ms)
                          </p>
                          <p className="text-xs text-slate-300">
                            Escanea con Phantom/Solflare o simula la confirmación on-chain vía RPC
                            (<code className="text-sky-300">getTransaction confirmed</code>) para
                            reservar la skin en PostgreSQL.
                          </p>
                          <button
                            type="button"
                            onClick={() => onSimulatePay(order.id)}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                          >
                            <Sparkles className="h-4 w-4" />
                            Confirmar Pago Solana (${order.grossUsdc.toFixed(2)} {order.currency})
                          </button>
                        </div>
                      </div>
                    )}

                    {(order.status === 'PAID' || order.status === 'ESCROW_HELD') && (
                      <div className="space-y-3 rounded-xl border border-indigo-500/35 bg-indigo-500/10 p-4">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-xs font-bold text-white">
                            <Clock className="h-4 w-4 text-sky-400" />
                            {order.tradeHoldDays > 0
                              ? 'EN ESPERA (ESCROW) — Retención de 7 días activa'
                              : 'PAGO CONFIRMADO — Esperando Trade Offer P2P'}
                          </span>
                          <span className="font-mono text-[10px] text-sky-300">SIN BOTS</span>
                        </div>
                        <p className="text-xs text-slate-300">
                          El vendedor envía la oferta directa a tu{' '}
                          <strong className="text-white">Trade URL P2P</strong>. Los fondos USDC
                          siguen bloqueados hasta confirmar que el ítem llegó a tu mochila pública
                          de Steam.
                        </p>
                        {order.solanaTxHash && (
                          <p className="truncate font-mono text-[10px] text-slate-400">
                            Tx Depósito Solana:{' '}
                            <span className="text-emerald-300">{order.solanaTxHash}</span>
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onSimulateTradeSent(order.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Simular Envío de Trade Offer P2P
                          </button>
                          <button
                            type="button"
                            onClick={() => setDisputeDraftId(order.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Abrir Disputa (&lt;48h)
                          </button>
                        </div>
                      </div>
                    )}

                    {order.status === 'TRADE_SENT' && (
                      <div className="space-y-3 rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-4">
                        <p className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                          <ShieldCheck className="h-4 w-4" />
                          TRADE OFFER P2P ENVIADO — VERIFICAR INVENTARIO Y LIBERAR
                        </p>
                        <p className="text-xs text-slate-300">
                          Al confirmar recepción (o cuando el verificador detecta el{' '}
                          <code className="text-sky-300">asset_id</code> en el inventario del
                          comprador), Solana ejecuta la <strong>dispersión atómica en 3 vías</strong>
                          :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onConfirmRelease(order.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Confirmar Recepción y Ejecutar Split 3 Vías
                          </button>
                          <button
                            type="button"
                            onClick={() => setDisputeDraftId(order.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Reportar Problema
                          </button>
                        </div>
                      </div>
                    )}

                    {disputeDraftId === order.id && (
                      <div className="space-y-2 rounded-xl border border-rose-500/40 bg-rose-950/20 p-3.5">
                        <p className="text-xs font-bold text-rose-300">
                          Motivo de disputa (resolución garantizada &lt;48h en Panel Admin)
                        </p>
                        <input
                          type="text"
                          value={disputeText}
                          onChange={(e) => setDisputeText(e.target.value)}
                          placeholder="Ej. El vendedor canceló el trade durante el periodo de 7 días..."
                          className="w-full rounded-lg border border-slate-700 bg-[#10151f] px-3 py-2 text-xs text-white outline-none focus:border-rose-400"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onOpenDispute(
                                order.id,
                                disputeText.trim() ||
                                  'Trade cancelado / ítem no detectado en inventario público.',
                              );
                              setDisputeDraftId(null);
                              setDisputeText('');
                            }}
                            className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-400"
                          >
                            Congelar Escrow y Enviar a Admin
                          </button>
                          <button
                            type="button"
                            onClick={() => setDisputeDraftId(null)}
                            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Atomic 3-Way Split Breakdown */}
                    <div className="rounded-xl border border-slate-800 bg-[#121721] p-3.5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <GitFork className="h-3.5 w-3.5 text-emerald-400" />
                          Liquidación Atómica Solana (Split 3 Vías)
                        </span>
                        {order.payoutTxHash && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400">
                            <ExternalLink className="h-3 w-3" />
                            Tx: {order.payoutTxHash.slice(0, 12)}…
                          </span>
                        )}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                          <p className="text-[10px] text-slate-400">Vendedor (97.0%)</p>
                          <p className="font-mono text-sm font-bold text-emerald-400">
                            ${order.sellerNetPayoutUsdc.toFixed(2)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-700/70 bg-slate-900/60 p-2.5">
                          <p className="text-[10px] text-slate-400">
                            Plataforma ({order.referrerPayoutUsdc > 0 ? '1.5%' : '3.0%'})
                          </p>
                          <p className="font-mono text-sm font-bold text-slate-200">
                            ${order.platformNetUsdc.toFixed(2)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-sky-500/25 bg-sky-500/5 p-2.5">
                          <p className="text-[10px] text-slate-400">
                            Referidor 50% ({order.referrerCode || 'Sin ref'})
                          </p>
                          <p className="font-mono text-sm font-bold text-sky-300">
                            ${order.referrerPayoutUsdc.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Immutable Audit Log */}
                  <div className="rounded-xl border border-slate-800 bg-[#121721] p-3.5">
                    <p className="mb-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Log de Auditoría Inmutable
                    </p>
                    <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                      {order.logs.map((entry, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-slate-800/90 bg-[#181e29] p-2 text-[11px]"
                        >
                          <div className="flex items-center justify-between font-mono text-[9px] text-slate-400">
                            <span className="font-bold text-sky-400">{entry.actor}</span>
                            <span>{entry.at}</span>
                          </div>
                          <p className="mt-0.5 text-slate-300">{entry.action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
