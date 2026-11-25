# CS2 MARKET — CS2Escrow.trade (MVP P2P & Escrow CS2)

Mercado minimalista P2P de skins, cuchillos, guantes y cajas de **Counter-Strike 2** bajo **Arquitectura Costo Cero**, con imágenes PNG oficiales de Valve, precios reales de mercado, sistema de **Escrow de 7 días**, pagos directos en **Solana (USDC / SOL)** y **Sistema de Referidos Vitalicio (50% Revenue Share)**.

- **Demo en vivo:** https://cs2escrow-trade.web.app

---

## Características Implementadas

- **Interfaz Minimalista CS2:** Grilla limpia con tarjetas fondo blanco/oscuro, paginación y tipografía oficial Counter-Strike (`public/fonts/cs_regular.ttf`) en logo y encabezados.
- **Catálogo y Precios Reales (Sin API Key · Costo $0):**
  - Imágenes PNG transparentes oficiales del CDN de Valve vía **ByMykel CSGO-API**.
  - Precios reales cruzados vía **CSGOTrader** (`csfloat.json` + `steam.json`).
  - Script de sincronización incluido: `scripts/sync_catalog.py`.
- **Escrow de 7 Días (Seguridad Valve):**
  - Popover flotante `"EN ESPERA (ESCROW) — Demora de 7 días por seguridad"` con barra de progreso y guía de Steam Guard Móvil.
  - Detección de estado Steam Guard en el flujo de vendedor con Trade URL P2P (sin bots custodios).
- **Pagos Directos Solana (USDC / SOL) + Split 3 Vías:**
  - Comisión transparente del **3.0%**: **97.0%** vendedor / **1.5%** plataforma / **1.5%** referidor (o **3.0%** plataforma sin referidor).
  - Soporte para **Phantom** y **Solflare** (con firma `signMessage` 0 gas) + Modo Demo.
- **Sistema de Referidos Vitalicio (50%):**
  - Captura automática de `?ref=CODIGO`, atribución permanente al `SteamID64`, bloqueo anti-auto-referidos y calculadora de comisiones.
- **Centro de Escrows & Panel Admin `<48h`:**
  - Máquina de estados (`CREATED → PAID → ESCROW_HELD → TRADE_SENT → RELEASED / DISPUTED / REFUNDED`), doble confirmación en disputas y log inmutable.
- **Esquema PostgreSQL de Producción:**
  - Incluido en `database/schema.sql` listo para Supabase / Neon (`catalog_skins`, `users`, `listings`, `transactions`).

---

## Stack Tecnológico

- **Frontend:** React 18 + TypeScript + Vite 6 + Tailwind CSS 3 + Lucide Icons
- **Ingesta de Datos:** Python 3 (`scripts/sync_catalog.py`)
- **Base de Datos (Fase 2):** PostgreSQL (`database/schema.sql`)
- **Hosting Demo:** Firebase Hosting

---

## Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. (Opcional) Actualizar catálogo y precios reales desde ByMykel + CSGOTrader
python scripts/sync_catalog.py

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Compilar para producción
npm run build
```

---

## Hoja de Ruta — Fase 2 (Producción Real)

1. Desplegar `database/schema.sql` en **Supabase / Neon** y programar cron cada 6–12h para precios.
2. Implementar backend Node.js / Next.js API con rutas **Steam OpenID 2.0** (`/auth/steam`, `/auth/steam/callback`) sobre dominio propio.
3. Crear endpoint `/api/me/inventory` con caché ≥ 5 min TTL para lectura de inventarios públicos (`AppID 730`) sin CORS ni `HTTP 429`.
4. Conectar verificación on-chain y dispersión atómica 3 vías en **Solana Mainnet** (RPC Helius/QuickNode + Smart Contract Anchor o servicio custodio aislado) y **Cloudflare Turnstile**.
