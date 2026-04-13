import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';

// ─── AUTH ────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null as any,
    token: null as string | null,
    isLoggedIn: false,
  },
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: any; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isLoggedIn = true;
    },
    clearAuth: (state) => { state.user = null; state.token = null; state.isLoggedIn = false; },
    updateUser: (state, action: PayloadAction<any>) => { state.user = { ...state.user, ...action.payload }; },
  },
});

// ─── CHECKLISTS ───────────────────────────────────────────────────────────────
const checklistsSlice = createSlice({
  name: 'checklists',
  initialState: {
    list: [] as any[],
    archived: [] as any[],
    deletedIds: [] as any[],
    pendingSync: [] as any[],
    lastFetched: null as string | null,
  },
  reducers: {
    setChecklists: (state, action: PayloadAction<any[]>) => {
      const archivedIds = new Set(state.archived.map((c: any) => c.id));
      const deletedSet = new Set(state.deletedIds);
      state.list = action.payload.filter((c: any) => !archivedIds.has(c.id) && !deletedSet.has(c.id));
      state.lastFetched = new Date().toISOString();
    },
    addChecklist: (state, action: PayloadAction<any>) => { state.list.unshift(action.payload); },
    updateChecklist: (state, action: PayloadAction<any>) => {
      const idx = state.list.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) state.list[idx] = { ...state.list[idx], ...action.payload };
      else state.list.unshift(action.payload);
    },
    archiveChecklist: (state, action: PayloadAction<any>) => {
      const item = state.list.find((c) => c.id === action.payload);
      if (item) { state.archived.unshift({ ...item, archivedAt: new Date().toISOString() }); state.list = state.list.filter((c) => c.id !== action.payload); }
    },
    unarchiveChecklist: (state, action: PayloadAction<any>) => {
      const item = state.archived.find((c) => c.id === action.payload);
      if (item) { const { archivedAt, ...r } = item; state.list.unshift(r); state.archived = state.archived.filter((c) => c.id !== action.payload); }
    },
    removeChecklist: (state, action: PayloadAction<any>) => {
      state.list = state.list.filter((c) => c.id !== action.payload);
      state.archived = state.archived.filter((c) => c.id !== action.payload);
      if (!state.deletedIds.includes(action.payload)) state.deletedIds.push(action.payload);
    },
    addPendingSync: (state, action: PayloadAction<any>) => { state.pendingSync.push(action.payload); },
    clearPendingSync: (state) => { state.pendingSync = []; },
  },
});

// ─── INCIDENTS ────────────────────────────────────────────────────────────────
const incidentsSlice = createSlice({
  name: 'incidents',
  initialState: { list: [] as any[], pendingSync: [] as any[] },
  reducers: {
    setIncidents: (state, action: PayloadAction<any[]>) => { state.list = action.payload; },
    addIncident: (state, action: PayloadAction<any>) => { state.list.unshift(action.payload); },
    updateIncident: (state, action: PayloadAction<any>) => {
      const idx = state.list.findIndex((i) => i.id === action.payload.id);
      if (idx !== -1) state.list[idx] = { ...state.list[idx], ...action.payload };
      else state.list.unshift(action.payload);
    },
    addIncidentPendingSync: (state, action: PayloadAction<any>) => { state.pendingSync.push(action.payload); },
    clearIncidentPendingSync: (state) => { state.pendingSync = []; },
  },
});

// ─── AÇÕES CORRETIVAS ─────────────────────────────────────────────────────────
const acoesSlice = createSlice({
  name: 'acoes',
  initialState: { list: [] as any[] },
  reducers: {
    setAcoes: (state, action: PayloadAction<any[]>) => { state.list = action.payload; },
    addAcao: (state, action: PayloadAction<any>) => { state.list.unshift(action.payload); },
    updateAcao: (state, action: PayloadAction<any>) => {
      const idx = state.list.findIndex((a) => a.id === action.payload.id);
      if (idx !== -1) state.list[idx] = { ...state.list[idx], ...action.payload };
      else state.list.unshift(action.payload);
    },
    removeAcao: (state, action: PayloadAction<any>) => { state.list = state.list.filter((a) => a.id !== action.payload); },
  },
});

