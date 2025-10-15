
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: 'film-ana' // serviceAccountKey.json dosyasından alınan project_id
  });
}

const db = admin.firestore();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware - Token doğrulama
const decodeToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer token
    if (!token) {
      return res.status(401).json({ error: 'Token bulunamadı' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    req.currentUserId = decodedToken.uid;
    next();
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    return res.status(401).json({ error: 'Geçersiz token' });
  }
};

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Set API version to v1beta for newer models
const API_VERSION = 'v1beta';

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Helper function to search movies on TMDB
async function searchMovieOnTMDB(movieRecommendation) {
  const { title, year, reason } = movieRecommendation;
  try {
    console.log(`🔍 Searching for movie: ${title} (${year})`);
    
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: title,
        year: year, // Yıl parametresini ekle
        language: 'tr-TR'
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const movie = response.data.results[0];
      return {
        id: movie.id,
        title: movie.title,
        originalTitle: movie.original_title,
        overview: movie.overview,
        posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        releaseDate: movie.release_date,
        voteAverage: movie.vote_average,
        voteCount: movie.vote_count,
        backdropPath: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
        reason: reason // Gemini'nin öneri sebebini ekle
      };
    }
    return null;
  } catch (error) {
    console.error(`🚨 Movie search API isteği sırasında detaylı hata (${title} - ${year}):`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code,
      searchQuery: { title, year }
    });
    return null;
  }
}

  // GET /api/movies/search?query=...
  // TMDB API'sini kullanarak film arar ve sonuçları döndürür.
  app.get('/api/movies/search', decodeToken, async (req, res) => {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Arama terimi zorunludur.' });
    }

    try {
      const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
        params: {
          api_key: TMDB_API_KEY,
          query: query,
          language: 'tr-TR',
          include_adult: false,
        }
      });

      res.status(200).json(response.data);

    } catch (error) {
      console.error('TMDB film arama hatası:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Film araması sırasında bir hata oluştu.' });
    }
  });


  // POST /api/oneriler
  // Film önerisi ekler
  app.post('/api/oneriler', decodeToken, async (req, res) => {
    const { alanKullaniciId, filmId, filmAdi, filmPosterUrl, notMetni } = req.body;
    try {
      // Get sender's display name from Firebase Auth
      const userRecord = await admin.auth().getUser(req.currentUserId);
      const gonderenKullaniciAdi = userRecord.displayName || userRecord.email || 'Kullanıcı';
      // Film önerisini oluştur
      const yeniOneriRef = await db.collection('filmOnerileri').add({
        alanKullaniciId,
        filmId,
        filmAdi,
        filmPosterUrl,
        posterPath: filmPosterUrl, // Frontend ile tam uyum için
        notMetni,
        gonderenKullaniciId: req.currentUserId,
        gonderenKullaniciAdi,
        durum: 'bekliyor',
        olusturulmaTarihi: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date()
      });

      // Film fırlatıldığında alıcıya bildirim gönder
      await db.collection('notifications').add({
        userId: alanKullaniciId,
        type: 'yeni_oneri',
        message: `${gonderenKullaniciAdi} sana yeni bir film fırlattı!`,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        relatedOneriId: yeniOneriRef.id
      });

      res.status(201).json({ success: true });
    } catch (error) {
      console.error('Film önerisi eklenemedi:', error);
      res.status(500).json({ error: 'Film önerisi eklenemedi.' });
    }
  });


// POST /api/oneriler/:oneriId/yanitla
// Bir film önerisine geri yanıt ekler (Geliştirilmiş versiyon).
app.post('/api/oneriler/:oneriId/yanitla', decodeToken, async (req, res) => {
  try {
    const { oneriId } = req.params;
    const { yanitMetni } = req.body;
    
    // Gelen verilerin eksiksiz olduğunu kontrol et
    if (!oneriId || !yanitMetni) {
      return res.status(400).json({ error: 'Öneri ID\'si ve yanıt metni zorunludur.' });
    }

    // İlgili öneri dökümanının referansını al
    const oneriRef = db.collection('filmOnerileri').doc(oneriId);
    
    // Dökümanın veritabanında var olup olmadığını kontrol et
    const doc = await oneriRef.get();
    if (!doc.exists) {
      console.error(`HATA: Yanıtlanacak öneri bulunamadı. ID: ${oneriId}`);
      return res.status(404).json({ error: 'Güncellenecek öneri bulunamadı.' });
    }

    // Dökümanı 'geriYanit' ve 'durum' alanlarıyla güncelle
    await oneriRef.update({
      geriYanit: yanitMetni,
      durum: 'yanitlandi'
    });

    // Yanıt verildiğinde orijinal göndericiye bildirim gönder
    const oneriData = (await oneriRef.get()).data();
    const gonderenKullaniciId = oneriData.gonderenKullaniciId;
    const yanitlayanKullaniciId = req.currentUserId;
    const yanitlayanKullaniciRef = await db.collection('users').doc(yanitlayanKullaniciId).get();
    const yanitlayanKullaniciData = yanitlayanKullaniciRef.data();

    await db.collection('notifications').add({
      userId: gonderenKullaniciId,
      type: 'yeni_yanit',
      message: `${yanitlayanKullaniciData.displayName} sana yeni bir mesaj gönderdi!`,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      relatedOneriId: oneriId
    });

    // Başarı durumunu konsola logla
    console.log(`✅ Öneri ${oneriId} başarıyla yanıtlandı. Yanıt: "${yanitMetni}"`);
    
    res.status(200).json({ message: 'Yanıt başarıyla gönderildi.' });
    

  } catch (error) {
    // Hata durumunu detaylı bir şekilde konsola logla
    console.error(`HATA: Öneri ${req.params.oneriId} yanıtlanırken bir sorun oluştu:`, error);
    
    res.status(500).json({ error: 'Sunucu hatası. Yanıt gönderilemedi.' });
  }
});




app.get('/api/users/:userId/gelen-yanitlar', decodeToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.currentUserId !== userId) {
      return res.status(403).json({ error: 'Bu bilgilere erişim yetkiniz yok.' });
    }

    const onerilerRef = db.collection('filmOnerileri');
    const snapshot = await onerilerRef
      .where('gonderenKullaniciId', '==', userId)
      .where('durum', '==', 'yanitlandi')
      .orderBy('olusturulmaTarihi', 'desc')
      .get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    // Yanıtları ve yanıtı yazan kullanıcıların bilgilerini birleştir
    const yanitlarPromise = snapshot.docs.map(async (doc) => {
      const oneriData = doc.data();
      const alanKullaniciRef = db.collection('users').doc(oneriData.alanKullaniciId);
      const alanKullaniciDoc = await alanKullaniciRef.get();

      let alanKullaniciData = { displayName: 'Bilinmeyen Kullanıcı', avatar: null };
      if (alanKullaniciDoc.exists) {
        alanKullaniciData = {
          displayName: alanKullaniciDoc.data().displayName,
          avatar: alanKullaniciDoc.data().avatar
        };
      }

      // DEBUG: Kullanıcı avatarı ve displayName logu
      console.log('[YANIT KULLANICI]', {
        alanKullaniciId: oneriData.alanKullaniciId,
        displayName: alanKullaniciData.displayName,
        avatar: alanKullaniciData.avatar
      });

      return {
        id: doc.id,
        ...oneriData,
        alanKullanici: alanKullaniciData // Yanıtı yazan kullanıcının bilgilerini ekle
      };
    });

    const yanitlar = await Promise.all(yanitlarPromise);
    res.status(200).json(yanitlar);

  } catch (error) {
    console.error('Gelen yanıtlar alınırken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});




app.get('/api/users/:userId/film-onerileri', decodeToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Güvenlik: İstek atan kullanıcının, sadece kendi önerilerini isteyebileceğinden emin ol.
    if (req.currentUserId !== userId) {
      return res.status(403).json({ error: 'Bu bilgilere erişim yetkiniz yok.' });
    }
    const onerilerRef = db.collection('filmOnerileri');
    const snapshot = await onerilerRef
      .where('alanKullaniciId', '==', userId)
      .where('durum', '==', 'bekliyor')
      .orderBy('olusturulmaTarihi', 'desc') // En yeni öneriler en üstte
      .get();
    if (snapshot.empty) {
      return res.status(200).json([]);
    }
    const oneriler = snapshot.docs.map(doc => ({
      id: doc.id, // Firestore döküman ID'sini de ekliyoruz, bu önemli!
      ...doc.data()
    }));

    // Sonucu JSON olarak React uygulamasına gönder.
    res.status(200).json(oneriler);
  } catch (error) {
    console.error('Film önerileri alınırken bir hata oluştu:', error);
    res.status(500).json({ error: 'Sunucu hatası. Film önerileri alınamadı.' });
  }
});


