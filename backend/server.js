import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Helper function to search movies on TMDB
async function searchMovieOnTMDB(movieRecommendation) {
  const { title, year, reason } = movieRecommendation;
  try {
    console.log(`🔍 Searching for movie: ${title} (${year})`);
    
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: title,
        year: year, // Yıl parametresini ekle
        language: 'tr-TR'
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const movie = response.data.results[0];
      return {
        id: movie.id,
        title: movie.title,
        originalTitle: movie.original_title,
        overview: movie.overview,
        posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        releaseDate: movie.release_date,
        voteAverage: movie.vote_average,
        voteCount: movie.vote_count,
        backdropPath: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
        reason: reason // Gemini'nin öneri sebebini ekle
      };
    }
    return null;
  } catch (error) {
    console.error(`🚨 Movie search API isteği sırasında detaylı hata (${title} - ${year}):`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code,
      searchQuery: { title, year }
    });
    return null;
  }
}

// Main recommendation endpoint
app.post('/api/get-recommendations', async (req, res) => {
  try {
    // Güvenli destructuring ile default değerler ata
    const { message, excludedTitles = [] } = req.body;

    // İstekte mesaj yoksa hata döndür
    if (!message) {
      return res.status(400).json({ error: 'Mesaj gerekli' });
    }

    // excludedTitles'ın güvenli kontrolü ve prompt oluşturma
    const excludedMoviesText = (excludedTitles && Array.isArray(excludedTitles) && excludedTitles.length > 0) 
      ? ` Lütfen şu filmleri önerme: [${excludedTitles.join(', ')}]` 
      : '';

    // Create prompt for Gemini
    const prompt = `Sen, dünya sineması konusunda uzman bir film küratörüsün. Kullanıcının verdiği isteğe göre tematik, yönetmen stili veya anlatı yapısı olarak benzer, ancak popüler, bariz olmayan veya yeni çıkan filmler önereceksin. Cevabını, içerisinde bir 'summaryText' ve 'recommendations' listesi olan tek bir JSON nesnesi olarak ver. 'recommendations' listesindeki her film bir nesne olmalı ve 'title' (filmin orijinal adı), 'year' (yapım yılı) ve 'reason' (bu filmi neden önerdiğine dair 1-2 cümlelik kısa bir açıklama) alanlarını içermelidir. Maksimum 5 film öner.

    Kullanıcı isteği: ${message}${excludedMoviesText}
    
    Cevabını sadece ve sadece aşağıdaki formatta bir JSON nesnesi olarak döndür:
    {
      "summaryText": "Kullanıcının isteğine göre oluşturduğun kısa bir giriş cümlesi.",
      "recommendations": [
        {
          "title": "Film Adı 1",
          "year": YYYY,
          "reason": "Bu filmi önerme sebebin..."
        },
        {
          "title": "Film Adı 2",
          "year": YYYY,
          "reason": "Bu filmi önerme sebebin..."
        }
      ]
    }`;

    // Debug log - istek bilgilerini logla
    console.log('🎬 Film önerisi isteği alındı:');
    console.log('- Mesaj:', message);
    console.log('- Hariç tutulacak filmler:', excludedTitles);
    console.log('- Prompt uzunluğu:', prompt.length);

    // Get recommendations from Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('🤖 Gemini yanıtı alındı, uzunluk:', text.length);

    // Parse the JSON response
    let parsedResponse;
    try {
      // Clean the response text and parse JSON
      const cleanText = text.replace(/```json|```/g, '').trim();
      parsedResponse = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('❌ Gemini yanıtı parse edilemedi:', parseError);
      console.error('Ham yanıt:', text);
      return res.status(500).json({ 
        error: 'AI yanıtı işlenirken hata oluştu',
        aiResponse: text
      });
    }

    if (!parsedResponse.recommendations || !Array.isArray(parsedResponse.recommendations)) {
      console.error('❌ Gemini geçersiz format döndürdü:', parsedResponse);
      return res.status(500).json({ 
        error: 'AI geçersiz format döndürdü',
        aiResponse: text
      });
    }

    console.log('✅ Gemini yanıtı parse edildi, film sayısı:', parsedResponse.recommendations.length);

    // Search each movie on TMDB
    const moviePromises = parsedResponse.recommendations.map(movieRecommendation => 
      searchMovieOnTMDB(movieRecommendation)
    );
    const movieResults = await Promise.all(moviePromises);

    // Filter out null results
    const validMovies = movieResults.filter(movie => movie !== null);

    console.log('🎭 TMDB araması tamamlandı, bulunan film sayısı:', validMovies.length);

    res.json({
      message: parsedResponse.summaryText || `İşte "${message}" isteğinize göre seçtiğim özel filmler:`,
      movies: validMovies,
      originalQuery: message
    });

  } catch (error) {
    // Kapsamlı hata loglama
    console.error('--- RECOMMENDATION ENDPOINT ERROR ---');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Request Body:', req.body);
    
    // Eğer Axios hatası ise, daha detaylı bilgi
    if (error.response) {
      console.error('HTTP Response Status:', error.response.status);
      console.error('HTTP Response Data:', error.response.data);
    }
    
    // Eğer Gemini API hatası ise
    if (error.message && error.message.includes('Gemini')) {
      console.error('Gemini API Error Details:', error);
    }
    
    console.error('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('--- END OF ERROR REPORT ---');
    
    res.status(500).json({ 
      error: 'Sunucu hatası oluştu',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CineMind Backend is running' });
});

// Test endpoint for TMDB connection
app.get('/api/test-tmdb', async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR'
      }
    });
    res.json({ status: 'TMDB connection successful', data: response.data.results.slice(0, 3) });
  } catch (error) {
    res.status(500).json({ status: 'TMDB connection failed', error: error.message });
  }
});

