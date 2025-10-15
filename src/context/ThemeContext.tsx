import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeName = 'default' | 'truman' | 'halloween' | 'peach' | 'marshmallow' | 'broadway' | 'sunrise' | 'pistachio' | 'watermelon';

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
    id: 'truman',
    name: 'Truman',
    description: 'Açık mor ve lavanta tonları',
    preview: {
      primary: '#F4F5FF',
      secondary: '#D0CDFF',
      accent: '#BDBFFF'
    }
  },
  {
    id: 'halloween',
    name: 'Cadılar Bayramı',
    description: 'Turuncu ve koyu kahve Halloween tonları',
    preview: {
      primary: '#443737',
      secondary: '#934D01',
      accent: '#D58E2C'
    }
  },
  {
    id: 'peach',
    name: 'Peach',
    description: 'Yumuşak şeftali ve pembe tonları',
    preview: {
      primary: '#FFE7E7',
      secondary: '#FFC5C5',
      accent: '#F19A9A'
    }
  },
  {
    id: 'marshmallow',
    name: 'Marshmallow',
    description: 'Krem ve pastel mor tonları',
    preview: {
      primary: '#FFFDF1',
      secondary: '#FDFFD2',
      accent: '#D5B3D5'
    }
  },
  {
    id: 'broadway',
    name: 'Broadway',
    description: 'Altın ve koyu kırmızı tiyatro tonları',
    preview: {
      primary: '#FFF0C4',
      secondary: '#8C1007',
      accent: '#660B05'
    }
  },
  {
    id: 'sunrise',
    name: 'Sunrise',
    description: 'Gün doğumu sarı ve mavi tonları',
    preview: {
      primary: '#FEFFC4',
      secondary: '#FFDE63',
      accent: '#799EFF'
    }
  },
  {
    id: 'pistachio',
    name: 'Pistachio',
    description: 'Fıstık yeşili ve kahverengi doğal tonları',
    preview: {
      primary: '#E9EED9',
      secondary: '#CBD2A4',
      accent: '#54473F'
    }
  },
  {
    id: 'watermelon',
    name: 'Watermelon',
    description: 'Karpuz yeşili ve pembe tatlı tonları',
    preview: {
      primary: '#FCFFE0',
      secondary: '#F5DAD2',
      accent: '#75A47F'
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
