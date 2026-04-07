import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';
import { updateChecklist, addPendingSync, RootState } from '../store';
import api, { saveOfflineSingle } from '../services/api';
import { C, S, R, F, Sh } from '../theme';

export default function ChecklistDetailScreen({ route, navigation }: any) {
  const { checklist: initial } = route.params;
  const dispatch = useDispatch();
  const isOnline = useSelector((s: RootState) => s.app.isOnline);

  const [itens, setItens] = useState<any[]>(initial.itens || []);
  const [obs, setObs] = useState(initial.observacoes || '');
  const [assinatura, setAssinatura] = useState(initial.assinatura || '');
  const [fotos, setFotos] = useState<string[]>(initial.fotos || []);
  const [location, setLocation] = useState<any>(initial.geolocation || null);
  const [saving, setSaving] = useState(false);
  const [concluding, setConcluding] = useState(false);

  const conforme = itens.filter((i) => i.conforme).length;
  const total = itens.length;
  const progresso = total > 0 ? Math.round((conforme / total) * 100) : 0;
  const criticos = itens.filter((i) => i.critico && !i.conforme).length;

  const toggleItem = useCallback((idx: number) => {
    setItens((prev) => {
      const novo = [...prev];
      novo[idx] = { ...novo[idx], conforme: !novo[idx].conforme };
      return novo;
    });
  }, []);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão negada', 'Permita o acesso à câmera nas configurações.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) setFotos((f) => [...f, result.assets[0].uri]);
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) setFotos((f) => [...f, result.assets[0].uri]);
  };

  const getGPS = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão negada', 'Permita o acesso à localização.'); return; }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const geo = { lat: loc.coords.latitude, lng: loc.coords.longitude, accuracy: loc.coords.accuracy };
    setLocation(geo);
    Alert.alert('✅ GPS Capturado', `Lat: ${geo.lat.toFixed(5)}\nLng: ${geo.lng.toFixed(5)}`);
  };

  const buildPayload = () => ({
    itens,
    observacoes: obs,
    assinatura: assinatura.trim(),
    fotos,
    geolocation: location,
    progresso,
  });

  // ── SALVAR ─────────────────────────────────────────────────────────────────
  const salvar = async () => {
    setSaving(true);
    const payload = buildPayload();
    const updated = { ...initial, ...payload };

    // Sempre salva localmente primeiro
    dispatch(updateChecklist(updated));
    await saveOfflineSingle(`checklist_${initial.id}`, updated);

    if (isOnline) {
      try {
        await api.put(`/checklists/${initial.id}`, payload);
        Alert.alert('✅ Salvo', 'Progresso sincronizado com o servidor.');
      } catch {
        dispatch(addPendingSync({ id: initial.id, ...payload }));
        Alert.alert('💾 Salvo localmente', 'Sem conexão — sincronizará quando você reconectar.');
      }
    } else {
      dispatch(addPendingSync({ id: initial.id, ...payload }));
      Alert.alert('💾 Salvo localmente', 'Você está offline. Os dados serão sincronizados quando reconectar.');
    }
    setSaving(false);
  };

  // ── CONCLUIR ────────────────────────────────────────────────────────────────
  const concluir = async () => {
    if (!assinatura.trim()) {
      Alert.alert('Assinatura obrigatória', 'Informe o nome do responsável para concluir a inspeção.');
      return;
    }
    if (criticos > 0) {
      Alert.alert(
        `⚠️ ${criticos} item(s) crítico(s) não conforme`,
        'Existem itens críticos não marcados como conformes. Deseja concluir mesmo assim?',
        [
          { text: 'Revisar itens', style: 'cancel' },
          { text: 'Concluir assim mesmo', style: 'destructive', onPress: () => executarConclusao() },
        ]
      );
      return;
    }
    executarConclusao();
  };

  const executarConclusao = async () => {
    setConcluding(true);
    const payload = { ...buildPayload(), status: 'concluido', progresso: 100, data_conclusao: new Date().toISOString() };
    const updated = { ...initial, ...payload };

    // Salva localmente imediatamente
    dispatch(updateChecklist(updated));
    await saveOfflineSingle(`checklist_${initial.id}`, updated);

    if (isOnline) {
      try {
        await api.put(`/checklists/${initial.id}`, { ...buildPayload(), status: 'concluido' });
        await api.post(`/checklists/${initial.id}/concluir`, { assinatura: assinatura.trim(), geolocation: location });
        Alert.alert('✅ Inspeção Concluída!', 'A inspeção foi finalizada e sincronizada com sucesso.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } catch {
        // Backend falhou, mas localmente está salvo
        dispatch(addPendingSync({ id: initial.id, action: 'concluir', ...payload }));
        Alert.alert('✅ Concluído localmente', 'Inspeção marcada como concluída. Será sincronizada quando reconectar.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } else {
      dispatch(addPendingSync({ id: initial.id, action: 'concluir', ...payload }));
      Alert.alert('✅ Concluído offline', 'Inspeção finalizada e salva localmente. Sincronização pendente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
    setConcluding(false);
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Cabeçalho */}
        <View style={s.headerCard}>
          <View style={s.nrRow}>
            <View style={s.nrBadge}><Text style={s.nrTxt}>{initial.norma}</Text></View>
            {initial._pendingSync && (
              <View style={s.syncBadge}><Text style={s.syncTxt}>● Pendente sync</Text></View>
            )}
          </View>
          <Text style={s.title}>{initial.titulo}</Text>
          <Text style={s.meta}>📍 {initial.obra} · 👤 {initial.responsavel}</Text>
        </View>

        {/* Progresso */}
        <View style={s.progCard}>
          <View style={s.progTop}>
            <View>
              <Text style={s.progLabel}>PROGRESSO</Text>
              <Text style={s.progVal}>{progresso}%</Text>
            </View>
            <View style={s.progStats}>
              <View style={s.progStat}>
                <Text style={[s.progStatVal, { color: C.success }]}>{conforme}</Text>
                <Text style={s.progStatLabel}>conformes</Text>
              </View>
              <View style={s.progDivider} />
              <View style={s.progStat}>
                <Text style={[s.progStatVal, { color: C.danger }]}>{criticos}</Text>
                <Text style={s.progStatLabel}>críticos ⚠️</Text>
              </View>
              <View style={s.progDivider} />
              <View style={s.progStat}>
                <Text style={[s.progStatVal, { color: C.textTertiary }]}>{total}</Text>
                <Text style={s.progStatLabel}>total</Text>
              </View>
            </View>
          </View>
          <View style={s.progBg}>
            <View style={[s.progFill, { width: `${progresso}%`, backgroundColor: progresso === 100 ? C.success : C.primary }]} />
          </View>
        </View>

        {/* Itens */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Itens de Verificação</Text>
          {itens.length === 0 && <Text style={s.emptyTxt}>Nenhum item neste checklist.</Text>}
          {itens.map((item: any, idx: number) => (
            <TouchableOpacity
              key={idx}
              style={[s.itemRow, item.conforme && s.itemRowDone]}
              onPress={() => toggleItem(idx)}
              activeOpacity={0.7}
            >
              <View style={[s.checkbox, item.conforme && s.checkboxDone]}>
                {item.conforme && <Text style={s.checkmark}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.itemTxt, item.conforme && s.itemTxtDone]}>{item.texto}</Text>
                {item.critico && !item.conforme && (
                  <Text style={s.criticoLabel}>⚠️ Item crítico</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fotos */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Registro Fotográfico</Text>
          <View style={s.photoActions}>
            <TouchableOpacity style={s.photoBtn} onPress={takePhoto}>
              <Text style={s.photoBtnEmoji}>📷</Text>
              <Text style={s.photoBtnTxt}>Câmera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.photoBtn} onPress={pickPhoto}>
              <Text style={s.photoBtnEmoji}>🖼️</Text>
              <Text style={s.photoBtnTxt}>Galeria</Text>
            </TouchableOpacity>
          </View>
          {fotos.length > 0 && (
            <View style={s.photoGrid}>
              {fotos.map((uri, i) => (
                <View key={i} style={s.photoWrap}>
                  <Image source={{ uri }} style={s.photo} />
                  <TouchableOpacity style={s.photoRemove} onPress={() => setFotos(fotos.filter((_, fi) => fi !== i))}>
                    <Text style={s.photoRemoveTxt}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* GPS */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Localização GPS</Text>
          <TouchableOpacity style={[s.gpsBtn, location && s.gpsBtnActive]} onPress={getGPS}>
            <Text style={s.gpsEmoji}>📍</Text>
            <Text style={[s.gpsTxt, location && { color: C.success }]}>
              {location ? `${location.lat?.toFixed(5)}, ${location.lng?.toFixed(5)}` : 'Capturar localização atual'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Observações */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Observações</Text>
          <TextInput
            style={s.textArea}
            value={obs}
            onChangeText={setObs}
            placeholder="Descreva observações, anomalias encontradas, ações tomadas..."
            placeholderTextColor={C.textTertiary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* Assinatura */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Assinatura do Responsável *</Text>
          <TextInput
            style={[s.input, !assinatura && s.inputEmpty]}
            value={assinatura}
            onChangeText={setAssinatura}
            placeholder="Nome completo do responsável pela inspeção"
            placeholderTextColor={C.textTertiary}
          />
          <Text style={s.assinaturaHint}>Obrigatório para concluir a inspeção</Text>
        </View>

        {/* Botões */}
        <TouchableOpacity style={s.saveBtn} onPress={salvar} disabled={saving}>
          {saving ? <ActivityIndicator color={C.black} /> : (
            <>
              <Text style={s.saveBtnEmoji}>💾</Text>
              <Text style={s.saveBtnTxt}>Salvar Progresso</Text>
            </>
          )}
        </TouchableOpacity>

        {initial.status !== 'concluido' && (
          <TouchableOpacity style={s.concludeBtn} onPress={concluir} disabled={concluding}>
            {concluding ? <ActivityIndicator color={C.white} /> : (
              <>
                <Text style={s.concludeBtnEmoji}>✅</Text>
                <Text style={s.concludeBtnTxt}>Concluir Inspeção</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {initial.status === 'concluido' && (
          <View style={s.concludedBanner}>
            <Text style={s.concludedTxt}>✅ Inspeção concluída</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: S.md, paddingBottom: 120 },

  headerCard: { backgroundColor: C.black, borderRadius: R.xxl, padding: S.lg, marginBottom: S.md },
  nrRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.sm },
  nrBadge: { backgroundColor: C.primary, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 3 },
  nrTxt: { fontSize: F.xs, fontWeight: '800', color: C.black },
  syncBadge: { backgroundColor: 'rgba(255,159,10,0.2)', borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 3 },
  syncTxt: { fontSize: F.xs, fontWeight: '700', color: C.warning },
  title: { fontSize: F.lg, fontWeight: '800', color: C.white, marginBottom: S.xs },
  meta: { fontSize: F.xs, color: C.gray500 },

  progCard: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, marginBottom: S.md, ...Sh.sm },
  progTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.md },
  progLabel: { fontSize: F.xs, color: C.textTertiary, fontWeight: '700', letterSpacing: 1.5 },
  progVal: { fontSize: 36, fontWeight: '900', color: C.primary },
  progStats: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  progStat: { alignItems: 'center' },
  progStatVal: { fontSize: F.xl, fontWeight: '800' },
  progStatLabel: { fontSize: F.xs, color: C.textTertiary },
  progDivider: { width: 1, height: 30, backgroundColor: C.border },
  progBg: { height: 8, backgroundColor: C.gray200, borderRadius: R.full, overflow: 'hidden' },
  progFill: { height: 8, borderRadius: R.full },

  section: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, marginBottom: S.md, ...Sh.xs },
  sectionTitle: { fontSize: F.md, fontWeight: '800', color: C.textPrimary, marginBottom: S.md },

  itemRow: { flexDirection: 'row', gap: S.sm, paddingVertical: S.sm, borderBottomWidth: 1, borderBottomColor: C.divider, alignItems: 'flex-start' },
  itemRowDone: { opacity: 0.6 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: C.gray300, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxDone: { backgroundColor: C.success, borderColor: C.success },
  checkmark: { color: C.white, fontSize: F.sm, fontWeight: '900' },
  itemTxt: { fontSize: F.sm, color: C.textPrimary, flex: 1, lineHeight: 20 },
  itemTxtDone: { textDecorationLine: 'line-through', color: C.textTertiary },
  criticoLabel: { fontSize: F.xs, color: C.danger, fontWeight: '700', marginTop: 2 },
  emptyTxt: { color: C.textTertiary, textAlign: 'center', paddingVertical: S.md },

  photoActions: { flexDirection: 'row', gap: S.sm, marginBottom: S.sm },
  photoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.xs, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: S.sm, borderStyle: 'dashed' },
  photoBtnEmoji: { fontSize: F.lg },
  photoBtnTxt: { fontSize: F.sm, color: C.textSecondary, fontWeight: '600' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  photoWrap: { position: 'relative' },
  photo: { width: 80, height: 80, borderRadius: R.md },
  photoRemove: { position: 'absolute', top: -6, right: -6, backgroundColor: C.danger, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  photoRemoveTxt: { color: C.white, fontSize: 10, fontWeight: '800' },

  gpsBtn: { flexDirection: 'row', alignItems: 'center', gap: S.sm, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: S.md },
  gpsBtnActive: { borderColor: C.success, backgroundColor: C.successBg },
  gpsEmoji: { fontSize: F.lg },
  gpsTxt: { fontSize: F.sm, color: C.textSecondary, flex: 1 },

  textArea: { borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: S.md, fontSize: F.sm, color: C.textPrimary, minHeight: 110, backgroundColor: C.bg },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: S.md, fontSize: F.sm, color: C.textPrimary, backgroundColor: C.bg },
  inputEmpty: { borderColor: C.dangerBorder },
  assinaturaHint: { fontSize: F.xs, color: C.textTertiary, marginTop: S.xs },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, backgroundColor: C.primary, borderRadius: R.xl, padding: S.md, marginBottom: S.sm, ...Sh.colored },
  saveBtnEmoji: { fontSize: F.lg },
  saveBtnTxt: { fontWeight: '800', fontSize: F.md, color: C.black },

  concludeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, backgroundColor: C.success, borderRadius: R.xl, padding: S.md, ...Sh.md },
  concludeBtnEmoji: { fontSize: F.lg },
  concludeBtnTxt: { fontWeight: '800', fontSize: F.md, color: C.white },

  concludedBanner: { backgroundColor: C.successBg, borderRadius: R.xl, padding: S.md, alignItems: 'center', borderWidth: 1, borderColor: C.successBorder },
  concludedTxt: { color: C.successDark, fontWeight: '800', fontSize: F.md },
});
