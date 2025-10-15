// src/components/OneriDetayModal.tsx - GELİŞTİRİLMİŞ NİHAİ TASARIM

import React from 'react';
import { api } from '../services/api'; // Axios API client'ı ekle

import type { FilmOneri } from '../types';
// FilmOneri tipini buraya da alıyoruz.
  
// Component'in props tipini tanımlıyoruz.
interface Props {
  oneri: FilmOneri;
  onClose: () => void;
  onListeyeEkle?: (oneri: FilmOneri) => void;
  onReddet?: (oneri: FilmOneri) => void;
  onTesekkurEt?: (oneri: FilmOneri) => void;
  viewMode: 'alici' | 'gonderen';
}

const OneriDetayModal: React.FC<Props> = ({ oneri, onClose, onListeyeEkle, onReddet, onTesekkurEt, viewMode = 'alici' }) => {
  const [yanitMetni, setYanitMetni] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // Yanıt gönderme fonksiyonu (örnek)
const handleYanitGonder = async () => {
    if (!yanitMetni.trim()) {
      setError('Yanıt boş olamaz.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // YORUM SATIRI KALDIRILDI ve DOĞRU ENDPOINT KULLANILDI
      await api.post(`/oneriler/${oneri.id}/yanitla`, { yanitMetni });
      
      alert('Yanıtın başarıyla gönderildi!');
      onClose(); // İşlem başarılı olunca modal'ı kapat

    } catch (err) {
      console.error("Yanıt gönderilemedi:", err);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Modal arka planına tıklanınca modalı kapatır
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    // Modal'ın arkasındaki karartılmış alan
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      {/* ========================================================== */}
      {/* ========= BÜTÜNLEŞİK TASARIM: TEK KART (BAR) ========= */}
      {/* ========================================================== */}
      <div 
        className="bg-secondary rounded-xl p-4 w-full max-w-2xl flex items-start gap-5 animate-fade-in-up relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sol Taraf: Küçük Poster */}
        <div className="flex-shrink-0 w-32 md:w-40">
          <img 
            src={oneri.filmPosterUrl || 'https://via.placeholder.com/400x600?text=Poster+Yok'} 
            alt={`Poster of ${oneri.filmAdi}`}
            className="w-full h-auto object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* Sağ Taraf: Bilgiler ve Butonlar */}
        <div className="flex flex-col flex-grow h-full justify-between">
          <div>
            {/* Film Adı */}
            <h2 className="text-xl md:text-2xl font-bold text-primary mb-2">{oneri.filmAdi}</h2>

            {/* Gönderenin Notu */}
            {oneri.notMetni && (
              <div className="bg-secondary p-3 rounded-md mb-4">
                <p className="text-sm text-secondary">
                  <span className="font-semibold text-primary">
                    {viewMode === 'alici'
                      ? `${oneri.gonderenKullaniciAdi ? oneri.gonderenKullaniciAdi + "'nin notu:" : "Arkadaşının notu:"}`
                      : 'Senin notun:'}
                  </span>
                  <span className="italic"> "{oneri.notMetni}"</span>
                </p>
              </div>
            )}

            {/* Geri Yanıt Bölümü - sadece gonderen modunda ve yanıt varsa */}
            {viewMode === 'gonderen' && oneri.geriYanit && (
              <div className="bg-accent bg-opacity-10 p-3 rounded-md mb-4 flex items-center gap-3">
                {oneri.alanKullanici?.avatar ? (
                  <img
                    src={oneri.alanKullanici.avatar}
                    alt={oneri.alanKullanici.displayName || 'Avatar'}
                    className="w-8 h-8 rounded-full object-cover border-2 border-accent"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center">
                    <span className="text-primary font-bold text-xs">{oneri.alanKullanici?.displayName ? oneri.alanKullanici.displayName[0] : '?'}</span>
                  </div>
                )}
                <p className="text-sm text-primary">
                  <span className="font-semibold">
                    {oneri.alanKullanici?.displayName
                      ? `${oneri.alanKullanici.displayName}'nın yanıtı:`
                      : "Arkadaşının yanıtı:"}
                  </span>
                  <span className="italic"> "{oneri.geriYanit}"</span>
                </p>
              </div>
            )}

            {/* Yanıt Alanı ve Eylem Butonları - sadece alici modunda */}
            {viewMode === 'alici' && (
              <>
                {/* Yanıt Alanı */}
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex flex-col flex-1">
                    <label htmlFor="yanit" className="block text-sm font-medium text-primary mb-1">
                      Geri Yanıtın:
                    </label>
                    <textarea
                      id="yanit"
                      value={yanitMetni}
                      onChange={(e) => setYanitMetni(e.target.value)}
                      placeholder="Bir şeyler yaz..."
                      className="w-full bg-secondary p-2 rounded-lg focus:outline-none h-12 resize-none"
                      style={{ minHeight: '2.5rem', maxHeight: '2.5rem' }}
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <button
                      onClick={handleYanitGonder}
                      disabled={isLoading}
                      className="px-3 py-1 rounded-lg text-sm text-secondary bg-accent hover:opacity-80 disabled:opacity-50"
                      style={{ minWidth: '100px' }}
                    >
                      {isLoading ? 'Gönderiliyor...' : 'Yanıtı Gönder'}
                    </button>
                    {error && <p className="text-red-500 text-xs text-right mt-1">{error}</p>}
                  </div>
                </div>

                {/* Eylem Butonları */}
                <div className="border-t border-secondary mt-4 pt-4 flex items-center justify-center gap-4">
                  <button onClick={() => { if (onListeyeEkle) onListeyeEkle(oneri); }} className="text-primary font-bold hover:text-accent transition-colors">
                    İzleneceklere Ekle
                  </button>
                  <span className="text-secondary">|</span>
                  <button onClick={() => { if (onTesekkurEt) onTesekkurEt(oneri); }} className="text-primary font-bold hover:text-accent transition-colors">
                    Teşekkürler
                  </button>
                  <span className="text-secondary">|</span>
                  <button onClick={() => { if (onReddet) onReddet(oneri); }} className="text-primary font-bold hover:text-accent transition-colors">
                    Reddet
                  </button>
                </div>
              </>
            )}
          </div>


          

        </div>
        
        {/* Kapatma Butonu */}
        <button onClick={onClose} className="absolute top-2 right-2 text-secondary hover:text-primary text-2xl font-bold leading-none p-1">&times;</button>
      </div>
    </div>
  );
};

export default OneriDetayModal;