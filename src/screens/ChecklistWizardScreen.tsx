import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';
import { updateChecklist, addPendingSync, RootState } from '../store';
import api, { saveOfflineSingle } from '../services/api';
import { NRGrupo, NRItem } from '../theme/nrTemplates';
import { C, S, R, F, Sh } from '../theme';

const { width: SW } = Dimensions.get('window');

// ─── Tela de um item individual ───────────────────────────────────────────────
const ItemCard = ({
  item, onToggle, onObservacao, onFoto,
}: {
  item: NRItem;
  onToggle: (conforme: boolean) => void;
  onObservacao: (text: string) => void;
  onFoto: (uri: string) => void;
}) => {
  const [showObs, setShowObs] = useState(!!item.observacao);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) onFoto(result.assets[0].uri);
  };

  return (
    <View style={[ic.card, item.conforme === false && ic.cardNao, item.conforme === true && ic.cardSim]}>
      <View style={ic.header}>
        {item.critico && item.conforme !== true && (
          <View style={ic.criticoBadge}><Text style={ic.criticoTxt}>⚠️ Crítico</Text></View>
        )}
        <Text style={ic.itemTxt}>{item.texto}</Text>
      </View>

      {/* Botões S/N/N-A */}
      <View style={ic.btns}>
        <TouchableOpacity
          style={[ic.btn, item.conforme === true && ic.btnSim]}
          onPress={() => onToggle(true)}
        >
          <Text style={[ic.btnTxt, item.conforme === true && ic.btnSimTxt]}>✓ Conforme</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[ic.btn, item.conforme === false && ic.btnNao]}
          onPress={() => onToggle(false)}
        >
          <Text style={[ic.btnTxt, item.conforme === false && ic.btnNaoTxt]}>✗ Não conforme</Text>
        </TouchableOpacity>
      </View>

      {/* Foto e observação por item */}
      <View style={ic.actions}>
        <TouchableOpacity style={ic.actionBtn} onPress={pickPhoto}>
          <Text style={ic.actionBtnTxt}>
            {item.foto ? '📷 1 foto' : '📷 Foto'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={ic.actionBtn} onPress={() => setShowObs(!showObs)}>
          <Text style={ic.actionBtnTxt}>💬 Observação</Text>
        </TouchableOpacity>
      </View>

      {item.foto && (
        <Image source={{ uri: item.foto }} style={ic.fotoThumb} />
      )}

      {showObs && (
        <TextInput
          style={ic.obs}
          value={item.observacao || ''}
          onChangeText={onObservacao}
          placeholder="Descreva a observação para este item..."
          placeholderTextColor={C.textTertiary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      )}
    </View>
  );
};

const ic = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: R.xl, padding: S.md, marginBottom: S.sm, borderWidth: 1.5, borderColor: C.border, ...Sh.xs },
  cardSim: { borderColor: C.successBorder, backgroundColor: '#F8FFFC' },
  cardNao: { borderColor: C.dangerBorder, backgroundColor: '#FFF8F8' },
  header: { marginBottom: S.sm },
  criticoBadge: { backgroundColor: C.dangerBg, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: S.xs },
  criticoTxt: { fontSize: F.xs, fontWeight: '700', color: C.dangerDark },
  itemTxt: { fontSize: F.sm, color: C.textPrimary, fontWeight: '500', lineHeight: 20 },
  btns: { flexDirection: 'row', gap: S.sm, marginBottom: S.sm },
  btn: { flex: 1, paddingVertical: S.sm, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', backgroundColor: C.bg },
  btnSim: { backgroundColor: C.successBg, borderColor: C.success },
  btnNao: { backgroundColor: C.dangerBg, borderColor: C.danger },
  btnTxt: { fontSize: F.sm, fontWeight: '700', color: C.textTertiary },
  btnSimTxt: { color: C.successDark },
  btnNaoTxt: { color: C.dangerDark },
  actions: { flexDirection: 'row', gap: S.sm },
  actionBtn: { flex: 1, paddingVertical: S.xs + 2, borderRadius: R.md, borderWidth: 1, borderColor: C.border, alignItems: 'center', backgroundColor: C.bg },
  actionBtnTxt: { fontSize: F.xs, color: C.textSecondary, fontWeight: '600' },
  fotoThumb: { width: 80, height: 80, borderRadius: R.md, marginTop: S.sm },
  obs: { marginTop: S.sm, borderWidth: 1, borderColor: C.border, borderRadius: R.md, padding: S.sm, fontSize: F.sm, color: C.textPrimary, minHeight: 70 },
});

