import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Link2,
  PlusCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  computeSplit,
  type MarketItem,
  type UserSession,
  type WearCode,
} from '../data/market';

interface SellInventoryViewProps {
  catalog: MarketItem[];
  session: UserSession;
  onUpdateSession: (patch: Partial<UserSession>) => void;
  onPublishItem: (item: MarketItem) => void;
  onNotify: (msg: string) => void;
}

const WEAR_OPTIONS: { code: WearCode; label: string; sampleFloat: number }[] = [
  { code: 'FN', label: 'Factory New', sampleFloat: 0.0241 },
  { code: 'MW', label: 'Minimal Wear', sampleFloat: 0.0984 },
  { code: 'FT', label: 'Field-Tested', sampleFloat: 0.2145 },
  { code: 'WW', label: 'Well-Worn', sampleFloat: 0.4021 },
  { code: 'BS', label: 'Battle-Scarred', sampleFloat: 0.6188 },
];

export function SellInventoryView({
  catalog,
  session,
  onUpdateSession,
  onPublishItem,
  onNotify,
}: SellInventoryViewProps) {
  const [selectedId, setSelectedId] = useState<string>(catalog[0]?.id ?? '');
  const [price, setPrice] = useState<string>(
    catalog[0] ? String(catalog[0].priceUsdc) : '185.45',
  );
  const [wearCode, setWearCode] = useState<WearCode>('FN');
  const [inspectInput, setInspectInput] = useState('');
  const [decodedFloat, setDecodedFloat] = useState<number>(0.0241);
  const [decodedSeed, setDecodedSeed] = useState<number>(521);

  const inventoryTemplates = useMemo(() => catalog.slice(0, 18), [catalog]);
  const selectedTemplate =
    inventoryTemplates.find((i) => i.id === selectedId) || inventoryTemplates[0];

  const numericPrice = Math.max(0.5, Number(price) || 0);
  const split = computeSplit(numericPrice, Boolean(session.referredByCode));

  const handleSelectTemplate = (item: MarketItem) => {
    setSelectedId(item.id);
    setPrice(item.priceUsdc.toFixed(2));
    setWearCode(item.wear === 'NONE' ? 'FN' : item.wear);
    if (item.floatValue !== undefined) setDecodedFloat(item.floatValue);
  };

  const handleDecodeInspect = () => {
    if (!inspectInput.trim().startsWith('steam://')) {
      onNotify('Pega un enlace steam://rungame/730/... válido para decodificar.');
      return;
    }
    let hash = 0;
    for (let i = 0; i < inspectInput.length; i++) {
      hash = (hash * 31 + inspectInput.charCodeAt(i)) % 100000;
    }
    const f = Number(((hash % 6500) / 100000 + 0.005).toFixed(4));
    const seed = (hash % 999) + 1;
    setDecodedFloat(f);
    setDecodedSeed(seed);
    setWearCode(f < 0.07 ? 'FN' : f < 0.15 ? 'MW' : f < 0.38 ? 'FT' : f < 0.45 ? 'WW' : 'BS');
    onNotify(`Inspect Link verificado · Float ${f.toFixed(4)} · Seed #${seed}`);
  };

  const handlePublish = () => {
    if (!selectedTemplate) return;
    if (!session.tradeUrl.includes('steamcommunity.com/tradeoffer/new')) {
      onNotify('Configura primero tu Trade URL de Steam para vender P2P.');
      return;
    }
    const wObj = WEAR_OPTIONS.find((w) => w.code === wearCode) || WEAR_OPTIONS[0];
    const newItem: MarketItem = {
      ...selectedTemplate,
      id: `user-list-${Date.now()}`,
      wear: selectedTemplate.category === 'cases' ? 'NONE' : wearCode,
      wearName: selectedTemplate.category === 'cases' ? 'Sellada · Drop Oficial' : wObj.label,
      floatValue: selectedTemplate.category === 'cases' ? undefined : decodedFloat,
      patternSeed: selectedTemplate.category === 'cases' ? undefined : decodedSeed,
      priceUsdc: Number(numericPrice.toFixed(2)),
      tradeHoldDays: session.steamGuardMobile ? 0 : 7,
      escrowDaysElapsed: session.steamGuardMobile ? 0 : 1,
      featured: true,
      inspectLink: inspectInput.trim() || selectedTemplate.inspectLink,
      seller: {
        steamName: session.steamName,
        steamLevel: session.steamLevel,
        cs2Hours: session.cs2Hours,
        accountYears: session.accountYears,
        vacClean: !session.vacBanned,
        completedTrades: 42,
        steamGuardMobile: session.steamGuardMobile,
      },
    };
    onPublishItem(newItem);
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-800 bg-[#181e29] p-5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">
          INVENTARIO PÚBLICO STEAM (APPID 730) · SIN BOTS · P2P TRADE URL
        </span>
        <h1 className="mt-1 font-cs text-2xl tracking-wider text-white sm:text-3xl">
          VENDER SKINS DESDE TU MOCHILA
        </h1>
        <p className="mt-1 max-w-2xl text-xs text-slate-400 sm:text-sm">
          Recibes el <strong className="text-emerald-400">97.0% neto</strong> directo en tu wallet
          Solana al confirmarse el intercambio P2P. En producción, este panel sincroniza tu mochila
          real desde{' '}
          <code className="text-sky-300">steamcommunity.com/inventory/{'{steamId64}'}/730/2</code>{' '}
          con caché de 5 min.
        </p>
      </div>

      {/* Steam Guard Mobile & Trade URL Config Bar */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-[#181e29] p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-xs font-bold text-white">
              <Link2 className="h-4 w-4 text-sky-400" />
              Tu Trade URL P2P de Steam
            </span>
            <span className="font-mono text-[10px] text-emerald-400">REQUERIDO PARA P2P</span>
          </div>
          <input
            type="text"
            value={session.tradeUrl}
            onChange={(e) => onUpdateSession({ tradeUrl: e.target.value })}
            className="mt-2.5 w-full rounded-lg border border-slate-700 bg-[#10151f] px-3 py-2 font-mono text-[11px] text-slate-200 outline-none focus:border-sky-400"
          />
        </div>

        {/* Steam Guard Mobile Toggle (demonstrates automatic 7-day Escrow warning from nuevo.txt) */}
        <div
          className={`rounded-2xl border p-4 transition ${
            session.steamGuardMobile
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-indigo-400/45 bg-indigo-500/10'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold text-white">
                {session.steamGuardMobile ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                )}
                Autenticador Móvil Steam Guard (&gt;7 días)
              </p>
              <p className="mt-1 text-[11px] text-slate-300">
                {session.steamGuardMobile
                  ? 'Activo >7 días: tus ventas se publican con Entrega P2P Inmediata.'
                  : 'Inactivo o <7 días: tus ventas llevarán obligatoriamente la etiqueta "EN ESPERA (ESCROW) — Demora de 7 días por seguridad".'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSession({ steamGuardMobile: !session.steamGuardMobile })}
              className={`shrink-0 rounded-lg px-3 py-1.5 font-mono text-[11px] font-bold transition ${
                session.steamGuardMobile
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-indigo-500 text-white'
              }`}
            >
              {session.steamGuardMobile ? 'ACTIVO (>7d)' : 'ESCROW 7d'}
            </button>
          </div>
        </div>
      </div>

      {/* Inventory picker + Publish form */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Mochila simulada con imágenes reales Valve */}
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-[#181e29] p-4 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Ítems Intercambiables (tradable === 1)
            </h2>
            <span className="font-mono text-[10px] text-slate-400">
              SteamID: {session.steamId64}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {inventoryTemplates.map((it) => {
              const active = selectedTemplate?.id === it.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => handleSelectTemplate(it)}
                  className={`overflow-hidden rounded-xl border text-left transition ${
                    active
                      ? 'border-emerald-400 ring-2 ring-emerald-400/25'
                      : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex h-20 items-center justify-center bg-white p-2">
                    <img src={it.image} alt={it.name} className="max-h-16 w-auto object-contain" />
                  </div>
                  <div className="bg-[#121721] p-2">
                    <p className="truncate text-[11px] font-semibold text-white">{it.name}</p>
                    <p className="font-mono text-[10px] text-emerald-400">
                      Sugerido: ${it.priceUsdc.toFixed(2)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Listing Details */}
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-[#181e29] p-5 lg:col-span-2">
          {selectedTemplate && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-20 items-center justify-center rounded-xl bg-white p-2">
                  <img
                    src={selectedTemplate.image}
                    alt={selectedTemplate.name}
                    className="max-h-12 w-auto object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{selectedTemplate.name}</p>
                  <p className="font-mono text-[11px] text-slate-400">
                    Ref. CSGOTrader: ${selectedTemplate.priceUsdc.toFixed(2)} USD
                  </p>
                </div>
              </div>

              {/* Inspect link optional decoder */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase text-slate-400">
                  Inspect Link CS2 (Opcional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inspectInput}
                    onChange={(e) => setInspectInput(e.target.value)}
                    placeholder="steam://rungame/730/..."
                    className="flex-1 rounded-lg border border-slate-700 bg-[#10151f] px-2.5 py-1.5 font-mono text-[11px] text-white outline-none focus:border-sky-400"
                  />
                  <button
                    type="button"
                    onClick={handleDecodeInspect}
                    className="rounded-lg border border-sky-500/40 bg-sky-500/15 px-3 py-1.5 text-[11px] font-bold text-sky-300 hover:bg-sky-500/25"
                  >
                    Leer
                  </button>
                </div>
              </div>

              {selectedTemplate.category !== 'cases' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-slate-400">
                      Desgaste
                    </label>
                    <select
                      value={wearCode}
                      onChange={(e) => {
                        const code = e.target.value as WearCode;
                        setWearCode(code);
                        const found = WEAR_OPTIONS.find((w) => w.code === code);
                        if (found) setDecodedFloat(found.sampleFloat);
                      }}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-[#10151f] px-2.5 py-2 text-xs text-white outline-none"
                    >
                      {WEAR_OPTIONS.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-slate-400">
                      Float / Seed
                    </label>
                    <div className="mt-1 rounded-lg border border-slate-800 bg-[#10151f] px-2.5 py-2 font-mono text-xs text-slate-300">
                      {decodedFloat.toFixed(4)} · #{decodedSeed}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="font-mono text-[10px] uppercase text-slate-400">
                  Precio de Venta (USDC)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-[#10151f] px-3 py-2 font-mono text-base font-bold text-emerald-400 outline-none focus:border-emerald-400"
                />
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#10151f] p-3 font-mono text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span>Recibes neto en Solana (97.0%)</span>
                  <span className="font-bold text-emerald-400">${split.sellerNet.toFixed(2)} USDC</span>
                </div>
                <div className="mt-1 flex justify-between text-slate-400">
                  <span>Comisión plataforma (3.0%)</span>
                  <span>${split.feeTotal.toFixed(2)} USDC</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                  {session.steamGuardMobile ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Etiqueta: Entrega P2P Inmediata</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="text-indigo-300">
                        Etiqueta automática: EN ESPERA (ESCROW) 7 días
                      </span>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handlePublish}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                <PlusCircle className="h-4 w-4" />
                Publicar en el Mercado Ahora
              </button>

              <p className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                <Sparkles className="h-3 w-3 text-emerald-400" />
                Aparecerá al instante en la pestaña DESTACADO
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
