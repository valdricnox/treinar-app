import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Pressable,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline, Check } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { addChecklist, addPendingSync, RootState } from '../store';
import api, { saveOffline } from '../services/api';
import { NR_TEMPLATES, NR_LIST, NR_CATEGORIAS } from '../theme/nrTemplates';
import { C, S, R, F, Sh } from '../theme';

// ─── SVG Icon per NR category ─────────────────────────────────────────────────
function NRIcon({ categoria, color, size = 28 }: { categoria: string; color: string; size?: number }) {
  const s2 = 1.8;
  const icons: Record<string, JSX.Element> = {
    'Gestão': <><Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth={s2} /><Line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth={s2} strokeLinecap="round" /><Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth={s2} strokeLinecap="round" /></>,
    'Proteção': <><Path d="M12 3L20 7v5c0 4-3.5 7-8 9-4.5-2-8-5-8-9V7l8-4z" stroke={color} strokeWidth={s2} strokeLinejoin="round" /></>,
    'Saúde': <><Path d="M12 22s8-4 8-10V5l-8-2-8 2v7c0 6 8 10 8 10z" stroke={color} strokeWidth={s2} strokeLinejoin="round" /><Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth={s2} strokeLinecap="round" /><Line x1="10" y1="11" x2="14" y2="11" stroke={color} strokeWidth={s2} strokeLinecap="round" /></>,
    'Elétrica': <><Path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" stroke={color} strokeWidth={s2} strokeLinejoin="round" /></>,
    'Máquinas': <><Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={s2} /><Path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={color} strokeWidth={s2} strokeLinecap="round" /></>,
    'Construção': <><Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth={s2} strokeLinejoin="round" /></>,
    'Risco': <><Path d="M12 3L21.5 20H2.5L12 3Z" stroke={color} strokeWidth={s2} strokeLinejoin="round" /><Line x1="12" y1="10" x2="12" y2="14" stroke={color} strokeWidth={s2} strokeLinecap="round" /><Circle cx="12" cy="17.5" r="0.8" fill={color} /></>,
    'Emergência': <><Path d="M12 22a10 10 0 100-20 10 10 0 000 20z" stroke={color} strokeWidth={s2} /><Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth={s2} strokeLinecap="round" /></>,
    'Altura': <><Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth={s2} strokeLinecap="round" strokeLinejoin="round" /></>,
    'Operações': <><Rect x="3" y="11" width="18" height="10" rx="2" stroke={color} strokeWidth={s2} /><Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth={s2} strokeLinecap="round" /></>,
    'Ambiental': <><Path d="M12 22V12M12 12C12 7 7 5 3 6.5c1 4 4 6.5 9 5.5M12 12c0-5 5-7 9-5.5-1 4-4 6.5-9 5.5" stroke={color} strokeWidth={s2} strokeLinecap="round" /></>,
    'Sinalização': <><Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke={color} strokeWidth={s2} strokeLinejoin="round" /><Line x1="4" y1="22" x2="4" y2="15" stroke={color} strokeWidth={s2} strokeLinecap="round" /></>,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {icons[categoria] || icons['Risco']}
    </Svg>
  );
}

const CATEGORIAS_ORDERED = ['Todas','Proteção','Altura','Construção','Elétrica','Máquinas','Emergência','Risco','Saúde','Gestão','Operações','Ambiental','Sinalização'];