app.post('/api/oneriler/:oneriId/listeye-ekle', decodeToken, async (req, res) => {
  try {
    const { oneriId } = req.params;
    const { filmId, filmAdi, filmPosterUrl } = req.body; // React'ten bu bilgileri alacağız
    const userId = req.currentUserId;

    // 1. Filmi kullanıcının 'izlemeListesi' koleksiyonuna ekle
    const izlemeListesiRef = db.collection('users').doc(userId).collection('izlemeListesi');
    await izlemeListesiRef.doc(String(filmId)).set({
      filmId: filmId,
      filmAdi: filmAdi,
      filmPosterUrl: filmPosterUrl,
      eklenmeTarihi: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Başarılı ekleme sonrası, önerinin durumunu 'listeye_eklendi' olarak güncelle
    const oneriRef = db.collection('filmOnerileri').doc(oneriId);
    await oneriRef.update({ durum: 'listeye_eklendi' });

    res.status(200).json({ message: 'Film izleme listesine başarıyla eklendi.' });
  } catch (error) {
    console.error('Film izleme listesine eklenirken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası. Film eklenemedi.' });
  }
});


// POST /api/oneriler/:oneriId/reddet
// Bir film önerisini reddeder (durumunu 'reddedildi' olarak günceller).
app.post('/api/oneriler/:oneriId/reddet', decodeToken, async (req, res) => {
  try {
    const { oneriId } = req.params;
    
    // Önerinin durumunu güncelle
    const oneriRef = db.collection('filmOnerileri').doc(oneriId);
    await oneriRef.update({ durum: 'reddedildi' });
    
    res.status(200).json({ message: 'Öneri başarıyla reddedildi.' });
  } catch (error) {
    console.error('Öneri reddedilirken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası. Öneri reddedilemedi.' });
  }
});


