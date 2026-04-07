import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';

// AUTH
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null as any, token: null as string | null, isLoggedIn: false },
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: any; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isLoggedIn = true;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isLoggedIn = false;
    },
  },
});

// CHECKLISTS
const checklistsSlice = createSlice({
  name: 'checklists',
  initialState: { list: [] as any[], pendingSync: [] as any[] },
  reducers: {
    setChecklists: (state, action) => { state.list = action.payload; },
    addChecklist: (state, action) => { state.list.unshift(action.payload); },
    updateChecklist: (state, action) => {
      const idx = state.list.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) state.list[idx] = action.payload;
    },
    addPendingSync: (state, action) => { state.pendingSync.push(action.payload); },
    clearPendingSync: (state) => { state.pendingSync = []; },
  },
});

// INCIDENTS
const incidentsSlice = createSlice({
  name: 'incidents',
  initialState: { list: [] as any[] },
  reducers: {
    setIncidents: (state, action) => { state.list = action.payload; },
    addIncident: (state, action) => { state.list.unshift(action.payload); },
    updateIncident: (state, action) => {
      const idx = state.list.findIndex((i) => i.id === action.payload.id);
      if (idx !== -1) state.list[idx] = action.payload;
    },
  },
});

// TEAM
const teamSlice = createSlice({
  name: 'team',
  initialState: { list: [] as any[] },
  reducers: {
    setTeam: (state, action) => { state.list = action.payload; },
    addMember: (state, action) => { state.list.unshift(action.payload); },
    removeMember: (state, action) => { state.list = state.list.filter((m) => m.id !== action.payload); },
  },
});

// APP
const appSlice = createSlice({
  name: 'app',
  initialState: { isOnline: true, lastSync: null as string | null },
  reducers: {
    setOnline: (state, action) => { state.isOnline = action.payload; },
    setLastSync: (state, action) => { state.lastSync = action.payload; },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export const { setChecklists, addChecklist, updateChecklist, addPendingSync, clearPendingSync } = checklistsSlice.actions;
export const { setIncidents, addIncident, updateIncident } = incidentsSlice.actions;
export const { setTeam, addMember, removeMember } = teamSlice.actions;
export const { setOnline, setLastSync } = appSlice.actions;

const rootReducer = combineReducers({
  auth: authSlice.reducer,
  checklists: checklistsSlice.reducer,
  incidents: incidentsSlice.reducer,
  team: teamSlice.reducer,
  app: appSlice.reducer,
});

const persistConfig = { key: 'root', storage: AsyncStorage, whitelist: ['auth', 'checklists', 'incidents'] };
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] } }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
