import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HERO_SLIDES = [
    {
        id: 101922, ep: 1,
        badge: 'Nuevos Episodios', badgeColor: 'bg-primary',
        genres: 'Shonen · Acción',
        desc: 'Tanjiro Kamado vive una vida modesta pero feliz en las montañas con su familia. Un día regresa a casa para encontrar a su familia masacrada por un demonio.',
        banner: 'https://image.tmdb.org/t/p/original/b9PEZeiSu1Ux2oweuoaeHmpaFIC.jpg',
        titleNode: (
            <h1 className="text-6xl md:text-8xl text-white leading-tight tracking-tighter font-demonslayer uppercase drop-shadow-2xl"
                style={{ textShadow: '0 4px 24px rgba(0,0,0,0.7)' }}>
                DEMON<br /><span className="text-primary">SLAYER</span>
            </h1>
        ),
    },
    {
        id: 16498, ep: 1, title: 'Attack on Titan',
        badge: 'Serie Épica', badgeColor: 'bg-gray-600',
        genres: 'Acción · Drama · Dark',
        desc: 'En un mundo donde la humanidad sobrevive dentro de enormes murallas para protegerse de gigantes devoradores, un joven jura venganza absoluta.',
        banner: 'https://media.kitsu.app/anime/cover_images/7442/large.jpg',
    },
    {
        id: 113415, ep: 1, title: 'Jujutsu Kaisen',
        badge: 'Temporada 2', badgeColor: 'bg-blue-600',
        genres: 'Acción · Sobrenatural',
        desc: 'Yuji Itadori engulle un dedo maldito para proteger a sus compañeros y queda atrapado en el mundo de los hechiceros y las maldiciones.',
        banner: 'https://media.kitsu.app/anime/cover_images/42765/large.jpg',
    },
    {
        id: 21, ep: 1, title: 'One Piece',
        badge: 'En Emisión', badgeColor: 'bg-green-600',
        genres: 'Aventura · Piratas',
        desc: 'Monkey D. Luffy sueña con encontrar el tesoro más grande del mundo y convertirse en el Rey de los Piratas junto a su tripulación legendaria.',
        banner: 'https://media.kitsu.app/anime/12/cover_image/large-3e72f400a87b5241780c5082f0582611.jpeg',
    },
    {
        id: 146065, ep: 1, title: 'Chainsaw Man',
        badge: 'Recomendado', badgeColor: 'bg-red-700',
        genres: 'Acción · Dark · Shonen',
        desc: 'Denji, un joven cazador de demonios agobiado por deudas, fusiona su cuerpo con el demonio Pochita y se convierte en el temido Chainsaw Man.',
        banner: 'https://media.kitsu.app/anime/43806/poster_image/large-815d6008fb3b56f4291b9f0ffa05cd8f.jpeg',
    },
];

