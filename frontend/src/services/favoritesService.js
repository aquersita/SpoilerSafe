import {
  doc, getDoc, setDoc, deleteDoc, collection, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function getFavorites(uid) {
  const snap = await getDocs(collection(db, 'favorites', uid, 'items'));
  return snap.docs.map(d => d.data());
}

export async function addFavorite(uid, mediaData) {
  const key = `${mediaData.media_type}_${mediaData.media_id}`;
  await setDoc(doc(db, 'favorites', uid, 'items', key), {
    ...mediaData,
    key,
    added_at: serverTimestamp(),
  });
}

export async function removeFavorite(uid, mediaType, mediaId) {
  const key = `${mediaType}_${mediaId}`;
  await deleteDoc(doc(db, 'favorites', uid, 'items', key));
}

export async function checkIsFavorite(uid, mediaType, mediaId) {
  const key = `${mediaType}_${mediaId}`;
  const snap = await getDoc(doc(db, 'favorites', uid, 'items', key));
  return snap.exists();
}
