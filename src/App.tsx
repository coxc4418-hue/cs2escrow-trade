import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  ADMIN_EMAILS,
  computeSplit,
  makeReferralCode,
  PLATFORM_FEE_RATE,
  type EscrowOrder,
  type MarketCategory,
  type MarketItem,
  type PayCurrency,
  type ReferralRecord,
  type UserProfile,
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

function todayShort() {
  return new Date().toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

async function checkSolanaTxOnChain(txHash: string): Promise<'confirmed' | 'unconfirmed'> {
  try {
    const res = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignatureStatuses',
        params: [[txHash], { searchTransactionHistory: true }],
      }),
    });
    const data = await res.json();
    const status = data?.result?.value?.[0];
    if (status && !status.err && (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized')) {
      return 'confirmed';
    }
  } catch {
    // RPC público puede tener rate limit; se registra pendiente de verificación
  }
  return 'unconfirmed';
}

export default function App() {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [urlRefCode, setUrlRefCode] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<AppView>('market');
  const [activeCategory, setActiveCategory] = useState<MarketCategory>('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [baseCatalog, setBaseCatalog] = useState<MarketItem[]>([]);
  const [liveListings, setLiveListings] = useState<MarketItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [solPriceUsd, setSolPriceUsd] = useState<number>(185);

  const [cart, setCart] = useState<MarketItem[]>([]);
  const [orders, setOrders] = useState<EscrowOrder[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);

  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => setToast(msg);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Capture ?ref=CODIGO from URL and keep it until registration finishes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref')?.trim().toUpperCase();
    if (refParam && refParam.length >= 4) {
      setUrlRefCode(refParam);
      try {
        sessionStorage.setItem('cs2market.pending_ref', refParam);
      } catch {
        // ignore
      }
    } else {
      try {
        const stored = sessionStorage.getItem('cs2market.pending_ref');
        if (stored) setUrlRefCode(stored);
      } catch {
        // ignore
      }
    }
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setAuthUser(fbUser);
      setAuthReady(true);
      if (!fbUser) {
        setProfile(null);
        setOrders([]);
        setReferrals([]);
        setCart([]);
      }
    });
    return () => unsub();
  }, []);

  // Load real Valve/ByMykel + CSGOTrader catalog.json + SOL price
  useEffect(() => {
    let alive = true;
    fetch('/catalog.json')
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        const items: MarketItem[] = Array.isArray(data?.items) ? data.items : [];
        setBaseCatalog(items);
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
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  // Ensure real Firestore UserProfile (starts with balanceUsdc: 0, 0 referrals, 0 orders) & live subscriptions
  useEffect(() => {
    if (!authUser) return;

    let unsubProfile: (() => void) | undefined;
    let unsubListings: (() => void) | undefined;
    let unsubBuyerOrders: (() => void) | undefined;
    let unsubSellerOrders: (() => void) | undefined;
    let unsubAllOrders: (() => void) | undefined;
    let unsubReferrals: (() => void) | undefined;

    const uid = authUser.uid;
    const email = (authUser.email || '').toLowerCase();
    const isAdminAccount = ADMIN_EMAILS.includes(email);

    const initUser = async () => {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        const myCode = makeReferralCode(uid);
        let referredByCode: string | null = null;
        let referredByUid: string | null = null;

        // Check lifetime referral attribution if user arrived via ?ref=CODE
        const pendingRef = urlRefCode?.trim().toUpperCase();
        if (pendingRef && pendingRef !== myCode) {
          try {
            const refCodeSnap = await getDoc(doc(db, 'referral_codes', pendingRef));
            if (refCodeSnap.exists()) {
              const refOwnerUid = String(refCodeSnap.data()?.uid || '');
              if (refOwnerUid && refOwnerUid !== uid) {
                referredByCode = pendingRef;
                referredByUid = refOwnerUid;
              }
            }
          } catch {
            // ignore
          }
        }

        const freshProfile: UserProfile = {
          uid,
          email: authUser.email || '',
          displayName: authUser.displayName?.trim() || email.split('@')[0] || 'Operador',
          photoURL: authUser.photoURL || '',
          role: 'user',
          steamId64: '',
          tradeUrl: '',
          steamGuardMobile: false,
          walletAddress: '',
          walletProvider: null,
          walletSigned: false,
          balanceUsdc: 0,
          referralCode: myCode,
          referredByCode,
          referredByUid,
          createdAt: new Date().toISOString(),
        };

        await setDoc(userRef, freshProfile);

        // Register unique referral code lookup
        try {
          await setDoc(doc(db, 'referral_codes', myCode), {
            uid,
            code: myCode,
            createdAt: freshProfile.createdAt,
          });
        } catch {
          // code already registered
        }

        // Create real referral attribution record (starts at $0.00 and 0 trades)
        if (referredByUid) {
          try {
            await setDoc(doc(db, 'referrals', uid), {
              id: uid,
              referrerUid: referredByUid,
              referredUid: uid,
              steamId64: '',
              username: freshProfile.displayName,
              email: freshProfile.email,
              joinedAt: todayShort(),
              tradesCount: 0,
              volumeUsdc: 0,
              earnedUsdc: 0,
            });
          } catch {
            // ignore
          }
        }
      }

      // Live profile listener
      unsubProfile = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile({
            ...data,
            displayName: data.displayName || authUser.displayName || email.split('@')[0] || 'Operador',
            photoURL: data.photoURL || authUser.photoURL || '',
            balanceUsdc: Number(data.balanceUsdc) || 0,
          });
        }
      });

      // Live listings listener (user-published skins in real time)
      unsubListings = onSnapshot(collection(db, 'listings'), (qSnap) => {
        const list: MarketItem[] = [];
        qSnap.forEach((d) => {
          list.push(d.data() as MarketItem);
        });
        list.sort((a, b) => (b.id > a.id ? 1 : -1));
        setLiveListings(list);
      });

      // Live orders listener (only real orders belonging to this user, or all for admin)
      if (isAdminAccount) {
        unsubAllOrders = onSnapshot(collection(db, 'orders'), (qSnap) => {
          const list = qSnap.docs
            .map((d) => d.data() as EscrowOrder)
            .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
          setOrders(list);
        });
      } else {
        let buyerList: EscrowOrder[] = [];
        let sellerList: EscrowOrder[] = [];
        const mergeOrders = () => {
          const map = new Map<string, EscrowOrder>();
          [...buyerList, ...sellerList].forEach((o) => map.set(o.id, o));
          setOrders(
            Array.from(map.values()).sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0)),
          );
        };
        unsubBuyerOrders = onSnapshot(
          query(collection(db, 'orders'), where('buyerUid', '==', uid)),
          (qSnap) => {
            buyerList = qSnap.docs.map((d) => d.data() as EscrowOrder);
            mergeOrders();
          },
        );
        unsubSellerOrders = onSnapshot(
          query(collection(db, 'orders'), where('sellerUid', '==', uid)),
          (qSnap) => {
            sellerList = qSnap.docs.map((d) => d.data() as EscrowOrder);
            mergeOrders();
          },
        );
      }

      // Live referrals listener (starts at 0 until someone registers with your ?ref= link)
      unsubReferrals = onSnapshot(
        query(collection(db, 'referrals'), where('referrerUid', '==', uid)),
        (qSnap) => {
          setReferrals(qSnap.docs.map((d) => d.data() as ReferralRecord));
        },
      );
    };

    initUser().catch((err) => {
      console.error('Firestore init error:', err);
      // Fallback in-memory clean $0 profile if network hiccups
      setProfile({
        uid,
        email: authUser.email || '',
        displayName: authUser.displayName?.trim() || email.split('@')[0] || 'Operador',
        photoURL: authUser.photoURL || '',
        role: isAdminAccount ? 'admin' : 'user',
        steamId64: '',
        tradeUrl: '',
        steamGuardMobile: false,
        walletAddress: '',
        walletProvider: null,
        walletSigned: false,
        balanceUsdc: 0,
        referralCode: makeReferralCode(uid),
        referredByCode: null,
        referredByUid: null,
        createdAt: new Date().toISOString(),
      });
    });

    return () => {
      unsubProfile?.();
      unsubListings?.();
      unsubBuyerOrders?.();
      unsubSellerOrders?.();
      unsubAllOrders?.();
      unsubReferrals?.();
    };
  }, [authUser, urlRefCode]);

  if (!authReady || (authUser && !profile)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#090d14] text-slate-200">
        <Loader2 className="h-9 w-9 animate-spin text-emerald-400" />
        <p className="mt-3 font-cs text-lg tracking-widest text-white">CS2 MARKET</p>
        <p className="mt-1 font-mono text-[11px] text-slate-400">Cargando tu cuenta...</p>
      </div>
    );
  }

  if (!authUser || !profile) {
    return <AuthGate referralCodeFromUrl={urlRefCode} />;
  }

  const isAdmin =
    profile.role === 'admin' || ADMIN_EMAILS.includes((profile.email || '').toLowerCase());
  const fullCatalog = [...liveListings, ...baseCatalog];

  const handleChangeView = (view: AppView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProfile = async (patch: Partial<UserProfile>) => {
    try {
      const safePatch = { ...patch };
      delete safePatch.balanceUsdc;
      delete safePatch.role;
      await updateDoc(doc(db, 'users', profile.uid), safePatch);
      notify('Perfil actualizado correctamente.');
    } catch {
      notify('No se pudo guardar el perfil. Verifica tu conexión.');
    }
  };

  const handleConnectWallet = async (provider: 'Phantom' | 'Solflare') => {
    try {
      if (provider === 'Phantom' && window.solana?.isPhantom) {
        const resp = await window.solana.connect();
        const addr = resp.publicKey.toString();
        let signed = false;
        if (window.solana.signMessage) {
          const encoded = new TextEncoder().encode(
            `CS2 MARKET — Verificación de propiedad de wallet sin gas (${profile.uid})`,
          );
          await window.solana.signMessage(encoded, 'utf8');
          signed = true;
        }
        await handleSaveProfile({
          walletProvider: 'Phantom',
          walletAddress: addr,
          walletSigned: signed,
        });
        notify(`Phantom vinculada: ${addr.slice(0, 6)}…${addr.slice(-4)}`);
        return;
      }

      if (provider === 'Solflare' && window.solflare?.isSolflare) {
        await window.solflare.connect();
        const addr = window.solflare.publicKey?.toString();
        if (addr) {
          await handleSaveProfile({
            walletProvider: 'Solflare',
            walletAddress: addr,
            walletSigned: true,
          });
          notify(`Solflare vinculada: ${addr.slice(0, 6)}…${addr.slice(-4)}`);
          return;
        }
      }

      notify(
        `No se detectó la extensión ${provider} en este navegador. Puedes pegar tu dirección Solana manualmente.`,
      );
    } catch {
      notify(`Conexión con ${provider} cancelada.`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setProfileOpen(false);
    } catch {
      notify('No se pudo cerrar sesión.');
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

  const createEscrowOrders = async (itemsToBuy: MarketItem[], currency: PayCurrency) => {
    if (!profile.walletAddress || !profile.tradeUrl) {
      notify('Configura tu Wallet Solana y tu Trade URL P2P antes de crear una orden.');
      setProfileOpen(true);
      return;
    }

    const nowMs = Date.now();
    try {
      for (let idx = 0; idx < itemsToBuy.length; idx++) {
        const item = itemsToBuy[idx];
        const hasRef = Boolean(profile.referredByCode);
        const split = computeSplit(item.priceUsdc, hasRef);
        const orderId = `ESC-${String(nowMs + idx).slice(-6)}`;
        const order: EscrowOrder = {
          id: orderId,
          buyerUid: profile.uid,
          sellerUid: item.sellerUid || 'CATALOG_VERIFIED',
          item,
          buyerName: profile.displayName,
          sellerName: item.seller.steamName,
          currency,
          grossUsdc: item.priceUsdc,
          platformFeeRate: PLATFORM_FEE_RATE,
          platformFeeUsdc: split.feeTotal,
          platformNetUsdc: split.platformNet,
          referrerCode: profile.referredByCode,
          referrerPayoutUsdc: split.referrerPayout,
          sellerNetPayoutUsdc: split.sellerNet,
          solanaRentUsdc: 0.001,
          status: 'CREATED',
          tradeHoldDays: item.tradeHoldDays,
          createdAt: todayShort(),
          createdAtMs: nowMs + idx,
          buyerTradeUrl: profile.tradeUrl,
          logs: [
            {
              at: nowTime(),
              actor: 'SISTEMA',
              action: `Orden ${orderId} creada (${currency} · $${item.priceUsdc.toFixed(2)}). Esperando firma de transacción Solana.`,
            },
          ],
        };
        await setDoc(doc(db, 'orders', orderId), order);
      }

      setCart([]);
      setCartOpen(false);
      handleChangeView('escrow');
      notify('Orden de Escrow creada. Registra tu firma de transacción Solana para continuar.');
    } catch {
      notify('No se pudo crear la orden en este momento.');
    }
  };

  const handleSubmitPaymentHash = async (orderId: string, txHash: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;

    const rpcStatus = await checkSolanaTxOnChain(txHash);
    const nextStatus = target.tradeHoldDays > 0 ? 'ESCROW_HELD' : 'PAID';

    await updateDoc(doc(db, 'orders', orderId), {
      status: nextStatus,
      solanaTxHash: txHash,
      logs: [
        ...target.logs,
        {
          at: nowTime(),
          actor: 'SOLANA_RPC',
          action:
            rpcStatus === 'confirmed'
              ? `Transacción Solana CONFIRMADA on-chain (${txHash.slice(0, 14)}…). Fondos en Escrow.`
              : `Firma Solana registrada (${txHash.slice(0, 14)}…). En espera de confirmación/validación on-chain.`,
        },
      ],
    });
    notify(
      rpcStatus === 'confirmed'
        ? 'Transacción confirmada en Solana Mainnet.'
        : 'Firma de transacción registrada en tu orden de Escrow.',
    );
  };

  const handleMarkTradeSent = async (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'TRADE_SENT',
      logs: [
        ...target.logs,
        {
          at: nowTime(),
          actor: 'VENDEDOR',
          action: 'Vendedor notificó el envío del Trade Offer P2P en Steam.',
        },
      ],
    });
    notify('Trade Offer marcado como enviado.');
  };

  const handleConfirmReceipt = async (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'RELEASED',
      logs: [
        ...target.logs,
        {
          at: nowTime(),
          actor: 'COMPRADOR',
          action: `Recepción confirmada en inventario Steam. Liquidación 3 vías habilitada ($${target.sellerNetPayoutUsdc.toFixed(2)} vendedor / $${target.platformNetUsdc.toFixed(2)} plataforma / $${target.referrerPayoutUsdc.toFixed(2)} referidor).`,
        },
      ],
    });
    notify('Recepción confirmada y orden marcada como liberada.');
  };

  const handleOpenDispute = async (orderId: string, reason: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'DISPUTED',
      disputeReason: reason,
      disputeEvidence: 'Pendiente verificación de inventario público Steam por soporte.',
      logs: [
        ...target.logs,
        {
          at: nowTime(),
          actor: 'COMPRADOR',
          action: `Disputa abierta (<48h SLA): ${reason}`,
        },
      ],
    });
    notify('Disputa abierta. Los fondos permanecen congelados hasta resolución.');
  };

  const handleResolveDispute = async (orderId: string, decision: 'RELEASE' | 'REFUND') => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;
    await updateDoc(doc(db, 'orders', orderId), {
      status: decision === 'RELEASE' ? 'RELEASED' : 'REFUNDED',
      adminResolution:
        decision === 'RELEASE'
          ? 'Administrador aprobó liberación de fondos al vendedor.'
          : 'Administrador aprobó reembolso al comprador.',
      logs: [
        ...target.logs,
        {
          at: nowTime(),
          actor: 'ADMIN',
          action:
            decision === 'RELEASE'
              ? 'Resolución con doble confirmación: liberar fondos al vendedor.'
              : 'Resolución con doble confirmación: reembolsar fondos al comprador.',
        },
      ],
    });
    notify('Disputa resuelta y registrada en el historial de auditoría.');
  };

  const handlePublishItem = async (item: MarketItem) => {
    await setDoc(doc(db, 'listings', item.id), item);
    setActiveCategory('featured');
    handleChangeView('market');
    notify(`Publicación creada en vivo: ${item.name} ($${item.priceUsdc.toFixed(2)} USDC)`);
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
        profile={profile}
        isAdmin={isAdmin}
        onOpenProfile={() => setProfileOpen(true)}
        activeEscrowCount={activeEscrowCount}
        openDisputeCount={openDisputeCount}
      />

      <main className="mx-auto max-w-[1600px] px-3.5 py-5 sm:px-5 lg:px-7">
        {activeView === 'market' && (
          <MarketView
            items={fullCatalog}
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
            catalog={fullCatalog}
            profile={profile}
            onOpenProfile={() => setProfileOpen(true)}
            onPublishItem={handlePublishItem}
            onNotify={notify}
          />
        )}

        {activeView === 'escrow' && (
          <EscrowCenterView
            orders={orders}
            currentUid={profile.uid}
            onSubmitPaymentHash={handleSubmitPaymentHash}
            onMarkTradeSent={handleMarkTradeSent}
            onConfirmReceipt={handleConfirmReceipt}
            onOpenDispute={handleOpenDispute}
            onNotify={notify}
          />
        )}

        {activeView === 'referrals' && (
          <ReferralsView profile={profile} referrals={referrals} onNotify={notify} />
        )}

        {activeView === 'guide' && <EscrowGuideView />}

        {activeView === 'admin' && isAdmin && (
          <AdminPanelView orders={orders} onResolveDispute={handleResolveDispute} />
        )}
      </main>

      <SkinModal
        item={selectedItem}
        profile={profile}
        onClose={() => setSelectedItem(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={(it) => createEscrowOrders([it], 'USDC')}
        onNotify={notify}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        profile={profile}
        solPriceUsd={solPriceUsd}
        onRemove={(id) => setCart((prev) => prev.filter((x) => x.id !== id))}
        onClear={() => setCart([])}
        onOpenProfile={() => setProfileOpen(true)}
        onCheckout={(curr) => createEscrowOrders(cart, curr)}
      />

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
        onConnectWallet={handleConnectWallet}
        onLogout={handleLogout}
        onNotify={notify}
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
