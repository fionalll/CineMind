import React, { useState } from 'react';
import { useWatched } from '../context/WatchedContext';
import type { Movie } from '../types';

interface WatchButtonProps {
  movie: Movie;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const WatchButton: React.FC<WatchButtonProps> = ({ 
  movie, 
  size = 'md', 
  className = '' 
}) => {
  const { isMovieWatched, addToWatched, removeFromWatched } = useWatched();
  const [loading, setLoading] = useState(false);
  const isWatched = isMovieWatched(movie.id);

  const handleToggleWatched = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🎬 WatchButton clicked! Movie:', movie.title, 'ID:', movie.id);
    console.log('🔍 Current isWatched status:', isWatched);
    console.log('📋 Available functions:', { 
      addToWatched: typeof addToWatched, 
      removeFromWatched: typeof removeFromWatched,
      isMovieWatched: typeof isMovieWatched 
    });
    
    setLoading(true);
    try {
      if (isWatched) {
        console.log('➖ Removing from watched list...');
        await removeFromWatched(movie.id);
        console.log('✅ Successfully removed from watched list');
      } else {
        console.log('➕ Adding to watched list...');
        await addToWatched(movie);
        console.log('✅ Successfully added to watched list');
      }
    } catch (error) {
      console.error('❌ Error toggling watched status:', error);
      console.error('🔍 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        movie: movie,
        action: isWatched ? 'remove' : 'add'
      });
    } finally {
      setLoading(false);
      console.log('🏁 Watch toggle operation completed');
    }
  };

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  return (
    <button
      onClick={handleToggleWatched}
      disabled={loading}
      className={`
        ${sizeClasses[size]}
        rounded-full
        flex items-center justify-center
        transition-all duration-200
        hover:scale-110
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isWatched 
          ? 'bg-green-600 hover:bg-green-700 text-primary' 
          : 'card-bg text-secondary hover:text-primary'
        }
        backdrop-blur-sm
        ${className}
      `}
      title={isWatched ? 'İzlediklerimden çıkar' : 'İzlediklerime ekle'}
    >
      {loading ? (
        <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg 
          className="w-4 h-4" 
          fill={isWatched ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
          />
        </svg>
      )}
    </button>
  );
};

export default WatchButton;
