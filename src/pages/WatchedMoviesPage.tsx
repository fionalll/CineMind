import React from 'react';
import { useWatched } from '../context/WatchedContext';
import WatchButton from '../components/WatchButton';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';

const WatchedMoviesPage: React.FC = () => {
  const { watchedMovies, loading, error } = useWatched();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Navbar />
      <div className="page-container pt-16">
        <div className="page-content">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">
              🎬 İzlediklerim
            </h1>
            <p className="text-secondary">
              {watchedMovies.length > 0 
                ? `${watchedMovies.length} film izlemişsiniz`
                : 'Henüz hiç film izlemediniz'
              }
            </p>
          </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Movies Grid */}
        {watchedMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {watchedMovies.map((movie) => (
              <div
                key={movie.id}
                className="group relative card-bg rounded-lg overflow-hidden hover:bg-opacity-80 transition-all duration-300 hover:scale-105"
              >
                {/* Movie Poster */}
                <div className="relative aspect-[2/3]">
                  {movie.posterPath ? (
                    <img
                      src={movie.posterPath}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-500 text-4xl">🎬</span>
                    </div>
                  )}

                  {/* Watch Button Overlay - En yüksek z-index */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
                    <WatchButton movie={movie} size="sm" />
                  </div>

                  {/* Watched Date Badge - Düşük z-index */}
                  <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded z-10">
                    {movie.watchedAt.toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </div>
                </div>

                {/* Movie Info */}
                <div className="p-3">
                  <h3 className="text-primary font-medium text-sm line-clamp-2 mb-1">
                    {movie.title}
                  </h3>
                  <p className="text-secondary text-xs">
                    {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'}
                  </p>
                  
                  {/* Rating */}
                  {movie.voteAverage > 0 && (
                    <div className="flex items-center mt-1">
                      <span className="text-yellow-400 text-xs">⭐</span>
                      <span className="text-accent text-xs ml-1">
                        {movie.voteAverage.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Hover Overlay with Details - Orta seviye z-index */}
                <div className="absolute inset-0 backdrop-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-20">
                  <h3 className="text-primary font-bold text-sm mb-2">
                    {movie.title}
                  </h3>
                  {movie.overview && (
                    <p className="text-secondary text-xs line-clamp-3 mb-2">
                      {movie.overview}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-secondary">
                    <span>
                      İzlenme: {movie.watchedAt.toLocaleDateString('tr-TR')}
                    </span>
                    {movie.voteAverage > 0 && (
                      <span className="flex items-center">
                        ⭐ {movie.voteAverage.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-xl font-bold text-primary mb-2">
              Henüz hiç film izlemediniz
            </h2>
            <p className="text-secondary mb-6">
              Film kartlarında bulunan göz ikonuna tıklayarak filmleri izlediklerinize ekleyebilirsiniz.
            </p>
            <a
              href="/"
              className="btn-primary inline-flex items-center"
            >
              Filmleri Keşfet
            </a>
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default WatchedMoviesPage;
