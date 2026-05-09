import {
  collection, addDoc, getDocs, query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function getCapsules(uid, animeId, currentEpisode = 0) {
  const snap = await getDocs(
    query(
      collection(db, 'capsules'),
      where('uid', '==', uid),
      where('anime_id', '==', parseInt(animeId)),
      orderBy('created_at', 'asc'),
    )
  );
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      locked: currentEpisode < data.unlock_episode,
      unlock_at: data.unlock_episode,
    };
  });
}

export async function createCapsule(uid, username, animeId, content, unlockEpisode) {
  return addDoc(collection(db, 'capsules'), {
    uid,
    username,
    anime_id: parseInt(animeId),
    content,
    unlock_episode: parseInt(unlockEpisode),
    created_at: serverTimestamp(),
  });
}
