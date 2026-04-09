import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, Modal,
  Dimensions, Animated,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';
import { updateChecklist, addPendingSync, RootState } from '../store';
import api, { saveOfflineSingle } from '../services/api';
import { NRItem, NRGrupo } from '../theme/nrTemplates';
import SignatureCanvas from '../components/SignatureCanvas';
import { C, S, R, F, Sh } from '../theme';

const { width: SW } = Dimensions.get('window');

// ─── Item card ────────────────────────────────────────────────────────────────
const ItemCard = React.memo(({ item, onToggle, onObservacao, onFoto }: {
  item: NRItem & { _norma?: string };
  onToggle: (v: boolean) => void;
  onObservacao: (t: string) => void;
  onFoto: (uri: string) => void;
}) => {
  const [showObs, setShowObs] = useState(!!item.observacao);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão necessária', 'Permita o acesso à câmera nas configurações.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.75 });
    if (!result.canceled && result.assets[0]) onFoto(result.assets[0].uri);
  };

  return (
    <View style={[ic.card,
      item.conforme === true && ic.cardOk,
      item.conforme === false && ic.cardFail,
    ]}>
      {item.critico && item.conforme !== true && (
        <View style={ic.critBadge}><Text style={ic.critTxt}>⚠ Crítico</Text></View>
      )}
      <Text style={ic.itemTxt}>{item.texto}</Text>

      <View style={ic.btnRow}>
        <TouchableOpacity style={[ic.btn, item.conforme === true && ic.btnOk]} onPress={() => onToggle(true)}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Polyline points="20 6 9 17 4 12" stroke={item.conforme === true ? C.white : C.textTertiary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
          <Text style={[ic.btnTxt, item.conforme === true && ic.btnTxtOk]}>Conforme</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[ic.btn, item.conforme === false && ic.btnFail]} onPress={() => onToggle(false)}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Line x1="18" y1="6" x2="6" y2="18" stroke={item.conforme === false ? C.white : C.textTertiary} strokeWidth={2.5} strokeLinecap="round" />
            <Line x1="6" y1="6" x2="18" y2="18" stroke={item.conforme === false ? C.white : C.textTertiary} strokeWidth={2.5} strokeLinecap="round" />
          </Svg>
          <Text style={[ic.btnTxt, item.conforme === false && ic.btnTxtFail]}>Não conforme</Text>
        </TouchableOpacity>
      </View>

      <View style={ic.extras}>
        <TouchableOpacity style={ic.extraBtn} onPress={takePhoto}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={C.textSecondary} strokeWidth={1.8} />
            <Circle cx="12" cy="13" r="4" stroke={C.textSecondary} strokeWidth={1.8} />
          </Svg>
          <Text style={ic.extraBtnTxt}>{item.foto ? '1 foto' : 'Foto'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ic.extraBtn} onPress={() => setShowObs(!showObs)}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={item.observacao ? C.info : C.textSecondary} strokeWidth={1.8} />
          </Svg>
          <Text style={[ic.extraBtnTxt, item.observacao && { color: C.info }]}>Observação</Text>
        </TouchableOpacity>
      </View>

      {item.foto && <Image source={{ uri: item.foto }} style={ic.photo} />}
      {showObs && (
        <TextInput style={ic.obsInput} value={item.observacao || ''} onChangeText={onObservacao}
          placeholder="Descreva a observação..." placeholderTextColor={C.textTertiary}
          multiline numberOfLines={3} textAlignVertical="top" />
      )}
    </View>
  );
});

