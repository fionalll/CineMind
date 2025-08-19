import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import MovieCarousel from '../components/MovieCarousel';
import MovieListByGenre from '../components/MovieListByGenre';
import Navbar from '../components/Navbar';
import { movieService } from '../services/api';
import type { Genre } from '../types';

// Akıllı bileşenimizi import ediyoruz
import MovieOfTheDayCard from '../components/MovieOfTheDayCard';

const HomePage = () => {
  const [selectedGenre, setSelectedGenre] = useState<Genre>({ id: 0, name: 'Ana Sayfa' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sol ve Sağ kartlar için ayrı state'ler
  const [movieOfTheDay, setMovieOfTheDay] = useState<any>(null); // SOL, KÜÇÜK KART
  const [movieOfTheDayLoading, setMovieOfTheDayLoading] = useState(true);
  const [promoMovie, setPromoMovie] = useState<any>(null); // SAĞ, BÜYÜK KART
  const [promoMovieLoading, setPromoMovieLoading] = useState(true);

  // Sidebar yönetimi
  const handleGenreSelect = (genre: Genre) => {
    setSelectedGenre(genre);
    setIsSidebarOpen(false);
  };
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Veri Çekme Mantığı
  useEffect(() => {
    // SOL TARAF (KÜÇÜK POSTER): "Günün Filmi" için veri çek
    const fetchMovieOfTheDay = async () => {
      try {
        setMovieOfTheDayLoading(true);
        const response = await movieService.getMovieOfTheDay();
        setMovieOfTheDay(response.movieOfTheDay);
      } catch (error) {
        console.error('Günün filmi alınamadı:', error);
      } finally {
        setMovieOfTheDayLoading(false);
      }
    };
    
    // SAĞ TARAF (BÜYÜK KART): "Reklam/Öne Çıkan" film için veri çek
    const fetchPromoMovie = async () => {
      try {
        setPromoMovieLoading(true);
        const popularMoviesResponse = await movieService.getPopularMovies();
        
        if (popularMoviesResponse.results && popularMoviesResponse.results.length > 0) {
          const firstMovieId = popularMoviesResponse.results[0].id;
          const movieDetails = await movieService.getMovieDetails(firstMovieId);
          setPromoMovie(movieDetails);
        }
      } catch (error) {
        console.error('Öne çıkan film alınamadı:', error);
      } finally {
        setPromoMovieLoading(false);
      }
    };

    fetchMovieOfTheDay();
    fetchPromoMovie();
  }, []);

  // Diğer useEffect'ler... (değişiklik yok)
  useEffect(() => { /* ... dışarıya tıklama ... */ }, [isSidebarOpen]);
  useEffect(() => { /* ... scroll engelleme ... */ }, [isSidebarOpen]);

  // === ANA İÇERİĞİ RENDER ETME (DÜZENLENDİ) ===
  const renderMainContent = () => {
    if (selectedGenre.id === 0) {
      return (
        <div className="space-y-12">
          {/* İKİ FİLMLİ YENİ YAPI */}
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* SOL SÜTUN: KÜÇÜK "GÜNÜN FİLMİ" POSTERİ */}
            <div className="w-full md:w-1/3">
              {/* Hizalamayı bozan başlık buradan kaldırıldı */}
              <MovieOfTheDayCard
                movie={movieOfTheDay}
                loading={movieOfTheDayLoading}
                variant="poster"
              />
            </div>
            
            {/* SAĞ SÜTUN: BÜYÜK "REKLAM/ÖNE ÇIKAN" FİLM */}
            <div className="w-full md:w-2/3">
              <MovieOfTheDayCard
                movie={promoMovie}
                loading={promoMovieLoading}
              />
            </div>

          </div>

          <MovieCarousel title="Popüler Filmler" fetchMovies={() => movieService.getPopularMovies()} />
          <MovieCarousel title="En Çok Beğenilenler" fetchMovies={() => movieService.getTopRatedMovies()} />
          <MovieCarousel title="Yakında Gelenler" fetchMovies={() => movieService.getUpcomingMovies()} />
        </div>
      );
    } else {
      return <MovieListByGenre genreId={selectedGenre.id} genreName={selectedGenre.name} />;
    }
  };

  return (
    <>
      <Navbar onToggleSidebar={toggleSidebar} />
      <div className="page-container pt-16">
        {isSidebarOpen && ( <div className="fixed inset-0 backdrop-overlay z-40 md:hidden"> <div className="mobile-sidebar fixed left-0 top-16 bottom-0 w-80 max-w-[85vw] sidebar border-r border-default transform transition-transform duration-300 overflow-y-auto"> <Sidebar selectedGenre={selectedGenre} onGenreSelect={handleGenreSelect}/> </div> </div> )}
        <div className="md:flex">
          <div className="hidden md:block md:fixed md:left-0 md:top-16 md:h-[calc(100vh-4rem)] md:w-64 lg:w-72 sidebar border-r border-default overflow-y-auto">
            <Sidebar selectedGenre={selectedGenre} onGenreSelect={handleGenreSelect} type="movie"/>
          </div>
          <div className="w-full md:ml-64 lg:ml-72 page-content">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 xl:max-w-6xl">
              {renderMainContent()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;