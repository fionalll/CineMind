// src/components/GelenYanitlarListesi.tsx

import React from 'react';

// Projendeki types dosyasından FilmOneri tipini import etmek en iyisidir.
// Eğer ayrı bir dosyan yoksa bu tanımı kullanabilirsin.
import type { FilmOneri } from '../types';
import { ANIMAL_AVATARS, COLOR_AVATARS } from '../config/avatars';

interface Props {
  yanitlar: FilmOneri[];
  loading: boolean;
  onYanitClick: (yanit: FilmOneri) => void;
}

const GelenYanitlarListesi: React.FC<Props> = ({ yanitlar, loading, onYanitClick }) => {
    const renderUserAvatar = (user: { avatar?: string, displayName?: string } | undefined) => {
    // Eğer 'user' objesi hiç yoksa (undefined ise), varsayılan bir avatar göster.
    if (!user) {

        return (
            <div className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-xs">?</span>
            </div>
        );
    }
    
    const avatarSrc = ANIMAL_AVATARS.find(a => a.id === user.avatar)?.src;
    const colorValue = COLOR_AVATARS.find(a => a.id === user.avatar)?.value;
    

    if (avatarSrc) {
    return (
        <img 
        src={avatarSrc} 
        alt={user.displayName || 'Avatar'} 
        className="w-8 h-8 rounded-full object-cover flex-shrink-0" 
        />
    );
    }
    
    if (colorValue) {
    return (
        <div 
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: colorValue }}
        >
        <span className="text-white font-bold text-xs">{user.displayName?.[0]?.toUpperCase()}</span>
        </div>
    );
    }

    // Hiçbir şey eşleşmezse varsayılan
    return (
    <div className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center flex-shrink-0">
        <span className="text-primary font-bold text-xs">{user.displayName?.[0]?.toUpperCase() || 'B'}</span>
    </div>
    );
};
  return (
    <div className="bg-secondary bg-opacity-50 p-6 rounded-lg h-full">
      <h3 className="text-xl font-bold text-primary mb-4">Gelen Yanıtlar</h3>
      {/* Yüklenme durumu aktifse bunu göster */}
      {loading && (
        <div className="text-center py-10">
          <p className="text-secondary">Yanıtlar yükleniyor...</p>
        </div>
      )}
      {/* Yüklenme bitti ve hiç yanıt yoksa bu mesajı göster */}
      {!loading && yanitlar.length === 0 && (
        <div className="text-center py-10">
          <p className="text-secondary">Henüz yanıtlanmış bir önerin yok.</p>
        </div>
      )}
      {/* Yanıtlar varsa, her birini listele */}
      {!loading && yanitlar.length > 0 && (
        <ul className="space-y-2">
          {yanitlar.map((yanit) => (
            <li 
              key={yanit.id} 
              onClick={() => onYanitClick(yanit)}
              className="film-oneri-item bg-primary p-2 rounded-md cursor-pointer hover:bg-accent hover:bg-opacity-20 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                    {renderUserAvatar(yanit.alanKullanici)}
                  <span className="font-semibold text-xs text-primary truncate">
                    {yanit.alanKullanici && yanit.alanKullanici.displayName ? yanit.alanKullanici.displayName : 'Biri'}
                  </span>
                </div>
                <span className="text-xs text-secondary truncate">
                  <strong>{yanit.filmAdi}</strong>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GelenYanitlarListesi;