// POST /api/oneriler/:oneriId/tesekkur-et
// Bir öneri için teşekkür eder (şimdilik sadece durumunu 'okundu' yapar).
// Daha sonra buraya bir bildirim sistemi eklenebilir.
app.post('/api/oneriler/:oneriId/tesekkur-et', decodeToken, async (req, res) => {
  try {
    const { oneriId } = req.params;

    // Önerinin durumunu 'okundu' olarak güncelle
    const oneriRef = db.collection('filmOnerileri').doc(oneriId);
    await oneriRef.update({ durum: 'okundu' });

    res.status(200).json({ message: 'Teşekkür edildi.' });
  } catch (error) {
    console.error('Teşekkür edilirken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});


// Main recommendation endpoint
app.post('/api/get-recommendations', async (req, res) => {
  try {
    // YENİ: req.body'den 'excludedTitles' yerine 'history' alıyoruz.
    // Varsayılan olarak boş bir dizi atamak, olası hataları engeller.
    const { message, history = [] } = req.body;

    // YENİ: Gelen verinin doğruluğunu kontrol etmek için hata ayıklama logları.
    console.log("--- YENİ İSTEK GELDİ ---");
    console.log("SON MESAJ:", message);
    console.log("TÜM GEÇMİŞ:", JSON.stringify(history, null, 2));
    // İstekte mesaj yoksa hata döndür
    if (!message) {
      return res.status(400).json({ error: 'Mesaj gerekli' });
    }
    const formattedHistory = history
      .map(msg => {
        const prefix = msg.isUser ? "Kullanıcı:" : "AI:";
        return `${prefix} ${msg.content || ''}`;
      })
      .join("\n");


    // Create enhanced CinePop prompt with intelligent mode detection
    const prompt = `
### KİMLİK VE GÖREV ###
Sen, "CinePop" adında, sohbetin geçmişini hatırlayan ve diyalog kurarak en iyi film önerilerini sunan bir yapay zeka film uzmanısın. Klişelerden kaçınır, beklenmedik bağlantılar kurar ve her önerini bir sanat küratörü titizliğiyle yaparsın.

### TEMEL PRENSİPLER ###

1.  **Hafıza ve Bağlam (EN ÖNEMLİ PRENSİP):** Senin birincil görevin, sana verilen "ÖNCEKİ KONUŞMA GEÇMİŞİ"ni bir bütün olarak anlamaktır. Kullanıcının yeni isteğini, bu geçmişin bir devamı olarak değerlendir.
    *   **Örnek:** Eğer kullanıcı daha önce "karanlık film" demişse ve yeni mesajında "yalnızlık teması" diyorsa, artık senin görevin "hem karanlık hem de yalnızlık temasını işleyen" filmleri düşünmektir.
    *   **Kural:** Kullanıcının daha önce cevapladığı bir soruyu veya verdiği bir bilgiyi ASLA unutma ve aynı soruyu tekrar sorma.

2.  **Bütüncül Analiz:** Hafızadan gelen bilgilerle kullanıcının yeni isteğindeki TÜM ipuçlarını bir bütün olarak ele al. Bir kritere diğerinden daha fazla ağırlık verme. Amacın, tüm şartları sağlayan filmleri bulmaktır.

3.  **Geniş Kapsam:** Kullanıcı açıkça "sadece sinema filmi" belirtmediği sürece, "film" kelimesini geniş anlamda yorumla. Önerilerin; sinema filmleri, TV dizileri, mini diziler, animasyonlar ve çizgi filmleri kapsayabilir.

4.  **Katı JSON Çıktısı:** Ne olursa olsun, cevabın her zaman ve sadece aşağıda belirtilen JSON formatlarında bir nesne olmalıdır.


### ANA GÖREV: KARAR MEKANİZMASI ###
Kullanıcının isteğini analiz et ve aşağıdaki 3 MOD'dan hangisine uyduğuna karar ver.

1.  **Olasılık Listesi Modu:** Kullanıcı, belirsiz veya spesifik ipuçları vererek (ör: "bir adam sürekli aynı günü yaşıyordu...", "hani bir film vardı sonunda her şey rüyaydı...") aklındaki bir veya birkaç yapımı bulmaya çalışıyorsa bu moda geç.
2.  **Liste Önerme Modu:** Kullanıcı genel bir istekte bulunuyorsa (ör: "bana David Fincher filmleri gibi gerilim filmleri öner", "bu akşam kafa yormayan bir komedi arıyorum") bu moda geç.
3.  **Belirsizlik Modu:** Kullanıcının isteği bir öneri yapmak için çok genel veya belirsizse (ör: "film öner") bu moda geçerek daha fazla bilgi iste.
---
MOD 1: OLASILIK LİSTESİ MODU (TAHMİN LİSTESİ)
Amaç: Kullanıcının verdiği ipuçlarına uyan tüm olası yapımları bir liste halinde sunmak. Tek bir doğru cevap varmış gibi davranma.
İşleyiş: Verdiği ipuçlarına uyan 1'den fazla yapım bul. Bu yapımları, ipuçlarına uyma olasılığı en yüksek olandan başlayarak sırala.
Örnek Çıktı:
{
  "summaryText": "Zaman döngüsü temalı komedi filmleri harikadır! Verdiğiniz ipuçları aklıma birkaç klasik ve modern örnek getirdi. İşte en olası tahminlerim:",
  "recommendations": [
    {
      "title": "Groundhog Day",
      "year": 1993,
      "reason": "Bu, türün en bilinen klasiğidir. Bill Murray'in canlandırdığı bir hava durumu spikeri, aynı günü tekrar tekrar yaşar."
    },
    {
      "title": "Palm Springs",
      "year": 2020,
      "reason": "Daha modern bir yorum olan bu filmde, bir düğünde tanışan iki kişi aynı zaman döngüsüne hapsolur. Komedi ve romantizmi birleştirir."
    },
    {
      "title": "Edge of Tomorrow",
      "year": 2014,
      "reason": "Bu bir komediden çok aksiyon-bilim kurgu olsa da, Tom Cruise'un canlandırdığı karakterin aynı günü mizahi bir çaresizlikle tekrar tekrar yaşaması nedeniyle aklınıza bu film de gelmiş olabilir."
    }
  ]
}

MOD 2: LİSTE ÖNERME MODU (KÜRATÖR MODU)
Amaç: Kullanıcının zevkine ve tüm kriterlerine uygun, özenle seçilmiş, en az 5 yapımdan oluşan bir seçki sunmak.
İşleyiş: "Bütüncül Analiz" ve "Geniş Kapsam" prensiplerine sıkı sıkıya bağlı kal. Kullanıcının belirttiği tüm kriterleri eksiksiz olarak karşılayan yapımlar seç.
Örnek Çıktı:
{
  "summaryText": "Elbette! Hem başrolünde güçlü bir sarışın kadın karakterin olduğu hem de aldatma ve ihanet temasını merkezine alan, farklı türlerden etkileyici filmleri sizin için derledim:",
  "recommendations": [
    { "title": "Gone Girl", "year": 2014, "reason": "Rosamund Pike'ın canlandırdığı Amy Dunne karakteri, kocasının onu aldattığını öğrendikten sonra karmaşık bir intikam planı kurar. Bu, istediğiniz temaya tam olarak uyan modern bir gerilim klasiğidir." },
    { "title": "The Other Woman", "year": 2014, "reason": "Cameron Diaz'ın başrolde olduğu bu komedi filminde, üç kadın aynı adam tarafından aldatıldıklarını fark eder ve intikam için birleşirler." },
    { "title": "Unfaithful", "year": 2002, "reason": "Bu filmde Diane Lane'in canlandırdığı karakter aldatan taraf olsa da, ihanet ve sonuçları üzerine yoğunlaşan, sarışın bir kadın başrolün merkezde olduğu güçlü bir dramadır." },
    { "title": "Blue Jasmine", "year": 2013, "reason": "Cate Blanchett'in Oscar kazandığı bu rolde, zengin kocasının onu aldatması ve tüm servetini kaybetmesiyle hayatı altüst olan bir kadını canlandırır." },
    { "title": "The First Wives Club", "year": 1996, "reason": "Goldie Hawn'ın da aralarında bulunduğu üç kadının, kendilerini daha genç kadınlar için terk eden kocalarından intikam almalarını konu alan eğlenceli bir komedi klasiğidir." }
  ]
}

MOD 3: BELİRSİZLİK MODU (YARDIMCI MOD)
Amaç: Kullanıcıya en iyi öneriyi yapabilmek için gerekli olan ek bilgiyi istemek.
Örnek Çıktı:
{
  "status": "clarification",
  "question": "Harika bir film bulmanıza yardımcı olmayı çok isterim! Şu an nasıl bir moddasınız? Sizi koltuğunuza bağlayacak bir aksiyon mu, güldürecek bir komedi mi, yoksa zihninizi zorlayacak bir gizem mi arıyorsunuz?"
}
---
KULLANICI GİRDİSİ ANALİZİ
---



### ÖNCEKİ KONUŞMA GEÇMİŞİ ###
${formattedHistory}

### KULLANICININ YENİ İSTEĞİ ###
${message}
 
---
NİHAİ TALİMAT
---
Yukarıdaki **geçmişi ve yeni isteği** bir bütün olarak analiz et. Hangi moda gireceğine karar ver ve çıktını SADECE VE SADECE o mod için belirtilen JSON formatında, başka hiçbir ek metin olmadan döndür.
`;

    // Debug log - istek bilgilerini logla
    console.log('🎬 Film önerisi isteği alındı:');
    console.log('- Mesaj:', message);
    console.log('- Prompt uzunluğu:', prompt.length);

    // Get recommendations from Gemini 2.0 using direct API call
    const geminiResponse = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': process.env.GEMINI_API_KEY
        }
      }
    );
    
    const text = geminiResponse.data.candidates[0].content.parts[0].text;
    console.log('🤖 Gemini 2.0 yanıtı alındı, uzunluk:', text.length);

    // Parse the JSON response
    let parsedResponse;
try {
  // === GÜÇLENDİRİLMİŞ TEMİZLEME ADIMI ===
  // 1. Yanıt metninde ilk açılan '{' karakterini bul.
  const firstBraceIndex = text.indexOf('{');
  // 2. Yanıt metninde son kapanan '}' karakterini bul.
  const lastBraceIndex = text.lastIndexOf('}');

  // 3. Eğer her ikisi de bulunduysa, sadece bu aralıktaki metni al.
  if (firstBraceIndex !== -1 && lastBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
    const jsonString = text.substring(firstBraceIndex, lastBraceIndex + 1);
    
    // Şimdi JSON.parse işlemini bu temizlenmiş ve izole edilmiş metinle dene.
    parsedResponse = JSON.parse(jsonString);

  } else {
    // Eğer metin içinde geçerli bir JSON nesnesi başlangıcı/bitişi yoksa, hata fırlat.
    throw new Error("Yanıt metninde geçerli bir JSON nesnesi bulunamadı.");
  }
  
} catch (parseError) {
  console.error('❌ Gemini yanıtı parse edilemedi:', parseError.message);
  console.log('--- Hatalı Ham Yanıt ---');
  console.log(text); // Hatanın kaynağını görmek için orijinal metni logla
  console.log('------------------------');
  return res.status(500).json({ 
    error: 'AI yanıtı işlenirken hata oluştu. Yanıt geçerli bir formatta değil.',
    aiResponse: text
  });
}

// ++++++++++++++++ YENİ VE DOĞRU MANTIK BU BLOK ++++++++++++++++
// ADIM 1: Gelen yanıt bir AÇIKLAMA İSTEĞİ mi diye kontrol et.
if (parsedResponse.status === 'clarification') {
  
  console.log('✅ Gemini bir açıklama istedi (Belirsizlik Modu). Yanıt ön yüze gönderiliyor.');
  // Bu bir hata değil, beklenen bir durum. 
  // Bu JSON'u olduğu gibi (HTTP 200 OK status ile) ön yüze (frontend) gönder.
  // Ön yüz bu yanıtı alıp kullanıcıya soruyu gösterecek.
  return res.json(parsedResponse);

} 
// ADIM 2: Eğer açıklama isteği değilse, o zaman bir FİLM LİSTESİ mi diye kontrol et.
else if (parsedResponse.recommendations && Array.isArray(parsedResponse.recommendations)) {
  
  console.log('✅ Gemini yanıtı parse edildi, film sayısı:', parsedResponse.recommendations.length);

  // Search each movie on TMDB
  const moviePromises = parsedResponse.recommendations.map(movieRecommendation => 
    searchMovieOnTMDB(movieRecommendation)
  );
  const movieResults = await Promise.all(moviePromises);

  // Filter out null results
  const validMovies = movieResults.filter(movie => movie !== null);

  console.log('🎭 TMDB araması tamamlandı, bulunan film sayısı:', validMovies.length);

  // Bu da beklenen bir durum, film listesini ön yüze gönder.
  res.json({
    message: parsedResponse.summaryText || `İşte "${message}" isteğinize göre seçtiğim özel filmler:`,
    movies: validMovies,
    originalQuery: message
  });

} 
// ADIM 3: Eğer ne açıklama ne de geçerli film listesi ise, o zaman GERÇEKTEN bir hata vardır.
else {
  
  console.error('❌ Gemini geçersiz veya beklenmeyen bir format döndürdü:', parsedResponse);
  return res.status(500).json({ 
    error: 'AI geçersiz veya beklenmeyen bir format döndürdü',
    aiResponse: text
  });

}
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  } catch (error) {
    // Kapsamlı hata loglama
    console.error('--- RECOMMENDATION ENDPOINT ERROR ---');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Request Body:', req.body);
    
    // Eğer Axios hatası ise, daha detaylı bilgi
    if (error.response) {
      console.error('HTTP Response Status:', error.response.status);
      console.error('HTTP Response Data:', error.response.data);
    }
    
    // Eğer Gemini API hatası ise
    if (error.message && error.message.includes('Gemini')) {
      console.error('Gemini API Error Details:', error);
    }
    
    console.error('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('--- END OF ERROR REPORT ---');
    
    res.status(500).json({ 
      error: 'Sunucu hatası oluştu',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CinePop Backend is running' });
});

// Test endpoint for TMDB connection
app.get('/api/test-tmdb', async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR'
      }
    });
    res.json({ status: 'TMDB connection successful', data: response.data.results.slice(0, 3) });
  } catch (error) {
    res.status(500).json({ status: 'TMDB connection failed', error: error.message });
  }
});

