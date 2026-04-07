import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setIncidents } from '../store';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import OfflineBanner from '../components/OfflineBanner';
import { C, S, R, F, Sh } from '../theme';

const SEV_CONFIG: any = {
  critico: { label: 'Crítico', bg: C.dangerBg,  text: C.dangerDark,  border: C.dangerBorder,  dot: C.danger,  emoji: '🔴' },
  alto:    { label: 'Alto',    bg: C.warningBg, text: C.warningDark, border: C.warningBorder, dot: C.warning, emoji: '🟠' },
  medio:   { label: 'Médio',   bg: C.infoBg,    text: C.infoDark,    border: C.infoBorder,    dot: C.info,    emoji: '🔵' },
  baixo:   { label: 'Baixo',   bg: C.successBg, text: C.successDark, border: C.successBorder, dot: C.success, emoji: '🟢' },
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

  const counts: any = {
    critico: incidents.filter((i: any) => i.severidade === 'critico').length,
    alto:    incidents.filter((i: any) => i.severidade === 'alto').length,
    medio:   incidents.filter((i: any) => i.severidade === 'medio').length,
    baixo:   incidents.filter((i: any) => i.severidade === 'baixo').length,
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <OfflineBanner />

      <View style={s.header}>
        <View>
          <Text style={s.title}>Incidentes</Text>
          <Text style={s.subtitle}>{incidents.length} registrados</Text>
        </View>
        <TouchableOpacity style={s.newBtn} onPress={() => navigation.navigate('NewIncident')}>
          <Text style={s.newBtnTxt}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {/* Cards de severidade */}
      <View style={s.sevRow}>
        {Object.entries(counts).map(([key, val]) => {
          const cfg = SEV_CONFIG[key];
          return (
            <TouchableOpacity
              key={key}
              style={[s.sevCard, { backgroundColor: cfg.bg, borderColor: filter === key ? cfg.dot : 'transparent', borderWidth: 2 }]}
              onPress={() => setFilter(filter === key ? 'Todos' : key)}
            >
              <Text style={s.sevEmoji}>{cfg.emoji}</Text>
              <Text style={[s.sevVal, { color: cfg.text }]}>{val as number}</Text>
              <Text style={[s.sevLabel, { color: cfg.text }]}>{cfg.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Filter pills */}
      <View style={s.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.chip, filter === f && s.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.chipTxt, filter === f && s.chipActiveTxt]}>
              {f === 'Todos' ? 'Todos' : SEV_CONFIG[f]?.emoji + ' ' + SEV_CONFIG[f]?.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={C.primary} />}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>⚠️</Text>
            <Text style={s.emptyTxt}>Nenhum incidente registrado</Text>
            <Text style={s.emptySub}>Registre incidentes para acompanhar a segurança</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = SEV_CONFIG[item.severidade] || SEV_CONFIG.baixo;
          const data = item.data_criacao ? new Date(item.data_criacao).toLocaleDateString('pt-BR') : '—';
          return (
            <View style={[s.card, { borderLeftColor: cfg.dot, borderLeftWidth: 4 }]}>
              <View style={s.cardTop}>
                <View style={[s.sevBadge, { backgroundColor: cfg.bg }]}>
                  <Text style={s.sevBadgeEmoji}>{cfg.emoji}</Text>
                  <Text style={[s.sevBadgeTxt, { color: cfg.text }]}>{cfg.label}</Text>
                </View>
                <View style={{ flex: 1 }} />
                <Text style={s.cardDate}>{data}</Text>
                <StatusBadge type="status" value={item.status || 'aberto'} showDot={false} />
              </View>

              <Text style={s.cardTitle}>{item.titulo}</Text>
              <Text style={s.cardDesc} numberOfLines={2}>{item.descricao}</Text>

              <View style={s.cardFooter}>
                <Text style={s.footerItem}>📍 {item.local || item.obra || '—'}</Text>
                <Text style={s.footerDot}>·</Text>
                <Text style={s.footerItem}>🏷️ {item.tipo || '—'}</Text>
                <Text style={s.footerDot}>·</Text>
                <Text style={s.footerItem}>👤 {item.responsavel || '—'}</Text>
              </View>

              {item.acao ? (
                <View style={s.acaoBox}>
                  <Text style={s.acaoLabel}>Ação:</Text>
                  <Text style={s.acaoTxt} numberOfLines={1}>{item.acao}</Text>
                </View>
              ) : null}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: S.md },
  title: { fontSize: F.xxl, fontWeight: '800', color: C.textPrimary },
  subtitle: { fontSize: F.sm, color: C.textTertiary, marginTop: 2 },
  newBtn: { backgroundColor: C.danger, borderRadius: R.full, paddingHorizontal: S.md, paddingVertical: S.sm, ...Sh.md },
  newBtnTxt: { fontWeight: '800', fontSize: F.sm, color: C.white },

  sevRow: { flexDirection: 'row', paddingHorizontal: S.md, gap: S.sm, marginBottom: S.sm },
  sevCard: { flex: 1, borderRadius: R.xl, padding: S.sm, alignItems: 'center', gap: 2 },
  sevEmoji: { fontSize: 18 },
  sevVal: { fontSize: F.xl, fontWeight: '900' },
  sevLabel: { fontSize: F.xs, fontWeight: '700' },

  filterRow: { flexDirection: 'row', paddingHorizontal: S.md, gap: S.xs, marginBottom: S.sm, flexWrap: 'wrap' },
  chip: { paddingHorizontal: S.sm, paddingVertical: S.xs + 1, borderRadius: R.full, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.black, borderColor: C.black },
  chipTxt: { fontSize: F.xs, color: C.textSecondary, fontWeight: '700' },
  chipActiveTxt: { color: C.primary },

  list: { padding: S.md, gap: S.sm, paddingBottom: 100 },

  emptyBox: { alignItems: 'center', padding: S.xxl },
  emptyEmoji: { fontSize: 48, marginBottom: S.md },
  emptyTxt: { fontSize: F.lg, fontWeight: '700', color: C.textPrimary },
  emptySub: { fontSize: F.sm, color: C.textTertiary, textAlign: 'center', marginTop: S.xs },

  card: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, ...Sh.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.sm },
  sevBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 3 },
  sevBadgeEmoji: { fontSize: F.xs },
  sevBadgeTxt: { fontSize: F.xs, fontWeight: '800' },
  cardDate: { fontSize: F.xs, color: C.textTertiary, marginRight: S.xs },
  cardTitle: { fontSize: F.md, fontWeight: '700', color: C.textPrimary, marginBottom: S.xs },
  cardDesc: { fontSize: F.sm, color: C.textSecondary, marginBottom: S.sm, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: S.xs },
  footerItem: { fontSize: F.xs, color: C.textTertiary },
  footerDot: { color: C.textTertiary, fontSize: F.xs },
  acaoBox: { flexDirection: 'row', gap: S.xs, backgroundColor: C.successBg, borderRadius: R.md, padding: S.sm, marginTop: S.sm },
  acaoLabel: { fontSize: F.xs, fontWeight: '800', color: C.successDark },
  acaoTxt: { fontSize: F.xs, color: C.successDark, flex: 1 },
});
