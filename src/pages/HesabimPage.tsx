import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { COLOR_AVATARS, ANIMAL_AVATARS } from '../config/avatars';
import { useWatched } from '../context/WatchedContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import BackButton from '../components/BackButton';
import SettingsModal from '../components/SettingsModal';
import { api } from '../services/api';
import FilmOneriListesi from '../components/FilmOneriListesi';
import OneriDetayModal from '../components/OneriDetayModal';
import GelenYanitlarListesi from '../components/GelenYanitlarListesi';
import type { FilmOneri } from '../types';

const HesabimPage: React.FC = () => {
  const navigate = useNavigate();   
  const [isSearching, setIsSearching] = useState(false); // Arama modu aktif mi?
  const [searchQuery, setSearchQuery] = useState('');   // Arama çubuğuna yazılan metin
  const [searchResults, setSearchResults] = useState<User[]>([]); // Arama sonuçları
  const [searchLoading, setSearchLoading] = useState(false); // Arama yükleniyor mu?
  const { currentUser, avatar, updateUsername, changeEmail, changePassword, deleteAccount } = useAuth();
  const { watchedMovies } = useWatched();
  const {} = useTheme();
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  
  // E-posta değiştirme modal state'leri
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  // Şifre değiştirme modal state'leri
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPasswordForChange, setCurrentPasswordForChange] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Hesap silme modal state'leri
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [gelenYanitlar, setGelenYanitlar] = useState<FilmOneri[]>([]);
  const [yanitlarLoading, setYanitlarLoading] = useState(false);
  const [seciliYanit, setSeciliYanit] = useState<FilmOneri | null>(null);
  




  interface User {
    uid: string;
    displayName: string;
    username: string;
    avatar?: string;
  }


  // FilmOneri tipi artık types dosyasından import ediliyor
  const [filmOnerileri, setFilmOnerileri] = useState<FilmOneri[]>([]);
  const [onerilerLoading, setOnerilerLoading] = useState(false);
  const [seciliOneri, setSeciliOneri] = useState<FilmOneri | null>(null);

  // Takipçiler ve takip edilenler state'leri
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);


  const handleIzlemeListesineEkle = async (oneri: FilmOneri) => {
    try {
        await api.post(`/api/oneriler/${oneri.id}/listeye-ekle`, { 
            filmId: oneri.filmId,
            filmAdi: oneri.filmAdi,
            filmPosterUrl: oneri.filmPosterUrl 
        });
        setFilmOnerileri(prev => prev.filter(o => o.id !== oneri.id));
        setSeciliOneri(null);
        alert(`${oneri.filmAdi} izleme listene eklendi!`);
    } catch (error) {
        console.error("Film izleme listesine eklenemedi:", error);
        alert("Hata: Film listeye eklenemedi.");
    }
};
const handleReddet = async (oneri: FilmOneri) => {
  try {
        await api.post(`/api/oneriler/${oneri.id}/reddet`);
        setFilmOnerileri(prev => prev.filter(o => o.id !== oneri.id));
        setSeciliOneri(null);
    } catch (error) {
        console.error("Öneri reddedilemedi:", error);
        alert("Hata: Öneri reddedilemedi.");
    }
};

