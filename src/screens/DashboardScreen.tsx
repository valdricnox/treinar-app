import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import api from '../services/api';
import { C, S, R, F, Sh } from '../theme';

const KPICard = ({ label, value, color, bg }: any) => (
  <View style={[s.kpi, { backgroundColor: bg }]}>
    <Text style={[s.kpiVal, { color }]}>{value}</Text>
    <Text style={s.kpiLabel}>{label}</Text>
  </View>
);

const NRBar = ({ nr, pct, color }: any) => (
  <View style={s.nrRow}>
    <Text style={s.nrLabel}>{nr}</Text>
    <View style={s.barBg}>
      <View style={[s.barFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
    <Text style={s.nrPct}>{pct}%</Text>
  </View>
);

export default function DashboardScreen() {
  const user = useSelector((s: RootState) => s.auth.user);
  const checklists = useSelector((s: RootState) => s.checklists.list);
  const incidents = useSelector((s: RootState) => s.incidents.list);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const total = checklists.length;
  const concluidos = checklists.filter((c) => c.status === 'concluido').length;
  const emAndamento = checklists.filter((c) => c.status === 'em_andamento').length;
  const incCriticos = incidents.filter((i) => i.severidade === 'critico').length;
  const conformidade = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  const nrStats = [
    { nr: 'NR-35', pct: 92, color: C.success },
    { nr: 'NR-18', pct: 78, color: C.info },
    { nr: 'NR-12', pct: 85, color: C.success },
    { nr: 'NR-33', pct: 65, color: C.warning },
    { nr: 'NR-10', pct: 90, color: C.success },
    { nr: 'NR-23', pct: 72, color: C.info },
    { nr: 'NR-6', pct: 88, color: C.success },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {}} tintColor={C.primary} />}
      >
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
            <Text style={s.sub}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <View style={[s.roleBadge, { backgroundColor: user?.role === 'admin' ? C.dangerBg : C.infoBg }]}>
            <Text style={[s.roleText, { color: user?.role === 'admin' ? C.dangerDark : C.infoDark }]}>
              {user?.role?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={s.conformBox}>
          <View>
            <Text style={s.conformLabel}>Conformidade Geral</Text>
            <Text style={s.conformVal}>{conformidade}%</Text>
          </View>
          <View style={s.progressCircle}>
            <Text style={s.progressNum}>{concluidos}/{total}</Text>
            <Text style={s.progressSub}>concluídas</Text>
          </View>
        </View>

        <View style={s.kpiGrid}>
          <KPICard label="Total" value={total} color={C.infoDark} bg={C.infoBg} />
          <KPICard label="Em Andamento" value={emAndamento} color={C.warningDark} bg={C.warningBg} />
          <KPICard label="Concluídas" value={concluidos} color={C.successDark} bg={C.successBg} />
          <KPICard label="Inc. Críticos" value={incCriticos} color={C.dangerDark} bg={C.dangerBg} />
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Conformidade por NR</Text>
          {nrStats.map((n) => <NRBar key={n.nr} {...n} />)}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Atividade Recente</Text>
          {checklists.slice(0, 5).map((c: any) => (
            <View key={c.id} style={s.actItem}>
              <View style={[s.actDot, { backgroundColor: c.status === 'concluido' ? C.success : C.warning }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.actTitle} numberOfLines={1}>{c.titulo}</Text>
                <Text style={s.actSub}>{c.norma} • {c.obra}</Text>
              </View>
              <View style={[s.statusBadge, { backgroundColor: c.status === 'concluido' ? C.successBg : C.warningBg }]}>
                <Text style={[s.statusTxt, { color: c.status === 'concluido' ? C.successDark : C.warningDark }]}>
                  {c.status === 'concluido' ? 'Concluído' : 'Em andamento'}
                </Text>
              </View>
            </View>
          ))}
          {checklists.length === 0 && (
            <Text style={s.empty}>Nenhuma inspeção registrada ainda.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.offWhite },
  scroll: { padding: S.md, paddingBottom: S.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.md },
  greeting: { fontSize: F.xl, fontWeight: '700', color: C.textPrimary },
  sub: { fontSize: F.sm, color: C.textSecondary, marginTop: 2 },
  roleBadge: { borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: S.xs },
  roleText: { fontSize: F.xs, fontWeight: '700' },
  conformBox: {
    backgroundColor: C.black, borderRadius: R.xl, padding: S.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.md, ...Sh.md,
  },
  conformLabel: { color: C.textMuted, fontSize: F.sm },
  conformVal: { color: C.primary, fontSize: 40, fontWeight: '800' },
  progressCircle: { alignItems: 'center' },
  progressNum: { color: C.white, fontSize: F.xxl, fontWeight: '700' },
  progressSub: { color: C.textMuted, fontSize: F.xs },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginBottom: S.md },
  kpi: { flex: 1, minWidth: '45%', borderRadius: R.lg, padding: S.md, ...Sh.sm },
  kpiVal: { fontSize: F.xxl, fontWeight: '800' },
  kpiLabel: { fontSize: F.xs, color: C.textSecondary, marginTop: 2 },
  section: { backgroundColor: C.card, borderRadius: R.xl, padding: S.md, marginBottom: S.md, ...Sh.sm },
  sectionTitle: { fontSize: F.md, fontWeight: '700', color: C.textPrimary, marginBottom: S.md },
  nrRow: { flexDirection: 'row', alignItems: 'center', marginBottom: S.sm },
  nrLabel: { width: 44, fontSize: F.xs, fontWeight: '600', color: C.textSecondary },
  barBg: { flex: 1, height: 8, backgroundColor: C.border, borderRadius: R.full, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: R.full },
  nrPct: { width: 36, textAlign: 'right', fontSize: F.xs, fontWeight: '600', color: C.textSecondary },
  actItem: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.sm },
  actDot: { width: 10, height: 10, borderRadius: R.full },
  actTitle: { fontSize: F.sm, fontWeight: '600', color: C.textPrimary },
  actSub: { fontSize: F.xs, color: C.textSecondary },
  statusBadge: { borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 2 },
  statusTxt: { fontSize: F.xs, fontWeight: '600' },
  empty: { color: C.textMuted, textAlign: 'center', padding: S.md },
});
