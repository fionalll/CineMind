import React from 'react';

interface MovieOfTheDayCardProps {
  movie: {
    id: number;
    title: string;
    overview: string;
    backdrop_path: string;
    poster_path: string;
    release_date: string;
    vote_average: number;
    genres: any[];
    runtime: number;
    date: string;
  } | null;
  loading: boolean;
}

const MovieOfTheDayCard: React.FC<MovieOfTheDayCardProps> = ({ movie, loading }) => {
  if (loading) {
    return (
      <div className="relative w-full h-96 bg-secondary rounded-xl overflow-hidden animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-600"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="h-4 bg-gray-700 rounded mb-4 w-1/4"></div>
          <div className="h-8 bg-gray-700 rounded mb-4 w-2/3"></div>
          <div className="h-4 bg-gray-700 rounded mb-4 w-full"></div>
          <div className="h-4 bg-gray-700 rounded mb-6 w-3/4"></div>
          <div className="h-10 bg-gray-700 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="relative w-full h-96 bg-secondary rounded-xl overflow-hidden flex items-center justify-center">
        <p className="text-gray-400">Günün filmi yüklenemedi</p>
      </div>
    );
  }

  const backdropUrl = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : '/placeholder-backdrop.jpg';

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}s ${mins}dk`;
  };

  return (
    <div className="relative w-full h-96 bg-secondary rounded-xl overflow-hidden group">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url(${backdropUrl})` }}
      ></div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 bg-accent/90 text-white text-sm rounded-full font-medium">
            ✨ Günün Filmi
          </span>
          <span className="text-white/80 text-sm">
            {new Date().toLocaleDateString('tr-TR')}
          </span>
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
          {movie.title}
        </h2>
        
        <p className="text-white/90 text-base md:text-lg mb-4 leading-relaxed max-w-2xl line-clamp-3">
          {movie.overview}
        </p>
        
        <div className="flex items-center gap-6 mb-6 text-white/80 text-sm">
          <div className="flex items-center gap-1">
            <span>⭐</span>
            <span>{movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📅</span>
            <span>{movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</span>
          </div>
          {movie.runtime && (
            <div className="flex items-center gap-1">
              <span>⏰</span>
              <span>{formatRuntime(movie.runtime)}</span>
            </div>
          )}
        </div>
        
        <button className="px-6 py-3 bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
          Detayları Gör
        </button>
      </div>
    </div>
  );
};

export default MovieOfTheDayCard;
