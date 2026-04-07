// src/store/index.ts
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface User {
  id: string; name: string; email: string;
  role: 'inspetor' | 'gestor' | 'admin'; obra?: string;
}

export interface ChecklistItem {
  id: string; label: string; obrigatorio: boolean;
  tipo: 'checkbox' | 'foto' | 'texto' | 'numero';
  checked: boolean; valor?: string; fotoUri?: string; nota?: string;
}

export interface Checklist {
  id: string; titulo: string; norma: string; obra: string;
  responsavel: string; status: 'pendente' | 'em_andamento' | 'concluido';
  progresso: number; itens: ChecklistItem[];
  geolocation?: { lat: number; lng: number };
  assinatura?: string; dataCriacao: string; dataConclusao?: string;
  pdfUri?: string; syncPendente: boolean;
}

export interface Incident {
  id: string; titulo: string; descricao: string;
  severidade: 'alta' | 'media' | 'baixa';
  tipo: 'nao_conformidade' | 'acidente' | 'quase_acidente' | 'observacao';
  local: string; obra: string; responsavel: string;
  status: 'aberto' | 'em_tratamento' | 'resolvido';
  fotos: string[]; geolocation?: { lat: number; lng: number };
  dataCriacao: string; acao?: string; syncPendente: boolean;
}

// ─── SLICES ───────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null as User | null, token: null as string | null, isAuthenticated: false },
  reducers: {
    loginSuccess: (s, a: PayloadAction<{ user: User; token: string }>) => {
      s.user = a.payload.user; s.token = a.payload.token; s.isAuthenticated = true;
    },
    logout: (s) => { s.user = null; s.token = null; s.isAuthenticated = false; },
  },
});

const checklistsSlice = createSlice({
  name: 'checklists',
  initialState: { items: [] as Checklist[], filtro: 'todos' as 'todos'|'pendente'|'em_andamento'|'concluido' },
  reducers: {
    setChecklists: (s, a: PayloadAction<Checklist[]>) => { s.items = a.payload; },
    addChecklist:  (s, a: PayloadAction<Checklist>)   => { s.items.unshift(a.payload); },
    updateChecklist:(s, a: PayloadAction<Checklist>)  => {
      const i = s.items.findIndex(c => c.id === a.payload.id);
      if (i !== -1) s.items[i] = a.payload;
    },
    toggleItem: (s, a: PayloadAction<{ checklistId: string; itemId: string }>) => {
      const cl = s.items.find(c => c.id === a.payload.checklistId);
      if (!cl) return;
      const item = cl.itens.find(i => i.id === a.payload.itemId);
      if (!item) return;
      item.checked = !item.checked;
      const done = cl.itens.filter(i => i.checked).length;
      cl.progresso = Math.round((done / cl.itens.length) * 100);
      cl.status = cl.progresso === 100 ? 'concluido' : cl.progresso > 0 ? 'em_andamento' : 'pendente';
      cl.syncPendente = true;
    },
    setItemFoto: (s, a: PayloadAction<{ checklistId: string; itemId: string; uri: string }>) => {
      const cl = s.items.find(c => c.id === a.payload.checklistId);
      const item = cl?.itens.find(i => i.id === a.payload.itemId);
      if (item) { item.fotoUri = a.payload.uri; item.checked = true; cl!.syncPendente = true; }
    },
    setFiltro: (s, a: PayloadAction<typeof s.filtro>) => { s.filtro = a.payload; },
  },
});

const incidentsSlice = createSlice({
  name: 'incidents',
  initialState: { items: [] as Incident[] },
  reducers: {
    setIncidents: (s, a: PayloadAction<Incident[]>) => { s.items = a.payload; },
    addIncident:  (s, a: PayloadAction<Incident>)   => { s.items.unshift(a.payload); },
  },
});

const appSlice = createSlice({
  name: 'app',
  initialState: { isOffline: false, lastSync: null as string | null },
  reducers: {
    setOffline: (s, a: PayloadAction<boolean>) => { s.isOffline = a.payload; },
    setSynced:  (s) => { s.lastSync = new Date().toISOString(); },
  },
});

// ─── STORE ────────────────────────────────────────────────────────────────────
const rootReducer = combineReducers({
  auth: authSlice.reducer,
  checklists: checklistsSlice.reducer,
  incidents: incidentsSlice.reducer,
  app: appSlice.reducer,
});

const persistedReducer = persistReducer(
  { key: 'treinar-root', storage: AsyncStorage, whitelist: ['auth', 'checklists', 'incidents', 'app'] },
  rootReducer
);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (g) => g({ serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] } }),
});

export const persistor = persistStore(store);
export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const { loginSuccess, logout }                               = authSlice.actions;
export const { setChecklists, addChecklist, updateChecklist, toggleItem, setItemFoto, setFiltro } = checklistsSlice.actions;
export const { setIncidents, addIncident }                          = incidentsSlice.actions;
export const { setOffline, setSynced }                              = appSlice.actions;
