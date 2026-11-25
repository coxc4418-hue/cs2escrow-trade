import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAdbSleZBbXNnEILW-_J7FUS4toWqIFVhI',
  authDomain: 'cs2escrow-trade.firebaseapp.com',
  projectId: 'cs2escrow-trade',
  storageBucket: 'cs2escrow-trade.firebasestorage.app',
  messagingSenderId: '684356008046',
  appId: '1:684356008046:web:956f555190a2da693e4e7f',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
