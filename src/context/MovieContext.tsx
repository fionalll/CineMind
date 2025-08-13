import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Movie, ChatMessage } from '../types';

interface MovieContextType {
  movies: Movie[];
  setMovies: (movies: Movie[]) => void;
  chatMessages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const MovieContext = createContext<MovieContextType | undefined>(undefined);

export const useMovieContext = () => {
  const context = useContext(MovieContext);
  if (context === undefined) {
    throw new Error('useMovieContext must be used within a MovieProvider');
  }
  return context;
};

interface MovieProviderProps {
  children: ReactNode;
}

export const MovieProvider: React.FC<MovieProviderProps> = ({ children }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Merhaba! Ben CineMind AI. Size benzersiz film önerileri sunmak için buradayım. Hangi film türünde veya tarzında öneriler istiyorsunuz?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMessage = (message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  };

  const value: MovieContextType = {
    movies,
    setMovies,
    chatMessages,
    addMessage,
    isLoading,
    setIsLoading,
    error,
    setError,
  };

  return (
    <MovieContext.Provider value={value}>
      {children}
    </MovieContext.Provider>
  );
};
