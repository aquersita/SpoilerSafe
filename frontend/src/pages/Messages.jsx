import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getOrCreateConvo, sendMessage, subscribeToConvos,
  subscribeToMessages, markRead,
} from '../services/messagesService';
import { searchUsers, getUserProfileByUsername } from '../services/userService';

const COLORS = [
  'bg-orange-500','bg-blue-500','bg-green-500','bg-purple-500',
  'bg-pink-500','bg-indigo-500','bg-teal-500','bg-red-500',
];
const colorFor = (name = '') =>
  COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

const Avatar = ({ username, avatar_url, size = 'w-10 h-10' }) => (
  <div className="shrink-0">
    {avatar_url
      ? <img src={avatar_url} alt={username} className={`${size} rounded-full object-cover`} />
      : <div className={`${size} rounded-full ${colorFor(username)} flex items-center justify-center text-white font-black text-sm`}>
          {(username || '?')[0].toUpperCase()}
        </div>
    }
  </div>
);

export default function Messages() {
  const { username: paramUsername } = useParams();
  const navigate = useNavigate();
  const { firebaseUser, profile } = useAuth();

  const [convos, setConvos] = useState([]);
  const [activeConvoId, setActiveConvoId] = useState(null);
  // Single object avoids split-state race conditions
  const [activeOther, setActiveOther] = useState(null); // { uid, username, avatar }
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [view, setView] = useState('inbox'); // 'inbox' | 'chat'
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [initializing, setInitializing] = useState(!!paramUsername);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const unsubMsgs = useRef(null);
  const paramHandled = useRef(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (firebaseUser === null) navigate('/login');
  }, [firebaseUser, navigate]);

  // Live inbox subscription
  useEffect(() => {
    if (!firebaseUser?.uid) return;
    return subscribeToConvos(firebaseUser.uid, setConvos);
  }, [firebaseUser?.uid]);

  // Handle deep-link (/messages/:username) — runs once when auth+profile are ready
  useEffect(() => {
    if (!paramUsername || paramHandled.current || !firebaseUser || !profile) return;
    paramHandled.current = true;
    setInitializing(true);
    openConvoByUsername(paramUsername).finally(() => setInitializing(false));
  }, [firebaseUser?.uid, profile?.username]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to messages for the active conversation
  useEffect(() => {
    unsubMsgs.current?.();
    unsubMsgs.current = null;
    setMessages([]);
    if (!activeConvoId) return;
    unsubMsgs.current = subscribeToMessages(activeConvoId, setMessages);
    markRead(activeConvoId, firebaseUser?.uid);
    return () => unsubMsgs.current?.();
  }, [activeConvoId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to latest message
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  // Focus input when a chat is opened
  useEffect(() => {
    if (activeConvoId) setTimeout(() => inputRef.current?.focus(), 80);
  }, [activeConvoId]);

  // Debounced user search
  useEffect(() => {
    if (!searchQ || searchQ.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await searchUsers(searchQ);
        setSearchResults(r.filter(u => u.uid !== firebaseUser?.uid));
      } catch { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ, firebaseUser?.uid]);

  // ── helpers ───────────────────────────────────────────────────────────────

  async function openConvoByUsername(otherUsername) {
    if (!firebaseUser || !profile) return;
    try {
      const otherProfile = await getUserProfileByUsername(otherUsername);
      if (!otherProfile) return;
      const id = await getOrCreateConvo(
        firebaseUser.uid, profile.username, profile.avatar_url || '',
        otherProfile.uid, otherProfile.username, otherProfile.avatar_url || '',
      );
      setActiveConvoId(id);
      setActiveOther({
        uid: otherProfile.uid,
        username: otherProfile.username,
        avatar: otherProfile.avatar_url || '',
      });
      setView('chat');
    } catch (err) {
      console.error('openConvoByUsername:', err);
    }
  }

  // Plain sync function — no useCallback, no async, no race conditions
  function openConvo(conv) {
    const otherUid = conv.participants?.find(p => p !== firebaseUser?.uid);
    if (!otherUid) return;
    const other = {
      uid: otherUid,
      username: conv.usernames?.[otherUid] || otherUid,
      avatar: conv.avatars?.[otherUid] || '',
    };
    setActiveConvoId(conv.id);
    setActiveOther(other);
    setView('chat');
    setSearchQ('');
    setSearchResults([]);
    markRead(conv.id, firebaseUser?.uid);
  }

  async function handleSearchResult(u) {
    setSearchQ('');
    setSearchResults([]);
    await openConvoByUsername(u.username);
  }

  async function send() {
    const text = input.trim();
    if (!text || !activeOther?.uid || !firebaseUser || !profile) return;
    setInput('');
    try {
      await sendMessage(firebaseUser.uid, profile.username, activeOther.uid, text);
    } catch (err) {
      console.error('send error:', err);
    }
  }

  // ── early returns ─────────────────────────────────────────────────────────

  if (!firebaseUser) return null;

  if (initializing) return (
    <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500" />
    </div>
  );

  const totalUnread = convos.reduce((s, c) => s + (c.unread?.[firebaseUser.uid] || 0), 0);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white" style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>

      {/* ── LEFT: Inbox ── */}
      <aside className={`flex flex-col border-r border-gray-200 bg-white shrink-0 ${view === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96`}>
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-black text-gray-900">
              Mensajes
              {totalUnread > 0 && (
                <span className="ml-2 bg-primary text-white text-xs font-black rounded-full px-2 py-0.5">{totalUnread}</span>
              )}
            </h1>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Buscar usuario…"
              className="w-full bg-gray-100 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {searchResults.map(u => (
                <button key={u.uid} onClick={() => handleSearchResult(u)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <Avatar username={u.username} avatar_url={u.avatar_url} size="w-8 h-8" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900">{u.username}</p>
                    <p className="text-xs text-gray-400">Nivel {u.level || 1}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {convos.length === 0 && !searchQ && (
            <div className="flex flex-col items-center justify-center h-48 text-center px-6">
              <span className="material-symbols-outlined text-5xl text-gray-200 mb-3">chat</span>
              <p className="text-sm font-bold text-gray-400">Aún no tienes conversaciones</p>
              <p className="text-xs text-gray-300 mt-1">Busca un usuario para empezar</p>
            </div>
          )}
          {convos.map(conv => {
            const otherUid = conv.participants?.find(p => p !== firebaseUser.uid);
            const otherUsername = conv.usernames?.[otherUid] || otherUid || '?';
            const otherAvatar = conv.avatars?.[otherUid] || '';
            const unread = conv.unread?.[firebaseUser.uid] || 0;
            const isActive = conv.id === activeConvoId;
            const ts = conv.lastMessageAt?.toDate?.()?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) || '';
            return (
              <button key={conv.id} onClick={() => openConvo(conv)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left border-b border-gray-50 ${isActive ? 'bg-orange-50 border-l-2 border-l-primary' : 'hover:bg-gray-50'}`}>
                <Avatar username={otherUsername} avatar_url={otherAvatar} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate ${unread > 0 ? 'font-black text-gray-900' : 'font-bold text-gray-800'}`}>{otherUsername}</p>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-1">{ts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs truncate ${unread > 0 ? 'font-medium text-gray-700' : 'text-gray-400'}`}>{conv.lastMessage}</p>
                    {unread > 0 && (
                      <span className="ml-2 bg-primary text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">{unread}</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── RIGHT: Chat ── */}
      <div className={`flex-1 flex flex-col ${view === 'inbox' ? 'hidden md:flex' : 'flex'}`}>
        {!activeConvoId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-primary text-5xl">send</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Tus mensajes</h2>
            <p className="text-gray-500 text-sm max-w-xs">Busca un usuario para enviarle un mensaje privado.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-200 bg-white shrink-0">
              <button
                onClick={() => { setView('inbox'); setActiveConvoId(null); setActiveOther(null); }}
                className="md:hidden text-gray-400 hover:text-primary mr-1">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <button onClick={() => navigate(`/users/${activeOther?.username}`)}>
                <Avatar username={activeOther?.username} avatar_url={activeOther?.avatar} size="w-10 h-10" />
              </button>
              <div className="flex-1 min-w-0">
                <button onClick={() => navigate(`/users/${activeOther?.username}`)}
                  className="font-black text-gray-900 text-sm hover:text-primary transition-colors truncate block">
                  {activeOther?.username}
                </button>
              </div>
              <button onClick={() => navigate(`/users/${activeOther?.username}`)}
                className="text-gray-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </button>
            </div>

            {/* Messages list */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-[#f6faff]"
              style={{ scrollbarWidth: 'thin' }}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Avatar username={activeOther?.username} avatar_url={activeOther?.avatar} size="w-16 h-16" />
                  <p className="mt-4 font-black text-gray-900">{activeOther?.username}</p>
                  <p className="text-xs text-gray-400 mt-1">Di hola para empezar la conversación 👋</p>
                </div>
              )}
              {messages.map((msg, idx) => {
                const isMine = msg.senderUid === firebaseUser.uid;
                const ts = msg.createdAt?.toDate?.()?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) || '';
                const prevMsg = messages[idx - 1];
                const thisDay = msg.createdAt?.toDate?.()?.toLocaleDateString('es-ES');
                const prevDay = prevMsg?.createdAt?.toDate?.()?.toLocaleDateString('es-ES');
                const showDate = !prevMsg || prevDay !== thisDay;
                return (
                  <div key={msg.id}>
                    {showDate && thisDay && (
                      <div className="flex justify-center my-3">
                        <span className="text-[10px] text-gray-400 bg-white border border-gray-200 px-3 py-1 rounded-full">{thisDay}</span>
                      </div>
                    )}
                    <div className={`flex gap-2 items-end ${isMine ? 'flex-row-reverse' : ''}`}>
                      {!isMine && <Avatar username={activeOther?.username} avatar_url={activeOther?.avatar} size="w-7 h-7" />}
                      <div className={`max-w-[72%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-snug break-words ${
                          isMine ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-white text-gray-900 border border-gray-200 shadow-sm rounded-bl-sm'
                        }`}>{msg.content}</div>
                        <span className="text-[10px] text-gray-400 mx-1">{ts}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input bar */}
            <div className="px-4 py-3.5 border-t border-gray-200 bg-white shrink-0">
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={`Mensaje a ${activeOther?.username}…`}
                  maxLength={1000}
                  className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-gray-400"
                />
                <button onClick={send} disabled={!input.trim()}
                  className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 flex items-center justify-center transition-all active:scale-95 shrink-0">
                  <span className="material-symbols-outlined text-white text-[18px]">send</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
