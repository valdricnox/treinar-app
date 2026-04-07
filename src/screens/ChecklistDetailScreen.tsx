import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useDispatch } from 'react-redux';
import { updateChecklist } from '../store';
import api from '../services/api';
import { C, S, R, F, Sh } from '../theme';

export default function ChecklistDetailScreen({ route, navigation }: any) {
  const { checklist } = route.params;
  const dispatch = useDispatch();
  const [itens, setItens] = useState<any[]>(checklist.itens || []);
  const [obs, setObs] = useState(checklist.observacoes || '');
  const [assinatura, setAssinatura] = useState(checklist.assinatura || '');
  const [fotos, setFotos] = useState<string[]>(checklist.fotos || []);
  const [location, setLocation] = useState<any>(checklist.geolocation || null);
  const [saving, setSaving] = useState(false);
  const [concluding, setConcluding] = useState(false);

  const toggleItem = (idx: number) => {
    const novo = [...itens];
    novo[idx] = { ...novo[idx], conforme: !novo[idx].conforme };
    setItens(novo);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão', 'Câmera não permitida.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: false });
    if (!result.canceled && result.assets[0]) setFotos([...fotos, result.assets[0].uri]);
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsMultipleSelection: false });
    if (!result.canceled && result.assets[0]) setFotos([...fotos, result.assets[0].uri]);
  };

  const getGPS = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão', 'Localização não permitida.'); return; }
    const loc = await Location.getCurrentPositionAsync({});
    setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    Alert.alert('GPS', `Localização capturada:\n${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
  };

  const progresso = itens.length > 0 ? Math.round((itens.filter((i) => i.conforme).length / itens.length) * 100) : 0;

  const salvar = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/checklists/${checklist.id}`, { itens, observacoes: obs, assinatura, geolocation: location, progresso });
      dispatch(updateChecklist(res.data?.checklist || { ...checklist, itens, progresso }));
      Alert.alert('Salvo', 'Checklist atualizado com sucesso!');
    } catch { Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.'); }
    finally { setSaving(false); }
  };

  const concluir = async () => {
    if (!assinatura.trim()) { Alert.alert('Atenção', 'Informe o nome do responsável para concluir.'); return; }
    Alert.alert('Concluir Inspeção', 'Tem certeza que deseja concluir esta inspeção?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Concluir', style: 'default', onPress: async () => {
          setConcluding(true);
          try {
            await api.post(`/checklists/${checklist.id}/concluir`, { assinatura, geolocation: location });
            dispatch(updateChecklist({ ...checklist, status: 'concluido', progresso: 100 }));
            Alert.alert('Concluído!', 'Inspeção finalizada com sucesso.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
          } catch { Alert.alert('Erro', 'Não foi possível concluir.'); }
          finally { setConcluding(false); }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.titleBox}>
          <Text style={s.title}>{checklist.titulo}</Text>
          <View style={s.metaRow}>
            <View style={s.nrBadge}><Text style={s.nrTxt}>{checklist.norma}</Text></View>
            <Text style={s.meta}>📍 {checklist.obra}</Text>
          </View>
        </View>

        <View style={s.progBox}>
          <Text style={s.progLabel}>Progresso</Text>
          <Text style={s.progVal}>{progresso}%</Text>
          <View style={s.progBg}>
            <View style={[s.progFill, { width: `${progresso}%` }]} />
          </View>
          <Text style={s.progSub}>{itens.filter((i) => i.conforme).length} de {itens.length} itens conformes</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Itens de Verificação</Text>
          {itens.map((item: any, idx: number) => (
            <TouchableOpacity key={idx} style={s.itemRow} onPress={() => toggleItem(idx)}>
              <View style={[s.checkbox, item.conforme && s.checkboxActive]}>
                {item.conforme && <Text style={s.checkmark}>✓</Text>}
              </View>
              <Text style={[s.itemTxt, item.conforme && s.itemTxtDone]}>{item.texto || item.descricao}</Text>
            </TouchableOpacity>
          ))}
          {itens.length === 0 && <Text style={s.empty}>Nenhum item neste checklist.</Text>}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Observações</Text>
          <TextInput
            style={s.textArea}
            value={obs}
            onChangeText={setObs}
            placeholder="Descreva observações relevantes..."
            placeholderTextColor={C.textMuted}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Fotos</Text>
          <View style={s.photoRow}>
            <TouchableOpacity style={s.photoBtn} onPress={takePhoto}>
              <Text style={s.photoBtnTxt}>📷 Câmera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.photoBtn} onPress={pickPhoto}>
              <Text style={s.photoBtnTxt}>🖼 Galeria</Text>
            </TouchableOpacity>
          </View>
          <View style={s.photoGrid}>
            {fotos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={s.photoThumb} />
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Localização GPS</Text>
          <TouchableOpacity style={s.gpsBtn} onPress={getGPS}>
            <Text style={s.gpsBtnTxt}>📍 {location ? `${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)}` : 'Capturar Localização'}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Assinatura do Responsável</Text>
          <TextInput
            style={s.input}
            value={assinatura}
            onChangeText={setAssinatura}
            placeholder="Nome completo do responsável"
            placeholderTextColor={C.textMuted}
          />
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={salvar} disabled={saving}>
          {saving ? <ActivityIndicator color={C.black} /> : <Text style={s.saveBtnTxt}>💾 Salvar Progresso</Text>}
        </TouchableOpacity>

        {checklist.status !== 'concluido' && (
          <TouchableOpacity style={s.concludeBtn} onPress={concluir} disabled={concluding}>
            {concluding ? <ActivityIndicator color={C.white} /> : <Text style={s.concludeBtnTxt}>✅ Concluir Inspeção</Text>}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.offWhite },
  scroll: { padding: S.md, paddingBottom: S.xxl },
  titleBox: { backgroundColor: C.black, borderRadius: R.xl, padding: S.md, marginBottom: S.md },
  title: { fontSize: F.lg, fontWeight: '700', color: C.white, marginBottom: S.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  nrBadge: { backgroundColor: C.primary, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 2 },
  nrTxt: { fontSize: F.xs, fontWeight: '700', color: C.black },
  meta: { fontSize: F.xs, color: C.textMuted },
  progBox: { backgroundColor: C.card, borderRadius: R.xl, padding: S.md, marginBottom: S.md, ...Sh.sm },
  progLabel: { fontSize: F.sm, color: C.textSecondary },
  progVal: { fontSize: 36, fontWeight: '800', color: C.primary },
  progBg: { height: 10, backgroundColor: C.border, borderRadius: R.full, overflow: 'hidden', marginVertical: S.sm },
  progFill: { height: 10, backgroundColor: C.primary, borderRadius: R.full },
  progSub: { fontSize: F.xs, color: C.textSecondary },
  section: { backgroundColor: C.card, borderRadius: R.xl, padding: S.md, marginBottom: S.md, ...Sh.sm },
  sectionTitle: { fontSize: F.md, fontWeight: '700', color: C.textPrimary, marginBottom: S.md },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, marginBottom: S.sm },
  checkbox: { width: 24, height: 24, borderRadius: R.sm, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: C.success, borderColor: C.success },
  checkmark: { color: C.white, fontSize: F.sm, fontWeight: '700' },
  itemTxt: { flex: 1, fontSize: F.sm, color: C.textPrimary },
  itemTxtDone: { textDecorationLine: 'line-through', color: C.textMuted },
  empty: { color: C.textMuted, textAlign: 'center' },
  textArea: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.md,
    padding: S.md, fontSize: F.sm, color: C.textPrimary, minHeight: 100, textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.md,
    padding: S.md, fontSize: F.sm, color: C.textPrimary,
  },
  photoRow: { flexDirection: 'row', gap: S.sm, marginBottom: S.sm },
  photoBtn: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: R.md, padding: S.sm, alignItems: 'center' },
  photoBtnTxt: { fontSize: F.sm, color: C.textSecondary },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  photoThumb: { width: 80, height: 80, borderRadius: R.md },
  gpsBtn: { borderWidth: 1, borderColor: C.border, borderRadius: R.md, padding: S.md, alignItems: 'center' },
  gpsBtnTxt: { fontSize: F.sm, color: C.textSecondary },
  saveBtn: { backgroundColor: C.primary, borderRadius: R.lg, padding: S.md, alignItems: 'center', marginBottom: S.sm, ...Sh.sm },
  saveBtnTxt: { fontWeight: '700', fontSize: F.md, color: C.black },
  concludeBtn: { backgroundColor: C.success, borderRadius: R.lg, padding: S.md, alignItems: 'center', ...Sh.sm },
  concludeBtnTxt: { fontWeight: '700', fontSize: F.md, color: C.white },
});
