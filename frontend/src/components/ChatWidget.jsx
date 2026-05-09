import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { API } from '../utils/api.js';

const API_HTTP = import.meta.env.VITE_API_URL || API;
const API_WS   = API_HTTP.replace(/^http/, 'ws');

// ── helpers ──────────────────────────────────────────────────────────────────

const getInitial = (name) => (name || '?')[0].toUpperCase();

const COLORS = [
    'bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
    'bg-pink-500',   'bg-indigo-500', 'bg-teal-500', 'bg-red-500',
];
const colorFor = (name) =>
    COLORS[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

// ── Avatar ────────────────────────────────────────────────────────────────────

const Avatar = ({ username, avatar_url, size = 'w-7 h-7' }) =>
    avatar_url ? (
        <img src={avatar_url} alt={username} className={`${size} rounded-full object-cover shrink-0`} />
    ) : (
        <div className={`${size} rounded-full ${colorFor(username)} flex items-center justify-center text-white text-xs font-black shrink-0`}>
            {getInitial(username)}
        </div>
    );

// ── ChatWidget ────────────────────────────────────────────────────────────────

const ChatWidget = () => {
    const [open, setOpen]           = useState(false);
    const [messages, setMessages]   = useState([]);
    const [input, setInput]         = useState('');
    const [online, setOnline]       = useState(0);
    const [unread, setUnread]       = useState(0);
    const [status, setStatus]       = useState('disconnected'); // connecting | connected | disconnected
    const wsRef                     = useRef(null);
    const listRef                   = useRef(null);
    const inputRef                  = useRef(null);
    const token                     = localStorage.getItem('token');

    // Current username (to differentiate own messages)
    const [myUsername, setMyUsername] = useState(null);
    useEffect(() => {
        if (!token) return;
        axios.get(`${API_HTTP}/users/me/profile`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(r => setMyUsername(r.data.username)).catch(() => {});
    }, [token]);

    // Scroll to bottom
    const scrollBottom = useCallback(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, []);

    // Load history once
    const loadHistory = useCallback(async () => {
        try {
            const res = await axios.get(`${API_HTTP}/chat/messages`);
            setMessages(res.data);
        } catch { /* ignore */ }
    }, []);

    // WebSocket lifecycle
    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;
        setStatus('connecting');

        const url = token
            ? `${API_WS}/ws/chat?token=${encodeURIComponent(token)}`
            : `${API_WS}/ws/chat`;

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            setStatus('connected');
        };

        ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);

                if (data.online !== undefined) setOnline(data.online);

                if (data.type === 'chat') {
                    setMessages(prev => [...prev, data]);
                    setUnread(prev => (open ? 0 : prev + 1));
                } else if (data.type === 'system') {
                    setMessages(prev => [...prev, { ...data, id: `sys-${Date.now()}` }]);
                }
            } catch { /* ignore */ }
        };

        ws.onerror = () => setStatus('disconnected');

        ws.onclose = () => {
            setStatus('disconnected');
            // Reconnect after 3 s unless component unmounted
            setTimeout(() => {
                if (wsRef.current === ws) connect();
            }, 3000);
        };
    }, [token, open]);

    // Connect on mount
    useEffect(() => {
        loadHistory();
        connect();
        return () => {
            if (wsRef.current) {
                wsRef.current.onclose = null; // prevent reconnect on unmount
                wsRef.current.close();
            }
        };
    }, []);  // eslint-disable-line react-hooks/exhaustive-deps

    // Scroll when messages change and chat is open
    useEffect(() => {
        if (open) {
            setTimeout(scrollBottom, 50);
        }
    }, [messages, open, scrollBottom]);

    // Clear unread when opened
    useEffect(() => {
        if (open) {
            setUnread(0);
            setTimeout(() => { scrollBottom(); inputRef.current?.focus(); }, 80);
        }
    }, [open, scrollBottom]);

    const send = () => {
        const text = input.trim();
        if (!text || wsRef.current?.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({ content: text }));
        setInput('');
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <>
            {/* Floating toggle button */}
            <button
                onClick={() => setOpen(o => !o)}
                className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-[100] w-13 h-13 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 hover:scale-105"
                style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                title="Chat comunidad"
            >
                <span className="material-symbols-outlined text-white text-[22px]">
                    {open ? 'close' : 'forum'}
                </span>
                {!open && unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>

            {/* Chat panel */}
            {open && (
                <div
                    className="fixed bottom-[88px] right-4 lg:bottom-[76px] lg:right-6 z-[99] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                    style={{ width: 340, height: 480 }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-[#1a2332] text-white shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-orange-400 text-[20px]">forum</span>
                            <div>
                                <p className="font-black text-sm leading-none">Chat Comunidad</p>
                                <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                                    <span
                                        className={`inline-block w-1.5 h-1.5 rounded-full ${
                                            status === 'connected' ? 'bg-green-400' :
                                            status === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
                                        }`}
                                    />
                                    {status === 'connected'
                                        ? `${online} conectado${online !== 1 ? 's' : ''}`
                                        : status === 'connecting' ? 'Conectando…' : 'Sin conexión'}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>

                    {/* Message list */}
                    <div
                        ref={listRef}
                        className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-[#f6faff]"
                        style={{ scrollbarWidth: 'thin' }}
                    >
                        {messages.length === 0 && (
                            <p className="text-xs text-gray-400 text-center mt-8 italic">
                                Sé el primero en decir algo 👋
                            </p>
                        )}

                        {messages.map((msg, idx) => {
                            // System message
                            if (msg.type === 'system') {
                                return (
                                    <div key={msg.id ?? idx} className="flex justify-center">
                                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                            {msg.text}
                                        </span>
                                    </div>
                                );
                            }

                            const isMe = msg.username === myUsername;

                            return (
                                <div
                                    key={msg.id ?? idx}
                                    className={`flex gap-2 items-end ${isMe ? 'flex-row-reverse' : ''}`}
                                >
                                    {!isMe && (
                                        <Avatar username={msg.username} avatar_url={msg.avatar_url} />
                                    )}
                                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                                        {!isMe && (
                                            <span className="text-[10px] font-bold text-gray-500 ml-1">
                                                {msg.username}
                                            </span>
                                        )}
                                        <div
                                            className={`px-3 py-2 rounded-2xl text-sm leading-snug break-words ${
                                                isMe
                                                    ? 'bg-orange-500 text-white rounded-br-sm'
                                                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
                                            }`}
                                        >
                                            {msg.content}
                                        </div>
                                        <span className="text-[10px] text-gray-400 mx-1">{msg.created_at}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input */}
                    <div className="px-3 py-3 border-t border-gray-100 bg-white shrink-0">
                        {!token ? (
                            <p className="text-xs text-gray-400 text-center py-1">
                                <a href="/login" className="text-primary font-bold hover:underline">Inicia sesión</a>
                                {' '}para participar en el chat
                            </p>
                        ) : (
                            <div className="flex gap-2 items-center">
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKey}
                                    placeholder="Escribe un mensaje…"
                                    maxLength={500}
                                    className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-gray-400"
                                />
                                <button
                                    onClick={send}
                                    disabled={!input.trim() || status !== 'connected'}
                                    className="w-9 h-9 rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 flex items-center justify-center transition-all active:scale-95 shrink-0"
                                >
                                    <span className="material-symbols-outlined text-white text-[18px]">send</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatWidget;
