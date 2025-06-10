import React, { useState, useEffect, useContext, createContext } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where,
  onSnapshot,
  serverTimestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';

// Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const register = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      name: name,
      email: email,
      authMethod: 'email',
      createdAt: serverTimestamp(),
      totalScore: 0
    });
    
    return userCredential;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    register,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Header Component
export const Header = ({ setCurrentPage, currentPage }) => {
  const { currentUser, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentPage('home');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center cursor-pointer" onClick={() => setCurrentPage('home')}>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">У</span>
                </div>
                <span className="text-2xl font-bold text-teal-600">ИСЛАМА</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button 
                onClick={() => setCurrentPage('home')}
                className={`${currentPage === 'home' ? 'text-teal-600' : 'text-gray-700'} hover:text-teal-600 font-medium transition-colors`}
              >
                Главная
              </button>
              <button 
                onClick={() => setCurrentPage('lessons')}
                className={`${currentPage === 'lessons' ? 'text-teal-600' : 'text-gray-700'} hover:text-teal-600 font-medium transition-colors`}
              >
                Уроки
              </button>
              <button 
                onClick={() => setCurrentPage('leaderboard')}
                className={`${currentPage === 'leaderboard' ? 'text-teal-600' : 'text-gray-700'} hover:text-teal-600 font-medium transition-colors`}
              >
                Лидерборд
              </button>
              <button 
                onClick={() => setCurrentPage('about')}
                className={`${currentPage === 'about' ? 'text-teal-600' : 'text-gray-700'} hover:text-teal-600 font-medium transition-colors`}
              >
                О проекте
              </button>
            </nav>

            {/* Auth buttons */}
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">Привет, {currentUser.displayName || currentUser.email}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Выйти
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-600 transition-colors font-medium"
                >
                  Войти
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
};

// Auth Modal Component
export const AuthModal = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password || (!isLogin && !name)) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      onClose();
    } catch (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isLogin ? 'Вход' : 'Регистрация'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Имя
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-teal-500"
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-teal-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-teal-500"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 text-white py-2 px-4 rounded hover:bg-teal-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-teal-500 hover:text-teal-600"
          >
            {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Hero Section Component
export const HeroSection = ({ onStartLearning }) => {
  return (
    <section className="relative bg-gradient-to-br from-white to-teal-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                УРОКИ <span className="text-teal-500">ИСЛАМА</span>
              </h1>
              <p className="text-2xl text-gray-600 mt-4">
                Ваш первый учитель
              </p>
            </div>
            
            <p className="text-lg text-gray-700 leading-relaxed">
              Образовательная платформа об основах ислама для начинающих мусульман
            </p>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                onClick={onStartLearning}
                className="bg-teal-500 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-teal-600 transition-all transform hover:scale-105 shadow-lg"
              >
                Начать учиться
              </button>
              <button className="flex items-center text-teal-600 font-medium text-lg hover:text-teal-700 transition-colors">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                смотреть видео
              </button>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative z-10">
              <img
                src="https://images.pexels.com/photos/16150314/pexels-photo-16150314.jpeg"
                alt="Коран на подставке"
                className="w-full h-96 object-cover rounded-2xl shadow-2xl"
              />
            </div>
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-24 h-24 bg-teal-200 rounded-full opacity-20"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-teal-300 rounded-full opacity-30"></div>
          </div>
        </div>
      </div>

      {/* Decorative SVG shapes */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 text-teal-100">
        <svg fill="currentColor" viewBox="0 0 100 100">
          <path d="M0,0 L100,0 L100,100 Z" opacity="0.1"/>
        </svg>
      </div>
    </section>
  );
};

// Why Study Islam Section
export const WhyStudySection = () => {
  const benefits = [
    {
      title: "Ислам - мировая религия",
      description: "Узнайте о ценностях 1,8 миллиарда мусульман планеты."
    },
    {
      title: "Духовная гармония",
      description: "Найдите свой путь к Богу и подготовьтесь к вечной жизни."
    },
    {
      title: "Знание истины",
      description: "Развейте сомнения, не будьте заложниками внушенных стереотипов."
    }
  ];

  return (
    <section className="bg-teal-500 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-8">
              ПОЧЕМУ
              <br />
              ИЗУЧЕНИЕ ИСЛАМА
              <br />
              ВАЖНО?
            </h2>
          </div>
          
          <div className="space-y-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-white">
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-teal-100 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Leaderboard Component
export const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = () => {
      const q = query(
        collection(db, 'users'),
        orderBy('totalScore', 'desc'),
        limit(10)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const leaderboardData = [];
        snapshot.forEach((doc) => {
          leaderboardData.push({ id: doc.id, ...doc.data() });
        });
        setLeaders(leaderboardData);
        setLoading(false);
      });

      return unsubscribe;
    };

    return fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-500"></div>
          <p className="mt-4 text-gray-600">Загрузка лидерборда...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🏆 Лидерборд</h1>
          <p className="text-lg text-gray-600">Топ-10 лучших учеников</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-blue-500 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">Рейтинг учеников</h2>
          </div>
          
          <div className="p-6">
            {leaders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Пока никто не прошел тесты</p>
                <p className="text-gray-400">Станьте первым!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaders.map((leader, index) => (
                  <div
                    key={leader.id}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                      index === 0
                        ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-300'
                        : index === 1
                        ? 'bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-gray-300'
                        : index === 2
                        ? 'bg-gradient-to-r from-orange-100 to-orange-50 border-2 border-orange-300'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0
                          ? 'bg-yellow-500 text-white'
                          : index === 1
                          ? 'bg-gray-500 text-white'
                          : index === 2
                          ? 'bg-orange-500 text-white'
                          : 'bg-teal-500 text-white'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {leader.name || 'Аноним'}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Зарегистрирован: {leader.createdAt?.toDate().toLocaleDateString('ru-RU') || 'Недавно'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : index === 2 ? 'text-orange-600' : 'text-teal-600'
                      }`}>
                        {leader.totalScore || 0}
                      </div>
                      <p className="text-gray-500 text-sm">баллов</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Проходите тесты и набирайте баллы, чтобы попасть в топ!
          </p>
          <p className="text-gray-500 text-sm mt-2">
            За каждый правильный ответ +1 балл
          </p>
        </div>
      </div>
    </div>
  );
};