import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import { MovieProvider } from './context/MovieContext';
import { WatchedProvider } from './context/WatchedContext';
import { ThemeProvider } from './context/ThemeContext';
import HomePage from './pages/HomePage';
import DizilerPage from './pages/DizilerPage';
import ChatbotPage from './pages/ChatbotPage';
import WatchedMoviesPage from './pages/WatchedMoviesPage';
import HesabimPage from './pages/HesabimPage';
import SearchResultsPage from './pages/SearchResultsPage';
import PersonCreditsPage from './pages/PersonCreditsPage';
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
        <Router>
          <div className="min-h-screen bg-primary">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/diziler" element={<DizilerPage />} />
              <Route path="/chat" element={<ChatbotPage />} />
              <Route path="/watched" element={<WatchedMoviesPage />} />
              <Route path="/hesabim" element={<HesabimPage />} />
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="/person/:personId/credits" element={<PersonCreditsPage />} />
              <Route path="/test" element={<TestPage />} />
            </Routes>
          </div>
        </Router>
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