const GENRE_ROWS = [
    {
        title: 'Acción', icon: 'local_fire_department',
        items: [
            { id: 16498,  title: 'Attack on Titan' },
            { id: 113415, title: 'Jujutsu Kaisen' },
            { id: 146065, title: 'Chainsaw Man' },
            { id: 269,    title: 'Bleach' },
            { id: 1735,   title: 'Naruto Shippuden' },
            { id: 97940,  title: 'Black Clover' },
            { id: 21459,  title: 'My Hero Academia' },
            { id: 813,    title: 'Dragon Ball Z' },
            { id: 101922, title: 'Demon Slayer' },
            { id: 140960, title: 'Spy x Family' },
            { id: 21087,  title: 'One Punch Man' },
            { id: 21507,  title: 'Mob Psycho 100' },
            { id: 101348, title: 'Vinland Saga' },
            { id: 6702,   title: 'Fairy Tail' },
            { id: 21175,  title: 'Dragon Ball Super' },
            { id: 120120, title: 'Tokyo Revengers' },
            { id: 20613,  title: 'Akame ga Kill' },
            { id: 20755,  title: 'Assassination Classroom' },
            { id: 11757,  title: 'Sword Art Online' },
            { id: 45,     title: 'Rurouni Kenshin' },
        ],
    },
    {
        title: 'Aventura', icon: 'explore',
        items: [
            { id: 21,     title: 'One Piece' },
            { id: 11061,  title: 'Hunter x Hunter' },
            { id: 5114,   title: 'FMA: Brotherhood' },
            { id: 153518, title: 'Dungeon Meshi' },
            { id: 153288, title: 'Kaiju No. 8' },
            { id: 20,     title: 'Naruto' },
            { id: 151807, title: 'Solo Leveling' },
            { id: 1535,   title: 'Death Note' },
            { id: 101280, title: 'Slime Isekai' },
            { id: 20832,  title: 'Overlord' },
            { id: 99263,  title: 'The Rising of the Shield Hero' },
            { id: 105333, title: 'Dr. Stone' },
            { id: 101759, title: 'The Promised Neverland' },
            { id: 108465, title: 'Mushoku Tensei' },
            { id: 115230, title: 'Tower of God' },
            { id: 97986,  title: 'Made in Abyss' },
            { id: 21355,  title: 'Re:Zero' },
            { id: 20464,  title: 'Haikyuu!!' },
        ],
    },
    {
        title: 'Shonen', icon: 'bolt',
        items: [
            { id: 20,     title: 'Naruto' },
            { id: 21,     title: 'One Piece' },
            { id: 813,    title: 'Dragon Ball Z' },
            { id: 101922, title: 'Demon Slayer' },
            { id: 113415, title: 'Jujutsu Kaisen' },
            { id: 21459,  title: 'My Hero Academia' },
            { id: 97940,  title: 'Black Clover' },
            { id: 11061,  title: 'Hunter x Hunter' },
            { id: 151801, title: 'Mashle' },
            { id: 269,    title: 'Bleach' },
            { id: 21087,  title: 'One Punch Man' },
            { id: 21507,  title: 'Mob Psycho 100' },
            { id: 20464,  title: 'Haikyuu!!' },
            { id: 3588,   title: 'Soul Eater' },
            { id: 9919,   title: 'Blue Exorcist' },
            { id: 20755,  title: 'Assassination Classroom' },
            { id: 6702,   title: 'Fairy Tail' },
            { id: 105333, title: 'Dr. Stone' },
            { id: 20447,  title: 'Noragami' },
            { id: 11757,  title: 'Sword Art Online' },
        ],
    },
    {
        title: 'Romance & Comedia', icon: 'favorite',
        items: [
            { id: 140960, title: 'Spy x Family' },
            { id: 101921, title: 'Kaguya-sama' },
            { id: 4224,   title: 'Toradora' },
            { id: 21202,  title: 'KonoSuba' },
            { id: 20665,  title: 'Tu Mentira en Abril' },
            { id: 9253,   title: 'Steins;Gate' },
            { id: 2167,   title: 'Clannad' },
            { id: 153518, title: 'Dungeon Meshi' },
            { id: 124080, title: 'Horimiya' },
            { id: 132405, title: 'My Dress-Up Darling' },
            { id: 105334, title: 'Fruits Basket' },
            { id: 18897,  title: 'Nisekoi' },
            { id: 113813, title: 'Rent-a-Girlfriend' },
            { id: 20668,  title: 'Monthly Girls Nozaki-kun' },
            { id: 21355,  title: 'Re:Zero' },
            { id: 853,    title: 'Ouran HSHC' },
        ],
    },
    {
        title: 'Dark & Thriller', icon: 'nightlight',
        items: [
            { id: 1535,   title: 'Death Note' },
            { id: 20605,  title: 'Tokyo Ghoul' },
            { id: 16498,  title: 'Attack on Titan' },
            { id: 146065, title: 'Chainsaw Man' },
            { id: 20623,  title: 'Parasyte' },
            { id: 5114,   title: 'FMA: Brotherhood' },
            { id: 97986,  title: 'Made in Abyss' },
            { id: 9253,   title: 'Steins;Gate' },
            { id: 101348, title: 'Vinland Saga' },
            { id: 19,     title: 'Monster' },
            { id: 13601,  title: 'Psycho-Pass' },
            { id: 101759, title: 'The Promised Neverland' },
            { id: 777,    title: 'Hellsing Ultimate' },
            { id: 98460,  title: 'Devilman Crybaby' },
            { id: 20661,  title: 'Terror in Resonance' },
            { id: 934,    title: 'Higurashi' },
        ],
    },
    {
        title: 'Shoujo', icon: 'auto_awesome',
        items: [
            { id: 20665,  title: 'Tu Mentira en Abril' },
            { id: 2167,   title: 'Clannad' },
            { id: 4224,   title: 'Toradora' },
            { id: 101921, title: 'Kaguya-sama' },
            { id: 1,      title: 'Cowboy Bebop' },
            { id: 9253,   title: 'Steins;Gate' },
            { id: 105334, title: 'Fruits Basket' },
            { id: 853,    title: 'Ouran HSHC' },
            { id: 530,    title: 'Sailor Moon' },
            { id: 232,    title: 'Cardcaptor Sakura' },
            { id: 21827,  title: 'Violet Evergarden' },
            { id: 877,    title: 'Nana' },
            { id: 20596,  title: 'Ao Haru Ride' },
            { id: 21067,  title: 'Akatsuki no Yona' },
            { id: 4722,   title: 'Skip Beat' },
        ],
    },
];

