import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, RefreshControl } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setChecklists, setIncidents } from '../store';
import { checklistApi, incidentApi } from '../services/api';

export default function DashboardScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const checklists = useSelector((s: RootState) => s.checklists.items);
  const incidents = useSelector((s: RootState) => s.incidents.items);
  const isOffline = useSelector((s: RootState) => s.app.isOffline);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try {
      const [cl, inc] = await Promise.all([checklistApi.listar(), incidentApi.listar()]);
      dispatch(setChecklists(cl.data));
      dispatch(setIncidents(inc.data));
    } catch {}
  };

  useEffect(() => { fetch(); }, []);

  const pendentes = checklists.filter(c => c.status === 'pendente').length;
  const criticos = incidents.filter(i => i.severidade === 'alta' && i.status === 'aberto').length;
  const initials = user?.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') ?? 'TR';
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      <View style={s.header}>
        {isOffline && <View style={s.offline}><Text style={s.offlineTxt}>Modo offline</Text></View>}
        <View style={s.headerRow}>
          <View>
            <Text style={s.saudacao}>{saudacao},</Text>
            <Text style={s.name}>{user?.name ?? 'Inspetor'}</Text>
          </View>
          <View style={s.avatar}><Text style={s.avatarTxt}>{initials}</Text></View>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetch(); setRefreshing(false); }} tintColor="#F5C800" />}>
        <View style={s.grid}>
          {[
            { titulo: 'Checklists', count: `${pendentes} pendentes`, cor: '#F5C800', route: 'Checklists' },
            { titulo: 'Incidentes', count: `${criticos} criticos`, cor: '#C62828', route: 'Incidents' },
            { titulo: 'Nova Inspecao', count: 'NR-18, 35, 6, 12', cor: '#2E7D32', route: 'NewChecklist' },
            { titulo: 'Relatorios', count: 'PDFs gerados', cor: '#1565C0', route: 'Reports' },
          ].map(c => (
            <TouchableOpacity key={c.titulo} style={[s.card, { borderLeftColor: c.cor, borderLeftWidth: 4 }]} onPress={() => navigation.navigate(c.route)}>
              <Text style={s.cardTitle}>{c.titulo}</Text>
              <Text style={[s.cardCount, { color: c.cor }]}>{c.count}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.statsRow}>
          {[
            { num: checklists.length, label: 'Inspecoes' },
            { num: checklists.filter(c => c.status === 'concluido').length, label: 'Concluidas' },
            { num: incidents.length, label: 'Ocorrencias' },
          ].map(st => (
            <View key={st.label} style={s.stat}>
              <Text style={s.statNum}>{st.num}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={s.btnIncident} onPress={() => navigation.navigate('NewIncident')}>
          <Text style={s.btnIncTxt}>Reportar Incidente</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F6' },
  header: { backgroundColor: '#1A1A1A', paddingTop: 52, paddingHorizontal: 24, paddingBottom: 24 },
  offline: { backgroundColor: '#F57F17', borderRadius: 6, padding: 8, marginBottom: 12 },
  offlineTxt: { fontSize: 12, color: '#FFF', textAlign: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  saudacao: { fontSize: 12, color: '#999990' },
  name: { fontSize: 22, color: '#FFF', fontWeight: '700' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5C800', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  card: { width: '47%', backgroundColor: '#FFF', borderRadius: 14, padding: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  cardCount: { fontSize: 11, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  stat: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 14, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '700', color: '#F5C800' },
  statLabel: { fontSize: 10, color: '#999990', marginTop: 2, textAlign: 'center' },
  btnIncident: { backgroundColor: '#FFEBEE', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#C6282840' },
  btnIncTxt: { fontSize: 15, fontWeight: '700', color: '#C62828' },
});
