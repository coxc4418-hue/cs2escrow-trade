import { useState } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import type { EscrowOrder } from '../data/market';

interface AdminPanelViewProps {
  orders: EscrowOrder[];
  onResolveDispute: (orderId: string, decision: 'RELEASE' | 'REFUND') => void;
}

export function AdminPanelView({ orders, onResolveDispute }: AdminPanelViewProps) {
  const [confirmKey, setConfirmKey] = useState<string | null>(null);

  const disputed = orders.filter((o) => o.status === 'DISPUTED');
  const totalVolume = orders.reduce((acc, o) => acc + o.grossUsdc, 0);
  const totalRefFees = orders.reduce((acc, o) => acc + o.referrerPayoutUsdc, 0);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-rose-500/25 bg-[#181e29] p-5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-rose-400">
          PANEL ADMIN · RESOLUCIÓN &lt;48H + DOBLE CONFIRMACIÓN + LOG INMUTABLE
        </span>
        <h1 className="mt-1 font-cs text-2xl tracking-wider text-white sm:text-3xl">
          CONSOLA DE DISPUTAS Y AUDITORÍA
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Cada decisión sobre fondos retenidos exige doble confirmación y queda registrada en el
          log inmutable con trazabilidad on-chain de Solana.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-[#121721] p-3">
            <p className="text-[10px] uppercase text-slate-400">Volumen Escrows</p>
            <p className="font-mono text-lg font-bold text-white">${totalVolume.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#121721] p-3">
            <p className="text-[10px] uppercase text-slate-400">Disputas Abiertas</p>
            <p className="font-mono text-lg font-bold text-rose-400">{disputed.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#121721] p-3">
            <p className="text-[10px] uppercase text-slate-400">Reparto Referidos 50%</p>
            <p className="font-mono text-lg font-bold text-sky-300">${totalRefFees.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#121721] p-3">
            <p className="text-[10px] uppercase text-slate-400">SLA Objetivo</p>
            <p className="font-mono text-lg font-bold text-emerald-400">&lt; 48h</p>
          </div>
        </div>
      </div>

      {disputed.length === 0 ? (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-8 text-center">
          <ShieldCheck className="mx-auto h-9 w-9 text-emerald-400" />
          <p className="mt-2 font-display text-lg font-bold text-white">
            Sin disputas pendientes
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Todas las órdenes están al día. Puedes abrir una disputa desde la pestaña Escrows para
            probar la doble confirmación.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputed.map((order) => {
            const releaseKey = `${order.id}-RELEASE`;
            const refundKey = `${order.id}-REFUND`;
            return (
              <div
                key={order.id}
                className="rounded-2xl border border-rose-500/35 bg-[#181e29] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-white p-1">
                      <img
                        src={order.item.image}
                        alt={order.item.name}
                        className="max-h-10 w-auto object-contain"
                      />
                    </div>
                    <div>
                      <p className="flex items-center gap-2 text-sm font-bold text-white">
                        <ShieldAlert className="h-4 w-4 text-rose-400" />
                        {order.id} · {order.item.name}
                      </p>
                      <p className="font-mono text-[11px] text-slate-400">
                        Comprador: {order.buyerName} · Vendedor: {order.sellerName} · $
                        {order.grossUsdc.toFixed(2)} USDC
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-rose-500/20 px-3 py-1 font-mono text-[10px] font-bold text-rose-300">
                    FONDOS CONGELADOS
                  </span>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-[#121721] p-3 text-xs">
                    <p className="font-mono text-[10px] uppercase text-rose-300">Motivo</p>
                    <p className="mt-1 text-slate-200">{order.disputeReason}</p>
                    {order.disputeEvidence && (
                      <>
                        <p className="mt-2 font-mono text-[10px] uppercase text-sky-300">
                          Evidencia Automática Steam
                        </p>
                        <p className="mt-0.5 text-slate-300">{order.disputeEvidence}</p>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-800 bg-[#121721] p-3">
                    <p className="font-mono text-[10px] uppercase text-slate-400">
                      Acción de Resolución (Doble Confirmación Obligatoria)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {confirmKey === releaseKey ? (
                        <button
                          type="button"
                          onClick={() => {
                            onResolveDispute(order.id, 'RELEASE');
                            setConfirmKey(null);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          CONFIRMAR SPLIT 3 VÍAS (${order.sellerNetPayoutUsdc.toFixed(2)} vendedor)
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmKey(releaseKey)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Liberar al Vendedor (97%)
                        </button>
                      )}

                      {confirmKey === refundKey ? (
                        <button
                          type="button"
                          onClick={() => {
                            onResolveDispute(order.id, 'REFUND');
                            setConfirmKey(null);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-bold text-slate-950"
                        >
                          <RotateCcw className="h-4 w-4" />
                          CONFIRMAR REEMBOLSO (${order.grossUsdc.toFixed(2)} comprador)
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmKey(refundKey)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reembolsar al Comprador
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
