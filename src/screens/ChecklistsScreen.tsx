import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setChecklists, removeChecklist } from '../store';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { C, S, R, F, Sh } from '../theme';

const NRS = ['Todas', 'NR-5', 'NR-6', 'NR-7', 'NR-9', 'NR-10', 'NR-11', 'NR-12', 'NR-17', 'NR-18', 'NR-20', 'NR-21', 'NR-23', 'NR-26', 'NR-33', 'NR-35'];

export default function ChecklistsScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const checklists = useSelector((s: RootState) => s.checklists.list);
  const [search, setSearch] = useState('');
  const [nrFilter, setNrFilter] = useState('Todas');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/checklists');
      dispatch(setChecklists(res.data?.checklists || res.data || []));
    } catch {}
    finally { setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);



  const filtered = checklists.filter((c: any) => {
    const matchNr = nrFilter === 'Todas' || c.norma === nrFilter;
    const matchSearch = !search || c.titulo?.toLowerCase().includes(search.toLowerCase()) || c.obra?.toLowerCase().includes(search.toLowerCase());
    return matchNr && matchSearch;
  });

  const concluidos = checklists.filter((c: any) => c.status === 'concluido').length;
  const emAndamento = checklists.filter((c: any) => c.status === 'em_andamento').length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Inspeções</Text>
          <Text style={s.subtitle}>{checklists.length} registradas · {emAndamento} em andamento</Text>
        </View>
        <TouchableOpacity style={s.newBtn} onPress={() => navigation.navigate('NewChecklist')}>
          <Text style={s.newBtnTxt}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      {/* Stats rápidos */}
      <View style={s.statsBar}>
        <View style={[s.statPill, { backgroundColor: C.successBg }]}>
          <Text style={[s.statVal, { color: C.successDark }]}>{concluidos}</Text>
          <Text style={[s.statLbl, { color: C.successDark }]}>Concluídas</Text>
        </View>
        <View style={[s.statPill, { backgroundColor: C.warningBg }]}>
          <Text style={[s.statVal, { color: C.warningDark }]}>{emAndamento}</Text>
          <Text style={[s.statLbl, { color: C.warningDark }]}>Em Andamento</Text>
        </View>
        <View style={[s.statPill, { backgroundColor: C.infoBg }]}>
          <Text style={[s.statVal, { color: C.infoDark }]}>{checklists.filter((c: any) => c._pendingSync).length}</Text>
          <Text style={[s.statLbl, { color: C.infoDark }]}>Pendente Sync</Text>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por título ou obra..."
          placeholderTextColor={C.textTertiary}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={s.clearBtn}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* NR filter chips */}
      <FlatList
        horizontal
        data={NRS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.chip, nrFilter === item && s.chipActive]}
            onPress={() => setNrFilter(item)}
          >
            <Text style={[s.chipTxt, nrFilter === item && s.chipActiveTxt]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={C.primary} />}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>📋</Text>
            <Text style={s.emptyTxt}>Nenhuma inspeção encontrada</Text>
            <Text style={s.emptySub}>{search || nrFilter !== 'Todas' ? 'Tente ajustar os filtros' : 'Crie a primeira inspeção'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[s.card, item._pendingSync && s.cardOffline]}>
            <Pressable
              style={s.cardTouchable}
              onPress={() => navigation.navigate('ChecklistWizard', { checklist: item })}
              android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
            >
              <View style={s.cardTop}>
                <View style={s.nrPill}>
                  <Text style={s.nrPillTxt}>{item.norma}</Text>
                </View>
                <View style={{ flex: 1 }} />
                <StatusBadge type="status" value={item.status || 'pendente'} />
                {item._pendingSync && <Text style={s.offlineDot}>●</Text>}
              </View>
              <Text style={s.cardTitle} numberOfLines={2}>{item.titulo}</Text>
              <View style={s.cardMeta}>
                <Text style={s.metaItem}>📍 {item.obra || '—'}</Text>
                <Text style={s.metaDot}>·</Text>
                <Text style={s.metaItem}>👤 {item.responsavel || '—'}</Text>
              </View>
              <View style={s.progressRow}>
                <View style={s.progBg}>
                  <View style={[
                    s.progFill,
                    { width: `${item.progresso || 0}%` },
                    { backgroundColor: item.status === 'concluido' ? C.success : C.primary },
                  ]} />
                </View>
                <Text style={s.progPct}>{item.progresso || 0}%</Text>
              </View>
            </Pressable>
            <Pressable
              style={s.archiveBtn}
              onPress={() => Alert.alert(
                'Arquivar vistoria',
                `Deseja arquivar "${item.titulo}"?`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Arquivar', style: 'destructive', onPress: () => { dispatch(removeChecklist(item.id)); try { api.delete(`/checklists/${item.id}`); } catch {} } },
                ]
              )}
            >
              <Text style={s.archiveBtnTxt}>🗑️</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: S.md, paddingBottom: S.sm },
  title: { fontSize: F.xxl, fontWeight: '800', color: C.textPrimary },
  subtitle: { fontSize: F.sm, color: C.textTertiary, marginTop: 2 },
  newBtn: { backgroundColor: C.primary, borderRadius: R.full, paddingHorizontal: S.md, paddingVertical: S.sm, ...Sh.colored },
  newBtnTxt: { fontWeight: '800', fontSize: F.sm, color: C.black },

  statsBar: { flexDirection: 'row', gap: S.sm, paddingHorizontal: S.md, marginBottom: S.sm },
  statPill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: R.lg, padding: S.sm },
  statVal: { fontSize: F.md, fontWeight: '800' },
  statLbl: { fontSize: F.xs, fontWeight: '600' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: R.xl,
    marginHorizontal: S.md, marginBottom: S.sm,
    paddingHorizontal: S.md, borderWidth: 1, borderColor: C.border, ...Sh.xs,
  },
  searchIcon: { fontSize: F.sm, marginRight: S.xs },
  search: { flex: 1, paddingVertical: S.sm + 2, fontSize: F.sm, color: C.textPrimary },
  clearBtn: { fontSize: F.sm, color: C.textTertiary, padding: S.xs },

  filterList: { paddingHorizontal: S.md, gap: S.xs, paddingBottom: S.sm },
  chip: { paddingHorizontal: S.md, paddingVertical: S.xs + 2, borderRadius: R.full, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.black, borderColor: C.black },
  chipTxt: { fontSize: F.xs, color: C.textSecondary, fontWeight: '700' },
  chipActiveTxt: { color: C.primary },

  list: { padding: S.md, gap: S.sm, paddingBottom: 100 },

  card: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, ...Sh.sm },
  cardOffline: { borderWidth: 1, borderColor: C.warningBorder },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.sm },
  nrPill: { backgroundColor: C.black, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 3 },
  nrPillTxt: { color: C.primary, fontSize: F.xs, fontWeight: '800' },
  offlineDot: { color: C.warning, fontSize: 10 },

  cardTitle: { fontSize: F.md, fontWeight: '700', color: C.textPrimary, marginBottom: S.sm },

  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginBottom: S.sm },
  metaItem: { fontSize: F.xs, color: C.textTertiary },
  metaDot: { color: C.textTertiary },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  progBg: { flex: 1, height: 5, backgroundColor: C.gray200, borderRadius: R.full, overflow: 'hidden' },
  progFill: { height: 5, borderRadius: R.full },
  progPct: { fontSize: F.xs, fontWeight: '800', color: C.textSecondary, width: 34, textAlign: 'right' },

  emptyBox: { alignItems: 'center', padding: S.xxl },
  cardTouchable: { flex: 1 },
  archiveBtn: { width: 32, height: 32, borderRadius: R.md, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  archiveBtnTxt: { fontSize: F.sm },
  emptyEmoji: { fontSize: 48, marginBottom: S.md },
  emptyTxt: { fontSize: F.lg, fontWeight: '700', color: C.textPrimary },
  emptySub: { fontSize: F.sm, color: C.textTertiary, marginTop: S.xs },
});
