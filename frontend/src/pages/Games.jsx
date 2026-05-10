import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Steam CDN: cdn.akamai.steamstatic.com/steam/apps/{appId}/header.jpg
const S = (id) => `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`;

const GAMES = [
  { id: 1,  title: 'Genshin Impact',          genre: 'Action RPG',      platform: 'PC', game_url: 'https://genshin.hoyoverse.com',           thumbnail: S(1452130),  short_description: 'Explora el vasto mundo de Teyvat, domina los poderes elementales y vive aventuras épicas en este RPG de mundo abierto.' },
  { id: 2,  title: 'Honkai: Star Rail',        genre: 'RPG por Turnos',  platform: 'PC', game_url: 'https://hsr.hoyoverse.com',               thumbnail: S(1286830),  short_description: 'Embárcate en un viaje espacial por galaxias llenas de misterios en este RPG por turnos de HoYoverse.' },
  { id: 3,  title: 'Zenless Zone Zero',        genre: 'Action RPG',      platform: 'PC', game_url: 'https://zenless.hoyoverse.com',           thumbnail: S(2406630),  short_description: 'RPG de acción urbana de HoYoverse con estilo visual único, combate veloz y narrativa de ciudad hollowed.' },
  { id: 4,  title: 'Lost Ark',                 genre: 'MMORPG',          platform: 'PC', game_url: 'https://www.playlostark.com',             thumbnail: S(1599340),  short_description: 'MMORPG isométrico de acción con combate fluido, mundos masivos y contenido endgame muy completo.' },
  { id: 5,  title: 'Tower of Fantasy',         genre: 'MMORPG',          platform: 'PC', game_url: 'https://www.toweroffantasy-global.com',  thumbnail: S(2026810),  short_description: 'MMORPG de ciencia ficción con mundo abierto, combate dinámico y personalización de personaje extrema.' },
  { id: 6,  title: 'MapleStory',               genre: 'MMORPG 2D',       platform: 'PC', game_url: 'https://maplestory.nexon.net',           thumbnail: S(216150),   short_description: 'El clásico MMORPG 2D de anime con más de 40 clases jugables y eventos continuos desde 2003.' },
  { id: 7,  title: 'Warframe',                 genre: 'Action RPG',      platform: 'PC', game_url: 'https://www.warframe.com',               thumbnail: S(230410),   short_description: 'Shooter de acción frenético con ninjas espaciales, gran variedad de warframes y cooperativo online.' },
  { id: 8,  title: 'Vindictus',                genre: 'Action MMORPG',   platform: 'PC', game_url: 'https://vindictus.nexon.net',            thumbnail: S(212160),   short_description: 'MMORPG de acción con física realista, combate cuerpo a cuerpo brutal y jefes masivos.' },
  { id: 9,  title: 'Elsword',                  genre: 'Action RPG',      platform: 'PC', game_url: 'https://els.nexon.com',                  thumbnail: S(227210),   short_description: "Beat'em up de acción con personajes de anime y un sistema de combate frenético en tiempo real." },
  { id: 10, title: 'Aura Kingdom',             genre: 'MMORPG',          platform: 'PC', game_url: 'https://aurakingdom.aeriagames.com',     thumbnail: S(315090),   short_description: 'MMORPG de fantasía anime con gráficos coloridos y sistema de compañeros llamados Eidolones.' },
  { id: 11, title: 'Grand Chase',              genre: 'Action RPG',      platform: 'PC', game_url: 'https://www.grandchase.com',             thumbnail: S(1148310),  short_description: 'RPG de acción con personajes icónicos del universo Grand Chase, modos PvP y PvE.' },
  { id: 12, title: 'Dragon Nest',              genre: 'Action MMORPG',   platform: 'PC', game_url: 'https://www.dragonnest.com',             thumbnail: S(213210),   short_description: 'MMORPG de acción veloz con dungeons cooperativos, estilos de combate únicos y estética anime.' },
  { id: 13, title: 'Phantasy Star Online 2',   genre: 'MMORPG',          platform: 'PC', game_url: 'https://pso2.com',                       thumbnail: S(1118650),  short_description: 'El legendario MMORPG de SEGA con combate de acción, personalización masiva y mundos de ciencia ficción.' },
  { id: 14, title: 'SoulWorker',               genre: 'Action RPG',      platform: 'PC', game_url: 'https://soulworker.en.gameforge.com',   thumbnail: S(630100),   short_description: 'Action RPG anime con jóvenes guerreros que luchan contra monstruos en mundos postapocalípticos.' },
  { id: 15, title: 'Closers',                  genre: 'Action RPG',      platform: 'PC', game_url: 'https://closers.nexon.com',             thumbnail: S(578280),   short_description: 'Combates 2.5D llenos de acción con personajes de anime estilo manhwa en escenarios urbanos.' },
  { id: 16, title: 'Blue Protocol',            genre: 'MMORPG',          platform: 'PC', game_url: 'https://blue-protocol.com',             thumbnail: S(2515640),  short_description: 'MMORPG anime de Bandai Namco con un mundo vibrante, combate en tiempo real y una historia épica.' },
];

const Games = () => {
  const { firebaseUser, profile } = useAuth();
  const [toast, setToast] = useState(null);

  const showToast = (msg, success = true) => {
    setToast({ msg, success });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePlay = async (game) => {
    window.open(game.game_url, '_blank', 'noreferrer');
    if (!firebaseUser?.uid) return;
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        'stats.games_played': increment(1),
      });
      showToast(`¡+5 XP por jugar ${game.title}!`);
    } catch { /* silent */ }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-12">
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-bold text-white transition-all ${
          toast.success ? 'bg-green-600' : 'bg-red-500'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Hero */}
      <div className="relative w-full h-[40vh] bg-indigo-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-indigo-900/80 to-transparent z-10" />
        <img
          src={GAMES[0].thumbnail}
          alt="Hero"
          className="absolute right-0 top-0 w-full md:w-2/3 h-full object-cover opacity-30 blur-sm"
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="relative z-20 max-w-[1600px] mx-auto px-4 md:px-8 h-full flex flex-col justify-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4" style={{ fontFamily: "'Arial Black', sans-serif" }}>
            ZONA GAMING
          </h1>
          <p className="text-indigo-200 max-w-xl text-lg mb-2">
            Descubre juegos gratuitos estilo anime y MMORPGs para disfrutar con la comunidad de SpoilerSafe.
          </p>
          {profile && (
            <p className="text-indigo-300 text-sm font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">stars</span>
              Gana +5 XP cada vez que juegas
            </p>
          )}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 mt-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-indigo-500 block rounded-full" />
          Juegos Gratuitos
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {GAMES.map(game => (
            <div key={game.id} className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-gray-800 flex flex-col">
              <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-indigo-900">
                {/* Gradient is always the background; img renders on top and hides itself on error */}
                <img
                  src={game.thumbnail}
                  alt={game.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="absolute top-2 right-2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow uppercase z-10">
                  {game.genre}
                </div>
                {profile && (
                  <div className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow flex items-center gap-1 z-10">
                    <span className="material-symbols-outlined text-[12px]">stars</span>
                    +5 XP
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{game.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-1">{game.short_description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">desktop_windows</span>
                    {game.platform}
                  </span>
                  <button
                    onClick={() => handlePlay(game)}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold py-1.5 px-3 rounded text-xs transition-colors"
                  >
                    Jugar Gratis
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Games;
