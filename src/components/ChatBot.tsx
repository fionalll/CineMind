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

    addMessage(userMessage);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await movieService.getRecommendations(inputMessage);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        isUser: false,
        timestamp: new Date(),
      };

      addMessage(aiMessage);
      setMovies(response.movies);
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
    <div className="card p-6 h-[600px] flex flex-col">
      <div className="flex items-center mb-4 pb-4 border-b border-gray-700">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
          <span className="text-white font-bold">🤖</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">CineMind AI</h2>
          <p className="text-sm text-gray-400">Film Küratörünüz</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
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

      {/* Input Area */}
      <div className="flex space-x-2">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Hangi film tarzında öneriler istiyorsunuz? (örn: 'Inception gibi zihin büken filmler')"
          className="input-field flex-1 resize-none h-12"
          rows={1}
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

      {error && (
        <div 
          className="mt-2 p-2 rounded border text-sm"
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
