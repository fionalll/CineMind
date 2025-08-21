import React from 'react';

// HesabimPage'de tanımladığımız FilmOneri tipini buraya da alıyoruz.
// Projenin yapısına göre bunu ortak bir types dosyasından da import edebilirsin.
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

// Bu component'in dışarıdan alacağı bilgilerin (props) tipini tanımlıyoruz.
interface Props {
  oneriler: FilmOneri[];
  loading: boolean;
  onOneriClick: (oneri: FilmOneri) => void;
}

const FilmOneriListesi: React.FC<Props> = ({ oneriler, loading, onOneriClick }) => {
  
  // Yüklenme durumu aktifse bunu göster
  if (loading) {
    return (
      <div className="bg-secondary bg-opacity-50 p-4 rounded-lg text-center">
        <h3 className="text-lg font-bold text-primary mb-3">Gelen Film Önerileri</h3>
        <p className="text-secondary text-sm">Öneriler yükleniyor...</p>
      </div>
    );
  }

  return (
    // Senin mevcut tasarımına uygun bir kart yapısı
    <div className="bg-secondary bg-opacity-50 p-4 rounded-lg h-fit max-h-96 overflow-y-auto">
      <h3 className="text-lg font-bold text-primary mb-3">Gelen Film Önerileri</h3>
      
      {/* Eğer hiç öneri yoksa bu mesajı göster */}
      {oneriler.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-secondary text-sm">Henüz sana kimse film fırlatmamış!</p>
        </div>
      ) : (
        // Öneriler varsa, her birini listele
        <ul className="space-y-2">
          {oneriler.map((oneri) => (
            <li 
              key={oneri.id} 
              onClick={() => onOneriClick(oneri)}
              className="bg-primary p-2 rounded-md cursor-pointer hover:bg-accent hover:bg-opacity-20 transition-all duration-200"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-xs text-primary">{oneri.gonderenKullaniciAdi}</span>
                <span className="text-xs text-secondary truncate max-w-[120px]">
                  <strong>{oneri.filmAdi}</strong>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FilmOneriListesi;