// src/components/FilmFirlatModal.tsx - DÜZELTİLMİŞ HALİ

import React, { useState, useEffect } from 'react';
import { api } from '../services/api'; 
import type { Movie } from '../types';

interface Props {
  kimeGonderiliyor: { id: string; displayName: string };
  onClose: () => void;
}

const FilmFirlatModal: React.FC<Props> = ({ kimeGonderiliyor, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [notMetni, setNotMetni] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await api.get(`/movies/search?query=${searchQuery}`);
        setSearchResults(response.data.results || []);
      } catch (err) {
        console.error("Film arama hatası:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleFirlat = async () => {
    if (!selectedMovie) {
      setError('Lütfen fırlatmak için bir film seçin.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await api.post('/oneriler', {
        alanKullaniciId: kimeGonderiliyor.id,
        filmId: selectedMovie.id,
        filmAdi: selectedMovie.title,
        // DÜZELTME: selectedMovie.poster_path -> selectedMovie.posterPath
        filmPosterUrl: selectedMovie.posterPath ? `https://image.tmdb.org/t/p/w500${selectedMovie.posterPath}` : null,
        notMetni: notMetni,
      });
      alert(`'${selectedMovie.title}' filmi ${kimeGonderiliyor.displayName} kullanıcısına başarıyla fırlatıldı!`);
      onClose();
    } catch (err) {
      console.error("Film fırlatılamadı:", err);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card-bg rounded-xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-primary mb-4">{kimeGonderiliyor.displayName} için Film Fırlat 🚀</h2>
        
        {!selectedMovie ? (
          <>
            <input
              type="text"
              placeholder="Fırlatmak istediğin filmi ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary p-2 rounded-lg focus:outline-none"
              autoFocus
            />
            <div className="mt-4 max-h-60 overflow-y-auto">
              {isSearching && <p className="text-center text-secondary">Aranıyor...</p>}
              {searchResults.map((movie) => (
                <div key={movie.id} onClick={() => handleSelectMovie(movie)} className="flex items-center gap-4 p-2 rounded-lg cursor-pointer hover:bg-secondary">
                  {/* DÜZELTME: movie.poster_path -> movie.posterPath */}
                  <img src={movie.posterPath ? `https://image.tmdb.org/t/p/w92${movie.posterPath}` : 'https://placehold.co/92x138'} alt={movie.title} className="w-12 rounded" />
                  <div>
                    <p className="font-semibold text-primary">{movie.title}</p>
                    {/* DÜZELTME: movie.release_date -> movie.releaseDate */}
                    <p className="text-sm text-secondary">{new Date(movie.releaseDate).getFullYear() || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-secondary p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Seçilen Film:</h3>
            <div className="flex items-center gap-4">
              {/* DÜZELTME: selectedMovie.poster_path -> selectedMovie.posterPath */}
              <img src={selectedMovie.posterPath ? `https://image.tmdb.org/t/p/w92${selectedMovie.posterPath}` : 'https://placehold.co/92x138'} alt={selectedMovie.title} className="w-16 rounded" />
              <div>
                <p className="font-bold text-lg text-primary">{selectedMovie.title}</p>
                <button onClick={() => setSelectedMovie(null)} className="text-xs text-accent hover:underline">Değiştir</button>
              </div>
            </div>
          </div>
        )}
        
        <textarea
          placeholder="İsteğe bağlı not ekle..."
          value={notMetni}
          onChange={(e) => setNotMetni(e.target.value)}
          className="w-full bg-secondary p-2 rounded-lg mt-4 focus:outline-none h-20 resize-none"
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="flex justify-end gap-4 mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-primary bg-secondary hover:bg-tertiary">İptal</button>
          <button onClick={handleFirlat} disabled={isLoading || !selectedMovie} className="px-4 py-2 rounded-lg text-white bg-accent hover:opacity-80 disabled:opacity-50">
            {isLoading ? 'Fırlatılıyor...' : 'Fırlat'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilmFirlatModal;