import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { COLOR_AVATARS, ANIMAL_AVATARS } from '../config/avatars';
import { useWatched } from '../context/WatchedContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import BackButton from '../components/BackButton';
import SettingsModal from '../components/SettingsModal';

const HesabimPage: React.FC = () => {
  const navigate = useNavigate();
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

  return (
    <div>
      <div className="min-h-screen bg-primary">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <BackButton />
        
        {/* Ana Panel - Tek Büyük Konteyner */}
        <div className="card-bg rounded-xl p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          
          {/* Sol Sütun: Profil Bilgileri - Büyütüldü */}
          <div className="lg:col-span-2">
            <div className="text-center lg:text-left mb-6">
              <h2 className="text-3xl font-bold text-primary mb-6">Profil Bilgileri</h2>
              
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
                {/* Avatar gösterimi - Daha büyük */}
                <div className="flex-shrink-0">
                  <div className="mb-4 relative group cursor-pointer" onClick={() => setShowSettingsModal(true)}>
                    {avatar && avatar.startsWith('color_') ? (
                      <div
                        className="w-32 h-32 rounded-full border-4 border-accent flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                    style={{ backgroundColor: COLOR_AVATARS.find(a => a.id === avatar)?.value || '#ffffffff' }}
                  >
                    <span className="text-white text-2xl font-bold">
                      {currentUser?.displayName?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                ) : avatar && avatar.startsWith('animal_') ? (
                  <img
                    src={ANIMAL_AVATARS.find(a => a.id === avatar)?.src || '/avatars/bear.png'}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full border-4 border-accent mx-auto object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-accent flex items-center justify-center bg-secondary mx-auto transition-transform duration-200 group-hover:scale-105">
                    <span className="text-primary text-2xl font-bold">
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
              <div className="flex-1">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-primary mb-2">
                      {currentUser?.displayName || 'Kullanıcı'}
                    </h3>
                    <p className="text-lg text-secondary mb-4">{currentUser?.email}</p>
                  </div>

                  <div className="bg-secondary rounded-lg p-3 w-64">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📊</span>
                      <div>
                        <h4 className="font-semibold text-primary text-sm">Hesap Durumu</h4>
                        <p className="text-xs text-secondary">Aktif üyelik</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Ayarlar Butonları - Kompakt */}
                  <div className="space-y-3 mt-6 max-w-sm">
                    {/* Görünümü Kişiselleştir Butonu - Küçük */}
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="w-64 bg-secondary hover:bg-accent hover:bg-opacity-20 border border-default hover:border-accent p-3 rounded-lg transition-all duration-200 flex items-center gap-3 group"
                    >
                      <div className="text-xl group-hover:scale-110 transition-transform duration-200">🎨</div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-primary">Görünümü Kişiselleştir</div>
                        <div className="text-xs text-secondary">Tema ve avatar ayarları</div>
                      </div>
                    </button>

                    {/* Hesap Ayarları Butonu - Küçük */}
                    <button
                      onClick={() => setShowAccountSettings(true)}
                      className="w-64 bg-secondary hover:bg-accent hover:bg-opacity-20 border border-default hover:border-accent p-3 rounded-lg transition-all duration-200 flex items-center gap-3 group"
                    >
                      <div className="text-xl group-hover:scale-110 transition-transform duration-200">⚙️</div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-primary">Hesap Ayarları</div>
                        <div className="text-xs text-secondary">Kullanıcı bilgileri ve güvenlik</div>
                      </div>
                    </button>

                    {/* İzlenen Filmler Butonu - En altta */}
                    <button
                      onClick={() => navigate('/watched-movies')}
                      className="w-64 bg-secondary hover:bg-accent hover:bg-opacity-20 border border-default hover:border-accent p-3 rounded-lg transition-all duration-200 flex items-center gap-2 group"
                    >
                      <div className="text-xl group-hover:scale-110 transition-transform duration-200">🎬</div>
                      <div className="text-left flex-1">
                        <div className="text-sm font-semibold text-primary">İzlenen Filmler</div>
                        <div className="text-xs text-secondary">Film geçmişinizi görüntüleyin</div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-accent">{watchedMovies.length}</span>
                      </div>
                    </button>
                  </div>
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
    </div>
  );
};

export default HesabimPage;
