import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import BackButton from '../components/BackButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { movieService } from '../services/api';
import { COLOR_AVATARS, ANIMAL_AVATARS } from '../config/avatars';
import type { Movie } from '../types';
import FilmFirlatModal from '../components/FilmFirlatModal';

interface ProfileData {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  joinDate: string;
  bio: string;
  stats: {
    watchedMovies: number;
    watchlistMovies: number;
    favoriteGenres: string[];
    totalWatchTime: number;
  };
  recentMovies: Movie[];
}

const UserProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { currentUser, avatar } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [recommendedMovie, setRecommendedMovie] = useState<Movie | null>(null);
  const [userSelectedMovie, setUserSelectedMovie] = useState<Movie | null>(null);
  const [isSelectingMovie, setIsSelectingMovie] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [customTitle, setCustomTitle] = useState('Önerim');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showRecommendationSection, setShowRecommendationSection] = useState(true);
  const [bio, setBio] = useState('Film tutkunu, sinema sevdalısı. Her gün yeni filmler keşfetmeyi seviyorum.');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [showBio, setShowBio] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFirlatModal, setShowFirlatModal] = useState(false);
  
  // Takip sistemi state'leri
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Film önerileri state'i
  const [filmOnerileri, setFilmOnerileri] = useState<any[]>([]);

  // Kendi profili mi kontrolü
  const isOwnProfile = currentUser?.displayName === username || 
                      currentUser?.email?.split('@')[0] === username;

  // Takip sayılarını yenileme fonksiyonu
  const refreshFollowStats = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const followStats = await movieService.getUserFollowStats(currentUser.uid);
      setFollowerCount(followStats.followersCount);
      setFollowingCount(followStats.followingCount);
    } catch (error) {
      console.error('Takip bilgileri yenilenemedi:', error);
    }
  };

  // Debug için
  console.log('UserProfilePage Debug:', {
    username,
    currentUser: currentUser?.displayName,
    avatar,
    isOwnProfile
  });

  // Film arama fonksiyonu
  const handleSearchMovie = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await movieService.searchMulti(query);
      // SearchResult'ları Movie formatına çevir (sadece film/dizi olanları)
      const movies: Movie[] = response.results
        .filter(result => result.media_type === 'movie' || result.media_type === 'tv')
        .map(result => ({
          id: result.id,
          title: result.title || result.name || 'Bilinmeyen Başlık',
          originalTitle: result.originalTitle || result.title || result.name || '',
          overview: result.overview || '',
          posterPath: result.posterPath || null,
          backdropPath: result.backdropPath || null,
          releaseDate: result.releaseDate || '',
          voteAverage: result.voteAverage || 0,
          voteCount: result.voteCount || 0,
          media_type: result.media_type
        }));
      setSearchResults(movies);
    } catch (error) {
      console.error('Film arama hatası:', error);
      setSearchResults([]);
    }
  };

  // Film seçme fonksiyonu - film seçildiğinde öneri bölümünü göster
  const handleSelectMovie = (movie: Movie) => {
    setUserSelectedMovie(movie);
    setIsSelectingMovie(false);
    setSearchQuery('');
    setSearchResults([]);
    setShowRecommendationSection(true);
    
    // Seçilen filmi localStorage'a kaydet (sadece kendi profil için)
    if (isOwnProfile && currentUser?.uid) {
      localStorage.setItem(`selectedMovie_${currentUser.uid}`, JSON.stringify(movie));
      localStorage.setItem(`showRecommendation_${currentUser.uid}`, JSON.stringify(true));
    }
  };

  // Film kaldırma fonksiyonu - film kaldırıldığında öneri bölümünü gizle
  const handleRemoveMovie = () => {
    setUserSelectedMovie(null);
    setShowRecommendationSection(false);
    if (isOwnProfile && currentUser?.uid) {
      localStorage.removeItem(`selectedMovie_${currentUser.uid}`);
      localStorage.setItem(`showRecommendation_${currentUser.uid}`, JSON.stringify(false));
    }
  };

  // Takip etme/çıkarma fonksiyonu - gerçek zamanlı güncelleme ile
  const handleFollowToggle = async () => {
    if (!profileData?.id || !currentUser?.uid) return;
    
    setIsFollowLoading(true);
    
    // Optimistic UI - anlık tepki
    const previousFollowing = isFollowing;
    const previousCount = followerCount;
    
    setIsFollowing(!isFollowing);
    setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1);
    
    try {
      const result = await movieService.toggleFollowUser(profileData.id);
      
      // Backend'den gelen gerçek değerlerle güncelle
      setIsFollowing(result.isFollowing);
      
      // Takip işlemi sonrasında güncel takip sayılarını çek
      const updatedStats = await movieService.getUserFollowStats(profileData.id);
      setFollowerCount(updatedStats.followersCount);
      
      console.log(`✅ Takip işlemi başarılı: ${result.action}`);
      
    } catch (error) {
      // Hata durumunda eski değerlere geri dön
      setIsFollowing(previousFollowing);
      setFollowerCount(previousCount);
      console.error('Takip işlemi hatası:', error);
      alert(error instanceof Error ? error.message : 'Takip işlemi başarısız');
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Başlık kaydetme fonksiyonu
  const handleSaveTitle = (newTitle: string) => {
    setCustomTitle(newTitle);
    setIsEditingTitle(false);
    if (isOwnProfile && currentUser?.uid) {
      localStorage.setItem(`customTitle_${currentUser.uid}`, newTitle);
    }
  };

  // Bio kaydetme fonksiyonu
  const handleSaveBio = (newBio: string) => {
    setBio(newBio);
    setIsEditingBio(false);
    if (isOwnProfile && currentUser?.uid) {
      localStorage.setItem(`bio_${currentUser.uid}`, newBio);
    }
  };

  // Bio kaldırma fonksiyonu
  const handleRemoveBio = () => {
    setShowBio(false);
    if (isOwnProfile && currentUser?.uid) {
      localStorage.setItem(`showBio_${currentUser.uid}`, JSON.stringify(false));
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!username) {
        setError('Kullanıcı adı bulunamadı');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Kendi profilimiz için API çağrısı yapma, mock data kullan
        if (isOwnProfile) {
          const mockProfile: ProfileData = {
            id: currentUser?.uid || '',
            username: currentUser?.displayName || currentUser?.email?.split('@')[0] || username,
            displayName: currentUser?.displayName || 'Kullanıcı',
            email: currentUser?.email || '',
            avatar: avatar || '',
            joinDate: new Date().toISOString(),
            bio: 'Film tutkunu, sinema sevdalısı. Her gün yeni filmler keşfetmeyi seviyorum.',
            stats: {
              watchedMovies: 0,
              watchlistMovies: 0,
              favoriteGenres: [],
              totalWatchTime: 0
            },
            recentMovies: []
          };
          setProfileData(mockProfile);
          
          // Kendi profil için gerçek takip sayılarını Firebase'dan çek
          try {
            const followStats = await movieService.getUserFollowStats(currentUser?.uid || '');
            setFollowerCount(followStats.followersCount);
            setFollowingCount(followStats.followingCount);
          } catch (error) {
            console.error('Takip bilgileri alınamadı:', error);
            // Hata durumunda 0 olarak bırak
            setFollowerCount(0);
            setFollowingCount(0);
          }
        } else {
          // Başka kullanıcının profili için yeni username-based API'yi kullan
          try {
            const response = await movieService.getUserProfileByUsername(username);
            
            if (!response.success || !response.profile) {
              throw new Error('Kullanıcı profili bulunamadı');
            }

            const profile = response.profile;
            
            // ProfileData formatına dönüştür
            const formattedProfile: ProfileData = {
              id: profile.id,
              username: profile.username,
              displayName: profile.displayName,
              email: '', // Email gizli
              avatar: profile.avatar || '',
              joinDate: profile.createdAt || new Date().toISOString(),
              bio: 'Film tutkunu, sinema sevdalısı. Her gün yeni filmler keşfetmeyi seviyorum.',
              stats: {
                watchedMovies: 0,
                watchlistMovies: 0,
                favoriteGenres: [],
                totalWatchTime: 0
              },
              recentMovies: []
            };
            
            setProfileData(formattedProfile);
            
            // Backend'den gelen takip bilgilerini kullan
            setFollowerCount(profile.followersCount);
            setFollowingCount(profile.followingCount);
            
            // Giriş yapmış kullanıcının bu profili takip edip etmediğini kontrol et
            if (currentUser?.uid) {
              try {
                const followStatus = await movieService.getFollowStatus(profile.id);
                setIsFollowing(followStatus.isFollowing);
              } catch (error) {
                console.error('Takip durumu kontrol edilemedi:', error);
                setIsFollowing(false);
              }
            }
            
          } catch (error: any) {
            console.error('Profil yükleme hatası:', error);
            setError(error.message || 'Profil yüklenirken hata oluştu');
            setLoading(false);
            return;
          }
        }

        // Önerilen film çek
        const moviesResponse = await movieService.getPopularMovies(1);
        if (moviesResponse.results && moviesResponse.results.length > 0) {
          const randomIndex = Math.floor(Math.random() * moviesResponse.results.length);
          setRecommendedMovie(moviesResponse.results[randomIndex]);
        }

        // Kendi profil ise kaydettiği filmi yükle
        if (isOwnProfile && currentUser?.uid) {
          const savedMovie = localStorage.getItem(`selectedMovie_${currentUser.uid}`);
          if (savedMovie) {
            try {
              const parsedMovie = JSON.parse(savedMovie);
              setUserSelectedMovie(parsedMovie);
            } catch (error) {
              console.error('Kaydedilen film parse edilemedi:', error);
            }
          }
          
          // Kaydedilen başlığı yükle
          const savedTitle = localStorage.getItem(`customTitle_${currentUser.uid}`);
          if (savedTitle) {
            setCustomTitle(savedTitle);
          }
          
          // Öneri bölümü görünürlüğünü yükle
          const savedShowRecommendation = localStorage.getItem(`showRecommendation_${currentUser.uid}`);
          if (savedShowRecommendation !== null) {
            setShowRecommendationSection(JSON.parse(savedShowRecommendation));
          }
          
          // Kaydedilen bio'yu yükle
          const savedBio = localStorage.getItem(`bio_${currentUser.uid}`);
          if (savedBio) {
            setBio(savedBio);
          }
          
          // Bio görünürlüğünü yükle
          const savedShowBio = localStorage.getItem(`showBio_${currentUser.uid}`);
          if (savedShowBio !== null) {
            setShowBio(JSON.parse(savedShowBio));
          }
        }
      } catch (error) {
        console.error('Profil verileri alınırken hata:', error);
        setError(error instanceof Error ? error.message : 'Profil yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    const fetchFilmOnerileri = async () => {
      if (!profileData?.id) return;
      try {
        const response = await movieService.getUserFilmOnerileri(profileData.id);
        setFilmOnerileri(response || []);
      } catch (error) {
        console.error('Film önerileri alınamadı:', error);
        setFilmOnerileri([]);
      }
    };

    fetchProfileData();
    fetchFilmOnerileri();
  }, [username, isOwnProfile, currentUser, avatar]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-primary text-primary">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <BackButton />
          <div className="text-center py-16">
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-xl font-bold text-primary mb-2">
                {error || 'Profil Bulunamadı'}
              </h2>
              <p className="text-secondary">
                {username ? `"${username}" kullanıcısının profili bulunamadı.` : 'Geçersiz kullanıcı adı'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-primary">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <BackButton />
        
        {/* Ana İçerik */}
        <div className="mt-8">
          
          {/* Tek Sütun - Profil Alanı */}
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Profil Başlığı */}
            <div className="p-6">
              <div className="flex items-start space-x-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {(() => {
                    console.log('Avatar Debug:', { isOwnProfile, avatar, profileDataAvatar: profileData?.avatar });
                    
                    if (isOwnProfile && avatar) {
                      // Kendi profilimiz için avatar ID'sini kullan
                      if (avatar.startsWith('color_')) {
                        const colorAvatar = COLOR_AVATARS.find(a => a.id === avatar);
                        return (
                          <div 
                            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-2"
                            style={{ 
                              backgroundColor: colorAvatar?.value || '#60A5FA',
                              borderColor: 'var(--primary)'
                            }}
                          >
                            {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        );
                      } else if (avatar.startsWith('animal_')) {
                        const animalAvatar = ANIMAL_AVATARS.find(a => a.id === avatar);
                        return (
                          <img 
                            src={animalAvatar?.src || '/avatars/bear.png'}
                            alt={animalAvatar?.name || 'Avatar'}
                            className="w-24 h-24 rounded-full object-cover border-2"
                            style={{ borderColor: 'var(--primary)' }}
                            onError={(e) => console.error('Avatar yükleme hatası:', e)}
                          />
                        );
                      }
                    } else if (!isOwnProfile && profileData?.avatar) {
                      // Başka kullanıcının profili için avatar
                      return (
                        <img 
                          src={profileData.avatar}
                          alt={profileData.displayName}
                          className="w-24 h-24 rounded-full object-cover border-2"
                          style={{ borderColor: 'var(--primary)' }}
                          onError={(e) => console.error('Profil avatar yükleme hatası:', e)}
                        />
                      );
                    }
                    
                    // Fallback: Baş harf göster
                    return (
                      <div 
                        className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-2"
                        style={{ 
                          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                          borderColor: 'var(--primary)'
                        }}
                      >
                        {isOwnProfile ? (currentUser?.displayName?.charAt(0).toUpperCase() || 'U') : (profileData?.displayName?.charAt(0).toUpperCase() || 'U')}
                      </div>
                    );
                  })()}
                </div>
                
                {/* Ana İçerik - Kullanıcı Bilgileri ve Önerim */}
                <div className={`flex-1 grid ${showRecommendationSection ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                  
                  {/* Sol: Kullanıcı Bilgileri */}
                  <div className={showRecommendationSection ? 'md:col-span-2' : 'md:col-span-1'}>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-primary">
                        {isOwnProfile ? (currentUser?.displayName || 'Kullanıcı') : profileData.displayName}
                      </h1>
                      {/* Film yoksa ve bölüm gizliyse kalem butonunu göster */}
                      {isOwnProfile && !showRecommendationSection && !userSelectedMovie && (
                        <button
                          onClick={() => {
                            setIsSelectingMovie(true);
                            setShowRecommendationSection(true);
                          }}
                          className="ml-auto btn-secondary px-3 py-1 rounded-lg text-sm transition-colors"
                          title="Film önerisi ekle"
                        >
                          ✏️ Film Ekle 
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-secondary text-lg">
                        @{isOwnProfile ? (currentUser?.displayName || currentUser?.email?.split('@')[0] || username) : profileData.username}
                      </p>
                      {isOwnProfile && (
                        <span className="btn-primary px-2 py-1 rounded-full text-xs font-medium ml-2 mt-1">
                          Sizin Profiliniz
                        </span>
                      )}
                    </div>
                    
                    {/* Takipçi/Takip Edilen Sayıları ve Takip Butonu */}
                <div className="flex items-center gap-4 mb-4">
                  {/* Takipçi/Takip Sayıları */}
                  <div className="flex gap-4 text-sm">
                    <div className="text-center">
                      <span className="font-bold text-primary">{followerCount}</span>
                      <span className="text-secondary ml-1">Takipçi</span>
                    </div>
                    <div className="text-center">
                      <span className="font-bold text-primary">{followingCount}</span>
                      <span className="text-secondary ml-1">Takip</span>
                    </div>
                  </div>
                  {/* Kendi profili için yenileme butonu */}
                  {isOwnProfile && (
                    <button
                      onClick={refreshFollowStats}
                      className="text-xs px-2 py-1 bg-secondary hover:bg-tertiary rounded transition-colors"
                      title="Takip bilgilerini yenile"
                    >
                      🔄
                    </button>
                  )}
                  {/* Takip Butonu - Sadece başka kullanıcıların profilinde göster */}
                  {!isOwnProfile && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleFollowToggle}
                        disabled={isFollowLoading}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isFollowing 
                            ? 'border border-default text-primary hover:bg-secondary' 
                            : 'hover:opacity-80'
                        } ${isFollowLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{
                          backgroundColor: !isFollowing ? 'var(--accent)' : undefined,
                          color: !isFollowing ? 'var(--background-primary)' : undefined,
                        }}
                      >
                        {isFollowLoading ? '...' : isFollowing ? 'Takipten Çık' : 'Takip Et'}
                      </button>
                      <button
                        onClick={() => setShowFirlatModal(true)}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary hover:bg-tertiary text-primary transition-all duration-200"
                        title={`${profileData?.displayName} adlı kullanıcıya film fırlat`}
                      >
                        🚀 Fırlat
                      </button>
                    </div>
                  )}
                </div>
                    
                    {/* Düzenlenebilir Hakkımda Kısmı */}
                    {showBio && (
                      <div className="space-y-2 relative">
                        {isOwnProfile && (
                          <div className="absolute top-0 right-0 flex space-x-1">
                            <button
                              onClick={() => setIsEditingBio(true)}
                              className="text-xs p-1 rounded hover:bg-secondary transition-colors"
                              style={{ color: 'var(--primary)' }}
                              title="Bio'yu düzenle"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={handleRemoveBio}
                              className="text-xs p-1 rounded hover:bg-secondary transition-colors"
                              style={{ color: 'var(--error)' }}
                              title="Bio'yu kaldır"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                        
                        {isOwnProfile ? (
                          <div className="pr-12">
                            {isEditingBio ? (
                              <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                onBlur={() => handleSaveBio(bio)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSaveBio(bio);
                                  } else if (e.key === 'Escape') {
                                    setIsEditingBio(false);
                                  }
                                }}
                                placeholder="Hakkımda... (Enter: Kaydet, Shift+Enter: Yeni satır, Esc: İptal)"
                                className="w-full bg-transparent text-secondary resize-none border-none outline-none placeholder-muted ultra-scrollbar"
                                rows={3}
                                style={{ 
                                  minHeight: '3rem',
                                  maxHeight: '8rem',
                                  overflowY: 'auto'
                                }}
                                autoFocus
                              />
                            ) : (
                              <p 
                                className="text-secondary cursor-pointer hover:bg-secondary/10 p-1 rounded transition-colors"
                                onClick={() => setIsEditingBio(true)}
                                title="Düzenlemek için tıklayın"
                              >
                                {bio || 'Hakkımda bilgi ekleyin...'}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-secondary">
                            {profileData.bio || 'Bu kullanıcı henüz bir bio eklememis.'}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Bio gizliyse geri getirme butonu */}
                    {isOwnProfile && !showBio && (
                      <button
                        onClick={() => setShowBio(true)}
                        className="text-muted hover:text-primary text-sm transition-colors"
                        title="Bio ekle"
                      >
                        + Hakkımda ekle
                      </button>
                    )}
                    
                    {!isOwnProfile && (
                      <p className="text-muted text-sm mt-2">
                        Katılım tarihi: {new Date(profileData.joinDate).toLocaleDateString('tr-TR')}
                      </p>
                    )}
                  </div>
                  
                  {/* Sağ: Önerim Bölümü - Sadece görünür durumda ise göster */}
                  {showRecommendationSection && (
                    <div className="md:col-span-1">
                      {/* Önerim Başlığı */}
                      <div className="flex items-center justify-between mb-3">
                      {isOwnProfile && isEditingTitle ? (
                        <input
                          type="text"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          onBlur={() => handleSaveTitle(customTitle)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveTitle(customTitle);
                            } else if (e.key === 'Escape') {
                              setIsEditingTitle(false);
                            }
                          }}
                          className="text-lg font-semibold bg-transparent border-b border-default text-primary focus:outline-none"
                          autoFocus
                          maxLength={20}
                        />
                      ) : (
                        <h3 
                          className={`text-lg font-semibold text-primary ${isOwnProfile ? 'cursor-pointer transition-colors' : ''}`}
                          onClick={() => isOwnProfile && setIsEditingTitle(true)}
                          title={isOwnProfile ? 'Başlığı düzenlemek için tıklayın' : ''}
                          style={isOwnProfile ? { color: 'var(--primary)' } : {}}
                        >
                          {isOwnProfile ? customTitle : 'Önerilen Film'}
                        </h3>
                      )}
                      {isOwnProfile && (
                        <button
                          onClick={() => {
                            setIsSelectingMovie(true);
                            setShowRecommendationSection(true);
                          }}
                          className="text-sm"
                          style={{ color: 'var(--primary)' }}
                          title="Film Seç"
                        >
                          ✏️
                        </button>
                      )}
                    </div>

                    {/* Film Seçme Modalı */}
                    {isSelectingMovie && (
                      <div className="mb-4 p-3 bg-secondary rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-primary">Film/Dizi Seç</h4>
                          <button
                            onClick={() => {
                              setIsSelectingMovie(false);
                              setSearchQuery('');
                              setSearchResults([]);
                            }}
                            className="text-muted hover:text-primary"
                          >
                            ✕
                          </button>
                        </div>
                        
                        <input
                          type="text"
                          placeholder="Film veya dizi ara..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            handleSearchMovie(e.target.value);
                          }}
                          className="input-field w-full text-sm"
                          autoFocus
                        />
                        
                        {searchResults.length > 0 && (
                          <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                            {searchResults.slice(0, 5).map((movie) => (
                              <div
                                key={movie.id}
                                onClick={() => handleSelectMovie(movie)}
                                className="flex items-center space-x-2 p-2 bg-tertiary rounded cursor-pointer hover:opacity-80"
                              >
                                {movie.posterPath && (
                                  <img
                                    src={`https://image.tmdb.org/t/p/w92${movie.posterPath}`}
                                    alt={movie.title}
                                    className="w-6 h-9 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-primary text-xs font-medium truncate">
                                    {movie.title}
                                  </p>
                                  <p className="text-secondary text-xs">
                                    {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : ''}
                                    {movie.media_type === 'tv' ? ' (Dizi)' : ' (Film)'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Film Posteri */}
                    {userSelectedMovie ? (
                      <div className="relative">
                        <div className="w-32 h-48 relative">
                          {userSelectedMovie.posterPath ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w300${userSelectedMovie.posterPath}`}
                              alt={userSelectedMovie.title}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full bg-tertiary rounded-lg flex items-center justify-center">
                              <span className="text-secondary text-xs text-center p-1">
                                {userSelectedMovie.title}
                              </span>
                            </div>
                          )}
                        </div>
                        {isOwnProfile && (
                          <button
                            onClick={handleRemoveMovie}
                            className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full text-xs"
                            title="Filmi Kaldır"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ) : isOwnProfile ? (
                      <div className="text-center text-muted py-4 border border-dashed border-default rounded-lg">
                        <p className="text-xs">
                          ✏️ Film ekleyin
                        </p>
                      </div>
                  ) : recommendedMovie ? (
                    <div className="w-32 h-48 relative">
                      {recommendedMovie.posterPath ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w300${recommendedMovie.posterPath}`}
                          alt={recommendedMovie.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-tertiary rounded-lg flex items-center justify-center">
                          <span className="text-secondary text-xs text-center p-1">
                            {recommendedMovie.title}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : null}
                  {showFirlatModal && (
                    <FilmFirlatModal
                      kimeGonderiliyor={profileData!}
                      onClose={() => setShowFirlatModal(false)}
                    />
                  )}
                </div>
                )}
                </div>
              </div>
            </div>

            {/* Avatar ve film önerileri bölümü */}
            {!isOwnProfile && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Bu kullanıcıya gelen film önerileri</h2>
                {filmOnerileri.length === 0 ? (
                  <p className="text-lg text-secondary">Bu kullanıcıya henüz film önerisi gelmemiş.</p>
                ) : (
                  <ul className="space-y-4">
                    {filmOnerileri.map(oneri => (
                      <li key={oneri.id} className="p-4 bg-background-tertiary rounded shadow">
                        <div className="flex items-center gap-4">
                          {oneri.filmPosterUrl ? (
                            <img src={oneri.filmPosterUrl} alt={oneri.filmAdi} className="w-16 h-24 object-cover rounded" />
                          ) : (
                            <div className="w-16 h-24 bg-gray-300 flex items-center justify-center rounded text-xs">Poster Yok</div>
                          )}
                          <div>
                            <div className="font-bold text-lg">{oneri.filmAdi}</div>
                            <div className="text-sm text-secondary">Not: {oneri.notMetni || 'Yorum yok'}</div>
                            <div className="text-xs text-gray-500">Durum: {oneri.durum}</div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* İstatistikler */}
            <div className="py-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">İstatistikler</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{profileData.stats.watchedMovies}</div>
                  <div className="text-secondary">İzlenen Film</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{profileData.stats.watchlistMovies}</div>
                  <div className="text-secondary">İzleme Listesi</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-2xl font-bold" style={{ color: 'var(--success)' }}>{profileData.stats.favoriteGenres.length}</div>
                  <div className="text-secondary">Favori Tür</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-2xl font-bold" style={{ color: 'var(--warning)' }}>{Math.round(profileData.stats.totalWatchTime / 60)}</div>
                  <div className="text-secondary">Saat İzleme</div>
                </div>
              </div>
            </div>

            {/* İçerik Linkleri */}
            <div className="py-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">
                {isOwnProfile ? 'Film Listeleri' : `${profileData.displayName}'in Listeleri`}
              </h2>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-secondary hover:bg-tertiary rounded-lg transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-primary">{isOwnProfile ? 'İzlediklerim' : 'İzlediği Filmler'}</span>
                    <span className="text-secondary">→</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-secondary hover:bg-tertiary rounded-lg transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-primary">{isOwnProfile ? 'İzleme Listem' : 'İzleme Listesi'}</span>
                    <span className="text-secondary">→</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-secondary hover:bg-tertiary rounded-lg transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-primary">{isOwnProfile ? 'Favorilerim' : 'Favori Türleri'}</span>
                    <span className="text-secondary">→</span>
                  </div>
                </button>
                {isOwnProfile && (
                  <button className="w-full text-left p-3 btn-primary rounded-lg transition-colors">
                    <div className="flex items-center justify-between">
                      <span>Profili Düzenle</span>
                      <span>✏️</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
