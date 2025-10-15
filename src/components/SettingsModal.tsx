import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { COLOR_AVATARS, ANIMAL_AVATARS } from '../config/avatars';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { currentTheme, setTheme, themes } = useTheme();
  const { currentUser, avatar, updateAvatar } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-primary rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Modal Header */}
        <div className="sticky top-0 bg-primary border-b border-default p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary">🎨 Görünümü Kişiselleştir</h2>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary transition-colors p-2 rounded-lg hover:bg-secondary"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Tema Seçimi */}
          <div>
            <h3 className="text-xl font-bold text-primary mb-4">🎨 Tema Seçimi</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                    currentTheme === theme.id
                      ? 'border-accent shadow-lg'
                      : 'border-default hover:border-accent'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${theme.preview?.primary || '#1a1a1a'}20, ${theme.preview?.accent || '#3b82f6'}20)`,
                  }}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: theme.preview?.primary || '#1a1a1a' }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: theme.preview?.accent || '#3b82f6' }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: theme.preview?.secondary || '#2d2d2d' }}
                    />
                  </div>
                  <p className="text-sm font-medium text-primary text-left">
                    {theme.name}
                  </p>
                  {currentTheme === theme.id && (
                    <p className="text-xs text-accent mt-1">Aktif Tema ✓</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Avatar Seçimi */}
          <div>
            <h3 className="text-xl font-bold text-primary mb-4">👤 Avatar Seçimi</h3>
            
            {/* Renk Avatarları */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-primary mb-3">Renk Avatarları</h4>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-3">
                {COLOR_AVATARS.map((colorAvatar) => (
                  <button
                    key={colorAvatar.id}
                    onClick={async () => {
                      try {
                        await updateAvatar(colorAvatar.id);
                      } catch (error) {
                        console.error("Avatar seçimi hatası:", error);
                      }
                    }}
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all duration-200 hover:scale-110 ${
                      avatar === colorAvatar.id
                        ? 'ring-4 ring-accent ring-offset-2 ring-offset-primary'
                        : 'hover:ring-2 hover:ring-accent hover:ring-offset-1 hover:ring-offset-primary'
                    }`}
                    style={{ backgroundColor: colorAvatar.value }}
                    title={colorAvatar.name}
                  >
                    {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                    {avatar === colorAvatar.id && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Hayvan Avatarları */}
            <div>
              <h4 className="text-lg font-semibold text-primary mb-3">Hayvan Avatarları</h4>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-3">
                {ANIMAL_AVATARS.map((animalAvatar) => (
                  <button
                    key={animalAvatar.id}
                    onClick={async () => {
                      try {
                        await updateAvatar(animalAvatar.id);
                      } catch (error) {
                        console.error("Avatar seçimi hatası:", error);
                        // Kullanıcıya görsel geri bildirim
                      }
                    }}
                    className={`relative w-12 h-12 rounded-full overflow-hidden transition-all duration-200 hover:scale-110 ${
                      avatar === animalAvatar.id
                        ? 'ring-4 ring-accent ring-offset-2 ring-offset-primary'
                        : 'hover:ring-2 hover:ring-accent hover:ring-offset-1 hover:ring-offset-primary'
                    }`}
                    title={animalAvatar.name}
                  >
                    <img
                      src={animalAvatar.src}
                      alt={animalAvatar.name}
                      className="w-full h-full object-cover"
                    />
                    {avatar === animalAvatar.id && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-primary border-t border-default p-6 flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary px-6 py-2 rounded-lg transition-colors"
          >
            Tamamla
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