const ic = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: R.xl, padding: S.md, marginBottom: S.sm, borderWidth: 1.5, borderColor: C.border },
  cardOk: { borderColor: '#86EFAC', backgroundColor: '#F0FFF4' },
  cardFail: { borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' },
  critBadge: { backgroundColor: C.dangerBg, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: S.xs },
  critTxt: { fontSize: F.xs, fontWeight: '700', color: C.dangerDark },
  itemTxt: { fontSize: F.sm, color: C.textPrimary, fontWeight: '500', lineHeight: 20, marginBottom: S.sm },
  btnRow: { flexDirection: 'row', gap: S.sm, marginBottom: S.sm },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: S.sm, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg },
  btnOk: { backgroundColor: C.success, borderColor: C.success },
  btnFail: { backgroundColor: C.danger, borderColor: C.danger },
  btnTxt: { fontSize: F.sm, fontWeight: '700', color: C.textTertiary },
  btnTxtOk: { color: C.white },
  btnTxtFail: { color: C.white },
  extras: { flexDirection: 'row', gap: S.sm },
  extraBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: S.xs, paddingHorizontal: S.sm, borderRadius: R.md, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  extraBtnTxt: { fontSize: F.xs, color: C.textSecondary, fontWeight: '600' },
  photo: { width: 88, height: 88, borderRadius: R.md, marginTop: S.sm },
  obsInput: { marginTop: S.sm, borderWidth: 1, borderColor: C.border, borderRadius: R.md, padding: S.sm, fontSize: F.sm, color: C.textPrimary, minHeight: 72, backgroundColor: C.bg },
});

// ─── Tela de finalização ──────────────────────────────────────────────────────
const FinalizacaoStep = ({ obs, onObs, location, onGPS }: any) => (
  <ScrollView contentContainerStyle={{ padding: S.md, paddingBottom: S.xxl }} showsVerticalScrollIndicator={false}>
    <View style={fin.section}>
      <Text style={fin.title}>Observações Gerais</Text>
      <TextInput style={fin.textArea} value={obs} onChangeText={onObs}
        placeholder="Adicione observações gerais sobre a inspeção..."
        placeholderTextColor={C.textTertiary} multiline numberOfLines={5} textAlignVertical="top" />
    </View>
    <View style={fin.section}>
      <Text style={fin.title}>Localização GPS</Text>
      <TouchableOpacity style={[fin.gpsBtn, location && fin.gpsBtnActive]} onPress={onGPS}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" stroke={location ? C.successDark : C.textSecondary} strokeWidth={1.8} />
          <Circle cx="12" cy="10" r="3" stroke={location ? C.successDark : C.textSecondary} strokeWidth={1.8} />
        </Svg>
        <Text style={[fin.gpsTxt, location && { color: C.successDark }]}>
          {location ? `${location.lat?.toFixed(5)}, ${location.lng?.toFixed(5)}` : 'Capturar localização atual'}
        </Text>
      </TouchableOpacity>
    </View>
  </ScrollView>
);

const fin = StyleSheet.create({
  section: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, marginBottom: S.md, ...Sh.xs },
  title: { fontSize: F.md, fontWeight: '800', color: C.textPrimary, marginBottom: S.md },
  textArea: { borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: S.md, fontSize: F.sm, color: C.textPrimary, minHeight: 110 },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', gap: S.sm, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: S.md },
  gpsBtnActive: { borderColor: C.success, backgroundColor: C.successBg },
  gpsTxt: { fontSize: F.sm, color: C.textSecondary, flex: 1 },
});

