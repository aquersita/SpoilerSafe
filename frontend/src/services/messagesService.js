import {
  collection, doc, getDoc, setDoc, addDoc, updateDoc, query,
  where, orderBy, onSnapshot, serverTimestamp, increment,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

function convoId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

export function getConvoId(uid1, uid2) {
  return convoId(uid1, uid2);
}

export async function getOrCreateConvo(uid, username, avatarUrl, otherUid, otherUsername, otherAvatarUrl) {
  const id = convoId(uid, otherUid);
  const ref = doc(db, 'dms', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [uid, otherUid],
      usernames: { [uid]: username, [otherUid]: otherUsername },
      avatars: { [uid]: avatarUrl || '', [otherUid]: otherAvatarUrl || '' },
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      unread: { [uid]: 0, [otherUid]: 0 },
    });
  }
  return id;
}

export async function sendMessage(senderUid, senderUsername, otherUid, content) {
  const id = convoId(senderUid, otherUid);
  await addDoc(collection(db, 'dms', id, 'messages'), {
    senderUid,
    senderUsername,
    content,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'dms', id), {
    lastMessage: content,
    lastMessageAt: serverTimestamp(),
    [`unread.${otherUid}`]: increment(1),
  });
}

export function subscribeToConvos(uid, callback) {
  const q = query(collection(db, 'dms'), where('participants', 'array-contains', uid));
  return onSnapshot(q, (snap) => {
    const convos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    convos.sort((a, b) => (b.lastMessageAt?.toMillis?.() || 0) - (a.lastMessageAt?.toMillis?.() || 0));
    callback(convos);
  });
}

export function subscribeToMessages(convoId, callback) {
  const q = query(
    collection(db, 'dms', convoId, 'messages'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function markRead(convoId, uid) {
  try {
    await updateDoc(doc(db, 'dms', convoId), { [`unread.${uid}`]: 0 });
  } catch { /* ignore */ }
}
