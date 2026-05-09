import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';

const GAMES = [
  {
    id: 1,
    title: 'Genshin Impact',
    genre: 'Action RPG',
    short_description: 'Explora el vasto mundo de Teyvat, domina los poderes elementales y vive aventuras épicas en este RPG de mundo abierto.',
    thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/1452130/header.jpg',
    game_url: 'https://genshin.hoyoverse.com',
    platform: 'PC',
  },
  {
    id: 2,
    title: 'Honkai: Star Rail',
    genre: 'RPG por Turnos',
    short_description: 'Embárcate en un viaje espacial por galaxias llenas de misterios en este RPG por turnos de HoYoverse.',
    thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/1414411/header.jpg',
    game_url: 'https://hsr.hoyoverse.com',
    platform: 'PC',
  },
  {
    id: 3,
    title: 'Tower of Fantasy',
    genre: 'MMORPG',
    short_description: 'MMORPG de ciencia ficción con mundo abierto, combate dinámico y personalización de personaje extrema.',
    thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/2026810/header.jpg',
    game_url: 'https://www.toweroffantasy-global.com',
    platform: 'PC',
  },
  {
    id: 4,
    title: 'MapleStory',
    genre: 'MMORPG 2D',
    short_description: 'El clásico MMORPG 2D de anime con más de 40 clases jugables y eventos continuos desde 2003.',
    thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/216150/header.jpg',
    game_url: 'https://maplestory.nexon.net',
    platform: 'PC',
  },
  {
    id: 5,
    title: 'Aura Kingdom',
    genre: 'MMORPG',
    short_description: 'MMORPG de fantasía anime con gráficos coloridos y sistema de compañeros llamados Eidolones.',
    thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/315090/header.jpg',
    game_url: 'https://aurakingdom.aeriagames.com',
    platform: 'PC',
  },
  {
    id: 6,
    title: 'Elsword',
    genre: 'Action RPG',
    short_description: "Beat'em up de acción con personajes de anime y un sistema de combate frenético en tiempo real.",
    thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/227210/header.jpg',
    game_url: 'https://els.nexon.com',
    platform: 'PC',
  },
  {
    id: 7,
    title: 'Closers',
    genre: 'Action RPG',
    short_description: 'Combates 2.5D llenos de acción con personajes de anime estilo manhwa en escenarios urbanos.',
    thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/400130/header.jpg',
    game_url: 'https://closers.nexon.com',
    platform: 'PC',
  },
  {
    id: 8,
    title: 'Phantasy Star Online 2',
    genre: 'MMORPG',
    short_description: 'El legendario MMORPG de SEGA con combate de acción, personalización masiva y mundos de ciencia ficción.',
    thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/1118650/header.jpg',
    game_url: 'https://pso2.com',
    platform: 'PC',
  },
  {
    id: 9,
    title: 'Zenless Zone Zero',
    genre: 'Action RPG',
    short_description: 'Nuevo RPG de acción urbana de HoYoverse con estilo visual único y combate veloz.',
    thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/2406630/header.jpg',
    game_url: 'https://zenless.hoyoverse.com',
    platform: 'PC',
  },
  {
    id: 10,
    title: 'Blue Archive',
    genre: 'RPG Estrategia',
    short_description: 'RPG de estrategia con estudiantes de escuela en un futuro cercano. Gráficos anime de alta calidad.',
    thumbnail: 'https://cdn.akamai.steamstatic.com/steam/apps/1967090/header.jpg',
    game_url: 'https://bluearchive.nexon.com',
    platform: 'PC',
  },
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
    } catch {
      /* silent */
    }
  };

  return (
    <div className="min-h-screen bg-background-light pb-12">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-bold text-white transition-all ${
          toast.success ? 'bg-green-600' : 'bg-red-500'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Hero Section */}
      <div className="relative w-full h-[40vh] bg-indigo-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-indigo-900/80 to-transparent z-10"></div>
        <img
          src={GAMES[0].thumbnail}
          alt="Hero"
          className="absolute right-0 top-0 w-full md:w-2/3 h-full object-cover opacity-30 blur-sm"
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
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-indigo-500 block rounded-full"></span>
          Juegos Gratuitos
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {GAMES.map(game => (
            <div key={game.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col">
              <div className="relative aspect-video">
                <img
                  src={game.thumbnail}
                  alt={game.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="absolute top-2 right-2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow uppercase">
                  {game.genre}
                </div>
                {profile && (
                  <div className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">stars</span>
                    +5 XP
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{game.title}</h3>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-1">{game.short_description}</p>

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
