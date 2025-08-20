import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface LoginRegisterProps {
  onSuccess?: () => void;
}

const LoginRegister: React.FC<LoginRegisterProps> = ({ onSuccess }) => {
  // --- STATE TANIMLAMALARI ---
  const [isLogin, setIsLogin] = useState(true);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false); // Şifre sıfırlama modu için
  
  // Form state'leri
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  // Kullanıcı adı kontrol state'leri
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameMessage, setUsernameMessage] = useState('');

  // Yardımcı state'ler
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // Başarı mesajları için

  // Context'ten fonksiyonları al
  const { login, register, sendResetPasswordLink } = useAuth(); // sendResetPasswordLink eklendi

  // --- KULLANICI ADI KONTROL FONKSİYONLARI ---

  // Kullanıcı adı kontrolü için backend'e istek gönder
  const checkUsername = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }

    try {
      setUsernameStatus('checking');
      setUsernameMessage('Kontrol ediliyor...');

      const response = await api.post('/auth/check-username', {
        username: usernameToCheck
      });

      if (response.data.available) {
        setUsernameStatus('available');
        setUsernameMessage('✓ Kullanıcı adı uygun');
      } else {
        setUsernameStatus('taken');
        setUsernameMessage('✗ Bu kullanıcı adı alınmış');
      }
    } catch (error) {
      console.error('Username check error:', error);
      setUsernameStatus('idle');
      setUsernameMessage('Kontrol edilemedi');
    }
  }, []);

  // Debounced username kontrolü - 500ms bekle
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (username && !isLogin) {
        checkUsername(username);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, isLogin, checkUsername]);

  // --- FONKSİYONLAR ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !username)) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    // Kayıt modunda kullanıcı adı kontrol edilmelidir
    if (!isLogin && usernameStatus !== 'available') {
      setError('Lütfen geçerli bir kullanıcı adı seçin');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, username);
      }
      onSuccess?.();
    } catch (err: any) {
      // Firebase'den gelen hata kodlarına göre daha anlaşılır mesajlar verebiliriz
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-posta veya şifre hatalı.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Bu e-posta adresi zaten kullanılıyor.');
      } else {
        setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Lütfen e-posta adresinizi girin.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await sendResetPasswordLink(email);
      setMessage('Şifre sıfırlama linki e-posta adresinize gönderildi. Lütfen gelen kutunuzu (ve spam klasörünü) kontrol edin.');
    } catch (err: any) {
      setError('Bir hata oluştu. E-posta adresinizin doğru olduğundan emin olun.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setMessage('');
    setEmail('');
    setPassword('');
    setUsername('');
    setUsernameStatus('idle');
    setUsernameMessage('');
  };

  // --- RENDER BÖLÜMÜ ---

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎬 CineMind</h1>
          <p className="text-gray-300">Akıllı Film Öneri Platformu</p>
        </div>

        {/* --- KOŞULLU RENDER --- */}

        {forgotPasswordMode ? (
          // --- ŞİFRE SIFIRLAMA FORMU ---
          <div className="card p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-white text-center mb-2">Şifre Sıfırlama</h2>
            <p className="text-gray-400 text-center text-sm mb-6">
              Kayıtlı e-posta adresinize bir sıfırlama linki göndereceğiz.
            </p>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Adresi</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field w-full"
                  placeholder="Email adresinizi girin"
                  required
                />
              </div>
              
              {/* Mesaj ve Hata Alanları */}
              {message && <div className="text-green-400 text-sm">{message}</div>}
              {error && <div className="text-red-400 text-sm">{error}</div>}
              
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3"
              >
                {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
              </button>
            </form>
            <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordMode(false);
                    setIsLogin(true);
                    setError('');
                    setMessage('');
                  }}
                  className="text-blue-400 hover:text-blue-300 font-medium ml-1"
                >
                  Giriş Yap
                </button>
            </div>
          </div>
        ) : (
          // --- GİRİŞ VE KAYIT FORMU ---
          <div className="card p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white text-center mb-2">{isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}</h2>
              <p className="text-gray-400 text-center text-sm mb-6">
                {isLogin ? 'Giriş yapmak için bilgilerinizi girin.' : 'Yeni bir hesap oluşturun.'}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && ( 
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Kullanıcı Adı</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                        setUsername(value);
                        if (!value) {
                          setUsernameStatus('idle');
                          setUsernameMessage('');
                        }
                      }}
                      className={`input-field w-full pr-10 ${
                        usernameStatus === 'available' ? 'border-green-500' : 
                        usernameStatus === 'taken' ? 'border-red-500' : ''
                      }`}
                      placeholder="kullaniciadi123"
                      required
                      minLength={3}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {usernameStatus === 'checking' && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                      )}
                      {usernameStatus === 'available' && (
                        <span className="text-green-400 text-lg">✓</span>
                      )}
                      {usernameStatus === 'taken' && (
                        <span className="text-red-400 text-lg">✗</span>
                      )}
                    </div>
                  </div>
                  {usernameMessage && (
                    <p className={`text-xs mt-1 ${
                      usernameStatus === 'available' ? 'text-green-400' : 
                      usernameStatus === 'taken' ? 'text-red-400' : 
                      'text-gray-400'
                    }`}>
                      {usernameMessage}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Sadece küçük harf, rakam ve alt çizgi kullanın (min. 3 karakter)
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Adresi</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field w-full"
                  placeholder="Email adresinizi girin"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Şifre</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full"
                  placeholder="Şifrenizi girin"
                  required
                />
              </div>
              
              <div className="text-right text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordMode(true);
                    setError('');
                    setMessage('');
                  }}
                  className="font-medium text-blue-400 hover:text-blue-300"
                >
                  Şifrenizi mi unuttunuz?
                </button>
              </div>
              
              {error && <div className="text-red-400 text-sm">{error}</div>}
              {message && <div className="text-green-400 text-sm">{message}</div>}

              <button
                type="submit"
                disabled={loading || (!isLogin && usernameStatus !== 'available' && !!username)}
                className={`btn-primary w-full py-3 ${
                  loading || (!isLogin && usernameStatus !== 'available' && username) 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
              >
                {loading ? (isLogin ? 'Giriş Yapılıyor...' : 'Kaydolunuyor...') : (isLogin ? 'Giriş Yap' : 'Kaydol')}
              </button>
            </form>
            
            <div className="mt-6 text-center text-gray-400 text-sm">
              {isLogin ? 'Hesabınız yok mu?' : 'Zaten bir hesabınız var mı?'}
              <button
                type="button"
                onClick={toggleMode}
                className="text-blue-400 hover:text-blue-300 font-medium ml-1"
              >
                {isLogin ? 'Şimdi Kaydol' : 'Giriş Yap'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginRegister;