// Test endpoint for Gemini models
app.get('/api/test-gemini', async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello, test message");
    const response = await result.response;
    const text = response.text();
    res.json({ status: 'Gemini connection successful', response: text });
  } catch (error) {
    res.status(500).json({ status: 'Gemini connection failed', error: error.message });
  }
});

// Get movie genres
app.get('/api/genres', async (req, res) => {
  try {
    console.log('🎭 Fetching genres from TMDB...');
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('🚨 Genres API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code
    });
    res.status(500).json({ status: 'Failed to fetch genres', error: error.message });
  }
});

// Get popular movies
app.get('/api/movies/popular', async (req, res) => {
  try {
    console.log('🎬 Fetching popular movies from TMDB...');
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        page: req.query.page || 1
      }
    });
    
    const movies = response.data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      backdropPath: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
      releaseDate: movie.release_date,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count
    }));

    res.json({
      ...response.data,
      results: movies
    });
  } catch (error) {
    console.error('🚨 Popular movies API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code
    });
    res.status(500).json({ status: 'Failed to fetch popular movies', error: error.message });
  }
});

// Get top rated movies
app.get('/api/movies/top-rated', async (req, res) => {
  try {
    console.log('⭐ Fetching top rated movies from TMDB...');
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/movie/top_rated`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        page: req.query.page || 1
      }
    });
    
    const movies = response.data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      backdropPath: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
      releaseDate: movie.release_date,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count
    }));

    res.json({
      ...response.data,
      results: movies
    });
  } catch (error) {
    console.error('🚨 Top rated movies API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code
    });
    res.status(500).json({ status: 'Failed to fetch top rated movies', error: error.message });
  }
});

// Get upcoming movies
app.get('/api/movies/upcoming', async (req, res) => {
  try {
    console.log('🎯 Fetching upcoming movies from TMDB...');
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/movie/upcoming`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        page: req.query.page || 1
      }
    });
    
    const movies = response.data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      backdropPath: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
      releaseDate: movie.release_date,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count
    }));

    res.json({
      ...response.data,
      results: movies
    });
  } catch (error) {
    console.error('🚨 Upcoming movies API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code
    });
    res.status(500).json({ status: 'Failed to fetch upcoming movies', error: error.message });
  }
});

// Discover movies by genre
app.get('/api/movies/by-genre/:genreId', async (req, res) => {
  try {
    const { genreId } = req.params;
    console.log(`🎨 Fetching movies for genre ${genreId} from TMDB...`);
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        with_genres: genreId,
        page: req.query.page || 1,
        sort_by: 'popularity.desc'
      }
    });
    
    const movies = response.data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      backdropPath: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
      releaseDate: movie.release_date,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count
    }));

    res.json({
      ...response.data,
      results: movies
    });
  } catch (error) {
    console.error('🚨 Movies by genre API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code,
      genreId: req.params.genreId
    });
    res.status(500).json({ status: 'Failed to fetch movies by genre', error: error.message });
  }
});

// =================== TV SHOWS ENDPOINTS ===================

