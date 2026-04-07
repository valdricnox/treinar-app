import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setIncidents } from '../store';
import api from '../services/api';
import { C, S, R, F, Sh } from '../theme';

const SEV: any = {
  critico: { label: 'Crítico', bg: C.dangerBg, text: C.dangerDark, dot: C.danger },
  alto: { label: 'Alto', bg: C.warningBg, text: C.warningDark, dot: C.warning },
  medio: { label: 'Médio', bg: C.infoBg, text: C.infoDark, dot: C.info },
  baixo: { label: 'Baixo', bg: C.successBg, text: C.successDark, dot: C.success },
};

export default function IncidentsScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const incidents = useSelector((s: RootState) => s.incidents.list);
  const [filter, setFilter] = useState('Todos');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/incidentes');
      dispatch(setIncidents(res.data?.incidentes || res.data || []));
    } catch {}
    finally { setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const filters = ['Todos', 'critico', 'alto', 'medio', 'baixo'];
  const filtered = filter === 'Todos' ? incidents : incidents.filter((i: any) => i.severidade === filter);

  const counts = {
    critico: incidents.filter((i: any) => i.severidade === 'critico').length,
    alto: incidents.filter((i: any) => i.severidade === 'alto').length,
    medio: incidents.filter((i: any) => i.severidade === 'medio').length,
    baixo: incidents.filter((i: any) => i.severidade === 'baixo').length,
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Incidentes</Text>
        <TouchableOpacity style={s.newBtn} onPress={() => navigation.navigate('NewIncident')}>
          <Text style={s.newBtnTxt}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      <View style={s.statsRow}>
        {Object.entries(counts).map(([k, v]) => {
          const sev = SEV[k];
          return (
            <View key={k} style={[s.statCard, { backgroundColor: sev.bg }]}>
              <Text style={[s.statVal, { color: sev.text }]}>{v as number}</Text>
              <Text style={[s.statLabel, { color: sev.text }]}>{sev.label}</Text>
            </View>
          );
        })}
      </View>

      <View style={s.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.chip, filter === f && s.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.chipTxt, filter === f && s.chipActiveTxt]}>
              {f === 'Todos' ? 'Todos' : SEV[f]?.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={C.primary} />}
        contentContainerStyle={s.list}
        ListEmptyComponent={<Text style={s.empty}>Nenhum incidente registrado.</Text>}
        renderItem={({ item }) => {
          const sev = SEV[item.severidade] || SEV.baixo;
          return (
            <View style={s.card}>
              <View style={s.cardTop}>
                <View style={[s.sevDot, { backgroundColor: sev.dot }]} />
                <View style={[s.sevBadge, { backgroundColor: sev.bg }]}>
                  <Text style={[s.sevTxt, { color: sev.text }]}>{sev.label}</Text>
                </View>
                <Text style={s.cardDate}>{new Date(item.data_criacao).toLocaleDateString('pt-BR')}</Text>
              </View>
              <Text style={s.cardTitle}>{item.titulo}</Text>
              <Text style={s.cardDesc} numberOfLines={2}>{item.descricao}</Text>
              <View style={s.cardFooter}>
                <Text style={s.cardMeta}>📍 {item.local || item.obra}</Text>
                <Text style={s.cardMeta}>🏷 {item.tipo}</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.offWhite },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: S.md },
  title: { fontSize: F.xxl, fontWeight: '800', color: C.textPrimary },
  newBtn: { backgroundColor: C.primary, borderRadius: R.md, paddingHorizontal: S.md, paddingVertical: S.sm },
  newBtnTxt: { fontWeight: '700', fontSize: F.sm, color: C.black },
  statsRow: { flexDirection: 'row', paddingHorizontal: S.md, gap: S.sm, marginBottom: S.sm },
  statCard: { flex: 1, borderRadius: R.lg, padding: S.sm, alignItems: 'center' },
  statVal: { fontSize: F.xl, fontWeight: '800' },
  statLabel: { fontSize: F.xs, fontWeight: '600' },
  filterRow: { flexDirection: 'row', paddingHorizontal: S.md, gap: S.xs, marginBottom: S.sm, flexWrap: 'wrap' },
  chip: { paddingHorizontal: S.sm, paddingVertical: S.xs, borderRadius: R.full, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  chipActive: { backgroundColor: C.black, borderColor: C.black },
  chipTxt: { fontSize: F.xs, color: C.textSecondary, fontWeight: '600' },
  chipActiveTxt: { color: C.primary },
  list: { padding: S.md, gap: S.sm, paddingBottom: S.xxl },
  empty: { textAlign: 'center', color: C.textMuted, marginTop: S.xxl },
  card: { backgroundColor: C.card, borderRadius: R.xl, padding: S.md, ...Sh.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.sm },
  sevDot: { width: 10, height: 10, borderRadius: R.full },
  sevBadge: { borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 2 },
  sevTxt: { fontSize: F.xs, fontWeight: '700' },
  cardDate: { fontSize: F.xs, color: C.textMuted, marginLeft: 'auto' },
  cardTitle: { fontSize: F.md, fontWeight: '700', color: C.textPrimary, marginBottom: S.xs },
  cardDesc: { fontSize: F.sm, color: C.textSecondary, marginBottom: S.sm },
  cardFooter: { flexDirection: 'row', gap: S.md },
  cardMeta: { fontSize: F.xs, color: C.textMuted },
});
