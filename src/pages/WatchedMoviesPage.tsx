import React from 'react';
import { Link } from 'react-router-dom';
import { useWatched } from '../context/WatchedContext';
import Navbar from '../components/Navbar';
import BackButton from '../components/BackButton';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Movie } from '../types';

// WatchedContext'ten gelen film tipini kullan
interface WatchedMovie extends Movie {
  watchedAt: Date;
}

const WatchedMoviesPage: React.FC = () => {
  const { watchedMovies, loading: watchedLoading, error: watchedError } = useWatched();

  // Veriyi türlere göre gruplayan mantık
  const moviesByGenre = watchedMovies.reduce((acc, movie: WatchedMovie) => {
    // Sadece 'movie' tipindeki ve 'genres' bilgisi olanları al
    if (movie.media_type === 'movie' && Array.isArray(movie.genres)) {
      movie.genres.forEach(genre => {
        if (genre && genre.name) {
          let genreName = genre.name;
          
          // Türleri birleştir (hem İngilizce hem Türkçe)
          if (genreName === 'Action' || genreName === 'Adventure' || 
              genreName === 'Aksiyon' || genreName === 'Macera') {
            genreName = 'Macera & Aksiyon';
          } else if (genreName === 'Romance' || genreName === 'Comedy' || 
                     genreName === 'Romantik' || genreName === 'Komedi' || 
                     genreName === 'Romantic' || genreName === 'Komik') {
            genreName = 'Romantik & Komedi';
          } else if (genreName === 'Animation' || genreName === 'Animasyon') {
            genreName = 'Animasyon';
          } else if (genreName === 'Horror' || genreName === 'Korku') {
            genreName = 'Korku';
          } else if (genreName === 'Fantasy' || genreName === 'Fantastik' || genreName === 'Fantezi') {
            genreName = 'Fantastik';
          } else if (genreName === 'Science Fiction' || genreName === 'Bilim Kurgu' || 
                     genreName === 'Sci-Fi' || genreName === 'Science-Fiction') {
            genreName = 'Bilim Kurgu';
          } else {
            // Diğer türler için orijinal ismi kullan
            genreName = genreName;
          }
          
          if (!acc[genreName]) {
            acc[genreName] = [];
          }
          // Aynı filmin birden fazla kez eklenmesini önle
          if (!acc[genreName].some(existingMovie => existingMovie.id === movie.id)) {
            acc[genreName].push(movie);
          }
        }
      });
    }
    return acc;
  }, {} as Record<string, WatchedMovie[]>);

  if (watchedLoading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  }

  return (
    <div className="min-h-screen bg-primary relative overflow-hidden">
      {/* Arka Plan Atmosfer Elementleri */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Köşedeki Dekoratif Element */}
        <div className="corner-decoration">
          <div className="spider-web"></div>
        </div>
        
        {/* Rastgele Yerleştirilmiş Dekoratif Objeler */}
        <div className="floating-decorations">
          <div className="decoration-item potion-1">
            <div className="potion">
              <div className="liquid"></div>
              <div className="bubble"></div>
              <div className="bubble two"></div>
              <div className="bubble three"></div>
            </div>
          </div>
          
          <div className="decoration-item candle-1">
            <div className="candle">
              <div className="flame"></div>
              <div className="wax"></div>
            </div>
          </div>
          
          <div className="decoration-item vase-1">
            <div className="vase">
              <div className="flower"></div>
              <div className="flower"></div>
              <div className="flower"></div>
            </div>
          </div>
        </div>
      </div>

      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-20 relative z-10">
        <BackButton />
        
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-primary">
            Koleksiyonum
          </h1>
          <p className="text-secondary mt-4 text-xl">İzlediğin filmlerin türlere ayrılmış rafları</p>
        </div>

        {watchedError && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-300 p-4 rounded-lg mb-8">
            {watchedError}
          </div>
        )}

        {/* Koleksiyon Rafları */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12 pb-16">
          {Object.keys(moviesByGenre).length > 0 ? (
            // Gerçek film koleksiyonu varsa
            Object.entries(moviesByGenre).map(([genre]) => (
              <div key={genre} className="relative shelf-room">
                {/* Raf Container */}
                <Link 
                  to={`/koleksiyonum/${genre.toLowerCase().replace(/\s+/g, '-')}`}
                  className="block group"
                >
                  <div className="shelf-container">
                    {/* Tür Etiketi */}
                    <div className="genre-label">
                      <span>{genre}</span>
                      <div className="genre-line"></div>
                    </div>

                    {/* Şeffaf Arka Planlı Raf */}
                    <div className="transparent-shelf">
                      {/* Raf Tahtası */}
                      <div className="shelf-board">
                        {/* Raf Gölgesi */}
                        <div className="shelf-board-shadow"></div>
                        
                        {/* Dekoratif Kitaplar */}
                        <div className="books-container">
                          {/* Her türe özel kitap renkleri */}
                          <div className="book book-1">
                            <div className="book-spine book-spine-red">
                              <div className="book-shine"></div>
                            </div>
                          </div>
                          <div className="book book-2">
                            <div className="book-spine book-spine-blue">
                              <div className="book-shine"></div>
                            </div>
                          </div>
                          <div className="book book-3">
                            <div className="book-spine book-spine-green">
                              <div className="book-shine"></div>
                            </div>
                          </div>
                        </div>

                        {/* Raf Destekleri */}
                        <div className="shelf-support left"></div>
                        <div className="shelf-support right"></div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          ) : (
            // Koleksiyon boşsa örnek rafları göster
            ['Macera & Aksiyon', 'Animasyon', 'Romantik & Komedi', 'Korku', 'Fantastik', 'Bilim Kurgu'].map((genre) => (
              <div key={genre} className="relative shelf-room">
                <div className="shelf-container opacity-60">
                  {/* Tür Etiketi */}
                  <div className="genre-label">
                    <span>{genre}</span>
                    <div className="genre-line"></div>
                  </div>

                  {/* Şeffaf Arka Planlı Raf */}
                  <div className="transparent-shelf">
                    {/* Raf Tahtası */}
                    <div className="shelf-board">
                      {/* Raf Gölgesi */}
                      <div className="shelf-board-shadow"></div>
                      
                      {/* Dekoratif Kitaplar */}
                      <div className="books-container">
                        <div className="book book-1">
                          <div className="book-spine book-spine-red">
                            <div className="book-shine"></div>
                          </div>
                        </div>
                        <div className="book book-2">
                          <div className="book-spine book-spine-blue">
                            <div className="book-shine"></div>
                          </div>
                        </div>
                        <div className="book book-3">
                          <div className="book-spine book-spine-green">
                            <div className="book-shine"></div>
                          </div>
                        </div>
                      </div>

                      {/* Raf Destekleri */}
                      <div className="shelf-support left"></div>
                      <div className="shelf-support right"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {Object.keys(moviesByGenre).length === 0 && (
          <div className="text-center mt-16 mb-8">
            <div className="text-6xl mb-4">📽️</div>
            <h3 className="text-2xl font-bold text-cyan-400 mb-3">Koleksiyonun Henüz Boş</h3>
            <p className="text-secondary text-base max-w-sm mx-auto">
              İzlediğin filmler bu raflarda türlerine göre görünecek. Hemen bazı filmleri "izlendi" olarak işaretle!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchedMoviesPage;
