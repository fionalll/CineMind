import React, { useState, useRef, useEffect } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { movieService } from '../services/api';
import type { ChatMessage } from '../types';

const ChatBot: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const { chatMessages, addMessage, setMovies, isLoading, setIsLoading, error, setError } = useMovieContext();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages are added
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };
    const updatedMessages = [...chatMessages, userMessage];
    addMessage(userMessage);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await movieService.getRecommendations(inputMessage, updatedMessages);
      
      if (response.status === 'clarification' && response.question) {
        
        const aiQuestionMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: response.question, // Mesaj içeriği olarak SORUYU kullan
          isUser: false,
          timestamp: new Date(),
        };
        addMessage(aiQuestionMessage); // Chat'e soruyu ekle
        setMovies([]); // Film listesini temizle, çünkü henüz film yok

      } 
      // 2. Yanıt bir FİLM LİSTESİ mi?
      else if (response.movies) {

        const aiSummaryMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          // response.message'in undefined olabileceğini kontrol et
          content: response.message || "İşte sana özel önerilerim:", 
          isUser: false,
          timestamp: new Date(),
        };
        addMessage(aiSummaryMessage); // Chat'e özet mesajını ekle
        setMovies(response.movies); // Film listesini güncelle

      } 
      // 3. Hiçbiri değilse, bu beklenmedik bir formattır. Hata olarak ele al.
      else {
        throw new Error("Yapay zekadan beklenmeyen bir formatta yanıt alındı.");
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `Üzgünüm, bir hata oluştu: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`,
        isUser: false,
        timestamp: new Date(),
      };
      addMessage(errorMessage);
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex items-center mb-4 pb-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: 'var(--primary)' }}>
          <span className="text-white font-bold">🤖</span>
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>CinePop AI</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Film Küratörünüz</p>
        </div>
      </div>

      {/* Chat Messages Container - Scrollable */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 chat-scrollbar">
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.isUser
                    ? 'text-white shadow-lg'
                    : 'border shadow-sm'
                }`}
                style={{
                  backgroundColor: message.isUser 
                    ? 'var(--accent)' 
                    : 'var(--background-tertiary)',
                  borderColor: message.isUser 
                    ? 'var(--accent)' 
                    : 'var(--border-color)',
                  color: message.isUser 
                    ? 'var(--text-primary)' 
                    : 'var(--text-primary)'
                }}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString('tr-TR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div 
                className="px-4 py-2 rounded-lg border shadow-sm"
                style={{
                  backgroundColor: 'var(--background-tertiary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              >
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div 
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: 'var(--accent)' }}
                    ></div>
                    <div 
                      className="w-2 h-2 rounded-full animate-bounce" 
                      style={{ backgroundColor: 'var(--accent)', animationDelay: '0.1s' }}
                    ></div>
                    <div 
                      className="w-2 h-2 rounded-full animate-bounce" 
                      style={{ backgroundColor: 'var(--accent)', animationDelay: '0.2s' }}
                    ></div>
                  </div>
                  <span className="text-sm">Yazıyor...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Fixed Input Area */}
      <div className="flex space-x-2 mt-4 flex-shrink-0">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Hangi film tarzında öneriler istiyorsunuz? (örn: 'Inception gibi zihin büken filmler')"
          className="input-field flex-1 h-12 px-4 py-3"
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div 
          className="mt-2 p-2 rounded border text-sm flex-shrink-0"
          style={{
            backgroundColor: 'var(--background-secondary)',
            borderColor: '#ef4444',
            color: '#fecaca'
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default ChatBot;
