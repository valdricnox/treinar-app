// src/services/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ TROQUE pelo IP do seu servidor após rodar o backend
// Exemplos:
//   'http://192.168.1.100:3000/v1'   ← rede local (WiFi)
//   'https://api.treinar.eng.br/v1'  ← produção
export const BASE_URL = 'https://treinar-backend-production.up.railway.app/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401) await SecureStore.deleteItemAsync('token');
    return Promise.reject(err);
  }
);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login:  (email: string, senha: string) => api.post('/auth/login', { email, senha }),
  logout: ()                              => api.post('/auth/logout'),
};

// ─── CHECKLISTS ───────────────────────────────────────────────────────────────
export const checklistApi = {
  listar:      ()           => api.get('/checklists'),
  buscar:      (id: string) => api.get(`/checklists/${id}`),
  criar:       (d: any)     => api.post('/checklists', d),
  atualizar:   (id: string, d: any) => api.put(`/checklists/${id}`, d),
  concluir:    (id: string, d: any) => api.post(`/checklists/${id}/concluir`, d),
  gerarPdf:    (id: string) => api.post(`/checklists/${id}/pdf`),
  uploadFoto:  (checklistId: string, itemId: string, uri: string) => {
    const form = new FormData();
    form.append('foto', { uri, name: 'foto.jpg', type: 'image/jpeg' } as any);
    return api.post(`/checklists/${checklistId}/itens/${itemId}/foto`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ─── INCIDENTES ───────────────────────────────────────────────────────────────
export const incidentApi = {
  listar:     ()           => api.get('/incidentes'),
  criar:      (d: any)     => api.post('/incidentes', d),
  atualizar:  (id: string, d: any) => api.put(`/incidentes/${id}`, d),
  uploadFotos:(id: string, uris: string[]) => {
    const form = new FormData();
    uris.forEach((uri, i) => {
      form.append('fotos', { uri, name: `foto_${i}.jpg`, type: 'image/jpeg' } as any);
    });
    return api.post(`/incidentes/${id}/fotos`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ─── TEMPLATES ────────────────────────────────────────────────────────────────
export const templateApi = {
  listar: () => api.get('/templates'),
};

// ─── OFFLINE QUEUE ────────────────────────────────────────────────────────────
export const addToOfflineQueue = async (type: string, payload: any) => {
  const raw = await AsyncStorage.getItem('offline_queue');
  const queue = raw ? JSON.parse(raw) : [];
  queue.push({ type, payload, timestamp: new Date().toISOString() });
  await AsyncStorage.setItem('offline_queue', JSON.stringify(queue));
};

export const syncOfflineQueue = async () => {
  const raw = await AsyncStorage.getItem('offline_queue');
  if (!raw) return 0;
  const queue: any[] = JSON.parse(raw);
  const failed: any[] = [];
  for (const item of queue) {
    try {
      if (item.type === 'checklist_update') await checklistApi.atualizar(item.payload.id, item.payload);
      else if (item.type === 'incident_create') await incidentApi.criar(item.payload);
    } catch { failed.push(item); }
  }
  await AsyncStorage.setItem('offline_queue', JSON.stringify(failed));
  return failed.length;
};

export default api;