// Get popular TV shows
app.get('/api/tv/popular', async (req, res) => {
  try {
    console.log('📺 Fetching popular TV shows from TMDB...');
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/tv/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        page: req.query.page || 1
      }
    });
    
    const tvShows = response.data.results.map(show => ({
      id: show.id,
      title: show.name, // TV shows use 'name' instead of 'title'
      originalTitle: show.original_name,
      overview: show.overview,
      posterPath: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
      backdropPath: show.backdrop_path ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}` : null,
      releaseDate: show.first_air_date, // TV shows use 'first_air_date'
      voteAverage: show.vote_average,
      voteCount: show.vote_count,
      media_type: 'tv'
    }));

    res.json({
      ...response.data,
      results: tvShows
    });
  } catch (error) {
    console.error('🚨 Popular TV shows API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code
    });
    res.status(500).json({ status: 'Failed to fetch popular TV shows', error: error.message });
  }
});

// Get top rated TV shows
app.get('/api/tv/top-rated', async (req, res) => {
  try {
    console.log('⭐ Fetching top rated TV shows from TMDB...');
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/tv/top_rated`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        page: req.query.page || 1
      }
    });
    
    const tvShows = response.data.results.map(show => ({
      id: show.id,
      title: show.name,
      originalTitle: show.original_name,
      overview: show.overview,
      posterPath: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
      backdropPath: show.backdrop_path ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}` : null,
      releaseDate: show.first_air_date,
      voteAverage: show.vote_average,
      voteCount: show.vote_count,
      media_type: 'tv'
    }));

    res.json({
      ...response.data,
      results: tvShows
    });
  } catch (error) {
    console.error('🚨 Top rated TV shows API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code
    });
    res.status(500).json({ status: 'Failed to fetch top rated TV shows', error: error.message });
  }
});

// Get airing today TV shows
app.get('/api/tv/airing-today', async (req, res) => {
  try {
    console.log('📺 Fetching airing today TV shows from TMDB...');
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/tv/airing_today`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        page: req.query.page || 1
      }
    });
    
    const tvShows = response.data.results.map(show => ({
      id: show.id,
      title: show.name,
      originalTitle: show.original_name,
      overview: show.overview,
      posterPath: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
      backdropPath: show.backdrop_path ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}` : null,
      releaseDate: show.first_air_date,
      voteAverage: show.vote_average,
      voteCount: show.vote_count,
      media_type: 'tv'
    }));

    res.json({
      ...response.data,
      results: tvShows
    });
  } catch (error) {
    console.error('🚨 Airing today TV shows API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code
    });
    res.status(500).json({ status: 'Failed to fetch airing today TV shows', error: error.message });
  }
});

// Get on the air TV shows
app.get('/api/tv/on-the-air', async (req, res) => {
  try {
    console.log('📺 Fetching on the air TV shows from TMDB...');
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/tv/on_the_air`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        page: req.query.page || 1
      }
    });
    
    const tvShows = response.data.results.map(show => ({
      id: show.id,
      title: show.name,
      originalTitle: show.original_name,
      overview: show.overview,
      posterPath: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
      backdropPath: show.backdrop_path ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}` : null,
      releaseDate: show.first_air_date,
      voteAverage: show.vote_average,
      voteCount: show.vote_count,
      media_type: 'tv'
    }));

    res.json({
      ...response.data,
      results: tvShows
    });
  } catch (error) {
    console.error('🚨 On the air TV shows API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code
    });
    res.status(500).json({ status: 'Failed to fetch on the air TV shows', error: error.message });
  }
});

// Discover TV shows by genre
app.get('/api/tv/by-genre/:genreId', async (req, res) => {
  try {
    const { genreId } = req.params;
    console.log(`🎨 Fetching TV shows for genre ${genreId} from TMDB...`);
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/discover/tv`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        with_genres: genreId,
        page: req.query.page || 1,
        sort_by: 'popularity.desc'
      }
    });
    
    const tvShows = response.data.results.map(show => ({
      id: show.id,
      title: show.name,
      originalTitle: show.original_name,
      overview: show.overview,
      posterPath: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
      backdropPath: show.backdrop_path ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}` : null,
      releaseDate: show.first_air_date,
      voteAverage: show.vote_average,
      voteCount: show.vote_count,
      media_type: 'tv'
    }));

    res.json({
      ...response.data,
      results: tvShows
    });
  } catch (error) {
    console.error('🚨 TV shows by genre API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code,
      genreId: req.params.genreId
    });
    res.status(500).json({ status: 'Failed to fetch TV shows by genre', error: error.message });
  }
});

// Get TV genres
app.get('/api/tv/genres', async (req, res) => {
  try {
    console.log('🎭 Fetching TV genres from TMDB...');
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/genre/tv/list`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('🚨 TV Genres API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code
    });
    res.status(500).json({ status: 'Failed to fetch TV genres', error: error.message });
  }
});

// =================== SEARCH ENDPOINTS ===================

