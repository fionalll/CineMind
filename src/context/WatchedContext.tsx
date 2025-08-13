import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import type { Movie } from '../types';

interface WatchedMovie extends Movie {
  watchedAt: Date;
}

interface WatchedContextType {
  watchedMovies: WatchedMovie[];
  isMovieWatched: (movieId: number) => boolean;
  addToWatched: (movie: Movie) => Promise<void>;
  removeFromWatched: (movieId: number) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const WatchedContext = createContext<WatchedContextType | undefined>(undefined);

export const useWatched = () => {
  const context = useContext(WatchedContext);
  if (!context) {
    throw new Error('useWatched must be used within a WatchedProvider');
  }
  return context;
};

export const WatchedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time subscription to user's watched movies
  useEffect(() => {
    if (!currentUser) {
      setWatchedMovies([]);
      return;
    }

    setLoading(true);
    const watchedRef = collection(db, 'users', currentUser.uid, 'watchedMovies');
    
    const unsubscribe = onSnapshot(
      watchedRef,
      (snapshot) => {
        const movies: WatchedMovie[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          movies.push({
            ...data,
            watchedAt: data.watchedAt.toDate()
          } as WatchedMovie);
        });
        
        // Sort by watched date (newest first)
        movies.sort((a, b) => b.watchedAt.getTime() - a.watchedAt.getTime());
        
        setWatchedMovies(movies);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching watched movies:', error);
        setError('İzlediğim filmler yüklenirken hata oluştu');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const isMovieWatched = (movieId: number): boolean => {
    return watchedMovies.some(movie => movie.id === movieId);
  };

  const addToWatched = async (movie: Movie): Promise<void> => {
    if (!currentUser) {
      console.error('❌ No user logged in!');
      throw new Error('Giriş yapmanız gerekiyor');
    }

    console.log('🔄 WatchedContext.addToWatched called for:', movie.title, 'User:', currentUser.uid);
    
    try {
      const watchedMovie: WatchedMovie = {
        ...movie,
        watchedAt: new Date()
      };

      console.log('📊 Creating watched movie object:', watchedMovie);

      const docRef = doc(db, 'users', currentUser.uid, 'watchedMovies', movie.id.toString());
      console.log('🗂️ Firestore document path:', docRef.path);
      
      await setDoc(docRef, {
        ...watchedMovie,
        watchedAt: Timestamp.fromDate(watchedMovie.watchedAt)
      });

      console.log('✅ Successfully saved to Firestore');
      setError(null);
    } catch (error) {
      console.error('❌ Error adding movie to watched:', error);
      console.error('🔍 Error details:', {
        movie: movie,
        user: currentUser?.uid,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      setError('Film izlediklerim listesine eklenirken hata oluştu');
      throw error;
    }
  };

  const removeFromWatched = async (movieId: number): Promise<void> => {
    if (!currentUser) {
      console.error('❌ No user logged in!');
      throw new Error('Giriş yapmanız gerekiyor');
    }

    console.log('🗑️ WatchedContext.removeFromWatched called for movie ID:', movieId, 'User:', currentUser.uid);

    try {
      const docRef = doc(db, 'users', currentUser.uid, 'watchedMovies', movieId.toString());
      console.log('🗂️ Firestore document path to delete:', docRef.path);
      
      await deleteDoc(docRef);
      console.log('✅ Successfully deleted from Firestore');
      setError(null);
    } catch (error) {
      console.error('❌ Error removing movie from watched:', error);
      console.error('🔍 Error details:', {
        movieId: movieId,
        user: currentUser?.uid,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      setError('Film izlediklerim listesinden çıkarılırken hata oluştu');
      throw error;
    }
  };

  const value = {
    watchedMovies,
    isMovieWatched,
    addToWatched,
    removeFromWatched,
    loading,
    error
  };

  return (
    <WatchedContext.Provider value={value}>
      {children}
    </WatchedContext.Provider>
  );
};
