import React from 'react';

const Hero: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-16">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
          Aklındaki Filme Benzer
          <span className="text-blue-500 block mt-2">Başyapıtları Keşfet</span>
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto animate-slide-up">
          Yapay zeka destekli film küratörümüz ile dünya sinemasından gizli kalmış incileri keşfedin. 
          Sadece bir film adı söyleyin, size benzer temaları işleyen özgün filmler önerelim.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
          <span className="bg-gray-700 px-4 py-2 rounded-full border border-gray-600">
            🤖 AI Destekli Öneriler
          </span>
          <span className="bg-gray-700 px-4 py-2 rounded-full border border-gray-600">
            🌍 Dünya Sineması
          </span>
          <span className="bg-gray-700 px-4 py-2 rounded-full border border-gray-600">
            💎 Gizli İnciler
          </span>
        </div>
      </div>
    </div>
  );
};

export default Hero;
