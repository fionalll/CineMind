import { useState } from 'react';
import { quizData } from '../config/quiz';
import type { QuizAnswer } from '../config/quiz';
import { movieService } from '../services/api';
import type { Movie } from '../types';
import MovieCard from '../components/MovieCard';
import BackButton from '../components/BackButton';

type TestState = 'answering' | 'loading' | 'showing_results';

const TestPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [testState, setTestState] = useState<TestState>('answering');
  const [allRecommendations, setAllRecommendations] = useState<Movie[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const handleAnswer = (answer: QuizAnswer) => {
    setSelectedTags(prev => [...prev, ...answer.tags]);
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(q => q + 1);
    } else {
      setTestState('loading');
      fetchRecommendations([...selectedTags, ...answer.tags], true);
    }
  };

  const fetchRecommendations = async (tags: string[], isInitial = false) => {
    setError('');
    if (!isInitial) setIsFetchingMore(true);
    try {
      const excludedTitles = allRecommendations.map(m => m.title);
      const prompt = `Kullanıcı şu özelliklerde bir film arıyor: ${tags.join(', ')}. Ona uygun, popüler olmayan ve kaliteli bir film öner.`;
      const response = await movieService.getRecommendations(prompt, excludedTitles);
      if (isInitial) {
        setAllRecommendations(response.movies);
        setSummary(response.message);
        setTestState('showing_results');
      } else {
        // Tekillik kontrolü - sadece daha önce eklenmemiş filmleri ekle
        const existingMovieIds = new Set(allRecommendations.map(movie => movie.id));
        const uniqueNewMovies = response.movies.filter(movie => !existingMovieIds.has(movie.id));
        
        setAllRecommendations(prev => [...prev, ...uniqueNewMovies]);
        setSummary(response.message);
      }
    } catch (err: any) {
      setError('Film önerileri alınırken bir hata oluştu.');
      setTestState('showing_results');
    } finally {
      setIsFetchingMore(false);
    }
  };

  const handleShowMore = () => {
    fetchRecommendations(selectedTags, false);
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedTags([]);
    setTestState('answering');
    setAllRecommendations([]);
    setSummary('');
    setError('');
    setIsFetchingMore(false);
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-7xl mx-auto bg-secondary rounded-2xl shadow-2xl p-4 sm:p-8 md:p-12">
        <BackButton className="mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-6 text-center">
          Bugün Ne İzlesem? <span role="img" aria-label="brain">🧠</span>
        </h1>
        {testState === 'answering' && (
          <>
            <div className="mb-8 text-lg md:text-xl font-medium text-primary text-center transition-all duration-300">
              {quizData[currentQuestion].question}
            </div>
            <div className="flex flex-col gap-4 max-w-lg mx-auto">
              {quizData[currentQuestion].answers.map((answer, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(answer)}
                  className="bg-tertiary hover:bg-primary/80 text-primary font-semibold py-4 px-4 rounded-lg shadow transition-all duration-200 border border-border-color hover:scale-105 focus:outline-none text-base md:text-lg"
                  style={{ transition: 'all 0.2s' }}
                >
                  {answer.text}
                </button>
              ))}
            </div>
            <div className="mt-8 text-center text-xs text-muted">
              {currentQuestion + 1} / {quizData.length}
            </div>
          </>
        )}

        {testState === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
            <div className="text-primary text-lg font-semibold">Film önerileri hazırlanıyor...</div>
          </div>
        )}

        {testState === 'showing_results' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-primary mb-2 text-center">Sana Özel Film Önerileri</h2>
            {summary && (
              <p className="text-secondary text-center mb-8 max-w-2xl mx-auto">{summary}</p>
            )}
            {error && (
              <div className="bg-error text-white rounded-lg px-4 py-3 mb-4 text-center">{error}</div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mb-8 items-stretch">
              {allRecommendations.length > 0 ? (
                allRecommendations.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))
              ) : (
                <div className="text-secondary text-center col-span-full">Film önerisi bulunamadı.</div>
              )}
            </div>
            <div className="mt-8 flex flex-col items-center gap-4">
              <button
                onClick={handleShowMore}
                className="btn-primary px-6 py-3 rounded-lg font-bold text-lg shadow hover:scale-105 transition-all duration-200 disabled:opacity-60"
                disabled={isFetchingMore}
              >
                {isFetchingMore ? 'Aranıyor...' : 'Daha Fazla Öneri Getir'}
              </button>
              <button
                onClick={handleRestart}
                className="btn-secondary px-6 py-3 rounded-lg font-bold text-lg shadow hover:scale-105 transition-all duration-200"
              >
                Testi Tekrar Çöz
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestPage;