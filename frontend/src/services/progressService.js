import {
  doc, getDoc, setDoc, updateDoc, increment, arrayUnion,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

function computeLevel(points) {
  if (points < 100) return 1;
  if (points < 300) return 2;
  if (points < 600) return 3;
  if (points < 1000) return 4;
  if (points < 1500) return 5;
  if (points < 2100) return 6;
  if (points < 2800) return 7;
  if (points < 3600) return 8;
  if (points < 4500) return 9;
  return 10;
}

const XP_PER_EPISODE = 3;
const XP_PER_CHAPTER = 2;

export async function getAnimeProgress(uid, animeId) {
  const snap = await getDoc(doc(db, 'progress', uid, 'anime', String(animeId)));
  return snap.exists() ? snap.data().watched || [] : [];
}

export async function markEpisodeWatched(uid, animeId, epNum) {
  const ref = doc(db, 'progress', uid, 'anime', String(animeId));
  const snap = await getDoc(ref);
  const watched = snap.exists() ? snap.data().watched || [] : [];

  if (watched.includes(epNum)) return { points_earned: 0, already_watched: true };

  await setDoc(ref, { watched: arrayUnion(epNum) }, { merge: true });

  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const currentPoints = (userSnap.data().points || 0) + XP_PER_EPISODE;
    const newLevel = computeLevel(currentPoints);
    await updateDoc(userRef, {
      points: increment(XP_PER_EPISODE),
      level: newLevel,
      'stats.episodes_watched': increment(1),
    });
  }

  return { points_earned: XP_PER_EPISODE, already_watched: false };
}

export async function getMangaProgress(uid, mangaId) {
  const snap = await getDoc(doc(db, 'progress', uid, 'manga', String(mangaId)));
  return snap.exists() ? snap.data().read || [] : [];
}

export async function markChapterRead(uid, mangaId, chapterNum) {
  const ref = doc(db, 'progress', uid, 'manga', String(mangaId));
  const snap = await getDoc(ref);
  const read = snap.exists() ? snap.data().read || [] : [];

  if (read.includes(chapterNum)) return { points_earned: 0, already_read: true };

  await setDoc(ref, { read: arrayUnion(chapterNum) }, { merge: true });

  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const currentPoints = (userSnap.data().points || 0) + XP_PER_CHAPTER;
    const newLevel = computeLevel(currentPoints);
    await updateDoc(userRef, {
      points: increment(XP_PER_CHAPTER),
      level: newLevel,
      'stats.manga_chapters': increment(1),
    });
  }

  return { points_earned: XP_PER_CHAPTER, already_read: false };
}
