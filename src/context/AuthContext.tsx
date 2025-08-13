import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../firebase/config';
import type { User } from 'firebase/auth';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
  updatePassword,
  deleteUser
} from 'firebase/auth';
import LoadingSpinner from '../components/LoadingSpinner';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  avatar: string | null;
  updateAvatar: (avatar: string) => Promise<void>;
  updateUsername: (newUsername: string) => Promise<void>;
  changeEmail: (currentPassword: string, newEmail: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (currentPassword: string) => Promise<void>;
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
            setAvatar(userDoc.data().avatar || null);
          } else {
            // Firestore'da henüz kullanıcının dokümanı yoksa (yeni kayıt olmuş olabilir)
            // avatarı null olarak ayarla.
            setAvatar(null);
          }
        } catch (error) {
          console.error("Kullanıcı verisi çekilirken hata:", error);
          setAvatar(null);
        }
      } else {
        // Eğer kullanıcı ÇIKIŞ YAPMIŞSA, avatarı temizle.
        setAvatar(null);
      }

      // Tüm işlemler bittiğinde (giriş yapmış veya yapmamış) yüklenmeyi bitir.
      setLoading(false);
    });

    // Component kaldırıldığında (cleanup), dinleyiciyi kapatarak hafıza sızıntısını önle.
    return () => unsubscribe();
  }, [db]); // db referansı değişmeyeceği için bu useEffect sadece bir kere çalışır.

  const register = async (email: string, password:string, username: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: username });
    // Yeni kullanıcı için Firestore'da boş bir doküman oluşturabiliriz (isteğe bağlı ama iyi bir pratik)
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      username: username,
      createdAt: new Date(),
    });
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateAvatar = async (newAvatar: string) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'users', currentUser.uid), { avatar: newAvatar }, { merge: true });
      // State'i anında güncelle
      setAvatar(newAvatar);
    } catch (error) {
      console.error("Avatar güncellenirken hata:", error);
      throw error; // Hatayı bileşene de bildir
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

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading,
    avatar,
    updateAvatar,
    updateUsername,
    changeEmail,
    changePassword,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <LoadingSpinner /> : children}
    </AuthContext.Provider>
  );
};