import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, Modal, ScrollView, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { RootState, setObras, addObra, updateObra, removeObra } from '../store';
import api from '../services/api';
import { C, S, R, F, Sh } from '../theme';
import { IcBuilding, IcPlus, IcEdit, IcTrash, IcUser, IcCheck, IcX } from '../components/Icons';

const STATUS_CFG: any = {
  ativa:      { label: 'Ativa',     color: C.successDark, bg: C.successBg },
  pausada:    { label: 'Pausada',   color: C.warningDark, bg: C.warningBg },
  encerrada:  { label: 'Encerrada',  color: C.gray500,     bg: C.gray100 },
};

export default function ObrasScreen() {
  const dispatch = useDispatch();
  const obras = useSelector((s: RootState) => (s as any).obras?.list || []);
  const checklists = useSelector((s: RootState) => s.checklists.list);
  const isOnline = useSelector((s: RootState) => s.app.isOnline);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editObra, setEditObra] = useState<any>(null);

  const load = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/obras');
      dispatch(setObras(res.data?.obras || res.data || []));
    } catch {}
    finally { setRefreshing(false); }
  };

  useFocusEffect(React.useCallback(() => { if (isOnline) load(); }, [isOnline]));

  // Count inspeções por obra
  const inspecoesPorObra = (nomeObra: string) =>
    checklists.filter((c: any) => c.obra === nomeObra).length;
  const conformidadePorObra = (nomeObra: string) => {
    const items = checklists.filter((c: any) => c.obra === nomeObra);
    if (!items.length) return 0;
    const concluidas = items.filter((c: any) => c.status === 'concluido').length;
    return Math.round((concluidas / items.length) * 100);
  };

  const ativas = obras.filter((o: any) => o.status === 'ativa').length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Obras</Text>
          <Text style={s.subtitle}>{obras.length} cadastradas · {ativas} ativas</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => { setEditObra(null); setShowForm(true); }}>
          <IcPlus color={C.black} size={18} />
          <Text style={s.addBtnTxt}>Nova</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={obras}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={C.primary} />}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <IcBuilding color={C.gray300} size={48} />
            <Text style={s.emptyTxt}>Nenhuma obra cadastrada</Text>
            <Text style={s.emptySub}>Cadastre obras para organizar as inspeções por local.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = STATUS_CFG[item.status] || STATUS_CFG.ativa;
          const totalInsp = inspecoesPorObra(item.nome);
          const conf = conformidadePorObra(item.nome);
          return (
            <View style={s.card}>
              <View style={s.cardTop}>
                <View style={s.obraIcon}>
                  <IcBuilding color={C.primary} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardName}>{item.nome}</Text>
                  {item.endereco && <Text style={s.cardAddr}>{item.endereco}</Text>}
                </View>
                <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
                  <Text style={[s.statusTxt, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>

              {item.responsavel && (
                <View style={s.metaRow}>
                  <IcUser color={C.textTertiary} size={13} />
                  <Text style={s.metaTxt}>{item.responsavel}</Text>
                </View>
              )}

              {totalInsp > 0 && (
                <View style={s.statsRow}>
                  <View style={s.statItem}>
                    <Text style={s.statVal}>{totalInsp}</Text>
                    <Text style={s.statLabel}>inspeções</Text>
                  </View>
                  <View style={s.statDivider} />
                  <View style={s.statItem}>
                    <Text style={[s.statVal, { color: conf >= 80 ? C.success : conf >= 60 ? C.warning : C.danger }]}>
                      {conf}%
                    </Text>
                    <Text style={s.statLabel}>conformidade</Text>
                  </View>
                </View>
              )}

              <View style={s.cardActions}>
                <Pressable style={s.actionBtn} onPress={() => { setEditObra(item); setShowForm(true); }}>
                  <IcEdit color={C.textSecondary} size={16} />
                  <Text style={s.actionBtnTxt}>Editar</Text>
                </Pressable>
                <Pressable style={s.actionBtn} onPress={() => {
                  Alert.alert('Excluir obra', `Excluir "${item.nome}"?`, [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Excluir', style: 'destructive', onPress: async () => {
                      dispatch(removeObra(item.id));
                      try { await api.delete(`/obras/${item.id}`); } catch {}
                    }},
                  ]);
                }}>
                  <IcTrash color={C.danger} size={16} />
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      {/* Form Modal */}
      <ObraForm
        visible={showForm}
        obra={editObra}
        onClose={() => setShowForm(false)}
        onSave={async (data: any) => {
          try {
            if (editObra) {
              const res = await api.put(`/obras/${editObra.id}`, data);
              dispatch(updateObra(res.data?.obra || { ...editObra, ...data }));
            } else {
              const res = await api.post('/obras', data);
              dispatch(addObra(res.data?.obra || { ...data, id: Date.now() }));
            }
          } catch {
            if (editObra) dispatch(updateObra({ id: editObra.id, ...data }));
            else dispatch(addObra({ ...data, id: `obra_${Date.now()}` }));
          }
          setShowForm(false);
        }}
      />
    </SafeAreaView>
  );
}