// ─── Tela de assinatura (última etapa) ────────────────────────────────────────
const AssinaturaStep = ({
  assinatura, onAssinatura, location, onGPS, obs, onObs,
}: any) => (
  <ScrollView contentContainerStyle={as.scroll} showsVerticalScrollIndicator={false}>
    <View style={as.section}>
      <Text style={as.title}>Observações Gerais</Text>
      <TextInput
        style={as.textArea}
        value={obs}
        onChangeText={onObs}
        placeholder="Adicione observações gerais sobre a inspeção..."
        placeholderTextColor={C.textTertiary}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
    </View>

    <View style={as.section}>
      <Text style={as.title}>Localização GPS</Text>
      <TouchableOpacity style={[as.gpsBtn, location && as.gpsBtnDone]} onPress={onGPS}>
        <Text style={as.gpsEmoji}>📍</Text>
        <Text style={[as.gpsTxt, location && { color: C.successDark }]}>
          {location
            ? `✅  ${location.lat?.toFixed(5)}, ${location.lng?.toFixed(5)}`
            : 'Capturar localização atual'}
        </Text>
      </TouchableOpacity>
    </View>

    <View style={as.section}>
      <Text style={as.title}>Assinatura do Responsável *</Text>
      <Text style={as.subtitle}>Digite o nome completo para assinar digitalmente a inspeção</Text>
      <TextInput
        style={[as.assinaturaInput, !assinatura && as.assinaturaEmpty]}
        value={assinatura}
        onChangeText={onAssinatura}
        placeholder="Nome completo do responsável"
        placeholderTextColor={C.textTertiary}
        autoCapitalize="words"
      />
      {assinatura ? (
        <View style={as.assinaturaPreview}>
          <Text style={as.assinaturaLabel}>Assinado por:</Text>
          <Text style={as.assinaturaValor}>{assinatura}</Text>
        </View>
      ) : null}
    </View>
  </ScrollView>
);

const as = StyleSheet.create({
  scroll: { padding: S.md, paddingBottom: S.xxl },
  section: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, marginBottom: S.md, ...Sh.xs },
  title: { fontSize: F.md, fontWeight: '800', color: C.textPrimary, marginBottom: S.xs },
  subtitle: { fontSize: F.xs, color: C.textTertiary, marginBottom: S.md },
  textArea: { borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: S.md, fontSize: F.sm, color: C.textPrimary, minHeight: 100 },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', gap: S.sm, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: S.md },
  gpsBtnDone: { borderColor: C.success, backgroundColor: C.successBg },
  gpsEmoji: { fontSize: F.lg },
  gpsTxt: { fontSize: F.sm, color: C.textSecondary, flex: 1 },
  assinaturaInput: { borderWidth: 1.5, borderColor: C.border, borderRadius: R.lg, padding: S.md, fontSize: F.lg, color: C.textPrimary, fontWeight: '500' },
  assinaturaEmpty: { borderColor: C.dangerBorder },
  assinaturaPreview: { marginTop: S.sm, padding: S.sm, backgroundColor: C.successBg, borderRadius: R.md, borderWidth: 1, borderColor: C.successBorder },
  assinaturaLabel: { fontSize: F.xs, color: C.successDark, fontWeight: '700' },
  assinaturaValor: { fontSize: F.md, color: C.successDark, fontWeight: '600', fontStyle: 'italic' },
});