// List available Gemini models
app.get('/api/list-models', async (req, res) => {
  try {
    const models = await genAI.listModels();
    res.json({ status: 'Success', models: models });
  } catch (error) {
    res.status(500).json({ status: 'Failed to list models', error: error.message });
  }
});

// Test endpoint for Gemini models with direct API call
app.get('/api/test-gemini-direct', async (req, res) => {
  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
      {
        contents: [
          {
            parts: [
              {
                text: "Hello, test message from CinePop backend"
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': process.env.GEMINI_API_KEY
        }
      }
    );
    
    res.json({ 
      status: 'Gemini 2.0 connection successful', 
      response: response.data.candidates[0].content.parts[0].text 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Gemini 2.0 connection failed', 
      error: error.response?.data || error.message 
    });
  }
});

// Test endpoint for Gemini models
app.get('/api/test-gemini', async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello, test message");
    const response = await result.response;
    const text = response.text();
    res.json({ status: 'Gemini connection successful', response: text });
  } catch (error) {
    res.status(500).json({ status: 'Gemini connection failed', error: error.message });
  }
});

// Get movie genres
app.get('/api/genres', async (req, res) => {
  try {
    console.log('🎭 Fetching genres from TMDB...');
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('🚨 Genres API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code
    });
    res.status(500).json({ status: 'Failed to fetch genres', error: error.message });
  }
});

// Get popular movies
app.get('/api/movies/popular', async (req, res) => {
  try {
    console.log('🎬 Fetching popular movies from TMDB...');
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        page: req.query.page || 1
      }
    });
    
    const movies = response.data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      backdropPath: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
      releaseDate: movie.release_date,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count
    }));

    res.json({
      ...response.data,
      results: movies
    });
  } catch (error) {
    console.error('🚨 Popular movies API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code
    });
    res.status(500).json({ status: 'Failed to fetch popular movies', error: error.message });
  }
});

// Get top rated movies
app.get('/api/movies/top-rated', async (req, res) => {
  try {
    console.log('⭐ Fetching top rated movies from TMDB...');
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/movie/top_rated`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        page: req.query.page || 1
      }
    });
    
    const movies = response.data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      backdropPath: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
      releaseDate: movie.release_date,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count
    }));

    res.json({
      ...response.data,
      results: movies
    });
  } catch (error) {
    console.error('🚨 Top rated movies API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code
    });
    res.status(500).json({ status: 'Failed to fetch top rated movies', error: error.message });
  }
});

// Get upcoming movies
app.get('/api/movies/upcoming', async (req, res) => {
  try {
    console.log('🎯 Fetching upcoming movies from TMDB...');
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/movie/upcoming`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        page: req.query.page || 1
      }
    });
    
    const movies = response.data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      backdropPath: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
      releaseDate: movie.release_date,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count
    }));

    res.json({
      ...response.data,
      results: movies
    });
  } catch (error) {
    console.error('🚨 Upcoming movies API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code
    });
    res.status(500).json({ status: 'Failed to fetch upcoming movies', error: error.message });
  }
});

// Discover movies by genre
app.get('/api/movies/by-genre/:genreId', async (req, res) => {
  try {
    const { genreId } = req.params;
    console.log(`🎨 Fetching movies for genre ${genreId} from TMDB...`);
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        with_genres: genreId,
        page: req.query.page || 1,
        sort_by: 'popularity.desc'
      }
    });
    
    const movies = response.data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      backdropPath: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
      releaseDate: movie.release_date,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count
    }));

    res.json({
      ...response.data,
      results: movies
    });
  } catch (error) {
    console.error('🚨 Movies by genre API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code,
      genreId: req.params.genreId
    });
    res.status(500).json({ status: 'Failed to fetch movies by genre', error: error.message });
  }
});

// =================== TV SHOWS ENDPOINTS ===================

// Get popular TV shows
app.get('/api/tv/popular', async (req, res) => {
  try {
    console.log('📺 Fetching popular TV shows from TMDB...');
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/tv/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        page: req.query.page || 1
      }
    });
    
    const tvShows = response.data.results.map(show => ({
      id: show.id,
      title: show.name, // TV shows use 'name' instead of 'title'
      originalTitle: show.original_name,
      overview: show.overview,
      posterPath: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
      backdropPath: show.backdrop_path ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}` : null,
      releaseDate: show.first_air_date, // TV shows use 'first_air_date'
      voteAverage: show.vote_average,
      voteCount: show.vote_count,
      media_type: 'tv'
    }));

    res.json({
      ...response.data,
      results: tvShows
    });
  } catch (error) {
    console.error('🚨 Popular TV shows API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code
    });
    res.status(500).json({ status: 'Failed to fetch popular TV shows', error: error.message });
  }
});

// Get top rated TV shows
app.get('/api/tv/top-rated', async (req, res) => {
  try {
    console.log('⭐ Fetching top rated TV shows from TMDB...');
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/tv/top_rated`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        page: req.query.page || 1
      }
    });
    
    const tvShows = response.data.results.map(show => ({
      id: show.id,
      title: show.name,
      originalTitle: show.original_name,
      overview: show.overview,
      posterPath: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
      backdropPath: show.backdrop_path ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}` : null,
      releaseDate: show.first_air_date,
      voteAverage: show.vote_average,
      voteCount: show.vote_count,
      media_type: 'tv'
    }));

    res.json({
      ...response.data,
      results: tvShows
    });
  } catch (error) {
    console.error('🚨 Top rated TV shows API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code
    });
    res.status(500).json({ status: 'Failed to fetch top rated TV shows', error: error.message });
  }
});

// Get airing today TV shows
app.get('/api/tv/airing-today', async (req, res) => {
  try {
    console.log('📺 Fetching airing today TV shows from TMDB...');
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/tv/airing_today`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        page: req.query.page || 1
      }
    });
    
    const tvShows = response.data.results.map(show => ({
      id: show.id,
      title: show.name,
      originalTitle: show.original_name,
      overview: show.overview,
      posterPath: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
      backdropPath: show.backdrop_path ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}` : null,
      releaseDate: show.first_air_date,
      voteAverage: show.vote_average,
      voteCount: show.vote_count,
      media_type: 'tv'
    }));

    res.json({
      ...response.data,
      results: tvShows
    });
  } catch (error) {
    console.error('🚨 Airing today TV shows API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code
    });
    res.status(500).json({ status: 'Failed to fetch airing today TV shows', error: error.message });
  }
});

// Get on the air TV shows
app.get('/api/tv/on-the-air', async (req, res) => {
  try {
    console.log('📺 Fetching on the air TV shows from TMDB...');
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/tv/on_the_air`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        page: req.query.page || 1
      }
    });
    
    const tvShows = response.data.results.map(show => ({
      id: show.id,
      title: show.name,
      originalTitle: show.original_name,
      overview: show.overview,
      posterPath: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
      backdropPath: show.backdrop_path ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}` : null,
      releaseDate: show.first_air_date,
      voteAverage: show.vote_average,
      voteCount: show.vote_count,
      media_type: 'tv'
    }));

    res.json({
      ...response.data,
      results: tvShows
    });
  } catch (error) {
    console.error('🚨 On the air TV shows API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code
    });
    res.status(500).json({ status: 'Failed to fetch on the air TV shows', error: error.message });
  }
});

// Discover TV shows by genre
app.get('/api/tv/by-genre/:genreId', async (req, res) => {
  try {
    const { genreId } = req.params;
    console.log(`🎨 Fetching TV shows for genre ${genreId} from TMDB...`);
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/discover/tv`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        with_genres: genreId,
        page: req.query.page || 1,
        sort_by: 'popularity.desc'
      }
    });
    
    const tvShows = response.data.results.map(show => ({
      id: show.id,
      title: show.name,
      originalTitle: show.original_name,
      overview: show.overview,
      posterPath: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
      backdropPath: show.backdrop_path ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}` : null,
      releaseDate: show.first_air_date,
      voteAverage: show.vote_average,
      voteCount: show.vote_count,
      media_type: 'tv'
    }));

    res.json({
      ...response.data,
      results: tvShows
    });
  } catch (error) {
    console.error('🚨 TV shows by genre API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code,
      genreId: req.params.genreId
    });
    res.status(500).json({ status: 'Failed to fetch TV shows by genre', error: error.message });
  }
});

// Get TV genres
app.get('/api/tv/genres', async (req, res) => {
  try {
    console.log('🎭 Fetching TV genres from TMDB...');
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/genre/tv/list`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('🚨 TV Genres API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code
    });
    res.status(500).json({ status: 'Failed to fetch TV genres', error: error.message });
  }
});

