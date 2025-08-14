import React, { useState } from 'react';
import type { Movie } from '../types';
import WatchButton from './WatchButton';
import WatchlistButton from './WatchlistButton';
import { useWatched } from '../context/WatchedContext';

interface MovieCardProps {
  movie: Movie;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const { isMovieWatched } = useWatched();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const isWatched = isMovieWatched(movie.id);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Tarih bilinmiyor';
    return new Date(dateString).getFullYear().toString();
  };

  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  return (
    <div className="movie-card group flex flex-col h-full">
      {/* Movie Poster */}
      <div className="relative aspect-[2/3]" style={{ backgroundColor: 'var(--background-tertiary)' }}>
        {movie.posterPath && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
                ></div>
              </div>
            )}
            <img
              src={movie.posterPath}
              alt={movie.title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {/* Rating Badge */}
        <div 
          className="absolute top-2 right-2 px-2 py-1 rounded-full z-10 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        >
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--warning)' }}>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {formatRating(movie.voteAverage)}
            </span>
          </div>
        </div>

        {/* Watch Button - En yüksek z-index ile */}
        <div className="absolute top-2 left-2 z-30">
          <WatchButton movie={movie} size="sm" />
        </div>

        {/* Watchlist Button - Sadece izlenmemiş filmlerde göster */}
        {!isWatched && (
          <div className="absolute bottom-2 left-2 z-30">
            <WatchlistButton movie={movie} size="sm" />
          </div>
        )}

        {/* Hover Overlay - Orta seviye z-index ile */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4 z-20 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
          <div className="text-center">
            <h3 className="movie-title text-lg mb-2">{movie.title}</h3>
            {movie.reason && (
              <p className="text-sm mb-3 italic" style={{ color: 'var(--primary)' }}>
                "{movie.reason}"
              </p>
            )}
            {movie.overview && (
              <p className="movie-subtitle text-xs line-clamp-3">{movie.overview}</p>
            )}
          </div>
        </div>
      </div>

      {/* Movie Info - Flexbox ile esnek alan */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="movie-title text-lg mb-1 line-clamp-2">{movie.title}</h3>
          {movie.originalTitle !== movie.title && (
            <p className="movie-subtitle text-sm mb-2 line-clamp-1">({movie.originalTitle})</p>
          )}
        </div>
        <div className="flex items-center justify-between mt-auto">
          <span className="movie-meta text-sm">{formatDate(movie.releaseDate)}</span>
          <div className="flex items-center space-x-1">
            <span className="movie-meta text-xs">{movie.voteCount} oy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
