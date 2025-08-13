import { useState, useEffect } from 'react';
import { movieService } from '../services/api';
import type { Movie } from '../types';

const HeroSection = () => {
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedMovie = async () => {
      try {
        const response = await movieService.getPopularMovies(1);
        if (response.results.length > 0) {
          // Her seferinde farklı bir film seçmek için rastgele index
          const randomIndex = Math.floor(Math.random() * Math.min(5, response.results.length));
          setFeaturedMovie(response.results[randomIndex]);
        }
      } catch (error) {
        console.error('Error fetching featured movie:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedMovie();
  }, []);

  if (loading) {
    return (
      <div className="relative h-64 sm:h-80 lg:h-96 bg-gray-700 rounded-xl overflow-hidden animate-pulse mb-6 md:mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent"></div>
        <div className="absolute bottom-4 sm:bottom-6 lg:bottom-8 left-4 sm:left-6 lg:left-8 space-y-2 sm:space-y-4">
          <div className="h-6 sm:h-8 bg-gray-600 rounded w-48 sm:w-64"></div>
          <div className="h-3 sm:h-4 bg-gray-600 rounded w-64 sm:w-96"></div>
          <div className="h-8 sm:h-10 bg-gray-600 rounded w-24 sm:w-32"></div>
        </div>
      </div>
    );
  }

  if (!featuredMovie) {
    return null;
  }

  return (
    <div className="relative h-64 sm:h-80 lg:h-96 rounded-xl overflow-hidden mb-6 md:mb-8 group">
      {/* Background Image */}
      {featuredMovie.backdropPath && (
        <img
          src={featuredMovie.backdropPath}
          alt={featuredMovie.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}
      
      {/* Gradient Overlay - Stronger on mobile for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30 sm:from-black/80 sm:via-black/50 sm:to-transparent"></div>
      
      {/* Content */}
      <div className="absolute bottom-4 sm:bottom-6 lg:bottom-8 left-4 sm:left-6 lg:left-8 right-4 sm:right-6 lg:right-8 text-white">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-4 animate-fade-in leading-tight">
            {featuredMovie.title}
          </h1>
          
          {featuredMovie.overview && (
            <p className="text-sm sm:text-base lg:text-lg text-gray-200 mb-3 sm:mb-6 line-clamp-2 sm:line-clamp-3 animate-slide-up">
              {featuredMovie.overview}
            </p>
          )}
          
          <div className="flex items-center space-x-4 sm:space-x-6 mb-3 sm:mb-6">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-semibold text-sm sm:text-base">{featuredMovie.voteAverage.toFixed(1)}</span>
            </div>
            
            <div className="text-gray-300 text-sm sm:text-base">
              {new Date(featuredMovie.releaseDate).getFullYear()}
            </div>
          </div>
          
          <button 
            className="font-bold py-2 sm:py-3 px-4 sm:px-8 rounded-lg transition-all duration-200 animate-scale-in text-sm sm:text-base shadow-lg hover:scale-105"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--text-primary)',
              borderColor: 'var(--accent)'
            }}
          >
             Filmini Bul 
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
