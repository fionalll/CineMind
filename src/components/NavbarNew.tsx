import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 navbar border-b backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-primary font-bold text-lg">🎬</span>
            </div>
            <span className="text-xl font-bold text-primary">CineMind AI</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                  isActive('/')
                    ? 'bg-accent text-primary'
                    : 'text-secondary hover:text-primary hover:bg-tertiary'
                }`}
              >
                Ana Sayfa
              </Link>
              <Link
                to="/chat"
                className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                  isActive('/chat')
                    ? 'bg-accent text-primary'
                    : 'text-secondary hover:text-primary hover:bg-tertiary'
                }`}
              >
                AI Asistan
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-secondary hover:text-primary p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
