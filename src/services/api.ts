import axios from 'axios';
import type { RecommendationResponse, ApiError, MovieResponse, Genre, SearchResponse } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
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
  }
};
