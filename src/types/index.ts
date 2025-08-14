export interface Movie {
  id: number;
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
  backdropPath: string | null;
  reason?: string; // Gemini'den gelen öneri sebebi
  watchedAt?: Date; // İzlenme tarihi
  media_type?: 'movie' | 'tv' | 'person';
}

export interface Person {
  id: number;
  name: string;
  profilePath: string | null;
  knownFor: Array<{
    id: number;
    title: string;
    media_type: string;
    releaseDate: string;
  }>;
  knownForDepartment: string;
  popularity: number;
  media_type: 'person';
}

export interface SearchResult {
  id: number;
  media_type: 'movie' | 'tv' | 'person';
  popularity: number;
  // Movie/TV properties
  title?: string;
  originalTitle?: string;
  overview?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  releaseDate?: string;
  voteAverage?: number;
  voteCount?: number;
  // Person properties
  name?: string;
  profilePath?: string | null;
  knownFor?: Array<{
    id: number;
    title: string;
    media_type: string;
    releaseDate: string;
  }>;
  knownForDepartment?: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface MovieResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export interface SearchResponse {
  page: number;
  results: SearchResult[];
  total_pages: number;
  total_results: number;
  query: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface RecommendationResponse {
  message: string;
  movies: Movie[];
  originalQuery: string;
}

export interface ApiError {
  error: string;
  details?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  joinDate: string;
  bio?: string;
  stats: {
    watchedMovies: number;
    watchlistMovies: number;
    favoriteGenres: string[];
    totalWatchTime: number;
  };
  recentMovies: Movie[];
}
