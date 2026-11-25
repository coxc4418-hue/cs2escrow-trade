import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AuthGateProps {
  referralCodeFromUrl: string | null;
}

type AuthMode = 'login' | 'register' | 'reset';

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

function mapFirebaseError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos. Verifica tus datos o crea una cuenta nueva.';
    case 'auth/email-already-in-use':
      return 'Este correo ya está registrado. Inicia sesión o usa Google.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'Ingresa un correo electrónico válido.';
    case 'auth/popup-closed-by-user':
      return 'Se cerró la ventana de Google antes de completar el inicio de sesión.';
    case 'auth/popup-blocked':
      return 'Tu navegador bloqueó la ventana emergente de Google. Permite popups e intenta de nuevo.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento antes de volver a intentarlo.';
    case 'auth/operation-not-allowed':
      return 'Este método de acceso aún no está activado en Firebase Console.';
    case 'auth/unauthorized-domain':
      return 'Este dominio aún no está autorizado en Firebase Authentication.';
    default:
      return 'No se pudo completar la autenticación. Intenta nuevamente.';
  }
}

export function AuthGate({ referralCodeFromUrl }: AuthGateProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const passwordStrength =
    password.length === 0
      ? 0
      : password.length < 6
        ? 1
        : /[A-Z]/.test(password) && /[0-9]/.test(password) && password.length >= 8
          ? 3
          : 2;

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setGoogleBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setErrorMsg(mapFirebaseError(err));
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Ingresa tu correo electrónico.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, cleanEmail);
        setSuccessMsg(
          'Te enviamos un enlace de recuperación a tu correo. Revisa tu bandeja de entrada o spam.',
        );
        setMode('login');
        return;
      }

      if (mode === 'register') {
        if (!displayName.trim() || displayName.trim().length < 2) {
          setErrorMsg('Ingresa tu nombre o gamertag (mínimo 2 caracteres).');
          return;
        }
        if (password.length < 6) {
          setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg('Las contraseñas no coinciden.');
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        await updateProfile(cred.user, { displayName: displayName.trim() });
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      }
    } catch (err) {
      setErrorMsg(mapFirebaseError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#090d14] px-4 py-8 text-slate-100">
      {/* Pure Atmospheric Tactical Background (No catalog / no listings visible) */}
      <div className="auth-grid-bg pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -left-36 -top-36 h-[460px] w-[460px] rounded-full bg-emerald-500/15 blur-[135px]" />
      <div className="pointer-events-none absolute -bottom-36 -right-32 h-[480px] w-[480px] rounded-full bg-sky-500/15 blur-[140px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="animate-scanline pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/75 to-transparent" />

      {/* Centered Exclusive Login Card with Tactical HUD Corners */}
      <div className="relative z-10 w-full max-w-[430px]">
        {/* Outer Subtle Glow Ring */}
        <div className="pointer-events-none absolute -inset-[1px] rounded-[26px] bg-gradient-to-b from-emerald-400/35 via-sky-400/20 to-slate-800/40 blur-[1px]" />

        <div className="relative overflow-hidden rounded-[25px] border border-slate-700/70 bg-[#111723]/95 p-6 shadow-[0_30px_90px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:p-8">
          {/* Tactical Corner Brackets */}
          <span className="pointer-events-none absolute left-3.5 top-3.5 h-3.5 w-3.5 border-l-2 border-t-2 border-emerald-400/70" />
          <span className="pointer-events-none absolute right-3.5 top-3.5 h-3.5 w-3.5 border-r-2 border-t-2 border-sky-400/70" />
          <span className="pointer-events-none absolute bottom-3.5 left-3.5 h-3.5 w-3.5 border-b-2 border-l-2 border-sky-400/40" />
          <span className="pointer-events-none absolute bottom-3.5 right-3.5 h-3.5 w-3.5 border-b-2 border-r-2 border-emerald-400/40" />

          {/* Brand Header */}
          <div className="text-center">
            <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/35 bg-gradient-to-br from-emerald-500/20 via-[#162032] to-sky-500/20 shadow-[0_0_30px_rgba(16,185,129,0.25)]">
              <ShieldCheck className="h-7 w-7 text-emerald-400" />
            </div>

            <h1 className="font-cs text-3xl tracking-widest text-white drop-shadow-[0_0_20px_rgba(56,189,248,0.25)]">
              CS2 MARKET
            </h1>
            <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">
              {mode === 'login'
                ? 'Acceso Privado · Escrow P2P'
                : mode === 'register'
                  ? 'Registro de Operador'
                  : 'Recuperar Contraseña'}
            </p>
          </div>

          {referralCodeFromUrl && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span>
                Invitación activa: <strong className="font-mono">{referralCodeFromUrl}</strong>
              </span>
            </div>
          )}

          {/* Mode Switcher */}
          {mode !== 'reset' && (
            <div className="mt-6 grid grid-cols-2 rounded-xl border border-slate-800 bg-[#0a0f18] p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`rounded-lg py-2 text-xs font-bold transition ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`rounded-lg py-2 text-xs font-bold transition ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Crear Cuenta
              </button>
            </div>
          )}

          {/* Google Sign-In */}
          {mode !== 'reset' && (
            <>
              <button
                type="button"
                disabled={googleBusy || busy}
                onClick={handleGoogleSignIn}
                className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-slate-100 active:scale-[0.99] disabled:opacity-60"
              >
                {googleBusy ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-700" />
                ) : (
                  <GoogleLogo />
                )}
                <span>
                  {mode === 'login' ? 'Continuar con Google' : 'Registrarse con Google'}
                </span>
              </button>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-800" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  o con correo
                </span>
                <div className="h-px flex-1 bg-slate-800" />
              </div>
            </>
          )}

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-200">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  Nombre o Gamertag
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ej. Operador_CS2"
                    className="w-full rounded-xl border border-slate-700/80 bg-[#0a0f18] py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-400">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full rounded-xl border border-slate-700/80 bg-[#0a0f18] py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-400"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    Contraseña
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('reset');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] font-medium text-sky-400 hover:text-sky-300"
                    >
                      ¿Olvidaste tu clave?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-700/80 bg-[#0a0f18] py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    aria-label="Mostrar contraseña"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {mode === 'register' && password.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5">
                    {[1, 2, 3].map((lvl) => (
                      <span
                        key={lvl}
                        className={`h-1 flex-1 rounded-full transition ${
                          passwordStrength >= lvl
                            ? passwordStrength === 1
                              ? 'bg-rose-500'
                              : passwordStrength === 2
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            : 'bg-slate-800'
                        }`}
                      />
                    ))}
                    <span className="font-mono text-[10px] text-slate-400">
                      {passwordStrength === 1
                        ? 'Débil'
                        : passwordStrength === 2
                          ? 'Media'
                          : 'Fuerte'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className="w-full rounded-xl border border-slate-700/80 bg-[#0a0f18] py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-400"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={busy || googleBusy}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-[0_12px_32px_-10px_rgba(16,185,129,0.75)] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login'
                      ? 'Iniciar Sesión'
                      : mode === 'register'
                        ? 'Crear Cuenta'
                        : 'Enviar Enlace'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="w-full py-1 text-center text-xs font-semibold text-slate-400 hover:text-white"
              >
                ← Volver a Iniciar Sesión
              </button>
            )}
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-800/80 pt-4 font-mono text-[10px] text-slate-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span>SISTEMA PROTEGIDO · SOLO USUARIOS AUTORIZADOS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
