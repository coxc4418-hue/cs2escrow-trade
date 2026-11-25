-- ============================================================================
-- CS2 MARKET / CS2ESCROW.TRADE — Esquema PostgreSQL Producción (Costo Cero)
-- Compatible con Supabase / Neon PostgreSQL + Prisma / Drizzle
-- ============================================================================

-- 1. Catálogo base sincronizado desde ByMykel CSGO-API + CSGOTrader Prices
CREATE TABLE IF NOT EXISTS catalog_skins (
    id VARCHAR(64) PRIMARY KEY,
    market_hash_name VARCHAR(255) UNIQUE NOT NULL,
    weapon_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- rifles, pistols, knives, gloves, cases
    rarity_name VARCHAR(50) NOT NULL,
    rarity_color VARCHAR(7) NOT NULL,
    image_url TEXT NOT NULL,
    suggested_price_usd DECIMAL(10, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Usuarios autenticados vía Steam OpenID 2.0 + Wallet Solana + Referidos Vitalicio (50%)
CREATE TABLE IF NOT EXISTS users (
    steam_id VARCHAR(17) PRIMARY KEY,
    username VARCHAR(100),
    avatar_url TEXT,
    trade_url TEXT, -- Enlace de intercambio P2P del usuario
    steam_guard_mobile_verified BOOLEAN DEFAULT FALSE,
    solana_wallet VARCHAR(44) UNIQUE,
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    referred_by_steam_id VARCHAR(17) REFERENCES users(steam_id),
    referral_locked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_no_self_referral CHECK (referred_by_steam_id IS NULL OR referred_by_steam_id <> steam_id)
);

-- 3. Publicaciones activas en el mercado minimalista
CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id VARCHAR(64) UNIQUE NOT NULL,
    seller_steam_id VARCHAR(17) REFERENCES users(steam_id) NOT NULL,
    catalog_skin_id VARCHAR(64) REFERENCES catalog_skins(id),
    market_hash_name VARCHAR(255) NOT NULL,
    wear_condition VARCHAR(50), -- Factory New, Minimal Wear, Field-Tested, etc.
    float_value DECIMAL(8, 6),
    pattern_seed INTEGER,
    price_usd DECIMAL(10, 2) NOT NULL CHECK (price_usd > 0),
    inspect_link TEXT,
    escrow_hold_days SMALLINT NOT NULL DEFAULT 0, -- 0 = inmediato P2P, 7 = retención Steam Guard
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, RESERVED, SOLD, CANCELLED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Registro inmutable de transacciones Solana (USDC/SOL) y Split 3 vías (97% / 1.5% / 1.5%)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) NOT NULL,
    buyer_steam_id VARCHAR(17) REFERENCES users(steam_id) NOT NULL,
    seller_steam_id VARCHAR(17) REFERENCES users(steam_id) NOT NULL,
    solana_tx_signature VARCHAR(88) UNIQUE NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USDC', -- USDC o SOL
    gross_amount DECIMAL(12, 6) NOT NULL,
    platform_fee_total DECIMAL(12, 6) NOT NULL, -- 2.5% - 3.0%
    referrer_steam_id VARCHAR(17) REFERENCES users(steam_id),
    referrer_payout DECIMAL(12, 6) DEFAULT 0.000000, -- 50% de platform_fee_total (vitalicio)
    seller_net_payout DECIMAL(12, 6) NOT NULL, -- 97.0% - 97.5%
    payout_tx_signature VARCHAR(88),
    status VARCHAR(20) NOT NULL DEFAULT 'ESCROW_HELD', -- ESCROW_HELD, RELEASED, DISPUTED, REFUNDED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    released_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_listings_category_status ON listings(status, market_hash_name);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by_steam_id);
CREATE INDEX IF NOT EXISTS idx_tx_referrer ON transactions(referrer_steam_id, status);
