import { useState, useEffect } from 'react';
import { movieService } from '../services/api';
import MovieCard from './MovieCard';
import type { Movie } from '../types';

interface MovieListByGenreProps {
  genreId: number;
  genreName: string;
  type?: 'movie' | 'tv';
}

const MovieListByGenre = ({ genreId, genreName, type = 'movie' }: MovieListByGenreProps) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const response = type === 'tv'
          ? await movieService.getTvShowsByGenre(genreId, 1)
          : await movieService.getMoviesByGenre(genreId, 1);
        setMovies(response.results);
        setPage(1);
        setHasMore(response.page < response.total_pages);
      } catch (error) {
        console.error('Error fetching movies by genre:', error);
      } finally {
        setLoading(false);
      }
    };

    if (genreId > 0) {
      fetchMovies();
    }
  }, [genreId, type]);

  const loadMore = async () => {
    if (!hasMore || loading) return;

    try {
      setLoading(true);
      const response = type === 'tv'
        ? await movieService.getTvShowsByGenre(genreId, page + 1)
        : await movieService.getMoviesByGenre(genreId, page + 1);
      setMovies(prev => [...prev, ...response.results]);
      setPage(prev => prev + 1);
      setHasMore(response.page < response.total_pages);
    } catch (error) {
      console.error('Error loading more movies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (genreId === 0) {
    return null; // Ana sayfa içeriği gösterilecek
  }

  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold ">
          {genreName} {type === 'tv' ? 'Dizileri' : 'Filmleri'}
        </h2>
        <span className="text-gray-400 text-xs sm:text-sm">
          {movies.length} {type === 'tv' ? 'dizi' : 'film'}
        </span>
      </div>

      {loading && movies.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
          {[...Array(20)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-700 rounded-xl aspect-[2/3]"></div>
              <div className="mt-2 space-y-2">
                <div className="h-3 sm:h-4 bg-gray-700 rounded"></div>
                <div className="h-2 sm:h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 items-stretch">
            {movies.map((movie, index) => (
              <div
                key={movie.id}
                className="animate-scale-in flex"
                style={{ animationDelay: `${(index % 20) * 0.05}s` }}
              >
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-6 md:mt-8">
              <button
                onClick={loadMore}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 sm:py-3 px-6 sm:px-8 rounded-lg transition-colors duration-200 text-sm sm:text-base"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Yükleniyor...</span>
                  </div>
                ) : (
                  'Daha Fazla Göster'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MovieListByGenre;
