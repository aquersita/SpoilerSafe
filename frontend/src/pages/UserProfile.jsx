import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const UserProfile = () => {
    const navigate = useNavigate();
    const { username } = useParams();
    const [profile, setProfile] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hideSpoilers, setHideSpoilers] = useState(false);

    // For local data
    const token = localStorage.getItem('token');

    useEffect(() => {
        window.scrollTo(0, 0);
        document.documentElement.classList.remove('dark');

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch user
                const endpoint = username ? `http://localhost:8000/users/${username}` : `http://localhost:8000/users/me/profile`;
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                try {
                    const userRes = await axios.get(endpoint, { headers });
                    setProfile(userRes.data);
                } catch (err) {
                    // Fallback local profile if backend fails
                    setProfile({
                        username: username || "OtakuLegend77",
                        role: "user",
                        created_at: "2021-01-01T00:00:00.000000"
                    });
                }

                // Fetch real anime for the UI (Favorites/Activity)
                const trendRes = await axios.get('http://localhost:8000/anime/trending');
                setFavorites(trendRes.data.data.Page.media.slice(0, 10)); // Get 10 animes to show

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [username, token]);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-800">Cargando Perfil...</div>;

    const displayUsername = profile?.username || "OtakuLegend77";
    const joinedYear = profile?.created_at ? new Date(profile.created_at).getFullYear() : 2021;

    return (
        <div className="fixed inset-0 z-[100] bg-background-light text-slate-900 font-display antialiased overflow-y-auto overflow-x-hidden flex flex-col">
            {/* Navbar */}
            <header className="sticky top-0 z-[110] flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f5f2f0] bg-white px-4 py-3 shadow-sm md:px-10">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-4 text-[#181411] cursor-pointer" onClick={() => navigate('/')}>
                        <div className="text-primary">
                            <span className="material-symbols-outlined text-4xl">live_tv</span>
                        </div>
                        <h2 className="text-[#181411] text-xl font-bold leading-tight tracking-[-0.015em] hidden md:block">SpoilerSafe</h2>
                    </div>
                    <label className="hidden md:flex flex-col min-w-40 !h-10 max-w-64">
                        <div className="flex w-full flex-1 items-stretch rounded-lg h-full group focus-within:ring-2 focus-within:ring-primary/20">
                            <div className="text-[#8a7160] flex border-none bg-[#f5f2f0] items-center justify-center pl-4 rounded-l-lg border-r-0">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </div>
                            <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#181411] focus:outline-0 focus:ring-0 border-none bg-[#f5f2f0] h-full placeholder:text-[#8a7160] px-4 rounded-l-none border-l-0 pl-2 text-sm font-normal leading-normal" placeholder="Search anime..." defaultValue="" />
                        </div>
                    </label>
                </div>
                <div className="flex flex-1 justify-end gap-4 md:gap-8 items-center">
                    <div className="hidden lg:flex items-center gap-9">
                        <a className="text-[#181411] text-sm font-medium leading-normal hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/')}>Home</a>
                        <a className="text-[#181411] text-sm font-medium leading-normal cursor-pointer hover:text-primary transition-colors">Browse</a>
                        <a className="text-[#181411] text-sm font-medium leading-normal cursor-pointer hover:text-primary transition-colors">News</a>
                        <a className="text-[#181411] text-sm font-medium leading-normal cursor-pointer hover:text-primary transition-colors">Forum</a>
                    </div>
                </div>
            </header>

            <main className="flex-grow w-full max-w-[1440px] mx-auto pb-12">
                {/* Profile Hero Section */}
                <div className="relative w-full">
                    {/* Cover Image */}
                    <div className="h-48 md:h-64 lg:h-80 w-full overflow-hidden bg-gray-900 relative">
                        {favorites[0] && (
                            <div className="w-full h-full bg-cover bg-center absolute inset-0 opacity-70" style={{ backgroundImage: `url('${favorites[0].bannerImage || favorites[0].coverImage.extraLarge}')` }}></div>
                        )}
                        <div className="w-full h-full bg-gradient-to-t from-black/60 to-transparent absolute inset-0"></div>
                        <button className="absolute top-4 right-4 md:top-6 md:right-10 bg-primary hover:bg-orange-600 active:bg-orange-700 text-white px-4 py-2 rounded-lg backdrop-blur-sm shadow-md text-sm font-medium flex items-center gap-2 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                            <span className="hidden sm:inline">Edit Cover</span>
                        </button>
                    </div>

                    {/* Profile Info Overlay */}
                    <div className="px-4 md:px-10 lg:px-40 relative">
                        <div className="flex flex-col md:flex-row items-end md:items-end gap-6 -mt-16 md:-mt-20 mb-6">
                            {/* Avatar */}
                            <div className="relative group">
                                <div className="size-32 md:size-40 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden relative z-10">
                                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://i.pinimg.com/736x/8e/d5/47/8ed547f4803dfbaed6ee9c7b949987ce.jpg')" }}></div>
                                </div>
                                <div className="absolute bottom-2 right-2 z-20 bg-green-500 size-4 md:size-5 rounded-full border-2 border-white" title="Online"></div>
                            </div>

                            {/* Name & Badges */}
                            <div className="flex-1 pb-2 text-center md:text-left text-slate-900 mt-16 md:mt-0">
                                <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center justify-center md:justify-start gap-2">
                                    {displayUsername}
                                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border border-primary/20">
                                        <span className="material-symbols-outlined text-[14px]">verified</span>
                                        {profile?.role === 'admin' ? 'Admin' : 'Critic'}
                                    </span>
                                </h1>
                                <p className="text-slate-500 text-sm font-medium mb-1">Tokyo, Japan • Joined {joinedYear}</p>
                                <p className="text-slate-600 max-w-lg hidden md:block text-sm">Passionate about Shonen and Slice of Life. Always looking for the next hidden gem. Don't spoil me!</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pb-4 w-full md:w-auto justify-center md:justify-end">
                                <button className="flex items-center justify-center gap-2 bg-primary hover:bg-orange-600 active:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1">
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                    Edit Profile
                                </button>
                                <button className="flex items-center justify-center gap-2 bg-primary hover:bg-orange-600 active:bg-orange-700 text-white px-4 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all focus:outline-none border-none">
                                    <span className="material-symbols-outlined text-[18px]">share</span>
                                </button>
                            </div>
                        </div>

                        {/* Stats Bar */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-wrap justify-around md:justify-start md:gap-12 mb-8">
                            <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-[80px]">
                                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Seguidores</span>
                                <span className="text-2xl font-bold text-slate-900">12.5k</span>
                            </div>
                            <div className="w-px h-12 bg-slate-100 hidden md:block"></div>
                            <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-[80px]">
                                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Seguidos</span>
                                <span className="text-2xl font-bold text-slate-900">142</span>
                            </div>
                            <div className="w-px h-12 bg-slate-100 hidden md:block"></div>
                            <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-[80px]">
                                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                                    Puntos
                                    <span className="material-symbols-outlined text-[16px] text-yellow-500">star</span>
                                </span>
                                <span className="text-2xl font-bold text-slate-900">15,400</span>
                            </div>
                            <div className="w-px h-12 bg-slate-100 hidden md:block"></div>
                            <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-[80px]">
                                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Logros</span>
                                <span className="text-2xl font-bold text-slate-900">24</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="px-4 md:px-10 lg:px-40 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Sidebar */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                        {/* Achievements / Logros */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">trophy</span>
                                    Logros
                                </h3>
                                <a className="text-sm font-semibold text-primary hover:text-orange-600" href="#">View All</a>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4 group cursor-pointer">
                                    <div className="relative size-14 shrink-0">
                                        <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse"></div>
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-full border-2 border-primary text-primary">
                                            <span className="material-symbols-outlined">smart_display</span>
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">Lvl 5</div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm transition-colors">100 Episodes Watched</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Unlocked 2 days ago</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group cursor-pointer">
                                    <div className="relative size-14 shrink-0">
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-full border-2 border-slate-200 text-slate-400">
                                            <span className="material-symbols-outlined">done_all</span>
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-slate-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">Lvl 3</div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm transition-colors">Season Finisher</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Unlocked last week</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Current Level Widget */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl shadow-md text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <span className="material-symbols-outlined text-9xl text-white">military_tech</span>
                            </div>
                            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-1">Current Rank</h3>
                            <div className="text-3xl font-bold mb-4 text-white">Elite Otaku</div>
                            <div className="flex justify-between text-xs text-slate-300 mb-2 font-medium">
                                <span>XP: 15,400</span>
                                <span>Next: 20,000</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-2.5 mb-4">
                                <div className="bg-primary h-2.5 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                            <button className="w-full py-2 bg-primary hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-sm outline-none">
                                View Progression
                            </button>
                        </div>
                    </div>

                    {/* Right Main Column */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        {/* Favorites Section */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-red-500">favorite</span>
                                    Mis Favoritos
                                </h2>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {favorites.slice(0, 5).map(anime => (
                                    <div key={anime.id} onClick={() => navigate(`/anime/${anime.id}`)} className="group relative aspect-[2/3] bg-slate-200 rounded-lg overflow-hidden shadow-sm cursor-pointer border border-slate-100">
                                        <div className="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-110" style={{ backgroundImage: `url('${anime.coverImage.extraLarge || anime.coverImage.large}')` }}></div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                            <h4 className="text-white text-sm font-bold line-clamp-2">{anime.title.romaji || anime.title.english}</h4>
                                            <div className="flex items-center gap-1 text-yellow-400 text-xs mt-1">
                                                <span className="material-symbols-outlined text-[14px] fill-current">star</span> {(anime.averageScore / 10).toFixed(1) || "5.0"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Activity Feed */}
                        <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">history</span>
                                    Actividad Reciente
                                </h2>

                                {/* Toggle for Spoilers */}
                                <div onClick={() => setHideSpoilers(!hideSpoilers)} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 cursor-pointer select-none">
                                    <span className={`material-symbols-outlined text-[18px] ${hideSpoilers ? 'text-primary' : 'text-slate-400'}`}>
                                        {hideSpoilers ? 'visibility_off' : 'visibility'}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-600">Hide Spoilers</span>
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${hideSpoilers ? 'bg-primary' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-0.5 size-3 bg-white rounded-full shadow-sm transition-all ${hideSpoilers ? 'right-0.5' : 'left-0.5'}`}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative pl-4 border-l-2 border-slate-100 space-y-8">
                                {favorites.slice(0, 3).map((anime, index) => (
                                    <div key={anime.id} className="relative pl-6">
                                        <div className={`absolute -left-[23px] top-0 size-10 bg-white rounded-full border-2 border-slate-100 flex items-center justify-center ${index === 0 ? 'text-primary' : index === 1 ? 'text-yellow-500' : 'text-red-400'}`}>
                                            <span className="material-symbols-outlined text-[20px]">
                                                {index === 0 ? 'play_circle' : index === 1 ? 'star' : 'forum'}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    {index === 0 ? 'Watched' : index === 1 ? 'Rated' : 'Commented'}
                                                </span>
                                                <span className="text-xs text-slate-400">• {index + 1} days ago</span>
                                            </div>
                                            <h3 className="text-slate-900 font-bold mb-2 cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/anime/${anime.id}`)}>
                                                {anime.title.romaji || anime.title.english}
                                            </h3>

                                            {index === 0 && (
                                                <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 max-w-[200px]">
                                                    <div className="bg-primary h-1.5 rounded-full" style={{ width: '100%' }}></div>
                                                </div>
                                            )}

                                            {index === 1 && (
                                                <div className="flex items-center gap-1 my-1">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <span key={star} className="material-symbols-outlined text-yellow-400 text-[18px] fill-current">star</span>
                                                    ))}
                                                    <p className="text-slate-600 text-sm italic ml-2">"Absolute masterpiece, amazing animation!"</p>
                                                </div>
                                            )}

                                            {index === 2 && (
                                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 relative overflow-hidden group">
                                                    {hideSpoilers && (
                                                        <div className="absolute inset-0 bg-slate-100/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-opacity duration-300 opacity-100 hover:opacity-0 cursor-pointer">
                                                            <span className="material-symbols-outlined text-slate-400 text-3xl mb-1">visibility_off</span>
                                                            <span className="text-xs font-bold text-slate-500 uppercase">Spoiler Warning</span>
                                                            <span className="text-[10px] text-slate-400">Hover to reveal</span>
                                                        </div>
                                                    )}
                                                    <p className="text-slate-700 text-sm">
                                                        Luffy using gear 5 was absolutely incredible!
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full mt-6 py-3 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors shadow-sm cursor-pointer outline-none">
                                Load More Activity
                            </button>
                        </section>
                    </div>
                </div>
            </main>

            <footer className="bg-white border-t border-slate-100 py-8 mt-auto shrink-0">
                <div className="max-w-[1440px] mx-auto px-4 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-2xl">live_tv</span>
                        <span className="font-bold text-slate-900">SpoilerSafe</span>
                    </div>
                    <div className="text-sm text-slate-500">
                        © 2026 SpoilerSafe Inc. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default UserProfile;
