import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationRead } from '../services/notificationsService';
import { useAuth } from '../context/AuthContext';

function timeAgo(ms) {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min || 1} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h`;
  const d = Math.floor(hr / 24);
  return `${d} d`;
}

function IconForType({ type }) {
  switch (type) {
    case 'anime': return <span className="material-symbols-outlined text-primary">play_circle</span>;
    case 'manga': return <span className="material-symbols-outlined text-violet-500">menu_book</span>;
    case 'episode': return <span className="material-symbols-outlined text-amber-500">subscriptions</span>;
    case 'news': return <span className="material-symbols-outlined text-sky-500">newspaper</span>;
    case 'follow': return <span className="material-symbols-outlined text-emerald-500">person_add</span>;
    case 'message': return <span className="material-symbols-outlined text-rose-500">chat</span>;
    default: return <span className="material-symbols-outlined text-gray-500">notifications</span>;
  }
}

export default function NotificationDropdown({ onClose }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    const fetchNotifs = async () => {
      if (profile?.uid) {
        const data = await getNotifications(profile.uid);
        setNotifications(data);
      }
      setLoading(false);
    };
    fetchNotifs();
  }, [profile?.uid]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleClick = async (n) => {
    if (!n.isGlobal && !n.read && n.docId) {
      // Mark as read in Firestore
      await markNotificationRead(profile.uid, n.docId);
    }
    onClose();
    if (n.link) navigate(n.link);
  };

  const unreadCount = notifications.filter(n => !n.isGlobal && !n.read).length;

  return (
    <div ref={ref} className="absolute top-14 right-0 w-[360px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl py-2 z-[100] overflow-hidden transform opacity-100 scale-100 transition-all origin-top-right flex flex-col max-h-[500px]">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">notifications</span>
          Notificaciones
        </h3>
        {unreadCount > 0 && (
          <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {unreadCount} nuevas
          </span>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">notifications_paused</span>
            <p className="text-sm">No tienes notificaciones.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left flex gap-3 p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${!n.isGlobal && !n.read ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
              >
                <div className="relative shrink-0 mt-1">
                  {n.image ? (
                    <img src={n.image} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600 bg-gray-100" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <IconForType type={n.type} />
                    </div>
                  )}
                  {/* Badge */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm">
                    <IconForType type={n.type} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {n.title}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap ml-2">
                      {timeAgo(n.date)}
                    </span>
                  </div>
                  <p className={`text-sm line-clamp-2 ${!n.isGlobal && !n.read ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                    {n.body}
                  </p>
                </div>
                {!n.isGlobal && !n.read && (
                  <div className="shrink-0 flex items-center ml-1">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
