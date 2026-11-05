import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../api/client';

const AuthContext = createContext(null);

const DEFAULT_DEMO_USER = {
  id: 1,
  name: 'Alex Chen',
  email: 'alex@berkeley.edu',
  role: 'student',
  github_username: 'alexchen-dev',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  token: 'demo_token_alex',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('skillproof_user');
      return saved ? JSON.parse(saved) : DEFAULT_DEMO_USER;
    } catch {
      return DEFAULT_DEMO_USER;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('skillproof_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('skillproof_user');
    }
  }, [user]);

  const handleLogin = async (email, password) => {
    try {
      setAuthLoading(true);
      setAuthError(null);
      const userData = await loginUser({ email, password });
      setUser(userData);
      setIsAuthModalOpen(false);
      return userData;
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please check credentials.');
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (data) => {
    try {
      setAuthLoading(true);
      setAuthError(null);
      const userData = await registerUser(data);
      setUser(userData);
      setIsAuthModalOpen(false);
      return userData;
    } catch (err) {
      setAuthError(err.message || 'Registration failed.');
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const quickDemoLogin = (role = 'student') => {
    setAuthError(null);
    if (role === 'organization') {
      const recruiterUser = {
        id: 2,
        name: 'Sarah Jenkins',
        email: 'recruiter@stripe.com',
        role: 'organization',
        company_name: 'Stripe',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        token: 'demo_token_stripe',
      };
      setUser(recruiterUser);
    } else {
      setUser(DEFAULT_DEMO_USER);
    }
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthModalOpen,
        openAuthModal: () => {
          setAuthError(null);
          setIsAuthModalOpen(true);
        },
        closeAuthModal: () => setIsAuthModalOpen(false),
        login: handleLogin,
        register: handleRegister,
        quickDemoLogin,
        logout,
        authError,
        setAuthError,
        authLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

