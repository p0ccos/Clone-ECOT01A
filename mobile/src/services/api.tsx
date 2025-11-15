import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// 1. Importe a URL centralizada do seu AuthContext
// (Ajuste o caminho se o arquivo estiver em outra pasta)
import { API_URL } from '../contexts/AuthContext'; // 

const api = axios.create({
  // 2. Use a URL importada
  baseURL: API_URL
});

// --- A MÁGICA ACONTECE AQUI ---
api.interceptors.request.use(
  async (config) => {
    //
    // ⚠️ CORREÇÃO CRÍTICA ⚠️
    // No seu AuthContext, você salva como 'token' (correto).
    // Aqui, você deve ler a MESMA chave 'token' (e não '@token').
    //
    const token = await AsyncStorage.getItem('token'); 
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;