import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, Modal, ScrollView, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, addAcao, updateAcao, removeAcao, setAcoes } from '../store';
import api from '../services/api';
import { C, S, R, F, Sh } from '../theme';
import { IcCheck, IcClock, IcWarning, IcEdit, IcTrash, IcPlus, IcUser, IcChevronRight } from '../components/Icons';

const PRIORIDADES = [
  { key: 'critica',  label: 'Crítica',  color: C.danger,  bg: C.dangerBg },
  { key: 'alta',     label: 'Alta',     color: C.warning, bg: C.warningBg },
  { key: 'media',    label: 'Média',    color: C.info,    bg: C.infoBg },
  { key: 'baixa',    label: 'Baixa',    color: C.success, bg: C.successBg },
];

const STATUS_CFG: any = {
  aberta:      { label: 'Aberta',      color: C.danger,  bg: C.dangerBg },
  em_andamento:{ label: 'Em andamento',color: C.warning, bg: C.warningBg },
  resolvida:   { label: 'Resolvida',   color: C.success, bg: C.successBg },
};

interface AcaoFormProps {
  visible: boolean;
  checklistId?: string;
  itemTxt?: string;
  onClose: () => void;
}

function AcaoForm({ visible, checklistId, itemTxt, onClose }: AcaoFormProps) {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const team = useSelector((s: RootState) => s.team.list);
  const isOnline = useSelector((s: RootState) => s.app.isOnline);
  const [descricao, setDescricao] = useState(itemTxt ? `Corrigir: ${itemTxt}` : '');
  const [responsavel, setResponsavel] = useState('');
  const [prazo, setPrazo] = useState('');
  const [prioridade, setPrioridade] = useState('alta');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setDescricao(itemTxt ? `Corrigir: ${itemTxt}` : '');
      setResponsavel('');
      setPrazo('');
      setPrioridade('alta');
    }
  }, [visible, itemTxt]);

  const salvar = async () => {
    if (!descricao.trim()) { Alert.alert('Atenção', 'Descreva a ação corretiva.'); return; }
    if (!prazo.trim()) { Alert.alert('Atenção', 'Informe o prazo.'); return; }
    setSaving(true);
    const payload = {
      descricao: descricao.trim(),
      responsavel: responsavel.trim() || user?.name,
      prazo: prazo.trim(),
      prioridade,
      status: 'aberta',
      checklist_id: checklistId || null,
      criada_por: user?.name,
      created_at: new Date().toISOString(),
    };
    try {
      const res = isOnline ? await api.post('/acoes', payload) : null;
      dispatch(addAcao(res?.data?.acao || { ...payload, id: `acao_${Date.now()}` }));
      onClose();
    } catch {
      dispatch(addAcao({ ...payload, id: `acao_${Date.now()}`, _pendingSync: true }));
      onClose();
    }
    setSaving(false);
  };

  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={f.safe}>
        <View style={f.header}>
          <TouchableOpacity onPress={onClose}><Text style={f.cancel}>Cancelar</Text></TouchableOpacity>
          <Text style={f.title}>Nova Ação Corretiva</Text>
          <TouchableOpacity onPress={salvar} disabled={saving}><Text style={f.save}>Criar</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={f.scroll} keyboardShouldPersistTaps="handled">
          <View style={f.card}>
            <Text style={f.label}>DESCRIÇÃO DA AÇÃO *</Text>
            <TextInput style={f.textArea} value={descricao} onChangeText={setDescricao}
              placeholder="Descreva a ação corretiva a ser tomada..."
              placeholderTextColor={C.textTertiary} multiline numberOfLines={4} textAlignVertical="top" />
            <Text style={f.label}>RESPONSÁVEL PELA EXECUÇÃO</Text>
            <TextInput style={f.input} value={responsavel} onChangeText={setResponsavel}
              placeholder={`${user?.name} (padrão)`} placeholderTextColor={C.textTertiary} />
            <Text style={f.label}>PRAZO *</Text>
            <TextInput style={f.input} value={prazo} onChangeText={setPrazo}
              placeholder="Ex: 15/02/2026 ou 'Esta semana'" placeholderTextColor={C.textTertiary} />
          </View>
          <View style={f.card}>
            <Text style={f.sectionTitle}>Prioridade</Text>
            <View style={f.prioGrid}>
              {PRIORIDADES.map(p => (
                <Pressable key={p.key} style={[f.prioBtn, { backgroundColor: p.bg }, prioridade === p.key && f.prioBtnActive]} onPress={() => setPrioridade(p.key)}>
                  <View style={[f.prioDot, { backgroundColor: p.color }]} />
                  <Text style={[f.prioTxt, { color: p.color }]}>{p.label}</Text>
                  {prioridade === p.key && <IcCheck color={p.color} size={14} />}
                </Pressable>
              ))}
            </View>
          </View>
          {checklistId && (
            <View style={f.linkBox}>
              <IcChevronRight color={C.infoDark} size={14} />
              <Text style={f.linkTxt}>Vinculada à inspeção #{checklistId}</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const f = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: S.md, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  cancel: { fontSize: F.md, color: C.textTertiary },
  title: { fontSize: F.md, fontWeight: '800', color: C.textPrimary },
  save: { fontSize: F.md, color: C.primary, fontWeight: '800' },
  scroll: { padding: S.md, paddingBottom: 100 },
  card: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, marginBottom: S.md, ...Sh.xs },
  sectionTitle: { fontSize: F.md, fontWeight: '800', color: C.textPrimary, marginBottom: S.md },
  label: { fontSize: F.xs, fontWeight: '700', color: C.textTertiary, letterSpacing: 1.2, marginBottom: S.xs, marginTop: S.sm },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: S.md, fontSize: F.sm, color: C.textPrimary, backgroundColor: C.bg },
  textArea: { borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: S.md, fontSize: F.sm, color: C.textPrimary, minHeight: 100, backgroundColor: C.bg },
  prioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  prioBtn: { flexDirection: 'row', alignItems: 'center', gap: S.xs, borderRadius: R.lg, paddingHorizontal: S.sm + 2, paddingVertical: S.sm, borderWidth: 1.5, borderColor: 'transparent' },
  prioBtnActive: { borderColor: 'rgba(0,0,0,0.1)' },
  prioDot: { width: 8, height: 8, borderRadius: 4 },
  prioTxt: { fontSize: F.sm, fontWeight: '700' },
  linkBox: { flexDirection: 'row', alignItems: 'center', gap: S.xs, backgroundColor: C.infoBg, borderRadius: R.lg, padding: S.sm, borderWidth: 1, borderColor: C.infoBorder },
  linkTxt: { fontSize: F.xs, color: C.infoDark, fontWeight: '600' },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function AcoesScreen() {
  const dispatch = useDispatch();
  const acoes = useSelector((s: RootState) => (s as any).acoes?.list || []);
  const isOnline = useSelector((s: RootState) => s.app.isOnline);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Todas');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/acoes');
      dispatch(setAcoes(res.data?.acoes || res.data || []));
    } catch {}
    finally { setRefreshing(false); }
  };

  useEffect(() => { if (isOnline) load(); }, []);

  const filtered = filterStatus === 'Todas' ? acoes : acoes.filter((a: any) => a.status === filterStatus);

  const marcarResolvida = (acao: any) => {
    Alert.alert('Marcar como resolvida?', `"${acao.descricao?.substring(0, 50)}..."`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Resolvida', onPress: async () => {
        const updated = { ...acao, status: 'resolvida', resolvidaEm: new Date().toISOString() };
        dispatch(updateAcao(updated));
        try { await api.put(`/acoes/${acao.id}`, { status: 'resolvida' }); } catch {}
      }},
    ]);
  };

  const excluir = (acao: any) => {
    Alert.alert('Excluir ação', 'Excluir esta ação corretiva permanentemente?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        dispatch(removeAcao(acao.id));
        try { await api.delete(`/acoes/${acao.id}`); } catch {}
      }},
    ]);
  };

  const abertas = acoes.filter((a: any) => a.status === 'aberta').length;
  const criticas = acoes.filter((a: any) => a.prioridade === 'critica' && a.status !== 'resolvida').length;
  const resolvidas = acoes.filter((a: any) => a.status === 'resolvida').length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Ações Corretivas</Text>
          <Text style={s.subtitle}>{acoes.length} ações · {abertas} abertas</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(true)}>
          <IcPlus color={C.black} size={18} />
          <Text style={s.addBtnTxt}>Nova</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={[s.stat, { backgroundColor: C.dangerBg }]}>
          <Text style={[s.statVal, { color: C.dangerDark }]}>{criticas}</Text>
          <Text style={[s.statLabel, { color: C.dangerDark }]}>Críticas</Text>
        </View>
        <View style={[s.stat, { backgroundColor: C.warningBg }]}>
          <Text style={[s.statVal, { color: C.warningDark }]}>{abertas}</Text>
          <Text style={[s.statLabel, { color: C.warningDark }]}>Abertas</Text>
        </View>
        <View style={[s.stat, { backgroundColor: C.successBg }]}>
          <Text style={[s.statVal, { color: C.successDark }]}>{resolvidas}</Text>
          <Text style={[s.statLabel, { color: C.successDark }]}>Resolvidas</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={s.filterRow}>
        {['Todas', 'aberta', 'em_andamento', 'resolvida'].map(f => (
          <Pressable key={f} style={[s.chip, filterStatus === f && s.chipActive]} onPress={() => setFilterStatus(f)}>
            <Text style={[s.chipTxt, filterStatus === f && s.chipActiveTxt]}>
              {f === 'Todas' ? 'Todas' : STATUS_CFG[f]?.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={C.primary} />}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <IcCheck color={C.gray300} size={48} />
            <Text style={s.emptyTxt}>Nenhuma ação corretiva</Text>
            <Text style={s.emptySub}>Crie ações a partir de itens não conformes ou manualmente.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const prio = PRIORIDADES.find(p => p.key === item.prioridade) || PRIORIDADES[1];
          const statusCfg = STATUS_CFG[item.status] || STATUS_CFG.aberta;
          const resolvida = item.status === 'resolvida';
          return (
            <View style={[s.card, resolvida && s.cardResolvida]}>
              <View style={s.cardTop}>
                <View style={[s.prioBadge, { backgroundColor: prio.bg }]}>
                  <View style={[s.prioDot, { backgroundColor: prio.color }]} />
                  <Text style={[s.prioTxt, { color: prio.color }]}>{prio.label}</Text>
                </View>
                <View style={{ flex: 1 }} />
                <View style={[s.statusBadge, { backgroundColor: statusCfg.bg }]}>
                  <Text style={[s.statusTxt, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                </View>
              </View>

              <Text style={[s.cardDesc, resolvida && { opacity: 0.5, textDecorationLine: 'line-through' }]}
                numberOfLines={3}>{item.descricao}</Text>

              <View style={s.cardMeta}>
                {item.responsavel && (
                  <View style={s.metaItem}>
                    <IcUser color={C.textTertiary} size={12} />
                    <Text style={s.metaTxt}>{item.responsavel}</Text>
                  </View>
                )}
                {item.prazo && (
                  <View style={s.metaItem}>
                    <IcClock color={C.textTertiary} size={12} />
                    <Text style={s.metaTxt}>{item.prazo}</Text>
                  </View>
                )}
                {item.checklist_id && (
                  <View style={s.metaItem}>
                    <IcChevronRight color={C.info} size={12} />
                    <Text style={[s.metaTxt, { color: C.info }]}>Vistoria vinculada</Text>
                  </View>
                )}
              </View>

              {!resolvida && (
                <View style={s.cardActions}>
                  <TouchableOpacity style={s.resolveBtn} onPress={() => marcarResolvida(item)}>
                    <IcCheck color={C.successDark} size={14} />
                    <Text style={s.resolveBtnTxt}>Marcar resolvida</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.deleteBtn} onPress={() => excluir(item)}>
                    <IcTrash color={C.danger} size={14} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />

      <AcaoForm visible={showForm} onClose={() => setShowForm(false)} />
    </SafeAreaView>
  );
}

// Export form for use in wizard
export { AcaoForm };

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: S.md },
  title: { fontSize: F.xxl, fontWeight: '800', color: C.textPrimary },
  subtitle: { fontSize: F.sm, color: C.textTertiary, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: S.xs, backgroundColor: C.primary, borderRadius: R.full, paddingHorizontal: S.md, paddingVertical: S.sm },
  addBtnTxt: { fontWeight: '800', fontSize: F.sm, color: C.black },
  statsRow: { flexDirection: 'row', gap: S.sm, paddingHorizontal: S.md, marginBottom: S.sm },
  stat: { flex: 1, borderRadius: R.xl, padding: S.sm, alignItems: 'center' },
  statVal: { fontSize: F.xl, fontWeight: '900' },
  statLabel: { fontSize: F.xs, fontWeight: '700' },
  filterRow: { flexDirection: 'row', paddingHorizontal: S.md, gap: S.xs, marginBottom: S.sm, flexWrap: 'wrap' },
  chip: { paddingHorizontal: S.sm, paddingVertical: S.xs + 1, borderRadius: R.full, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.black, borderColor: C.black },
  chipTxt: { fontSize: F.xs, color: C.textSecondary, fontWeight: '700' },
  chipActiveTxt: { color: C.primary },
  list: { padding: S.md, gap: S.sm, paddingBottom: 100 },
  emptyBox: { alignItems: 'center', padding: S.xxl, gap: S.md },
  emptyTxt: { fontSize: F.lg, fontWeight: '700', color: C.textPrimary },
  emptySub: { fontSize: F.sm, color: C.textTertiary, textAlign: 'center', lineHeight: 20 },
  card: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, ...Sh.sm },
  cardResolvida: { opacity: 0.65 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.sm },
  prioBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 3 },
  prioDot: { width: 6, height: 6, borderRadius: 3 },
  prioTxt: { fontSize: F.xs, fontWeight: '700' },
  statusBadge: { borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 3 },
  statusTxt: { fontSize: F.xs, fontWeight: '700' },
  cardDesc: { fontSize: F.sm, color: C.textPrimary, fontWeight: '500', lineHeight: 22, marginBottom: S.sm },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginBottom: S.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt: { fontSize: F.xs, color: C.textTertiary },
  cardActions: { flexDirection: 'row', gap: S.sm, borderTopWidth: 1, borderTopColor: C.border, paddingTop: S.sm },
  resolveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.xs, backgroundColor: C.successBg, borderRadius: R.lg, padding: S.sm, borderWidth: 1, borderColor: C.successBorder },
  resolveBtnTxt: { fontSize: F.sm, fontWeight: '700', color: C.successDark },
  deleteBtn: { width: 38, height: 38, borderRadius: R.lg, backgroundColor: C.dangerBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.dangerBorder },
});
