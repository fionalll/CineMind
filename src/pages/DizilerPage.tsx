import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import MovieCarousel from '../components/MovieCarousel';
import MovieListByGenre from '../components/MovieListByGenre';
import Navbar from '../components/Navbar';
import { movieService } from '../services/api';
import type { Genre } from '../types';

const DizilerPage = () => {
  const [selectedGenre, setSelectedGenre] = useState<Genre>({ id: 0, name: 'Ana Sayfa' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleGenreSelect = (genre: Genre) => {
    setSelectedGenre(genre);
    // Close sidebar on mobile after selection
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close sidebar when clicking outside (mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isSidebarOpen && !target.closest('.mobile-sidebar') && !target.closest('[data-sidebar-toggle]')) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  const renderMainContent = () => {
    if (selectedGenre.id === 0) {
      return (
        <div className="space-y-8">
          {/* Hero Section for TV Shows */}
     
          
          <MovieCarousel
            title="Popüler Diziler"
            fetchMovies={() => movieService.getPopularTvShows()}
          />
          
          <MovieCarousel
            title="En Yüksek Puanlı Diziler"
            fetchMovies={() => movieService.getTopRatedTvShows()}
          />

          <MovieCarousel
            title="Bugün Yayınlanan Diziler"
            fetchMovies={() => movieService.getAiringTodayTvShows()}
          />

          <MovieCarousel
            title="Yayında Olan Diziler"
            fetchMovies={() => movieService.getOnTheAirTvShows()}
          />
        </div>
      );
    } else {
      return (
        <MovieListByGenre
          genreId={selectedGenre.id}
          genreName={selectedGenre.name}
          type="tv"
        />
      );
    }
  };

  return (
    <>
      <Navbar onToggleSidebar={toggleSidebar} />
      
      <div className="page-container pt-16">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 backdrop-overlay z-40 md:hidden">
            <div className="mobile-sidebar fixed left-0 top-16 bottom-0 w-80 max-w-[85vw] sidebar border-r border-default transform transition-transform duration-300 overflow-y-auto">
              <Sidebar
                selectedGenre={selectedGenre}
                onGenreSelect={handleGenreSelect}
                type="tv"
              />
            </div>
          </div>
        )}

        {/* Desktop Layout */}
        <div className="md:flex">
          {/* Desktop Sidebar - Hidden on mobile, visible on md+ */}
          <div className="hidden md:block md:fixed md:left-0 md:top-16 md:h-[calc(100vh-4rem)] md:w-64 lg:w-72 sidebar border-r border-default overflow-y-auto">
            <Sidebar
              selectedGenre={selectedGenre}
              onGenreSelect={handleGenreSelect}
              type="tv"
            />
          </div>

          {/* Main Content */}
          <div className="w-full md:ml-64 lg:ml-72 page-content">
            {/* Content Container with responsive max-width */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 xl:max-w-6xl">
              {renderMainContent()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DizilerPage;
