import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-white mb-2">🎬 CineMind AI</h2>
        <p className="text-gray-300">Yükleniyor...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
