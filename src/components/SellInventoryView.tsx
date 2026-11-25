import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Link2,
  PlusCircle,
  Search,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import {
  computeSplit,
  type MarketItem,
  type UserProfile,
  type WearCode,
} from '../data/market';

interface SellInventoryViewProps {
  catalog: MarketItem[];
  profile: UserProfile;
  onOpenProfile: () => void;
  onPublishItem: (item: MarketItem) => Promise<void>;
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
  profile,
  onOpenProfile,
  onPublishItem,
  onNotify,
}: SellInventoryViewProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(catalog[0]?.id ?? '');
  const [price, setPrice] = useState<string>(
    catalog[0] ? String(catalog[0].priceUsdc) : '50.00',
  );
  const [wearCode, setWearCode] = useState<WearCode>('FN');
  const [inspectInput, setInspectInput] = useState('');
  const [floatInput, setFloatInput] = useState('0.0241');
  const [seedInput, setSeedInput] = useState('521');
  const [publishing, setPublishing] = useState(false);

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = catalog.filter((c) => !c.isLiveListing);
    if (!q) return list.slice(0, 18);
    return list
      .filter((c) => `${c.name} ${c.weapon} ${c.skinName}`.toLowerCase().includes(q))
      .slice(0, 18);
  }, [catalog, search]);

  const selectedTemplate =
    catalog.find((i) => i.id === selectedId) || filteredTemplates[0] || catalog[0];

  const numericPrice = Math.max(0.5, Number(price) || 0);
  const split = computeSplit(numericPrice, Boolean(profile.referredByCode));
  const missingSetup = !profile.tradeUrl || !profile.walletAddress;

  const handleSelectTemplate = (item: MarketItem) => {
    setSelectedId(item.id);
    setPrice(item.priceUsdc.toFixed(2));
    setWearCode(item.wear === 'NONE' ? 'FN' : item.wear);
    if (item.floatValue !== undefined) setFloatInput(item.floatValue.toFixed(4));
  };

  const handlePublish = async () => {
    if (!selectedTemplate) return;
    if (!profile.tradeUrl.includes('steamcommunity.com/tradeoffer/new')) {
      onNotify('Configura primero tu Trade URL P2P de Steam en tu Perfil.');
      onOpenProfile();
      return;
    }
    if (!profile.walletAddress) {
      onNotify('Vincula primero tu Wallet Solana en tu Perfil para recibir el 97% de tus ventas.');
      onOpenProfile();
      return;
    }
    if (numericPrice < 0.5) {
      onNotify('El precio mínimo de publicación es $0.50 USDC.');
      return;
    }

    const wObj = WEAR_OPTIONS.find((w) => w.code === wearCode) || WEAR_OPTIONS[0];
    const parsedFloat = Math.min(0.9999, Math.max(0.0001, Number(floatInput) || 0.0241));
    const parsedSeed = Math.max(0, Math.min(1000, Number(seedInput) || 0));

    const newItem: MarketItem = {
      ...selectedTemplate,
      id: `listing-${Date.now()}`,
      wear: selectedTemplate.category === 'cases' ? 'NONE' : wearCode,
      wearName: selectedTemplate.category === 'cases' ? 'Sellada · Drop Oficial' : wObj.label,
      floatValue: selectedTemplate.category === 'cases' ? undefined : parsedFloat,
      patternSeed: selectedTemplate.category === 'cases' ? undefined : parsedSeed,
      priceUsdc: Number(numericPrice.toFixed(2)),
      tradeHoldDays: profile.steamGuardMobile ? 0 : 7,
      escrowDaysElapsed: profile.steamGuardMobile ? 0 : 1,
      featured: true,
      isLiveListing: true,
      sellerUid: profile.uid,
      inspectLink: inspectInput.trim() || selectedTemplate.inspectLink,
      seller: {
        steamName: profile.displayName,
        steamLevel: 0,
        cs2Hours: 0,
        accountYears: 0,
        vacClean: true,
        completedTrades: 0,
        steamGuardMobile: profile.steamGuardMobile,
      },
    };

    setPublishing(true);
    try {
      await onPublishItem(newItem);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-800 bg-[#181e29] p-5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">
          PUBLICACIÓN P2P REAL · 97.0% NETO EN SOLANA USDC
        </span>
        <h1 className="mt-1 font-cs text-2xl tracking-wider text-white sm:text-3xl">
          PUBLICAR SKIN EN EL MERCADO
        </h1>
        <p className="mt-1 max-w-2xl text-xs text-slate-400 sm:text-sm">
          Tus publicaciones se guardan en tiempo real para todos los compradores del mercado.
          Comisión transparente del 3.0% — recibes el <strong className="text-emerald-400">97.0%</strong>{' '}
          directo a tu wallet Solana al confirmarse el intercambio P2P.
        </p>
      </div>

      {/* Setup Requirements Banner */}
      {missingSetup ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <p className="font-bold text-white">Completa tu perfil de vendedor antes de publicar</p>
              <p className="mt-0.5 text-amber-200/90">
                Falta configurar:{' '}
                {!profile.tradeUrl && <strong>Trade URL P2P de Steam</strong>}
                {!profile.tradeUrl && !profile.walletAddress && ' y '}
                {!profile.walletAddress && <strong>Wallet Solana</strong>}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenProfile}
            className="rounded-lg bg-amber-400 px-3.5 py-2 font-bold text-slate-950 hover:bg-amber-300"
          >
            Configurar Perfil
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-[#181e29] p-3.5 text-xs">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-slate-400">
              <Link2 className="h-3.5 w-3.5 text-sky-400" />
              Trade URL P2P
            </span>
            <p className="mt-1 truncate font-mono text-[11px] text-emerald-300">
              Configurada ✓
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#181e29] p-3.5 text-xs">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-slate-400">
              <Wallet className="h-3.5 w-3.5 text-emerald-400" />
              Wallet Solana
            </span>
            <p className="mt-1 truncate font-mono text-[11px] text-slate-200">
              {profile.walletAddress.slice(0, 8)}…{profile.walletAddress.slice(-6)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#181e29] p-3.5 text-xs">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-slate-400">
              {profile.steamGuardMobile ? (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Clock className="h-3.5 w-3.5 text-indigo-400" />
              )}
              Steam Guard Móvil
            </span>
            <p className="mt-1 font-mono text-[11px] text-slate-200">
              {profile.steamGuardMobile ? 'Entrega P2P Inmediata' : 'Etiqueta Escrow 7 días'}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Catalog Selector */}
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-[#181e29] p-4 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Selecciona la Skin de CS2 a Publicar
            </h2>
            <div className="relative w-full sm:w-56">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar arma o skin..."
                className="w-full rounded-lg border border-slate-700 bg-[#10151f] py-1.5 pl-3 pr-8 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-400"
              />
              <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {filteredTemplates.map((it) => {
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
                      Ref: ${it.priceUsdc.toFixed(2)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Listing Form */}
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
                    Precio mercado: ${selectedTemplate.priceUsdc.toFixed(2)} USD
                  </p>
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase text-slate-400">
                  Inspect Link CS2 (steam://rungame/730/...)
                </label>
                <input
                  type="text"
                  value={inspectInput}
                  onChange={(e) => setInspectInput(e.target.value)}
                  placeholder="steam://rungame/730/..."
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-[#10151f] px-3 py-2 font-mono text-[11px] text-white outline-none focus:border-sky-400"
                />
              </div>

              {selectedTemplate.category !== 'cases' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-slate-400">
                      Desgaste
                    </label>
                    <select
                      value={wearCode}
                      onChange={(e) => setWearCode(e.target.value as WearCode)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-[#10151f] px-2 py-2 text-xs text-white outline-none"
                    >
                      {WEAR_OPTIONS.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-slate-400">Float</label>
                    <input
                      type="text"
                      value={floatInput}
                      onChange={(e) => setFloatInput(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-[#10151f] px-2.5 py-2 font-mono text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-slate-400">Seed</label>
                    <input
                      type="text"
                      value={seedInput}
                      onChange={(e) => setSeedInput(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-[#10151f] px-2.5 py-2 font-mono text-xs text-white outline-none"
                    />
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
                  <span className="font-bold text-emerald-400">
                    ${split.sellerNet.toFixed(2)} USDC
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-slate-400">
                  <span>Comisión plataforma (3.0%)</span>
                  <span>${split.feeTotal.toFixed(2)} USDC</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                  {profile.steamGuardMobile ? (
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
                disabled={publishing}
                onClick={handlePublish}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
              >
                <PlusCircle className="h-4 w-4" />
                {publishing ? 'Publicando...' : 'Publicar en el Mercado'}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
