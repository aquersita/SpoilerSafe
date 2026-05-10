import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // One-time cleanup: legacy global history bucket pre-dated per-user scoping
    // and could leak browsing between accounts on the same browser.
    localStorage.removeItem('spoilersafe_history');

    return onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const snap = await getDoc(doc(db, 'users', fbUser.uid));
        setProfile(snap.exists() ? { uid: fbUser.uid, email: fbUser.email, ...snap.data() } : null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ firebaseUser, profile, setProfile, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
