import React, { useState } from 'react';
import { useWatched } from '../context/WatchedContext';
import { useWatchlist } from '../context/WatchlistContext';
import MovieCard from '../components/MovieCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';
import BackButton from '../components/BackButton';
import type { Movie } from '../types';

const WatchedMoviesPage: React.FC = () => {
  const { watchedMovies, loading: watchedLoading, error: watchedError } = useWatched();
  const { watchlist, loading: watchlistLoading, error: watchlistError } = useWatchlist();
  const [activeFilter, setActiveFilter] = useState<'all' | 'movie' | 'tv'>('all');

  // Filter functions
  const filterMoviesByType = (movies: Movie[], type: 'all' | 'movie' | 'tv') => {
    if (type === 'all') return movies;
    return movies.filter(movie => movie.media_type === type);
  };

  const filteredWatchedMovies = filterMoviesByType(watchedMovies, activeFilter);
  const filteredWatchlist = filterMoviesByType(watchlist, activeFilter);

  if (watchedLoading || watchlistLoading) {
    return (
      <div className="min-h-screen bg-primary">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-20">
        <BackButton />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">📚 Listelerim</h1>
          <p className="text-secondary">İzlediklerim ve izleme listemi yönetin</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeFilter === 'all' 
                ? 'btn-primary' 
                : 'btn-secondary'
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setActiveFilter('movie')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeFilter === 'movie' 
                ? 'btn-primary' 
                : 'btn-secondary'
            }`}
          >
            🎬 Filmler
          </button>
          <button
            onClick={() => setActiveFilter('tv')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeFilter === 'tv' 
                ? 'btn-primary' 
                : 'btn-secondary'
            }`}
          >
            📺 Diziler
          </button>
        </div>

        {/* Error Messages */}
        {(watchedError || watchlistError) && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
            {watchedError || watchlistError}
          </div>
        )}

        {/* Watchlist Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
              📝 İzlemek İstediklerim
              <span className="text-sm font-normal text-secondary">
                ({filteredWatchlist.length})
              </span>
            </h2>
          </div>

          {filteredWatchlist.length > 0 ? (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 w-max">
                {filteredWatchlist.map((movie) => (
                  <div key={`watchlist-${movie.id}`} className="w-64 flex-shrink-0">
                    <MovieCard movie={movie} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                İzleme listeniz boş
              </h3>
              <p className="text-secondary">
                Film kartlarındaki artı (+) ikonuna tıklayarak filmler ekleyebilirsiniz.
              </p>
            </div>
          )}
        </div>

        {/* Watched Movies Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
              ✅ İzlediklerim
              <span className="text-sm font-normal text-secondary">
                ({filteredWatchedMovies.length})
              </span>
            </h2>
          </div>

          {filteredWatchedMovies.length > 0 ? (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 w-max">
                {filteredWatchedMovies.map((movie) => (
                  <div key={`watched-${movie.id}`} className="w-64 flex-shrink-0">
                    <MovieCard movie={movie} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                Henüz hiç film izlemediniz
              </h3>
              <p className="text-secondary mb-4">
                Film kartlarındaki göz ikonuna tıklayarak filmleri izlediklerinize ekleyebilirsiniz.
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

        {/* Empty State - Show when both lists are empty */}
        {filteredWatchedMovies.length === 0 && filteredWatchlist.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">�</div>
            <h2 className="text-xl font-bold text-primary mb-2">
              Henüz hiçbir liste oluşturmamışsınız
            </h2>
            <p className="text-secondary mb-6">
              Film kartlarındaki butonları kullanarak listelerinizi oluşturmaya başlayın!
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
  );
};

export default WatchedMoviesPage;
