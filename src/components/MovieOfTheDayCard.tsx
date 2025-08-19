import React from 'react';

// Prop tipi, her iki kart türünün de ihtiyaç duyduğu tüm alanları içerir
interface MovieOfTheDayCardProps {
  movie: {
    id: number;
    title: string;
    overview: string;
    backdrop_path: string;
    poster_path: string;
    release_date: string;
    vote_average: number;
    genres: any[];
    runtime: number;
  } | null;
  loading: boolean;
  variant?: 'hero' | 'poster'; // Kartın görünümünü belirleyen komut
}

const MovieOfTheDayCard: React.FC<MovieOfTheDayCardProps> = ({ movie, loading, variant = 'hero' }) => {
  
  // ==========================================================
  // VARYASYON 1: KÜÇÜK POSTER GÖRÜNÜMÜ ("Günün Filmi")
  // ==========================================================
  if (variant === 'poster') {
    if (loading) return <div className="w-full max-w-xs mx-auto md:mx-0 rounded-xl bg-gray-800 animate-pulse h-96"></div>;
    if (!movie) return <div className="w-full max-w-xs mx-auto md:mx-0 rounded-xl bg-gray-800 flex items-center justify-center h-96"><p className="text-gray-400">Yüklenemedi</p></div>;
    
    const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    const formatRuntime = (minutes: number) => {
      if (!minutes) return '';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}s ${mins}dk`;
    };

    return (
      <div className="relative group w-full max-w-xs mx-auto md:mx-0 rounded-xl overflow-hidden shadow-lg h-96 cursor-pointer">
        <div className="absolute top-0 left-0 bg-accent/90 text-white text-xs font-bold px-2 py-1 rounded-br-lg rounded-tl-lg z-10">
          ✨ Günün Filmi
        </div>
        <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" /> 
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-5 text-white w-full">
          <h3 className="text-xl font-bold leading-tight">{movie.title}</h3>
          <div className="flex items-center gap-4 mt-2 text-white/90 text-sm">
            <div className="flex items-center gap-1"><span>⭐</span><span>{movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span></div>
            <div className="flex items-center gap-1"><span>📅</span><span>{movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</span></div>
            {movie.runtime > 0 && (<div className="flex items-center gap-1"><span>⏰</span><span>{formatRuntime(movie.runtime)}</span></div>)}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // VARYASYON 2: BÜYÜK HERO GÖRÜNÜMÜ ("Öne Çıkan Film") - EKSİK OLAN KOD
  // ==========================================================
  if (loading) return <div className="relative w-full h-96 bg-secondary rounded-xl overflow-hidden animate-pulse"></div>;
  if (!movie) return <div className="relative w-full h-96 bg-secondary rounded-xl flex items-center justify-center"><p className="text-gray-400">Film Yüklenemedi</p></div>;
  
  const backdropUrl = `https://image.tmdb.org/t/p/original${movie.backdrop_path}`;
  

  
  return (
    <div className="relative w-full h-96 bg-secondary rounded-xl overflow-hidden group">
      <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${backdropUrl})` }}></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 p-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">{movie.title}</h2>
        <div className="flex items-center gap-6 mb-6 text-white/80 text-sm">
            
        </div>
        <button className="px-6 py-3 bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg transition-all">Filmini Bul</button>
      </div>
    </div>
  );
};

export default MovieOfTheDayCard;
