import { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Gift,
  Lock,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { ReferralRecord, UserProfile } from '../data/market';

interface ReferralsViewProps {
  profile: UserProfile;
  referrals: ReferralRecord[];
  onNotify: (msg: string) => void;
}

export function ReferralsView({ profile, referrals, onNotify }: ReferralsViewProps) {
  const [monthlyVolume, setMonthlyVolume] = useState(5000);

  const referralUrl = `${window.location.origin}/?ref=${profile.referralCode}`;
  const totalEarned = referrals.reduce((sum, r) => sum + r.earnedUsdc, 0);
  const totalVolume = referrals.reduce((sum, r) => sum + r.volumeUsdc, 0);

  const projectedMonthly = monthlyVolume * 0.015;
  const projectedYearly = projectedMonthly * 12;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      onNotify('Tu enlace de referido vitalicio (50%) fue copiado.');
    } catch {
      onNotify(referralUrl);
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-[#16222c] via-[#151c27] to-[#121721] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              <Gift className="h-3.5 w-3.5" />
              LIFETIME ATTRIBUTION · 50% REVENUE SHARE EN SOLANA
            </span>
            <h1 className="mt-3 font-cs text-2xl tracking-wider text-white sm:text-3xl">
              REFERIDOS VITALICIO 50%
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">
              Comparte tu enlace personal. Cada usuario nuevo que se registre con tu enlace queda
              vinculado a tu cuenta <strong className="text-white">de por vida</strong> y recibirás
              automáticamente el{' '}
              <strong className="text-emerald-400">50% de nuestra comisión (1.5%)</strong> en cada
              operación que realice en la plataforma.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:min-w-[260px]">
            <div className="rounded-xl border border-slate-800 bg-[#10151f] p-3.5">
              <p className="text-[10px] uppercase text-slate-400">Ganado Vitalicio</p>
              <p className="mt-1 font-mono text-xl font-bold text-emerald-400">
                ${totalEarned.toFixed(2)}
              </p>
              <p className="font-mono text-[10px] text-slate-500">USDC acumulado</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#10151f] p-3.5">
              <p className="text-[10px] uppercase text-slate-400">Referidos Reales</p>
              <p className="mt-1 font-mono text-xl font-bold text-white">{referrals.length}</p>
              <p className="font-mono text-[10px] text-slate-500">
                Vol: ${totalVolume.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <div className="flex flex-1 items-center justify-between rounded-xl border border-slate-700 bg-[#0f141d] px-3.5 py-2.5 font-mono text-xs text-emerald-300">
            <span className="truncate">{referralUrl}</span>
            <span className="ml-2 shrink-0 rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">
              50% FEE
            </span>
          </div>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            <Copy className="h-4 w-4" />
            Copiar Mi Enlace
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-sky-400" />
            Atribución permanente guardada en base de datos
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Protección anti-auto-referidos activa
          </span>
          {profile.referredByCode && (
            <span className="inline-flex items-center gap-1.5 text-sky-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Invitado por código: <strong>{profile.referredByCode}</strong>
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-[#181e29] p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h2 className="font-display text-base font-bold text-white">
              Calculadora de Comisiones
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Estima tus ingresos en Solana USDC según el volumen mensual que muevan tus invitados
            (comisión 3.0% × 50% tuyo = 1.5% neto).
          </p>

          <div>
            <div className="flex justify-between font-mono text-xs">
              <span className="text-slate-400">Volumen mensual referidos</span>
              <span className="font-bold text-white">${monthlyVolume.toLocaleString()} USDC</span>
            </div>
            <input
              type="range"
              min={500}
              max={50000}
              step={500}
              value={monthlyVolume}
              onChange={(e) => setMonthlyVolume(Number(e.target.value))}
              className="mt-2 w-full accent-emerald-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3">
              <p className="text-[10px] text-slate-300">Ingreso Mensual</p>
              <p className="font-mono text-lg font-bold text-emerald-400">
                ${projectedMonthly.toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl border border-sky-500/25 bg-sky-500/10 p-3">
              <p className="text-[10px] text-slate-300">Proyección Anual</p>
              <p className="font-mono text-lg font-bold text-sky-300">
                ${projectedYearly.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#181e29] p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-400" />
              <h2 className="font-display text-base font-bold text-white">
                Jugadores Vinculados a Tu Cuenta
              </h2>
            </div>
            <span className="font-mono text-[10px] text-slate-400">EN TIEMPO REAL</span>
          </div>

          {referrals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-[#121721] p-10 text-center">
              <Users className="mx-auto h-9 w-9 text-slate-600" />
              <p className="mt-2 text-sm font-semibold text-slate-200">
                Aún no tienes referidos registrados (0)
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Comparte tu enlace <code className="text-emerald-300">/?ref={profile.referralCode}</code>.
                Cuando alguien cree su cuenta con tu enlace, aparecerá aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 font-mono text-[10px] uppercase text-slate-400">
                    <th className="py-2 pr-3">Usuario</th>
                    <th className="py-2 pr-3">Registro</th>
                    <th className="py-2 pr-3">Trades</th>
                    <th className="py-2 pr-3">Volumen</th>
                    <th className="py-2 text-right">Tu 50% (USDC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {referrals.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 pr-3">
                        <p className="font-semibold text-white">{r.username}</p>
                        <p className="font-mono text-[10px] text-slate-500">
                          {r.steamId64 || 'SteamID pendiente'}
                        </p>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-400">{r.joinedAt}</td>
                      <td className="py-2.5 pr-3 font-mono text-slate-200">{r.tradesCount}</td>
                      <td className="py-2.5 pr-3 font-mono text-slate-300">
                        ${r.volumeUsdc.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                        +${r.earnedUsdc.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
