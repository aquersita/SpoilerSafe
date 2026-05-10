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
import Messages from './pages/Messages';
import { useAuth } from './context/AuthContext';

function App() {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background-light font-sans">
      <Navbar
        onLoginClick={() => navigate('/login')}
        onLogoClick={() => navigate('/')}
        user={profile}
        onLogout={logout}
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

      <main className="md:pl-16 pt-16 min-h-screen">
        <Routes>
          <Route path="/" element={
            <Home
              popularAnime={[]}
              isBackendUp={true}
              backendStatus="Firebase"
            />
          } />

          <Route path="/login" element={
            <div className="pt-20">
              <Login onLogin={() => navigate('/')} />
            </div>
          } />

          <Route path="/anime/:id" element={<AnimeDetails user={profile} />} />
          <Route path="/anime/:id/episode/:episodeNumber" element={<EpisodePlayer user={profile} />} />
          <Route path="/users/:username" element={<UserProfile />} />

          {/* Nuevas Secciones */}
          <Route path="/manga" element={<Manga />} />
          <Route path="/manga/:id" element={<MangaDetails />} />
          <Route path="/games" element={<Games />} />
          <Route path="/news" element={<News />} />
          <Route path="/new-releases" element={<NewReleases />} />
          <Route path="/store" element={<Store />} />
          <Route path="/watchlist" element={<Watchlist user={profile} />} />
          <Route path="/premium" element={<Premium user={profile} />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/settings" element={<Settings user={profile} />} />
          <Route path="/history" element={<History user={profile} />} />
          <Route path="/admin" element={<AdminPanel user={profile} />} />
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