// =================== WATCHLIST ENDPOINTS ===================

// Get user's watchlist
app.get('/api/user/:userId/watchlist', (req, res) => {
  const { userId } = req.params;
  console.log(`📋 Getting watchlist for user: ${userId}`);
  
  // For now, return empty array - implement with your database
  res.json({ watchlist: [] });
});

// Add movie to watchlist
app.post('/api/user/:userId/watchlist', async (req, res) => {
  try {
    const { userId } = req.params;
    const movie = req.body;
    
    console.log(`➕ Adding movie to watchlist:`, {
      userId,
      movieId: movie.id,
      movieTitle: movie.title
    });
    
    // For now, just return success - implement with your database
    res.json({ 
      success: true, 
      message: 'Movie added to watchlist',
      movie: movie
    });
  } catch (error) {
    console.error('❌ Error adding movie to watchlist:', error);
    res.status(500).json({ 
      error: 'Failed to add movie to watchlist',
      details: error.message
    });
  }
});

// Remove movie from watchlist
app.delete('/api/user/:userId/watchlist/:movieId', async (req, res) => {
  try {
    const { userId, movieId } = req.params;
    
    console.log(`❌ Removing movie from watchlist:`, {
      userId,
      movieId
    });
    
    // For now, just return success - implement with your database
    res.json({ 
      success: true, 
      message: 'Movie removed from watchlist',
      movieId: movieId
    });
  } catch (error) {
    console.error('❌ Error removing movie from watchlist:', error);
    res.status(500).json({ 
      error: 'Failed to remove movie from watchlist',
      details: error.message
    });
  }
});

// =================== SEARCH ENDPOINTS ===================

// Search movies
app.get('/api/search', async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Arama sorgusu gerekli' });
    }
    
    console.log(`🔍 Multi-searching for query: "${query}" (page: ${page})`);
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR',
        query: query,
        page: page,
        include_adult: false
      }
    });
    
    // Sonuçları media_type'a göre işle
    const results = response.data.results.map(item => {
      const baseData = {
        id: item.id,
        media_type: item.media_type,
        popularity: item.popularity
      };

      if (item.media_type === 'movie') {
        return {
          ...baseData,
          title: item.title,
          originalTitle: item.original_title,
          overview: item.overview,
          posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
          releaseDate: item.release_date,
          voteAverage: item.vote_average,
          voteCount: item.vote_count
        };
      } else if (item.media_type === 'tv') {
        return {
          ...baseData,
          title: item.name,
          originalTitle: item.original_name,
          overview: item.overview,
          posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
          releaseDate: item.first_air_date,
          voteAverage: item.vote_average,
          voteCount: item.vote_count
        };
      } else if (item.media_type === 'person') {
        return {
          ...baseData,
          name: item.name,
          profilePath: item.profile_path ? `https://image.tmdb.org/t/p/w500${item.profile_path}` : null,
          knownFor: item.known_for ? item.known_for.map(work => ({
            id: work.id,
            title: work.title || work.name,
            media_type: work.media_type,
            releaseDate: work.release_date || work.first_air_date
          })) : [],
          knownForDepartment: item.known_for_department
        };
      }

      return baseData;
    });

    res.json({
      page: response.data.page,
      results: results,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results,
      query: query
    });
  } catch (error) {
    console.error('🚨 Multi-search API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code,
      searchQuery: req.query.query
    });
    res.status(500).json({ status: 'Failed to search', error: error.message });
  }
});

// Get person credits (movies and TV shows)
app.get('/api/person/:personId', async (req, res) => {
  try {
    const { personId } = req.params;
    console.log(`👤 Fetching credits for person ${personId} from TMDB...`);
    console.log('TMDB_API_KEY exists:', !!TMDB_API_KEY);
    
    // Oyuncunun bilgilerini al
    const personResponse = await axios.get(`${TMDB_BASE_URL}/person/${personId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR'
      }
    });

    // Oyuncunun filmografisini al
    const creditsResponse = await axios.get(`${TMDB_BASE_URL}/person/${personId}/combined_credits`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR'
      }
    });

    // Cast listesini işle, temizle ve akıllı sıralama uygula
    const credits = creditsResponse.data.cast
      // Önce veriyi temizle - tarih alanı olmayan girdileri filtrele
      .filter(item => {
        const hasDate = (item.media_type === 'movie' && item.release_date) || 
                       (item.media_type === 'tv' && item.first_air_date);
        return hasDate;
      })
      // Veriyi dönüştür
      .map(item => {
        const baseData = {
          id: item.id,
          media_type: item.media_type,
          popularity: item.popularity,
          character: item.character,
          order: item.order !== undefined ? item.order : 999 // order yoksa en sona at
        };

        if (item.media_type === 'movie') {
          return {
            ...baseData,
            title: item.title,
            originalTitle: item.original_title,
            overview: item.overview,
            posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
            releaseDate: item.release_date,
            voteAverage: item.vote_average,
            voteCount: item.vote_count
          };
        } else if (item.media_type === 'tv') {
          return {
            ...baseData,
            title: item.name,
            originalTitle: item.original_name,
            overview: item.overview,
            posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
            releaseDate: item.first_air_date,
            voteAverage: item.vote_average,
            voteCount: item.vote_count
          };
        }

        return null;
      })
      .filter(item => item !== null)
      // Akıllı sıralama uygula
      .sort((a, b) => {
        // Önce role göre sırala (düşük order değeri daha önemli - başrol vs yan rol)
        if (a.order < b.order) return -1;
        if (a.order > b.order) return 1;

        // Eğer roller aynıysa, tarihe göre sırala (yeni olan daha önemli)
        const dateA = new Date(a.releaseDate);
        const dateB = new Date(b.releaseDate);
        return dateB - dateA; // En yeni en üstte
      })
      .slice(0, 20); // İlk 20 filmi al

    console.log(`✅ ${credits.length} yapım bulundu ve akıllı sıralama uygulandı (ilk 20 tanesi gösteriliyor)`);

    res.json({
      person: {
        id: personResponse.data.id,
        name: personResponse.data.name,
        profilePath: personResponse.data.profile_path ? `https://image.tmdb.org/t/p/w500${personResponse.data.profile_path}` : null,
        knownForDepartment: personResponse.data.known_for_department
      },
      credits: credits
    });

  } catch (error) {
    console.error('🚨 Person credits API isteği sırasında detaylı hata:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      },
      code: error.code,
      personId: req.params.personId
    });
    res.status(500).json({ status: 'Failed to fetch person credits', error: error.message });
  }
});

// Kullanıcı profil endpoint'i
// Gerçek kullanıcı profili Firestore'dan username ile getirilir
app.get('/api/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ success: false, error: 'Kullanıcı adı gerekli' });
    }
    // Firestore'da usernames koleksiyonundan UID'yi bul
    const normalizedUsername = username.trim().toLowerCase();
    const usernameDoc = await db.collection('usernames').doc(normalizedUsername).get();
    if (!usernameDoc.exists) {
      return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
    }
  const uid = usernameDoc.data().userId;
    // UID ile gerçek kullanıcı dokümanını çek
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
    }
    const userData = userDoc.data();
    // Takipçi ve takip edilen sayıları
    const followers = userData.followers || [];
    const following = userData.following || [];
    // Profil objesi
    const userProfile = {
      id: uid,
      username: userData.username,
      displayName: userData.displayName || userData.username,
      avatar: userData.avatar || `https://ui-avatars.com/api/?name=${userData.username}&background=6366f1&color=fff&size=100`,
      createdAt: userData.createdAt || null,
      updatedAt: userData.updatedAt || null,
      followers,
      following,
      followersCount: followers.length,
      followingCount: following.length
    };
    res.json({ success: true, profile: userProfile });
  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Profil bilgileri alınamadı',
      error: error.message 
    });
  }
});

