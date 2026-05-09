import { useState, useEffect } from 'react'
import axios from 'axios'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Login from './components/Login'
import Home from './pages/Home'
import AnimeDetails from './pages/AnimeDetails'
import EpisodePlayer from './pages/EpisodePlayer'
import UserProfile from './pages/UserProfile'
import ComingSoon from './pages/ComingSoon'
import Sidebar from './components/Sidebar'
import { Toaster } from 'react-hot-toast'
import AnimatedTransitions from './components/AnimatedTransitions';
import Catalog from './pages/Catalog';
import Settings from './pages/Settings';
import Premium from './pages/Premium';
import Manga from './pages/Manga';
import MangaDetails from './pages/MangaDetails';
import Games from './pages/Games';
import Store from './pages/Store';
import News from './pages/News';
import NewReleases from './pages/NewReleases';
import Watchlist from './pages/Watchlist';
import History from './pages/History';
import AdminPanel from './pages/AdminPanel'
import ChatWidget from './components/ChatWidget'
import Messages from './pages/Messages';
import { API } from './utils/api.js';

// Mock removed - fetching from API
function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...')
  const [isBackendUp, setIsBackendUp] = useState(false)
  const [user, setUser] = useState(null)
  const [popularAnime, setPopularAnime] = useState([])

  const navigate = useNavigate();

  useEffect(() => {
    // Check Backend Health & Fetch Data
    const init = async () => {
      try {
        await axios.get(`${API}/`);
        setBackendStatus('Conectado');
        setIsBackendUp(true);

        // Fetch User Profile if token exists
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const profileRes = await axios.get(`${API}/users/me/profile`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setUser(profileRes.data);
          } catch (e) {
            console.error("Token invalid or expired");
            localStorage.removeItem('token');
          }
        }

        // Fetch Trending
        const res = await axios.get(`${API}/anime/trending`);
        const trending = res.data.data.Page.media.map(a => ({
          id: a.id,
          title: a.title.romaji,
          image: a.coverImage.extraLarge || a.coverImage.large,
          type: a.format || 'TV'
        }));
        setPopularAnime(trending);
      } catch (err) {
        console.error(err);
        setBackendStatus('Desconectado');
        setIsBackendUp(false);
      }
    };
    init();
  }, [])

  const handleLogin = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      const profileRes = await axios.get(`${API}/users/me/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(profileRes.data);
    }
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-background-light font-sans">
      <Navbar
        onLoginClick={() => navigate('/login')}
        onLogoClick={() => navigate('/')}
        user={user}
      />
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 'bold',
        },
        success: {
          iconTheme: {
            primary: '#f97316',
            secondary: '#fff',
          },
        },
      }} />
      <Sidebar />

      <ChatWidget />

      <main className="md:pl-16 pt-16 min-h-screen">
        <Routes>
          <Route path="/" element={
            <Home
              popularAnime={popularAnime}
              isBackendUp={isBackendUp}
              backendStatus={backendStatus}
            />
          } />

          <Route path="/login" element={
            <div className="pt-20">
              <Login onLogin={handleLogin} />
            </div>
          } />

          <Route path="/anime/:id" element={<AnimeDetails user={user} />} />
          <Route path="/anime/:id/episode/:episodeNumber" element={<EpisodePlayer user={user} />} />
          <Route path="/users/:username" element={<UserProfile />} />

          {/* Nuevas Secciones */}
          <Route path="/manga" element={<Manga />} />
          <Route path="/manga/:id" element={<MangaDetails />} />
          <Route path="/games" element={<Games />} />
          <Route path="/news" element={<News />} />
          <Route path="/new-releases" element={<NewReleases />} />
          <Route path="/store" element={<Store />} />
          <Route path="/watchlist" element={<Watchlist user={user} />} />
          <Route path="/premium" element={<Premium user={user} />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/settings" element={<Settings user={user} onUserUpdate={setUser} />} />
          <Route path="/history" element={<History user={user} />} />
          <Route path="/admin" element={<AdminPanel user={user} />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:username" element={<Messages />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )

}

export default App
