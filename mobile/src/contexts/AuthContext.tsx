import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

//
// ⚠️ MUDE AQUI ⚠️
// Coloque a URL que o Ngrok te deu. Use https se o ngrok der https.
//
export const API_URL = 'https://6fb516b802ed.ngrok-free.app'; 

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  course?: string | null;
  bio?: string | null;
}
interface AuthContextData {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserContext: (updatedUser: User) => void;
  API_URL: string; // Já estava aqui, ótimo!
}
const AuthContext = createContext<AuthContextData>({} as AuthContextData);
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const loadToken = async () => {
      try {
        // CORREÇÃO: A chave é 'token' (sem @)
        const storedToken = await AsyncStorage.getItem('token'); 
        if (storedToken) {
          setToken(storedToken);
          const decodedUser = jwtDecode<User>(storedToken);
          setUser(decodedUser);
        }
      } catch (e) {
        console.error('Falha ao carregar token', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);
  const login = async (identifier: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao logar');
      }
      const { token, user } = data;
      // IMPORTANTE: A chave é 'token'
      await AsyncStorage.setItem('token', token); 
      setToken(token);
      setUser(user);
    } catch (error) {
      throw error;
    }
  };
  const register = async (name: string, username: string, email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cadastrar');
      }
      await login(email, password);
    } catch (error) {
      throw error;
    }
  };
  const logout = async () => {
    try {
      // IMPORTANTE: A chave é 'token'
      await AsyncStorage.removeItem('token'); 
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error('Falha ao fazer logout', e);
    }
  };
  const updateUserContext = (updatedUser: User) => {
    setUser(updatedUser);
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateUserContext,
        API_URL // A URL está disponível para o resto do app via hook
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  return useContext(AuthContext);
};