import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { movieService } from '../services/api';
import type { SearchResult, SearchResponse } from '../types';
import MovieCard from '../components/MovieCard';
import PersonCard from '../components/PersonCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';
import BackButton from '../components/BackButton';

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  const query = searchParams.get('q') || '';

  const searchMulti = async (searchQuery: string, page: number = 1) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response: SearchResponse = await movieService.searchMulti(searchQuery, page);
      setResults(response.results);
      setTotalPages(response.total_pages);
      setTotalResults(response.total_results);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Arama sırasında bir hata oluştu');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      searchMulti(query, 1);
      setCurrentPage(1);
    } else {
      setResults([]);
      setTotalResults(0);
      setTotalPages(0);
    }
  }, [query]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      searchMulti(query, page);
      // Sayfanın üstüne scroll
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Sonuçları media_type'a göre gruplandır
  const groupedResults = results.reduce((groups, result) => {
    const type = result.media_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(result);
    return groups;
  }, {} as Record<string, SearchResult[]>);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const showPages = 5; // Gösterilecek sayfa sayısı
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    // Eğer sondan başlıyorsa, başlangıcı ayarla
    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    // Önceki sayfa
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-2 mx-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
        >
          ←
        </button>
      );
    }

    // Sayfa numaraları
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 mx-1 rounded transition-colors ${
            i === currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          {i}
        </button>
      );
    }

    // Sonraki sayfa
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-2 mx-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
        >
          →
        </button>
      );
    }

    return (
      <div className="flex justify-center items-center mt-8 mb-6">
        <div className="flex items-center">
          {pages}
        </div>
      </div>
    );
  };

  const getSectionTitle = (mediaType: string) => {
    switch (mediaType) {
      case 'movie': return 'Filmler';
      case 'tv': return 'Diziler';
      case 'person': return 'Kişiler';
      default: return 'Diğer';
    }
  };

  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <BackButton />
        
        {/* Arama başlığı */}
        <div className="mb-6">
          {query && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl font-bold text-white mb-2 sm:mb-0">
                "{query}" için arama sonuçları
              </h1>
              {totalResults > 0 && (
                <p className="text-gray-300">
                  {totalResults.toLocaleString()} sonuç bulundu
                </p>
              )}
            </div>
          )}
          
          {!query && (
            <h1 className="text-2xl font-bold text-white mb-4">
              Arama yapmak için yukarıdaki arama kutusunu kullanın
            </h1>
          )}
        </div>

        {/* Loading durumu */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Hata durumu */}
        {error && (
          <div className="text-center py-12">
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Sonuç bulunamadı */}
        {!loading && !error && query && results.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-white mb-2">
                Sonuç bulunamadı
              </h2>
              <p className="text-gray-300">
                "{query}" araması için herhangi bir sonuç bulunamadı.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Farklı anahtar kelimeler deneyebilirsiniz.
              </p>
            </div>
          </div>
        )}

        {/* Gruplandırılmış sonuçlar */}
        {!loading && results.length > 0 && (
          <>
            {Object.entries(groupedResults).map(([mediaType, items]) => (
              <div key={mediaType} className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">
                  {getSectionTitle(mediaType)} ({items.length})
                </h2>
                
                {mediaType === 'person' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {items.map((person) => (
                      <PersonCard key={person.id} person={person} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {items.map((item) => (
                      <MovieCard 
                        key={item.id} 
                        movie={{
                          id: item.id,
                          title: item.title || 'Başlık Yok',
                          originalTitle: item.originalTitle || '',
                          overview: item.overview || '',
                          posterPath: item.posterPath ?? null,
                          backdropPath: item.backdropPath ?? null,
                          releaseDate: item.releaseDate || '',
                          voteAverage: item.voteAverage || 0,
                          voteCount: item.voteCount || 0,
                          media_type: item.media_type
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Sayfalama */}
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;