// ─── Modal de Dupla Assinatura ────────────────────────────────────────────────
function SignatureModal({ visible, inspetorName, acompanhante, onComplete, onCancel }: {
  visible: boolean;
  inspetorName: string;
  acompanhante: string | null;
  onComplete: (sig1: string, sig2: string | null) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<'inspetor' | 'acompanhante' | 'done'>('inspetor');
  const [sig1, setSig1] = useState<string | null>(null);
  const [sig2, setSig2] = useState<string | null>(null);

  const handleSig1 = (data: string) => {
    setSig1(data);
    if (acompanhante) {
      setStep('acompanhante');
    } else {
      onComplete(data, null);
    }
  };

  const handleSig2 = (data: string) => {
    setSig2(data);
    onComplete(sig1!, data);
  };

  const reset = () => { setStep('inspetor'); setSig1(null); setSig2(null); };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <SafeAreaView style={sm.safe}>
        <View style={sm.header}>
          <TouchableOpacity onPress={() => { reset(); onCancel(); }} style={sm.cancelBtn}>
            <Text style={sm.cancelTxt}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={sm.title}>
            {step === 'inspetor' ? 'Assinatura do Inspetor' : 'Assinatura do Acompanhante'}
          </Text>
          <View style={{ width: 70 }} />
        </View>

        {/* Progress */}
        {acompanhante && (
          <View style={sm.progress}>
            <View style={[sm.progressStep, step === 'inspetor' && sm.progressStepActive, sig1 && sm.progressStepDone]}>
              <Text style={sm.progressStepTxt}>1</Text>
            </View>
            <View style={[sm.progressLine, sig1 && sm.progressLineDone]} />
            <View style={[sm.progressStep, step === 'acompanhante' && sm.progressStepActive]}>
              <Text style={sm.progressStepTxt}>2</Text>
            </View>
          </View>
        )}

        <ScrollView contentContainerStyle={sm.scroll} keyboardShouldPersistTaps="handled">
          {step === 'inspetor' ? (
            <>
              <View style={sm.infoCard}>
                <Text style={sm.infoLabel}>INSPETOR RESPONSÁVEL</Text>
                <Text style={sm.infoName}>{inspetorName}</Text>
              </View>
              <Text style={sm.instruction}>
                {inspetorName}, assine no campo abaixo para confirmar que esta inspeção foi realizada por você.
              </Text>
              <SignatureCanvas
                label="ASSINATURA DO INSPETOR"
                onSave={handleSig1}
                height={200}
              />
            </>
          ) : (
            <>
              <View style={sm.infoCard}>
                <Text style={sm.infoLabel}>ACOMPANHANTE / RESPONSÁVEL DA EMPRESA</Text>
                <Text style={sm.infoName}>{acompanhante}</Text>
              </View>
              <Text style={sm.instruction}>
                {acompanhante}, assine para confirmar que acompanhou e está ciente dos resultados desta inspeção.
              </Text>
              <SignatureCanvas
                label="ASSINATURA DO ACOMPANHANTE"
                onSave={handleSig2}
                height={200}
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const sm = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: S.md, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  cancelBtn: { width: 70 },
  cancelTxt: { fontSize: F.md, color: C.textTertiary },
  title: { fontSize: F.md, fontWeight: '800', color: C.textPrimary, textAlign: 'center', flex: 1 },
  progress: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.xl, paddingVertical: S.md, backgroundColor: C.card },
  progressStep: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  progressStepActive: { backgroundColor: C.black, borderColor: C.black },
  progressStepDone: { backgroundColor: C.success, borderColor: C.success },
  progressStepTxt: { fontSize: 12, fontWeight: '700', color: C.primary },
  progressLine: { flex: 1, height: 2, backgroundColor: C.border, marginHorizontal: S.xs },
  progressLineDone: { backgroundColor: C.success },
  scroll: { padding: S.lg, paddingBottom: 100 },
  infoCard: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, marginBottom: S.md, borderWidth: 1, borderColor: C.border },
  infoLabel: { fontSize: F.xs, fontWeight: '700', color: C.textTertiary, letterSpacing: 1 },
  infoName: { fontSize: F.xl, fontWeight: '800', color: C.textPrimary, marginTop: S.xs },
  instruction: { fontSize: F.sm, color: C.textSecondary, lineHeight: 22, marginBottom: S.lg },
});