// Kullanıcı takip bilgilerini getiren endpoint
app.get('/api/users/:userId/follow-stats', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Firestore'dan kullanıcı dokümanını al
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      // Kullanıcı yoksa boş takip bilgileri döndür
      return res.json({
        followersCount: 0,
        followingCount: 0,
        followers: [],
        following: []
      });
    }
    
    const userData = userDoc.data();
    const followers = userData?.followers || [];
    const following = userData?.following || [];
    
    res.json({
      followersCount: followers.length,
      followingCount: following.length,
      followers,
      following
    });
    
  } catch (error) {
    console.error('❌ Follow stats fetch error:', error);
    res.status(500).json({ 
      error: 'Takip bilgileri alınamadı',
      details: error.message 
    });
  }
});

app.delete('/api/notifications/:notificationId', decodeToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.currentUserId;

    const notificationRef = db.collection('notifications').doc(notificationId);
    const doc = await notificationRef.get();

    // Bildirimin var olup olmadığını ve bu kullanıcıya ait olup olmadığını kontrol et
    if (!doc.exists || doc.data().userId !== userId) {
      return res.status(403).json({ error: 'Bu bildirimi silme yetkiniz yok.' });
    }

    // Bildirimi sil
    await notificationRef.delete();
    
    res.status(200).json({ message: 'Bildirim başarıyla silindi.' });
  } catch (error) {
    console.error("Bildirim silinirken hata:", error);
    res.status(500).json({ error: "Sunucu hatası." });
  }
});

// POST /api/notifications/delete-all
// Kullanıcının TÜM bildirimlerini siler.
app.post('/api/notifications/delete-all', decodeToken, async (req, res) => {
  try {
    const userId = req.currentUserId;
    const snapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ message: 'Silinecek bildirim yok.' });
    }

    // Toplu silme işlemi için batch kullan
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.status(200).json({ message: 'Tüm bildirimler silindi.' });
  } catch (error) {
    console.error("Tüm bildirimler silinirken hata:", error);
    res.status(500).json({ error: "Sunucu hatası." });
  }
});

// TAKİPÇİLER LİSTESİNİ GETİRİR


