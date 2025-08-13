# CineMind AI - Film Öneri Platformu

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

Bu proje, React TypeScript + Tailwind CSS frontend ve Node.js Express backend kullanarak geliştirilmiş akıllı film öneri platformudur.

## Proje Yapısı

### Frontend (React + TypeScript + Vite)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **State Management**: React Context API
- **API Client**: Axios
- **Build Tool**: Vite

### Backend (Node.js + Express)
- **Runtime**: Node.js with ES modules
- **Framework**: Express.js
- **AI Integration**: Google Gemini API
- **Movie Data**: TMDB (The Movie Database) API
- **Environment**: dotenv for configuration

## Kodlama Standartları

### TypeScript
- Type imports için `import type` kullan
- Interface'ler için PascalCase
- Component prop'ları için interface tanımla
- Strict type checking enabled

### React Components
- Functional components with hooks
- Props için explicit typing
- Event handlers için proper typing
- Context API for global state

### Styling
- Tailwind CSS utilities
- Custom component classes in index.css
- Dark mode first approach
- Responsive design patterns

### API Integration
- Axios for HTTP requests
- Proper error handling
- Type-safe API responses
- Environment variables for API keys

## Özel Özellikler

### Film Önerileri
- Gemini AI ile akıllı film küratörlüğü
- TMDB API'den film bilgileri
- Tematik benzerlik analizi
- Gizli incilar odaklı öneriler

### UI/UX
- Minimalist dark theme
- Smooth animations
- Loading states
- Error handling
- Mobile-first responsive design

### ChatBot
- Real-time mesajlaşma
- Typing indicators
- Message history
- Auto-scroll to latest

### Movie Cards
- Lazy loading images
- Hover effects
- Rating displays
- Overview on hover

## Environment Variables

Backend için gerekli environment variables:
- `GEMINI_API_KEY`: Google Gemini AI API key
- `TMDB_API_KEY`: The Movie Database API key
- `PORT`: Server port (default: 5000)

## Development Commands

Frontend:
- `npm run dev`: Development server
- `npm run build`: Production build
- `npm run preview`: Preview production build

Backend:
- `npm run dev`: Development server with nodemon
- `npm start`: Production server

## API Endpoints

- `POST /api/get-recommendations`: Film önerileri al
- `GET /api/health`: Server health check
- `GET /api/test-tmdb`: TMDB connection test