// ─── Modal de Conclusão ───────────────────────────────────────────────────────
function ConclusionModal({ visible, checklist, conformidade, onSign, onCancel }: {
  visible: boolean;
  checklist: any;
  conformidade: number;
  onSign: () => void;
  onCancel: () => void;
}) {
  if (!visible) return null;
  const criticos = (checklist?.itens || []).filter((i: any) => i.critico && i.conforme === false).length;
  const naoResp = (checklist?.itens || []).filter((i: any) => i.conforme === null).length;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={cm.overlay}>
        <View style={cm.sheet}>
          <View style={cm.sheetHandle} />

          {/* Score */}
          <View style={[cm.scoreCircle, { borderColor: conformidade >= 80 ? C.success : conformidade >= 60 ? C.warning : C.danger }]}>
            <Text style={[cm.scoreVal, { color: conformidade >= 80 ? C.success : conformidade >= 60 ? C.warning : C.danger }]}>
              {conformidade}%
            </Text>
            <Text style={cm.scoreLabel}>conformidade</Text>
          </View>

          <Text style={cm.title}>Inspeção concluída</Text>

          <View style={cm.stats}>
            {criticos > 0 && (
              <View style={[cm.stat, { backgroundColor: C.dangerBg }]}>
                <Text style={[cm.statVal, { color: C.dangerDark }]}>{criticos}</Text>
                <Text style={[cm.statLabel, { color: C.dangerDark }]}>Itens críticos</Text>
              </View>
            )}
            {naoResp > 0 && (
              <View style={[cm.stat, { backgroundColor: C.warningBg }]}>
                <Text style={[cm.statVal, { color: C.warningDark }]}>{naoResp}</Text>
                <Text style={[cm.statLabel, { color: C.warningDark }]}>Sem resposta</Text>
              </View>
            )}
            <View style={[cm.stat, { backgroundColor: C.successBg }]}>
              <Text style={[cm.statVal, { color: C.successDark }]}>{(checklist?.itens || []).filter((i: any) => i.conforme === true).length}</Text>
              <Text style={[cm.statLabel, { color: C.successDark }]}>Conformes</Text>
            </View>
          </View>

          <View style={cm.sigInfo}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M12 22s8-4 8-10V5l-8-2-8 2v7c0 6 8 10 8 10z" stroke={C.infoDark} strokeWidth={1.8} strokeLinejoin="round" />
            </Svg>
            <Text style={cm.sigInfoTxt}>
              O próximo passo é coletar as assinaturas digitais{checklist?.acompanhante ? ` do inspetor e de ${checklist?.acompanhante}` : ' do inspetor'} para validar esta inspeção.
            </Text>
          </View>

          <TouchableOpacity style={cm.signBtn} onPress={onSign}>
            <Text style={cm.signBtnTxt}>✍️  Coletar Assinaturas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={cm.laterBtn} onPress={onCancel}>
            <Text style={cm.laterBtnTxt}>Assinar depois</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const cm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, padding: S.xl, paddingBottom: S.xxxl, alignItems: 'center' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.gray300, marginBottom: S.lg },
  scoreCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, alignItems: 'center', justifyContent: 'center', marginBottom: S.md },
  scoreVal: { fontSize: F.xxl, fontWeight: '900' },
  scoreLabel: { fontSize: F.xs, color: C.textTertiary, fontWeight: '600' },
  title: { fontSize: F.xl, fontWeight: '800', color: C.textPrimary, marginBottom: S.md },
  stats: { flexDirection: 'row', gap: S.sm, marginBottom: S.md, flexWrap: 'wrap', justifyContent: 'center' },
  stat: { borderRadius: R.lg, paddingHorizontal: S.md, paddingVertical: S.sm, alignItems: 'center', minWidth: 80 },
  statVal: { fontSize: F.xl, fontWeight: '900' },
  statLabel: { fontSize: F.xs, fontWeight: '600' },
  sigInfo: { flexDirection: 'row', gap: S.sm, alignItems: 'flex-start', backgroundColor: C.infoBg, borderRadius: R.xl, padding: S.md, marginBottom: S.lg, borderWidth: 1, borderColor: C.infoBorder },
  sigInfoTxt: { flex: 1, fontSize: F.sm, color: C.infoDark, lineHeight: 20 },
  signBtn: { width: '100%', backgroundColor: C.black, borderRadius: R.xl, paddingVertical: S.md + 2, alignItems: 'center', marginBottom: S.sm, ...Sh.lg },
  signBtnTxt: { fontWeight: '800', fontSize: F.md, color: C.primary },
  laterBtn: { paddingVertical: S.sm },
  laterBtnTxt: { fontSize: F.sm, color: C.textTertiary, fontWeight: '600' },
});

