import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit, serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

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

export function getLevelThresholds(level) {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, Infinity];
  return { start: thresholds[level - 1], end: thresholds[level] };
}

export async function registerUser(email, password, username) {
  // Check username taken
  const unSnap = await getDoc(doc(db, 'usernames', username.toLowerCase()));
  if (unSnap.exists()) throw new Error('El nombre de usuario ya está en uso.');

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  const profileData = {
    username,
    email,
    bio: '',
    location: '',
    points: 0,
    level: 1,
    level_start_points: 0,
    next_level_points: 100,
    role: 'user',
    is_admin: false,
    is_premium: false,
    is_banned: false,
    avatar_url: '',
    banner_url: '',
    active_frame: '',
    active_banner: '',
    active_emoji: '',
    created_at: serverTimestamp(),
    stats: { episodes_watched: 0, manga_chapters: 0, comments: 0 },
  };

  await setDoc(doc(db, 'users', uid), profileData);
  await setDoc(doc(db, 'usernames', username.toLowerCase()), { uid, email });

  return { uid, ...profileData };
}

export async function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

export async function getUserProfileByUsername(username) {
  const unSnap = await getDoc(doc(db, 'usernames', username.toLowerCase()));
  if (!unSnap.exists()) return null;
  return getUserProfile(unSnap.data().uid);
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, 'users', uid), data);
}

export async function searchUsers(queryStr) {
  const q = query(
    collection(db, 'users'),
    where('username', '>=', queryStr),
    where('username', '<=', queryStr + ''),
    limit(8)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

export async function equipReward(uid, rewardType, rewardKey, imageUrl = '') {
  const data = {};
  if (rewardType === 'frame') data.active_frame = rewardKey;
  else if (rewardType === 'banner') { data.active_banner = rewardKey; data.banner_url = imageUrl; }
  else if (rewardType === 'emoji') data.active_emoji = rewardKey;
  await updateDoc(doc(db, 'users', uid), data);
  return data;
}

export { computeLevel };
