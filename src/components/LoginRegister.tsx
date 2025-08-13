import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginRegisterProps {
  onSuccess?: () => void;
}

const LoginRegister: React.FC<LoginRegisterProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || (!isLogin && !username)) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, username);
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setUsername('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎬 CineMind</h1>
          <p className="text-gray-300">Akıllı Film Öneri Platformu</p>
        </div>

        {/* Auth Form */}
        <div className="card p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              {isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}
            </h2>
            <p className="text-gray-400 text-center text-sm">
              {isLogin 
                ? 'Film dünyasına geri dönün' 
                : 'Film keşfetme yolculuğunuza başlayın'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username - sadece kayıt için */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field w-full"
                  placeholder="Kullanıcı adınızı girin"
                  required={!isLogin}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Adresi
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full"
                placeholder="Email adresinizi girin"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full"
                placeholder="Şifrenizi girin"
                required
                minLength={6}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>İşlem yapılıyor...</span>
                </div>
              ) : (
                isLogin ? 'Giriş Yap' : 'Hesap Oluştur'
              )}
            </button>
          </form>

          {/* Toggle between Login/Register */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {isLogin ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
              {' '}
              <button
                onClick={toggleMode}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                {isLogin ? 'Kayıt ol' : 'Giriş yap'}
              </button>
            </p>
          </div>
        </div>

      
        
      </div>
    </div>
  );
};

export default LoginRegister;
