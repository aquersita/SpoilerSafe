import {
  doc, getDoc, setDoc, deleteDoc, collection, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function getWatchlist(uid) {
  const snap = await getDocs(collection(db, 'watchlist', uid, 'items'));
  return snap.docs.map(d => d.data());
}

export async function addToWatchlist(uid, animeId, animeData) {
  await setDoc(doc(db, 'watchlist', uid, 'items', String(animeId)), {
    ...animeData,
    id: parseInt(animeId),
    added_at: serverTimestamp(),
  });
}

export async function removeFromWatchlist(uid, animeId) {
  await deleteDoc(doc(db, 'watchlist', uid, 'items', String(animeId)));
}

export async function checkInWatchlist(uid, animeId) {
  const snap = await getDoc(doc(db, 'watchlist', uid, 'items', String(animeId)));
  return snap.exists();
}