// ─── OBRAS ────────────────────────────────────────────────────────────────────
const obrasSlice = createSlice({
  name: 'obras',
  initialState: { list: [] as any[] },
  reducers: {
    setObras: (state, action: PayloadAction<any[]>) => { state.list = action.payload; },
    addObra: (state, action: PayloadAction<any>) => { state.list.unshift(action.payload); },
    updateObra: (state, action: PayloadAction<any>) => {
      const idx = state.list.findIndex((o) => o.id === action.payload.id);
      if (idx !== -1) state.list[idx] = { ...state.list[idx], ...action.payload };
    },
    removeObra: (state, action: PayloadAction<any>) => { state.list = state.list.filter((o) => o.id !== action.payload); },
  },
});

// ─── TEAM ─────────────────────────────────────────────────────────────────────
const teamSlice = createSlice({
  name: 'team',
  initialState: { list: [] as any[] },
  reducers: {
    setTeam: (state, action: PayloadAction<any[]>) => { state.list = action.payload; },
    addMember: (state, action: PayloadAction<any>) => { state.list.unshift(action.payload); },
    updateMember: (state, action: PayloadAction<any>) => {
      const idx = state.list.findIndex((m) => m.id === action.payload.id);
      if (idx !== -1) state.list[idx] = { ...state.list[idx], ...action.payload };
    },
    removeMember: (state, action: PayloadAction<any>) => { state.list = state.list.filter((m) => m.id !== action.payload); },
  },
});

// ─── APP ──────────────────────────────────────────────────────────────────────
const appSlice = createSlice({
  name: 'app',
  initialState: {
    isOnline: true,
    lastSync: null as string | null,
    pendingSyncCount: 0,
    onboardingComplete: false,
  },
  reducers: {
    setOnline: (state, action: PayloadAction<boolean>) => { state.isOnline = action.payload; },
    setLastSync: (state, action: PayloadAction<string>) => { state.lastSync = action.payload; },
    setPendingSyncCount: (state, action: PayloadAction<number>) => { state.pendingSyncCount = action.payload; },
    setOnboardingComplete: (state) => { state.onboardingComplete = true; },
  },
});

// ─── EXPORTS ──────────────────────────────────────────────────────────────────
export const { setAuth, clearAuth, updateUser } = authSlice.actions;
export const { setChecklists, addChecklist, updateChecklist, archiveChecklist, unarchiveChecklist, removeChecklist, addPendingSync, clearPendingSync } = checklistsSlice.actions;
export const { setIncidents, addIncident, updateIncident, addIncidentPendingSync, clearIncidentPendingSync } = incidentsSlice.actions;
export const { setAcoes, addAcao, updateAcao, removeAcao } = acoesSlice.actions;
export const { setObras, addObra, updateObra, removeObra } = obrasSlice.actions;
export const { setTeam, addMember, updateMember, removeMember } = teamSlice.actions;
export const { setOnline, setLastSync, setPendingSyncCount, setOnboardingComplete } = appSlice.actions;

// ─── STORE ────────────────────────────────────────────────────────────────────
const rootReducer = combineReducers({
  auth: authSlice.reducer,
  checklists: checklistsSlice.reducer,
  incidents: incidentsSlice.reducer,
  acoes: acoesSlice.reducer,
  obras: obrasSlice.reducer,
  team: teamSlice.reducer,
  app: appSlice.reducer,
});

const persistConfig = {
  key: 'treinar-v4',
  storage: AsyncStorage,
  whitelist: ['auth', 'checklists', 'incidents', 'acoes', 'obras', 'team', 'app'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] } }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
