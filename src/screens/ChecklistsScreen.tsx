import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Pressable, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import {
  RootState, setChecklists, archiveChecklist,
  unarchiveChecklist, removeChecklist,
} from '../store';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { C, S, R, F, Sh } from '../theme';

const NRS = ['Todas','NR-5','NR-6','NR-7','NR-9','NR-10','NR-11','NR-12','NR-17','NR-18','NR-20','NR-21','NR-23','NR-26','NR-33','NR-35'];
const STALE_MS = 60_000;

export default function ChecklistsScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const list = useSelector((s: RootState) => s.checklists.list);
  const archived = useSelector((s: RootState) => (s.checklists as any).archived || []);
  const lastFetched = useSelector((s: RootState) => (s.checklists as any).lastFetched);
  const [search, setSearch] = useState('');
  const [nrFilter, setNrFilter] = useState('Todas');
  const [refreshing, setRefreshing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [menuItem, setMenuItem] = useState<any>(null);

  const load = useCallback(async (force = false) => {
    const age = lastFetched ? Date.now() - new Date(lastFetched).getTime() : Infinity;
    if (!force && age < STALE_MS) return;
    setRefreshing(true);
    try {
      const res = await api.get('/checklists');
      dispatch(setChecklists(res.data?.checklists || res.data || []));
    } catch {}
    finally { setRefreshing(false); }
  }, [lastFetched]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = list.filter((c: any) => {
    const matchNr = nrFilter === 'Todas' || c.norma === nrFilter;
    const matchSearch = !search ||
      c.titulo?.toLowerCase().includes(search.toLowerCase()) ||
      c.obra?.toLowerCase().includes(search.toLowerCase());
    return matchNr && matchSearch;
  });

  const confirmarArquivar = (item: any) => {
    setMenuItem(null);
    Alert.alert(
      'Arquivar inspeção',
      `"${item.titulo}" será arquivada. Você pode restaurá-la depois.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Arquivar', onPress: () => {
          dispatch(archiveChecklist(item.id));
          try { api.put(`/checklists/${item.id}`, { status: 'arquivado' }); } catch {}
        }},
      ]
    );
  };

  const confirmarExcluir = (item: any) => {
    setMenuItem(null);
    Alert.alert(
      'Excluir inspeção',
      `"${item.titulo}" será excluída permanentemente e não poderá ser recuperada.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => {
          dispatch(removeChecklist(item.id));
          try { api.delete(`/checklists/${item.id}`); } catch {}
        }},
      ]
    );
  };

  const concluidos = list.filter((c: any) => c.status === 'concluido').length;
  const emAndamento = list.filter((c: any) => c.status === 'em_andamento').length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      <View style={s.header}>
        <View>
          <Text style={s.title}>Inspeções</Text>
          <Text style={s.subtitle}>{list.length} ativas · {emAndamento} em andamento</Text>
        </View>
        <View style={s.headerRight}>
          {archived.length > 0 && (
            <Pressable style={s.archivedBtn} onPress={() => setShowArchived(true)}>
              <Text style={s.archivedBtnTxt}>📦 {archived.length}</Text>
            </Pressable>
          )}
          <Pressable style={s.newBtn} onPress={() => navigation.navigate('NewChecklist')}>
            <Text style={s.newBtnTxt}>+ Nova</Text>
          </Pressable>
        </View>
      </View>

      <View style={s.statsBar}>
        <View style={[s.statPill, { backgroundColor: C.successBg }]}>
          <Text style={[s.statVal, { color: C.successDark }]}>{concluidos}</Text>
          <Text style={[s.statLbl, { color: C.successDark }]}>Concluídas</Text>
        </View>
        <View style={[s.statPill, { backgroundColor: C.warningBg }]}>
          <Text style={[s.statVal, { color: C.warningDark }]}>{emAndamento}</Text>
          <Text style={[s.statLbl, { color: C.warningDark }]}>Em andamento</Text>
        </View>
        <View style={[s.statPill, { backgroundColor: C.gray100 }]}>
          <Text style={[s.statVal, { color: C.gray500 }]}>{archived.length}</Text>
          <Text style={[s.statLbl, { color: C.gray500 }]}>Arquivadas</Text>
        </View>
      </View>

      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput style={s.search} value={search} onChangeText={setSearch}
          placeholder="Buscar por título ou obra..." placeholderTextColor={C.textTertiary} />
        {search ? <Pressable onPress={() => setSearch('')} hitSlop={8}><Text style={s.clearBtn}>✕</Text></Pressable> : null}
      </View>

      <FlatList horizontal data={NRS} keyExtractor={(i) => i} showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterList}
        renderItem={({ item }) => (
          <Pressable style={[s.chip, nrFilter === item && s.chipActive]} onPress={() => setNrFilter(item)}>
            <Text style={[s.chipTxt, nrFilter === item && s.chipActiveTxt]}>{item}</Text>
          </Pressable>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.primary} />}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>📋</Text>
            <Text style={s.emptyTxt}>{search || nrFilter !== 'Todas' ? 'Nenhuma encontrada' : 'Nenhuma inspeção ativa'}</Text>
            <Text style={s.emptySub}>{search || nrFilter !== 'Todas' ? 'Ajuste os filtros' : 'Toque em "+ Nova" para criar'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[s.card, item._pendingSync && s.cardOffline]}>
            <Pressable style={s.cardBody} onPress={() => navigation.navigate('ChecklistWizard', { checklist: item })}
              android_ripple={{ color: 'rgba(0,0,0,0.04)' }}>
              <View style={s.cardTop}>
                <View style={s.nrPill}><Text style={s.nrPillTxt}>{item.norma}</Text></View>
                <View style={{ flex: 1 }} />
                <StatusBadge type="status" value={item.status || 'pendente'} />
              </View>
              <Text style={s.cardTitle} numberOfLines={2}>{item.titulo}</Text>
              <View style={s.cardMeta}>
                <Text style={s.metaItem}>📍 {item.obra || '—'}</Text>
                <Text style={s.metaDot}>·</Text>
                <Text style={s.metaItem}>👤 {item.responsavel || '—'}</Text>
              </View>
              <View style={s.progressRow}>
                <View style={s.progBg}>
                  <View style={[s.progFill, { width: `${item.progresso || 0}%`, backgroundColor: item.status === 'concluido' ? C.success : C.primary }]} />
                </View>
                <Text style={s.progPct}>{item.progresso || 0}%</Text>
              </View>
            </Pressable>
            <Pressable style={s.moreBtn} onPress={() => setMenuItem(item)} hitSlop={4}>
              <Text style={s.moreBtnTxt}>•••</Text>
            </Pressable>
          </View>
        )}
      />

      {/* ── Context menu ── */}
      <Modal visible={!!menuItem} transparent animationType="slide" onRequestClose={() => setMenuItem(null)}>
        <Pressable style={s.overlay} onPress={() => setMenuItem(null)}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle} numberOfLines={1}>{menuItem?.titulo}</Text>
            <Text style={s.sheetSubtitle}>{menuItem?.norma} · {menuItem?.obra}</Text>
            <View style={s.sheetDivider} />
            <Pressable style={s.sheetItem} onPress={() => { navigation.navigate('ChecklistWizard', { checklist: menuItem }); setMenuItem(null); }}>
              <Text style={s.sheetItemIcon}>✏️</Text>
              <Text style={s.sheetItemTxt}>Abrir e editar</Text>
            </Pressable>
            <Pressable style={s.sheetItem} onPress={() => confirmarArquivar(menuItem)}>
              <Text style={s.sheetItemIcon}>📦</Text>
              <Text style={s.sheetItemTxt}>Arquivar inspeção</Text>
            </Pressable>
            <View style={s.sheetDivider} />
            <Pressable style={s.sheetItem} onPress={() => confirmarExcluir(menuItem)}>
              <Text style={s.sheetItemIcon}>🗑️</Text>
              <Text style={[s.sheetItemTxt, { color: C.danger }]}>Excluir permanentemente</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ── Modal arquivadas ── */}
      <Modal visible={showArchived} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowArchived(false)}>
        <SafeAreaView style={s.safe}>
          <View style={s.archivedHeader}>
            <Text style={s.archivedHeaderTitle}>Inspeções Arquivadas</Text>
            <Pressable onPress={() => setShowArchived(false)} hitSlop={8}>
              <Text style={s.sheetClose}>✕</Text>
            </Pressable>
          </View>
          <FlatList
            data={archived}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={s.emptyBox}>
                <Text style={s.emptyEmoji}>📦</Text>
                <Text style={s.emptyTxt}>Nenhuma inspeção arquivada</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[s.card, { borderColor: C.gray300, opacity: 0.9 }]}>
                <View style={s.cardBody}>
                  <View style={s.cardTop}>
                    <View style={s.nrPill}><Text style={s.nrPillTxt}>{item.norma}</Text></View>
                    <View style={{ flex: 1 }} />
                    <View style={s.archivedTag}><Text style={s.archivedTagTxt}>Arquivada</Text></View>
                  </View>
                  <Text style={s.cardTitle} numberOfLines={1}>{item.titulo}</Text>
                  <Text style={s.metaItem}>📍 {item.obra || '—'}</Text>
                  {item.archivedAt && (
                    <Text style={[s.metaItem, { marginTop: 2 }]}>
                      Arquivada em {new Date(item.archivedAt).toLocaleDateString('pt-BR')}
                    </Text>
                  )}
                  <View style={s.archivedActions}>
                    <Pressable style={s.restoreBtn} onPress={() => { dispatch(unarchiveChecklist(item.id)); try { api.put(`/checklists/${item.id}`, { status: 'em_andamento' }); } catch {} }}>
                      <Text style={s.restoreBtnTxt}>↩ Restaurar</Text>
                    </Pressable>
                    <Pressable style={s.deleteBtn} onPress={() => Alert.alert('Excluir', `"${item.titulo}" será excluída para sempre.`, [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Excluir', style: 'destructive', onPress: () => { dispatch(removeChecklist(item.id)); try { api.delete(`/checklists/${item.id}`); } catch {} } },
                    ])}>
                      <Text style={s.deleteBtnTxt}>🗑 Excluir</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: S.md, paddingBottom: S.sm },
  title: { fontSize: F.xxl, fontWeight: '800', color: C.textPrimary },
  subtitle: { fontSize: F.sm, color: C.textTertiary, marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: S.sm, alignItems: 'center' },
  archivedBtn: { backgroundColor: C.card, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: S.xs, borderWidth: 1, borderColor: C.border },
  archivedBtnTxt: { fontSize: F.xs, fontWeight: '700', color: C.textSecondary },
  newBtn: { backgroundColor: C.primary, borderRadius: R.full, paddingHorizontal: S.md, paddingVertical: S.sm, ...Sh.colored },
  newBtnTxt: { fontWeight: '800', fontSize: F.sm, color: C.black },
  statsBar: { flexDirection: 'row', gap: S.sm, paddingHorizontal: S.md, marginBottom: S.sm },
  statPill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: R.lg, padding: S.sm },
  statVal: { fontSize: F.md, fontWeight: '800' },
  statLbl: { fontSize: F.xs, fontWeight: '600' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: R.xl, marginHorizontal: S.md, marginBottom: S.sm, paddingHorizontal: S.md, borderWidth: 1, borderColor: C.border, ...Sh.xs },
  searchIcon: { fontSize: F.sm, marginRight: S.xs },
  search: { flex: 1, paddingVertical: S.sm + 2, fontSize: F.sm, color: C.textPrimary },
  clearBtn: { fontSize: F.sm, color: C.textTertiary, padding: S.xs },
  filterList: { paddingHorizontal: S.md, gap: S.xs, paddingBottom: S.sm },
  chip: { paddingHorizontal: S.md, paddingVertical: S.xs + 2, borderRadius: R.full, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.black, borderColor: C.black },
  chipTxt: { fontSize: F.xs, color: C.textSecondary, fontWeight: '700' },
  chipActiveTxt: { color: C.primary },
  list: { padding: S.md, gap: S.sm, paddingBottom: 100 },
  emptyBox: { alignItems: 'center', padding: S.xxl },
  emptyEmoji: { fontSize: 48, marginBottom: S.md },
  emptyTxt: { fontSize: F.lg, fontWeight: '700', color: C.textPrimary },
  emptySub: { fontSize: F.sm, color: C.textTertiary, marginTop: S.xs },
  card: { backgroundColor: C.card, borderRadius: R.xxl, overflow: 'hidden', borderWidth: 1, borderColor: C.border, ...Sh.sm, flexDirection: 'row', alignItems: 'stretch' },
  cardOffline: { borderColor: C.warningBorder },
  cardBody: { flex: 1, padding: S.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.sm },
  nrPill: { backgroundColor: C.black, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 3 },
  nrPillTxt: { color: C.primary, fontSize: F.xs, fontWeight: '800' },
  cardTitle: { fontSize: F.md, fontWeight: '700', color: C.textPrimary, marginBottom: S.sm },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginBottom: S.sm },
  metaItem: { fontSize: F.xs, color: C.textTertiary },
  metaDot: { color: C.textTertiary, fontSize: F.xs },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  progBg: { flex: 1, height: 5, backgroundColor: C.gray200, borderRadius: R.full, overflow: 'hidden' },
  progFill: { height: 5, borderRadius: R.full },
  progPct: { fontSize: F.xs, fontWeight: '800', color: C.textSecondary, width: 34, textAlign: 'right' },
  moreBtn: { width: 40, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderLeftColor: C.border },
  moreBtnTxt: { fontSize: F.xs, color: C.textTertiary, fontWeight: '800', letterSpacing: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, padding: S.lg, paddingBottom: S.xxxl },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.gray300, alignSelf: 'center', marginBottom: S.md },
  sheetTitle: { fontSize: F.md, fontWeight: '700', color: C.textPrimary },
  sheetSubtitle: { fontSize: F.xs, color: C.textTertiary, marginTop: 2, marginBottom: S.sm },
  sheetDivider: { height: 1, backgroundColor: C.border, marginVertical: S.xs },
  sheetItem: { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.md, borderRadius: R.lg },
  sheetItemIcon: { fontSize: F.lg, width: 28 },
  sheetItemTxt: { fontSize: F.md, color: C.textPrimary, fontWeight: '500' },
  sheetClose: { fontSize: F.lg, color: C.textTertiary },
  archivedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: S.md, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.card },
  archivedHeaderTitle: { fontSize: F.lg, fontWeight: '800', color: C.textPrimary },
  archivedTag: { backgroundColor: C.gray100, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 2 },
  archivedTagTxt: { fontSize: F.xs, fontWeight: '600', color: C.gray500 },
  archivedActions: { flexDirection: 'row', gap: S.sm, marginTop: S.sm },
  restoreBtn: { flex: 1, backgroundColor: C.successBg, borderRadius: R.lg, padding: S.sm, alignItems: 'center', borderWidth: 1, borderColor: C.successBorder },
  restoreBtnTxt: { fontSize: F.sm, fontWeight: '700', color: C.successDark },
  deleteBtn: { flex: 1, backgroundColor: C.dangerBg, borderRadius: R.lg, padding: S.sm, alignItems: 'center', borderWidth: 1, borderColor: C.dangerBorder },
  deleteBtnTxt: { fontSize: F.sm, fontWeight: '700', color: C.dangerDark },
  gray100: '#F2F2F7',
  gray300: '#C7C7CC',
  gray500: '#8E8E93',
});
