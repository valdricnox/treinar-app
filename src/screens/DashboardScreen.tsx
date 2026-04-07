import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setChecklists, setIncidents, setLastSync, setOnline } from '../store';
import api from '../services/api';
import { C, S, R, F, Sh } from '../theme';
import OfflineBanner from '../components/OfflineBanner';

const { width } = Dimensions.get('window');

const ROLE_CONFIG: any = {
  admin:   { label: 'Admin',    bg: '#2C1A1A', text: C.danger,    border: 'rgba(255,59,48,0.3)' },
  gestor:  { label: 'Gestor',   bg: '#1A1E2C', text: C.info,      border: 'rgba(10,132,255,0.3)' },
  inspetor:{ label: 'Inspetor', bg: '#1A2C1E', text: C.success,   border: 'rgba(48,209,88,0.3)' },
};

export default function DashboardScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const checklists = useSelector((s: RootState) => s.checklists.list);
  const incidents = useSelector((s: RootState) => s.incidents.list);
  const isOnline = useSelector((s: RootState) => s.app.isOnline);
  const lastSync = useSelector((s: RootState) => s.app.lastSync);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [clRes, incRes] = await Promise.all([
        api.get('/checklists'),
        api.get('/incidentes'),
      ]);
      dispatch(setChecklists(clRes.data?.checklists || clRes.data || []));
      dispatch(setIncidents(incRes.data?.incidentes || incRes.data || []));
      dispatch(setLastSync(new Date().toISOString()));
      dispatch(setOnline(true));
    } catch {
      dispatch(setOnline(false));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  // KPIs
  const total = checklists.length;
  const concluidos = checklists.filter((c: any) => c.status === 'concluido').length;
  const emAndamento = checklists.filter((c: any) => c.status === 'em_andamento').length;
  const pendentes = checklists.filter((c: any) => c.status === 'pendente').length;
  const incCriticos = incidents.filter((i: any) => i.severidade === 'critico').length;
  const incAbertos = incidents.filter((i: any) => i.status === 'aberto').length;
  const conformidade = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  const roleConf = ROLE_CONFIG[user?.role] || ROLE_CONFIG.inspetor;
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  const formatSync = (iso: string | null) => {
    if (!iso) return 'Nunca sincronizado';
    const d = new Date(iso);
    return `Sync: ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  };

  const nrStats = [
    { nr: 'NR-35', label: 'Altura',    pct: 92, color: C.success },
    { nr: 'NR-18', label: 'Construção',pct: 78, color: C.info },
    { nr: 'NR-12', label: 'Máquinas',  pct: 85, color: C.success },
    { nr: 'NR-33', label: 'Conf.',     pct: 65, color: C.warning },
    { nr: 'NR-10', label: 'Elétrica',  pct: 90, color: C.success },
    { nr: 'NR-23', label: 'Incêndio',  pct: 72, color: C.info },
    { nr: 'NR-6',  label: 'EPI',       pct: 88, color: C.success },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={C.primary} />}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.saudacao}>{saudacao},</Text>
            <Text style={s.nomeUsuario} numberOfLines={1}>{user?.name?.split(' ')[0]} 👋</Text>
            <Text style={s.syncTxt}>{formatSync(lastSync)}</Text>
          </View>
          <View style={[s.rolePill, { backgroundColor: roleConf.bg, borderColor: roleConf.border }]}>
            <View style={[s.roleDot, { backgroundColor: roleConf.text }]} />
            <Text style={[s.roleTxt, { color: roleConf.text }]}>{roleConf.label}</Text>
          </View>
        </View>

        {/* ── Card principal de conformidade ── */}
        <View style={s.heroCard}>
          <View style={s.heroLeft}>
            <Text style={s.heroLabel}>CONFORMIDADE GERAL</Text>
            <View style={s.heroValRow}>
              <Text style={s.heroVal}>{conformidade}</Text>
              <Text style={s.heroPct}>%</Text>
            </View>
            <View style={s.heroProg}>
              <View style={[s.heroProgFill, { width: `${conformidade}%` }]} />
            </View>
            <Text style={s.heroSub}>{concluidos} de {total} inspeções concluídas</Text>
          </View>
          <View style={s.heroRight}>
            <View style={s.heroCircle}>
              <Text style={s.heroCircleVal}>{incCriticos}</Text>
              <Text style={s.heroCircleLabel}>críticos</Text>
            </View>
          </View>
        </View>

        {/* ── KPI Grid ── */}
        <View style={s.kpiGrid}>
          <View style={[s.kpiCard, { borderLeftColor: C.info }]}>
            <Text style={[s.kpiVal, { color: C.info }]}>{total}</Text>
            <Text style={s.kpiLabel}>Total</Text>
          </View>
          <View style={[s.kpiCard, { borderLeftColor: C.warning }]}>
            <Text style={[s.kpiVal, { color: C.warning }]}>{emAndamento}</Text>
            <Text style={s.kpiLabel}>Em Andamento</Text>
          </View>
          <View style={[s.kpiCard, { borderLeftColor: C.success }]}>
            <Text style={[s.kpiVal, { color: C.success }]}>{concluidos}</Text>
            <Text style={s.kpiLabel}>Concluídas</Text>
          </View>
          <View style={[s.kpiCard, { borderLeftColor: C.danger }]}>
            <Text style={[s.kpiVal, { color: C.danger }]}>{incAbertos}</Text>
            <Text style={s.kpiLabel}>Inc. Abertos</Text>
          </View>
        </View>

        {/* ── Ações rápidas ── */}
        <View style={s.actionsRow}>
          <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('Inspeções', { screen: 'NewChecklist' })}>
            <View style={[s.actionIcon, { backgroundColor: 'rgba(245,200,0,0.12)' }]}>
              <Text style={s.actionEmoji}>📋</Text>
            </View>
            <Text style={s.actionTxt}>Nova{'\n'}Inspeção</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('Incidentes', { screen: 'NewIncident' })}>
            <View style={[s.actionIcon, { backgroundColor: 'rgba(255,59,48,0.12)' }]}>
              <Text style={s.actionEmoji}>⚠️</Text>
            </View>
            <Text style={s.actionTxt}>Novo{'\n'}Incidente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('Relatórios')}>
            <View style={[s.actionIcon, { backgroundColor: 'rgba(10,132,255,0.12)' }]}>
              <Text style={s.actionEmoji}>📄</Text>
            </View>
            <Text style={s.actionTxt}>Ver{'\n'}Relatórios</Text>
          </TouchableOpacity>
          {(user?.role === 'admin' || user?.role === 'gestor') && (
            <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('Equipe')}>
              <View style={[s.actionIcon, { backgroundColor: 'rgba(48,209,88,0.12)' }]}>
                <Text style={s.actionEmoji}>👥</Text>
              </View>
              <Text style={s.actionTxt}>Gerenciar{'\n'}Equipe</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── NR Conformidade ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Conformidade por NR</Text>
            <Text style={s.sectionBadge}>{nrStats.length} normas</Text>
          </View>
          {nrStats.map((n) => (
            <View key={n.nr} style={s.nrRow}>
              <View style={s.nrInfo}>
                <Text style={s.nrCode}>{n.nr}</Text>
                <Text style={s.nrName}>{n.label}</Text>
              </View>
              <View style={s.barBg}>
                <View style={[s.barFill, { width: `${n.pct}%`, backgroundColor: n.color }]} />
              </View>
              <Text style={[s.nrPct, { color: n.color }]}>{n.pct}%</Text>
            </View>
          ))}
        </View>

        {/* ── Atividade recente ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Atividade Recente</Text>
            {checklists.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('Inspeções')}>
                <Text style={s.sectionLink}>Ver tudo →</Text>
              </TouchableOpacity>
            )}
          </View>
          {checklists.slice(0, 4).map((c: any) => (
            <TouchableOpacity
              key={c.id}
              style={s.actItem}
              onPress={() => navigation.navigate('Inspeções', { screen: 'ChecklistDetail', params: { checklist: c } })}
            >
              <View style={[s.actIndicator, { backgroundColor: c.status === 'concluido' ? C.success : c.status === 'em_andamento' ? C.warning : C.info }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.actTitle} numberOfLines={1}>{c.titulo}</Text>
                <Text style={s.actSub}>{c.norma} · {c.obra}</Text>
              </View>
              <View style={s.actRight}>
                <Text style={s.actPct}>{c.progresso || 0}%</Text>
              </View>
            </TouchableOpacity>
          ))}
          {checklists.length === 0 && (
            <View style={s.emptyBox}>
              <Text style={s.emptyTxt}>Nenhuma inspeção ainda.</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Inspeções', { screen: 'NewChecklist' })}>
                <Text style={s.emptyLink}>Criar primeira inspeção →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: S.md, paddingBottom: S.xxxl },

  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: S.md, gap: S.sm },
  saudacao: { fontSize: F.sm, color: C.textTertiary, fontWeight: '500' },
  nomeUsuario: { fontSize: F.xxl, fontWeight: '800', color: C.textPrimary },
  syncTxt: { fontSize: F.xs, color: C.textTertiary, marginTop: 2 },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: S.sm, paddingVertical: S.xs,
    borderRadius: R.full, borderWidth: 1, marginTop: 4,
  },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  roleTxt: { fontSize: F.xs, fontWeight: '700', letterSpacing: 0.5 },

  heroCard: {
    backgroundColor: C.black,
    borderRadius: R.xxl,
    padding: S.xl,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: S.md,
    ...Sh.md,
  },
  heroLeft: { flex: 1 },
  heroLabel: { fontSize: F.xs, color: C.gray500, fontWeight: '700', letterSpacing: 1.5, marginBottom: S.xs },
  heroValRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  heroVal: { fontSize: 52, fontWeight: '900', color: C.primary, lineHeight: 56 },
  heroPct: { fontSize: F.xxl, fontWeight: '700', color: C.primaryDark, paddingBottom: 6 },
  heroProg: { height: 4, backgroundColor: C.gray800, borderRadius: R.full, overflow: 'hidden', marginVertical: S.sm },
  heroProgFill: { height: 4, backgroundColor: C.primary, borderRadius: R.full },
  heroSub: { fontSize: F.xs, color: C.gray500 },
  heroRight: { paddingLeft: S.md },
  heroCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.dangerBg,
    borderWidth: 2, borderColor: C.dangerBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  heroCircleVal: { fontSize: F.xxl, fontWeight: '900', color: C.danger },
  heroCircleLabel: { fontSize: F.xs - 1, color: C.dangerDark, fontWeight: '600' },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginBottom: S.md },
  kpiCard: {
    flex: 1, minWidth: (width - S.md * 2 - S.sm * 3) / 4,
    backgroundColor: C.card, borderRadius: R.xl,
    padding: S.md, borderLeftWidth: 3,
    ...Sh.xs,
  },
  kpiVal: { fontSize: F.xxl, fontWeight: '900' },
  kpiLabel: { fontSize: F.xs, color: C.textTertiary, marginTop: 2, fontWeight: '600' },

  actionsRow: { flexDirection: 'row', gap: S.sm, marginBottom: S.md },
  actionBtn: { flex: 1, backgroundColor: C.card, borderRadius: R.xl, padding: S.sm, alignItems: 'center', gap: S.xs, ...Sh.xs },
  actionIcon: { width: 44, height: 44, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center' },
  actionEmoji: { fontSize: 22 },
  actionTxt: { fontSize: F.xs, color: C.textSecondary, fontWeight: '600', textAlign: 'center', lineHeight: 16 },

  section: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, marginBottom: S.md, ...Sh.xs },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.md },
  sectionTitle: { fontSize: F.md, fontWeight: '800', color: C.textPrimary },
  sectionBadge: { fontSize: F.xs, color: C.textTertiary, fontWeight: '600' },
  sectionLink: { fontSize: F.sm, color: C.primary, fontWeight: '700' },

  nrRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: 10 },
  nrInfo: { width: 68 },
  nrCode: { fontSize: F.xs, fontWeight: '800', color: C.textPrimary },
  nrName: { fontSize: F.xs - 1, color: C.textTertiary },
  barBg: { flex: 1, height: 6, backgroundColor: C.gray200, borderRadius: R.full, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: R.full },
  nrPct: { width: 38, textAlign: 'right', fontSize: F.xs, fontWeight: '800' },

  actItem: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    paddingVertical: S.sm, borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  actIndicator: { width: 3, height: 36, borderRadius: R.full },
  actTitle: { fontSize: F.sm, fontWeight: '700', color: C.textPrimary },
  actSub: { fontSize: F.xs, color: C.textTertiary },
  actRight: {},
  actPct: { fontSize: F.sm, fontWeight: '800', color: C.textSecondary },

  emptyBox: { alignItems: 'center', padding: S.lg },
  emptyTxt: { color: C.textTertiary, marginBottom: S.xs },
  emptyLink: { color: C.primary, fontWeight: '700', fontSize: F.sm },
});