// ─── WIZARD PRINCIPAL ─────────────────────────────────────────────────────────
export default function ChecklistWizardScreen({ route, navigation }: any) {
  const { checklist: initial } = route.params;
  const dispatch = useDispatch();
  const isOnline = useSelector((s: RootState) => s.app.isOnline);

  const template = initial._template;
  const grupos: NRGrupo[] = template?.grupos || [];
  const totalSteps = grupos.length + 1; // +1 for finalização
  const LAST_STEP = totalSteps - 1;

  const [step, setStep] = useState(0);
  const [itens, setItens] = useState<any[]>(initial.itens || []);
  const [obs, setObs] = useState(initial.observacoes || '');
  const [location, setLocation] = useState<any>(initial.geolocation || null);
  const [saving, setSaving] = useState(false);
  const [showConclusion, setShowConclusion] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const conforme = itens.filter(i => i.conforme === true).length;
  const total = itens.length;
  const progresso = total > 0 ? Math.round((conforme / total) * 100) : 0;
  const conformidade = progresso;

  const grupoAtual = step < grupos.length ? grupos[step] : null;
  const itensDoGrupo = grupoAtual
    ? itens.filter(i => grupoAtual.itens.some((gi: any) => gi.id === i.id))
    : [];
  const respondidos = itensDoGrupo.filter(i => i.conforme !== null).length;

  const updateItem = useCallback((id: string, changes: Partial<any>) => {
    setItens(prev => prev.map(i => i.id === id ? { ...i, ...changes } : i));
  }, []);

  const irPara = (novoStep: number) => {
    if (novoStep < 0 || novoStep >= totalSteps) return;
    const dir = novoStep > step ? 1 : -1;
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -20 * dir, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]).start();
    setStep(novoStep);
  };

  const getGPS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permissão negada', 'Permita o acesso à localização.'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      Alert.alert('✅ GPS capturado', 'Localização registrada.');
    } catch { Alert.alert('Erro', 'Não foi possível capturar a localização.'); }
  };

  const salvarProgresso = async (silent = false) => {
    const payload = { itens, observacoes: obs, geolocation: location, progresso };
    dispatch(updateChecklist({ ...initial, ...payload }));
    await saveOfflineSingle(`checklist_${initial.id}`, { ...initial, ...payload });
    if (isOnline) { try { await api.put(`/checklists/${initial.id}`, payload); } catch {} }
    else dispatch(addPendingSync({ id: initial.id, ...payload }));
    if (!silent) Alert.alert('💾 Salvo', isOnline ? 'Progresso sincronizado.' : 'Salvo offline.');
  };

  const handleConcluir = () => {
    setShowConclusion(true);
  };

  const handleSignaturesComplete = async (sig1: string, sig2: string | null) => {
    setShowSignature(false);
    setSaving(true);
    const payload = {
      itens, observacoes: obs, geolocation: location, progresso: 100,
      status: 'concluido',
      assinatura: initial.responsavel || '',
      assinaturaData: sig1,
      assinaturaAcompanhante: initial.acompanhante || null,
      assinaturaAcompanhanteData: sig2,
      data_conclusao: new Date().toISOString(),
      conformidade,
    };
    const updated = { ...initial, ...payload };
    dispatch(updateChecklist(updated));
    await saveOfflineSingle(`checklist_${initial.id}`, updated);
    if (isOnline) {
      try {
        await api.put(`/checklists/${initial.id}`, payload);
        await api.post(`/checklists/${initial.id}/concluir`, payload);
      } catch { dispatch(addPendingSync({ id: initial.id, action: 'concluir', ...payload })); }
    } else {
      dispatch(addPendingSync({ id: initial.id, action: 'concluir', ...payload }));
    }
    setSaving(false);

    Alert.alert(
      '✅ Inspeção Finalizada!',
      `Conformidade: ${conformidade}%\n${sig2 ? 'Assinaturas coletadas: inspetor + acompanhante' : 'Assinatura do inspetor coletada'}`,
      [
        {
          text: 'Gerar Relatório PDF', onPress: async () => {
            try { await api.post(`/checklists/${initial.id}/pdf`); Alert.alert('📄 Relatório gerado!', 'O PDF foi gerado com sucesso.'); } catch { Alert.alert('Relatório', 'Será gerado quando sincronizado.'); }
            navigation.goBack();
          }
        },
        { text: 'Concluir', onPress: () => navigation.goBack() },
      ]
    );
  };

  const isLastStep = step === LAST_STEP;

  // ─── NR label por grupo ───────────────────────────────────────────────────
  const normaDoGrupo = grupoAtual ? (grupoAtual as any)._norma || '' : '';

  return (
    <SafeAreaView style={w.safe} edges={['bottom']}>

      {/* ── Barra de progresso ── */}
      <View style={w.topBar}>
        <View style={w.stepsRow}>
          {Array.from({ length: totalSteps }).map((_, i) => {
            const done = i < step;
            const cur = i === step;
            return (
              <React.Fragment key={i}>
                <TouchableOpacity onPress={() => irPara(i)}
                  style={[w.dot, done && w.dotDone, cur && w.dotCur, i === LAST_STEP && !done && !cur && w.dotFin]}>
                  {done
                    ? <Svg width={10} height={10} viewBox="0 0 24 24" fill="none"><Polyline points="20 6 9 17 4 12" stroke={C.white} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>
                    : <Text style={[w.dotNum, cur && { color: C.primary }]}>{i + 1}</Text>
                  }
                </TouchableOpacity>
                {i < totalSteps - 1 && <View style={[w.line, i < step && w.lineDone]} />}
              </React.Fragment>
            );
          })}
        </View>
        <View style={w.progRow}>
          <View style={w.progBg}><View style={[w.progFill, { width: `${(step / Math.max(LAST_STEP, 1)) * 100}%` }]} /></View>
          <Text style={w.progTxt}>{isLastStep ? 'Finalização' : `${step + 1}/${totalSteps}`} · {progresso}% respondido</Text>
        </View>
      </View>

      {/* ── Header do grupo ── */}
      {grupoAtual ? (
        <View style={w.groupHeader}>
          <View style={w.groupHeaderLeft}>
            {normaDoGrupo ? <View style={w.nrTag}><Text style={w.nrTagTxt}>{normaDoGrupo}</Text></View> : null}
            <Text style={w.groupTitle}>{grupoAtual.titulo.replace(/^NR-\d+\s*—\s*/, '')}</Text>
            <Text style={w.groupDesc}>{grupoAtual.descricao}</Text>
          </View>
          <View style={[w.groupCount, respondidos === itensDoGrupo.length && itensDoGrupo.length > 0 && w.groupCountDone]}>
            <Text style={[w.groupCountTxt, respondidos === itensDoGrupo.length && itensDoGrupo.length > 0 && { color: C.successDark }]}>
              {respondidos}/{itensDoGrupo.length}
            </Text>
          </View>
        </View>
      ) : (
        <View style={w.groupHeader}>
          <View style={w.groupHeaderLeft}>
            <Text style={w.groupTitle}>Finalização da Inspeção</Text>
            <Text style={w.groupDesc}>Observações gerais e localização</Text>
          </View>
          <View style={[w.groupCount, { backgroundColor: C.infoBg }]}>
            <Text style={[w.groupCountTxt, { color: C.infoDark }]}>{conformidade}%</Text>
          </View>
        </View>
      )}

      {/* ── Conteúdo ── */}
      <Animated.View style={[{ flex: 1 }, { transform: [{ translateX: slideAnim }] }]}>
        {grupoAtual ? (
          <ScrollView contentContainerStyle={w.itemsScroll} showsVerticalScrollIndicator={false}>
            {itensDoGrupo.map(item => (
              <ItemCard key={item.id} item={item}
                onToggle={v => updateItem(item.id, { conforme: v })}
                onObservacao={t => updateItem(item.id, { observacao: t })}
                onFoto={uri => updateItem(item.id, { foto: uri })}
              />
            ))}
            <View style={{ height: 100 }} />
          </ScrollView>
        ) : (
          <FinalizacaoStep obs={obs} onObs={setObs} location={location} onGPS={getGPS} />
        )}
      </Animated.View>

      {/* ── Navegação ── */}
      <View style={w.nav}>
        <TouchableOpacity style={[w.navBtn, step === 0 && { opacity: 0.3 }]} onPress={() => irPara(step - 1)} disabled={step === 0}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke={C.textPrimary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
          <Text style={w.navBtnTxt}>Anterior</Text>
        </TouchableOpacity>

        <TouchableOpacity style={w.saveQuickBtn} onPress={() => salvarProgresso(true)}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke={C.textSecondary} strokeWidth={1.8} />
            <Polyline points="17 21 17 13 7 13 7 21" stroke={C.textSecondary} strokeWidth={1.8} strokeLinejoin="round" fill="none" />
            <Polyline points="7 3 7 8 15 8" stroke={C.textSecondary} strokeWidth={1.8} strokeLinejoin="round" fill="none" />
          </Svg>
        </TouchableOpacity>

        {!isLastStep ? (
          <TouchableOpacity style={w.nextBtn} onPress={() => irPara(step + 1)}>
            <Text style={w.nextBtnTxt}>Próximo</Text>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M9 18l6-6-6-6" stroke={C.black} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </Svg>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={w.concludeBtn} onPress={handleConcluir} disabled={saving}>
            {saving
              ? <ActivityIndicator color={C.white} size="small" />
              : <>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Polyline points="20 6 9 17 4 12" stroke={C.white} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
                <Text style={w.concludeBtnTxt}>Concluir</Text>
              </>
            }
          </TouchableOpacity>
        )}
      </View>

      {/* ── Modals ── */}
      <ConclusionModal
        visible={showConclusion}
        checklist={{ ...initial, itens }}
        conformidade={conformidade}
        onSign={() => { setShowConclusion(false); setShowSignature(true); }}
        onCancel={() => setShowConclusion(false)}
      />

      <SignatureModal
        visible={showSignature}
        inspetorName={initial.responsavel || ''}
        acompanhante={initial.acompanhante || null}
        onComplete={handleSignaturesComplete}
        onCancel={() => setShowSignature(false)}
      />
    </SafeAreaView>
  );
}

