import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import {
  buildInitialOrders,
  computeSplit,
  DEFAULT_SESSION,
  INITIAL_REFERRALS,
  PLATFORM_FEE_RATE,
  type EscrowOrder,
  type MarketCategory,
  type MarketItem,
  type PayCurrency,
  type ReferralRecord,
  type UserSession,
} from './data/market';
import { AuthGate } from './components/AuthGate';
import { Navbar, type AppView } from './components/Navbar';
import { MarketView } from './components/MarketView';
import { SkinModal } from './components/SkinModal';
import { CartDrawer } from './components/CartDrawer';
import { EscrowCenterView } from './components/EscrowCenterView';
import { ReferralsView } from './components/ReferralsView';
import { SellInventoryView } from './components/SellInventoryView';
import { EscrowGuideView } from './components/EscrowGuideView';
import { AdminPanelView } from './components/AdminPanelView';
import { ProfileModal } from './components/ProfileModal';

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      signMessage?: (msg: Uint8Array, display?: string) => Promise<{ signature: Uint8Array }>;
    };
    solflare?: {
      isSolflare?: boolean;
      connect: () => Promise<void>;
      publicKey?: { toString: () => string };
    };
  }
}

function nowTime() {
  return new Date().toLocaleTimeString('es-VE', { hour12: false });
}