// ─── WIZARD PRINCIPAL ─────────────────────────────────────────────────────────
export default function ChecklistWizardScreen({ route, navigation }: any) {
  const { checklist: initial } = route.params;
  const dispatch = useDispatch();
  const isOnline = useSelector((s: RootState) => s.app.isOnline);

  const template = initial._template;
  const grupos: NRGrupo[] = template?.grupos || [];
  // Etapas: cada grupo de itens + 1 etapa final de assinatura
  const totalSteps = grupos.length + 1;
  const LAST_STEP = totalSteps - 1;

  const [step, setStep] = useState(0);
  const [itens, setItens] = useState<NRItem[]>(initial.itens || []);
  const [assinatura, setAssinatura] = useState(initial.assinatura || '');
  const [obs, setObs] = useState(initial.observacoes || '');
  const [location, setLocation] = useState<any>(initial.geolocation || null);
  const [saving, setSaving] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateStep = (direction: 1 | -1, cb: () => void) => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -30 * direction, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]).start();
    cb();
  };

  const updateItem = useCallback((itemId: string, changes: Partial<NRItem>) => {
    setItens(prev => prev.map(i => i.id === itemId ? { ...i, ...changes } : i));
  }, []);

  const grupoAtual: NRGrupo | null = step < grupos.length ? grupos[step] : null;
  const itensDoGrupo = grupoAtual
    ? itens.filter(i => grupoAtual.itens.some(gi => gi.id === i.id))
    : [];

  const respondidos = itensDoGrupo.filter(i => i.conforme !== null).length;
  const totalGrupo = itensDoGrupo.length;
  const grupoCompleto = respondidos === totalGrupo && totalGrupo > 0;

  const progresso = Math.round(
    (itens.filter(i => i.conforme !== null).length / Math.max(itens.length, 1)) * 100
  );
  const conformidade = Math.round(
    (itens.filter(i => i.conforme === true).length / Math.max(itens.length, 1)) * 100
  );

  const getGPS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permissão negada', 'Permita o acesso à localização.'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      Alert.alert('✅ GPS capturado', 'Localização registrada com sucesso.');
    } catch { Alert.alert('Erro', 'Não foi possível capturar a localização.'); }
  };

  const irPara = (novoStep: number) => {
    if (novoStep < 0 || novoStep >= totalSteps) return;
    animateStep(novoStep > step ? 1 : -1, () => setStep(novoStep));
  };

  const salvarProgresso = async (showAlert = true) => {
    const payload = { itens, observacoes: obs, assinatura, geolocation: location, progresso };
    const updated = { ...initial, ...payload };
    dispatch(updateChecklist(updated));
    await saveOfflineSingle(`checklist_${initial.id}`, updated);
    if (isOnline) {
      try { await api.put(`/checklists/${initial.id}`, payload); } catch {}
    } else {
      dispatch(addPendingSync({ id: initial.id, ...payload }));
    }
    if (showAlert) Alert.alert('💾 Salvo', isOnline ? 'Progresso sincronizado.' : 'Salvo offline.');
  };

  const concluir = async () => {
    if (!assinatura.trim()) {
      Alert.alert('Assinatura obrigatória', 'Informe o nome do responsável para concluir a inspeção.');
      return;
    }
    const criticos = itens.filter(i => i.critico && i.conforme === false).length;
    const naoRespondidos = itens.filter(i => i.conforme === null).length;

    const msgs: string[] = [];
    if (naoRespondidos > 0) msgs.push(`${naoRespondidos} item(s) sem resposta`);
    if (criticos > 0) msgs.push(`${criticos} item(s) crítico(s) não conforme`);

    if (msgs.length > 0) {
      Alert.alert('Atenção', msgs.join('\n') + '\n\nDeseja concluir mesmo assim?', [
        { text: 'Revisar', style: 'cancel' },
        { text: 'Concluir', style: 'destructive', onPress: executarConclusao },
      ]);
      return;
    }
    executarConclusao();
  };

  const executarConclusao = async () => {
    setSaving(true);
    const payload = {
      itens, observacoes: obs, assinatura: assinatura.trim(),
      geolocation: location, progresso: 100,
      status: 'concluido', data_conclusao: new Date().toISOString(),
      conformidade,
    };
    const updated = { ...initial, ...payload };
    dispatch(updateChecklist(updated));
    await saveOfflineSingle(`checklist_${initial.id}`, updated);

    if (isOnline) {
      try {
        await api.put(`/checklists/${initial.id}`, payload);
        await api.post(`/checklists/${initial.id}/concluir`, { assinatura: assinatura.trim(), geolocation: location });
      } catch {
        dispatch(addPendingSync({ id: initial.id, action: 'concluir', ...payload }));
      }
    } else {
      dispatch(addPendingSync({ id: initial.id, action: 'concluir', ...payload }));
    }
    setSaving(false);
    Alert.alert('✅ Inspeção Concluída!', `Conformidade: ${conformidade}%\n${itens.filter(i=>i.conforme===true).length} de ${itens.length} itens conformes.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  // ── Render ──
  const isLastStep = step === LAST_STEP;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>

      {/* ── Barra de progresso do wizard ── */}
      <View style={s.progressBar}>
        <View style={s.progressSteps}>
          {Array.from({ length: totalSteps }).map((_, i) => {
            const done = i < step;
            const current = i === step;
            const isLast = i === LAST_STEP;
            return (
              <React.Fragment key={i}>
                <TouchableOpacity
                  style={[s.stepDot, done && s.stepDotDone, current && s.stepDotCurrent, isLast && s.stepDotLast]}
                  onPress={() => irPara(i)}
                >
                  {done
                    ? <Text style={s.stepDotCheckmark}>✓</Text>
                    : <Text style={[s.stepDotNum, current && s.stepDotNumCurrent]}>{i + 1}</Text>
                  }
                </TouchableOpacity>
                {i < totalSteps - 1 && (
                  <View style={[s.stepLine, i < step && s.stepLineDone]} />
                )}
              </React.Fragment>
            );
          })}
        </View>
        <View style={s.progressFill}>
          <View style={[s.progressFilled, { width: `${(step / Math.max(LAST_STEP, 1)) * 100}%` }]} />
        </View>
        <Text style={s.progressTxt}>
          {isLastStep ? 'Finalização' : `Etapa ${step + 1} de ${totalSteps}`} · {progresso}% respondido
        </Text>
      </View>

      {/* ── Cabeçalho da etapa ── */}
      {grupoAtual ? (
        <View style={s.stepHeader}>
          <Text style={s.stepEmoji}>{grupoAtual.icone}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.stepTitle}>{grupoAtual.titulo}</Text>
            <Text style={s.stepDesc}>{grupoAtual.descricao}</Text>
          </View>
          <View style={[s.stepProgress, grupoCompleto && s.stepProgressDone]}>
            <Text style={[s.stepProgressTxt, grupoCompleto && s.stepProgressTxtDone]}>
              {respondidos}/{totalGrupo}
            </Text>
          </View>
        </View>
      ) : (
        <View style={s.stepHeader}>
          <Text style={s.stepEmoji}>✍️</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.stepTitle}>Finalização</Text>
            <Text style={s.stepDesc}>Observações, GPS e assinatura</Text>
          </View>
          <View style={[s.stepProgress, { backgroundColor: C.infoBg }]}>
            <Text style={[s.stepProgressTxt, { color: C.infoDark }]}>{conformidade}%</Text>
          </View>
        </View>
      )}

      {/* ── Conteúdo da etapa ── */}
      <Animated.View style={[{ flex: 1 }, { transform: [{ translateX: slideAnim }] }]}>
        {grupoAtual ? (
          <ScrollView contentContainerStyle={s.itemsScroll} showsVerticalScrollIndicator={false}>
            {itensDoGrupo.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onToggle={(conforme) => updateItem(item.id, { conforme })}
                onObservacao={(observacao) => updateItem(item.id, { observacao })}
                onFoto={(foto) => updateItem(item.id, { foto })}
              />
            ))}
            <View style={{ height: 120 }} />
          </ScrollView>
        ) : (
          <AssinaturaStep
            assinatura={assinatura}
            onAssinatura={setAssinatura}
            location={location}
            onGPS={getGPS}
            obs={obs}
            onObs={setObs}
          />
        )}
      </Animated.View>

      {/* ── Navegação inferior ── */}
      <View style={s.nav}>
        <TouchableOpacity
          style={[s.navBtn, step === 0 && s.navBtnDisabled]}
          onPress={() => irPara(step - 1)}
          disabled={step === 0}
        >
          <Text style={[s.navBtnTxt, step === 0 && s.navBtnTxtDisabled]}>← Anterior</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.saveBtn} onPress={() => salvarProgresso(true)}>
          <Text style={s.saveBtnTxt}>💾</Text>
        </TouchableOpacity>

        {!isLastStep ? (
          <TouchableOpacity style={s.nextBtn} onPress={() => irPara(step + 1)}>
            <Text style={s.nextBtnTxt}>Próximo →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.concludeBtn} onPress={concluir} disabled={saving}>
            {saving
              ? <ActivityIndicator color={C.white} size="small" />
              : <Text style={s.concludeBtnTxt}>✅ Concluir</Text>
            }
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  progressBar: { backgroundColor: C.card, paddingHorizontal: S.md, paddingTop: S.sm, paddingBottom: S.xs, borderBottomWidth: 1, borderBottomColor: C.border },
  progressSteps: { flexDirection: 'row', alignItems: 'center', marginBottom: S.xs },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  stepDotDone: { backgroundColor: C.success, borderColor: C.success },
  stepDotCurrent: { backgroundColor: C.black, borderColor: C.black },
  stepDotLast: { borderColor: C.info },
  stepDotCheckmark: { fontSize: 12, color: C.white, fontWeight: '900' },
  stepDotNum: { fontSize: 10, color: C.textTertiary, fontWeight: '700' },
  stepDotNumCurrent: { color: C.primary },
  stepLine: { flex: 1, height: 2, backgroundColor: C.border },
  stepLineDone: { backgroundColor: C.success },
  progressFill: { height: 3, backgroundColor: C.border, borderRadius: R.full, overflow: 'hidden', marginBottom: S.xs },
  progressFilled: { height: 3, backgroundColor: C.primary, borderRadius: R.full },
  progressTxt: { fontSize: F.xs, color: C.textTertiary, fontWeight: '600', marginBottom: S.xs },

  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.md, backgroundColor: C.black },
  stepEmoji: { fontSize: 28 },
  stepTitle: { fontSize: F.md, fontWeight: '800', color: C.white },
  stepDesc: { fontSize: F.xs, color: C.gray500, marginTop: 2 },
  stepProgress: { backgroundColor: 'rgba(245,200,0,0.15)', borderRadius: R.lg, paddingHorizontal: S.sm, paddingVertical: S.xs, borderWidth: 1, borderColor: 'rgba(245,200,0,0.3)' },
  stepProgressDone: { backgroundColor: C.successBg, borderColor: C.successBorder },
  stepProgressTxt: { fontSize: F.sm, fontWeight: '800', color: C.primary },
  stepProgressTxtDone: { color: C.successDark },

  itemsScroll: { padding: S.md },

  nav: { flexDirection: 'row', alignItems: 'center', padding: S.md, gap: S.sm, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border },
  navBtn: { flex: 1, paddingVertical: S.sm + 2, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  navBtnDisabled: { opacity: 0.3 },
  navBtnTxt: { fontSize: F.sm, fontWeight: '700', color: C.textPrimary },
  navBtnTxtDisabled: { color: C.textTertiary },
  saveBtn: { width: 44, height: 44, borderRadius: R.lg, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  saveBtnTxt: { fontSize: F.lg },
  nextBtn: { flex: 1, paddingVertical: S.sm + 2, borderRadius: R.lg, backgroundColor: C.primary, alignItems: 'center', ...Sh.colored },
  nextBtnTxt: { fontSize: F.sm, fontWeight: '800', color: C.black },
  concludeBtn: { flex: 1, paddingVertical: S.sm + 2, borderRadius: R.lg, backgroundColor: C.success, alignItems: 'center', ...Sh.md },
  concludeBtnTxt: { fontSize: F.sm, fontWeight: '800', color: C.white },
});