const AnimeRow = ({ title, icon, items, animeImages = {} }) => {
    const navigate = useNavigate();
    const rowRef = useRef(null);
    const scroll = (dir) => rowRef.current?.scrollBy({ left: dir * 640, behavior: 'smooth' });

    return (
        <div className="py-4">
            <div className="max-w-[1600px] mx-auto px-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-1 h-6 bg-primary block rounded-full flex-shrink-0" />
                    <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
                    <h2 className="text-xl md:text-2xl font-black text-gray-800 dark:text-gray-200" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                        {title}
                    </h2>
                </div>
                <div className="relative group">
                    <button
                        onClick={() => scroll(-1)}
                        className="absolute left-0 top-[40%] -translate-y-1/2 z-10 bg-white dark:bg-gray-900/90 dark:bg-gray-900/90 hover:bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-full shadow-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2"
                    >
                        <span className="material-icons">chevron_left</span>
                    </button>
                    <div ref={rowRef} className="flex overflow-x-auto gap-3 hide-scrollbar pb-2 scroll-smooth">
                        {items.map(a => (
                            <div
                                key={a.id}
                                onClick={() => navigate(`/anime/${a.id}`)}
                                className="flex-none w-[130px] sm:w-[145px] cursor-pointer group/card"
                            >
                                <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-sm mb-1.5">
                                    {animeImages[a.id] && (
                                        <img
                                            src={animeImages[a.id]}
                                            alt={a.title}
                                            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                                        <span className="material-icons text-white text-3xl opacity-0 group-hover/card:opacity-100 transition-opacity drop-shadow-lg">play_arrow</span>
                                    </div>
                                </div>
                                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2 group-hover/card:text-primary transition-colors leading-tight">{a.title}</h3>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => scroll(1)}
                        className="absolute right-0 top-[40%] -translate-y-1/2 z-10 bg-white dark:bg-gray-900/90 dark:bg-gray-900/90 hover:bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-full shadow-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2"
                    >
                        <span className="material-icons">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const Home = ({ popularAnime, isBackendUp, backendStatus }) => {
    const navigate = useNavigate();
    const destacadosRef = useRef(null);
    const [heroIndex, setHeroIndex] = useState(0);
    const [fading, setFading] = useState(false);
    // Imágenes confirmadas con hash Kitsu correcto — visibles de inmediato
    const [animeImages, setAnimeImages] = useState({
        101922: 'https://media.kitsu.app/anime/41370/poster_image/large-3de3cc6d2b33162c928de10aa201e4ba.jpeg',
        113415: 'https://media.kitsu.app/anime/42765/poster_image/large-5ce19551c1a6cf995b378205b9149b5c.jpeg',
        146065: 'https://media.kitsu.app/anime/43806/poster_image/large-815d6008fb3b56f4291b9f0ffa05cd8f.jpeg',
        813:    'https://media.kitsu.app/anime/720/poster_image/large-5cfc7e2756852e708c822df0a9f59871.jpeg',
        140960: 'https://media.kitsu.app/anime/45398/poster_image/large-c26c1e0b77e881fcd66475af6bd22c57.jpeg',
        151807: 'https://media.kitsu.app/anime/46231/poster_image/large-cdadff31f42490b9f48a035939a01a92.jpeg',
        153288: 'https://media.kitsu.app/anime/46300/poster_image/large-31cc66fd5854cc555d496ced7ab40c31.jpeg',
        153518: 'https://media.kitsu.app/anime/46320/poster_image/large-9d404bdee1ca826c60e32864e0502999.jpeg',
        151801: 'https://media.kitsu.app/anime/46229/poster_image/large-0089799807bf6cc3579a183b8338d789.jpeg',
    });

    const goToSlide = (idx) => {
        setFading(true);
        setTimeout(() => {
            setHeroIndex(idx);
            setFading(false);
        }, 350);
    };

    useEffect(() => {
        const genreIds = GENRE_ROWS.flatMap(r => r.items.map(i => i.id));
        const extraIds = [
            21, 113415, 1735, 97940, 269, 146065, 20605, 5114, 813, 1535,
            101922, 21459, 16498, 11061, 9253,
            140960, 153288, 151801, 151807, 153518,
        ];
        const allIds = [...new Set([...genreIds, ...extraIds])];

        const CHUNK = 15;
        const chunks = [];
        for (let i = 0; i < allIds.length; i += CHUNK) chunks.push(allIds.slice(i, i + CHUNK));

        const fetchChunk = async (ids) => {
            const q = ids.map(id =>
                `a${id}: Media(id: ${id}, type: ANIME) { id coverImage { extraLarge } }`
            ).join(' ');
            const res = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: `{ ${q} }` }),
            });
            return res.json();
        };

        // Fetch secuencial: un chunk a la vez para evitar rate limits
        (async () => {
            for (const chunk of chunks) {
                try {
                    const res = await fetchChunk(chunk);
                    if (!res.data) continue;
                    const imgs = {};
                    Object.values(res.data).forEach(m => {
                        if (m?.id && m?.coverImage?.extraLarge) imgs[m.id] = m.coverImage.extraLarge;
                    });
                    // Merge incremental para que las imágenes aparezcan a medida que llegan
                    setAnimeImages(prev => ({ ...prev, ...imgs }));
                } catch (err) {
                    console.error('AniList chunk error:', err);
                }
            }
        })();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setFading(true);
            setTimeout(() => {
                setHeroIndex(i => (i + 1) % HERO_SLIDES.length);
                setFading(false);
            }, 350);
        }, 7000);
        return () => clearInterval(timer);
    }, []);

    const slide = HERO_SLIDES[heroIndex];

    const scrollDestacados = (dir) => {
        destacadosRef.current?.scrollBy({ left: dir * 350, behavior: 'smooth' });
    };

    return (
        <React.Fragment>
            {/* ── HERO CARRUSEL ── */}
            <section className="relative w-full h-[85vh] overflow-hidden bg-gray-950">
                <img
                    key={heroIndex}
                    alt={slide.title || 'Hero'}
                    className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-60'}`}
                    src={slide.banner}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/75 to-transparent z-10" />
                <div className="absolute bottom-0 left-0 right-0 h-52 bg-gradient-to-t from-white via-white/60 to-transparent z-10" />

                <div className={`relative z-20 h-full max-w-[1600px] mx-auto px-8 flex flex-col justify-center transition-opacity duration-350 ${fading ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="w-full lg:w-1/2 space-y-5 mt-12 pl-4 md:pl-0 pb-32 md:pb-40">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                            <span className={`${slide.badgeColor || 'bg-primary'} text-white px-3 py-1 rounded-full uppercase tracking-wide`}>
                                {slide.badge}
                            </span>
                            <span className="text-gray-300 font-normal">{slide.genres}</span>
                        </div>

                        {slide.titleNode ? slide.titleNode : (
                            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight drop-shadow-2xl"
                                style={{ fontFamily: "'Arial Black', sans-serif", textShadow: '0 4px 24px rgba(0,0,0,0.7)' }}>
                                {slide.title}
                            </h1>
                        )}

                        <p className="text-gray-200 text-base md:text-lg leading-relaxed max-w-xl font-medium line-clamp-3 drop-shadow-lg">
                            {slide.desc}
                        </p>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={() => navigate(`/anime/${slide.id}/episode/${slide.ep}`)}
                                className="bg-primary hover:bg-orange-500 active:bg-orange-700 text-white font-black py-3 px-8 rounded-lg transition-all hover:scale-105 active:scale-100 flex items-center gap-2 uppercase tracking-wide shadow-lg shadow-primary/40"
                            >
                                <span className="material-icons text-xl">play_arrow</span>
                                Ver ahora
                            </button>
                            <button
                                onClick={() => navigate(`/anime/${slide.id}`)}
                                className="border-2 border-white/30 hover:border-white/70 text-white font-bold py-3 px-6 rounded-lg bg-white/10 dark:bg-gray-900/5 hover:bg-white/20 dark:hover:bg-gray-900/15 backdrop-blur-sm transition-all flex items-center gap-2 text-sm"
                            >
                                <span className="material-icons-outlined">info</span>
                                Más info
                            </button>
                        </div>
                    </div>
                </div>

                {/* Indicadores de slide */}
                <div className="absolute bottom-56 left-0 right-0 z-20 flex justify-center gap-2">
                    {HERO_SLIDES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goToSlide(i)}
                            className={`rounded-full transition-all duration-300 ${i === heroIndex ? 'bg-primary w-6 h-2' : 'bg-white dark:bg-gray-900/40 hover:bg-white dark:bg-gray-900/70 w-2 h-2'}`}
                        />
                    ))}
                </div>
            </section>

            {/* ── NOVEDADES ── */}
            <section className="py-8 bg-white dark:bg-gray-900 relative z-20 -mt-20 lg:-mt-32">
                <div className="max-w-[1600px] mx-auto px-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-gray-200 flex items-center gap-2 tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                            <span className="w-1 h-7 bg-primary block rounded-full" />
                            Novedades de la Temporada
                        </h2>
                        <button onClick={() => navigate('/new-releases')} className="text-sm font-bold text-primary hover:underline bg-transparent border-none cursor-pointer">Ver todo</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[
                            { id: 140960, title: 'Spy x Family',   genres: 'Comedia, Acción',         badge: 'PREMIUM', badgeColor: 'bg-primary' },
                            { id: 153288, title: 'Kaiju No. 8',    genres: 'Ciencia Ficción, Acción', badge: null,      badgeColor: null },
                            { id: 151801, title: 'Mashle',         genres: 'Fantasía, Comedia',       badge: 'DUB',     badgeColor: 'bg-orange-600' },
                            { id: 151807, title: 'Solo Leveling',  genres: 'Acción, Aventura',        badge: null,      badgeColor: null },
                            { id: 153518, title: 'Dungeon Meshi',  genres: 'Fantasía, Cocina',        badge: null,      badgeColor: null, hideMobile: true },
                        ].map(a => (
                            <div key={a.id} onClick={() => navigate(`/anime/${a.id}`)} className={`group cursor-pointer ${a.hideMobile ? 'hidden lg:block' : ''}`}>
                                <div className="relative overflow-hidden rounded-md shadow-md aspect-[2/3] bg-gray-200 dark:bg-gray-700">
                                    {animeImages[a.id] && (
                                        <img alt={a.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" src={animeImages[a.id]} />
                                    )}
                                    {a.badge && <div className={`absolute top-2 left-2 ${a.badgeColor} text-white text-[10px] font-bold px-2 py-0.5 rounded shadow`}>{a.badge}</div>}
                                </div>
                                <h3 className="font-bold text-gray-800 dark:text-gray-200 mt-2 truncate group-hover:text-primary transition-colors">{a.title}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{a.genres}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── DESTACADOS ── */}
            <section className="py-8 bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
                <div className="max-w-[1600px] mx-auto px-6">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-gray-200 flex items-center gap-2 tracking-tight mb-4" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                        <span className="w-1 h-7 bg-primary block rounded-full" />
                        Destacados para ti
                    </h2>
                    <div className="relative group">
                        <button
                            onClick={() => scrollDestacados(-1)}
                            className="absolute left-0 top-[40%] -translate-y-1/2 z-10 bg-white dark:bg-gray-900/90 dark:bg-gray-900/90 hover:bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-full shadow-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2"
                        >
                            <span className="material-icons">chevron_left</span>
                        </button>
                        <div ref={destacadosRef} className="flex overflow-x-auto gap-3 hide-scrollbar pb-2 scroll-smooth">
                            {[
                                { id: 101922, title: 'Demon Slayer' },
                                { id: 21,     title: 'One Piece' },
                                { id: 21459,  title: 'My Hero Academia' },
                                { id: 113415, title: 'Jujutsu Kaisen' },
                                { id: 16498,  title: 'Attack on Titan' },
                                { id: 11061,  title: 'Hunter x Hunter' },
                                { id: 1535,   title: 'Death Note' },
                                { id: 5114,   title: 'FMA: Brotherhood' },
                                { id: 146065, title: 'Chainsaw Man' },
                                { id: 9253,   title: 'Steins;Gate' },
                            ].map(a => (
                                <div key={a.id} onClick={() => navigate(`/anime/${a.id}`)} className="flex-none w-[130px] sm:w-[145px] cursor-pointer group/card">
                                    <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-sm mb-1.5">
                                        {animeImages[a.id] && (
                                            <img alt={a.title} src={animeImages[a.id]} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300" />
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                                            <span className="material-icons text-white text-3xl opacity-0 group-hover/card:opacity-100 transition-opacity drop-shadow-lg">play_arrow</span>
                                        </div>
                                    </div>
                                    <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2 group-hover/card:text-primary transition-colors leading-tight">{a.title}</h3>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => scrollDestacados(1)}
                            className="absolute right-0 top-[40%] -translate-y-1/2 z-10 bg-white dark:bg-gray-900/90 dark:bg-gray-900/90 hover:bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-full shadow-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2"
                        >
                            <span className="material-icons">chevron_right</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* ── TOP 10 ── */}
            <section className="py-12 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                <div className="max-w-[1600px] mx-auto px-6">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-8 tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                        <span className="w-1 h-7 bg-primary block rounded-full" />
                        Top 10 Animes más vistos hoy
                    </h2>
                    <div className="flex overflow-x-auto gap-8 hide-scrollbar pb-8 items-center pl-6">
                        {[
                            { id: 21,     title: 'One Piece' },
                            { id: 113415, title: 'Jujutsu Kaisen' },
                            { id: 1735,   title: 'Naruto Shippuden' },
                            { id: 97940,  title: 'Black Clover' },
                            { id: 269,    title: 'Bleach' },
                            { id: 146065, title: 'Chainsaw Man' },
                            { id: 20605,  title: 'Tokyo Ghoul' },
                            { id: 5114,   title: 'FMA: Brotherhood' },
                            { id: 813,    title: 'Dragon Ball Z' },
                            { id: 1535,   title: 'Death Note' },
                        ].map((anime, idx) => (
                            <div key={anime.id} onClick={() => navigate(`/anime/${anime.id}`)} className="flex-none relative group cursor-pointer pr-4">
                                <span className={`absolute ${idx === 9 ? '-left-12' : '-left-8'} -bottom-4 text-[130px] font-black text-white leading-none z-0 drop-shadow-lg pointer-events-none`}
                                    style={{ WebkitTextStroke: '4px #888' }}>{idx + 1}</span>
                                <div className="w-[140px] aspect-[2/3] rounded-md overflow-hidden shadow-lg z-10 relative transform group-hover:scale-105 transition-transform duration-300 bg-gray-200 dark:bg-gray-700 ml-6">
                                    {animeImages[anime.id] && (
                                        <img alt={anime.title} className="w-full h-full object-cover" src={animeImages[anime.id]} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FILAS POR GÉNERO ── */}
            <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-100">
                {GENRE_ROWS.map(row => (
                    <AnimeRow key={row.title} title={row.title} icon={row.icon} items={row.items} animeImages={animeImages} />
                ))}
            </div>

            <footer className="bg-gray-900 border-t border-gray-800 py-12 text-center text-sm text-gray-400">
                <div className="flex justify-center gap-6 mb-4">
                    <a className="hover:text-primary transition-colors text-white" href="#">Términos</a>
                    <a className="hover:text-primary transition-colors text-white" href="#">Privacidad</a>
                    <a className="hover:text-primary transition-colors text-white" href="#">Contacto</a>
                </div>
                <p>© 2026 SpoilerSafe. Anime Streaming Concept.</p>
            </footer>
        </React.Fragment>
    );
};

export default Home;
