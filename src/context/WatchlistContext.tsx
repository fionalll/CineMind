import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useWatched } from './WatchedContext';
import { movieService } from '../services/api';
import type { Movie } from '../types';

interface WatchlistContextType {
  watchlist: Movie[];
  isInWatchlist: (movieId: number) => boolean;
  addToWatchlist: (movie: Movie) => Promise<void>;
  removeFromWatchlist: (movieId: number) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export const useWatchlist = (): WatchlistContextType => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { isMovieWatched } = useWatched();
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's watchlist when user changes
  useEffect(() => {
    if (currentUser) {
      loadWatchlist();
    } else {
      setWatchlist([]);
    }
  }, [currentUser]);

  const loadWatchlist = async () => {
    if (!currentUser) return;
    
    console.log('Loading watchlist for user:', currentUser.uid); // Debug log
    setLoading(true);
    try {
      const userWatchlist = await movieService.getUserWatchlist(currentUser.uid);
      console.log('Watchlist loaded:', userWatchlist); // Debug log
      setWatchlist(userWatchlist);
      setError(null);
    } catch (err) {
      console.error('Watchlist load error:', err); // Debug log
      setError(err instanceof Error ? err.message : 'İzleme listesi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const isInWatchlist = (movieId: number): boolean => {
    return watchlist.some(movie => movie.id === movieId);
  };

  const addToWatchlist = async (movie: Movie): Promise<void> => {
    if (!currentUser) {
      throw new Error('Giriş yapmanız gerekiyor');
    }

    // Film zaten izlenmişse, izleme listesine eklenmemeli
    if (isMovieWatched(movie.id)) {
      throw new Error('Bu film zaten izlenmiş, izleme listesine eklenemez');
    }

    try {
      await movieService.addToWatchlist(currentUser.uid, movie);
      setWatchlist(prev => [...prev, movie]);
      setError(null);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      setError('Film izleme listesine eklenirken hata oluştu');
      throw error;
    }
  };

  const removeFromWatchlist = async (movieId: number): Promise<void> => {
    if (!currentUser) {
      throw new Error('Giriş yapmanız gerekiyor');
    }

    try {
      await movieService.removeFromWatchlist(currentUser.uid, movieId);
      setWatchlist(prev => prev.filter(movie => movie.id !== movieId));
      setError(null);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      setError('Film izleme listesinden çıkarılırken hata oluştu');
      throw error;
    }
  };

  const value = {
    watchlist,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    loading,
    error
  };

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
};
