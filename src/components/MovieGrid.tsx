import React from 'react';
import { useMovieContext } from '../context/MovieContext';
import MovieCard from './MovieCard';

const MovieGrid: React.FC = () => {
  const { movies, isLoading } = useMovieContext();

  if (movies.length === 0 && !isLoading) {
    return (
      <div className="card p-8 text-center">
        <div className="mb-4">
          <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v2m0 0v16a1 1 0 01-1 1H5a1 1 0 01-1-1V4m2 0h10" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9l3 3 3-3" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Film Önerileri</h3>
        <p className="text-gray-400 mb-4">
          Henüz film önerisi almadınız. ChatBot'a hangi tarzda filmler istediğinizi söyleyin!
        </p>
        <div className="text-sm text-gray-500">
          <p>💡 Örnek sorular:</p>
          <ul className="mt-2 space-y-1">
            <li>"Inception gibi zihin büken filmler"</li>
            <li>"Parazit filmindeki sınıf çatışması"</li>
            <li>"Wes Anderson tarzı görsel filmler"</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Önerilen Filmler</h2>
        {movies.length > 0 && (
          <span className="text-sm text-gray-400">{movies.length} film</span>
        )}
      </div>

      {isLoading && movies.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="card overflow-hidden animate-pulse">
              <div className="aspect-[2/3] bg-gray-700"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {movies.map((movie, index) => (
            <div
              key={movie.id}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      )}

      {movies.length > 0 && (
        <div className="text-center pt-4">
          <p className="text-sm text-gray-400">
            Daha fazla öneri için ChatBot'a yeni sorular sorabilirsiniz!
          </p>
        </div>
      )}
    </div>
  );
};

export default MovieGrid;
