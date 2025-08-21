// src/components/OneriDetayModal.tsx

import React from 'react';

// FilmOneri tipini buraya da alıyoruz.
interface FilmOneri {
    id: string;
    gonderenKullaniciAdi: string;
    gonderenKullaniciAvatar?: string;
    filmId: string;
    filmAdi: string;
    filmPosterUrl?: string;
    notMetni?: string;
    durum: 'bekliyor' | 'okundu' | 'reddedildi';
    olusturulmaTarihi: any;
  }
  
// Component'in props tipini tanımlıyoruz.
interface Props {
  oneri: FilmOneri;
  onClose: () => void;
  onReddet: (oneri: FilmOneri) => void;
  onTesekkurEt: (oneri: FilmOneri) => void;
  onListeyeEkle: (oneri: FilmOneri) => void;
}

const OneriDetayModal: React.FC<Props> = ({ oneri, onClose, onReddet, onTesekkurEt,onListeyeEkle }) => {
  // Arka plana tıklandığında modal'ı kapatır, ama içeriğe tıklandığında kapatmaz.
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    // Modal'ın arkasındaki karartılmış alan (overlay/backdrop)
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      {/* Modal'ın ana içeriği */}
      <div 
        className="card-bg rounded-xl p-6 max-w-sm w-full animate-fade-in-up" // Basit bir giriş animasyonu için
      >
        {/* Poster */}
        <div className="w-full h-64 mb-4 rounded-lg overflow-hidden">
            <img 
              src={oneri.filmPosterUrl || 'https://via.placeholder.com/400x600?text=Poster+Yok'} 
              alt={`Poster of ${oneri.filmAdi}`}
              className="w-full h-full object-cover"
            />
        </div>

        {/* Film Adı */}
        <h2 className="text-2xl font-bold text-primary mb-2">{oneri.filmAdi}</h2>

        {/* Gönderenin Notu */}
        {oneri.notMetni && (
          <div className="bg-secondary p-3 rounded-md mb-4">
            <p className="text-sm text-secondary italic">
              <span className="font-semibold text-primary not-italic">{oneri.gonderenKullaniciAdi}'in notu:</span>
              {" "}"{oneri.notMetni}"
            </p>
          </div>
        )}

        {/* Eylem Butonları */}
        <div className="flex flex-col space-y-2">
            <button 
            onClick={() => onListeyeEkle(oneri)}
            className="w-full bg-accent text-white font-bold py-2 rounded-lg hover:bg-opacity-80 transition-all duration-200">
                İzleneceklere Ekle
            </button>
            <button 
            onClick={() => onTesekkurEt(oneri)}
            className="w-full bg-secondary text-primary font-bold py-2 rounded-lg hover:bg-opacity-80 transition-all duration-200">
                Teşekkürler
            </button>
            <button 
            onClick={() => onReddet(oneri)}
            className="w-full bg-transparent text-secondary text-sm py-1 rounded-lg hover:bg-secondary transition-all duration-200"
            >
                Reddet
            </button>
        </div>
      </div>
    </div>
  );
};

export default OneriDetayModal;