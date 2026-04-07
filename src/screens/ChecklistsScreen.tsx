import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setChecklists } from '../store';
import api from '../services/api';
import { C, S, R, F, Sh } from '../theme';

const NRS = ['Todas', 'NR-6', 'NR-10', 'NR-12', 'NR-18', 'NR-23', 'NR-33', 'NR-35'];
const STATUS = ['Todos', 'em_andamento', 'concluido', 'pendente'];
const STATUS_LABEL: any = { em_andamento: 'Em Andamento', concluido: 'Concluído', pendente: 'Pendente' };
const STATUS_COLOR: any = {
  em_andamento: { bg: C.warningBg, text: C.warningDark },
  concluido: { bg: C.successBg, text: C.successDark },
  pendente: { bg: C.infoBg, text: C.infoDark },
};

export default function ChecklistsScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const checklists = useSelector((s: RootState) => s.checklists.list);
  const [search, setSearch] = useState('');
  const [nrFilter, setNrFilter] = useState('Todas');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/checklists');
      dispatch(setChecklists(res.data?.checklists || res.data || []));
    } catch {}
    finally { setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = checklists.filter((c: any) => {
    const matchNr = nrFilter === 'Todas' || c.norma === nrFilter;
    const matchStatus = statusFilter === 'Todos' || c.status === statusFilter;
    const matchSearch = !search || c.titulo?.toLowerCase().includes(search.toLowerCase()) || c.obra?.toLowerCase().includes(search.toLowerCase());
    return matchNr && matchStatus && matchSearch;
  });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Checklists</Text>
        <TouchableOpacity style={s.newBtn} onPress={() => navigation.navigate('NewChecklist')}>
          <Text style={s.newBtnTxt}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={s.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar por título ou obra..."
        placeholderTextColor={C.textMuted}
      />

      <View style={s.filterRow}>
        {NRS.map((n) => (
          <TouchableOpacity
            key={n}
            style={[s.chip, nrFilter === n && s.chipActive]}
            onPress={() => setNrFilter(n)}
          >
            <Text style={[s.chipTxt, nrFilter === n && s.chipActiveTxt]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={C.primary} />}
        contentContainerStyle={s.list}
        ListEmptyComponent={<Text style={s.empty}>Nenhuma inspeção encontrada.</Text>}
        renderItem={({ item }) => {
          const sc = STATUS_COLOR[item.status] || STATUS_COLOR.pendente;
          return (
            <TouchableOpacity
              style={s.card}
              onPress={() => navigation.navigate('ChecklistDetail', { checklist: item })}
            >
              <View style={s.cardTop}>
                <View style={s.nrBadge}>
                  <Text style={s.nrTxt}>{item.norma}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[s.statusTxt, { color: sc.text }]}>{STATUS_LABEL[item.status] || item.status}</Text>
                </View>
              </View>
              <Text style={s.cardTitle} numberOfLines={2}>{item.titulo}</Text>
              <Text style={s.cardSub}>📍 {item.obra} • 👤 {item.responsavel}</Text>
              <View style={s.progressRow}>
                <View style={s.progBg}>
                  <View style={[s.progFill, { width: `${item.progresso || 0}%` }]} />
                </View>
                <Text style={s.progTxt}>{item.progresso || 0}%</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.offWhite },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: S.md, paddingBottom: S.sm },
  title: { fontSize: F.xxl, fontWeight: '800', color: C.textPrimary },
  newBtn: { backgroundColor: C.primary, borderRadius: R.md, paddingHorizontal: S.md, paddingVertical: S.sm },
  newBtnTxt: { fontWeight: '700', fontSize: F.sm, color: C.black },
  search: {
    marginHorizontal: S.md, marginBottom: S.sm, borderWidth: 1, borderColor: C.border,
    borderRadius: R.lg, padding: S.sm + 4, fontSize: F.sm, color: C.textPrimary, backgroundColor: C.white,
  },
  filterRow: { flexDirection: 'row', paddingHorizontal: S.md, gap: S.xs, marginBottom: S.sm, flexWrap: 'wrap' },
  chip: { paddingHorizontal: S.sm, paddingVertical: S.xs, borderRadius: R.full, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  chipActive: { backgroundColor: C.black, borderColor: C.black },
  chipTxt: { fontSize: F.xs, color: C.textSecondary, fontWeight: '600' },
  chipActiveTxt: { color: C.primary },
  list: { padding: S.md, gap: S.sm, paddingBottom: S.xxl },
  empty: { textAlign: 'center', color: C.textMuted, marginTop: S.xxl },
  card: { backgroundColor: C.card, borderRadius: R.xl, padding: S.md, ...Sh.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: S.sm },
  nrBadge: { backgroundColor: C.black, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 2 },
  nrTxt: { color: C.primary, fontSize: F.xs, fontWeight: '700' },
  statusBadge: { borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 2 },
  statusTxt: { fontSize: F.xs, fontWeight: '600' },
  cardTitle: { fontSize: F.md, fontWeight: '700', color: C.textPrimary, marginBottom: S.xs },
  cardSub: { fontSize: F.xs, color: C.textSecondary, marginBottom: S.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  progBg: { flex: 1, height: 6, backgroundColor: C.border, borderRadius: R.full, overflow: 'hidden' },
  progFill: { height: 6, backgroundColor: C.primary, borderRadius: R.full },
  progTxt: { fontSize: F.xs, fontWeight: '700', color: C.textSecondary, width: 32, textAlign: 'right' },
});
