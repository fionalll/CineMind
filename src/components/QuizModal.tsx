import { useState } from 'react';
import type { QuizAnswer } from '../config/quiz';
import { quizData } from '../config/quiz';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (tags: string[]) => void;
}

const QuizModal = ({ isOpen, onClose, onFinish }: QuizModalProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showResultButton, setShowResultButton] = useState(false);

  if (!isOpen) return null;

  const handleAnswer = (answer: QuizAnswer) => {
    setSelectedTags(prev => [...prev, ...answer.tags]);
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(q => q + 1);
    } else {
      setShowResultButton(true);
    }
  };

  const handleShowResults = () => {
    onFinish(selectedTags);
    setCurrentQuestion(0);
    setSelectedTags([]);
    setShowResultButton(false);
  };

  const handleClose = () => {
    setCurrentQuestion(0);
    setSelectedTags([]);
    setShowResultButton(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in">
      <div className="bg-secondary rounded-2xl shadow-2xl p-6 w-full max-w-md relative animate-scale-in">
        <button
          className="absolute top-3 right-3 text-xl text-secondary hover:text-primary transition"
          onClick={handleClose}
          aria-label="Kapat"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">Bugün Ne İzlesem? 🧠</h2>
        {!showResultButton ? (
          <>
            <div className="mb-6 text-lg font-medium text-primary text-center transition-all duration-300">
              {quizData[currentQuestion].question}
            </div>
            <div className="flex flex-col gap-3">
              {quizData[currentQuestion].answers.map((answer, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(answer)}
                  className="bg-tertiary hover:bg-primary/80 text-primary font-medium py-3 px-4 rounded-lg shadow transition-all duration-200 border border-border-color hover:scale-105 focus:outline-none"
                  style={{ transition: 'all 0.2s' }}
                >
                  {answer.text}
                </button>
              ))}
            </div>
            <div className="mt-6 text-center text-xs text-muted">
              {currentQuestion + 1} / {quizData.length}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <div className="text-lg text-primary mb-4 font-semibold">Hazırsın!</div>
            <button
              onClick={handleShowResults}
              className="btn-primary px-6 py-3 rounded-lg font-bold text-lg shadow hover:scale-105 transition-all duration-200"
            >
              Sonuçları Gör
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizModal;
