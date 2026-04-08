import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { addChecklist, addPendingSync, RootState } from '../store';
import api, { saveOffline } from '../services/api';
import { NR_TEMPLATES, NR_LIST, NR_CATEGORIAS } from '../theme/nrTemplates';
import { C, S, R, F, Sh } from '../theme';

export default function NewChecklistScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const isOnline = useSelector((s: RootState) => s.app.isOnline);

  const [titulo, setTitulo] = useState('');
  const [norma, setNorma] = useState('NR-35');
  const [obra, setObra] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [loading, setLoading] = useState(false);

  const template = NR_TEMPLATES[norma];

  const filteredNRs = NR_LIST.filter(
    (nr) => categoria === 'Todas' || nr.categoria === categoria
  );

  const criar = async () => {
    if (!titulo.trim()) { Alert.alert('Atenção', 'Informe o título da inspeção.'); return; }
    if (!obra.trim()) { Alert.alert('Atenção', 'Informe a obra ou local.'); return; }

    setLoading(true);
    const payload = {
      titulo: titulo.trim(),
      norma,
      obra: obra.trim(),
      responsavel: user?.name,
      user_id: user?.id,
      itens: template.itens,
      status: 'em_andamento',
      progresso: 0,
      data_criacao: new Date().toISOString(),
    };

    if (isOnline) {
      try {
        const res = await api.post('/checklists', payload);
        const newItem = res.data?.checklist || { ...payload, id: Date.now() };
        const withTemplate = { ...newItem, _template: template };
        dispatch(addChecklist(withTemplate));
        navigation.replace('ChecklistWizard', { checklist: withTemplate });
      } catch {
        // Salva offline
        const offlineItem = { ...payload, id: `offline_${Date.now()}`, _pendingSync: true, _template: template };
        dispatch(addChecklist(offlineItem));
        dispatch(addPendingSync(offlineItem));
        await saveOffline('pendingChecklists', offlineItem);
        navigation.replace('ChecklistWizard', { checklist: offlineItem });
      }
    } else {
      const offlineItem = { ...payload, id: `offline_${Date.now()}`, _pendingSync: true, _template: template };
      dispatch(addChecklist(offlineItem));
      dispatch(addPendingSync(offlineItem));
      await saveOffline('pendingChecklists', offlineItem);
      navigation.replace('ChecklistWizard', { checklist: offlineItem });
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.pageTitle}>Nova Inspeção</Text>

        {/* Dados básicos */}
        <View style={s.card}>
          <Text style={s.label}>TÍTULO DA INSPEÇÃO *</Text>
          <TextInput
            style={s.input}
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ex: Inspeção NR-35 Torre A"
            placeholderTextColor={C.textTertiary}
          />

          <Text style={s.label}>OBRA / LOCAL *</Text>
          <TextInput
            style={s.input}
            value={obra}
            onChangeText={setObra}
            placeholder="Nome da obra ou local"
            placeholderTextColor={C.textTertiary}
          />
        </View>

        {/* Seleção de NR */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Norma Regulamentadora</Text>

          {/* Filtro por categoria */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll}>
            <View style={s.catRow}>
              {NR_CATEGORIAS.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[s.catChip, categoria === cat && s.catChipActive]}
                  onPress={() => setCategoria(cat)}
                >
                  <Text style={[s.catChipTxt, categoria === cat && s.catChipActiveTxt]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Grid de NRs */}
          <View style={s.nrGrid}>
            {filteredNRs.map((nr) => (
              <TouchableOpacity
                key={nr.norma}
                style={[s.nrCard, norma === nr.norma && s.nrCardActive]}
                onPress={() => setNorma(nr.norma)}
              >
                <Text style={s.nrEmoji}>{nr.icone}</Text>
                <Text style={[s.nrCode, norma === nr.norma && s.nrCodeActive]}>{nr.norma}</Text>
                <Text style={s.nrLabel} numberOfLines={2}>{nr.descricao.split('—').pop()?.trim() || nr.descricao}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview da NR selecionada */}
        {template && (
          <View style={s.previewCard}>
            <View style={s.previewHeader}>
              <Text style={s.previewEmoji}>{template.icone}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.previewTitle}>{template.label}</Text>
                <Text style={s.previewDesc}>{template.descricao}</Text>
              </View>
              <View style={s.previewCountBadge}>
                <Text style={s.previewCount}>{template.itens.length}</Text>
                <Text style={s.previewCountLabel}>itens</Text>
              </View>
            </View>

            <View style={s.previewDivider} />

            <Text style={s.previewSectionLabel}>ITENS INCLUÍDOS</Text>
            {template.itens.slice(0, 5).map((item, i) => (
              <View key={i} style={s.previewItem}>
                {item.critico
                  ? <Text style={s.previewCritDot}>⚠️</Text>
                  : <View style={s.previewDot} />
                }
                <Text style={s.previewItemTxt} numberOfLines={1}>{item.texto}</Text>
              </View>
            ))}
            {template.itens.length > 5 && (
              <Text style={s.previewMore}>+{template.itens.length - 5} itens adicionais...</Text>
            )}

            <View style={s.previewStats}>
              <View style={s.previewStat}>
                <Text style={s.previewStatVal}>{template.itens.filter((i) => i.critico).length}</Text>
                <Text style={s.previewStatLabel}>críticos</Text>
              </View>
              <View style={s.previewStat}>
                <Text style={s.previewStatVal}>{template.itens.length}</Text>
                <Text style={s.previewStatLabel}>total</Text>
              </View>
              <View style={[s.previewCatBadge, { borderColor: template.cor }]}>
                <Text style={[s.previewCatTxt, { color: template.cor }]}>{template.categoria}</Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={criar} disabled={loading}>
          {loading
            ? <ActivityIndicator color={C.black} />
            : <Text style={s.btnTxt}>✅ Criar Inspeção {norma}</Text>
          }
        </TouchableOpacity>

        {!isOnline && (
          <View style={s.offlineNote}>
            <Text style={s.offlineNoteTxt}>📵 Você está offline — a inspeção será salva localmente</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: S.md, paddingBottom: 100 },
  pageTitle: { fontSize: F.xxl, fontWeight: '800', color: C.textPrimary, marginBottom: S.md },

  card: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, marginBottom: S.md, ...Sh.xs },
  sectionTitle: { fontSize: F.md, fontWeight: '800', color: C.textPrimary, marginBottom: S.md },
  label: { fontSize: F.xs, fontWeight: '700', color: C.textTertiary, letterSpacing: 1.5, marginBottom: S.xs, marginTop: S.sm },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: S.md, fontSize: F.sm, color: C.textPrimary, backgroundColor: C.bg },

  catScroll: { marginBottom: S.md },
  catRow: { flexDirection: 'row', gap: S.xs, paddingBottom: S.xs },
  catChip: { paddingHorizontal: S.sm, paddingVertical: S.xs, borderRadius: R.full, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  catChipActive: { backgroundColor: C.black, borderColor: C.black },
  catChipTxt: { fontSize: F.xs, color: C.textSecondary, fontWeight: '600' },
  catChipActiveTxt: { color: C.primary },

  nrGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  nrCard: { width: '30%', backgroundColor: C.bg, borderRadius: R.xl, padding: S.sm, alignItems: 'center', borderWidth: 1.5, borderColor: C.border, gap: 3 },
  nrCardActive: { backgroundColor: C.black, borderColor: C.primary },
  nrEmoji: { fontSize: 22, marginBottom: 2 },
  nrCode: { fontSize: F.xs, fontWeight: '800', color: C.textPrimary },
  nrCodeActive: { color: C.primary },
  nrLabel: { fontSize: F.xs - 1, color: C.textTertiary, textAlign: 'center', lineHeight: 14 },

  previewCard: { backgroundColor: C.black, borderRadius: R.xxl, padding: S.md, marginBottom: S.md, ...Sh.md },
  previewHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, marginBottom: S.md },
  previewEmoji: { fontSize: 28 },
  previewTitle: { fontSize: F.sm, fontWeight: '800', color: C.white },
  previewDesc: { fontSize: F.xs, color: C.gray500, marginTop: 2 },
  previewCountBadge: { backgroundColor: C.primary, borderRadius: R.lg, padding: S.xs, alignItems: 'center', minWidth: 44 },
  previewCount: { fontSize: F.xl, fontWeight: '900', color: C.black },
  previewCountLabel: { fontSize: F.xs - 1, fontWeight: '700', color: C.black },
  previewDivider: { height: 1, backgroundColor: C.gray800, marginBottom: S.md },
  previewSectionLabel: { fontSize: F.xs, fontWeight: '700', color: C.gray600, letterSpacing: 1.5, marginBottom: S.sm },
  previewItem: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginBottom: 6 },
  previewDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.gray600 },
  previewCritDot: { fontSize: F.xs },
  previewItemTxt: { fontSize: F.xs, color: C.gray400, flex: 1 },
  previewMore: { fontSize: F.xs, color: C.primary, marginTop: S.xs, fontWeight: '600' },
  previewStats: { flexDirection: 'row', alignItems: 'center', gap: S.md, marginTop: S.md, paddingTop: S.md, borderTopWidth: 1, borderTopColor: C.gray800 },
  previewStat: { alignItems: 'center' },
  previewStatVal: { fontSize: F.xl, fontWeight: '900', color: C.white },
  previewStatLabel: { fontSize: F.xs, color: C.gray500 },
  previewCatBadge: { marginLeft: 'auto', borderWidth: 1, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 3 },
  previewCatTxt: { fontSize: F.xs, fontWeight: '700' },

  btn: { backgroundColor: C.primary, borderRadius: R.xl, padding: S.md + 2, alignItems: 'center', ...Sh.colored },
  btnTxt: { fontWeight: '800', fontSize: F.md, color: C.black },

  offlineNote: { backgroundColor: C.warningBg, borderRadius: R.lg, padding: S.md, marginTop: S.sm, borderWidth: 1, borderColor: C.warningBorder },
  offlineNoteTxt: { fontSize: F.xs, color: C.warningDark, textAlign: 'center', fontWeight: '600' },
});
