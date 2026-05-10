const CACHE_KEY = 'spoilersafe_news_v4';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const FALLBACK_NEWS = [
  { id: 0, title: 'Demon Slayer: Kimetsu no Yaiba anuncia nueva temporada', link: 'https://www.animenewsnetwork.com', image: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg', date: 'May 2025', category: 'Anime', summary: 'Ufotable confirma la continuación del arco del Hashira de la Luna Superior.', readTime: '3 min' },
  { id: 1, title: 'One Piece Film Red supera los 1.000 millones en taquilla mundial', link: 'https://www.animenewsnetwork.com', image: 'https://cdn.myanimelist.net/images/anime/1244/122947.jpg', date: 'May 2025', category: 'Película', summary: 'La película de Eiichiro Oda se convierte en la más taquillera de la franquicia.', readTime: '2 min' },
  { id: 2, title: 'Attack on Titan: The Final Chapters recibe el Emmy Internacional', link: 'https://www.animenewsnetwork.com', image: 'https://cdn.myanimelist.net/images/anime/1268/131930.jpg', date: 'May 2025', category: 'Premios', summary: 'MAPPA y Wit Studio son reconocidos por la conclusión épica de la serie.', readTime: '4 min' },
  { id: 3, title: 'Jujutsu Kaisen Season 3 estrena su primer tráiler oficial', link: 'https://www.animenewsnetwork.com', image: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg', date: 'Abr 2025', category: 'Tráiler', summary: 'MAPPA revela imágenes del Torneo de Hechiceros de Tokio.', readTime: '2 min' },
  { id: 4, title: 'My Hero Academia: Team-Up Missions finaliza su publicación en Shonen Jump', link: 'https://www.animenewsnetwork.com', image: 'https://cdn.myanimelist.net/images/anime/10/78745.jpg', date: 'Abr 2025', category: 'Manga', summary: 'La serie spin-off cierra con 14 volúmenes tras cinco años de serialización.', readTime: '3 min' },
  { id: 5, title: 'Chainsaw Man Parte 2 confirma adaptación anime para 2026', link: 'https://www.animenewsnetwork.com', image: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg', date: 'Mar 2025', category: 'Anime', summary: 'MAPPA regresa con el arco de la Académie du Diable de Fujimoto.', readTime: '3 min' },
  { id: 6, title: 'Vinland Saga Season 3 entra en producción', link: 'https://www.animenewsnetwork.com', image: 'https://cdn.myanimelist.net/images/anime/1773/138959.jpg', date: 'Mar 2025', category: 'Anime', summary: 'MAPPA confirma la adaptación del arco del Nuevo Mundo.', readTime: '2 min' },
];

function extractImgFromHtml(html) {
  const m = html?.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : '';
}

async function fetchFromRss2Json() {
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://www.animenewsnetwork.com/newsroom/rss.xml')}&count=20`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const json = await res.json();
  if (json.status !== 'ok' || !json.items?.length) throw new Error('rss2json failed');
  return json.items.map((item, i) => {
    const raw = item.description || '';
    const image = item.thumbnail || item.enclosure?.link || item.enclosure?.url || extractImgFromHtml(raw);
    const cleanDesc = raw.replace(/<[^>]*>?/gm, '').slice(0, 200).trim();
    const date = item.pubDate
      ? new Date(item.pubDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
    return { id: i, title: item.title || '', link: item.link || '#', image, date, category: item.categories?.[0] || 'Anime', summary: cleanDesc ? cleanDesc + '…' : '', readTime: '3 min', pubDateRaw: item.pubDate };
  });
}

async function fetchFromProxy() {
  const url = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://www.animenewsnetwork.com/newsroom/rss.xml')}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error('proxy failed');
  const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
  const items = Array.from(xml.querySelectorAll('item')).slice(0, 20);
  if (!items.length) throw new Error('no items');
  return items.map((item, i) => {
    const title = item.querySelector('title')?.textContent?.trim() || '';
    const link = item.querySelector('link')?.textContent?.trim() || '';
    const pubDate = item.querySelector('pubDate')?.textContent || '';
    const desc = item.querySelector('description')?.textContent || '';
    // Namespace-aware: matches media:content / media:thumbnail in any namespace
    const mediaEl = item.getElementsByTagNameNS('*', 'content')[0] || item.getElementsByTagNameNS('*', 'thumbnail')[0];
    const enclosure = item.querySelector('enclosure');
    const image = mediaEl?.getAttribute('url') || enclosure?.getAttribute('url') || extractImgFromHtml(desc);
    const cats = Array.from(item.querySelectorAll('category')).map(c => c.textContent?.trim());
    const cleanDesc = desc.replace(/<[^>]*>?/gm, '').slice(0, 200).trim();
    const date = pubDate
      ? new Date(pubDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
    return { id: i, title, link, image, date, category: cats[0] || 'Anime', summary: cleanDesc ? cleanDesc + '…' : '', readTime: '3 min', pubDateRaw: pubDate };
  });
}

export function readCachedNews() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (!Array.isArray(data) || data.length === 0) return null;
    if (Date.now() - timestamp >= CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

export async function getNews() {
  const cached = readCachedNews();
  if (cached) return cached;
  
  let data = null;
  try { data = await fetchFromRss2Json(); } catch { /* try next */ }
  if (!data) { try { data = await fetchFromProxy(); } catch { /* fallback */ } }
  
  if (!data) data = FALLBACK_NEWS;
  if (data !== FALLBACK_NEWS) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  }
  return data;
}
