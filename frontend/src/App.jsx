import { useState, useEffect } from 'react'
import axios from 'axios'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Login from './components/Login'
import Home from './pages/Home'
import AnimeDetails from './pages/AnimeDetails'
import EpisodePlayer from './pages/EpisodePlayer'
import UserProfile from './pages/UserProfile'
import Sidebar from './components/Sidebar'

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
        await axios.get('http://localhost:8000/');
        setBackendStatus('Conectado');
        setIsBackendUp(true);

        // Fetch User Profile if token exists
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const profileRes = await axios.get('http://localhost:8000/users/me/profile', {
              headers: { Authorization: `Bearer ${token}` }
            });
            setUser(profileRes.data);
          } catch (e) {
            console.error("Token invalid or expired");
            localStorage.removeItem('token');
          }
        }

        // Fetch Trending
        const res = await axios.get('http://localhost:8000/anime/trending');
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
      const profileRes = await axios.get('http://localhost:8000/users/me/profile', {
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
      <Sidebar />

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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )

}

export default App
