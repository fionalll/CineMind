import axios from 'axios';
import { auth } from '../firebase/config';
import type { RecommendationResponse, ApiError, MovieResponse, Genre, SearchResponse } from '../types';

const API_BASE_URL = 'http://localhost:5002/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
});

// Auth token'ı almak için yardımcı fonksiyon
const getAuthToken = async (): Promise<string | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Kullanıcı girişi yapılmamış');
  }
  return await currentUser.getIdToken();
};

// Auth header'ı ile request interceptor
api.interceptors.request.use(async (config) => {
  // Eğer auth gerektiren endpoint ise token ekle
  if (config.url?.includes('/users/') && config.method === 'post') {
    try {
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Auth token alınamadı:', error);
    }
  }
  return config;
});

export const movieService = {
  async getRecommendations(message: string, excludedTitles?: string[]): Promise<RecommendationResponse> {
    try {
      const response = await api.post<RecommendationResponse>('/get-recommendations', {
        message,
        excludedTitles: excludedTitles || []
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data as ApiError;
        throw new Error(errorData?.error || 'Sunucu hatası oluştu');
      }
      throw new Error('Beklenmeyen bir hata oluştu');
    }
  },
  async getMovieDetails(movieId: number): Promise<any> {
    try {
      // Axios 'api' instance'ını kullanarak istek atıyoruz
      const response = await api.get(`/movie/${movieId}`, {
        params: {
          append_to_response: 'credits,videos'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Film detayları alınırken hata oluştu (ID: ${movieId})`, error);
      throw error;
    }
  },

  async getGenres(): Promise<{ genres: Genre[] }> {
    try {
      const response = await api.get('/genres');
      return response.data;
    } catch (error) {
      throw new Error('Film türleri alınamadı');
    }
  },

  async getPopularMovies(page: number = 1): Promise<MovieResponse> {
    try {
      const response = await api.get('/movies/popular', {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw new Error('Popüler filmler alınamadı');
    }
  },

  async getTopRatedMovies(page: number = 1): Promise<MovieResponse> {
    try {
      const response = await api.get('/movies/top-rated', {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw new Error('En yüksek puanlı filmler alınamadı');
    }
  },

  async getUpcomingMovies(page: number = 1): Promise<MovieResponse> {
    try {
      const response = await api.get('/movies/upcoming', {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw new Error('Yakında vizyona girecek filmler alınamadı');
    }
  },

  async getMoviesByGenre(genreId: number, page: number = 1): Promise<MovieResponse> {
    try {
      const response = await api.get(`/movies/by-genre/${genreId}`, {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw new Error('Türe göre filmler alınamadı');
    }
  },

  async searchMulti(query: string, page: number = 1): Promise<SearchResponse> {
    try {
      const response = await api.get('/search', {
        params: { query, page }
      });
      return response.data;
    } catch (error) {
      throw new Error('Arama işlemi başarısız oldu');
    }
  },

  async getPersonCredits(personId: number): Promise<any> {
    try {
      const response = await api.get(`/person/${personId}`);
      return response.data;
    } catch (error) {
      throw new Error('Oyuncu filmografisi alınamadı');
    }
  },

  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Sunucu bağlantısı kurulamadı');
    }
  },

  async testTMDB(): Promise<any> {
    try {
      const response = await api.get('/test-tmdb');
      return response.data;
    } catch (error) {
      throw new Error('TMDB bağlantısı test edilemedi');
    }
  },

  // TV Show Functions
  async getPopularTvShows(page: number = 1): Promise<MovieResponse> {
    try {
      const response = await api.get('/tv/popular', {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw new Error('Popüler TV dizileri alınamadı');
    }
  },

  async getTopRatedTvShows(page: number = 1): Promise<MovieResponse> {
    try {
      const response = await api.get('/tv/top-rated', {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw new Error('En yüksek puanlı TV dizileri alınamadı');
    }
  },

  async getTvGenres(): Promise<{ genres: Genre[] }> {
    try {
      const response = await api.get('/tv/genres');
      return response.data;
    } catch (error) {
      throw new Error('TV dizi türleri alınamadı');
    }
  },

  async getTvShowsByGenre(genreId: number, page: number = 1): Promise<MovieResponse> {
    try {
      const response = await api.get(`/tv/by-genre/${genreId}`, {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw new Error('Türe göre TV dizileri alınamadı');
    }
  },

  async getAiringTodayTvShows(page: number = 1): Promise<MovieResponse> {
    try {
      const response = await api.get('/tv/airing-today', {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw new Error('Bugün yayınlanan TV dizileri alınamadı');
    }
  },

  async getOnTheAirTvShows(page: number = 1): Promise<MovieResponse> {
    try {
      const response = await api.get('/tv/on-the-air', {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw new Error('Yayında olan TV dizileri alınamadı');
    }
  },

  // =================== WATCHLIST API FUNCTIONS ===================
  
  async getUserWatchlist(userId: string): Promise<any[]> {
    try {
      const response = await api.get(`/user/${userId}/watchlist`);
      return response.data.watchlist;
    } catch (error) {
      throw new Error('İzleme listesi alınamadı');
    }
  },

  async addToWatchlist(userId: string, movie: any): Promise<void> {
    try {
      await api.post(`/user/${userId}/watchlist`, movie);
    } catch (error) {
      throw new Error('Film izleme listesine eklenemedi');
    }
  },

  async removeFromWatchlist(userId: string, movieId: number): Promise<void> {
    try {
      await api.delete(`/user/${userId}/watchlist/${movieId}`);
    } catch (error) {
      throw new Error('Film izleme listesinden çıkarılamadı');
    }
  },

  // =================== FOLLOW SYSTEM API FUNCTIONS ===================
  
  async followUser(profileUserId: string): Promise<{ success: boolean; action: string; isFollowing: boolean; message: string }> {
    try {
      const response = await api.post(`/users/${profileUserId}/follow`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        throw new Error(errorData?.error || 'Takip işlemi başarısız');
      }
      throw new Error('Beklenmeyen bir hata oluştu');
    }
  },

  async unfollowUser(profileUserId: string): Promise<{ success: boolean; action: string; isFollowing: boolean; message: string }> {
    try {
      // Aynı endpoint kullanıyoruz, toggle mantığı ile çalışıyor
      const response = await api.post(`/users/${profileUserId}/follow`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        throw new Error(errorData?.error || 'Takipten çıkma işlemi başarısız');
      }
      throw new Error('Beklenmeyen bir hata oluştu');
    }
  },

  async toggleFollowUser(profileUserId: string): Promise<{ success: boolean; action: string; isFollowing: boolean; message: string }> {
    try {
      const response = await api.post(`/users/${profileUserId}/follow`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        throw new Error(errorData?.error || 'Takip işlemi başarısız');
      }
      throw new Error('Beklenmeyen bir hata oluştu');
    }
  },

  // Kullanıcının takip istatistiklerini getir
  async getUserFollowStats(userId: string): Promise<{ followersCount: number; followingCount: number; followers: string[]; following: string[] }> {
    try {
      const response = await api.get(`/users/${userId}/follow-stats`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        throw new Error(errorData?.error || 'Takip bilgileri alınamadı');
      }
      throw new Error('Beklenmeyen bir hata oluştu');
    }
  },

  // Giriş yapmış kullanıcının bir profili takip edip etmediğini kontrol et
  async getFollowStatus(profileUserId: string): Promise<{ isFollowing: boolean }> {
    try {
      const response = await api.get(`/users/${profileUserId}/follow-status`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        throw new Error(errorData?.error || 'Takip durumu kontrol edilemedi');
      }
      throw new Error('Beklenmeyen bir hata oluştu');
    }
  },

  // Username ile kullanıcı profili getir
  async getUserProfileByUsername(username: string): Promise<{
    success: boolean;
    profile: {
      id: string;
      username: string;
      displayName: string;
      avatar?: string;
      following: string[];
      followers: string[];
      followersCount: number;
      followingCount: number;
      createdAt: any;
      updatedAt: any;
    }
  }> {
    try {
      const response = await api.get(`/profile/by-username/${username}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        throw new Error(errorData?.error || 'Kullanıcı profili bulunamadı');
      }
      throw new Error('Beklenmeyen bir hata oluştu');
    }
  },

  // Günün filmini getir
  async getMovieOfTheDay(): Promise<{
    success: boolean;
    movieOfTheDay: {
      id: number;
      title: string;
      overview: string;
      backdrop_path: string;
      poster_path: string;
      release_date: string;
      vote_average: number;
      genres: any[];
      runtime: number;
      date: string;
    }
  }> {
    try {
      const response = await api.get('/movie-of-the-day');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        throw new Error(errorData?.error || 'Günün filmi alınamadı');
      }
      throw new Error('Beklenmeyen bir hata oluştu');
    }
  },

  // Rastgele bölüm getir
  async getRandomEpisode(seriesName: string): Promise<{
    success: boolean;
    randomEpisode: {
      series: {
        id: number;
        name: string;
        original_name: string;
        poster_path: string;
        backdrop_path: string;
        first_air_date: string;
        overview: string;
      };
      season: {
        season_number: number;
        name: string;
        episode_count: number;
      };
      episode: {
        episode_number: number;
        name: string;
        overview: string;
        still_path: string;
        air_date: string;
        vote_average: number;
        runtime: number;
      };
    }
  }> {
    try {
      const response = await api.post('/random-episode', { seriesName });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        throw new Error(errorData?.error || 'Rastgele bölüm alınamadı');
      }
      throw new Error('Beklenmeyen bir hata oluştu');
    }
  }
};