function randomHash(len = 48) {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function App() {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [urlRefCode, setUrlRefCode] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<AppView>('market');
  const [activeCategory, setActiveCategory] = useState<MarketCategory>('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [catalog, setCatalog] = useState<MarketItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [solPriceUsd, setSolPriceUsd] = useState<number>(185);

  const [session, setSession] = useState<UserSession>(() => {
    try {
      const saved = localStorage.getItem('cs2market.session.v2');
      return saved ? JSON.parse(saved) : DEFAULT_SESSION;
    } catch {
      return DEFAULT_SESSION;
    }
  });

  const [cart, setCart] = useState<MarketItem[]>(() => {
    try {
      const saved = localStorage.getItem('cs2market.cart.v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<EscrowOrder[]>(() => {
    try {
      const saved = localStorage.getItem('cs2market.orders.v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [referrals, setReferrals] = useState<ReferralRecord[]>(() => {
    try {
      const saved = localStorage.getItem('cs2market.referrals.v2');
      return saved ? JSON.parse(saved) : INITIAL_REFERRALS;
    } catch {
      return INITIAL_REFERRALS;
    }
  });

  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  // Listen to Firebase Auth state (blocks app until authenticated)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setAuthUser(fbUser);
      setAuthReady(true);
      if (fbUser) {
        const name =
          fbUser.displayName?.trim() ||
          fbUser.email?.split('@')[0] ||
          DEFAULT_SESSION.steamName;
        setSession((prev) => ({
          ...prev,
          loggedIn: true,
          steamName: name,
        }));
      }
    });
    return () => unsub();
  }, []);

  // Capture ?ref=CODIGO_AFILIADO for lifetime attribution (with anti self-referral check)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref')?.trim().toUpperCase();
    if (refParam && refParam.length >= 3) {
      setUrlRefCode(refParam);
      setSession((prev) => {
        if (refParam === prev.referralCode.toUpperCase()) {
          notify('Bloqueo anti-auto-referido: no puedes vincularte con tu propio código.');
          return prev;
        }
        if (prev.referredByCode !== refParam) {
          return { ...prev, referredByCode: refParam };
        }
        return prev;
      });
    }
  }, []);

  // Load real Valve/ByMykel + CSGOTrader catalog.json + user-published items
  useEffect(() => {
    let alive = true;
    fetch('/catalog.json')
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        const baseItems: MarketItem[] = Array.isArray(data?.items) ? data.items : [];
        let userItems: MarketItem[] = [];
        try {
          const savedUser = localStorage.getItem('cs2market.user_listings.v2');
          userItems = savedUser ? JSON.parse(savedUser) : [];
        } catch {
          userItems = [];
        }
        const merged = [...userItems, ...baseItems];
        setCatalog(merged);
        setOrders((prev) => (prev.length > 0 ? prev : buildInitialOrders(merged)));
        setLoadingCatalog(false);
      })
      .catch(() => {
        if (alive) setLoadingCatalog(false);
      });

    fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
      .then((r) => r.json())
      .then((d) => {
        const p = Number(d?.solana?.usd);
        if (alive && p > 10) setSolPriceUsd(p);
      })
      .catch(() => {
        // silent fallback
      });

    return () => {
      alive = false;
    };
  }, []);

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem('cs2market.session.v2', JSON.stringify(session));
    } catch {
      // ignore
    }
  }, [session]);

  useEffect(() => {
    try {
      localStorage.setItem('cs2market.cart.v2', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      if (orders.length > 0) {
        localStorage.setItem('cs2market.orders.v2', JSON.stringify(orders));
      }
    } catch {
      // ignore
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('cs2market.referrals.v2', JSON.stringify(referrals));
    } catch {
      // ignore
    }
  }, [referrals]);

  // Splash while checking Firebase session
  if (!authReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0c1018] text-slate-200">
        <Loader2 className="h-9 w-9 animate-spin text-emerald-400" />
        <p className="mt-3 font-cs text-lg tracking-widest text-white">CS2 MARKET</p>
        <p className="mt-1 font-mono text-[11px] text-slate-400">Verificando sesión segura...</p>
      </div>
    );
  }

  // Gate: require real Firebase Login / Register (Google or Email/Password) before accessing system
  if (!authUser) {
    return <AuthGate referralCodeFromUrl={urlRefCode} />;
  }

  const handleChangeView = (view: AppView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateSession = (patch: Partial<UserSession>) => {
    setSession((prev) => ({ ...prev, ...patch }));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setProfileOpen(false);
    } catch {
      notify('No se pudo cerrar sesión.');
    }
  };

  const handleConnectRealWallet = async (provider: 'Phantom' | 'Solflare' | 'Demo') => {
    if (provider === 'Demo') {
      handleUpdateSession({
        walletProvider: 'Demo',
        walletAddress: DEFAULT_SESSION.walletAddress,
        walletSigned: true,
      });
      notify('Wallet Solana en Modo Demo activa.');
      return;
    }

    try {
      if (provider === 'Phantom' && window.solana?.isPhantom) {
        const resp = await window.solana.connect();
        const addr = resp.publicKey.toString();
        let signed = false;
        if (window.solana.signMessage) {
          const encoded = new TextEncoder().encode(
            `CS2 MARKET — Verificación de propiedad de wallet sin gas (${session.steamId64})`,
          );
          await window.solana.signMessage(encoded, 'utf8');
          signed = true;
        }
        handleUpdateSession({ walletProvider: 'Phantom', walletAddress: addr, walletSigned: signed });
        notify(`Phantom conectado: ${addr.slice(0, 6)}…${addr.slice(-4)}`);
        return;
      }

      if (provider === 'Solflare' && window.solflare?.isSolflare) {
        await window.solflare.connect();
        const addr = window.solflare.publicKey?.toString();
        if (addr) {
          handleUpdateSession({ walletProvider: 'Solflare', walletAddress: addr, walletSigned: true });
          notify(`Solflare conectado: ${addr.slice(0, 6)}…${addr.slice(-4)}`);
          return;
        }
      }

      notify(
        `No se detectó la extensión ${provider} en este navegador. Manteniendo Modo Demo listo.`,
      );
    } catch {
      notify(`Conexión con ${provider} cancelada por el usuario.`);
    }
  };

  const handleAddToCart = (item: MarketItem) => {
    setCart((prev) => {
      if (prev.some((x) => x.id === item.id)) {
        notify(`${item.name} ya está en tu carrito.`);
        return prev;
      }
      notify(`Añadido al carrito: ${item.name} ($${item.priceUsdc.toFixed(2)} USD)`);
      return [...prev, item];
    });
  };

  const createEscrowOrders = (itemsToBuy: MarketItem[], currency: PayCurrency) => {
    const created: EscrowOrder[] = itemsToBuy.map((item, idx) => {
      const hasRef = Boolean(session.referredByCode);
      const split = computeSplit(item.priceUsdc, hasRef);
      return {
        id: `ESC-${Math.floor(1000 + Math.random() * 9000) + idx}`,
        item,
        buyerName: session.steamName,
        sellerName: item.seller.steamName,
        currency,
        grossUsdc: item.priceUsdc,
        platformFeeRate: PLATFORM_FEE_RATE,
        platformFeeUsdc: split.feeTotal,
        platformNetUsdc: split.platformNet,
        referrerCode: session.referredByCode,
        referrerPayoutUsdc: split.referrerPayout,
        sellerNetPayoutUsdc: split.sellerNet,
        solanaRentUsdc: 0.001,
        status: 'CREATED',
        tradeHoldDays: item.tradeHoldDays,
        createdAt: 'Ahora mismo',
        buyerTradeUrl: session.tradeUrl,
        logs: [
          {
            at: nowTime(),
            actor: 'SISTEMA',
            action: `Orden creada en ${currency} ($${item.priceUsdc.toFixed(2)}). Split configurado: 97% vendedor ($${split.sellerNet.toFixed(2)}) · ${hasRef ? `1.5% plataforma / 1.5% referidor ${session.referredByCode}` : '3% plataforma'}.`,
          },
        ],
      };
    });

    setOrders((prev) => [...created, ...prev]);
    setCart([]);
    setCartOpen(false);
    handleChangeView('escrow');
    notify(
      created.length === 1
        ? `Escrow ${created[0].id} creado. Confirma el pago en Solana.`
        : `${created.length} órdenes de Escrow creadas en Solana.`,
    );
  };

  const handleSimulatePay = (orderId: string) => {
    const txHash = randomHash(48);
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const nextStatus = o.tradeHoldDays > 0 ? 'ESCROW_HELD' : 'PAID';
        return {
          ...o,
          status: nextStatus,
          solanaTxHash: txHash,
          logs: [
            ...o.logs,
            {
              at: nowTime(),
              actor: 'SOLANA_RPC',
              action: `getTransaction(confirmed) en 410ms · Tx ${txHash.slice(0, 14)}… · Publicación marcada RESERVED.`,
            },
            ...(o.tradeHoldDays > 0
              ? [
                  {
                    at: nowTime(),
                    actor: 'STEAM_P2P' as const,
                    action:
                      'Escrow Steam 7 días activo: capital USDC bloqueado en custodia hasta expirar retención de seguridad.',
                  },
                ]
              : []),
          ],
        };
      }),
    );
    notify('Pago Solana verificado on-chain (~400ms). Fondos resguardados en Escrow.');
  };

  const handleSimulateTradeSent = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: 'TRADE_SENT',
          logs: [
            ...o.logs,
            {
              at: nowTime(),
              actor: 'VENDEDOR',
              action: `Trade Offer P2P enviado directo a la Trade URL del comprador (sin bots intermedios).`,
            },
          ],
        };
      }),
    );
    notify('Trade Offer P2P enviado. Acepta en Steam y libera el Split 3 vías.');
  };

  const handleConfirmRelease = (orderId: string) => {
    const payoutHash = randomHash(48);
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: 'RELEASED',
          payoutTxHash: payoutHash,
          logs: [
            ...o.logs,
            {
              at: nowTime(),
              actor: 'STEAM_P2P',
              action: 'Verificador de inventario confirmó el asset_id en la mochila del comprador.',
            },
            {
              at: nowTime(),
              actor: 'SOLANA_RPC',
              action: `Split atómico 3 vías ejecutado (Tx ${payoutHash.slice(0, 12)}…): $${o.sellerNetPayoutUsdc.toFixed(2)} vendedor · $${o.platformNetUsdc.toFixed(2)} plataforma · $${o.referrerPayoutUsdc.toFixed(2)} referidor.`,
            },
          ],
        };
      }),
    );
    notify('¡Escrow liberado! Liquidación atómica 3 vías (97% / 1.5% / 1.5%) completada en Solana.');
  };

  const handleOpenDispute = (orderId: string, reason: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: 'DISPUTED',
          disputeReason: reason,
          disputeEvidence: 'Verificación de inventario público Steam adjuntada automáticamente.',
          logs: [
            ...o.logs,
            {
              at: nowTime(),
              actor: 'COMPRADOR',
              action: `Disputa abierta (<48h SLA): ${reason}`,
            },
          ],
        };
      }),
    );
    notify('Disputa registrada y fondos congelados. Resuélvela desde la pestaña Admin.');
  };

  const handleResolveDispute = (orderId: string, decision: 'RELEASE' | 'REFUND') => {
    const txHash = randomHash(48);
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: decision === 'RELEASE' ? 'RELEASED' : 'REFUNDED',
          payoutTxHash: txHash,
          adminResolution:
            decision === 'RELEASE'
              ? 'Admin aprobó liberación con Split 3 vías.'
              : 'Admin ejecutó reembolso completo al comprador.',
          logs: [
            ...o.logs,
            {
              at: nowTime(),
              actor: 'ADMIN',
              action:
                decision === 'RELEASE'
                  ? `Doble confirmación: Split 3 vías ejecutado (Tx ${txHash.slice(0, 12)}…).`
                  : `Doble confirmación: Reembolso de $${o.grossUsdc.toFixed(2)} al comprador (Tx ${txHash.slice(0, 12)}…).`,
            },
          ],
        };
      }),
    );
    notify(
      decision === 'RELEASE'
        ? 'Disputa resuelta: fondos dispersados (97% / 1.5% / 1.5%).'
        : 'Disputa resuelta: reembolso enviado al comprador.',
    );
  };

  const handlePublishItem = (item: MarketItem) => {
    setCatalog((prev) => [item, ...prev]);
    try {
      const existing = JSON.parse(localStorage.getItem('cs2market.user_listings.v2') || '[]');
      localStorage.setItem('cs2market.user_listings.v2', JSON.stringify([item, ...existing]));
    } catch {
      // ignore
    }
    setActiveCategory('featured');
    handleChangeView('market');
    notify(
      item.tradeHoldDays > 0
        ? `Publicada con etiqueta "EN ESPERA (ESCROW) 7 días": ${item.name}`
        : `Publicada con Entrega P2P Inmediata: ${item.name}`,
    );
  };

  const handleSimulateNewReferral = (username: string) => {
    const newRec: ReferralRecord = {
      id: `ref-${Date.now()}`,
      steamId64: `76561198${Math.floor(100000000 + Math.random() * 899999999)}`,
      username,
      joinedAt: 'Ahora mismo',
      tradesCount: 1,
      volumeUsdc: 220.0,
      earnedUsdc: 3.3,
    };
    setReferrals((prev) => [newRec, ...prev]);
    notify(`Nuevo referido vinculado de por vida: ${username} (+$3.30 USDC 50% fee).`);
  };

  const activeEscrowCount = orders.filter(
    (o) => !['RELEASED', 'REFUNDED'].includes(o.status),
  ).length;
  const openDisputeCount = orders.filter((o) => o.status === 'DISPUTED').length;

  return (
    <div className="min-h-screen bg-[#121721] pb-20 text-slate-100 md:pb-10">
      <Navbar
        activeView={activeView}
        onChangeView={handleChangeView}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cart.length}
        onOpenCart={() => setCartOpen(true)}
        session={session}
        authEmail={authUser.email}
        authPhotoUrl={authUser.photoURL}
        onOpenProfile={() => setProfileOpen(true)}
        onToggleSteamLogin={() => setProfileOpen(true)}
        onConnectWallet={() => setProfileOpen(true)}
        activeEscrowCount={activeEscrowCount}
        openDisputeCount={openDisputeCount}
      />

      <main className="mx-auto max-w-[1600px] px-3.5 py-5 sm:px-5 lg:px-7">
        {activeView === 'market' && (
          <MarketView
            items={catalog}
            loading={loadingCatalog}
            activeCategory={activeCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectItem={setSelectedItem}
            onAddToCart={handleAddToCart}
            onGoGuide={() => handleChangeView('guide')}
          />
        )}

        {activeView === 'sell' && (
          <SellInventoryView
            catalog={catalog}
            session={session}
            onUpdateSession={handleUpdateSession}
            onPublishItem={handlePublishItem}
            onNotify={notify}
          />
        )}

        {activeView === 'escrow' && (
          <EscrowCenterView
            orders={orders}
            onSimulatePay={handleSimulatePay}
            onSimulateTradeSent={handleSimulateTradeSent}
            onConfirmRelease={handleConfirmRelease}
            onOpenDispute={handleOpenDispute}
          />
        )}

        {activeView === 'referrals' && (
          <ReferralsView
            session={session}
            referrals={referrals}
            onNotify={notify}
            onSimulateNewReferral={handleSimulateNewReferral}
          />
        )}

        {activeView === 'guide' && <EscrowGuideView />}

        {activeView === 'admin' && (
          <AdminPanelView orders={orders} onResolveDispute={handleResolveDispute} />
        )}
      </main>

      <SkinModal
        item={selectedItem}
        session={session}
        onClose={() => setSelectedItem(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={(it) => createEscrowOrders([it], 'USDC')}
        onNotify={notify}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        session={session}
        solPriceUsd={solPriceUsd}
        onRemove={(id) => setCart((prev) => prev.filter((x) => x.id !== id))}
        onClear={() => setCart([])}
        onConnectWallet={() => setProfileOpen(true)}
        onCheckout={(curr) => createEscrowOrders(cart, curr)}
      />

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        session={session}
        authEmail={authUser.email}
        authPhotoUrl={authUser.photoURL}
        onUpdateSession={handleUpdateSession}
        onConnectRealWallet={handleConnectRealWallet}
        onLogout={handleLogout}
      />

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-xl border border-emerald-500/40 bg-[#141c28]/95 px-4 py-2.5 text-xs font-medium text-emerald-200 shadow-2xl backdrop-blur md:bottom-6">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
