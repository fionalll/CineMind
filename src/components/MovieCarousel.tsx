import { useRef, useEffect, useState } from 'react';
import MovieCard from './MovieCard';
import type { Movie, MovieResponse } from '../types';

interface MovieCarouselProps {
  title: string;
  movies?: Movie[];
  loading?: boolean;
  fetchMovies?: () => Promise<MovieResponse>;
}

const MovieCarousel = ({ title, movies: moviesProp, loading: loadingProp, fetchMovies }: MovieCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [movies, setMovies] = useState<Movie[]>(moviesProp || []);
  const [loading, setLoading] = useState(loadingProp || false);

  useEffect(() => {
    if (fetchMovies && !moviesProp) {
      const loadMovies = async () => {
        setLoading(true);
        try {
          const response = await fetchMovies();
          setMovies(response.results);
        } catch (error) {
          console.error('Error fetching movies:', error);
        } finally {
          setLoading(false);
        }
      };
      loadMovies();
    }
  }, [fetchMovies, moviesProp]);

  useEffect(() => {
    if (moviesProp) {
      setMovies(moviesProp);
    }
  }, [moviesProp]);

  useEffect(() => {
    if (loadingProp !== undefined) {
      setLoading(loadingProp);
    }
  }, [loadingProp]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="h-6 md:h-8 bg-gray-700 rounded w-32 sm:w-48 animate-pulse"></div>
        </div>
        <div className="flex space-x-3 md:space-x-4 overflow-hidden">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="min-w-[150px] sm:min-w-[200px] lg:min-w-[250px]">
              <div className="bg-gray-700 rounded-xl aspect-[2/3] animate-pulse"></div>
              <div className="mt-2 space-y-2">
                <div className="h-3 md:h-4 bg-gray-700 rounded animate-pulse"></div>
                <div className="h-2 md:h-3 bg-gray-700 rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (movies.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{title}</h2>
        
        {/* Scroll buttons - Hidden on mobile, visible on larger screens */}
        <div className="hidden sm:flex space-x-2">
          <button
            onClick={scrollLeft}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition-colors duration-200"
            aria-label="Scroll left"
          >
            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={scrollRight}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition-colors duration-200"
            aria-label="Scroll right"
          >
            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      <div
        ref={scrollRef}
        className="flex space-x-3 md:space-x-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {movies.map((movie, index) => (
          <div
            key={movie.id}
            className="min-w-[150px] sm:min-w-[200px] lg:min-w-[250px] animate-scale-in flex"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieCarousel;
