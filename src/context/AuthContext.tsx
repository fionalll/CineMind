import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../firebase/config';
import { api } from '../services/api';
import type { User } from 'firebase/auth';
import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
  updatePassword,
  deleteUser,
  sendPasswordResetEmail
} from 'firebase/auth';
import LoadingSpinner from '../components/LoadingSpinner';


interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  avatar: string | null;
  username: string | null;
  updateAvatar: (avatar: string) => Promise<void>;
  updateUsername: (newUsername: string) => Promise<void>;
  changeEmail: (currentPassword: string, newEmail: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (currentPassword: string) => Promise<void>;
   sendResetPasswordLink: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Başlangıçta her zaman true
  const [avatar, setAvatar] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const db = getFirestore();

  // --- TÜM MANTIK TEK BİR useEffect İÇİNDE ---
  useEffect(() => {
    // onAuthStateChanged dinleyicisi, kullanıcı durumu değiştiğinde (giriş/çıkış) çalışır
    // ve bize kullanıcıyı veya null döner. Ayrıca dinleyiciyi kapatmak için bir fonksiyon döndürür.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Eğer kullanıcı GİRİŞ YAPMIŞSA, avatarını Firestore'dan çek.
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setAvatar(userData.avatar || null);
            setUsername(userData.username || null);
            console.log("✅ Kullanıcı verisi Firestore'dan yüklendi:", userData);
          } else {
            // Firestore'da henüz kullanıcının dokümanı yoksa oluştur
            console.log("📝 Kullanıcı dokümanı bulunamadı, oluşturuluyor...");
            const newUserData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || '',
              avatar: null,
              username: null,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            try {
              await setDoc(userDocRef, newUserData);
              console.log("✅ Kullanıcı dokümanı oluşturuldu");
              setAvatar(null);
              setUsername(null);
            } catch (createError) {
              console.error("❌ Kullanıcı dokümanı oluşturulamadı:", createError);
              setAvatar(null);
              setUsername(null);
            }
          }
        } catch (error) {
          console.error("❌ Kullanıcı verisi Firestore'dan yüklenirken hata:", error);
          
          // Firestore'dan yüklenemiyorsa localStorage'dan dene
          try {
            const localAvatar = localStorage.getItem(`avatar_${user.uid}`);
            if (localAvatar) {
              setAvatar(localAvatar);
              console.log("✅ Avatar localStorage'dan yüklendi:", localAvatar);
            } else {
              setAvatar(null);
            }
          } catch (localError) {
            console.error("❌ localStorage'dan avatar yüklenemedi:", localError);
            setAvatar(null);
          }
          
          setUsername(null);
        }
      } else {
        // Eğer kullanıcı ÇIKIŞ YAPMIŞSA, avatarı ve username'i temizle.
        setAvatar(null);
        setUsername(null);
      }

      // Tüm işlemler bittiğinde (giriş yapmış veya yapmamış) yüklenmeyi bitir.
      setLoading(false);
    });

    // Component kaldırıldığında (cleanup), dinleyiciyi kapatarak hafıza sızıntısını önle.
    return () => unsubscribe();
  }, [db]); // db referansı değişmeyeceği için bu useEffect sadece bir kere çalışır.

  const register = async (email: string, password: string, username: string) => {
    try {
      // Backend'e kayıt isteği gönder (Firebase Auth + Firestore işlemleri backend'te yapılıyor)
      const response = await api.post('/auth/register', {
        email,
        password,
        username,
        displayName: username
      });

      // Axios response object yapısı { data, status, ... }
      if (response.status !== 201 && response.status !== 200) {
        throw new Error(response.data?.error || 'Kayıt işlemi başarısız');
      }

      // Başarılı kayıt sonrası Firebase'e giriş yap
      await signInWithEmailAndPassword(auth, email, password);

    } catch (error: any) {
      console.error('Registration error:', error);
      // Eğer axios error ise, response'dan ayrıntılı hata mesajını al
      if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || 'Kayıt işlemi sırasında hata oluştu');
    }
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateAvatar = async (newAvatar: string) => {
    if (!currentUser) {
      console.warn("Avatar güncellenemedi: Kullanıcı oturumu bulunamadı");
      return;
    }
    
    console.log("Avatar güncelleniyor:", newAvatar, "Kullanıcı UID:", currentUser.uid);
    
    try {
      // State'i önce güncelle (optimistic update)
      setAvatar(newAvatar);
      
      // Geçici olarak localStorage'a da kaydet (fallback)
      localStorage.setItem(`avatar_${currentUser.uid}`, newAvatar);
      
      // Firestore'a yazma izni kontrol et
      if (!db) {
        console.warn("Firestore mevcut değil, sadece localStorage kullanılıyor");
        console.log("✅ Avatar localStorage'a kaydedildi:", newAvatar);
        return;
      }
      
      // Kullanıcı dokümanı varlığını kontrol et
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Avatar'ı güncelle
      await setDoc(userDocRef, { 
        avatar: newAvatar,
        updatedAt: new Date(),
        uid: currentUser.uid,
        email: currentUser.email
      }, { merge: true });
      
      console.log("✅ Avatar başarıyla Firestore'a kaydedildi:", newAvatar);
      
    } catch (error: any) {
      console.error("❌ Avatar Firestore'a kaydedilirken hata:", error);
      
      // Firestore hatası olsa bile localStorage'da tutmaya devam et
      localStorage.setItem(`avatar_${currentUser.uid}`, newAvatar);
      console.log("⚠️ Avatar sadece localStorage'a kaydedildi (Firestore hatası)");
      
      // Sadece kritik hatalar için kullanıcıyı uyar
      if (error.code === 'unauthenticated') {
        alert("Oturum süreniz dolmuş. Lütfen yeniden giriş yapın.");
        await logout();
        return;
      }
      
      // Diğer hatalar için console'da bırak, kullanıcıyı rahatsız etme
      console.warn("Avatar seçimi geçici olarak yerel depolamada saklandı.");
    }
  };

  const updateUsername = async (newUsername: string) => {
    if (!currentUser) {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }
    
    try {
      // Firebase Auth'daki displayName'i güncelle
      await updateProfile(currentUser, { 
        displayName: newUsername 
      });
      
      // Firestore'daki kullanıcı dokümanını da güncelle
      await setDoc(doc(db, 'users', currentUser.uid), { 
        username: newUsername,
        updatedAt: new Date()
      }, { merge: true });
      
      console.log('✅ Kullanıcı adı başarıyla güncellendi:', newUsername);
    } catch (error) {
      console.error("Kullanıcı adı güncellenirken hata:", error);
      throw error;
    }
  };

  const changeEmail = async (currentPassword: string, newEmail: string) => {
    if (!currentUser || !currentUser.email) {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }
    
    try {
      // Önce kullanıcının kimliğini mevcut şifresiyle doğrula
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Yeni e-posta adresine doğrulama e-postası gönder
      await verifyBeforeUpdateEmail(currentUser, newEmail);
      
      console.log('✅ E-posta doğrulama linki gönderildi:', newEmail);
    } catch (error) {
      console.error("E-posta güncellenirken hata:", error);
      if (error instanceof Error) {
        if (error.message.includes('wrong-password')) {
          throw new Error('Mevcut şifreniz yanlış');
        } else if (error.message.includes('invalid-email')) {
          throw new Error('Geçersiz e-posta adresi');
        } else if (error.message.includes('email-already-in-use')) {
          throw new Error('Bu e-posta adresi zaten kullanılıyor');
        }
      }
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser || !currentUser.email) {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }
    
    try {
      // Önce kullanıcının kimliğini mevcut şifresiyle doğrula
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Şifreyi güncelle
      await updatePassword(currentUser, newPassword);
      
      console.log('✅ Şifre başarıyla güncellendi');
    } catch (error) {
      console.error("Şifre güncellenirken hata:", error);
      if (error instanceof Error) {
        if (error.message.includes('wrong-password')) {
          throw new Error('Mevcut şifreniz yanlış');
        } else if (error.message.includes('weak-password')) {
          throw new Error('Yeni şifre çok zayıf. En az 6 karakter olmalıdır.');
        }
      }
      throw error;
    }
  };

  const deleteAccount = async (currentPassword: string) => {
    if (!currentUser || !currentUser.email) {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }
    
    try {
      // Önce kullanıcının kimliğini mevcut şifresiyle doğrula
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Kullanıcıyı kalıcı olarak sil
      await deleteUser(currentUser);
      
      console.log('✅ Hesap başarıyla silindi');
    } catch (error) {
      console.error("Hesap silinirken hata:", error);
      if (error instanceof Error) {
        if (error.message.includes('wrong-password')) {
          throw new Error('Mevcut şifreniz yanlış');
        } else if (error.message.includes('requires-recent-login')) {
          throw new Error('Güvenlik nedeniyle lütfen tekrar giriş yapın');
        }
      }
      throw error;
    }
  };

  const sendResetPasswordLink = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Şifre sıfırlama linki gönderildi:', email);
    } catch (error) {
      console.error("Şifre sıfırlama linki gönderilirken hata:", error);
      if (error instanceof Error) {
        if (error.message.includes('auth/invalid-email')) {
          throw new Error('Geçersiz e-posta adresi');
        } else if (error.message.includes('auth/user-not-found')) {
          throw new Error('Bu e-posta adresine kayıtlı kullanıcı bulunamadı');
        }
      }
      throw error;
    }
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading,
    avatar,
    username,
    updateAvatar,
    updateUsername,
    changeEmail,
    changePassword,
    deleteAccount,
    sendResetPasswordLink
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <LoadingSpinner /> : children}
    </AuthContext.Provider>
  );
};
