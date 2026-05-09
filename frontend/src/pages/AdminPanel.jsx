
import toast from 'react-hot-toast';
const AdminPanel = ({ user }) => {
    const navigate = useNavigate();
    const [tab, setTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [restricted, setRestricted] = useState([]);
    const [loading, setLoading] = useState(true);

    // Restrict form
    const [restrictForm, setRestrictForm] = useState({ content_type: 'anime', anilist_id: '', title: '', reason: '' });

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => { window.scrollTo(0, 0); }, []);

    useEffect(() => {
        if (!user?.is_admin) return;
        setLoading(true);
        if (tab === 'users') {
            axios.get(`${API}/admin/users`, { headers })
                .then(res => setUsers(res.data))
                .catch(() => toast.error('Error cargando usuarios'))
                .finally(() => setLoading(false));
        } else {
            axios.get(`${API}/admin/content/restricted`, { headers })
                .then(res => setRestricted(res.data))
                .catch(() => toast.error('Error cargando contenido'))
                .finally(() => setLoading(false));
        }
    }, [tab, user]);

    const handleBan = async (userId, ban) => {
        try {
            await axios.post(`${API}/admin/users/${userId}/${ban ? 'ban' : 'unban'}`, {}, { headers });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: ban } : u));
            toast.success(ban ? 'Usuario baneado' : 'Usuario desbaneado');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Error');
        }
    };

    const handleRestrict = async (e) => {
        e.preventDefault();
        if (!restrictForm.anilist_id) return;
        try {
            await axios.post(`${API}/admin/content/restrict`, {
                ...restrictForm,
                anilist_id: parseInt(restrictForm.anilist_id)
            }, { headers });
            toast.success('Contenido restringido');
            setRestrictForm({ content_type: 'anime', anilist_id: '', title: '', reason: '' });
            const res = await axios.get(`${API}/admin/content/restricted`, { headers });
            setRestricted(res.data);
        } catch { toast.error('Error al restringir'); }
    };

    const handleUnrestrict = async (id) => {
        try {
            await axios.delete(`${API}/admin/content/restrict/${id}`, { headers });
            setRestricted(prev => prev.filter(r => r.id !== id));
            toast.success('Contenido desbloqueado');
        } catch { toast.error('Error'); }
    };

    if (!user?.is_admin) return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center text-gray-500 px-4">
            <span className="material-symbols-outlined text-6xl mb-4 text-red-300">gpp_bad</span>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Acceso Denegado</h2>
            <p className="text-sm text-center dark:text-gray-400">No tienes permisos de administrador.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-900 to-gray-900 py-10 mb-8">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-red-400 text-3xl">admin_panel_settings</span>
                        <span className="text-white/60 font-bold text-sm uppercase tracking-widest">Administración</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                        Panel de Admin
                    </h1>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-6">
                {/* Tabs */}
                <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 mb-8 w-fit">
                    {[
                        { key: 'users', label: 'Usuarios', icon: 'group' },
                        { key: 'content', label: 'Contenido Restringido', icon: 'block' }
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold transition-all ${
                                tab === t.key
                                    ? 'bg-red-600 text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}>
                            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                            {t.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500"></div>
                    </div>
                ) : tab === 'users' ? (
                    /* ===== USERS TAB ===== */
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">group</span>
                                {users.length} usuarios registrados
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {users.map(u => (
                                <div key={u.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden shrink-0">
                                            {u.avatar_url ? (
                                                <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-gray-400 text-[20px]">person</span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900 dark:text-white text-sm cursor-pointer hover:text-primary"
                                                      onClick={() => navigate(`/user/${u.username}`)}>
                                                    {u.username}
                                                </span>
                                                {u.is_admin && (
                                                    <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">ADMIN</span>
                                                )}
                                                {u.is_banned && (
                                                    <span className="text-[10px] font-bold bg-gray-800 text-white px-1.5 py-0.5 rounded">BANNED</span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-400">Nivel {u.level} · {u.points} pts</span>
                                        </div>
                                    </div>
                                    {!u.is_admin && (
                                        <button onClick={() => handleBan(u.id, !u.is_banned)}
                                            className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                                                u.is_banned
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200'
                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200'
                                            }`}>
                                            <span className="material-symbols-outlined text-[16px]">{u.is_banned ? 'lock_open' : 'block'}</span>
                                            {u.is_banned ? 'Desbanear' : 'Banear'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* ===== CONTENT TAB ===== */
                    <div className="space-y-6">
                        {/* Add Form */}
                        <form onSubmit={handleRestrict} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                Restringir Contenido
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <select value={restrictForm.content_type}
                                    onChange={e => setRestrictForm(p => ({ ...p, content_type: e.target.value }))}
                                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white">
                                    <option value="anime">Anime</option>
                                    <option value="manga">Manga</option>
                                </select>
                                <input type="number" placeholder="AniList ID" required value={restrictForm.anilist_id}
                                    onChange={e => setRestrictForm(p => ({ ...p, anilist_id: e.target.value }))}
                                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white" />
                                <input type="text" placeholder="Título (opcional)" value={restrictForm.title}
                                    onChange={e => setRestrictForm(p => ({ ...p, title: e.target.value }))}
                                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white" />
                                <input type="text" placeholder="Razón" value={restrictForm.reason}
                                    onChange={e => setRestrictForm(p => ({ ...p, reason: e.target.value }))}
                                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white" />
                            </div>
                            <button type="submit" className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">block</span>
                                Restringir
                            </button>
                        </form>

                        {/* List */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="font-bold text-gray-900 dark:text-white">{restricted.length} elementos restringidos</h2>
                            </div>
                            {restricted.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">
                                    <span className="material-symbols-outlined text-4xl mb-2 block">check_circle</span>
                                    No hay contenido restringido
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {restricted.map(r => (
                                        <div key={r.id} className="flex items-center justify-between px-6 py-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                                        r.content_type === 'anime' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                    }`}>{r.content_type}</span>
                                                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                                                        {r.title || `ID: ${r.anilist_id}`}
                                                    </span>
                                                    <span className="text-xs text-gray-400">#{r.anilist_id}</span>
                                                </div>
                                                {r.reason && <p className="text-xs text-gray-500 mt-1">{r.reason}</p>}
                                            </div>
                                            <button onClick={() => handleUnrestrict(r.id)}
                                                className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">lock_open</span>
                                                Desbloquear
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
import { API } from '../utils/api.js';