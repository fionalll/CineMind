import { useState, useEffect } from 'react';
import { movieService } from '../services/api';
import type { Genre } from '../types';
import { 
  MdLocalMovies, 
  MdTheaterComedy, 
  MdCameraRoll,
  MdFavorite,
  MdRocket,
  MdAutoFixHigh,
  MdTheaters,
  MdColorLens,
  MdMap,
  MdVideoLibrary,
  MdLocalFireDepartment,
  MdSearch,
  MdSecurity,
  MdAccountBalance,
  MdGroups,
  MdTv,
  MdMic,
  MdFavoriteBorder,
  MdStar,
  MdSettings,
  MdCategory
} from 'react-icons/md';

interface SidebarProps {
  onGenreSelect: (genre: Genre) => void;
  selectedGenre?: Genre;
  type?: 'movie' | 'tv';
}

const Sidebar = ({ onGenreSelect, selectedGenre, type = 'movie' }: SidebarProps) => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  // İstenmeyen türlerin listesi
  const excludedGenres = [
    'macera', 'suç', 'müzik', 'gizem', 'tv film', 'gerilim', 'savaş', 'vahşi batı',
    'belgesel', 'tarih', 'aile', 'çocuklar', 'haber', 'adventure', 'crime', 'music', 'mystery', 
    'tv movie', 'thriller', 'war', 'western', 'documentary', 'history', 'family', 'kids', 'news'
  ];

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const genresResponse = type === 'tv' 
          ? await movieService.getTvGenres()
          : await movieService.getGenres();
        
        // İstenmeyen türleri filtrele
        const filteredGenres = genresResponse.genres.filter((genre: any) => {
          const genreName = genre.name.toLowerCase();
          return !excludedGenres.some(excluded => 
            genreName.includes(excluded.toLowerCase())
          );
        });
        
        setGenres(filteredGenres);
      } catch (error) {
        console.error('Error fetching genres:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, [type]);

  const getGenreIcon = (genreName: string) => {
    const name = genreName.toLowerCase();
    const iconProps = { size: 18, className: "text-current" };
    
    if (name.includes('aksiyon') || name.includes('action')) return <MdLocalMovies {...iconProps} />;
    if (name.includes('komedi') || name.includes('comedy')) return <MdTheaterComedy {...iconProps} />;
    if (name.includes('korku') || name.includes('horror')) return <MdLocalFireDepartment {...iconProps} />;
    if (name.includes('romantik') || name.includes('romance')) return <MdFavorite {...iconProps} />;
    if (name.includes('bilim') || name.includes('science')) return <MdRocket {...iconProps} />;
    if (name.includes('fantastik') || name.includes('fantasy')) return <MdAutoFixHigh {...iconProps} />;
    if (name.includes('dram') || name.includes('drama')) return <MdTheaters {...iconProps} />;
    if (name.includes('animasyon') || name.includes('animation')) return <MdColorLens {...iconProps} />;
    if (name.includes('macera') || name.includes('adventure')) return <MdMap {...iconProps} />;
    if (name.includes('belgesel') || name.includes('documentary')) return <MdVideoLibrary {...iconProps} />;
    if (name.includes('müzik') || name.includes('music')) return '�';
    if (name.includes('gerilim') || name.includes('thriller')) return <MdLocalFireDepartment {...iconProps} />;
    if (name.includes('suç') || name.includes('crime')) return <MdSecurity {...iconProps} />;
    if (name.includes('savaş') || name.includes('war')) return <MdSecurity {...iconProps} />;
    if (name.includes('tarih') || name.includes('history')) return <MdAccountBalance {...iconProps} />;
    if (name.includes('mystery') || name.includes('gizem')) return <MdSearch {...iconProps} />;
    if (name.includes('aile') || name.includes('family')) return <MdGroups {...iconProps} />;
    if (name.includes('western') || name.includes('vahşi')) return <MdMap {...iconProps} />;
    if (name.includes('politics') || name.includes('politika')) return <MdAccountBalance {...iconProps} />;
    if (name.includes('reality') || name.includes('gerçek')) return <MdTv {...iconProps} />;
    if (name.includes('talk')) return <MdMic {...iconProps} />;
    if (name.includes('soap') || name.includes('pembe')) return <MdFavoriteBorder {...iconProps} />;
    
    // Varsayılan iconlar
    const defaultIcons = [<MdCategory {...iconProps} />, <MdStar {...iconProps} />, <MdSettings {...iconProps} />, <MdCameraRoll {...iconProps} />];
    return defaultIcons[Math.floor(Math.random() * defaultIcons.length)];
  };

  // Genre isimlerini Türkçeleştir
  const getLocalizedGenreName = (genreName: string) => {
    const genreMap: { [key: string]: string } = {
      // TV Show genres (Dizi türleri)
      'Action & Adventure': 'Aksiyon & Macera',
      'Animation': 'Animasyon',
      'Comedy': 'Komedi',
      'Crime': 'Suç',
      'Documentary': 'Belgesel',
      'Drama': 'Dram',
      'Family': 'Aile',
      'Kids': 'Çocuklar',
      'Mystery': 'Gizem',
      'News': 'Haber',
      'Reality': 'Gerçek Hayat',
      'Sci-Fi & Fantasy': 'Bilim Kurgu & Fantastik',
      'Soap': 'Pembe Dizi',
      'Talk': 'Talk Show',
      'War & Politics': 'Savaş & Politika',
      'Western': 'Vahşi Batı',
      
      // Movie genres (Film türleri)
      'Action': 'Aksiyon',
      'Adventure': 'Macera',
      'Fantasy': 'Fantastik',
      'Science Fiction': 'Bilim Kurgu',
      'Thriller': 'Gerilim',
      'Horror': 'Korku',
      'Romance': 'Romantik',
      'Music': 'Müzik',
      'History': 'Tarih',
      'War': 'Savaş',
      'TV Movie': 'TV Filmi'
    };

    return genreMap[genreName] || genreName;
  };


  if (loading) {
    return (
      <div className="h-full sidebar-bg">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="h-12 sidebar-button rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full sidebar-bg">
      <div className="p-6">
        <h2 className="text-xl font-bold text-primary mb-6">
          {type === 'tv' ? 'Dizi Türleri' : 'Film Türleri'}
        </h2>

        {/* Film/Dizi Türleri - Tek Sütun Liste */}
        <div className="space-y-3">
          {genres.map((genre) => (
            <button
              key={genre.id}
              onClick={() => onGenreSelect(genre)}
              className={`w-full flex items-center space-x-2 px-4 py-3 text-base font-medium transition-colors duration-200 sidebar-button rounded-lg ${
                selectedGenre?.id === genre.id ? 'active' : ''
              }`}
            >
              <div className="text-lg flex items-center justify-center w-5 h-5">{getGenreIcon(genre.name)}</div>
              <span>{getLocalizedGenreName(genre.name)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
