
import axios from 'axios';
const API_HTTP = import.meta.env.VITE_API_URL || API;
const API_WS   = API_HTTP.replace(/^http/, 'ws');

// ── helpers ──────────────────────────────────────────────────────────────────

const COLORS = [
    'bg-orange-500','bg-blue-500','bg-green-500','bg-purple-500',
    'bg-pink-500','bg-indigo-500','bg-teal-500','bg-red-500',
];
const colorFor = (name = '') =>
    COLORS[name.split('').reduce((a,c) => a + c.charCodeAt(0), 0) % COLORS.length];

const Avatar = ({ username, avatar_url, size = 'w-10 h-10', online = false }) => (
    <div className="relative shrink-0">
        {avatar_url
            ? <img src={avatar_url} alt={username} className={`${size} rounded-full object-cover`} />
            : (
                <div className={`${size} rounded-full ${colorFor(username)} flex items-center justify-center text-white font-black text-sm`}>
                    {(username || '?')[0].toUpperCase()}
                </div>
            )
        }
        {online && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
        )}
    </div>
);

// ── Messages page ─────────────────────────────────────────────────────────────

export default function Messages() {
    const { username: paramUsername } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const [me, setMe]                   = useState(null);
    const [conversations, setConvs]     = useState([]);
    const [activeUser, setActiveUser]   = useState(paramUsername || null);
    const [thread, setThread]           = useState([]);
    const [input, setInput]             = useState('');
    const [wsStatus, setWsStatus]       = useState('connecting');
    const [unreadMap, setUnreadMap]     = useState({});   // { username: count }
    const [mobileView, setMobileView]   = useState(paramUsername ? 'chat' : 'inbox');
    const [searchQ, setSearchQ]         = useState('');
    const [userSearch, setUserSearch]   = useState([]);

    const wsRef   = useRef(null);
    const listRef = useRef(null);
    const inputRef = useRef(null);

    // ── Fetch own profile ─────────────────────────────────────────────────
    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        axios.get(`${API_HTTP}/users/me/profile`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(r => setMe(r.data)).catch(() => navigate('/login'));
    }, [token, navigate]);

    // ── Fetch conversation list ───────────────────────────────────────────
    const loadConvs = useCallback(async () => {
        if (!token) return;
        try {
            const r = await axios.get(`${API_HTTP}/dm/conversations`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setConvs(r.data);
            const map = {};
            r.data.forEach(c => { if (c.unread > 0) map[c.username] = c.unread; });
            setUnreadMap(map);
        } catch { /* ignore */ }
    }, [token]);

    useEffect(() => { loadConvs(); }, [loadConvs]);

    // ── Load thread when activeUser changes ───────────────────────────────
    useEffect(() => {
        if (!activeUser || !token) return;
        axios.get(`${API_HTTP}/dm/${activeUser}/messages`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(r => {
            setThread(r.data);
            setUnreadMap(prev => { const n = { ...prev }; delete n[activeUser]; return n; });
            // Also update conv list unread
            setConvs(prev => prev.map(c => c.username === activeUser ? { ...c, unread: 0 } : c));
        }).catch(() => setThread([]));
    }, [activeUser, token]);

    // ── Scroll to bottom ──────────────────────────────────────────────────
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [thread]);

    // ── Focus input when conversation opens ───────────────────────────────
    useEffect(() => {
        if (activeUser) setTimeout(() => inputRef.current?.focus(), 100);
    }, [activeUser]);

    // ── WebSocket ─────────────────────────────────────────────────────────
    const connect = useCallback(() => {
        if (!token) return;
        setWsStatus('connecting');
        const ws = new WebSocket(`${API_WS}/ws/dm?token=${encodeURIComponent(token)}`);
        wsRef.current = ws;

        ws.onopen = () => setWsStatus('connected');

        ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.type !== 'message') return;

                const partner = data.is_mine ? data.to : data.from_username;

                // Append to thread if this conversation is open
                setActiveUser(curr => {
                    if (curr === partner) {
                        setThread(prev => [...prev, data]);
                        // Mark as read via WS
                        if (!data.is_mine) {
                            ws.send(JSON.stringify({ type: 'read', from: data.from_username }));
                        }
                    } else if (!data.is_mine) {
                        // Increment unread badge
                        setUnreadMap(prev => ({ ...prev, [partner]: (prev[partner] || 0) + 1 }));
                    }
                    return curr;
                });

                // Update conversation list
                setConvs(prev => {
                    const exists = prev.find(c => c.username === partner);
                    const updated = {
                        username: partner,
                        avatar_url: data.is_mine ? null : data.from_avatar,
                        last_message: data.content,
                        last_message_mine: data.is_mine,
                        last_message_time: data.created_at,
                        unread: 0,
                        is_online: true,
                    };
                    if (exists) {
                        return [updated, ...prev.filter(c => c.username !== partner)];
                    }
                    return [updated, ...prev];
                });
            } catch { /* ignore */ }
        };

        ws.onerror  = () => setWsStatus('disconnected');
        ws.onclose  = () => {
            setWsStatus('disconnected');
            setTimeout(() => { if (wsRef.current === ws) connect(); }, 3000);
        };
    }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        connect();
        return () => {
            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.close();
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Search new user to DM ─────────────────────────────────────────────
    useEffect(() => {
        if (!searchQ || searchQ.length < 2) { setUserSearch([]); return; }
        const t = setTimeout(async () => {
            try {
                const r = await axios.get(`${API_HTTP}/users/search?query=${encodeURIComponent(searchQ)}`);
                setUserSearch(r.data.filter(u => u.username !== me?.username));
            } catch { setUserSearch([]); }
        }, 300);
        return () => clearTimeout(t);
    }, [searchQ, me]);

    // ── Send message ──────────────────────────────────────────────────────
    const send = () => {
        const text = input.trim();
        if (!text || !activeUser || wsRef.current?.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({ type: 'send', to: activeUser, content: text }));
        setInput('');
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    };

    const openConv = (username) => {
        setActiveUser(username);
        setMobileView('chat');
        setSearchQ('');
        setUserSearch([]);
        navigate(`/messages/${username}`, { replace: true });
    };

    const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);

    if (!token) return null;

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div
            className="flex h-[calc(100vh-64px)] bg-white"
            style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}
        >
            {/* ── LEFT: Inbox ────────────────────────────────────────── */}
            <aside
                className={`flex flex-col border-r border-gray-200 bg-white shrink-0
                    ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}
                    w-full md:w-80 lg:w-96`}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-black text-gray-900">
                            Mensajes
                            {totalUnread > 0 && (
                                <span className="ml-2 bg-primary text-white text-xs font-black rounded-full px-2 py-0.5">
                                    {totalUnread}
                                </span>
                            )}
                        </h1>
                        <div className={`flex items-center gap-1.5 text-xs font-bold ${
                            wsStatus === 'connected' ? 'text-green-600' : 'text-gray-400'
                        }`}>
                            <span className={`w-2 h-2 rounded-full ${
                                wsStatus === 'connected' ? 'bg-green-400' :
                                wsStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-300'
                            }`} />
                            {wsStatus === 'connected' ? 'En línea' : wsStatus === 'connecting' ? 'Conectando' : 'Sin conexión'}
                        </div>
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                        <input
                            value={searchQ}
                            onChange={e => setSearchQ(e.target.value)}
                            placeholder="Buscar o iniciar conversación…"
                            className="w-full bg-gray-100 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>
                    {/* User search results */}
                    {userSearch.length > 0 && (
                        <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                            {userSearch.map(u => (
                                <button
                                    key={u.username}
                                    onClick={() => openConv(u.username)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                                >
                                    <Avatar username={u.username} avatar_url={u.avatar_url} size="w-8 h-8" />
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-gray-900">{u.username}</p>
                                        <p className="text-xs text-gray-400">Nivel {u.level}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 && !searchQ && (
                        <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                            <span className="material-symbols-outlined text-5xl text-gray-200 mb-3">chat</span>
                            <p className="text-sm font-bold text-gray-400">Aún no tienes conversaciones</p>
                            <p className="text-xs text-gray-300 mt-1">Busca un usuario para empezar a chatear</p>
                        </div>
                    )}
                    {conversations.map(conv => {
                        const unread = unreadMap[conv.username] ?? conv.unread ?? 0;
                        const isActive = activeUser === conv.username;
                        return (
                            <button
                                key={conv.username}
                                onClick={() => openConv(conv.username)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left border-b border-gray-50 ${
                                    isActive ? 'bg-orange-50 border-l-2 border-l-primary' : 'hover:bg-gray-50'
                                }`}
                            >
                                <Avatar
                                    username={conv.username}
                                    avatar_url={conv.avatar_url}
                                    online={conv.is_online}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <p className={`text-sm truncate ${unread > 0 ? 'font-black text-gray-900' : 'font-bold text-gray-800'}`}>
                                            {conv.username}
                                        </p>
                                        <span className="text-[10px] text-gray-400 shrink-0 ml-1">{conv.last_message_time}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className={`text-xs truncate ${unread > 0 ? 'font-medium text-gray-700' : 'text-gray-400'}`}>
                                            {conv.last_message_mine && <span className="text-gray-400">Tú: </span>}
                                            {conv.last_message}
                                        </p>
                                        {unread > 0 && (
                                            <span className="ml-2 bg-primary text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
                                                {unread}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </aside>

            {/* ── RIGHT: Conversation ─────────────────────────────────── */}
            <div className={`flex-1 flex flex-col ${mobileView === 'inbox' ? 'hidden md:flex' : 'flex'}`}>
                {!activeUser ? (
                    /* Empty state */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-primary text-5xl">send</span>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Tus mensajes</h2>
                        <p className="text-gray-500 text-sm max-w-xs">
                            Envía mensajes privados a otros usuarios de SpoilerSafe. Busca un usuario para empezar.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Conversation header */}
                        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-200 bg-white shrink-0">
                            <button
                                onClick={() => { setMobileView('inbox'); navigate('/messages', { replace: true }); }}
                                className="md:hidden text-gray-400 hover:text-primary mr-1"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            {/* Avatar with online dot */}
                            <button onClick={() => navigate(`/users/${activeUser}`)}>
                                <Avatar
                                    username={activeUser}
                                    avatar_url={conversations.find(c => c.username === activeUser)?.avatar_url}
                                    size="w-10 h-10"
                                    online={dm_manager_online(activeUser, conversations)}
                                />
                            </button>
                            <div className="flex-1 min-w-0">
                                <button
                                    onClick={() => navigate(`/users/${activeUser}`)}
                                    className="font-black text-gray-900 text-sm hover:text-primary transition-colors truncate block"
                                >
                                    {activeUser}
                                </button>
                                <p className="text-xs text-gray-400">
                                    {conversations.find(c => c.username === activeUser)?.is_online
                                        ? '🟢 En línea'
                                        : conversations.find(c => c.username === activeUser)?.rank || ''}
                                </p>
                            </div>
                            <button
                                onClick={() => navigate(`/users/${activeUser}`)}
                                className="text-gray-400 hover:text-primary transition-colors"
                                title="Ver perfil"
                            >
                                <span className="material-symbols-outlined text-[20px]">person</span>
                            </button>
                        </div>

                        {/* Message list */}
                        <div
                            ref={listRef}
                            className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-[#f6faff]"
                            style={{ scrollbarWidth: 'thin' }}
                        >
                            {thread.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <Avatar
                                        username={activeUser}
                                        avatar_url={conversations.find(c => c.username === activeUser)?.avatar_url}
                                        size="w-16 h-16"
                                    />
                                    <p className="mt-4 font-black text-gray-900">{activeUser}</p>
                                    <p className="text-xs text-gray-400 mt-1">Di hola para empezar la conversación 👋</p>
                                </div>
                            )}

                            {thread.map((msg, idx) => {
                                const prevMsg = thread[idx - 1];
                                const showDate = !prevMsg || prevMsg.created_at?.split(' ')[0] !== msg.created_at?.split(' ')[0];
                                return (
                                    <div key={msg.id ?? idx}>
                                        {showDate && (
                                            <div className="flex justify-center my-3">
                                                <span className="text-[10px] text-gray-400 bg-white border border-gray-200 px-3 py-1 rounded-full">
                                                    {msg.created_at?.split(' ')[0]}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`flex gap-2 items-end ${msg.is_mine ? 'flex-row-reverse' : ''}`}>
                                            {!msg.is_mine && (
                                                <Avatar
                                                    username={msg.from_username}
                                                    avatar_url={msg.from_avatar}
                                                    size="w-7 h-7"
                                                />
                                            )}
                                            <div className={`max-w-[72%] flex flex-col gap-0.5 ${msg.is_mine ? 'items-end' : 'items-start'}`}>
                                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-snug break-words ${
                                                    msg.is_mine
                                                        ? 'bg-orange-500 text-white rounded-br-sm'
                                                        : 'bg-white text-gray-900 border border-gray-200 shadow-sm rounded-bl-sm'
                                                }`}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-[10px] text-gray-400 mx-1">
                                                    {msg.created_at?.split(' ')[1]}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input */}
                        <div className="px-4 py-3.5 border-t border-gray-200 bg-white shrink-0">
                            <div className="flex gap-2 items-center">
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKey}
                                    placeholder={`Mensaje a ${activeUser}…`}
                                    maxLength={1000}
                                    className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-gray-400"
                                />
                                <button
                                    onClick={send}
                                    disabled={!input.trim() || wsStatus !== 'connected'}
                                    className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 flex items-center justify-center transition-all active:scale-95 shrink-0"
                                >
                                    <span className="material-symbols-outlined text-white text-[18px]">send</span>
                                </button>
                            </div>
                            {wsStatus !== 'connected' && (
                                <p className="text-[11px] text-gray-400 text-center mt-1">
                                    Reconectando…
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// Helper: check online status from conversations list (fallback while WS is not directly queried)
function dm_manager_online(username, conversations) {
    return conversations.find(c => c.username === username)?.is_online ?? false;
}
import { API } from '../utils/api.js';