import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  GitFork,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { ESCROW_CUSTODY_WALLET, type EscrowOrder } from '../data/market';

interface EscrowCenterViewProps {
  orders: EscrowOrder[];
  currentUid: string;
  onSubmitPaymentHash: (orderId: string, txHash: string) => Promise<void>;
  onMarkTradeSent: (orderId: string) => Promise<void>;
  onConfirmReceipt: (orderId: string) => Promise<void>;
  onOpenDispute: (orderId: string, reason: string) => Promise<void>;
  onNotify: (msg: string) => void;
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

export function EscrowCenterView({
  orders,
  currentUid,
  onSubmitPaymentHash,
  onMarkTradeSent,
  onConfirmReceipt,
  onOpenDispute,
  onNotify,
}: EscrowCenterViewProps) {
  const [txInputs, setTxInputs] = useState<Record<string, string>>({});
  const [disputeDraftId, setDisputeDraftId] = useState<string | null>(null);
  const [disputeText, setDisputeText] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const copyCustody = async () => {
    try {
      await navigator.clipboard.writeText(ESCROW_CUSTODY_WALLET);
      onNotify('Dirección de custodia copiada.');
    } catch {
      onNotify(ESCROW_CUSTODY_WALLET);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-slate-800 bg-[#181e29] p-5">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-sky-400">
            ESCROW SOLANA USDC/SOL + RETENCIÓN STEAM 7 DÍAS
          </span>
          <h1 className="mt-1 font-cs text-2xl tracking-wider text-white sm:text-3xl">
            MIS ÓRDENES DE ESCROW
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-400 sm:text-sm">
            Aquí aparecen únicamente tus órdenes reales registradas en tu cuenta. El capital
            permanece protegido en Escrow hasta verificar el intercambio P2P y ejecutar el split 3
            vías (97% vendedor / 1.5% plataforma / 1.5% referidor).
          </p>
        </div>
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2 font-mono text-xs text-emerald-300">
          Órdenes activas: {orders.filter((o) => !['RELEASED', 'REFUNDED'].includes(o.status)).length}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#181e29] p-12 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-3 font-display text-lg font-bold text-white">
            No tienes órdenes de Escrow todavía
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Cuando compres o vendas una skin en el mercado, podrás seguir todo el proceso de pago
            Solana y entrega Steam P2P desde aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const currentIdx = stepIndex(order.status);
            const isDisputed = order.status === 'DISPUTED';
            const isRefunded = order.status === 'REFUNDED';
            const isReleased = order.status === 'RELEASED';
            const isBuyer = order.buyerUid === currentUid;
            const isSeller = order.sellerUid === currentUid;

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-[#181e29]"
              >
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

                <div className="grid gap-4 p-5 lg:grid-cols-3">
                  <div className="space-y-3 lg:col-span-2">
                    {order.status === 'CREATED' && isBuyer && (
                      <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                        <p className="font-mono text-xs font-bold text-emerald-300">
                          PASO 1 · ENVIAR {order.currency} A CUSTODIA SOLANA Y REGISTRAR FIRMA TX
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#10151f] px-3 py-2 font-mono text-[11px]">
                          <span className="truncate text-slate-300">
                            Wallet Escrow: <strong className="text-white">{ESCROW_CUSTODY_WALLET}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={copyCustody}
                            className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copiar
                          </button>
                        </div>
                        <p className="text-xs text-slate-300">
                          Una vez enviada la transferencia de{' '}
                          <strong className="text-white">
                            ${order.grossUsdc.toFixed(2)} {order.currency}
                          </strong>{' '}
                          desde Phantom/Solflare, pega aquí el <strong>Transaction Signature (Hash)</strong>{' '}
                          de Solana para verificarlo en blockchain:
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            type="text"
                            value={txInputs[order.id] || ''}
                            onChange={(e) =>
                              setTxInputs((prev) => ({ ...prev, [order.id]: e.target.value }))
                            }
                            placeholder="Pega tu firma de transacción Solana (87-88 caracteres base58)..."
                            className="flex-1 rounded-lg border border-slate-700 bg-[#10151f] px-3 py-2 font-mono text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-400"
                          />
                          <button
                            type="button"
                            disabled={busyId === order.id}
                            onClick={async () => {
                              const hash = (txInputs[order.id] || '').trim();
                              if (hash.length < 40) {
                                onNotify('Ingresa un hash de transacción Solana válido.');
                                return;
                              }
                              setBusyId(order.id);
                              try {
                                await onSubmitPaymentHash(order.id, hash);
                              } finally {
                                setBusyId(null);
                              }
                            }}
                            className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
                          >
                            Verificar Tx Solana
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
                              : 'PAGO REGISTRADO — Esperando Trade Offer P2P'}
                          </span>
                          <span className="font-mono text-[10px] text-sky-300">P2P STEAM</span>
                        </div>
                        {order.solanaTxHash && (
                          <a
                            href={`https://solscan.io/tx/${order.solanaTxHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-300 hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Ver Tx en Solscan: {order.solanaTxHash.slice(0, 18)}…
                          </a>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {isSeller && (
                            <button
                              type="button"
                              disabled={busyId === order.id}
                              onClick={async () => {
                                setBusyId(order.id);
                                try {
                                  await onMarkTradeSent(order.id);
                                } finally {
                                  setBusyId(null);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400"
                            >
                              <Send className="h-3.5 w-3.5" />
                              Marcar Trade Offer P2P Enviado
                            </button>
                          )}
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
                          TRADE OFFER P2P ENVIADO — CONFIRMAR RECEPCIÓN
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {isBuyer && (
                            <button
                              type="button"
                              disabled={busyId === order.id}
                              onClick={async () => {
                                setBusyId(order.id);
                                try {
                                  await onConfirmReceipt(order.id);
                                } finally {
                                  setBusyId(null);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Confirmar Recepción y Liberar Escrow
                            </button>
                          )}
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
                          Describe el motivo de la disputa (resolución &lt;48h)
                        </p>
                        <input
                          type="text"
                          value={disputeText}
                          onChange={(e) => setDisputeText(e.target.value)}
                          placeholder="Ej. El trade fue cancelado o el ítem no coincide..."
                          className="w-full rounded-lg border border-slate-700 bg-[#10151f] px-3 py-2 text-xs text-white outline-none focus:border-rose-400"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              await onOpenDispute(
                                order.id,
                                disputeText.trim() || 'Incidencia reportada en entrega Steam P2P.',
                              );
                              setDisputeDraftId(null);
                              setDisputeText('');
                            }}
                            className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-400"
                          >
                            Congelar Escrow y Enviar a Soporte
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

                    {/* 3-Way Split */}
                    <div className="rounded-xl border border-slate-800 bg-[#121721] p-3.5">
                      <span className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <GitFork className="h-3.5 w-3.5 text-emerald-400" />
                        Liquidación Solana (Split 3 Vías · 3% Fee)
                      </span>
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

                  {/* Audit Log */}
                  <div className="rounded-xl border border-slate-800 bg-[#121721] p-3.5">
                    <p className="mb-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Historial de Auditoría
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
