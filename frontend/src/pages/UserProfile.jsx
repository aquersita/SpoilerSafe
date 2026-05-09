import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfileByUsername, equipReward } from '../services/userService';
import { updateUserProfile } from '../services/userService';
import { getFavorites } from '../services/favoritesService';
import { getWatchlist } from '../services/watchlistService';

/* ─── utils ────────────────────────────────────────────────────────────────── */
const cls = (...xs) => xs.filter(Boolean).join(' ');
const fmt = (n) => (n ?? 0).toLocaleString('es-ES');
const xpPct = (p) => {
  const s = p?.level_start_points ?? 0, e = p?.next_level_points ?? 100, v = p?.points ?? 0;
  return Math.max(0, Math.min(100, ((v - s) / Math.max(1, e - s)) * 100));
};
const seedHue = (str = '') => { let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const gradFor = (s) => { const h = seedHue(s); return `linear-gradient(135deg,hsl(${h} 65% 58%),hsl(${(h + 55) % 360} 70% 38%))`; };


const GENRE_TINT = {
  Action:        { bg: 'bg-rose-50',    fg: 'text-rose-700',    dot: 'bg-rose-500' },
  Adventure:     { bg: 'bg-amber-50',   fg: 'text-amber-700',   dot: 'bg-amber-500' },
  Comedy:        { bg: 'bg-yellow-50',  fg: 'text-yellow-800',  dot: 'bg-yellow-500' },
  Drama:         { bg: 'bg-violet-50',  fg: 'text-violet-700',  dot: 'bg-violet-500' },
  Fantasy:       { bg: 'bg-indigo-50',  fg: 'text-indigo-700',  dot: 'bg-indigo-500' },
  Romance:       { bg: 'bg-pink-50',    fg: 'text-pink-700',    dot: 'bg-pink-500' },
  'Sci-Fi':      { bg: 'bg-sky-50',     fg: 'text-sky-700',     dot: 'bg-sky-500' },
  Mystery:       { bg: 'bg-slate-100',  fg: 'text-slate-700',   dot: 'bg-slate-500' },
  Horror:        { bg: 'bg-zinc-100',   fg: 'text-zinc-800',    dot: 'bg-zinc-700' },
  Thriller:      { bg: 'bg-red-50',     fg: 'text-red-700',     dot: 'bg-red-500' },
  'Slice of Life':{ bg: 'bg-emerald-50',fg: 'text-emerald-700', dot: 'bg-emerald-500' },
  Sports:        { bg: 'bg-lime-50',    fg: 'text-lime-700',    dot: 'bg-lime-500' },
  Music:         { bg: 'bg-fuchsia-50', fg: 'text-fuchsia-700', dot: 'bg-fuchsia-500' },
  Mecha:         { bg: 'bg-cyan-50',    fg: 'text-cyan-700',    dot: 'bg-cyan-500' },
  Supernatural:  { bg: 'bg-purple-50',  fg: 'text-purple-700',  dot: 'bg-purple-500' },
};
const tintFor = (g) => GENRE_TINT[g] || { bg: 'bg-orange-50', fg: 'text-orange-700', dot: 'bg-orange-500' };

/* ─── inline SVG icons ──────────────────────────────────────────────────────── */
const Svg = ({ path, className = 'size-4', filled = false, ...rest }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} {...rest}>
    {Array.isArray(path) ? path.map((d, i) => <path key={i} d={d} />) : <path d={path} />}
  </svg>
);
const ICON = {
  star:    'm12 3 2.7 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.3 6.5 20.3l1.1-6.3L3 9.6l6.3-.9z',
  heart:   'M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 7a5.5 5.5 0 0 1 9.5 5C19 16.5 12 21 12 21z',
  bolt:    'M13 2 4 14h7l-1 8 9-12h-7z',
  flame:   'M12 3s4 4 4 8a4 4 0 1 1-8 0c0-2 1-3 2-4-2 4 2 4 2 8M6 14a6 6 0 0 0 12 0',
  trophy:  ['M8 4h8v3a4 4 0 0 1-8 0z','M5 5H3v2a3 3 0 0 0 3 3','M19 5h2v2a3 3 0 0 1-3 3','M9 13h6v3H9z','M8 20h8'],
  film:    ['M3 6h18v12H3z','M7 6v12M17 6v12M3 10h4M3 14h4M17 10h4M17 14h4'],
  book:    ['M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 0-2 2V5z','M19 17H6'],
  chat:    'M4 5h16v11H7l-3 3z',
  game:    ['M6 8h12a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4l-2-2H8l-2 2a4 4 0 0 1-4-4 4 4 0 0 1 4-4z','M9 12h2M10 11v2'],
  shield:  'M12 3 4 6v6c0 5 4 8 8 9 4-1 8-4 8-9V6z',
  users:   ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8','M22 21v-2a4 4 0 0 0-3-3.9','M16 3.1a4 4 0 0 1 0 7.8'],
  pin:     ['M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z','M12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  share:   ['M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7','M16 6l-4-4-4 4','M12 2v14'],
  edit:    'M4 20h4l10-10-4-4L4 16zM14 6l4 4',
  lock:    ['M5 11h14v10H5z','M8 11V7a4 4 0 0 1 8 0v4'],
  search:  ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z','M21 21l-5.2-5.2'],
  chevR:   'm9 6 6 6-6 6',
  chevL:   'm15 6-6 6 6 6',
  plus:    'M12 5v14M5 12h14',
  check:   'm5 12 5 5 9-11',
  sparkle: ['M12 3v4M12 17v4M3 12h4M17 12h4','M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2'],
  arrowR:  'M5 12h14m-5-5 5 5-5 5',
  message: 'M4 5h16v11H7l-3 3z',
  userPlus:['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8','M19 8v6M22 11h-6'],
  eye:     ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z','M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  layers:  ['m12 3 9 5-9 5-9-5z','M3 13l9 5 9-5','M3 17l9 5 9-5'],
  userRm:  ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8','M22 11h-6'],
  camera:  ['M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z','M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  x:       'M18 6 6 18M6 6l12 12',
};

/* ─── atoms ─────────────────────────────────────────────────────────────────── */
const Card = ({ children, className, padded = true }) => (
  <section className={cls(
    'rounded-2xl bg-white border border-slate-200/70',
    'shadow-[0_1px_0_rgba(15,23,42,0.04),0_10px_30px_-18px_rgba(15,23,42,0.18)]',
    padded && 'p-5', className
  )}>{children}</section>
);

const SectionHeader = ({ icon, title, hint, action, className }) => (
  <header className={cls('flex items-center justify-between mb-4', className)}>
    <div className="flex items-center gap-2.5 min-w-0 flex-1">
      <span className="grid place-items-center size-7 rounded-lg bg-orange-50 text-orange-600 ring-1 ring-orange-100">{icon}</span>
      <h3 className="text-[15px] font-bold text-slate-900 tracking-tight truncate">{title}</h3>
      {hint != null && <span className="text-[11px] font-semibold text-slate-400 tabular-nums">{hint}</span>}
    </div>
    {action}
  </header>
);

const Cover = ({ src, seed = '', alt = '', className, children }) => (
  <div className={cls('relative overflow-hidden bg-slate-200', className)}
    style={src ? undefined : { backgroundImage: gradFor(seed) }}>
    {src && <img src={src} alt={alt} className="absolute inset-0 size-full object-cover" loading="lazy" />}
    {!src && (
      <div className="absolute inset-0 grid place-items-center px-2 text-center">
        <span className="font-extrabold text-white/95 text-[11px] uppercase tracking-[0.14em] line-clamp-3 drop-shadow">{alt || seed}</span>
      </div>
    )}
    {children}
  </div>
);

const EmptyState = ({ icon, title, hint }) => (
  <div className="grid place-items-center text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
    <span className="grid place-items-center size-10 rounded-xl bg-white ring-1 ring-slate-200 text-slate-400 mb-2">
      <Svg path={icon} className="size-4" />
    </span>
    <div className="text-[13px] font-bold text-slate-700">{title}</div>
    {hint && <div className="text-[12px] text-slate-500 mt-0.5 max-w-xs">{hint}</div>}
  </div>
);

/* ─── Profile Header ────────────────────────────────────────────────────────── */
const ProfileHeader = ({ profile, isOwner, achievementsEarned, achievementsTotal, isFollowing, onEdit, onFollow, onMessage }) => {
  const xp = xpPct(profile);
  return (
    <div className="relative">
      <div className="relative h-44 sm:h-56 rounded-[28px] overflow-hidden ring-1 ring-slate-200/70">
        <Cover src={profile?.banner_url} seed={profile?.username || 'banner'} alt="" className="size-full">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/15 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_85%_-10%,rgba(249,115,22,0.45),transparent_55%)]" />
          <svg className="absolute inset-0 size-full opacity-25" viewBox="0 0 800 200" preserveAspectRatio="none">
            <path d="M0 170 L800 110" stroke="white" strokeWidth="2" strokeDasharray="2 6" fill="none" />
            <path d="M0 190 L800 140" stroke="white" strokeWidth="1" strokeDasharray="2 6" fill="none" />
          </svg>
        </Cover>
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/55 backdrop-blur-sm ring-1 ring-white/15">
          <Svg path={ICON.bolt} filled className="size-3.5 text-orange-400" />
          <span className="text-[11px] font-bold text-white tracking-wider uppercase">Nivel {profile?.level ?? 1}</span>
        </div>
      </div>

      <div className="relative px-1 sm:px-3 -mt-12">
        <div className="flex flex-col sm:flex-row sm:items-end gap-5">
          {/* avatar */}
          <div className="relative shrink-0">
            <div className="p-[3px] rounded-2xl"
              style={{ background: profile?.active_frame?.preview_color || 'linear-gradient(135deg,#f97316,#fb923c)' }}>
              <div className="rounded-[14px] bg-white p-1">
                <Cover src={profile?.avatar_url} seed={profile?.username} alt={profile?.username}
                  className="size-24 sm:size-28 rounded-xl" />
              </div>
            </div>
            {profile?.active_emoji && (
              <span className="absolute -bottom-1 -right-1 size-9 rounded-xl bg-white grid place-items-center ring-2 ring-white shadow-md overflow-hidden">
                {profile.active_emoji.image
                  ? <img src={profile.active_emoji.image} alt="" className="size-6 object-contain" />
                  : <span className="text-xl">{profile.active_emoji.emoji || '⭐'}</span>
                }
              </span>
            )}
          </div>

          {/* identity */}
          <div className="flex-1 min-w-0 sm:pb-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h1 className="text-[26px] sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-none">
                {profile?.username}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[11px] font-bold uppercase tracking-wider">
                <Svg path={ICON.shield} filled className="size-3" />{profile?.rank || 'Novato'}
              </span>
              {profile?.spoilers_safe > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <Svg path={ICON.check} className="size-3.5" />{fmt(profile.spoilers_safe)} spoilers safe
                </span>
              )}
            </div>
            {profile?.bio && <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-xl line-clamp-2">{profile.bio}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-500">
              {profile?.location && <span className="inline-flex items-center gap-1"><Svg path={ICON.pin} className="size-3.5" />{profile.location}</span>}
              <span className="inline-flex items-center gap-1">
                <Svg path={ICON.trophy} className="size-3.5" />{achievementsEarned}/{achievementsTotal} logros
              </span>
            </div>
          </div>

          {/* actions */}
          <div className="flex items-center gap-2 sm:pb-1">
            {isOwner ? (
              <button onClick={onEdit}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-sm shadow-orange-500/20 transition">
                <Svg path={ICON.edit} className="size-4" />Editar Perfil
              </button>
            ) : (
              <>
                <button onClick={onFollow}
                  className={cls('inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition',
                    isFollowing
                      ? 'bg-white border border-orange-300 text-orange-600 hover:bg-orange-50'
                      : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20')}>
                  <Svg path={isFollowing ? ICON.userRm : ICON.userPlus} className="size-4" />
                  {isFollowing ? 'Siguiendo' : 'Seguir'}
                </button>
                <button onClick={onMessage}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-semibold transition">
                  <Svg path={ICON.message} className="size-4" />Mensaje
                </button>
              </>
            )}
            <button aria-label="Compartir"
              className="inline-flex items-center justify-center size-10 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-600 transition">
              <Svg path={ICON.share} className="size-4" />
            </button>
          </div>
        </div>

        {/* XP rail */}
        <div className="mt-5 flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">XP {fmt(profile?.points)}</span>
          <div className="relative flex-1 h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
            <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-400" style={{ width: `${xp}%` }} />
          </div>
          <span className="text-[11px] font-semibold text-slate-400 tabular-nums">{Math.round(xp)}% al N{(profile?.level ?? 1) + 1}</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Quick stats ───────────────────────────────────────────────────────────── */
const QuickStat = ({ icon, label, value, accent = 'text-orange-600', tone = 'bg-orange-50' }) => (
  <div className="relative flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_0_rgba(15,23,42,0.04)] overflow-hidden">
    <span className={cls('grid place-items-center size-10 rounded-xl ring-1 ring-inset ring-current/10', tone, accent)}>
      <Svg path={icon} className="size-5" />
    </span>
    <div className="min-w-0">
      <div className="text-[22px] font-extrabold tracking-tight text-slate-900 leading-none tabular-nums">{value}</div>
      <div className="mt-1 text-[10.5px] font-bold tracking-[0.14em] uppercase text-slate-400">{label}</div>
    </div>
    <span className="absolute -right-6 -bottom-6 size-20 rounded-full bg-gradient-to-br from-orange-100/70 to-transparent" />
  </div>
);

/* ─── Anime card + carousel ─────────────────────────────────────────────────── */
const AnimeCard = ({ anime }) => {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(`/anime/${anime.id}`)} className="group block w-[148px] shrink-0 text-left">
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden ring-1 ring-slate-200/70 bg-slate-100">
        <Cover src={anime.coverImage} seed={anime.title} alt={anime.title} className="size-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
        {anime.averageScore != null && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/70 backdrop-blur-sm text-[10.5px] font-bold text-amber-300">
            <Svg path={ICON.star} filled className="size-2.5" />{anime.averageScore}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-2 translate-y-1 group-hover:translate-y-0 transition">
          <div className="text-[11px] font-bold text-white line-clamp-2 leading-tight drop-shadow">{anime.title}</div>
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        {(anime.genres || []).slice(0, 1).map((g) => (
          <span key={g} className={cls('inline-block size-1.5 rounded-full', tintFor(g).dot)} />
        ))}
        <span className="text-[11px] text-slate-500 truncate">{(anime.genres || [])[0] || 'Anime'}</span>
      </div>
    </button>
  );
};

const HCarousel = ({ children }) => {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  return (
    <div className="relative -mx-1">
      <div ref={ref} className="flex gap-3 overflow-x-auto scroll-smooth snap-x px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {React.Children.map(children, (c) => <div className="snap-start">{c}</div>)}
      </div>
      <button onClick={() => scroll(-1)} aria-label="Anterior"
        className="hidden md:grid place-items-center absolute -left-3 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white border border-slate-200 shadow-md text-slate-600 hover:text-orange-600 hover:border-orange-200 transition">
        <Svg path={ICON.chevL} className="size-4" />
      </button>
      <button onClick={() => scroll(1)} aria-label="Siguiente"
        className="hidden md:grid place-items-center absolute -right-3 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white border border-slate-200 shadow-md text-slate-600 hover:text-orange-600 hover:border-orange-200 transition">
        <Svg path={ICON.chevR} className="size-4" />
      </button>
    </div>
  );
};

const FavoritesSection = ({ favorites = [] }) => (
  <Card>
    <SectionHeader icon={<Svg path={ICON.heart} filled className="size-3.5" />} title="Mis Favoritos"
      hint={favorites.length ? `${favorites.length}` : undefined}
      action={<span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600">Ver todo <Svg path={ICON.chevR} className="size-3.5" /></span>}
    />
    {favorites.length === 0
      ? <EmptyState icon={ICON.heart} title="Aún no tienes favoritos" hint="Marca un anime como favorito desde su ficha." />
      : <HCarousel>{favorites.map((a) => <AnimeCard key={a.id} anime={a} />)}</HCarousel>}
  </Card>
);

const WatchlistSection = ({ watchlist = [] }) => {
  const navigate = useNavigate();
  return (
    <Card>
      <SectionHeader icon={<Svg path={ICON.eye} className="size-3.5" />} title="Mi Watchlist"
        hint={watchlist.length ? `${watchlist.length}` : undefined}
        action={
          <button onClick={() => navigate('/watchlist')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700">
            Gestionar <Svg path={ICON.chevR} className="size-3.5" />
          </button>
        }
      />
      {watchlist.length === 0
        ? <EmptyState icon={ICON.eye} title="Tu watchlist está vacía" hint="Añade animes que quieras ver más tarde." />
        : <HCarousel>{watchlist.map((a) => <AnimeCard key={a.id} anime={a} />)}</HCarousel>}
    </Card>
  );
};

/* ─── Genres ────────────────────────────────────────────────────────────────── */
const GenresSection = ({ genres = [] }) => {
  const navigate = useNavigate();
  return (
    <Card>
      <SectionHeader icon={<Svg path={ICON.layers} className="size-3.5" />} title="Géneros de Interés"
        hint={genres.length ? `${genres.length}` : undefined} />
      {genres.length === 0
        ? <p className="text-[13px] text-slate-500">Marca favoritos para perfilar tu gusto.</p>
        : (
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => {
              const name = g.name || g, t = tintFor(name);
              return (
                <button key={name} onClick={() => navigate(`/catalog?genre=${encodeURIComponent(name)}`)}
                  className={cls('inline-flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full border border-slate-200/70 text-[12px] font-semibold transition hover:scale-105', t.bg, t.fg)}>
                  <span className={cls('size-1.5 rounded-full', t.dot)} />
                  {name}{g.count != null && <span className="text-[11px] opacity-70 tabular-nums">{g.count}</span>}
                </button>
              );
            })}
          </div>
        )}
    </Card>
  );
};

/* ─── Featured + Mini dashboard ─────────────────────────────────────────────── */
const FeaturedAnimeBlock = ({ anime }) => {
  const navigate = useNavigate();
  if (!anime) return null;
  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-slate-900/5 bg-slate-900">
      <Cover src={anime.bannerImage || anime.coverImage} seed={anime.title} alt={anime.title} className="absolute inset-0 size-full" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/30" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_0%_100%,rgba(249,115,22,0.35),transparent_60%)]" />
      <div className="relative grid grid-cols-[88px_1fr] sm:grid-cols-[112px_1fr] gap-4 p-4 sm:p-5">
        <div className="rounded-xl overflow-hidden ring-1 ring-white/15 shadow-xl shadow-black/40 self-start">
          <Cover src={anime.coverImage} seed={anime.title} alt={anime.title} className="aspect-[2/3] w-full" />
        </div>
        <div className="min-w-0 flex flex-col gap-2 self-center text-white">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/95 text-white text-[10px] font-extrabold uppercase tracking-[0.14em]">
              <Svg path={ICON.flame} filled className="size-3" />Tu destacado
            </span>
            {anime.averageScore != null && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300">
                <Svg path={ICON.star} filled className="size-3" />{anime.averageScore}
              </span>
            )}
          </div>
          <h4 className="text-lg sm:text-xl font-extrabold tracking-tight leading-tight line-clamp-2">{anime.title}</h4>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(anime.genres || []).slice(0, 4).map((g) => (
              <span key={g} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/85 text-[10.5px] font-semibold ring-1 ring-white/15">
                <span className={cls('size-1.5 rounded-full', tintFor(g).dot)} />{g}
              </span>
            ))}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <button onClick={() => navigate(`/anime/${anime.id}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-900 text-[12px] font-bold hover:bg-orange-100 transition whitespace-nowrap">
              Ir a la ficha <Svg path={ICON.arrowR} className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MiniStat = ({ icon, label, value, max, tone, accent }) => {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="relative p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <span className={cls('grid place-items-center size-9 rounded-lg', tone, accent)}>
          <Svg path={icon} className="size-4" />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</span>
      </div>
      <div className="mt-3 text-[26px] leading-none font-extrabold tracking-tight text-slate-900 tabular-nums">{fmt(value)}</div>
      <div className="mt-3 h-1.5 rounded-full bg-white ring-1 ring-slate-200 overflow-hidden">
        <div className={cls('h-full rounded-full', accent.replace('text-', 'bg-'))} style={{ width: `${Math.max(6, pct)}%` }} />
      </div>
    </div>
  );
};

const FeaturedDashboardSection = ({ favorites = [], stats, profile }) => (
  <Card>
    <SectionHeader icon={<Svg path={ICON.flame} filled className="size-3.5" />} title="Tu Universo" />
    <div className="space-y-4">
      {favorites[0]
        ? <FeaturedAnimeBlock anime={favorites[0]} />
        : <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center">
            <p className="text-sm text-slate-500">Marca tu primer favorito para ver tu destacado aquí.</p>
          </div>
      }
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Resumen de actividad</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: ICON.film,    label: 'Episodios',    value: stats?.episodes_watched ?? 0, max: 1500, tone: 'bg-orange-50',  accent: 'text-orange-500' },
            { icon: ICON.book,    label: 'Cap. manga',   value: stats?.manga_chapters ?? 0,   max: 3000, tone: 'bg-violet-50',  accent: 'text-violet-500' },
            { icon: ICON.chat,    label: 'Comentarios',  value: stats?.comments ?? 0,         max: 500,  tone: 'bg-sky-50',     accent: 'text-sky-500' },
            { icon: ICON.game,    label: 'Juegos',       value: stats?.games_played ?? 0,     max: 100,  tone: 'bg-emerald-50', accent: 'text-emerald-500' },
            { icon: ICON.sparkle, label: 'Recomend.',    value: stats?.recommendations ?? 0,  max: 50,   tone: 'bg-fuchsia-50', accent: 'text-fuchsia-500' },
            { icon: ICON.shield,  label: 'Spoilers Safe',value: profile?.spoilers_safe ?? 0,  max: 200,  tone: 'bg-rose-50',    accent: 'text-rose-500' },
          ].map((d) => <MiniStat key={d.label} {...d} />)}
        </div>
      </div>
    </div>
  </Card>
);

/* ─── Right column ──────────────────────────────────────────────────────────── */
const RankCard = ({ profile }) => {
  const xp = xpPct(profile);
  const remaining = Math.max(0, (profile?.next_level_points ?? 0) - (profile?.points ?? 0));
  return (
    <section className="relative overflow-hidden rounded-2xl p-5 text-white"
      style={{ background: 'radial-gradient(120% 120% at 100% 0%,#2a4258 0%,#212E3C 55%,#161E29 100%)' }}>
      <div className="absolute -top-16 -right-16 size-56 rounded-full bg-orange-500/15 blur-3xl" />
      <div className="absolute -bottom-16 -left-10 size-48 rounded-full bg-sky-400/10 blur-3xl" />
      <div className="relative flex items-center gap-4">
        <div className="relative grid place-items-center size-20 shrink-0">
          <svg viewBox="0 0 100 100" className="size-20 -rotate-90">
            <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
            <circle cx="50" cy="50" r="42" stroke="url(#rg)" strokeWidth="8" fill="none" strokeLinecap="round"
              strokeDasharray={`${(xp / 100) * 264} 264`} />
            <defs>
              <linearGradient id="rg" x1="0" x2="1">
                <stop offset="0" stopColor="#fb923c" /><stop offset="1" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center leading-none">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/55">Nv</div>
              <div className="text-2xl font-extrabold tabular-nums">{profile?.level ?? 1}</div>
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300">Rango</div>
          <div className="text-xl font-extrabold leading-tight">{profile?.rank || 'Novato'}</div>
          <div className="mt-2 text-[11px] text-white/60">Faltan <b className="text-white/90 tabular-nums">{fmt(remaining)}</b> XP para el siguiente nivel</div>
        </div>
      </div>
      <div className="relative mt-5">
        <div className="flex items-center justify-between text-[11px] mb-2">
          <span className="text-white/60 font-semibold">Progreso al N{(profile?.level ?? 1) + 1}</span>
          <span className="font-bold tabular-nums text-orange-300">{Math.round(xp)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden ring-1 ring-white/5">
          <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-300 shadow-[0_0_12px_rgba(251,146,60,0.55)]"
            style={{ width: `${xp}%` }} />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10.5px] text-white/45 tabular-nums">
          <span>{fmt(profile?.level_start_points)}</span>
          <span>{fmt(profile?.next_level_points)}</span>
        </div>
      </div>
      <div className="relative mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white/5 ring-1 ring-white/5 px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/45">XP Total</div>
          <div className="text-[15px] font-bold tabular-nums">{fmt(profile?.points)}</div>
        </div>
        <div className="rounded-lg bg-white/5 ring-1 ring-white/5 px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/45">Spoilers Safe</div>
          <div className="text-[15px] font-bold tabular-nums">{fmt(profile?.spoilers_safe)}</div>
        </div>
      </div>
    </section>
  );
};

const StatsListCard = ({ stats, profile }) => (
  <Card>
    <SectionHeader icon={<Svg path={ICON.layers} className="size-3.5" />} title="Estadísticas" />
    <ul className="divide-y divide-slate-100">
      {[
        { key: 'episodes_watched', label: 'Episodios vistos', icon: ICON.film },
        { key: 'manga_chapters',   label: 'Capítulos manga',  icon: ICON.book },
        { key: 'comments',         label: 'Comentarios',      icon: ICON.chat },
        { key: 'games_played',     label: 'Juegos',           icon: ICON.game },
        { key: 'recommendations',  label: 'Recomendaciones',  icon: ICON.sparkle },
      ].map((s) => (
        <li key={s.key} className="flex items-center justify-between py-2.5 first:pt-1 last:pb-1">
          <span className="flex items-center gap-2.5 text-[13px] text-slate-700">
            <Svg path={s.icon} className="size-4 text-slate-400" />{s.label}
          </span>
          <span className="text-[14px] font-bold tabular-nums text-slate-900">{fmt(stats?.[s.key])}</span>
        </li>
      ))}
      <li className="flex items-center justify-between py-2.5 last:pb-1">
        <span className="flex items-center gap-2.5 text-[13px] text-slate-700">
          <Svg path={ICON.shield} className="size-4 text-orange-500" />Spoilers Safe
        </span>
        <span className="inline-flex items-center gap-1 text-[14px] font-bold tabular-nums text-orange-700">
          <Svg path={ICON.check} className="size-3.5" />{fmt(profile?.spoilers_safe)}
        </span>
      </li>
    </ul>
  </Card>
);

/* ─── Edit modal ────────────────────────────────────────────────────────────── */
const EditModal = ({ data, onChange, onSave, onClose, saving }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-slate-900">Editar Perfil</h2>
        <button onClick={onClose} className="grid place-items-center size-8 rounded-lg hover:bg-slate-100 text-slate-500">
          <Svg path={ICON.x} className="size-4" />
        </button>
      </div>
      <div className="space-y-4">
        {[
          { key: 'avatar_url', label: 'URL del avatar', placeholder: 'https://...' },
          { key: 'banner_url', label: 'URL del banner', placeholder: 'https://...' },
          { key: 'location',   label: 'Ubicación',      placeholder: 'Madrid, España' },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{f.label}</label>
            <input value={data[f.key] || ''} onChange={e => onChange(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
        ))}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Bio</label>
          <textarea value={data.bio || ''} onChange={e => onChange('bio', e.target.value)}
            placeholder="Cuéntanos algo sobre ti…" rows={3}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
        </div>
      </div>
      <div className="flex gap-2 mt-6 justify-end">
        <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
          Cancelar
        </button>
        <button onClick={onSave} disabled={saving}
          className="px-6 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50">
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  </div>
);

/* ─── Rewards ───────────────────────────────────────────────────────────────── */
const REWARDS = [
  { key: 'frame_bronze',  type: 'frame',  name: 'Marco Bronce',   description: 'Nivel 2',         required_level: 2,  preview_color: '#cd7f32' },
  { key: 'frame_silver',  type: 'frame',  name: 'Marco Plata',    description: 'Nivel 4',         required_level: 4,  preview_color: '#c0c0c0' },
  { key: 'frame_gold',    type: 'frame',  name: 'Marco Oro',      description: 'Nivel 6',         required_level: 6,  preview_color: '#ffd700' },
  { key: 'frame_diamond', type: 'frame',  name: 'Marco Diamante', description: 'Nivel 8',         required_level: 8,  preview_color: '#b9f2ff' },
  { key: 'emoji_fire',    type: 'emoji',  name: '🔥 Llama',       description: '5 eps vistos',    required_episodes: 5,   emoji: '🔥' },
  { key: 'emoji_star',    type: 'emoji',  name: '⭐ Estrella',    description: '25 eps vistos',   required_episodes: 25,  emoji: '⭐' },
  { key: 'emoji_crown',   type: 'emoji',  name: '👑 Corona',      description: '100 eps vistos',  required_episodes: 100, emoji: '👑' },
  { key: 'banner_orange', type: 'banner', name: 'Banner Naranja', description: 'Nivel 3',         required_level: 3,  preview_color: 'linear-gradient(135deg,#f97316,#ef4444)' },
  { key: 'banner_blue',   type: 'banner', name: 'Banner Océano',  description: 'Nivel 5',         required_level: 5,  preview_color: 'linear-gradient(135deg,#3b82f6,#06b6d4)' },
  { key: 'banner_purple', type: 'banner', name: 'Banner Galaxia', description: 'Nivel 7',         required_level: 7,  preview_color: 'linear-gradient(135deg,#8b5cf6,#ec4899)' },
];

const RewardsCard = ({ profile, stats, isOwner, onEquip }) => {
  const level = profile?.level ?? 1;
  const eps   = stats?.episodes_watched ?? 0;

  const isUnlocked = (r) => {
    if (r.required_level && level < r.required_level) return false;
    if (r.required_episodes && eps < r.required_episodes) return false;
    return true;
  };

  const isEquipped = (r) => {
    if (r.type === 'frame')  return profile?.active_frame  === r.key;
    if (r.type === 'banner') return profile?.active_banner === r.key;
    if (r.type === 'emoji')  return profile?.active_emoji  === r.key;
    return false;
  };

  return (
    <Card>
      <SectionHeader icon={<Svg path={ICON.trophy} className="size-3.5" />} title="Recompensas" />
      <div className="space-y-1.5">
        {REWARDS.map((r) => {
          const unlocked = isUnlocked(r);
          const equipped = isEquipped(r);
          return (
            <div key={r.key} className={cls(
              'flex items-center gap-3 p-2.5 rounded-xl border transition-all',
              equipped ? 'border-orange-300 bg-orange-50/60' :
              unlocked ? 'border-slate-200 bg-white hover:border-orange-200' :
              'border-slate-100 bg-slate-50/50 opacity-60'
            )}>
              <div className="size-8 rounded-lg shrink-0 flex items-center justify-center text-lg overflow-hidden"
                style={{ background: r.preview_color || '#f0f0f0' }}>
                {r.type === 'emoji' ? r.emoji : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-slate-800 truncate">{r.name}</p>
                <p className="text-[10px] text-slate-500">{r.description}</p>
              </div>
              {isOwner && unlocked && (
                <button
                  onClick={() => onEquip(r)}
                  disabled={equipped}
                  className={cls(
                    'shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all',
                    equipped
                      ? 'bg-orange-500 text-white cursor-default'
                      : 'bg-slate-100 text-slate-600 hover:bg-orange-100 hover:text-orange-700'
                  )}
                >
                  {equipped ? 'Equipado' : 'Equipar'}
                </button>
              )}
              {!unlocked && (
                <span className="shrink-0"><Svg path={ICON.lock} className="size-3.5 text-slate-400" /></span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

/* ─── Page component (data fetching) ────────────────────────────────────────── */
const UserProfile = () => {
  const navigate = useNavigate();
  const { username } = useParams();
  const { profile: authProfile, setProfile: setAuthProfile } = useAuth();

  const [profile, setProfile]           = useState(null);
  const [rawFavorites, setRawFavorites] = useState([]);
  const [rawWatchlist, setRawWatchlist] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [isEditing, setIsEditing]       = useState(false);
  const [editData, setEditData]         = useState({ avatar_url: '', banner_url: '', bio: '', location: '' });
  const [isSaving, setIsSaving]         = useState(false);

  const isOwner = !username || (authProfile && profile?.username === authProfile?.username);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      setLoading(true);
      try {
        let profileData = null;
        if (username) {
          profileData = await getUserProfileByUsername(username);
        } else if (authProfile) {
          profileData = authProfile;
        }

        if (profileData) {
          setProfile(profileData);
          setEditData({
            avatar_url: profileData.avatar_url || '',
            banner_url: profileData.banner_url || '',
            bio: profileData.bio || '',
            location: profileData.location || '',
          });

          const uid = profileData.uid;
          if (uid) {
            const [favsData, wlData] = await Promise.allSettled([
              getFavorites(uid),
              getWatchlist(uid),
            ]);
            if (favsData.status === 'fulfilled') setRawFavorites(favsData.value);
            if (wlData.status === 'fulfilled') setRawWatchlist(wlData.value);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [username, authProfile?.uid]);

  /* ── data mapping ── */
  const mapAnime = (a) => ({
    id: a.id || a.media_id,
    title: a.title?.romaji || a.title?.english || a.title || '',
    coverImage: a.coverImage?.extraLarge || a.coverImage?.large || a.coverImage || a.cover_image,
    bannerImage: a.bannerImage || a.banner_image,
    averageScore: a.averageScore ? (a.averageScore / 10).toFixed(1) : (a.average_score ? (a.average_score / 10).toFixed(1) : null),
    genres: a.genres || [],
  });

  const favorites = useMemo(() => rawFavorites.map(mapAnime), [rawFavorites]);
  const watchlist = useMemo(() => rawWatchlist.map(mapAnime), [rawWatchlist]);

  const topGenres = useMemo(() => {
    const counts = {};
    favorites.forEach(f => (f.genres || []).forEach(g => { counts[g] = (counts[g] || 0) + 1; }));
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [favorites]);

  /* ── handlers ── */
  const handleSave = async () => {
    if (!authProfile?.uid) return;
    setIsSaving(true);
    try {
      await updateUserProfile(authProfile.uid, editData);
      setProfile(prev => ({ ...prev, ...editData }));
      setAuthProfile(prev => ({ ...prev, ...editData }));
      setIsEditing(false);
    } catch { alert('Error al guardar.'); }
    finally { setIsSaving(false); }
  };

  const handleEquip = async (reward) => {
    if (!authProfile?.uid) return;
    try {
      const updates = await equipReward(authProfile.uid, reward.type, reward.key, reward.image || '');
      setProfile(prev => ({ ...prev, ...updates }));
      setAuthProfile(prev => ({ ...prev, ...updates }));
    } catch (err) {
      alert(err.message || 'Error al equipar');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6faff]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
    </div>
  );

  const achievements = [];
  const earned = 0;
  const stats = profile?.stats || { episodes_watched: 0, manga_chapters: 0, comments: 0 };

  return (
    <div className="min-h-screen bg-[#f6faff] text-slate-800 antialiased">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        <ProfileHeader
          profile={profile}
          isOwner={isOwner}
          achievementsEarned={earned}
          achievementsTotal={achievements.length}
          isFollowing={profile?.is_following}
          onEdit={() => setIsEditing(true)}
          onFollow={() => {}}
          onMessage={() => navigate(`/messages/${profile?.username}`)}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickStat icon={ICON.users}    label="Seguidores" value={fmt(profile?.followers_count)} tone="bg-rose-50"   accent="text-rose-600" />
          <QuickStat icon={ICON.userPlus} label="Siguiendo"  value={fmt(profile?.following_count)} tone="bg-violet-50" accent="text-violet-600" />
          <QuickStat icon={ICON.bolt}     label="Puntos XP"  value={fmt(profile?.points)}          tone="bg-orange-50" accent="text-orange-600" />
          <QuickStat icon={ICON.trophy}   label="Logros"     value={`${earned}/${achievements.length}`} tone="bg-amber-50" accent="text-amber-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT */}
          <div className="lg:col-span-8 space-y-5">
            <FavoritesSection favorites={favorites} />
            <GenresSection genres={topGenres} />
            <FeaturedDashboardSection favorites={favorites} stats={stats} profile={profile} />
            {isOwner && watchlist.length > 0 && <WatchlistSection watchlist={watchlist} />}
          </div>

          {/* RIGHT */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
            <RankCard profile={profile} />
            <StatsListCard stats={stats} profile={profile} />
            <RewardsCard profile={profile} stats={stats} isOwner={isOwner} onEquip={handleEquip} />
          </aside>
        </div>
      </div>

      {isEditing && (
        <EditModal
          data={editData}
          onChange={(key, val) => setEditData(prev => ({ ...prev, [key]: val }))}
          onSave={handleSave}
          onClose={() => setIsEditing(false)}
          saving={isSaving}
        />
      )}
    </div>
  );
};

export default UserProfile;
