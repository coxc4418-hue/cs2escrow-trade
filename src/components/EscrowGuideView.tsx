import {
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Gift,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

export function EscrowGuideView() {
  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-[#192235] via-[#151c29] to-[#121721] p-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/35 bg-sky-500/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-sky-300">
          <Clock className="h-3.5 w-3.5" />
          DOCUMENTACIÓN OFICIAL · SISTEMA DE SEGURIDAD VALVE + ARQUITECTURA COSTO CERO
        </span>
        <h1 className="mt-3 font-cs text-2xl tracking-wider text-white sm:text-3xl">
          ESCROW DE 7 DÍAS Y ARQUITECTURA
        </h1>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-300 sm:text-sm">
          El bloqueo de 7 días (Escrow) no es un error de la plataforma: es el &ldquo;botón de
          pánico&rdquo; obligatorio creado por Valve para impedir robos masivos de inventarios CS2.
          Aquí se detalla cómo lo integramos junto con el Escrow financiero en Solana USDC y la
          arquitectura sin costos fijos de API.
        </p>
      </div>

      {/* 3 Pillars of 7-day Escrow */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-[#181e29] p-5">
          <div className="flex items-center gap-2 text-sky-400">
            <ShieldAlert className="h-5 w-5" />
            <h2 className="font-display text-base font-bold text-white">
              1. ¿Por qué se activa el Escrow?
            </h2>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            Steam retiene un intercambio durante <strong>7 días</strong> si al menos una de las dos
            partes <strong>no ha tenido el Autenticador Móvil de Steam Guard activo durante los
            últimos 7 días consecutivos</strong>. Durante ese período de gracia, la víctima puede
            cancelar el trade si su cuenta fue hackeada.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#181e29] p-5">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="font-display text-base font-bold text-white">
              2. Requisitos para Trade Instantáneo
            </h2>
          </div>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span>Cuenta protegida con Steam Guard.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span>Autenticador Móvil oficial de Steam activo en iOS/Android.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span>Al menos 7 días continuos activo en ambas partes + inventario público.</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#181e29] p-5">
          <div className="flex items-center gap-2 text-indigo-400">
            <Lock className="h-5 w-5" />
            <h2 className="font-display text-base font-bold text-white">
              3. Protección de Fondos USDC
            </h2>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            Si aplica la demora de 7 días, el dinero permanece congelado en{' '}
            <strong>USDC (estable, sin volatilidad)</strong> dentro del Escrow Solana. Si
            cualquiera cancela el intercambio durante la espera, el comprador recibe reembolso; si se
            completa, Solana dispersa el <strong>97% / 1.5% / 1.5%</strong> automáticamente.
          </p>
        </div>
      </div>

      {/* Zero-Cost Architecture Stack */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-[#181e29] p-5">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-emerald-400" />
            <h2 className="font-display text-base font-bold text-white">
              Endpoints Públicos Costo Cero (Verificados en Vivo)
            </h2>
          </div>
          <div className="space-y-2 text-xs">
            <div className="rounded-xl border border-slate-800 bg-[#121721] p-3">
              <p className="font-bold text-emerald-400">Catálogo + PNG Oficiales Valve (ByMykel)</p>
              <p className="mt-0.5 break-all font-mono text-[10px] text-slate-400">
                GET raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json
              </p>
              <p className="mt-1 text-[11px] text-slate-300">
                2,246 skins + 485 cajas sin API Key. Imágenes PNG transparentes directo del CDN de
                Valve.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#121721] p-3">
              <p className="font-bold text-sky-400">Feed de Precios Reales (CSGOTrader)</p>
              <p className="mt-0.5 break-all font-mono text-[10px] text-slate-400">
                GET prices.csgotrader.app/latest/csfloat.json + steam.json (gzip · cron 6-12h)
              </p>
              <p className="mt-1 text-[11px] text-slate-300">
                Más de 48,000 precios cruzados por <code className="text-sky-300">market_hash_name</code>{' '}
                sin consultar el Steam Market en tiempo real.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#121721] p-3">
              <p className="font-bold text-indigo-300">
                Steam OpenID 2.0 + Inventario Público (AppID 730)
              </p>
              <p className="mt-0.5 break-all font-mono text-[10px] text-slate-400">
                GET steamcommunity.com/inventory/{'{steamId64}'}/730/2?l=english&amp;count=500
              </p>
              <p className="mt-1 text-[11px] text-slate-300">
                En Fase 2 corre vía backend con caché ≥5 min TTL en PostgreSQL/Redis para evitar{' '}
                <code>HTTP 429</code> y CORS.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-800 bg-[#181e29] p-5">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-violet-400" />
            <h2 className="font-display text-base font-bold text-white">
              Economía Solana + Referidos Vitalicio 50% + PostgreSQL
            </h2>
          </div>
          <div className="space-y-2 text-xs">
            <div className="rounded-xl border border-slate-800 bg-[#121721] p-3">
              <p className="flex items-center gap-1.5 font-bold text-white">
                <Gift className="h-3.5 w-3.5 text-emerald-400" />
                Reparto Transparente (Comisión 3.0% vs 8%–15% tradicional)
              </p>
              <ul className="mt-1.5 space-y-1 font-mono text-[11px] text-slate-300">
                <li>• 97.0% → Wallet Solana del Vendedor</li>
                <li>• 1.5% → Wallet de la Plataforma</li>
                <li>• 1.5% → Wallet del Referidor (50% vitalicio vinculado al SteamID64)</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#121721] p-3">
              <p className="flex items-center gap-1.5 font-bold text-white">
                <Database className="h-3.5 w-3.5 text-sky-400" />
                Esquema PostgreSQL Listo (database/schema.sql)
              </p>
              <p className="mt-1 text-[11px] text-slate-300">
                Tablas listas para Supabase/Neon: <code>catalog_skins</code>, <code>users</code>{' '}
                (con <code>solana_wallet</code>, <code>referral_code</code>,{' '}
                <code>referred_by_steam_id</code> y constraint anti-auto-referido),{' '}
                <code>listings</code> y <code>transactions</code> (con hashes on-chain y split 3
                vías).
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
