import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { movieService } from '../services/api';
import MovieCard from '../components/MovieCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';
import BackButton from '../components/BackButton';
import type { Movie } from '../types';

interface PersonData {
  id: number;
  name: string;
  profilePath: string | null;
  knownForDepartment: string;
}

interface PersonCreditsData {
  person: PersonData;
  credits: Movie[];
}

const PersonCreditsPage: React.FC = () => {
  const { personId } = useParams<{ personId: string }>();
  const [data, setData] = useState<PersonCreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const moviesScrollRef = useRef<HTMLDivElement>(null);
  const tvShowsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPersonCredits = async () => {
      if (!personId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await movieService.getPersonCredits(parseInt(personId));
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Oyuncu bilgileri yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchPersonCredits();
  }, [personId]);

  // Scroll functions
  const scrollMoviesLeft = () => {
    if (moviesScrollRef.current) {
      moviesScrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollMoviesRight = () => {
    if (moviesScrollRef.current) {
      moviesScrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const scrollTvLeft = () => {
    if (tvShowsScrollRef.current) {
      tvShowsScrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollTvRight = () => {
    if (tvShowsScrollRef.current) {
      tvShowsScrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-primary">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-red-400">{error || 'Oyuncu bulunamadı'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filmler ve dizileri ayır
  const movies = data.credits.filter(credit => credit.media_type === 'movie');
  const tvShows = data.credits.filter(credit => credit.media_type === 'tv');

  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <BackButton />
        {/* Ana Grid - Sol: Oyuncu Kartı, Sağ: Filmografi */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Sol Sütun: Oyuncu Bilgi Kartı */}
          <div className="md:col-span-1">
            <div className="bg-secondary rounded-2xl shadow-xl p-6 sticky top-24">
              <div className="text-center">
                {/* Oyuncu Profil Resmi */}
                {data.person.profilePath ? (
                  <img
                    src={data.person.profilePath}
                    alt={data.person.name}
                    className="w-48 h-48 md:w-full md:h-auto md:aspect-square rounded-2xl object-cover mb-6 border-4 border-accent mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 md:w-full md:aspect-square bg-tertiary rounded-2xl flex items-center justify-center mb-6 border-4 border-accent mx-auto">
                    <svg className="w-24 h-24 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Oyuncu Adı */}
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  {data.person.name}
                </h1>

                {/* Departman */}
                {data.person.knownForDepartment && (
                  <p className="text-accent text-lg mb-4">
                    {data.person.knownForDepartment === 'Acting' ? 'Oyuncu' : data.person.knownForDepartment}
                  </p>
                )}

                {/* İstatistikler */}
                <div className="bg-tertiary rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">{movies.length}</p>
                      <p className="text-sm text-secondary">Film</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{tvShows.length}</p>
                      <p className="text-sm text-secondary">Dizi</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Sütun: Filmografi */}
          <div className="md:col-span-3 space-y-8">
            
            {/* Filmler Bölümü */}
            {movies.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Filmler</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={scrollMoviesLeft}
                      className="p-2 rounded-lg bg-tertiary hover:bg-accent transition-colors"
                      aria-label="Filmlerde sola kaydır"
                    >
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={scrollMoviesRight}
                      className="p-2 rounded-lg bg-tertiary hover:bg-accent transition-colors"
                      aria-label="Filmlerde sağa kaydır"
                    >
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div 
                  ref={moviesScrollRef}
                  className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {movies.map((movie) => (
                    <div key={`movie-${movie.id}`} className="flex-shrink-0 w-64">
                      <MovieCard movie={movie} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diziler Bölümü */}
            {tvShows.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Diziler</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={scrollTvLeft}
                      className="p-2 rounded-lg bg-tertiary hover:bg-accent transition-colors"
                      aria-label="Dizilerde sola kaydır"
                    >
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={scrollTvRight}
                      className="p-2 rounded-lg bg-tertiary hover:bg-accent transition-colors"
                      aria-label="Dizilerde sağa kaydır"
                    >
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div 
                  ref={tvShowsScrollRef}
                  className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {tvShows.map((tvShow) => (
                    <div key={`tv-${tvShow.id}`} className="flex-shrink-0 w-64">
                      <MovieCard movie={tvShow} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Boş Durum */}
            {movies.length === 0 && tvShows.length === 0 && (
              <div className="text-center py-16 bg-secondary rounded-2xl">
                <div className="text-6xl mb-4">🎬</div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Yapım bulunamadı
                </h2>
                <p className="text-gray-300">
                  Bu oyuncu için henüz film veya dizi bilgisi bulunmuyor.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonCreditsPage;