// TAKİPÇİLER LİSTESİNİ GETİRİR
app.get('/api/users/:userId/followers', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 Fetching FOLLOWERS list for user: ${userId}`);
    
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    const followerIds = userDoc.data().followers || [];

    if (followerIds.length === 0) {
      return res.json([]);
    }

    const userPromises = followerIds.map(id => db.collection('users').doc(id).get());
    const userDocs = await Promise.all(userPromises);
    
    const followersList = userDocs
      .map(doc => {
        if (doc.exists) {
          const data = doc.data();
          return {
            id: doc.id,
            username: data.username,
            displayName: data.displayName,
            avatar: data.avatar || null
          };
        }
        return null;
      })
      .filter(Boolean);

    res.json(followersList);
  } catch (error) {
    res.status(500).json({ error: 'Takipçiler listesi alınamadı' });
  }
});


// KULLANICI ADINA GÖRE ARAMA YAPAR
app.get('/api/users/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.json([]);
    }
    const searchQuery = query.trim().toLowerCase();
    
    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('username', '>=', searchQuery)
      .where('username', '<=', searchQuery + '\uf8ff')
      .limit(10)
      .get();
      
    if (snapshot.empty) {
      return res.json([]);
    }

    const users = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      users.push({
        id: doc.id,
        username: data.username,
        displayName: data.displayName,
        avatar: data.avatar || null
      });
    });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcı araması sırasında bir hata oluştu' });
  }
});

// Giriş yapmış kullanıcının bir profili takip edip etmediğini kontrol eden endpoint
app.get('/api/users/:profileUserId/follow-status', decodeToken, async (req, res) => {
  try {
    const { profileUserId } = req.params;
    const currentUserId = req.currentUserId;
    
    // Kendi profili için false döndür
    if (currentUserId === profileUserId) {
      return res.json({ isFollowing: false });
    }
    
    // Mevcut kullanıcının following listesini kontrol et
    const currentUserRef = db.collection('users').doc(currentUserId);
    const currentUserDoc = await currentUserRef.get();
    
    if (!currentUserDoc.exists) {
      return res.json({ isFollowing: false });
    }
    
    const currentUserData = currentUserDoc.data();
    const following = currentUserData?.following || [];
    const isFollowing = following.includes(profileUserId);
    
    res.json({ isFollowing });
    
  } catch (error) {
    console.error('❌ Follow status check error:', error);
    res.status(500).json({ 
      error: 'Takip durumu kontrol edilemedi',
      details: error.message 
    });
  }
});

// Takip sistemi endpoint'i - Kullanıcı takip etme/çıkarma
app.post('/api/users/:profileUserId/follow', decodeToken, async (req, res) => {
  try {
    const { profileUserId } = req.params;
    const currentUserId = req.currentUserId;

    // Kendisini takip edemez
    if (currentUserId === profileUserId) {
      return res.status(400).json({ 
        error: 'Kendinizi takip edemezsiniz' 
      });
    }

    // Firestore references
    const currentUserRef = db.collection('users').doc(currentUserId);
    const profileUserRef = db.collection('users').doc(profileUserId);

    // Transaction ile her iki dokümanı da güvenli şekilde güncelle
    const result = await db.runTransaction(async (transaction) => {
      // Mevcut kullanıcının dokümanını al
      const currentUserDoc = await transaction.get(currentUserRef);
      const profileUserDoc = await transaction.get(profileUserRef);

      // Kullanıcılar mevcut değilse oluştur
      if (!currentUserDoc.exists) {
        transaction.set(currentUserRef, {
          following: [],
          followers: [],
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      if (!profileUserDoc.exists) {
        transaction.set(profileUserRef, {
          following: [],
          followers: [],
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Mevcut takip durumunu kontrol et
      const currentUserData = currentUserDoc.data() || { following: [] };
      const profileUserData = profileUserDoc.data() || { followers: [] };

      const currentFollowing = currentUserData.following || [];
      const profileFollowers = profileUserData.followers || [];

      const isCurrentlyFollowing = currentFollowing.includes(profileUserId);
      
      if (isCurrentlyFollowing) {
        // Takipten çıkar
        transaction.update(currentUserRef, {
          following: admin.firestore.FieldValue.arrayRemove(profileUserId)
        });
        transaction.update(profileUserRef, {
          followers: admin.firestore.FieldValue.arrayRemove(currentUserId)
        });
        return { action: 'unfollowed', isFollowing: false };
      } else {
        // Takip et
        transaction.update(currentUserRef, {
          following: admin.firestore.FieldValue.arrayUnion(profileUserId)
        });
        transaction.update(profileUserRef, {
          followers: admin.firestore.FieldValue.arrayUnion(currentUserId)
        });
        return { action: 'followed', isFollowing: true };
      }
    });

    console.log(`✅ Follow operation successful: ${currentUserId} ${result.action} ${profileUserId}`);
    
    res.json({
      success: true,
      action: result.action,
      isFollowing: result.isFollowing,
      message: result.action === 'followed' ? 'Kullanıcı takip edildi' : 'Kullanıcı takipten çıkarıldı'
    });

  } catch (error) {
    console.error('❌ Follow operation error:', error);
    res.status(500).json({ 
      error: 'Takip işlemi başarısız',
      details: error.message 
    });
  }
});

// Environment variables kontrolü - server başlangıcında
console.log('🔧 Environment Variables Check:');
console.log('TMDB_API_KEY:', process.env.TMDB_API_KEY ? '✅ Mevcut' : '❌ Eksik');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Mevcut' : '❌ Eksik');
console.log('PORT:', process.env.PORT || 'Default 5000');

// ==============================================
// BENZERSIZ KULLANICI ADI SİSTEMİ - FAZ 1
// ==============================================

// 1. Kullanıcı adı müsaaitlik kontrolü
app.post('/api/auth/check-username', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ 
        error: 'Kullanıcı adı gereklidir',
        available: false 
      });
    }

    // Kullanıcı adını normalize et (küçük harf, trim)
    const normalizedUsername = username.trim().toLowerCase();

    // Minimum uzunluk kontrolü
    if (normalizedUsername.length < 3) {
      return res.status(400).json({ 
        error: 'Kullanıcı adı en az 3 karakter olmalıdır',
        available: false 
      });
    }

    // Geçersiz karakterler kontrolü
    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(normalizedUsername)) {
      return res.status(400).json({ 
        error: 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir',
        available: false 
      });
    }

    console.log(`🔍 Checking username availability: ${normalizedUsername}`);

    // Firestore'da usernames koleksiyonunda kontrol et
    const usernameDoc = await db.collection('usernames').doc(normalizedUsername).get();

    if (usernameDoc.exists) {
      console.log(`❌ Username not available: ${normalizedUsername}`);
      return res.json({ 
        available: false,
        message: 'Bu kullanıcı adı zaten kullanılıyor'
      });
    }

    console.log(`✅ Username available: ${normalizedUsername}`);
    res.json({ 
      available: true,
      message: 'Kullanıcı adı müsait'
    });

  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({ 
      error: 'Kullanıcı adı kontrolü sırasında hata oluştu',
      available: false 
    });
  }
});

// 2. Güçlendirilmiş kayıt endpoint'i
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username, displayName } = req.body;

    // Gerekli alanları kontrol et
    if (!email || !password || !username) {
      return res.status(400).json({ 
        error: 'Email, şifre ve kullanıcı adı gereklidir' 
      });
    }

    // Kullanıcı adını normalize et
    const normalizedUsername = username.trim().toLowerCase();

    // Kullanıcı adı formatını tekrar kontrol et
    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(normalizedUsername) || normalizedUsername.length < 3) {
      return res.status(400).json({ 
        error: 'Geçersiz kullanıcı adı formatı' 
      });
    }

    console.log(`🔄 Starting registration process for: ${email} (@${normalizedUsername})`);

    // Firestore transaction ile atomik işlem
    const result = await db.runTransaction(async (transaction) => {
      // 1. Username hala müsait mi tekrar kontrol et
      const usernameDocRef = db.collection('usernames').doc(normalizedUsername);
      const usernameDoc = await transaction.get(usernameDocRef);

      if (usernameDoc.exists) {
        throw new Error('Bu kullanıcı adı zaten kullanılıyor');
      }

      // 2. Firebase Auth'da kullanıcı oluştur (transaction dışında yapılacak)
      return { normalizedUsername };
    });

    // Firebase Authentication'da kullanıcı oluştur
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName || normalizedUsername,
    });

    console.log(`✅ Firebase user created: ${userRecord.uid}`);

    // 3. Kullanıcı oluşturulduktan sonra username ve profil bilgilerini kaydet
    await db.runTransaction(async (transaction) => {
      const usernameDocRef = db.collection('usernames').doc(result.normalizedUsername);
      const userDocRef = db.collection('users').doc(userRecord.uid);

      // Username rezervasyonu
      transaction.set(usernameDocRef, {
        userId: userRecord.uid,
        email: email,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Kullanıcı profil bilgileri
      transaction.set(userDocRef, {
        username: result.normalizedUsername,
        email: email,
        displayName: displayName || result.normalizedUsername,
        following: [],
        followers: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log(`🎉 Registration completed successfully for @${result.normalizedUsername}`);

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: {
        uid: userRecord.uid,
        email: email,
        username: result.normalizedUsername,
        displayName: displayName || result.normalizedUsername
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Eğer Firebase user oluşturulmuşsa ama Firestore işlemi başarısız olduysa temizle
    if (error.message.includes('kullanıcı adı')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ 
        error: 'Kayıt işlemi sırasında hata oluştu',
        details: error.message 
      });
    }
  }
});

// ==============================================
// END - BENZERSIZ KULLANICI ADI SİSTEMİ
// ==============================================

// ==============================================
// USERNAME TABANLI PROFİL SİSTEMİ
// ==============================================

// Username ile kullanıcı profili getirme
app.get('/api/profile/by-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    console.log(`🔍 Fetching profile for username: ${username}`);
    
    // Username'i normalize et
    const normalizedUsername = username.trim().toLowerCase();
    
    // Önce usernames koleksiyonundan userId'yi bul
    const usernameDoc = await db.collection('usernames').doc(normalizedUsername).get();
    
    if (!usernameDoc.exists) {
      console.log(`❌ Username not found: ${normalizedUsername}`);
      return res.status(404).json({ 
        error: 'Kullanıcı bulunamadı',
        message: `"${username}" kullanıcı adlı kullanıcı bulunamadı`
      });
    }
    
    const usernameData = usernameDoc.data();
    const userId = usernameData.userId;
    
    // userId ile users koleksiyonundan profil bilgilerini al
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log(`❌ User document not found for userId: ${userId}`);
      return res.status(404).json({ 
        error: 'Kullanıcı profili bulunamadı' 
      });
    }
    
    const userData = userDoc.data();
    
    // Herkese açık profil bilgilerini oluştur
    const profileData = {
      id: userId,
      username: normalizedUsername,
      displayName: userData.displayName || normalizedUsername,
      avatar: userData.avatar || null,
      following: userData.following || [],
      followers: userData.followers || [],
      followersCount: (userData.followers || []).length,
      followingCount: (userData.following || []).length,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    };
    
    console.log(`✅ Profile found for @${normalizedUsername}`);
    res.json({
      success: true,
      profile: profileData
    });

  } catch (error) {
    console.error('Get profile by username error:', error);
    res.status(500).json({ 
      error: 'Profil bilgileri alınırken hata oluştu',
      details: error.message 
    });
  }
});
// Bir kullanıcının takip ETTİĞİ kişilerin listesini getirir  gemını ekledı
app.get('/api/users/:userId/following', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 Fetching FOLLOWING list for user: ${userId}`);

    // 1. Adım: Kullanıcının 'following' dizisindeki ID'leri al
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    const followingIds = userDoc.data().following || [];

    // Eğer kimseyi takip etmiyorsa, boş dizi döndür
    if (followingIds.length === 0) {
      return res.json([]);
    }

    // 2. Adım: Bu ID'lere karşılık gelen kullanıcıların profil bilgilerini çek
    const userPromises = followingIds.map(id => db.collection('users').doc(id).get());
    const userDocs = await Promise.all(userPromises);
    
    const followingList = userDocs.map(doc => {
      if (doc.exists) {
        const data = doc.data();
        return {
          id: doc.id,
          username: data.username,
          displayName: data.displayName,
          avatar: data.avatar || null
        };
      }
      return null; // Eğer bir sebepten kullanıcı bulunamazsa null döndür
    }).filter(Boolean); // Null değerleri listeden temizle

    res.json(followingList);

  } catch (error) {
    console.error(`Error fetching following list for ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Takip edilenler listesi alınamadı' });
  }
});

// Bir kullanıcının TAKİPÇİLERİNİN listesini getirir
app.get('/api/users/:userId/followers', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 Fetching FOLLOWERS list for user: ${userId}`);

    // 1. Adım: Kullanıcının 'followers' dizisindeki ID'leri al
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    const followerIds = userDoc.data().followers || [];

    if (followerIds.length === 0) {
      return res.json([]);
    }

    // 2. Adım: Bu ID'lere karşılık gelen kullanıcıların profil bilgilerini çek
    const userPromises = followerIds.map(id => db.collection('users').doc(id).get());
    const userDocs = await Promise.all(userPromises);
    
    const followersList = userDocs.map(doc => {
      if (doc.exists) {
        const data = doc.data();
        return {
          id: doc.id,
          username: data.username,
          displayName: data.displayName,
          avatar: data.avatar || null
        };
      }
      return null;
    }).filter(Boolean);

    res.json(followersList);

  } catch (error) {
    console.error(`Error fetching followers list for ${req.params.userId}:`, error);
    res.status(500).json({ error: 'Takipçiler listesi alınamadı' });
  }
});

