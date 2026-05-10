import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const AdminPanel = ({ user }) => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const currentUser = user || profile;

    const [tab, setTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    useEffect(() => {
        if (!currentUser?.is_admin) return;
        setLoading(true);
        if (tab === 'users') {
            getDocs(collection(db, 'users'))
                .then(snap => setUsers(snap.docs.map(d => ({ id: d.id, uid: d.id, ...d.data() }))))
                .catch(() => toast.error('Error cargando usuarios'))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [tab, currentUser]);

    const handleBan = async (uid, ban) => {
        try {
            await updateDoc(doc(db, 'users', uid), { is_banned: ban });
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, is_banned: ban } : u));
            toast.success(ban ? 'Usuario baneado' : 'Usuario desbaneado');
        } catch (err) {
            toast.error(err.message || 'Error');
        }
    };

    if (!currentUser?.is_admin) return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 px-4">
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
                ) : (
                    /* USERS TAB */
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">group</span>
                                {users.length} usuarios registrados
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {users.map(u => (
                                <div key={u.uid} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
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
                                                      onClick={() => navigate(`/users/${u.username}`)}>
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
                                        <button onClick={() => handleBan(u.uid, !u.is_banned)}
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
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
