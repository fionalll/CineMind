# 🎬 CineMind AI - Akıllı Film Öneri Platformu

CineMind AI, yapay zeka destekli film ve dizi öneriler sunan modern bir web platformudur. React TypeScript frontend ve Node.js Express backend kullanarak geliştirilmiştir.

## ✨ Özellikler

### 🤖 AI Film Küratörü
- Google Gemini AI entegrasyonu
- Akıllı film önerileri
- Kişiselleştirilmiş öneriler
- Tematik benzerlik analizi

### 🎭 Film & Dizi Yönetimi
- TMDB API entegrasyonu
- Kapsamlı film ve dizi veritabanı
- Türe göre kategoriler
- Popüler, en yüksek puanlı, yakında içerikler

### 👤 Kullanıcı Deneyimi
- Firebase Authentication
- Kişisel hesap yönetimi
- İzlenen filmler takibi
- Responsive tasarım

### 🔍 Gelişmiş Arama
- Multi-search özelliği
- Film, dizi, oyuncu arama
- Gerçek zamanlı sonuçlar

## 🛠 Teknoloji Stack

### Frontend
- **React 19.1.0** - Modern UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Icons** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Google Gemini AI** - AI recommendations
- **TMDB API** - Movie database
- **Firebase** - Authentication & Database

## 📋 Kurulum

### Gereksinimler
- Node.js (v18 veya üzeri)
- npm veya yarn
- Firebase hesabı
- TMDB API key
- Google Gemini API key

### 1. Repository'yi klonlayın
```bash
git clone https://github.com/[username]/cinemind-ai.git
cd cinemind-ai
```

### 2. Frontend kurulumu
```bash
npm install
```

### 3. Backend kurulumu
```bash
cd backend
npm install
```

### 4. Environment variables
Backend klasöründe `.env` dosyası oluşturun:
```env
TMDB_API_KEY=your_tmdb_api_key
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

### 5. Firebase yapılandırması
`src/firebase/config.ts` dosyasını Firebase projenizin bilgileri ile güncelleyin.

## 🚀 Çalıştırma

### Development mode
```bash
# Frontend (root dizinde)
npm run dev

# Backend (backend dizinde)
npm run dev
```

### Production build
```bash
npm run build
```

## 📁 Proje Yapısı

```
cinemind-ai/
├── src/
│   ├── components/          # React bileşenleri
│   ├── pages/              # Sayfa bileşenleri
│   ├── context/            # React Context API
│   ├── services/           # API servisleri
│   ├── types/              # TypeScript tipleri
│   ├── firebase/           # Firebase yapılandırması
│   └── config/             # Uygulama yapılandırması
├── backend/
│   ├── server.js           # Express sunucu
│   └── package.json        # Backend bağımlılıkları
├── public/                 # Static dosyalar
└── package.json            # Frontend bağımlılıkları
```

## 🎯 Sayfalar

- **Ana Sayfa (/)** - Film önerileri ve kategoriler
- **Diziler (/diziler)** - TV show içerikleri
- **AI Asistan (/chat)** - Yapay zeka film küratörü
- **İzlediklerim (/watched)** - Kullanıcının izlediği filmler
- **Hesabım (/hesabim)** - Kullanıcı hesap yönetimi

## 🔧 API Endpoints

### Film & Dizi Endpoints
- `GET /api/movies/popular` - Popüler filmler
- `GET /api/movies/top-rated` - En yüksek puanlı filmler
- `GET /api/tv/popular` - Popüler diziler
- `GET /api/genres` - Film türleri
- `POST /api/get-recommendations` - AI önerileri

## 🎨 Tasarım

- **Dark Theme** - Modern karanlık tema
- **Responsive Design** - Mobil uyumlu
- **Material Design Icons** - Profesyonel iconlar
- **Smooth Animations** - Akıcı geçişler
- **Accessibility** - Erişilebilirlik desteği

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'i push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👥 Geliştirici

**CineMind AI Team**
- GitHub: [username]
- Email: [email]

## 🙏 Teşekkürler

- [TMDB](https://www.themoviedb.org/) - Film veritabanı
- [Google Gemini](https://ai.google.dev/) - AI entegrasyonu
- [Firebase](https://firebase.google.com/) - Backend servisleri
- [React](https://reactjs.org/) - UI framework

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
