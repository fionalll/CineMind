import React, { useState } from 'react';
import { useWatchlist } from '../context/WatchlistContext';
import { useWatched } from '../context/WatchedContext';
import { useAuth } from '../context/AuthContext';
import type { Movie } from '../types';

interface WatchlistButtonProps {
  movie: Movie;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const WatchlistButton: React.FC<WatchlistButtonProps> = ({ 
  movie, 
  size = 'md', 
  className = '' 
}) => {
  const { currentUser } = useAuth();
  const { isMovieWatched } = useWatched();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const [loading, setLoading] = useState(false);
  
  const inWatchlist = isInWatchlist(movie.id);
  const isWatched = isMovieWatched(movie.id);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const handleToggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      alert('İzleme listesine eklemek için giriş yapmanız gerekiyor');
      return;
    }

    // Film zaten izlenmişse, izleme listesine eklenemez
    if (!inWatchlist && isWatched) {
      alert('Bu film zaten izlenmiş, izleme listesine eklenemez');
      return;
    }

    setLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(movie.id);
      } else {
        await addToWatchlist(movie);
      }
    } catch (error) {
      console.error('Watchlist error:', error);
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleWatchlist}
      disabled={loading || (!inWatchlist && isWatched)}
      className={`
        ${sizeClasses[size]}
        rounded-full
        flex items-center justify-center
        transition-all duration-200
        hover:scale-110
        disabled:opacity-50 disabled:cursor-not-allowed
        ${inWatchlist 
          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
          : isWatched 
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'card-bg text-secondary hover:text-primary'
        }
        backdrop-blur-sm
        ${className}
      `}
      title={
        isWatched && !inWatchlist 
          ? 'Bu film zaten izlenmiş' 
          : inWatchlist 
            ? 'İzleme listesinden çıkar' 
            : 'İzleme listesine ekle'
      }
    >
      {loading ? (
        <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg 
          className="w-4 h-4" 
          fill={inWatchlist ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d={inWatchlist 
              ? "M5 13l4 4L19 7"
              : "M12 6v6m0 0v6m0-6h6m-6 0H6"
            }
          />
        </svg>
      )}
    </button>
  );
};

export default WatchlistButton;
