import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Notification } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
      const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
    if (currentUser) {
      const fetchNotifications = async () => {
        try {
          const response = await api.get<Notification[]>('/notifications', {
            headers: { 'x-user-id': currentUser.uid }
          });
          setNotifications(response.data);
        } catch (error) {
          console.error("Bildirimler çekilemedi:", error);
        }
      };
      fetchNotifications();
      const intervalId = setInterval(fetchNotifications, 30000); 
      return () => clearInterval(intervalId);
    }
    }, [currentUser]);

    const handleBellClick = async () => {
        const newShowState = !showNotifications;
        setShowNotifications(newShowState);
        if (newShowState && notifications.length > 0) {
            try {
                await api.post('/notifications/mark-as-read');
                setNotifications([]); 
            } catch (error) {
                console.error("Bildirimler okundu olarak işaretlenemedi:", error);
            }
        }
    };
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 navbar border-b backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img 
                src="/avatars/logo-popcorn .png" 
                alt="CinePop Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <span className="text-xl font-bold text-primary">CinePop AI</span>
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
            <button
              className="text-secondary hover:text-primary p-2"
              onClick={handleBellClick}
              aria-label="Bildirimleri göster/gizle"
            >
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
