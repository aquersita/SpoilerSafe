
import axios from 'axios';

const Games = () => {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchGames = async () => {
            try {
                const res = await axios.get(`${API}/games`);
                setGames(res.data);
            } catch (err) {
                console.error("Error fetching games:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchGames();
    }, []);

    const showToast = (msg, success = true) => {
        setToast({ msg, success });
        setTimeout(() => setToast(null), 3000);
    };

    const handlePlay = async (game) => {
        window.open(game.game_url, '_blank', 'noreferrer');
        if (!token) return;
        try {
            const res = await axios.post(`${API}/games/session`, {
                game_id: String(game.id),
                game_title: game.title,
            }, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.points_earned > 0) {
                showToast(`¡+${res.data.points_earned} puntos por jugar ${game.title}!`);
            }
        } catch {
            // silent — the game still opens
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background-light flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

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
                {games.length > 0 && (
                    <img
                        src={games[0].thumbnail}
                        alt="Hero"
                        className="absolute right-0 top-0 w-full md:w-2/3 h-full object-cover opacity-30 blur-sm"
                    />
                )}
                <div className="relative z-20 max-w-[1600px] mx-auto px-4 md:px-8 h-full flex flex-col justify-center">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-4" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                        ZONA GAMING
                    </h1>
                    <p className="text-indigo-200 max-w-xl text-lg mb-2">
                        Descubre juegos gratuitos estilo anime y MMORPGs para disfrutar con la comunidad de SpoilerSafe.
                    </p>
                    {token && (
                        <p className="text-indigo-300 text-sm font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">stars</span>
                            Gana +10 XP la primera vez que juegas cada juego al día
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
                    {games.map(game => (
                        <div key={game.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col">
                            <div className="relative aspect-video">
                                <img
                                    src={game.thumbnail}
                                    alt={game.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 right-2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow uppercase">
                                    {game.genre}
                                </div>
                                {token && (
                                    <div className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">stars</span>
                                        +10 XP
                                    </div>
                                )}
                            </div>
                            <div className="p-4 flex flex-col flex-1">
                                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{game.title}</h3>
                                <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-1">{game.short_description}</p>

                                <div className="flex items-center justify-between mt-auto">
                                    <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">desktop_windows</span>
                                        {game.platform === 'Web Browser' ? 'Web' : 'PC'}
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
import { API } from '../utils/api.js';