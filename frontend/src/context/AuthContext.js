import { createContext, useState, useContext, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, check if a token exists and fetch the current user
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    API.get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await API.get('/auth/me');
      if (res.data.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const updatePoints = (newBalance) => {
    setUser((prev) => (prev ? { ...prev, points_balance: newBalance } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser, updatePoints }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);