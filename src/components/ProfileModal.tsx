import {
  CheckCircle2,
  Clock,
  LogOut,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import type { UserSession } from '../data/market';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  session: UserSession;
  authEmail?: string | null;
  authPhotoUrl?: string | null;
  onUpdateSession: (patch: Partial<UserSession>) => void;
  onConnectRealWallet: (provider: 'Phantom' | 'Solflare' | 'Demo') => void;
  onLogout: () => void;
}

export function ProfileModal({
  open,
  onClose,
  session,
  authEmail,
  authPhotoUrl,
  onUpdateSession,
  onConnectRealWallet,
  onLogout,
}: ProfileModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#151b26] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            {authPhotoUrl && (
              <img
                src={authPhotoUrl}
                alt={session.steamName}
                referrerPolicy="no-referrer"
                className="h-11 w-11 rounded-full border-2 border-emerald-400/60 object-cover"
              />
            )}
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-sky-400">
                CUENTA VERIFICADA · WALLET SOLANA · TRADE URL P2P
              </span>
              <h2 className="font-cs text-xl tracking-wider text-white">{session.steamName}</h2>
              {authEmail && <p className="font-mono text-[11px] text-slate-400">{authEmail}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Steam Status */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-[#10151f] p-3 font-mono text-[11px]">
            <div>
              <span className="text-slate-500">SteamID64</span>
              <p className="text-slate-200">{session.steamId64}</p>
            </div>
            <div>
              <span className="text-slate-500">Estado Cuenta</span>
              <p className="text-emerald-400">VAC Clean · Pública</p>
            </div>
            <div>
              <span className="text-slate-500">Horas CS2</span>
              <p className="text-slate-200">
                {session.cs2Hours.toLocaleString()}h · LVL {session.steamLevel}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Código Referido</span>
              <p className="text-emerald-300">{session.referralCode}</p>
            </div>
          </div>

          {/* Steam Guard Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#10151f] p-3">
            <div>
              <p className="flex items-center gap-1.5 font-semibold text-white">
                {session.steamGuardMobile ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Clock className="h-4 w-4 text-indigo-400" />
                )}
                Steam Guard Móvil (&gt;7 días)
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {session.steamGuardMobile
                  ? 'Intercambios P2P inmediatos habilitados.'
                  : 'Tus publicaciones mostrarán retención obligatoria de 7 días.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSession({ steamGuardMobile: !session.steamGuardMobile })}
              className={`rounded-lg px-3 py-1.5 font-mono text-[10px] font-bold ${
                session.steamGuardMobile
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-indigo-500 text-white'
              }`}
            >
              {session.steamGuardMobile ? 'ACTIVO' : 'ESCROW 7d'}
            </button>
          </div>

          {/* Trade URL */}
          <div>
            <label className="font-mono text-[10px] uppercase text-slate-400">
              Trade URL P2P de Steam
            </label>
            <input
              type="text"
              value={session.tradeUrl}
              onChange={(e) => onUpdateSession({ tradeUrl: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-[#10151f] px-3 py-2 font-mono text-[11px] text-slate-200 outline-none focus:border-sky-400"
            />
          </div>

          {/* Solana Wallet Adapter (Real Phantom/Solflare + Demo) */}
          <div className="space-y-2 rounded-xl border border-slate-800 bg-[#10151f] p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-white">
                <Wallet className="h-4 w-4 text-emerald-400" />
                Wallet Solana ({session.walletProvider})
              </span>
              {session.walletSigned && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Propiedad firmada (0 gas)
                </span>
              )}
            </div>
            <p className="truncate font-mono text-[11px] text-slate-400">{session.walletAddress}</p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onConnectRealWallet('Phantom')}
                className="rounded-lg border border-violet-500/40 bg-violet-500/15 py-2 text-[11px] font-bold text-violet-200 hover:bg-violet-500/25"
              >
                Phantom
              </button>
              <button
                type="button"
                onClick={() => onConnectRealWallet('Solflare')}
                className="rounded-lg border border-orange-500/40 bg-orange-500/15 py-2 text-[11px] font-bold text-orange-200 hover:bg-orange-500/25"
              >
                Solflare
              </button>
              <button
                type="button"
                onClick={() => onConnectRealWallet('Demo')}
                className="rounded-lg border border-slate-700 bg-slate-800 py-2 text-[11px] font-bold text-slate-200 hover:bg-slate-700"
              >
                Modo Demo
              </button>
            </div>
          </div>

          <div className="flex justify-between pt-1">
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar Sesión
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-950 hover:bg-slate-200"
            >
              Guardar y Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
