import React, { useRef } from 'react';
import ChatBot from '../components/ChatBot';
import MovieCard from '../components/MovieCard';
import Navbar from '../components/Navbar';
import { MovieProvider, useMovieContext } from '../context/MovieContext';
import type { Movie } from '../types';
import { useNavigate } from 'react-router-dom';

const MoviePanel: React.FC = () => {
  const { movies } = useMovieContext();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  if (!movies || movies.length === 0) {
    // Boş durum paneli
    return (
      <div className="h-full bg-secondary rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Film Önerileri</h2>
          <p className="text-secondary mb-6 max-w-md">
            Henüz film önerisi almadınız. Solda AI asistanımızla sohbet edin veya aşağıdaki testi çözerek kişisel öneriler alın.
          </p>
          <button
            onClick={() => navigate('/test')}
            className="btn-primary px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-3 mx-auto"
          >
            <span>Ne İzleyeceğini Bilmiyor musun?</span>
            <span>🧠</span>
          </button>
        </div>
      </div>
    );
  }

  // Yatay kaydırmalı sonuç paneli
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-primary">İşte Sana Özel Film Önerileri</h2>
        <div className="flex gap-2">
          <button
            onClick={scrollLeft}
            className="p-2 rounded-lg bg-tertiary hover:bg-accent transition-colors"
            aria-label="Sola kaydır"
          >
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={scrollRight}
            className="p-2 rounded-lg bg-tertiary hover:bg-accent transition-colors"
            aria-label="Sağa kaydır"
          >
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto space-x-4 p-2 flex-1 carousel-scrollbar"
      >
        {movies.map((movie: Movie) => (
          <div key={movie.id} className="flex-shrink-0 w-72">
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </div>
  );
};

const ChatbotPage = () => {
  const navigate = useNavigate();

  return (
    <MovieProvider>
      <Navbar />
      <div className="page-container pt-16 bg-background-primary">
        <div className="flex h-[calc(100vh-theme(spacing.16))] gap-8 p-8">
          {/* Sol Panel: Kompakt Sohbet - %40 Genişlik */}
          <div className="w-2/5 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-primary mb-1">
                  AI Film Küratörü
                </h1>
                <p className="text-secondary text-sm">
                  Yapay zeka destekli film küratörünüzle sohbet edin
                </p>
              </div>
              <button
                onClick={() => navigate('/test')}
                className="btn-primary px-4 py-2 rounded-lg font-bold text-sm shadow hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                <span>Testi Çöz</span>
                <span>🧠</span>
              </button>
            </div>
            
            <div className="flex-1 flex flex-col bg-secondary rounded-2xl shadow-xl p-4 overflow-hidden">
              <div className="flex-1 flex flex-col min-h-0">
                <ChatBot />
              </div>
            </div>
          </div>

          {/* Sağ Panel: Yatay Kaydırmalı Öneriler - %60 Genişlik */}
          <div className="w-3/5 flex flex-col">
            <MoviePanel />
          </div>
        </div>
      </div>
    </MovieProvider>
  );
};

export default ChatbotPage;
