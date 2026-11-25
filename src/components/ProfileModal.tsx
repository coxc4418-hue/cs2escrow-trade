import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  LogOut,
  Save,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import { isValidSolanaAddress, type UserProfile } from '../data/market';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (patch: Partial<UserProfile>) => Promise<void>;
  onConnectWallet: (provider: 'Phantom' | 'Solflare') => Promise<void>;
  onLogout: () => void;
  onNotify: (msg: string) => void;
}

export function ProfileModal({
  open,
  onClose,
  profile,
  onSaveProfile,
  onConnectWallet,
  onLogout,
  onNotify,
}: ProfileModalProps) {
  const [steamId64, setSteamId64] = useState(profile.steamId64);
  const [tradeUrl, setTradeUrl] = useState(profile.tradeUrl);
  const [manualWallet, setManualWallet] = useState(profile.walletAddress);
  const [steamGuardMobile, setSteamGuardMobile] = useState(profile.steamGuardMobile);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSteamId64(profile.steamId64);
    setTradeUrl(profile.tradeUrl);
    setManualWallet(profile.walletAddress);
    setSteamGuardMobile(profile.steamGuardMobile);
  }, [profile, open]);

  if (!open) return null;

  const handleSave = async () => {
    const cleanSteam = steamId64.trim();
    if (cleanSteam && !/^\d{17}$/.test(cleanSteam)) {
      onNotify('El SteamID64 debe tener exactamente 17 dígitos (ej. 76561198...).');
      return;
    }
    const cleanTrade = tradeUrl.trim();
    if (cleanTrade && !cleanTrade.includes('steamcommunity.com/tradeoffer/new')) {
      onNotify('Ingresa una Trade URL válida de Steam (steamcommunity.com/tradeoffer/new/...).');
      return;
    }
    const cleanWallet = manualWallet.trim();
    if (cleanWallet && !isValidSolanaAddress(cleanWallet)) {
      onNotify('La dirección de Wallet Solana no tiene un formato base58 válido.');
      return;
    }

    setSaving(true);
    try {
      await onSaveProfile({
        steamId64: cleanSteam,
        tradeUrl: cleanTrade,
        steamGuardMobile,
        walletAddress: cleanWallet,
        walletProvider: cleanWallet ? profile.walletProvider || 'Manual' : null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-[#151b26] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            {profile.photoURL && (
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                referrerPolicy="no-referrer"
                className="h-11 w-11 rounded-full border-2 border-emerald-400/60 object-cover"
              />
            )}
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-sky-400">
                MI CUENTA · PERFIL DE OPERADOR
              </span>
              <h2 className="font-cs text-xl tracking-wider text-white">{profile.displayName}</h2>
              <p className="font-mono text-[11px] text-slate-400">{profile.email}</p>
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
          {/* Real Account Balance & Referral Code */}
          <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-slate-800 bg-[#10151f] p-3.5 font-mono">
            <div>
              <span className="text-[10px] uppercase text-slate-500">Saldo Disponible</span>
              <p className="mt-0.5 text-lg font-bold text-emerald-400">
                ${profile.balanceUsdc.toFixed(2)} USDC
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500">Tu Código Referido</span>
              <p className="mt-0.5 text-base font-bold text-sky-300">{profile.referralCode}</p>
            </div>
          </div>

          {/* SteamID64 & Trade URL */}
          <div className="space-y-3">
            <div>
              <label className="font-mono text-[10px] uppercase text-slate-400">
                SteamID64 (17 dígitos · inventario público CS2)
              </label>
              <input
                type="text"
                value={steamId64}
                onChange={(e) => setSteamId64(e.target.value)}
                placeholder="Ej. 76561198000000000"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-[#10151f] px-3 py-2 font-mono text-[11px] text-slate-100 placeholder-slate-500 outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase text-slate-400">
                Trade URL P2P de Steam (obligatorio para recibir/enviar skins)
              </label>
              <input
                type="text"
                value={tradeUrl}
                onChange={(e) => setTradeUrl(e.target.value)}
                placeholder="https://steamcommunity.com/tradeoffer/new/?partner=...&token=..."
                className="mt-1 w-full rounded-lg border border-slate-700 bg-[#10151f] px-3 py-2 font-mono text-[11px] text-slate-100 placeholder-slate-500 outline-none focus:border-sky-400"
              />
            </div>
          </div>

          {/* Steam Guard Status */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#10151f] p-3">
            <div>
              <p className="flex items-center gap-1.5 font-semibold text-white">
                {steamGuardMobile ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Clock className="h-4 w-4 text-indigo-400" />
                )}
                Autenticador Móvil Steam Guard (&gt;7 días)
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {steamGuardMobile
                  ? 'Habilitado: tus ventas podrán entregarse P2P al instante.'
                  : 'Sin activar aún: tus ventas mostrarán retención de seguridad de 7 días.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSteamGuardMobile((v) => !v)}
              className={`shrink-0 rounded-lg px-3 py-1.5 font-mono text-[10px] font-bold ${
                steamGuardMobile
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-indigo-500 text-white'
              }`}
            >
              {steamGuardMobile ? 'ACTIVO' : 'ESCROW 7d'}
            </button>
          </div>

          {/* Real Solana Wallet Connection */}
          <div className="space-y-2.5 rounded-xl border border-slate-800 bg-[#10151f] p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-white">
                <Wallet className="h-4 w-4 text-emerald-400" />
                Wallet Solana (Pagos y Cobros USDC/SOL)
              </span>
              {profile.walletSigned && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Firmada (0 gas)
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onConnectWallet('Phantom')}
                className="rounded-lg border border-violet-500/40 bg-violet-500/15 py-2 text-[11px] font-bold text-violet-200 hover:bg-violet-500/25"
              >
                Conectar Phantom
              </button>
              <button
                type="button"
                onClick={() => onConnectWallet('Solflare')}
                className="rounded-lg border border-orange-500/40 bg-orange-500/15 py-2 text-[11px] font-bold text-orange-200 hover:bg-orange-500/25"
              >
                Conectar Solflare
              </button>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase text-slate-500">
                O pega tu dirección pública Solana (para recibir 97% ventas / 50% referidos)
              </label>
              <input
                type="text"
                value={manualWallet}
                onChange={(e) => setManualWallet(e.target.value)}
                placeholder="Dirección pública Solana (32-44 caracteres)..."
                className="mt-1 w-full rounded-lg border border-slate-700 bg-[#141a25] px-3 py-2 font-mono text-[11px] text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
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
              disabled={saving}
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Guardando...' : 'Guardar Perfil'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
