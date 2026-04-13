import { store } from '../store';
import { setChecklists, setIncidents, clearPendingSync, clearIncidentPendingSync, setLastSync, setOnline } from '../store';
import api from './api';

let syncInProgress = false;

export async function syncPendingData() {
  if (syncInProgress) return;
  syncInProgress = true;

  const state = store.getState() as any;
  const checklistPending = state.checklists?.pendingSync || [];
  const incidentPending = state.incidents?.pendingSync || [];

  let synced = 0;

  // Sync pending checklists
  for (const item of checklistPending) {
    try {
      if (item.action === 'concluir') {
        await api.post(`/checklists/${item.id}/concluir`, item);
      } else if (item.id?.toString().startsWith('offline_')) {
        await api.post('/checklists', item);
      } else {
        await api.put(`/checklists/${item.id}`, item);
      }
      synced++;
    } catch {}
  }

  // Sync pending incidents
  for (const item of incidentPending) {
    try {
      if (item.id?.toString().startsWith('offline_inc_')) {
        await api.post('/incidentes', item);
      } else {
        await api.put(`/incidentes/${item.id}`, item);
      }
      synced++;
    } catch {}
  }

  if (synced > 0) {
    store.dispatch(clearPendingSync());
    store.dispatch(clearIncidentPendingSync());
    store.dispatch(setLastSync(new Date().toISOString()));
  }

  // Re-fetch fresh data
  try {
    const [clRes, incRes] = await Promise.all([
      api.get('/checklists'),
      api.get('/incidentes'),
    ]);
    store.dispatch(setChecklists(clRes.data?.checklists || clRes.data || []));
    store.dispatch(setIncidents(incRes.data?.incidentes || incRes.data || []));
    store.dispatch(setLastSync(new Date().toISOString()));
    store.dispatch(setOnline(true));
  } catch {}

  syncInProgress = false;
  return synced;
}