export default function NewChecklistScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const isOnline = useSelector((s: RootState) => s.app.isOnline);

  // Step 1: Info básica
  const [titulo, setTitulo] = useState('');
  const [obra, setObra] = useState('');
  const [acompanhante, setAcompanhante] = useState('');  // opcional
  const [acompanhanteCargo, setAcompanhanteCargo] = useState('');

  // Step 2: Seleção de NRs
  const [selectedNRs, setSelectedNRs] = useState<string[]>([]);
  const [categoria, setCategoria] = useState('Todas');

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const filteredNRs = NR_LIST.filter(
    (nr) => categoria === 'Todas' || nr.categoria === categoria
  );

  const toggleNR = (norma: string) => {
    setSelectedNRs(prev =>
      prev.includes(norma)
        ? prev.filter(n => n !== norma)
        : [...prev, norma]
    );
  };

  // Combina itens de todas as NRs selecionadas, agrupadas por NR
  const buildItens = () => {
    return selectedNRs.flatMap(norma => {
      const template = NR_TEMPLATES[norma];
      if (!template) return [];
      return template.itens.map(item => ({ ...item, _norma: norma }));
    });
  };

  const buildTemplate = () => {
    // Para o wizard: grupos organizados por NR, cada NR vira uma "seção"
    const grupos = selectedNRs.flatMap(norma => {
      const t = NR_TEMPLATES[norma];
      if (!t) return [];
      return t.grupos.map(g => ({ ...g, _norma: norma, titulo: `${norma} — ${g.titulo}` }));
    });
    return {
      norma: selectedNRs.length === 1 ? selectedNRs[0] : selectedNRs.join('+'),
      grupos,
      itens: buildItens(),
    };
  };

  const criar = async () => {
    if (!titulo.trim()) { Alert.alert('Atenção', 'Informe o título da inspeção.'); return; }
    if (!obra.trim()) { Alert.alert('Atenção', 'Informe a obra ou local.'); return; }
    if (selectedNRs.length === 0) { Alert.alert('Atenção', 'Selecione ao menos uma NR.'); return; }

    setLoading(true);
    const template = buildTemplate();
    const payload = {
      titulo: titulo.trim(),
      norma: template.norma,
      normas: selectedNRs,  // array com todas as NRs
      obra: obra.trim(),
      responsavel: user?.name,
      acompanhante: acompanhante.trim() || null,
      acompanhanteCargo: acompanhanteCargo.trim() || null,
      user_id: user?.id,
      itens: template.itens,
      status: 'em_andamento',
      progresso: 0,
      data_criacao: new Date().toISOString(),
    };

    const goToWizard = (item: any) => {
      navigation.replace('ChecklistWizard', {
        checklist: { ...item, _template: template },
      });
    };

    if (isOnline) {
      try {
        const res = await api.post('/checklists', payload);
        const newItem = res.data?.checklist || { ...payload, id: Date.now() };
        dispatch(addChecklist({ ...newItem, _template: template }));
        goToWizard(newItem);
      } catch {
        const offline = { ...payload, id: `offline_${Date.now()}`, _pendingSync: true, _template: template };
        dispatch(addChecklist(offline));
        dispatch(addPendingSync(offline));
        await saveOffline('pendingChecklists', offline);
        goToWizard(offline);
      }
    } else {
      const offline = { ...payload, id: `offline_${Date.now()}`, _pendingSync: true, _template: template };
      dispatch(addChecklist(offline));
      dispatch(addPendingSync(offline));
      await saveOffline('pendingChecklists', offline);
      goToWizard(offline);
    }
    setLoading(false);
  };

  // ─── Step 1: Informações básicas ─────────────────────────────────────────
  if (step === 1) {
    return (
      <SafeAreaView style={s.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={s.stepIndicator}>
            <View style={[s.stepDot, s.stepDotActive]}><Text style={s.stepDotTxt}>1</Text></View>
            <View style={s.stepLine} />
            <View style={s.stepDot}><Text style={[s.stepDotTxt, { color: C.textTertiary }]}>2</Text></View>
          </View>
          <Text style={s.pageTitle}>Dados da Inspeção</Text>
          <Text style={s.pageSubtitle}>Informações gerais sobre esta vistoria</Text>

          <View style={s.card}>
            <Text style={s.fieldLabel}>TÍTULO DA INSPEÇÃO *</Text>
            <TextInput style={s.input} value={titulo} onChangeText={setTitulo}
              placeholder="Ex: Vistoria Mensal — Torre B" placeholderTextColor={C.textTertiary}
              autoCapitalize="words" />

            <Text style={s.fieldLabel}>OBRA / LOCAL *</Text>
            <TextInput style={s.input} value={obra} onChangeText={setObra}
              placeholder="Nome da obra ou endereço" placeholderTextColor={C.textTertiary} />
          </View>

          <View style={s.card}>
            <Text style={s.sectionTitle}>Acompanhante da Vistoria</Text>
            <Text style={s.sectionSub}>Pessoa da empresa vistoriada que acompanhará a inspeção (opcional)</Text>

            <Text style={s.fieldLabel}>NOME DO ACOMPANHANTE</Text>
            <TextInput style={s.input} value={acompanhante} onChangeText={setAcompanhante}
              placeholder="Nome completo (opcional)" placeholderTextColor={C.textTertiary}
              autoCapitalize="words" />

            {acompanhante.trim() ? (
              <>
                <Text style={s.fieldLabel}>CARGO / FUNÇÃO</Text>
                <TextInput style={s.input} value={acompanhanteCargo} onChangeText={setAcompanhanteCargo}
                  placeholder="Ex: Engenheiro de Segurança" placeholderTextColor={C.textTertiary} />
              </>
            ) : null}

            {acompanhante.trim() ? (
              <View style={s.acompanhantePreview}>
                <Text style={s.acompanhantePreviewTxt}>
                  ✅ {acompanhante}{acompanhanteCargo ? ` · ${acompanhanteCargo}` : ''} será solicitado a assinar ao final
                </Text>
              </View>
            ) : (
              <View style={s.acompanhanteNote}>
                <Text style={s.acompanhanteNoteTxt}>
                  Se preenchido, o acompanhante será solicitado a assinar a inspeção ao final, junto com o inspetor.
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[s.btn, (!titulo.trim() || !obra.trim()) && s.btnDisabled]}
            onPress={() => {
              if (!titulo.trim() || !obra.trim()) {
                Alert.alert('Atenção', 'Preencha título e obra para continuar.');
                return;
              }
              setStep(2);
            }}
            disabled={!titulo.trim() || !obra.trim()}
          >
            <Text style={s.btnTxt}>Continuar → Selecionar NRs</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Step 2: Seleção de NRs ───────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.stepIndicator}>
          <View style={[s.stepDot, s.stepDotDone]}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Polyline points="20 6 9 17 4 12" stroke={C.white} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </Svg>
          </View>
          <View style={[s.stepLine, s.stepLineDone]} />
          <View style={[s.stepDot, s.stepDotActive]}><Text style={s.stepDotTxt}>2</Text></View>
        </View>

        <Text style={s.pageTitle}>Normas Regulamentadoras</Text>
        <Text style={s.pageSubtitle}>Selecione uma ou mais NRs para esta inspeção</Text>

        {/* Selecionadas */}
        {selectedNRs.length > 0 && (
          <View style={s.selectedBar}>
            <Text style={s.selectedBarLabel}>{selectedNRs.length} NR(s) selecionada(s):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={s.selectedChips}>
                {selectedNRs.map(nr => (
                  <Pressable key={nr} style={s.selectedChip} onPress={() => toggleNR(nr)}>
                    <Text style={s.selectedChipTxt}>{nr}</Text>
                    <Text style={s.selectedChipX}>✕</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Filtro de categoria */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll}>
          <View style={s.catRow}>
            {CATEGORIAS_ORDERED.map(cat => (
              <Pressable
                key={cat}
                style={[s.catChip, categoria === cat && s.catChipActive]}
                onPress={() => setCategoria(cat)}
              >
                <Text style={[s.catChipTxt, categoria === cat && s.catChipActiveTxt]}>{cat}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Grid de NRs — 3 colunas, cards com ícone + nome */}
        <View style={s.nrGrid}>
          {filteredNRs.map((nr) => {
            const selected = selectedNRs.includes(nr.norma);
            return (
              <Pressable
                key={nr.norma}
                style={[s.nrCard, selected && s.nrCardSelected]}
                onPress={() => toggleNR(nr.norma)}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
              >
                {selected && (
                  <View style={s.nrCheckMark}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Polyline points="20 6 9 17 4 12" stroke={C.white} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </Svg>
                  </View>
                )}
                <View style={[s.nrIconBox, { backgroundColor: selected ? C.black : `${nr.cor}15` }]}>
                  <NRIcon categoria={nr.categoria} color={selected ? C.primary : nr.cor} size={24} />
                </View>
                <Text style={[s.nrCardCode, selected && s.nrCardCodeSelected]}>{nr.norma}</Text>
                <Text style={s.nrCardDesc} numberOfLines={2}>{nr.descricao.replace(/.*—\s*/, '')}</Text>
                <View style={[s.nrCatTag, { backgroundColor: `${nr.cor}18` }]}>
                  <Text style={[s.nrCatTagTxt, { color: nr.cor }]}>{nr.categoria}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Preview do que será inspecionado */}
        {selectedNRs.length > 0 && (
          <View style={s.previewCard}>
            <Text style={s.previewTitle}>
              {selectedNRs.length === 1 ? '1 norma selecionada' : `${selectedNRs.length} normas combinadas`}
            </Text>
            <Text style={s.previewSub}>
              {buildItens().length} itens de verificação no total
              {selectedNRs.length > 1 ? `, organizados em ${selectedNRs.length} seções` : ''}
            </Text>
            {selectedNRs.map(norma => {
              const t = NR_TEMPLATES[norma];
              return (
                <View key={norma} style={s.previewNrRow}>
                  <View style={[s.previewNrDot, { backgroundColor: t?.cor || C.primary }]} />
                  <Text style={s.previewNrTxt}>{norma}</Text>
                  <Text style={s.previewNrCount}>{t?.itens.length || 0} itens</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={s.bottomBtns}>
          <TouchableOpacity style={s.backBtn} onPress={() => setStep(1)}>
            <Text style={s.backBtnTxt}>← Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btn, { flex: 1 }, (selectedNRs.length === 0 || loading) && s.btnDisabled]}
            onPress={criar}
            disabled={selectedNRs.length === 0 || loading}
          >
            {loading
              ? <ActivityIndicator color={C.black} />
              : <Text style={s.btnTxt}>Iniciar Inspeção →</Text>
            }
          </TouchableOpacity>
        </View>

        {!isOnline && (
          <View style={s.offlineNote}>
            <Text style={s.offlineNoteTxt}>📵 Offline — inspeção será salva localmente</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: S.md, paddingBottom: 100 },

  stepIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: S.lg },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: C.black, borderColor: C.black },
  stepDotDone: { backgroundColor: C.success, borderColor: C.success },
  stepDotTxt: { fontSize: 12, fontWeight: '700', color: C.primary },
  stepLine: { flex: 1, height: 2, backgroundColor: C.border, marginHorizontal: S.xs },
  stepLineDone: { backgroundColor: C.success },

  pageTitle: { fontSize: F.xxl, fontWeight: '800', color: C.textPrimary, marginBottom: S.xs },
  pageSubtitle: { fontSize: F.sm, color: C.textTertiary, marginBottom: S.lg },

  card: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, marginBottom: S.md, ...Sh.xs },
  sectionTitle: { fontSize: F.md, fontWeight: '800', color: C.textPrimary, marginBottom: S.xs },
  sectionSub: { fontSize: F.xs, color: C.textTertiary, marginBottom: S.md },

  fieldLabel: { fontSize: F.xs, fontWeight: '700', color: C.textTertiary, letterSpacing: 1.2, marginBottom: S.xs, marginTop: S.sm },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: S.md, fontSize: F.sm, color: C.textPrimary, backgroundColor: C.bg },

  acompanhantePreview: { backgroundColor: C.successBg, borderRadius: R.lg, padding: S.sm, marginTop: S.sm, borderWidth: 1, borderColor: C.successBorder },
  acompanhantePreviewTxt: { fontSize: F.xs, color: C.successDark, fontWeight: '600' },
  acompanhanteNote: { backgroundColor: C.infoBg, borderRadius: R.lg, padding: S.sm, marginTop: S.sm },
  acompanhanteNoteTxt: { fontSize: F.xs, color: C.infoDark, lineHeight: 18 },

  selectedBar: { backgroundColor: C.card, borderRadius: R.xl, padding: S.sm, marginBottom: S.sm, borderWidth: 1, borderColor: C.primaryLight, ...Sh.xs },
  selectedBarLabel: { fontSize: F.xs, fontWeight: '700', color: C.textTertiary, marginBottom: S.xs },
  selectedChips: { flexDirection: 'row', gap: S.xs },
  selectedChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.black, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: S.xs },
  selectedChipTxt: { fontSize: F.xs, fontWeight: '800', color: C.primary },
  selectedChipX: { fontSize: 10, color: 'rgba(245,200,0,0.5)', fontWeight: '700' },

  catScroll: { marginBottom: S.md },
  catRow: { flexDirection: 'row', gap: S.xs, paddingBottom: S.xs },
  catChip: { paddingHorizontal: S.sm, paddingVertical: S.xs + 1, borderRadius: R.full, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  catChipActive: { backgroundColor: C.black, borderColor: C.black },
  catChipTxt: { fontSize: F.xs, color: C.textSecondary, fontWeight: '600' },
  catChipActiveTxt: { color: C.primary },

  nrGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginBottom: S.md },
  nrCard: {
    width: '30.5%',
    backgroundColor: C.card,
    borderRadius: R.xl,
    padding: S.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    gap: S.xs,
    position: 'relative',
    overflow: 'hidden',
    ...Sh.xs,
  },
  nrCardSelected: { borderColor: C.primary, backgroundColor: 'rgba(245,200,0,0.04)' },
  nrCheckMark: {
    position: 'absolute', top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.success, alignItems: 'center', justifyContent: 'center',
  },
  nrIconBox: { width: 44, height: 44, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center' },
  nrCardCode: { fontSize: F.xs, fontWeight: '800', color: C.textPrimary },
  nrCardCodeSelected: { color: C.primaryDark },
  nrCardDesc: { fontSize: 9, color: C.textTertiary, textAlign: 'center', lineHeight: 13 },
  nrCatTag: { borderRadius: R.full, paddingHorizontal: S.xs, paddingVertical: 2 },
  nrCatTagTxt: { fontSize: 9, fontWeight: '700' },

  previewCard: { backgroundColor: C.black, borderRadius: R.xxl, padding: S.md, marginBottom: S.md, ...Sh.md },
  previewTitle: { fontSize: F.md, fontWeight: '800', color: C.white, marginBottom: S.xs },
  previewSub: { fontSize: F.xs, color: C.gray500, marginBottom: S.sm },
  previewNrRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: S.xs },
  previewNrDot: { width: 8, height: 8, borderRadius: 4 },
  previewNrTxt: { fontSize: F.sm, fontWeight: '700', color: C.white, flex: 1 },
  previewNrCount: { fontSize: F.xs, color: C.gray500 },

  bottomBtns: { flexDirection: 'row', gap: S.sm, marginBottom: S.sm },
  backBtn: { paddingVertical: S.md, paddingHorizontal: S.md, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt: { fontSize: F.sm, fontWeight: '600', color: C.textSecondary },
  btn: { backgroundColor: C.primary, borderRadius: R.lg, paddingVertical: S.md + 2, alignItems: 'center', ...Sh.colored },
  btnDisabled: { opacity: 0.4 },
  btnTxt: { fontWeight: '800', fontSize: F.md, color: C.black },

  offlineNote: { backgroundColor: C.warningBg, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.warningBorder },
  offlineNoteTxt: { fontSize: F.xs, color: C.warningDark, textAlign: 'center', fontWeight: '600' },
});
