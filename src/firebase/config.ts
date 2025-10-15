// Gerekli Firebase fonksiyonlarını import et
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Firebase yapılandırma bilgilerini .env.local dosyasından güvenli bir şekilde oku
// Vite projelerinde bu işlem "import.meta.env" ile yapılır ve değişkenlerin VITE_ ile başlaması gerekir.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);

// Auth (Kimlik Doğrulama) servisini başlat
const auth = getAuth(app);

// Firestore (Veritabanı) servisini güvenli bir şekilde başlat
let db;
try {
  db = getFirestore(app);
  console.log('✅ Firestore başarıyla başlatıldı');
} catch (error) {
  console.error('❌ Firestore başlatılırken hata:', error);
  // Fallback olarak tekrar dene
  setTimeout(() => {
    try {
      db = getFirestore(app);
      console.log('✅ Firestore ikinci denemede başarıyla başlatıldı');
    } catch (retryError) {
      console.error('❌ Firestore ikinci denemede de başarısız:', retryError);
    }
  }, 1000);
}

// Analytics servisini başlat (sadece tarayıcıda çalışacak şekilde)
let analytics;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics başlatılırken hata oluştu:', error);
  }
}

// Konsola Firebase'in başarıyla başlatıldığına dair bir mesaj yazdır
console.log('🔥 Firebase başarıyla başlatıldı');

// Bu servisleri projenin diğer yerlerinde kullanabilmek için export et
export { auth, analytics, app, db };
export default app;