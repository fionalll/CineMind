import { useState, useEffect } from 'react';
import { movieService } from '../services/api';
import type { Genre } from '../types';

interface SidebarProps {
  onGenreSelect: (genre: Genre) => void;
  selectedGenre?: Genre;
}

const Sidebar = ({ onGenreSelect, selectedGenre }: SidebarProps) => {
  // --- 1. JAVASCRIPT MANTIĞI BÖLÜMÜ ---
  const [genres, setGenres] = useState<Genre[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const genresResponse = await movieService.getGenres();
        setGenres(genresResponse.genres);
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    })();
  }, []); // useEffect'in bağımlılık dizisi boş, bu doğru.

  // İkonları döndüren yardımcı fonksiyon
  const getGenreIcon = (genreName: string) => {
    const name = genreName.toLowerCase();
    if (name.includes('aksiyon')) return '🎬';
    if (name.includes('komedi')) return '😂';
    if (name.includes('animasyon')) return '🎨';
    // Diğer ikonları buraya ekleyebilirsiniz...
    return '🎭'; // Varsayılan ikon
  };

  // --- 2. JSX (GÖRSEL) BÖLÜMÜ ---
  return (
    <div className="p-6 sidebar-bg">
      <h2 className="text-xl font-bold text-primary mb-6">Film Türleri</h2>
      <div className="flex flex-wrap gap-2">
        {/* Türlerin Listelendiği Bölüm */}
        {genres.map((genre) => (
            <button
              key={genre.id}
              onClick={() => onGenreSelect(genre)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedGenre?.id === genre.id
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-secondary hover:bg-tertiary hover:text-primary'
              }`}
            >
              <span className="mr-2">{getGenreIcon(genre.name)}</span>
              <span>{genre.name}</span>
            </button>
          ))}
      </div>
    </div>
  );
};

export default Sidebar;