const w = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  topBar: { backgroundColor: C.card, paddingHorizontal: S.md, paddingTop: S.sm, paddingBottom: S.xs, borderBottomWidth: 1, borderBottomColor: C.border },
  stepsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: S.xs },
  dot: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: C.success, borderColor: C.success },
  dotCur: { backgroundColor: C.black, borderColor: C.black },
  dotFin: { borderColor: C.info },
  dotNum: { fontSize: 9, fontWeight: '700', color: C.textTertiary },
  line: { flex: 1, height: 2, backgroundColor: C.border },
  lineDone: { backgroundColor: C.success },
  progRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.xs },
  progBg: { flex: 1, height: 3, backgroundColor: C.border, borderRadius: R.full, overflow: 'hidden' },
  progFill: { height: 3, backgroundColor: C.primary, borderRadius: R.full },
  progTxt: { fontSize: F.xs, color: C.textTertiary, fontWeight: '600', flexShrink: 0 },

  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.md, backgroundColor: C.black },
  groupHeaderLeft: { flex: 1 },
  nrTag: { backgroundColor: C.primary, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: S.xs },
  nrTagTxt: { fontSize: F.xs, fontWeight: '800', color: C.black },
  groupTitle: { fontSize: F.md, fontWeight: '800', color: C.white },
  groupDesc: { fontSize: F.xs, color: C.gray500, marginTop: 2 },
  groupCount: { backgroundColor: 'rgba(245,200,0,0.12)', borderRadius: R.lg, paddingHorizontal: S.sm, paddingVertical: S.xs, borderWidth: 1, borderColor: 'rgba(245,200,0,0.2)' },
  groupCountDone: { backgroundColor: C.successBg, borderColor: C.successBorder },
  groupCountTxt: { fontSize: F.sm, fontWeight: '800', color: C.primary },

  itemsScroll: { padding: S.md },

  nav: { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.md, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: S.xs, paddingVertical: S.sm, paddingHorizontal: S.md, borderRadius: R.lg, borderWidth: 1, borderColor: C.border },
  navBtnTxt: { fontSize: F.sm, fontWeight: '600', color: C.textPrimary },
  saveQuickBtn: { width: 42, height: 42, borderRadius: R.lg, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  nextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.xs, paddingVertical: S.sm + 2, borderRadius: R.lg, backgroundColor: C.primary, ...Sh.colored },
  nextBtnTxt: { fontSize: F.sm, fontWeight: '800', color: C.black },
  concludeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.xs, paddingVertical: S.sm + 2, borderRadius: R.lg, backgroundColor: C.success, ...Sh.md },
  concludeBtnTxt: { fontSize: F.sm, fontWeight: '800', color: C.white },
});
