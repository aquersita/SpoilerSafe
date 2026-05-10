import { collection, getDocs, query, orderBy, limit, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getNews } from './newsService';

// AniList API helper for recent releases
async function gql(query, variables = {}) {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

async function getRecentAniList() {
  const q = `
    query {
      anime: Page(perPage: 2) {
        media(type: ANIME, sort: START_DATE_DESC, status: RELEASING) {
          id title { romaji } coverImage { large } format
        }
      }
      manga: Page(perPage: 2) {
        media(type: MANGA, sort: START_DATE_DESC, status: RELEASING) {
          id title { romaji } coverImage { large } format
        }
      }
      episodes: Page(perPage: 2) {
        airingSchedules(sort: TIME_DESC) {
          episode
          media { id title { romaji } coverImage { large } format }
        }
      }
    }
  `;
  try {
    const data = await gql(q);
    const notifications = [];
    
    // Anime
    data.data?.anime?.media?.forEach(m => {
      notifications.push({
        id: `ani_${m.id}`,
        type: 'anime',
        title: 'Nuevo Estreno Anime',
        body: m.title.romaji,
        image: m.coverImage.large,
        link: `/anime/${m.id}`,
        date: Date.now() - 3600000, // Make it look a bit recent
        isGlobal: true,
      });
    });

    // Manga
    data.data?.manga?.media?.forEach(m => {
      notifications.push({
        id: `man_${m.id}`,
        type: 'manga',
        title: 'Nuevo Manga',
        body: m.title.romaji,
        image: m.coverImage.large,
        link: `/manga/${m.id}`,
        date: Date.now() - 7200000,
        isGlobal: true,
      });
    });

    // Episodes
    data.data?.episodes?.airingSchedules?.forEach(sch => {
      notifications.push({
        id: `ep_${sch.media.id}_${sch.episode}`,
        type: 'episode',
        title: `Nuevo Episodio: ${sch.episode}`,
        body: sch.media.title.romaji,
        image: sch.media.coverImage.large,
        link: `/anime/${sch.media.id}`,
        date: Date.now() - 1800000,
        isGlobal: true,
      });
    });

    return notifications;
  } catch (err) {
    return [];
  }
}

export async function getNotifications(uid) {
  const allNotifs = [];

  // 1. Unread DMs
  if (uid) {
    try {
      const dmQ = query(collection(db, 'dms'), where('participants', 'array-contains', uid));
      const dmSnap = await getDocs(dmQ);
      dmSnap.docs.forEach(d => {
        const data = d.data();
        if (data.unread && data.unread[uid] > 0) {
           const otherUid = data.participants.find(p => p !== uid);
           allNotifs.push({
             id: `dm_${d.id}`,
             type: 'message',
             title: 'Nuevos Mensajes',
             body: `${data.usernames[otherUid]} te ha enviado ${data.unread[uid]} mensaje(s)`,
             image: data.avatars[otherUid] || 'https://www.crunchyroll.com/i/beta/avatar/cr_gray.png',
             link: `/messages/${data.usernames[otherUid]}`,
             date: data.lastMessageAt?.toMillis?.() || Date.now(),
             read: false,
           });
        }
      });
    } catch (e) { console.error('DMs err', e); }

    // 2. User specific notifications (Followers)
    try {
      const notifQ = query(collection(db, 'users', uid, 'notifications'), orderBy('createdAt', 'desc'), limit(15));
      const nSnap = await getDocs(notifQ);
      nSnap.docs.forEach(d => {
        const data = d.data();
        allNotifs.push({
          id: d.id,
          type: data.type || 'info',
          title: data.title,
          body: data.body,
          image: data.image || 'https://www.crunchyroll.com/i/beta/avatar/cr_gray.png',
          link: data.link,
          date: data.createdAt?.toMillis?.() || Date.now(),
          read: data.read,
          docId: d.id // for marking read
        });
      });
    } catch (e) { console.error('User notif err', e); }
  }

  // 3. News
  try {
    const news = await getNews();
    if (news && news.length > 0) {
      news.slice(0, 2).forEach(n => {
        allNotifs.push({
          id: `news_${n.id}`,
          type: 'news',
          title: 'Nueva Noticia',
          body: n.title,
          image: n.image,
          link: '/news',
          date: n.pubDateRaw ? new Date(n.pubDateRaw).getTime() : Date.now(),
          isGlobal: true,
        });
      });
    }
  } catch(e) { console.error('News notif err', e); }

  // 4. AniList recent (Anime, Manga, Eps)
  const aniNotifs = await getRecentAniList();
  allNotifs.push(...aniNotifs);

  // Sort all by date descending
  allNotifs.sort((a, b) => b.date - a.date);

  return allNotifs;
}

export async function markNotificationRead(uid, docId) {
  try {
    await updateDoc(doc(db, 'users', uid, 'notifications', docId), { read: true });
  } catch (e) { console.error(e); }
}
