import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ANIMAL_AVATARS, COLOR_AVATARS } from '../config/avatars';
import { api } from '../services/api';


interface Notification {
  id: string;
  type: string;
  message: string;
}

interface NavbarProps {
  onToggleSidebar?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { currentUser, logout, avatar, username } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  // Bildirimler için state ve fonksiyonlar
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    console.log("--- NAVBAR useEffect ÇALIŞTI ---");
    console.log("Mevcut kullanıcı (currentUser):", currentUser);

    if (currentUser) {
        console.log("Kullanıcı mevcut. Bildirimler çekiliyor...");
    const fetchNotifications = async () => {
      try {
        const response = await api.get<Notification[]>('/notifications', {
          headers: { 'x-user-id': currentUser.uid }
        });
        console.log("API'den gelen bildirimler:", response.data);
        setNotifications(response.data);
      } catch (error) {
        console.error("Bildirimler çekilirken HATA:", error);
      }
    };
        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 30000);
        return () => clearInterval(intervalId);
    } else {
        console.log("Kullanıcı henüz yok. Bildirimler çekilmedi.");
    }
  }, [currentUser]);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTerm.trim()) {
        navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      }
    }
  };

  // Bildirim zili tıklama fonksiyonu
  const handleBellClick = () => {
    setShowNotifications((prev) => !prev);
  };

  // Bildirim silme fonksiyonu
  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Bu, "x"e basınca arkadaki li'nin tıklanmasını engeller
    try {
        await api.delete(`/notifications/${notificationId}`);
        // Bildirimi anında ekrandan kaldır
        setNotifications(prevNotifications => 
            prevNotifications.filter(notif => notif.id !== notificationId)
        );
    } catch (error) {
        console.error("Bildirim silinemedi:", error);
    }
  };

  // Tüm bildirimleri silme fonksiyonu
  const handleDeleteAllNotifications = async () => {
    try {
        await api.post('/notifications/delete-all');
        // Tüm bildirimleri anında ekrandan temizle
        setNotifications([]);
    } catch (error) {
        console.error("Tüm bildirimler silinemedi:", error);
    }
  };

  

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 navbar border-b backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and Hamburger */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-lg transition-colors duration-200 lg:hidden text-secondary hover:text-primary hover:bg-tertiary"
                data-sidebar-toggle
                aria-label="Toggle sidebar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <Link to="/" className="flex items-center space-x-3 text-xl font-bold">
              <div className="w-12 h-12 flex items-center justify-center">
                <img 
                  src="/avatars/logo-popcorn .png" 
                  alt="CinePop Logo" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <span className="hidden sm:inline text-primary">CinePop</span>
            </Link>
          </div>

          {/* Center - Search Bar */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Film, dizi, oyuncu ara..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:scale-105"
                  style={{
                    backgroundColor: 'var(--background-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--background-tertiary)'
                  }}
                />
              </div>
            </form>
          </div>

          {/* Right side - User menu with navigation */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Navigation Links - moved next to user name */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/"
                className={`navbar-link ${isActive('/') ? 'active' : ''}`}
                style={{
                  color: isActive('/') ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive('/') ? 'var(--accent)' : 'transparent',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  transition: 'all 0.2s',
                }}
              >
                Filmler
              </Link>
              <Link
                to="/diziler"
                className={`navbar-link ${isActive('/diziler') ? 'active' : ''}`}
                style={{
                  color: isActive('/diziler') ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive('/diziler') ? 'var(--accent)' : 'transparent',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  transition: 'all 0.2s',
                }}
              >
                Diziler
              </Link>
              <Link
                to="/chat"
                className={`navbar-link ${isActive('/chat') ? 'active' : ''}`}
                style={{
                  color: isActive('/chat') ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive('/chat') ? 'var(--accent)' : 'transparent',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  transition: 'all 0.2s',
                }}
              >
                AI Asistan
              </Link>
              <Link
                to="/random-episode"
                className={`navbar-link ${isActive('/random-episode') ? 'active' : ''}`}
                style={{
                  color: isActive('/random-episode') ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive('/random-episode') ? 'var(--accent)' : 'transparent',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  transition: 'all 0.2s',
                }}
              >
                 Rastgele Bölüm
              </Link>
              <Link
                to="/watched"
                className={`navbar-link ${isActive('/watched') ? 'active' : ''}`}
                style={{
                  color: isActive('/watched') ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive('/watched') ? 'var(--accent)' : 'transparent',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  transition: 'all 0.2s',
                }}
              >
                İzlediklerim
              </Link>
            </div>

            {/* Bildirim Zili ve Menüsü - kullanıcı menüsünden hemen önce */}
            {currentUser && (
              <div className="relative">
                  <button onClick={handleBellClick} className="relative p-2 rounded-full hover:bg-secondary transition-colors" title="Bildirimler">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      {notifications.length > 0 && (
                          <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-primary"></span>
                      )}
                  </button>
                  {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-secondary rounded-lg shadow-xl z-20 animate-fade-in-up">
              <div className="p-3 font-bold text-primary border-b border-tertiary flex justify-between items-center">
                <span>Bildirimler</span>
                <button 
                  onClick={handleDeleteAllNotifications}
                  className="text-xs font-normal text-secondary hover:text-primary transition-colors"
                  title="Tümünü sil"
                >
                  Tümünü Sil
                </button>
              </div>
                          {notifications.length > 0 ? (
                              <ul className="max-h-96 overflow-y-auto">
                                {notifications.map((notif) => (
                                  <li 
                                    key={notif.id} 
                                    onClick={() => {
                                      navigate('/hesabim');
                                      setShowNotifications(false);
                                    }}
                                    className="p-3 border-b border-tertiary text-sm text-secondary hover:bg-tertiary cursor-pointer flex items-center justify-between gap-3 group"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-xl">{notif.type === 'yeni_oneri' ? '🚀' : '💬'}</span>
                                      <span>{notif.message}</span>
                                    </div>
                                    <button 
                                      onClick={(e) => handleDeleteNotification(notif.id, e)}
                                      className="text-lg text-secondary opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                                      title="Bu bildirimi sil"
                                    >
                                      &times;
                                    </button>
                                  </li>
                                ))}
                              </ul>
                          ) : (
                              <div className="p-4 text-center text-sm text-secondary">
                                  Okunacak yeni bildirim yok.
                              </div>
                          )}
                      </div>
                  )}
              </div>
            )}

            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg transition-colors duration-200 text-secondary hover:text-primary hover:bg-tertiary"
              >
                {/** Avatar gösterimi **/}
                {ANIMAL_AVATARS.some(a => a.id === avatar) ? (
                  (() => {
                    const animalObj = ANIMAL_AVATARS.find(a => a.id === avatar);
                    return (
                      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-600 flex items-center justify-center">
                        <img
                          src={animalObj?.src || ''}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    );
                  })()
                ) : COLOR_AVATARS.some(c => c.id === avatar) ? (
                  (() => {
                    const colorObj = COLOR_AVATARS.find(c => c.id === avatar);
                    return (
                      <div
                        className="w-8 h-8 rounded-full border-2 border-gray-600"
                        style={{ backgroundColor: colorObj?.value || '#60A5FA' }}
                      >
                      </div>
                    );
                  })()
                ) : (
                  <div
                    className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-600 flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: 'var(--primary)', color: 'var(--text-primary)' }}
                  >
                    {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
                <span className="hidden sm:inline text-sm font-medium text-primary">
                  {currentUser?.displayName || 'Kullanıcı'}
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border py-1 z-50"
                  style={{
                    backgroundColor: 'var(--background-secondary)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <p className="text-sm font-medium text-primary">
                      {currentUser?.displayName || 'Kullanıcı'}
                    </p>
                    <p className="text-xs text-secondary">
                      {currentUser?.email}
                    </p>
                  </div>
                  <Link
                    to="/hesabim"
                    className="block px-4 py-2 text-sm transition-colors duration-200 text-secondary hover:text-primary hover:bg-tertiary"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Hesabım
                  </Link>
                  <Link
                    to={`/profile/${username || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'user'}`}
                    className="block px-4 py-2 text-sm transition-colors duration-200 text-secondary hover:text-primary hover:bg-tertiary"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Profilim
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm transition-colors duration-200 text-secondary hover:text-primary hover:bg-tertiary"
                  >
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Navigation Menu */}
            <div className="md:hidden flex items-center space-x-2">
              <Link
                to="/watched"
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  isActive('/watched') ? 'active' : ''
                }`}
                style={{
                  color: isActive('/watched') ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive('/watched') ? 'var(--accent)' : 'transparent'
                }}
                aria-label="İzlediklerim"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </Link>
              <Link
                to="/chat"
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  isActive('/chat') ? 'active' : ''
                }`}
                style={{
                  color: isActive('/chat') ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive('/chat') ? 'var(--accent)' : 'transparent'
                }}
                aria-label="AI Asistan"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
