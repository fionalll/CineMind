import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

interface BackButtonProps {
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ className = '' }) => {
  // useNavigate hook'u, programatik olarak sayfa değiştirmemizi sağlar.
  const navigate = useNavigate();

  // Bu fonksiyon, tarayıcı geçmişinde bir sayfa geri gider.
  const handleGoBack = () => {
    navigate(-1);
  };

  const defaultClasses = "flex items-center space-x-2 text-secondary hover:text-primary transition-colors duration-200 mb-6 font-medium";
  const combinedClasses = className ? `${defaultClasses} ${className}` : defaultClasses;

  return (
    <button
      onClick={handleGoBack}
      // Temanızla uyumlu, sade ve şık bir stil
      className={combinedClasses}
      aria-label="Geri dön"
    >
      <FaArrowLeft />
      <span>Geri</span>
    </button>
  );
};

export default BackButton;