// Search movies
app.get('/api/search', async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Arama sorgusu gerekli' });
    }
    
    console.log(`🔍 Multi-searching for query: "${query}" (page: ${page})`);
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        query: query,
        page: page,
        include_adult: false
      }
    });
    
    // Sonuçları media_type'a göre işle
    const results = response.data.results.map(item => {
      const baseData = {
        id: item.id,
        media_type: item.media_type,
        popularity: item.popularity
      };

      if (item.media_type === 'movie') {
        return {
          ...baseData,
          title: item.title,
          originalTitle: item.original_title,
          overview: item.overview,
          posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
          releaseDate: item.release_date,
          voteAverage: item.vote_average,
          voteCount: item.vote_count
        };
      } else if (item.media_type === 'tv') {
        return {
          ...baseData,
          title: item.name,
          originalTitle: item.original_name,
          overview: item.overview,
          posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
          releaseDate: item.first_air_date,
          voteAverage: item.vote_average,
          voteCount: item.vote_count
        };
      } else if (item.media_type === 'person') {
        return {
          ...baseData,
          name: item.name,
          profilePath: item.profile_path ? `https://image.tmdb.org/t/p/w500${item.profile_path}` : null,
          knownFor: item.known_for ? item.known_for.map(work => ({
            id: work.id,
            title: work.title || work.name,
            media_type: work.media_type,
            releaseDate: work.release_date || work.first_air_date
          })) : [],
          knownForDepartment: item.known_for_department
        };
      }

      return baseData;
    });

    res.json({
      page: response.data.page,
      results: results,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results,
      query: query
    });
  } catch (error) {
    console.error('🚨 Multi-search API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code,
      searchQuery: req.query.query
    });
    res.status(500).json({ status: 'Failed to search', error: error.message });
  }
});

// Get person credits (movies and TV shows)
app.get('/api/person/:personId', async (req, res) => {
  try {
    const { personId } = req.params;
    console.log(`👤 Fetching credits for person ${personId} from TMDB...`);
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    // Oyuncunun bilgilerini al
    const personResponse = await axios.get(`${TMDB_BASE_URL}/person/${personId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR'
      }
    });

    // Oyuncunun filmografisini al
    const creditsResponse = await axios.get(`${TMDB_BASE_URL}/person/${personId}/combined_credits`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR'
      }
    });

    // Cast listesini işle, temizle ve akıllı sıralama uygula
    const credits = creditsResponse.data.cast
      // Önce veriyi temizle - tarih alanı olmayan girdileri filtrele
      .filter(item => {
        const hasDate = (item.media_type === 'movie' && item.release_date) || 
                       (item.media_type === 'tv' && item.first_air_date);
        return hasDate;
      })
      // Veriyi dönüştür
      .map(item => {
        const baseData = {
          id: item.id,
          media_type: item.media_type,
          popularity: item.popularity,
          character: item.character,
          order: item.order !== undefined ? item.order : 999 // order yoksa en sona at
        };

        if (item.media_type === 'movie') {
          return {
            ...baseData,
            title: item.title,
            originalTitle: item.original_title,
            overview: item.overview,
            posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
            releaseDate: item.release_date,
            voteAverage: item.vote_average,
            voteCount: item.vote_count
          };
        } else if (item.media_type === 'tv') {
          return {
            ...baseData,
            title: item.name,
            originalTitle: item.original_name,
            overview: item.overview,
            posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
            releaseDate: item.first_air_date,
            voteAverage: item.vote_average,
            voteCount: item.vote_count
          };
        }

        return null;
      })
      .filter(item => item !== null)
      // Akıllı sıralama uygula
      .sort((a, b) => {
        // Önce role göre sırala (düşük order değeri daha önemli - başrol vs yan rol)
        if (a.order < b.order) return -1;
        if (a.order > b.order) return 1;

        // Eğer roller aynıysa, tarihe göre sırala (yeni olan daha önemli)
        const dateA = new Date(a.releaseDate);
        const dateB = new Date(b.releaseDate);
        return dateB - dateA; // En yeni en üstte
      })
      .slice(0, 20); // İlk 20 filmi al

    console.log(`✅ ${credits.length} yapım bulundu ve akıllı sıralama uygulandı (ilk 20 tanesi gösteriliyor)`);

    res.json({
      person: {
        id: personResponse.data.id,
        name: personResponse.data.name,
        profilePath: personResponse.data.profile_path ? `https://image.tmdb.org/t/p/w500${personResponse.data.profile_path}` : null,
        knownForDepartment: personResponse.data.known_for_department
      },
      credits: credits
    });

  } catch (error) {
    console.error('🚨 Person credits API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code,
      personId: req.params.personId
    });
    res.status(500).json({ status: 'Failed to fetch person credits', error: error.message });
  }
});

// Environment variables kontrolü - server başlangıcında
console.log('🔧 Environment Variables Check:');
console.log('TMDB_API_KEY:', process.env.TMDB_API_KEY ? '✅ Mevcut' : '❌ Eksik');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Mevcut' : '❌ Eksik');
console.log('PORT:', process.env.PORT || 'Default 5000');

app.listen(PORT, () => {
  console.log(`🎬 CineMind Backend server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
