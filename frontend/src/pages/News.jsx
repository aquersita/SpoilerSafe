import { useState, useEffect } from 'react';

import { getNews, readCachedNews } from '../services/newsService';

// Renders image over a gradient background; hides the <img> on error so gradient shows
const NewsImg = ({ src, alt, className }) => (
  <>
    {src && (
      <img
        src={src} alt={alt} className={className}
        referrerPolicy="no-referrer"
        onError={e => { e.currentTarget.style.display = 'none'; }}
      />
    )}
  </>
);

// ... readCache moved to newsService

const News = () => {
  // Lazy initial state — runs once before first render, so a fresh tab with a
  // warm cache shows news immediately instead of flashing a spinner.
  const [newsData, setNewsData] = useState(() => readCachedNews() || []);
  const [loading, setLoading]   = useState(() => readCachedNews() === null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (newsData.length > 0) return; // cache hit — skip fetch entirely

    let cancelled = false;
    (async () => {
      const data = await getNews();
      if (cancelled) return;
      setNewsData(data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-800/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  const heroNews = newsData[0];
  const sideNews = newsData.slice(1, 3);
  const gridNews = newsData.slice(3);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800/50 pb-16">
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 py-8 mb-8">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
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
            <div className="relative h-[400px] lg:h-[500px] w-full overflow-hidden">
              {/* Gradient always visible as background */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <span className="material-symbols-outlined text-8xl text-slate-700 dark:text-slate-300">newsmode</span>
              </div>
              <NewsImg src={heroNews.image} alt={heroNews.title}
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500" />
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
                className="block group cursor-pointer bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                <div className="relative h-48 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-slate-600 dark:text-slate-400">newsmode</span>
                  </div>
                  <NewsImg src={news.image} alt={news.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 bg-gray-900/80 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider backdrop-blur-sm z-10">{news.category}</div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors line-clamp-2">{news.title}</h3>
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
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">Más Noticias de Anime</h2>
          <div className="h-px w-full bg-gray-300" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {gridNews.map(news => (
            <a href={news.link} target="_blank" rel="noopener noreferrer" key={news.id}
              className="block group cursor-pointer bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="relative h-40 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-slate-600 dark:text-slate-400">newsmode</span>
                </div>
                <NewsImg src={news.image} alt={news.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2 left-2 bg-gray-900/80 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider z-10">{news.category}</div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors line-clamp-2">{news.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 flex-1">{news.summary}</p>
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
