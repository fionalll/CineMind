// src/components/FilmFirlatModal.tsx - DÜZELTİLMİŞ HALİ

import React, { useState, useEffect } from 'react';
import { api } from '../services/api'; 
import type { Movie } from '../types';


interface Props {
  movie?: Movie;
  kimeGonderiliyor?: { id: string; displayName: string };
  onClose: () => void;
}

const FilmFirlatModal: React.FC<Props> = ({ movie, kimeGonderiliyor, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(movie || null);
  const [notMetni, setNotMetni] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(kimeGonderiliyor || null);
  const [friends] = useState([
    { id: '1', displayName: 'Ahmet Yılmaz' },
    { id: '2', displayName: 'Ayşe Kaya' },
    { id: '3', displayName: 'Mehmet Demir' }
  ]); // Demo arkadaş listesi

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
          const response = await api.get(`/movies/search?query=${searchQuery}`);
          // Map TMDB's poster_path to posterPath for all results
          const mappedResults = (response.data.results || []).map((movie: any) => ({
            ...movie,
            posterPath: movie.poster_path || null,
            releaseDate: movie.release_date || '',
          }));
          setSearchResults(mappedResults);
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

    if (!selectedFriend) {
      setError('Lütfen film fırlatacağınız arkadaşı seçin.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await api.post('/oneriler', {
        alanKullaniciId: selectedFriend.id,
        filmId: selectedMovie.id,
        filmAdi: selectedMovie.title,
        filmPosterUrl: selectedMovie.posterPath ? `https://image.tmdb.org/t/p/w500${selectedMovie.posterPath}` : null,
        notMetni: notMetni,
      });
      alert(`'${selectedMovie.title}' filmi ${selectedFriend.displayName} kullanıcısına başarıyla fırlatıldı!`);
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
      <div className="card-bg rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-4">
          {selectedFriend ? `${selectedFriend.displayName} Kişisine` : 'Arkadaşına'} Film Fırlat 🚀
        </h2>

        {/* Arkadaş Seçimi */}
        {!kimeGonderiliyor && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-secondary mb-2">Kime fırlatacaksın?</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  onClick={() => setSelectedFriend(friend)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedFriend?.id === friend.id
                      ? 'bg-accent text-primary'
                      : 'bg-secondary hover:bg-tertiary text-primary'
                  }`}
                >
                  {friend.displayName}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Film Seçimi */}
        {!selectedMovie ? (
          <div>
            <h3 className="text-sm font-semibold text-secondary mb-2">Hangi filmi fırlatacaksın?</h3>
            <input
              type="text"
              placeholder="Fırlatmak istediğin filmi ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary p-3 rounded-lg focus:outline-none text-primary"
              autoFocus={!movie}
            />
            <div className="mt-4 max-h-60 overflow-y-auto">
              {isSearching && <p className="text-center text-secondary">Aranıyor...</p>}
              {searchResults.map((movie) => (
                <div key={movie.id} onClick={() => handleSelectMovie(movie)} className="flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-secondary transition-colors">
                  <img 
                    src={movie.posterPath ? `https://image.tmdb.org/t/p/w92${movie.posterPath}` : 'https://placehold.co/92x138'} 
                    alt={movie.title} 
                    className="w-12 h-18 object-cover rounded" 
                  />
                  <div>
                    <p className="font-semibold text-primary">{movie.title}</p>
                    <p className="text-sm text-secondary">{movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-secondary p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-secondary">Fırlatılacak Film:</h3>
            <div className="flex items-center gap-4">
              <img 
                src={selectedMovie.posterPath ? `https://image.tmdb.org/t/p/w92${selectedMovie.posterPath}` : 'https://placehold.co/92x138'} 
                alt={selectedMovie.title} 
                className="w-16 h-24 object-cover rounded" 
              />
              <div className="flex-1">
                <p className="font-bold text-lg text-primary">{selectedMovie.title}</p>
                <p className="text-sm text-secondary mb-2">
                  {selectedMovie.releaseDate ? new Date(selectedMovie.releaseDate).getFullYear() : ''}
                </p>
                {!movie && (
                  <button 
                    onClick={() => setSelectedMovie(null)} 
                    className="text-xs text-accent hover:underline"
                  >
                    Değiştir
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Not Alanı */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-secondary mb-2">Bir not eklemek ister misin?</h3>
          <textarea
            placeholder="Örn: Bu filmi çok beğendin, mutlaka izle!"
            value={notMetni}
            onChange={(e) => setNotMetni(e.target.value)}
            className="w-full bg-secondary p-3 rounded-lg focus:outline-none h-20 resize-none text-primary placeholder-gray-400"
          />
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Aksiyon Butonları */}
        <div className="flex justify-end gap-3 mt-6">
          <button 
            onClick={onClose} 
            className="px-5 py-2 rounded-lg text-primary bg-secondary hover:bg-tertiary transition-colors"
          >
            İptal
          </button>
          <button 
            onClick={handleFirlat} 
            disabled={isLoading || !selectedMovie || !selectedFriend} 
            className="px-5 py-2 rounded-lg text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? 'Fırlatılıyor...' : '🎯 Fırlat!'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilmFirlatModal;