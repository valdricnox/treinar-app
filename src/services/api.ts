import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'https://treinar-backend-production.up.railway.app/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.log('[API Error]', err?.response?.status, err?.response?.data || err?.message);
    return Promise.reject(err);
  }
);

// ─── Offline queue helpers ────────────────────────────────────────────────────
export const saveOffline = async (key: string, data: any) => {
  try {
    const existing = await AsyncStorage.getItem(key);
    const list = existing ? JSON.parse(existing) : [];
    list.push({ ...data, _offlineId: Date.now(), _pendingSync: true });
    await AsyncStorage.setItem(key, JSON.stringify(list));
  } catch {}
};

export const loadOffline = async (key: string): Promise<any[]> => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

export const saveOfflineSingle = async (key: string, data: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch {}
};

export default api;