// ==============================================
// END - USERNAME TABANLI PROFİL SİSTEMİ
// ==============================================
// BİLDİRİMLER ENDPOINTİ
// ==============================================
// Kullanıcının bildirimlerini getirir

app.get('/api/notifications', decodeToken, async (req, res) => {
    try {
        const userId = req.currentUserId; // decodeToken'dan gelen güvenli ID
        const snapshot = await db.collection('notifications')
            .where('userId', '==', userId) // <-- Doğru alan adı: 'userId'
            .where('isRead', '==', false)
            .orderBy('createdAt', 'desc')
            .get();
        
        const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(notifications);
    } catch (error) {
        console.error("Bildirimler alınamadı:", error);
        res.status(500).json({ error: "Sunucu hatası." });
    }
});


app.post('/api/notifications/mark-as-read', decodeToken, async (req, res) => {
    try {
        const userId = req.currentUserId;
        const snapshot = await db.collection('notifications')
            .where('userId', '==', userId)
            .where('isRead', '==', false)
            .get();

        if (snapshot.empty) {
            return res.status(200).json({ message: 'Okunacak yeni bildirim yok.' });
        }

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { isRead: true });
        });
        await batch.commit();

        res.status(200).json({ message: 'Tüm bildirimler okundu olarak işaretlendi.' });
    } catch (error) {
        console.error("Bildirimler okunurken hata:", error);
        res.status(500).json({ error: "Sunucu hatası." });
    }
});

// ==============================================
// GÜNÜN FİLMİ SİSTEMİ
// ==============================================

// ==============================================
// 1. ROTA - GÜNÜN FİLMİ SİSTEMİ (MEVCUT KODUNUZ)
// ==============================================
app.get('/api/movie-of-the-day', async (req, res) => {
  try {
    console.log('🎬 Geliştirilmiş mantık ile günün filmi çekiliyor...');
    
    const today = new Date();
    const dayOfMonth = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    const randomPage = ((dayOfMonth + month + year) % 50) + 1;

    const tmdbResponse = await axios.get(`https://api.themoviedb.org/3/movie/popular`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        language: 'tr-TR',
        page: randomPage
      }
    });

    if (!tmdbResponse.data.results || tmdbResponse.data.results.length === 0) {
      throw new Error('Popüler filmler listesi alınamadı');
    }

    const movies = tmdbResponse.data.results;
    const selectedIndex = (dayOfMonth + month) % movies.length;
    const selectedMovie = movies[selectedIndex];

    const movieDetailsResponse = await axios.get(`https://api.themoviedb.org/3/movie/${selectedMovie.id}`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        language: 'tr-TR',
        append_to_response: 'credits,videos'
      }
    });

    const movieDetails = movieDetailsResponse.data;

    const movieOfTheDay = {
      id: movieDetails.id,
      title: movieDetails.title,
      overview: movieDetails.overview,
      backdrop_path: movieDetails.backdrop_path,
      poster_path: movieDetails.poster_path,
      release_date: movieDetails.release_date,
      vote_average: movieDetails.vote_average,
      genres: movieDetails.genres,
      runtime: movieDetails.runtime,
      date: today.toISOString().split('T')[0]
    };

    console.log(`✅ Günün filmi seçildi: [Sayfa: ${randomPage}] ${movieDetails.title}`);
    
    res.json({
      success: true,
      movieOfTheDay: movieOfTheDay
    });

  } catch (error) {
    console.error('Günün filmi hatası:', error);
    res.status(500).json({ 
      error: 'Günün filmi alınırken hata oluştu',
      details: error.message 
    });
  }
});


// ==========================================================
// 2. ROTA - FİLM DETAYI GETİRME (YENİ EKLENEN KOD)
// Bu, "Öne Çıkan Film" özelliğinin çalışmasını sağlayacak
// ==========================================================
app.get('/api/movie/:movieId', async (req, res) => {
  const { movieId } = req.params;

  console.log(`🎬 ID ile film detayı çekiliyor: ${movieId}`);

  try {
    const movieDetailsResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        language: 'tr-TR',
        append_to_response: 'credits,videos'
      }
    });

    // Frontend, bu rotadan gelen verinin direkt film detayı objesi olmasını bekliyor.
    res.json(movieDetailsResponse.data);

  } catch (error) {
    console.error(`ID ${movieId} için film detayı hatası:`, error.message);
    res.status(404).json({ 
      error: 'Film detayları alınırken hata oluştu veya film bulunamadı',
      details: error.message 
    });
  }
});
// ==============================================
// END - GÜNÜN FİLMİ SİSTEMİ
// ==============================================

// ==============================================
// RASTGELE BÖLÜM ÜRETİCİ SİSTEMİ
// ==============================================

app.post('/api/random-episode', async (req, res) => {
  try {
    const { seriesName } = req.body;
    
    if (!seriesName) {
      return res.status(400).json({ error: 'Dizi adı gerekli' });
    }

    console.log(`🎯 Random episode search for: ${seriesName}`);

    // 1. TMDB'de diziyi ara
    const searchResponse = await axios.get(`${TMDB_BASE_URL}/search/tv`, {
      params: {
        api_key: TMDB_API_KEY,
        query: seriesName,
        language: 'tr-TR'
      }
    });

    if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
      return res.status(404).json({ error: 'Dizi bulunamadı' });
    }

    const series = searchResponse.data.results[0]; // En iyi sonucu al
    const tvId = series.id;

    // 2. Dizi detaylarını al (sezon sayısı için)
    const seriesDetailsResponse = await axios.get(`${TMDB_BASE_URL}/tv/${tvId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR'
      }
    });

    const seriesDetails = seriesDetailsResponse.data;
    const totalSeasons = seriesDetails.number_of_seasons;

    if (totalSeasons === 0) {
      return res.status(404).json({ error: 'Bu dizide hiç sezon bulunamadı' });
    }

    // 3. Rastgele sezon seç (1'den başlayarak)
    const randomSeason = Math.floor(Math.random() * totalSeasons) + 1;

    // 4. Seçilen sezonun detaylarını al
    const seasonResponse = await axios.get(`${TMDB_BASE_URL}/tv/${tvId}/season/${randomSeason}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR'
      }
    });

    const seasonDetails = seasonResponse.data;
    const totalEpisodes = seasonDetails.episodes.length;

    if (totalEpisodes === 0) {
      return res.status(404).json({ error: 'Bu sezonda hiç bölüm bulunamadı' });
    }

    // 5. Rastgele bölüm seç
    const randomEpisodeIndex = Math.floor(Math.random() * totalEpisodes);
    const randomEpisodeNumber = seasonDetails.episodes[randomEpisodeIndex].episode_number;

    // 6. Seçilen bölümün detaylarını al
    const episodeResponse = await axios.get(`${TMDB_BASE_URL}/tv/${tvId}/season/${randomSeason}/episode/${randomEpisodeNumber}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'tr-TR'
      }
    });

    const episodeDetails = episodeResponse.data;

    // 7. Sonucu hazırla
    const result = {
      series: {
        id: tvId,
        name: series.name,
        original_name: series.original_name,
        poster_path: series.poster_path,
        backdrop_path: series.backdrop_path,
        first_air_date: series.first_air_date,
        overview: series.overview
      },
      season: {
        season_number: randomSeason,
        name: seasonDetails.name,
        episode_count: totalEpisodes
      },
      episode: {
        episode_number: randomEpisodeNumber,
        name: episodeDetails.name,
        overview: episodeDetails.overview,
        still_path: episodeDetails.still_path,
        air_date: episodeDetails.air_date,
        vote_average: episodeDetails.vote_average,
        runtime: episodeDetails.runtime
      }
    };

    console.log(`✅ Random episode selected: ${series.name} S${randomSeason}E${randomEpisodeNumber} - ${episodeDetails.name}`);

    res.json({
      success: true,
      randomEpisode: result
    });

  } catch (error) {
    console.error('Random episode error:', error);
    res.status(500).json({ 
      error: 'Rastgele bölüm seçilirken hata oluştu',
      details: error.message 
    });
  }
});

// ==============================================
// END - RASTGELE BÖLÜM ÜRETİCİ SİSTEMİ
// ==============================================

app.listen(PORT, () => {
  console.log(`� CinePop Backend server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
