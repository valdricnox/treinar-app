import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';
import { addIncident, RootState } from '../store';
import api from '../services/api';
import { C, S, R, F, Sh } from '../theme';

const SEVERIDADES = [
  { key: 'critico', label: '🔴 Crítico', bg: C.dangerBg, text: C.dangerDark, border: C.danger },
  { key: 'alto', label: '🟠 Alto', bg: C.warningBg, text: C.warningDark, border: C.warning },
  { key: 'medio', label: '🔵 Médio', bg: C.infoBg, text: C.infoDark, border: C.info },
  { key: 'baixo', label: '🟢 Baixo', bg: C.successBg, text: C.successDark, border: C.success },
];

const TIPOS = ['Acidente', 'Quase Acidente', 'Condição Insegura', 'Ato Inseguro', 'Doença Ocupacional', 'Outro'];

export default function NewIncidentScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [severidade, setSeveridade] = useState('medio');
  const [tipo, setTipo] = useState('');
  const [local, setLocal] = useState('');
  const [acao, setAcao] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão', 'Câmera não permitida.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) setFotos([...fotos, result.assets[0].uri]);
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) setFotos([...fotos, result.assets[0].uri]);
  };

  const getGPS = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão', 'Localização não permitida.'); return; }
    const loc = await Location.getCurrentPositionAsync({});
    setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    Alert.alert('GPS', 'Localização capturada com sucesso!');
  };

  const salvar = async () => {
    if (!titulo.trim() || !descricao.trim() || !local.trim() || !tipo) {
      Alert.alert('Atenção', 'Preencha título, descrição, tipo e local.');
      return;
    }
    setLoading(true);
    const payload = {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      severidade,
      tipo,
      local: local.trim(),
      obra: local.trim(),
      responsavel: user?.name,
      user_id: user?.id,
      acao: acao.trim(),
      fotos,
      geolocation: location,
      status: 'aberto',
    };
    try {
      const res = await api.post('/incidentes', payload);
      dispatch(addIncident(res.data?.incidente || { ...payload, id: Date.now(), data_criacao: new Date().toISOString() }));
      Alert.alert('Registrado!', 'Incidente registrado com sucesso.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.pageTitle}>Novo Incidente</Text>

        <View style={s.card}>
          <Text style={s.label}>Título *</Text>
          <TextInput style={s.input} value={titulo} onChangeText={setTitulo} placeholder="Descrição breve do incidente" placeholderTextColor={C.textMuted} />

          <Text style={s.label}>Severidade *</Text>
          <View style={s.sevGrid}>
            {SEVERIDADES.map((sev) => (
              <TouchableOpacity
                key={sev.key}
                style={[s.sevOption, { backgroundColor: sev.bg, borderColor: severidade === sev.key ? sev.border : C.border, borderWidth: severidade === sev.key ? 2 : 1 }]}
                onPress={() => setSeveridade(sev.key)}
              >
                <Text style={[s.sevTxt, { color: sev.text }]}>{sev.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Tipo *</Text>
          <View style={s.tipoGrid}>
            {TIPOS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[s.tipoChip, tipo === t && s.tipoChipActive]}
                onPress={() => setTipo(t)}
              >
                <Text style={[s.tipoChipTxt, tipo === t && s.tipoChipActiveTxt]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Local / Obra *</Text>
          <TextInput style={s.input} value={local} onChangeText={setLocal} placeholder="Local onde ocorreu" placeholderTextColor={C.textMuted} />

          <Text style={s.label}>Descrição Detalhada *</Text>
          <TextInput
            style={s.textArea} value={descricao} onChangeText={setDescricao}
            placeholder="Descreva o incidente com detalhes..." placeholderTextColor={C.textMuted}
            multiline numberOfLines={5}
          />

          <Text style={s.label}>Ação Corretiva</Text>
          <TextInput
            style={[s.textArea, { minHeight: 80 }]} value={acao} onChangeText={setAcao}
            placeholder="Descreva as ações corretivas tomadas..." placeholderTextColor={C.textMuted}
            multiline numberOfLines={3}
          />
        </View>

        <View style={s.card}>
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
            {fotos.map((uri, i) => <Image key={i} source={{ uri }} style={s.photoThumb} />)}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Localização GPS</Text>
          <TouchableOpacity style={s.gpsBtn} onPress={getGPS}>
            <Text style={s.gpsBtnTxt}>
              {location ? `✅ ${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)}` : '📍 Capturar Localização'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.btn} onPress={salvar} disabled={loading}>
          {loading ? <ActivityIndicator color={C.black} /> : <Text style={s.btnTxt}>⚠️ Registrar Incidente</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.offWhite },
  scroll: { padding: S.md, paddingBottom: S.xxl },
  pageTitle: { fontSize: F.xxl, fontWeight: '800', color: C.textPrimary, marginBottom: S.md },
  card: { backgroundColor: C.card, borderRadius: R.xl, padding: S.md, marginBottom: S.md, ...Sh.sm },
  label: { fontSize: F.sm, fontWeight: '600', color: C.textSecondary, marginBottom: S.xs, marginTop: S.sm },
  sectionTitle: { fontSize: F.md, fontWeight: '700', color: C.textPrimary, marginBottom: S.md },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: R.md, padding: S.md, fontSize: F.sm, color: C.textPrimary, backgroundColor: C.offWhite },
  textArea: { borderWidth: 1, borderColor: C.border, borderRadius: R.md, padding: S.md, fontSize: F.sm, color: C.textPrimary, minHeight: 120, textAlignVertical: 'top' },
  sevGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginBottom: S.xs },
  sevOption: { flex: 1, minWidth: '45%', borderRadius: R.md, padding: S.sm, alignItems: 'center' },
  sevTxt: { fontWeight: '700', fontSize: F.sm },
  tipoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.xs },
  tipoChip: { paddingHorizontal: S.sm, paddingVertical: S.xs, borderRadius: R.full, borderWidth: 1, borderColor: C.border, backgroundColor: C.offWhite },
  tipoChipActive: { backgroundColor: C.black, borderColor: C.black },
  tipoChipTxt: { fontSize: F.xs, color: C.textSecondary, fontWeight: '600' },
  tipoChipActiveTxt: { color: C.primary },
  photoRow: { flexDirection: 'row', gap: S.sm, marginBottom: S.sm },
  photoBtn: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: R.md, padding: S.sm, alignItems: 'center' },
  photoBtnTxt: { fontSize: F.sm, color: C.textSecondary },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  photoThumb: { width: 80, height: 80, borderRadius: R.md },
  gpsBtn: { borderWidth: 1, borderColor: C.border, borderRadius: R.md, padding: S.md, alignItems: 'center' },
  gpsBtnTxt: { fontSize: F.sm, color: C.textSecondary },
  btn: { backgroundColor: C.danger, borderRadius: R.lg, padding: S.md + 2, alignItems: 'center', ...Sh.sm },
  btnTxt: { fontWeight: '700', fontSize: F.md, color: C.white },
});
