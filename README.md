# CS2 MARKET — CS2Escrow.trade (Producción P2P & Escrow CS2)

Mercado minimalista P2P de skins, cuchillos, guantes y cajas de **Counter-Strike 2** bajo **Arquitectura Costo Cero**, con **Firebase Auth (Google + Correo/Clave)**, **Cloud Firestore en tiempo real**, imágenes PNG oficiales de Valve, precios reales de mercado, sistema de **Escrow de 7 días**, pagos directos en **Solana (USDC / SOL)** y **Sistema de Referidos Vitalicio (50% Revenue Share)**.

- **Aplicación en producción:** https://cs2escrow-trade.web.app

---

## Características en Producción

- **Autenticación Obligatoria (Firebase Auth):**
  - Pantalla de acceso exclusiva (Google Sign-In + Correo y Contraseña + Registro + Recuperación de clave).
  - Toda cuenta nueva se crea automáticamente en **Cloud Firestore** con **$0.00 USDC de saldo**, **0 referidos** y **0 órdenes** (sin datos ficticios).
- **Interfaz Minimalista CS2:**
  - Grilla limpia con tarjetas fondo blanco/oscuro, paginación y tipografía oficial Counter-Strike (`public/fonts/cs_regular.ttf`).
- **Catálogo y Precios Reales (Sin API Key · Costo $0):**
  - Imágenes PNG transparentes oficiales del CDN de Valve vía **ByMykel CSGO-API**.
  - Precios reales cruzados vía **CSGOTrader** (`csfloat.json` + `steam.json`) mediante `scripts/sync_catalog.py`.
- **Escrow de 7 Días (Seguridad Valve):**
  - Popover flotante `"EN ESPERA (ESCROW) — Demora de 7 días por seguridad"` con barra de progreso y guía de Steam Guard Móvil.
  - Perfil real con configuración de **SteamID64**, **Trade URL P2P** y estado de **Steam Guard Móvil**.
- **Pagos Directos Solana (USDC / SOL) + Split 3 Vías:**
  - Comisión transparente del **3.0%**: **97.0%** vendedor / **1.5%** plataforma / **1.5%** referidor.
  - Conexión de **Phantom** / **Solflare** (firma `signMessage` sin gas) o dirección pública Solana manual + verificación de firma Tx contra Solana Mainnet RPC.
- **Sistema de Referidos Vitalicio (50%):**
  - Captura real de `?ref=CODIGO`, validación contra Firestore (`referral_codes`), bloqueo anti-auto-referidos y vinculación permanente en `referrals`.
- **Publicaciones y Órdenes en Tiempo Real (Firestore + `firestore.rules`):**
  - Publicaciones de vendedores en `listings`, órdenes de Escrow en `orders` y panel Admin restringido a administradores autorizados.
- **Esquema PostgreSQL (Fase 2 / Backend Dedicado):**
  - Incluido en `database/schema.sql` listo para Supabase / Neon.

---

## Desarrollo Local

```bash
npm install
python scripts/sync_catalog.py   # Actualiza catálogo y precios reales
npm run dev
npm run build
```
