import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="page-container pt-16">
      <div className="page-content">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold text-primary mb-2">� CinePop</h2>
            <p className="text-secondary">Yükleniyor...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
