import { useState, useEffect } from 'react';

const CACHE_KEY = 'spoilersafe_news_v3';
const CACHE_TTL = 3 * 60 * 60 * 1000;

// Fallback news shown when all fetch attempts fail
const FALLBACK_NEWS = [
  { id: 0, title: 'Demon Slayer: Kimetsu no Yaiba anuncia nueva temporada', link: 'https://www.animenewsnetwork.com', image: '', date: 'May 2025', category: 'Anime', summary: 'Ufotable confirma la continuación del arco del Hashira de la Luna Superior...', readTime: '3 min' },
  { id: 1, title: 'One Piece Film Red supera los 1.000 millones en taquilla mundial', link: 'https://www.animenewsnetwork.com', image: '', date: 'May 2025', category: 'Película', summary: 'La película de Eiichiro Oda se convierte en la más taquillera de la franquicia...', readTime: '2 min' },
  { id: 2, title: 'Attack on Titan: The Final Chapters recibe el Emmy Internacional', link: 'https://www.animenewsnetwork.com', image: '', date: 'May 2025', category: 'Premios', summary: 'MAPPA y Wit Studio son reconocidos por la conclusión épica de la serie...', readTime: '4 min' },
  { id: 3, title: 'Jujutsu Kaisen Season 3 estrena su primer tráiler oficial', link: 'https://www.animenewsnetwork.com', image: '', date: 'Abr 2025', category: 'Tráiler', summary: 'MAPPA revela imágenes del Torneo de Hechiceros de Tokio...', readTime: '2 min' },
  { id: 4, title: 'My Hero Academia: Team-Up Missions finaliza su publicación en Shonen Jump', link: 'https://www.animenewsnetwork.com', image: '', date: 'Abr 2025', category: 'Manga', summary: 'La serie spin-off cierra con 14 volúmenes tras cinco años de serialización...', readTime: '3 min' },
  { id: 5, title: 'Chainsaw Man Parte 2 confirma adaptación anime para 2026', link: 'https://www.animenewsnetwork.com', image: '', date: 'Mar 2025', category: 'Anime', summary: 'MAPPA regresa con el arco de la Académie du Diable de Fujimoto...', readTime: '3 min' },
  { id: 6, title: 'Vinland Saga Season 3 entra en producción', link: 'https://www.animenewsnetwork.com', image: '', date: 'Mar 2025', category: 'Anime', summary: 'MAPPA confirma la adaptación del arco del Nuevo Mundo...', readTime: '2 min' },
];

async function fetchFromProxy() {
  const ANN_RSS = 'https://www.animenewsnetwork.com/newsroom/rss.xml';
  const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(ANN_RSS)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error('proxy failed');
  const text = await res.text();
  const xml = new DOMParser().parseFromString(text, 'text/xml');
  const items = Array.from(xml.querySelectorAll('item')).slice(0, 20);
  if (items.length === 0) throw new Error('no items');
  return items.map((item, i) => {
    const title = item.querySelector('title')?.textContent?.trim() || '';
    const link = item.querySelector('link')?.textContent?.trim() || '';
    const pubDate = item.querySelector('pubDate')?.textContent || '';
    const desc = item.querySelector('description')?.textContent || '';
    const enclosure = item.querySelector('enclosure');
    const image = enclosure?.getAttribute('url') || '';
    const cats = Array.from(item.querySelectorAll('category')).map(c => c.textContent?.trim());
    const cleanDesc = desc.replace(/<[^>]*>?/gm, '').slice(0, 200).trim();
    const date = pubDate
      ? new Date(pubDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
    return { id: i, title, link, image, date, category: cats[0] || 'Anime', summary: cleanDesc ? cleanDesc + '…' : '', readTime: '3 min' };
  });
}

async function fetchFromRss2Json() {
  const encoded = encodeURIComponent('https://www.animenewsnetwork.com/newsroom/rss.xml');
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encoded}&count=20`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const json = await res.json();
  if (json.status !== 'ok' || !json.items?.length) throw new Error('rss2json failed');
  return json.items.map((item, i) => {
    const desc = item.description?.replace(/<[^>]*>?/gm, '').slice(0, 200).trim() || '';
    const date = item.pubDate
      ? new Date(item.pubDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
    return {
      id: i,
      title: item.title || '',
      link: item.link || '#',
      image: item.thumbnail || item.enclosure?.link || '',
      date,
      category: item.categories?.[0] || 'Anime',
      summary: desc ? desc + '…' : '',
      readTime: '3 min',
    };
  });
}

const News = () => {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.classList.remove('dark');

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL && data.length > 0) {
          setNewsData(data);
          setLoading(false);
          return;
        }
      } catch { /* corrupt cache */ }
    }

    const load = async () => {
      let data = null;
      try { data = await fetchFromProxy(); } catch { /* try next */ }
      if (!data) {
        try { data = await fetchFromRss2Json(); } catch { /* try next */ }
      }
      if (!data) {
        data = FALLBACK_NEWS;
      }
      setNewsData(data);
      if (data !== FALLBACK_NEWS) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      }
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const heroNews = newsData[0];
  const sideNews = newsData.slice(1, 3);
  const gridNews = newsData.slice(3);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-white border-b border-gray-200 py-8 mb-8">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
            ANIME NEWS
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Las últimas novedades del mundo otaku, directas a tu pantalla.</p>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8">
        {/* Hero */}
        <div className="flex flex-col lg:flex-row gap-6 mb-12">
          <a href={heroNews.link} target="_blank" rel="noopener noreferrer"
            className="lg:w-2/3 block group cursor-pointer relative overflow-hidden rounded-xl shadow-sm border border-gray-200 bg-gray-900">
            <div className="relative h-[400px] lg:h-[500px] w-full overflow-hidden bg-gray-900">
              {heroNews.image
                ? <img src={heroNews.image} alt={heroNews.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500" />
                : <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <span className="material-symbols-outlined text-8xl text-slate-700">newsmode</span>
                  </div>
              }
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full z-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">{heroNews.category}</span>
                <span className="text-gray-300 text-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">schedule</span> {heroNews.date}
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 group-hover:text-primary transition-colors line-clamp-3">{heroNews.title}</h2>
              <p className="text-gray-300 text-base md:text-lg line-clamp-2 max-w-3xl">{heroNews.summary}</p>
            </div>
          </a>

          <div className="lg:w-1/3 flex flex-col gap-6">
            {sideNews.map(news => (
              <a href={news.link} target="_blank" rel="noopener noreferrer" key={news.id}
                className="block group cursor-pointer bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                <div className="relative h-48 w-full overflow-hidden">
                  {news.image
                    ? <img src={news.image} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-slate-600">newsmode</span>
                      </div>
                  }
                  <div className="absolute top-3 left-3 bg-gray-900/80 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider backdrop-blur-sm">{news.category}</div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">{news.title}</h3>
                  <div className="flex items-center gap-4 mt-auto pt-4 text-sm text-gray-500 font-medium">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">calendar_today</span>{news.date}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">menu_book</span>{news.readTime}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap">Más Noticias de Anime</h2>
          <div className="h-px w-full bg-gray-300" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {gridNews.map(news => (
            <a href={news.link} target="_blank" rel="noopener noreferrer" key={news.id}
              className="block group cursor-pointer bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="relative h-40 w-full overflow-hidden">
                {news.image
                  ? <img src={news.image} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl text-slate-600">newsmode</span>
                    </div>
                }
                <div className="absolute top-2 left-2 bg-gray-900/80 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{news.category}</div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">{news.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-1">{news.summary}</p>
                <span className="text-xs text-gray-400 font-bold uppercase">{news.date}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default News;
