import React, { useState } from 'react';
import { movieService } from '../services/api';
import Navbar from '../components/Navbar';

interface RandomEpisodeResult {
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

const RandomEpisodePage: React.FC = () => {
  const [seriesName, setSeriesName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RandomEpisodeResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!seriesName.trim()) {
      setError('Lütfen bir dizi adı girin');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await movieService.getRandomEpisode(seriesName.trim());
      setResult(response.randomEpisode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const seriesPosterUrl = result?.series.poster_path 
    ? `https://image.tmdb.org/t/p/w300${result.series.poster_path}`
    : '/placeholder-poster.jpg';

  return (
    <>
      <Navbar />
      <div className="page-container pt-16">
        <div className="page-content">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 xl:max-w-7xl">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-primary mb-2">
                 Rastgele Bölüm Üretici
              </h1>
              <p className="text-muted">
                Sevdiğin diziden rastgele bir bölüm önerisi al!
              </p>
            </div>

            {/* Main Content - Centered Layout */}
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col lg:flex-row gap-10 justify-center">
                {/* Sol Panel - Form - Büyütülmüş */}
                <div className="lg:w-2/5 flex flex-col">
                  <div className="bg-secondary border border-default rounded-xl p-8 h-fit">
                    <h2 className="text-2xl font-semibold text-primary mb-6">Dizi Seç</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="seriesName" className="block text-base font-medium mb-3 text-secondary">
                          Dizi Adı
                        </label>
                        <input
                          type="text"
                          id="seriesName"
                          value={seriesName}
                          onChange={(e) => setSeriesName(e.target.value)}
                          placeholder="Örn: Breaking Bad, The Office"
                          className="w-full px-5 py-4 bg-tertiary border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-primary placeholder-muted text-base"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-4 text-base font-bold rounded-lg"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            <span>Rastgele bölüm seçiliyor...</span>
                          </div>
                        ) : (
                          '🎯 Rastgele Bölüm Öner!'
                        )}
                      </button>
                    </form>

                    {/* Error */}
                    {error && (
                      <div className="mt-6 bg-error/20 border border-error/50 rounded-lg p-4">
                        <p className="text-error text-base">❌ {error}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sağ Panel - Sonuç - Daha da Büyütülmüş */}
                <div className="lg:w-3/5 flex flex-col">
                  {result ? (
                    <div className="bg-secondary border border-default rounded-xl overflow-hidden">
                      {/* Content - Dizi Posteri ve Bilgileri - Daha Büyük */}
                      <div className="p-8 flex gap-8">
                        {/* Series Poster - Daha Büyük */}
                        <div className="flex-shrink-0">
                          <img
                            src={seriesPosterUrl}
                            alt={result.series.name}
                            className="w-48 h-72 object-cover rounded-lg shadow-lg"
                          />
                        </div>

                        {/* Episode Info - Daha Büyük */}
                        <div className="flex-1 min-w-0">
                          {/* Series Name */}
                          <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-3">
                            {result.series.name}
                          </h2>

                          {/* Episode Title */}
                          <h3 className="text-xl font-semibold mb-4 text-secondary">
                            {result.season.season_number}. Sezon {result.episode.episode_number}. Bölüm: 
                            <span className="text-accent ml-2">"{result.episode.name}"</span>
                          </h3>

                          {/* Episode Details */}
                          <div className="flex flex-wrap gap-4 mb-6 text-base text-muted">
                            {result.episode.air_date && (
                              <span className="flex items-center gap-2">
                                📅 {new Date(result.episode.air_date).toLocaleDateString('tr-TR')}
                              </span>
                            )}
                            {result.episode.vote_average > 0 && (
                              <span className="flex items-center gap-2">
                                ⭐ {result.episode.vote_average.toFixed(1)}
                              </span>
                            )}
                            {result.episode.runtime && (
                              <span className="flex items-center gap-2">
                                ⏰ {result.episode.runtime} dk
                              </span>
                            )}
                          </div>

                          {/* Episode Overview - Daha Büyük */}
                          {result.episode.overview && (
                            <p className="text-secondary leading-relaxed text-base line-clamp-4">
                              {result.episode.overview}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-secondary border border-default rounded-xl p-12 flex items-center justify-center">
                      <div className="text-center">
                        <h3 className="text-2xl font-semibold text-primary mb-3">Dizi Bölümü Açıklaması</h3>
                        <p className="text-muted text-base">
                          Sol panelden bir dizi adı girin ve rastgele bölüm önerisi alın.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RandomEpisodePage;
