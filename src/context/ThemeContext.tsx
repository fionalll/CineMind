import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeName = 'default' | 'Sunset Warmth' | 'Coffee' | 'earthy-green' | 'passionate-purple' | 'dusty-pink';

export interface Theme {
  id: ThemeName;
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'default',
    name: 'Varsayılan Dark',
    description: 'Klasik koyu tema',
    preview: {
      primary: '#111827',
      secondary: '#1f2937',
      accent: '#3b82f6'
    }
  },
  {
    id: 'Sunset Warmth',
    name: 'Sunset Warmth',
    description: 'Kahverengi ve sıcak turuncu tonları',
    preview: {
      primary: '#3b2f2f',
      secondary: '#523c2f',
      accent: '#d65a31'
    }
  },
  {
    id: 'Coffee',
    name: 'Coffee',
    description: 'Koyu kahve ve krem tonları',
    preview: {
      primary: '#2b2623',
      secondary: '#3b352f',
      accent: '#6a7f71'
    }
  },
  {
    id: 'earthy-green',
    name: 'Toprak Yeşili',
    description: 'Doğa dostu yeşil tonları',
    preview: {
      primary: '#162a1a',
      secondary: '#203623',
      accent: '#7ea384'
    }
  },
  {
    id: 'passionate-purple',
    name: 'Tutkulu Mor',
    description: 'Kahverengi ve mor tonları',
    preview: {
      primary: '#3b2f2f',
      secondary: '#5c4a47',
      accent: '#a9746e'
    }
  },
  {
    id: 'dusty-pink',
    name: 'Pudra Pembesi',
    description: 'Açık ve pastel pembe tonları',
    preview: {
      primary: '#fff3f5',
      secondary: '#f9dde0',
      accent: '#d88c97'
    }
  }
];

interface ThemeContextType {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('default');

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeName;
    if (savedTheme && themes.find(t => t.id === savedTheme)) {
      setCurrentTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme('default');
    }
  }, []);

  const applyTheme = (themeName: ThemeName) => {
    // Remove any existing theme data attributes
    document.documentElement.removeAttribute('data-theme');
    
    // Apply new theme
    if (themeName !== 'default') {
      document.documentElement.setAttribute('data-theme', themeName);
    }
    
    console.log(`🎨 Tema uygulandı: ${themeName}`);
  };

  const setTheme = (theme: ThemeName) => {
    console.log(`🎨 Tema değiştiriliyor: ${theme}`);
    
    setCurrentTheme(theme);
    applyTheme(theme);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    console.log(`✅ Tema kaydedildi: ${theme}`);
  };

  const value = {
    currentTheme,
    setTheme,
    themes
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