function ObraForm({ visible, obra, onClose, onSave }: any) {
  const [nome, setNome] = useState(obra?.nome || '');
  const [endereco, setEndereco] = useState(obra?.endereco || '');
  const [responsavel, setResponsavel] = useState(obra?.responsavel || '');
  const [status, setStatus] = useState(obra?.status || 'ativa');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setNome(obra?.nome || '');
      setEndereco(obra?.endereco || '');
      setResponsavel(obra?.responsavel || '');
      setStatus(obra?.status || 'ativa');
    }
  }, [visible, obra]);

  const save = async () => {
    if (!nome.trim()) { Alert.alert('Atenção', 'Informe o nome da obra.'); return; }
    setSaving(true);
    await onSave({ nome: nome.trim(), endereco: endereco.trim(), responsavel: responsavel.trim(), status });
    setSaving(false);
  };

  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={of.safe}>
        <View style={of.header}>
          <TouchableOpacity onPress={onClose}><Text style={of.cancel}>Cancelar</Text></TouchableOpacity>
          <Text style={of.title}>{obra ? 'Editar Obra' : 'Nova Obra'}</Text>
          <TouchableOpacity onPress={save} disabled={saving}><Text style={of.save}>{obra ? 'Salvar' : 'Criar'}</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={of.scroll} keyboardShouldPersistTaps="handled">
          <View style={of.card}>
            <Text style={of.label}>NOME DA OBRA *</Text>
            <TextInput style={of.input} value={nome} onChangeText={setNome} placeholder="Ex: Edifício Centro Comercial A" placeholderTextColor={C.textTertiary} />
            <Text style={of.label}>ENDEREÇO</Text>
            <TextInput style={of.input} value={endereco} onChangeText={setEndereco} placeholder="Rua, número, bairro, cidade" placeholderTextColor={C.textTertiary} />
            <Text style={of.label}>RESPONSÁVEL PELA OBRA</Text>
            <TextInput style={of.input} value={responsavel} onChangeText={setResponsavel} placeholder="Nome do engenheiro ou responsável" placeholderTextColor={C.textTertiary} />
          </View>
          <View style={of.card}>
            <Text style={of.sectionTitle}>Status da obra</Text>
            {Object.entries(STATUS_CFG).map(([key, cfg]: any) => (
              <Pressable key={key} style={[of.statusOption, status === key && of.statusOptionActive]} onPress={() => setStatus(key)}>
                <View style={[of.statusDot, { backgroundColor: cfg.color }]} />
                <Text style={[of.statusLabel, status === key && { color: C.textPrimary }]}>{cfg.label}</Text>
                {status === key && <IcCheck color={C.primary} size={16} />}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const of = StyleSheet.create({
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
  statusOption: { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.md, borderRadius: R.xl, marginBottom: S.xs, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg },
  statusOptionActive: { borderColor: C.primary, backgroundColor: 'rgba(245,200,0,0.04)' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { flex: 1, fontSize: F.sm, fontWeight: '600', color: C.textSecondary },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: S.md },
  title: { fontSize: F.xxl, fontWeight: '800', color: C.textPrimary },
  subtitle: { fontSize: F.sm, color: C.textTertiary, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: S.xs, backgroundColor: C.primary, borderRadius: R.full, paddingHorizontal: S.md, paddingVertical: S.sm },
  addBtnTxt: { fontWeight: '800', fontSize: F.sm, color: C.black },
  list: { padding: S.md, gap: S.sm, paddingBottom: 100 },
  emptyBox: { alignItems: 'center', padding: S.xxl, gap: S.md },
  emptyTxt: { fontSize: F.lg, fontWeight: '700', color: C.textPrimary },
  emptySub: { fontSize: F.sm, color: C.textTertiary, textAlign: 'center', lineHeight: 20 },
  card: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, ...Sh.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, marginBottom: S.sm },
  obraIcon: { width: 40, height: 40, borderRadius: R.lg, backgroundColor: 'rgba(245,200,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: F.md, fontWeight: '800', color: C.textPrimary },
  cardAddr: { fontSize: F.xs, color: C.textTertiary, marginTop: 2 },
  statusBadge: { borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 3 },
  statusTxt: { fontSize: F.xs, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginBottom: S.sm },
  metaTxt: { fontSize: F.xs, color: C.textTertiary },
  statsRow: { flexDirection: 'row', backgroundColor: C.bg, borderRadius: R.lg, padding: S.sm, marginBottom: S.sm },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: F.lg, fontWeight: '800', color: C.textPrimary },
  statLabel: { fontSize: F.xs, color: C.textTertiary },
  statDivider: { width: 1, backgroundColor: C.border, marginVertical: S.xs },
  cardActions: { flexDirection: 'row', gap: S.sm, paddingTop: S.sm, borderTopWidth: 1, borderTopColor: C.border },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: S.xs, paddingVertical: S.xs, paddingHorizontal: S.sm, borderRadius: R.md, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  actionBtnTxt: { fontSize: F.xs, color: C.textSecondary, fontWeight: '600' },
  gray100: '#F2F2F7',
  gray500: '#8E8E93',
});
