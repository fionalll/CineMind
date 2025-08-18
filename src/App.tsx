import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import { MovieProvider } from './context/MovieContext';
import { WatchedProvider } from './context/WatchedContext';
import { WatchlistProvider } from './context/WatchlistContext';
import { ThemeProvider } from './context/ThemeContext';
import HomePage from './pages/HomePage';
import DizilerPage from './pages/DizilerPage';
import ChatbotPage from './pages/ChatbotPage';
import WatchedMoviesPage from './pages/WatchedMoviesPage';
import HesabimPage from './pages/HesabimPage';
import UserProfilePage from './pages/UserProfilePage';
import SearchResultsPage from './pages/SearchResultsPage';
import PersonCreditsPage from './pages/PersonCreditsPage';
import RandomEpisodePage from './pages/RandomEpisodePage';
import LoginRegister from './components/LoginRegister';
import TestPage from './pages/TestPage';

const AppContent = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <LoginRegister />;
  }

  return (
    <MovieProvider>
      <WatchedProvider>
        <WatchlistProvider>
          <Router>
            <div className="min-h-screen bg-primary">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/diziler" element={<DizilerPage />} />
                <Route path="/chat" element={<ChatbotPage />} />
                <Route path="/izlediklerim" element={<WatchedMoviesPage />} />
                <Route path="/watched" element={<WatchedMoviesPage />} />
                <Route path="/hesabim" element={<HesabimPage />} />
                <Route path="/profile/:username" element={<UserProfilePage />} />
                <Route path="/random-episode" element={<RandomEpisodePage />} />
                <Route path="/test" element={<TestPage />} />
                <Route path="/search" element={<SearchResultsPage />} />
                <Route path="/person/:personId" element={<PersonCreditsPage />} />
              </Routes>
            </div>
          </Router>
        </WatchlistProvider>
      </WatchedProvider>
    </MovieProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App
