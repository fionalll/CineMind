import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import WatchButton from '../components/WatchButton';
import WatchlistButton from '../components/WatchlistButton';
import FilmFirlatModal from '../components/FilmFirlatModal';
import { movieService } from '../services/api';
import type { Movie } from '../types';

interface MovieDetails extends Movie {
  budget?: number;
  revenue?: number;
  runtime?: number;
  status?: string;
  tagline?: string;
  production_countries?: Array<{ name: string }>;
  production_companies?: Array<{ name: string }>;
  spoken_languages?: Array<{ name: string }>;
}

const MovieDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilmFirlatModal, setShowFilmFirlatModal] = useState(false);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (!id) {
        setError('Film ID bulunamadı');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const movieData = await movieService.getMovieDetails(parseInt(id));
        
        // TMDB verisini Movie formatına dönüştür
        const formattedMovie: MovieDetails = {
          id: movieData.id,
          title: movieData.title,
          originalTitle: movieData.original_title,
          overview: movieData.overview,
          posterPath: movieData.poster_path,
          backdropPath: movieData.backdrop_path,
          releaseDate: movieData.release_date,
          voteAverage: movieData.vote_average,
          voteCount: movieData.vote_count,
          genres: movieData.genres,
          media_type: 'movie',
          // Ek detaylar
          budget: movieData.budget,
          revenue: movieData.revenue,
          runtime: movieData.runtime,
          status: movieData.status,
          tagline: movieData.tagline,
          production_countries: movieData.production_countries,
          production_companies: movieData.production_companies,
          spoken_languages: movieData.spoken_languages
        };
        
        setMovie(formattedMovie);
      } catch (err) {
        console.error('Film detayları alınırken hata:', err);
        setError('Film detayları yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-primary">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-primary mb-4">Film Bulunamadı</h2>
            <p className="text-secondary">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      
      <div>
        {/* Backdrop Image */}
        {movie.backdropPath && (
          <div className="relative h-96 overflow-hidden">
            <img
              src={`https://image.tmdb.org/t/p/w1280${movie.backdropPath}`}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent" />
          </div>
        )}

        <div className="container mx-auto px-4 py-8">
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Film Posteri */}
            <div className="flex-shrink-0">
              <div className="w-80 h-120 bg-secondary rounded-lg overflow-hidden shadow-2xl border-2 border-default">
                {movie.posterPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <span className="text-4xl">🎬</span>
                  </div>
                )}
              </div>
            </div>

            {/* Film Bilgileri */}
            <div className="flex-1 space-y-6">
              {/* Başlık ve Tagline */}
              <div>
                <h1 className="text-4xl font-bold text-primary mb-2">{movie.title}</h1>
                {movie.tagline && (
                  <p className="text-lg italic text-secondary">{movie.tagline}</p>
                )}
              </div>

              {/* Türler */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="bg-accent bg-opacity-20 text-accent px-3 py-1 rounded-full text-sm border border-accent"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Konusu */}
              <div className="bg-secondary p-6 rounded-lg">
                <h3 className="text-xl font-bold text-primary mb-3">KONUSU</h3>
                <p className="text-secondary leading-relaxed">
                  {movie.overview || 'Bu film için konusu henüz eklenmemiş.'}
                </p>
              </div>

              {/* Aksiyon Butonları */}
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex gap-4">
                  <WatchButton movie={movie} size="lg" />
                  <WatchlistButton movie={movie} size="lg" />
                </div>
                <button
                  onClick={() => setShowFilmFirlatModal(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span className="text-xl">🎯</span>
                  Arkadaşına Filmi Fırlat
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Film Fırlat Modal */}
      {showFilmFirlatModal && (
        <FilmFirlatModal
          movie={movie}
          onClose={() => setShowFilmFirlatModal(false)}
        />
      )}
    </div>
  );
};

export default MovieDetailsPage;