import {
  collection, addDoc, getDocs, doc, updateDoc, arrayUnion, increment,
  query, where, orderBy, serverTimestamp, getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function getComments(mediaType, mediaId, episodeNum = null) {
  const constraints = [
    where('media_type', '==', mediaType),
    where('media_id', '==', String(mediaId)),
  ];
  if (episodeNum != null) constraints.push(where('episode_num', '==', episodeNum));
  constraints.push(orderBy('created_at', 'asc'));

  const snap = await getDocs(query(collection(db, 'comments'), ...constraints));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function postComment(uid, username, avatarUrl, mediaType, mediaId, content, isSpoiler, episodeNum = null) {
  const ref = await addDoc(collection(db, 'comments'), {
    uid,
    username,
    avatar_url: avatarUrl || '',
    media_type: mediaType,
    media_id: String(mediaId),
    episode_num: episodeNum,
    content,
    is_spoiler: isSpoiler,
    likes: 0,
    liked_by: [],
    reports: 0,
    reported_by: [],
    created_at: serverTimestamp(),
  });
  // bump comment count in user doc
  try {
    await updateDoc(doc(db, 'users', uid), { 'stats.comments': increment(1) });
  } catch { /* ignore if user doc doesn't have stats yet */ }
  return ref;
}

export async function likeComment(uid, commentId) {
  const ref = doc(db, 'comments', commentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  if ((data.liked_by || []).includes(uid)) return;
  await updateDoc(ref, { likes: increment(1), liked_by: arrayUnion(uid) });
}