const handleTesekkurEt = async (oneri: FilmOneri) => {
    try {
        await api.post(`/api/oneriler/${oneri.id}/tesekkur-et`);
        setFilmOnerileri(prev => prev.filter(o => o.id !== oneri.id));
        setSeciliOneri(null);
    } catch (error) {
        console.error("Teşekkür edilemedi:", error);
        alert("Hata: Teşekkür edilemedi.");
    }
};

  


  // 1. useEffect: Takipçi ve Takip Edilen Verilerini Çeker
  useEffect(() => {
    if (!currentUser) return;

    const fetchFollowData = async () => {
      setFollowersLoading(true);
      setFollowingLoading(true);
      try {
        const [followingResponse, followersResponse] = await Promise.all([
          api.get(`/users/${currentUser.uid}/following`),
          api.get(`/users/${currentUser.uid}/followers`)
        ]);
        setFollowing(followingResponse.data);
        setFollowers(followersResponse.data);
      } catch (error) {
        console.error("Takip bilgileri alınamadı:", error);
      } finally {
        setFollowersLoading(false);
        setFollowingLoading(false);
      }
    };
    fetchFollowData();
  }, [currentUser]);

  // 2. useEffect: Kullanıcı Arama Mantığını Yönetir
  useEffect(() => {
    if (!isSearching || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await api.get<User[]>(`/users/search?query=${searchQuery}`);
        setSearchResults(response.data);
      } catch (error) {
        console.error("Kullanıcı araması başarısız:", error);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isSearching]);


  useEffect(() => {
    if (!currentUser) return; // Kullanıcı girişi yoksa bir şey yapma

    const fetchGelenYanitlar = async () => {
        setYanitlarLoading(true); // Yükleniyor durumunu başlat
        try {
            // Backend'de oluşturduğumuz yeni endpoint'i çağırıyoruz
            const response = await api.get<FilmOneri[]>(`/users/${currentUser.uid}/gelen-yanitlar`);
            setGelenYanitlar(response.data); // Gelen veriyi yeni state'e ata
        } catch (error) {
            console.error("Gelen yanıtlar alınamadı:", error);
        } finally {
            setYanitlarLoading(false); // Yükleniyor durumunu bitir
        }
    };

    fetchGelenYanitlar();
}, [currentUser])

  // === DÜZELTİLMİŞ BÖLÜM SONU ===
    // === YENİ useEffect - Film Önerilerini Çeker ===
  useEffect(() => {
    if (!currentUser) return; // Kullanıcı girişi yoksa bir şey yapma

    const fetchFilmOnerileri = async () => {
      setOnerilerLoading(true); // Yükleniyor durumunu başlat
      try {
        // API'den mevcut kullanıcının 'uid'si ile ilgili önerileri istiyoruz
        const response = await api.get<FilmOneri[]>(`/users/${currentUser.uid}/film-onerileri`);
        setFilmOnerileri(response.data); // Gelen veriyi state'e ata
      } catch (error) {
        console.error("Film önerileri alınamadı:", error);
      } finally {
        setOnerilerLoading(false); // Yükleniyor durumunu bitir
      }
    };

    fetchFilmOnerileri();
  }, [currentUser]); // currentUser değiştiğinde bu fonksiyon yeniden çalışır

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      setUsernameError('Kullanıcı adı boş olamaz');
      return;
    }

    if (newUsername.trim().length < 2) {
      setUsernameError('Kullanıcı adı en az 2 karakter olmalıdır');
      return;
    }

    setUsernameLoading(true);
    setUsernameError('');

    try {
      await updateUsername(newUsername.trim());
      setShowUsernameModal(false);
      setNewUsername('');
    } catch (error) {
      setUsernameError(error instanceof Error ? error.message : 'Kullanıcı adı güncellenirken hata oluştu');
    } finally {
      setUsernameLoading(false);
    }
  };

  const openUsernameModal = () => {
    setNewUsername(currentUser?.displayName || '');
    setUsernameError('');
    setShowUsernameModal(true);
  };

  const handleChangeEmail = async () => {
    if (!currentPassword.trim()) {
      setEmailError('Mevcut şifrenizi girmelisiniz');
      return;
    }

    if (!newEmail.trim()) {
      setEmailError('Yeni e-posta adresini girmelisiniz');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setEmailError('Geçerli bir e-posta adresi girin');
      return;
    }

    setEmailLoading(true);
    setEmailError('');
    setEmailSuccess('');

    try {
      await changeEmail(currentPassword, newEmail);
      setEmailSuccess('Doğrulama e-postası gönderildi! E-posta kutunuzu kontrol edin.');
      setCurrentPassword('');
      setNewEmail('');
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailSuccess('');
      }, 3000);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'E-posta güncellenirken hata oluştu');
    } finally {
      setEmailLoading(false);
    }
  };

  const openEmailModal = () => {
    setCurrentPassword('');
    setNewEmail('');
    setEmailError('');
    setEmailSuccess('');
    setShowEmailModal(true);
  };

  const handleChangePassword = async () => {
    if (!currentPasswordForChange.trim()) {
      setPasswordError('Mevcut şifrenizi girmelisiniz');
      return;
    }

    if (!newPassword.trim()) {
      setPasswordError('Yeni şifrenizi girmelisiniz');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Yeni şifre en az 6 karakter olmalıdır');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Yeni şifreler eşleşmiyor');
      return;
    }

    if (currentPasswordForChange === newPassword) {
      setPasswordError('Yeni şifre mevcut şifreden farklı olmalıdır');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      await changePassword(currentPasswordForChange, newPassword);
      setPasswordSuccess('Şifreniz başarıyla güncellendi!');
      setCurrentPasswordForChange('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Şifre güncellenirken hata oluştu');
    } finally {
      setPasswordLoading(false);
    }
  };

  const openPasswordModal = () => {
    setCurrentPasswordForChange('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    setShowPasswordModal(true);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError('Şifrenizi girmelisiniz');
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');

    try {
      await deleteAccount(deletePassword);
      // Kullanıcı başarıyla silindikten sonra otomatik olarak çıkış yapar
      // onAuthStateChanged dinleyicisi tarafından ana sayfaya yönlendirilir
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Hesap silinirken hata oluştu');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteModal = () => {
    setDeletePassword('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  // Takipçileri ve takip edilenleri getiren fonksiyonlar
  const fetchFollowers = async () => {
    if (!currentUser?.uid) return;
    
    setFollowersLoading(true);
    try {
      const response = await api.get(`/users/${currentUser.uid}/followers`);
      const followersData = response.data || [];
      setFollowers(Array.isArray(followersData) ? followersData : []);
    } catch (error) {
      console.error('Takipçiler getirilirken hata:', error);
      setFollowers([]);
    } finally {
      setFollowersLoading(false);
    }
  };

  const fetchFollowing = async () => {
    if (!currentUser?.uid) return;
    
    setFollowingLoading(true);
    try {
      const response = await api.get(`/users/${currentUser.uid}/following`);
      const followingData = response.data || [];
      setFollowing(Array.isArray(followingData) ? followingData : []);
    } catch (error) {
      console.error('Takip edilenler getirilirken hata:', error);
      setFollowing([]);
    } finally {
      setFollowingLoading(false);
    }
  };

  // Component mount olduğunda verileri çek
useEffect(() => {
    if (currentUser?.uid) {
      fetchFollowers();
      fetchFollowing();
    }
  }, [currentUser?.uid]);

  // Kullanıcı profiline yönlendirme fonksiyonu
  const handleUserClick = (user: User) => {
    navigate(`/profile/${user.username}`);
  };

  // Avatar render fonksiyonu
  const renderUserAvatar = (user: User) => {
    if (user.avatar && user.avatar.startsWith('color_')) {
      const colorAvatar = COLOR_AVATARS.find(a => a.id === user.avatar);
      return (
        <div
          className="w-12 h-12 rounded-full border-2 border-accent flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: colorAvatar?.value || '#ffffffff' }}
        >
          {user.displayName?.[0]?.toUpperCase() || 'U'}
        </div>
      );
    } else if (user.avatar && user.avatar.startsWith('animal_')) {
      const animalAvatar = ANIMAL_AVATARS.find(a => a.id === user.avatar);
      return (
        <img
          src={animalAvatar?.src || '/avatars/bear.png'}
          alt="Avatar"
          className="w-12 h-12 rounded-full border-2 border-accent object-cover"
        />
      );
    } else {
      return (
        <div className="w-12 h-12 rounded-full border-2 border-accent flex items-center justify-center bg-secondary text-primary text-sm font-bold">
          {user.displayName?.[0]?.toUpperCase() || 'U'}
        </div>
      );
    }
  };

  return (
    <div>
      <div className="h-screen bg-primary overflow-hidden">
        <Navbar />
        <div className="container mx-auto px-4 py-4 h-full">
          <BackButton />
        
        {/* Ana Panel - Tek Büyük Konteyner - Viewport height kullan */}
        <div className="card-bg rounded-xl p-6 grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-6 mt-4 h-[calc(100vh-180px)]">
          
          {/* Sol Sütun: Profil Bilgileri */}
          <div className="lg:col-span-1">
            <div className="text-center lg:text-left mb-4">
              <h2 className="text-2xl font-bold text-primary mb-4">Profil Bilgileri</h2>
              
              <div className="flex flex-col lg:flex-row items-center lg:items-center gap-4">
                {/* Avatar gösterimi - Daha büyük */}
                <div className="flex-shrink-0 lg:mr-6">
                  <div className="mb-4 relative group cursor-pointer" onClick={() => setShowSettingsModal(true)}>
                    {avatar && avatar.startsWith('color_') ? (
                      <div
                        className="w-20 h-20 rounded-full border-3 border-accent flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                    style={{ backgroundColor: COLOR_AVATARS.find(a => a.id === avatar)?.value || '#ffffffff' }}
                  >
                    <span className="text-white text-lg font-bold">
                      {currentUser?.displayName?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                ) : avatar && avatar.startsWith('animal_') ? (
                  <img
                    src={ANIMAL_AVATARS.find(a => a.id === avatar)?.src || '/avatars/bear.png'}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full border-3 border-accent mx-auto object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full border-3 border-accent flex items-center justify-center bg-secondary mx-auto transition-transform duration-200 group-hover:scale-105">
                    <span className="text-primary text-lg font-bold">
                      {currentUser?.displayName?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="text-white text-center">
                    <div className="text-2xl mb-1">✏️</div>
                    <div className="text-xs font-medium">Düzenle</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* CLOSE ADDED */}
              </div>

              {/* Kullanıcı Bilgileri - Tamamen yeniden tasarlandı */}
              <div className="flex-1 text-center lg:text-left">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-primary mb-1">
                      {currentUser?.displayName || 'Kullanıcı'}
                    </h3>
                    <p className="text-sm text-secondary mb-3">{currentUser?.email}</p>
                  </div>

                  <div className="bg-secondary rounded-lg p-2 w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📊</span>
                      <div>
                        <h4 className="font-semibold text-primary text-xs">Hesap Durumu</h4>
                        <p className="text-xs text-secondary">Aktif üyelik</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Ayarlar Butonları - Kompakt */}
                  <div className="space-y-2 mt-4 max-w-sm">
                    {/* Görünümü Kişiselleştir Butonu - Küçük */}
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="w-full bg-secondary hover:bg-accent hover:bg-opacity-20 border border-default hover:border-accent p-2 rounded-lg transition-all duration-200 flex items-center gap-2 group"
                    >
                      <div className="text-sm group-hover:scale-110 transition-transform duration-200">🎨</div>
                      <div className="text-left">
                        <div className="text-xs font-semibold text-primary">Görünümü Kişiselleştir</div>
                        <div className="text-xs text-secondary">Tema ve avatar ayarları</div>
                      </div>
                    </button>

                    {/* Hesap Ayarları Butonu - Küçük */}
                    <button
                      onClick={() => setShowAccountSettings(true)}
                      className="w-full bg-secondary hover:bg-accent hover:bg-opacity-20 border border-default hover:border-accent p-2 rounded-lg transition-all duration-200 flex items-center gap-2 group"
                    >
                      <div className="text-sm group-hover:scale-110 transition-transform duration-200">⚙️</div>
                      <div className="text-left">
                        <div className="text-xs font-semibold text-primary">Hesap Ayarları</div>
                        <div className="text-xs text-secondary">Kullanıcı bilgileri ve güvenlik</div>
                      </div>
                    </button>

                    {/* İzlenen Filmler Butonu - En altta */}
                    <button
                      onClick={() => navigate('/watched-movies')}
                      className="w-full bg-secondary hover:bg-accent hover:bg-opacity-20 border border-default hover:border-accent p-2 rounded-lg transition-all duration-200 flex items-center gap-2 group"
                    >
                      <div className="text-lg group-hover:scale-110 transition-transform duration-200">🎬</div>
                      <div className="text-left flex-1">
                        <div className="text-xs font-semibold text-primary">İzlenen Filmler</div>
                        <div className="text-xs text-secondary">Film geçmişinizi görüntüleyin</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-accent">{watchedMovies.length}</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Orta Sütun: Film Öneri Listesi */}
          {/* ========================================================== */}
          {/*         YENİ, İKİYE BÖLÜNMÜŞ ORTA SÜTUN          */}
          {/* ========================================================== */}
          {/* Orta Sütun Ana Konteyneri */}
          <div className="lg:col-span-1">
            {/* İç Grid: Bu grid, orta sütunu ikiye böler */}
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Sol Yarısı: Gelen Film Önerileri */}
              <div className="col-span-1">
                <FilmOneriListesi
                  oneriler={filmOnerileri}
                  loading={onerilerLoading}
                  onOneriClick={(oneri: FilmOneri) => setSeciliOneri(oneri)}
                />
              </div>
              {/* Sağ Yarısı: Gelen Yanıtlar */}
              <div className="col-span-1">
                <div className="h-64 overflow-y-auto">
                  <GelenYanitlarListesi 
                    yanitlar={gelenYanitlar} 
                    loading={yanitlarLoading}
                    onYanitClick={(yanit) => setSeciliYanit(yanit)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Sütun: Takipçiler ve Takip Edilenler */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
            <div className="bg-secondary bg-opacity-50 p-4 rounded-lg">
  {isSearching ? (
    // ARAMA MODU AKTİFSE BU GÖRÜNECEK
    <div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Kullanıcı adı ara..."
          className="w-full bg-background-tertiary p-2 rounded focus:outline-none focus:ring-2 focus:ring-accent"
          autoFocus
        />
        <button onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="text-sm text-text-secondary hover:text-text-primary">
          İptal
        </button>
      </div>
      {/* Arama Sonuçları */}
      <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
        {searchLoading && <p className="text-sm text-center text-text-secondary">Aranıyor...</p>}
        {!searchLoading && searchResults.length > 0 && searchResults.map(user => (
          <div key={user.uid || user.username || user.displayName || Math.random()} onClick={() => handleUserClick(user)} className="flex items-center p-2 rounded hover:bg-background-tertiary cursor-pointer">
            {renderUserAvatar(user)}
            <div className="ml-3">
              <p className="font-semibold text-primary">{user.displayName}</p>
              <p className="text-xs text-secondary">@{user.username}</p>
            </div>
          </div>
        ))}
        {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
          <p className="text-sm text-center text-text-secondary">Sonuç bulunamadı.</p>
        )}
      </div>
    </div>
  ) : (
    // ARAMA MODU KAPALIYSA BU GÖRÜNECEK
    <button 
      onClick={() => setIsSearching(true)}
      className="w-full text-left flex items-center gap-3"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span className="font-semibold text-primary">Yeni Kullanıcılar Ara</span>
    </button>
  )}
</div>

              {/* Takipçilerim Bölümü */}
              <div className="bg-secondary bg-opacity-50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  Takipçilerim
                  <span className="text-sm font-normal text-secondary">({followers?.length || 0})</span>
                </h3>
                
                <div className="relative">
                  {followersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                    </div>
                  ) : followers && followers.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                      {followers.map((follower: User) => (
                        <div
                          key={follower.uid || follower.username || follower.displayName || Math.random()}
                          onClick={() => handleUserClick(follower)}
                          className="flex-shrink-0 cursor-pointer group"
                        >
                          <div className="text-center">
                            <div className="mb-2 transition-transform duration-200 group-hover:scale-105">
                              {renderUserAvatar(follower)}
                            </div>
                            <div className="text-xs text-secondary group-hover:text-primary transition-colors max-w-[60px] truncate">
                              @{follower.username || follower.displayName}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-secondary">
                      
                      <div className="text-sm">Henüz takipçin yok</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Takip Ettiklerim Bölümü */}
              <div className="bg-secondary bg-opacity-50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  
                  Takip Ettiklerim
                  <span className="text-sm font-normal text-secondary">({following?.length || 0})</span>
                </h3>
                
                <div className="relative">
                  {followingLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                    </div>
                  ) : following && following.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                      {following.map((followedUser: User) => (
                        <div
                          key={followedUser.uid || followedUser.username || followedUser.displayName || Math.random()}
                          onClick={() => handleUserClick(followedUser)}
                          className="flex-shrink-0 cursor-pointer group"
                        >
                          <div className="text-center">
                            <div className="mb-2 transition-transform duration-200 group-hover:scale-105">
                              {renderUserAvatar(followedUser)}
                            </div>
                            <div className="text-xs text-secondary group-hover:text-primary transition-colors max-w-[60px] truncate">
                              @{followedUser.username || followedUser.displayName}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-secondary">
                      <div className="text-sm">Henüz kimseyi takip etmiyorsun</div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Hesap Ayarları Modalı */}
        {showAccountSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-primary rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="sticky top-0 bg-primary border-b border-default p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-primary">⚙️ Hesap Ayarları</h2>
                <button
                  onClick={() => setShowAccountSettings(false)}
                  className="text-secondary hover:text-primary transition-colors p-2 rounded-lg hover:bg-secondary"
                >
                  ✕
                </button>
              </div>
              {/* Hesap Ayarları Paneli */}
              <div className="p-6">
                <div className="space-y-4">
                  {/* Kullanıcı Adını Değiştir */}
                  <button 
                    onClick={openUsernameModal}
                    className="w-full flex items-center gap-4 p-4 bg-blue-50 bg-opacity-10 border border-blue-300 border-opacity-30 rounded-lg hover:bg-blue-200 hover:bg-opacity-30 transition-all duration-200 text-left"
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-blue-500 bg-opacity-20 rounded-lg">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-blue-400 font-medium">Kullanıcı Adını Değiştir</span>
                  </button>

                  {/* E-Posta Değiştir */}
                  <button 
                    onClick={openEmailModal}
                    className="w-full flex items-center gap-4 p-4 bg-green-50 bg-opacity-10 border border-green-300 border-opacity-30 rounded-lg hover:bg-green-200 hover:bg-opacity-30 transition-all duration-200 text-left"
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-green-500 bg-opacity-20 rounded-lg">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-green-400 font-medium">E-Posta Değiştir</span>
                  </button>

                  {/* Şifre Değiştir */}
                  <button 
                    onClick={openPasswordModal}
                    className="w-full flex items-center gap-4 p-4 bg-yellow-50 bg-opacity-10 border border-yellow-300 border-opacity-30 rounded-lg hover:bg-yellow-200 hover:bg-opacity-30 transition-all duration-200 text-left"
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-yellow-300 bg-opacity-20 rounded-lg">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <span className="text-yellow-400 font-medium">Şifre Değiştir</span>
                  </button>

                   {/* Oturum Geçmişi */}
                  <button 
                    onClick={() => console.log('Oturum Geçmişi tıklandı')}
                    className="w-full flex items-center gap-4 p-4 bg-purple-50 bg-opacity-10 border border-purple-300 border-opacity-30 rounded-lg hover:bg-purple-200 hover:bg-opacity-30 transition-all duration-200 text-left"
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-purple-300 bg-opacity-20 rounded-lg">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-purple-400 font-medium">Oturum Geçmişi</span>
                  </button>

                  {/* Hesabı Sil */}
                  <button 
                    onClick={openDeleteModal}
                    className="w-full flex items-center gap-4 p-4 bg-red-50 bg-opacity-10 border border-red-300 border-opacity-30 rounded-lg hover:bg-red-200 hover:bg-opacity-30 transition-all duration-200 text-left"
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-red-300 bg-opacity-20 rounded-lg">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <span className="text-red-400 font-medium">Hesabı Sil</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Kullanıcı Adı Değiştirme Modalı */}
      {showUsernameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-secondary rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary">Kullanıcı Adını Değiştir</h3>
              <button 
                onClick={() => setShowUsernameModal(false)}
                className="text-secondary hover:text-accent transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Yeni Kullanıcı Adı
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-primary border border-accent border-opacity-30 rounded-lg text-primary placeholder-secondary focus:outline-none focus:border-accent"
                  placeholder="Yeni kullanıcı adınızı girin"
                  disabled={usernameLoading}
                />
              </div>
              
              {usernameError && (
                <div className="text-red-400 text-sm">
                  {usernameError}
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUsernameModal(false)}
                  className="flex-1 px-4 py-2 bg-secondary border border-accent border-opacity-30 rounded-lg text-primary hover:bg-opacity-80 transition-all duration-200"
                  disabled={usernameLoading}
                >
                  İptal
                </button>
                <button
                  onClick={handleUpdateUsername}
                  className="flex-1 px-4 py-2 bg-accent rounded-lg text-white hover:bg-opacity-90 transition-all duration-200 disabled:opacity-50"
                  disabled={usernameLoading || !newUsername.trim()}
                >
                  {usernameLoading ? 'Güncelleniyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* E-Posta Değiştirme Modalı */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-secondary rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary">E-Posta Değiştir</h3>
              <button 
                onClick={() => setShowEmailModal(false)}
                className="text-secondary hover:text-accent transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-opacity-40 border border-opacity-10 rounded-lg p-5 mb-7">
                <p className="text-sm font-medium text-primary mb-2">
                  Yeni e-posta adresinize bir doğrulama linki gönderilecek. Lütfen linke tıklayarak değişikliği tamamlayın.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Mevcut Şifreniz
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-primary border border-accent border-opacity-30 rounded-lg text-primary placeholder-secondary focus:outline-none focus:border-accent"
                  placeholder="Mevcut şifrenizi girin"
                  disabled={emailLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Yeni E-Posta Adresi
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-primary border border-accent border-opacity-30 rounded-lg text-primary placeholder-secondary focus:outline-none focus:border-accent"
                  placeholder="Yeni e-posta adresinizi girin"
                  disabled={emailLoading}
                />
              </div>
              
              {emailError && (
                <div className="text-red-400 text-sm">
                  {emailError}
                </div>
              )}

              {emailSuccess && (
                <div className="text-green-400 text-sm">
                  {emailSuccess}
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 px-4 py-2 bg-secondary border border-accent border-opacity-30 rounded-lg text-primary hover:bg-opacity-80 transition-all duration-200"
                  disabled={emailLoading}
                >
                  İptal
                </button>
                <button
                  onClick={handleChangeEmail}
                  className="flex-1 px-4 py-2 bg-accent rounded-lg text-white hover:bg-opacity-90 transition-all duration-200 disabled:opacity-50"
                  disabled={emailLoading || !currentPassword.trim() || !newEmail.trim()}
                >
                  {emailLoading ? 'Gönderiliyor...' : 'Doğrulama Gönder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Şifre Değiştirme Modalı */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-secondary rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary">Şifre Değiştir</h3>
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="text-secondary hover:text-accent transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white-500 bg-opacity-10 border border-white-300 border-opacity-30 rounded-lg p-3 mb-4">
                <p className="text-sm text-primary mb-2">
                  Güvenliğiniz için önce mevcut şifrenizi doğrulamamız gerekiyor.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Mevcut Şifreniz
                </label>
                <input
                  type="password"
                  value={currentPasswordForChange}
                  onChange={(e) => setCurrentPasswordForChange(e.target.value)}
                  className="w-full px-3 py-2 bg-primary border border-accent border-opacity-30 rounded-lg text-primary placeholder-secondary focus:outline-none focus:border-accent"
                  placeholder="Mevcut şifrenizi girin"
                  disabled={passwordLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-primary border border-accent border-opacity-30 rounded-lg text-primary placeholder-secondary focus:outline-none focus:border-accent"
                  placeholder="Yeni şifrenizi girin (en az 6 karakter)"
                  disabled={passwordLoading}
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Yeni Şifre (Tekrar)
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-primary border border-accent border-opacity-30 rounded-lg text-primary placeholder-secondary focus:outline-none focus:border-accent"
                  placeholder="Yeni şifrenizi tekrar girin"
                  disabled={passwordLoading}
                />
              </div>
              
              {passwordError && (
                <div className="text-red-400 text-sm">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="text-green-400 text-sm">
                  {passwordSuccess}
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2 bg-secondary border border-accent border-opacity-30 rounded-lg text-primary hover:bg-opacity-80 transition-all duration-200"
                  disabled={passwordLoading}
                >
                  İptal
                </button>
                <button
                  onClick={handleChangePassword}
                  className="flex-1 px-4 py-2 bg-accent rounded-lg text-white hover:bg-opacity-90 transition-all duration-200 disabled:opacity-50"
                  disabled={passwordLoading || !currentPasswordForChange.trim() || !newPassword.trim() || !confirmNewPassword.trim()}
                >
                  {passwordLoading ? 'Güncelleniyor...' : 'Güncelle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hesap Silme Modalı */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-secondary rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-400">⚠️ Hesabınızı Silmek Üzere Olduğunuzdan Emin misiniz?</h3>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="text-secondary hover:text-accent transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-500 bg-opacity-10 border border-red-300 border-opacity-30 rounded-lg p-4 mb-4">
                <div className="space-y-2">
                  <p className="text-sm text-red-400 font-semibold">
                    🚨 Bu işlem geri alınamaz!
                  </p>
                  <p className="text-sm text-primary mb-2">
                    • Tüm izlediklerim listeleriniz kalıcı olarak silinecektir
                  </p>
                  <p className="text-sm text-primary mb-2">
                    • Tüm tercihleriniz ve ayarlarınız kaybolacaktır
                  </p>
                  <p className="text-sm text-primary mb-2">
                    • Bu hesabı tekrar kullanamayacaksınız
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Devam etmek için lütfen şifrenizi girin:
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-2 bg-primary border border-red-300 border-opacity-30 rounded-lg text-primary placeholder-secondary focus:outline-none focus:border-red-400"
                  placeholder="Şifrenizi girin"
                  disabled={deleteLoading}
                />
              </div>
              
              {deleteError && (
                <div className="text-red-400 text-sm">
                  {deleteError}
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-secondary border border-accent border-opacity-30 rounded-lg text-primary hover:bg-opacity-80 transition-all duration-200"
                  disabled={deleteLoading}
                >
                  İptal
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 px-4 py-2 bg-red-600 rounded-lg text-white hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
                  disabled={deleteLoading || !deletePassword.trim()}
                >
                  {deleteLoading ? 'Siliniyor...' : 'Hesabımı Sil'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal Componenti */}
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
      />
      {seciliOneri && (
        <OneriDetayModal
          oneri={seciliOneri}
          onClose={() => setSeciliOneri(null)}
          onReddet={handleReddet}
          onTesekkurEt={handleTesekkurEt}
          onListeyeEkle={handleIzlemeListesineEkle}
          viewMode="alici"
        />
      
      )}
      {seciliYanit && (
        <OneriDetayModal
          oneri={seciliYanit}
          onClose={() => setSeciliYanit(null)}
          viewMode="gonderen" // Bu ise "gönderen" modunda çalışacak
          // Bu modda diğer fonksiyonlara ihtiyacımız olmadığı için göndermiyoruz
        />
      )}
    </div>
  );
};

export default HesabimPage;
