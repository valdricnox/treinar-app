import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';
import { addIncident, addIncidentPendingSync, RootState } from '../store';
import api, { saveOffline } from '../services/api';
import { C, S, R, F, Sh } from '../theme';

const SEVERIDADES = [
  { key: 'critico', label: 'Crítico', emoji: '🔴', bg: C.dangerBg,  text: C.dangerDark,  border: C.danger },
  { key: 'alto',    label: 'Alto',    emoji: '🟠', bg: C.warningBg, text: C.warningDark, border: C.warning },
  { key: 'medio',   label: 'Médio',   emoji: '🔵', bg: C.infoBg,    text: C.infoDark,    border: C.info },
  { key: 'baixo',   label: 'Baixo',   emoji: '🟢', bg: C.successBg, text: C.successDark, border: C.success },
];

const TIPOS = [
  'Acidente com afastamento',
  'Acidente sem afastamento',
  'Quase Acidente',
  'Condição Insegura',
  'Ato Inseguro',
  'Doença Ocupacional',
  'Incidente Ambiental',
  'Outro',
];

export default function NewIncidentScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const isOnline = useSelector((s: RootState) => s.app.isOnline);

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
    if (status !== 'granted') { Alert.alert('Permissão negada', 'Permita o acesso à câmera.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.75 });
    if (!result.canceled && result.assets[0]) setFotos((f) => [...f, result.assets[0].uri]);
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.75 });
    if (!result.canceled && result.assets[0]) setFotos((f) => [...f, result.assets[0].uri]);
  };

  const getGPS = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão negada', 'Permita o acesso à localização.'); return; }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    Alert.alert('✅ GPS Capturado', `Localização registrada com sucesso.`);
  };

  const salvar = async () => {
    if (!titulo.trim())    { Alert.alert('Atenção', 'Informe o título do incidente.'); return; }
    if (!descricao.trim()) { Alert.alert('Atenção', 'Descreva o incidente.'); return; }
    if (!tipo)             { Alert.alert('Atenção', 'Selecione o tipo do incidente.'); return; }
    if (!local.trim())     { Alert.alert('Atenção', 'Informe o local do incidente.'); return; }

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
      data_criacao: new Date().toISOString(),
    };

    if (isOnline) {
      try {
        const res = await api.post('/incidentes', payload);
        const newItem = res.data?.incidente || { ...payload, id: Date.now() };
        dispatch(addIncident(newItem));
        Alert.alert('✅ Registrado!', 'Incidente registrado e sincronizado.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } catch {
        const offlineItem = { ...payload, id: `offline_inc_${Date.now()}`, _pendingSync: true };
        dispatch(addIncident(offlineItem));
        dispatch(addIncidentPendingSync(offlineItem));
        await saveOffline('pendingIncidents', offlineItem);
        Alert.alert('💾 Salvo offline', 'Incidente salvo localmente. Sincronizará ao reconectar.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } else {
      const offlineItem = { ...payload, id: `offline_inc_${Date.now()}`, _pendingSync: true };
      dispatch(addIncident(offlineItem));
      dispatch(addIncidentPendingSync(offlineItem));
      await saveOffline('pendingIncidents', offlineItem);
      Alert.alert('💾 Salvo offline', 'Você está sem conexão. Sincronizará quando reconectar.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
    setLoading(false);
  };

  const sevConf = SEVERIDADES.find((s) => s.key === severidade)!;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.pageTitle}>Registrar Incidente</Text>

        {/* Severidade */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Nível de Severidade</Text>
          <View style={s.sevGrid}>
            {SEVERIDADES.map((sev) => (
              <TouchableOpacity
                key={sev.key}
                style={[
                  s.sevOption,
                  { backgroundColor: sev.bg },
                  severidade === sev.key && { borderColor: sev.border, borderWidth: 2.5 },
                  severidade !== sev.key && { borderWidth: 1, borderColor: C.border },
                ]}
                onPress={() => setSeveridade(sev.key)}
              >
                <Text style={s.sevOptionEmoji}>{sev.emoji}</Text>
                <Text style={[s.sevOptionTxt, { color: sev.text }]}>{sev.label}</Text>
                {severidade === sev.key && <View style={[s.sevCheck, { backgroundColor: sev.border }]}><Text style={s.sevCheckTxt}>✓</Text></View>}
              </TouchableOpacity>
            ))}
          </View>
          {severidade === 'critico' && (
            <View style={s.critAlert}>
              <Text style={s.critAlertTxt}>🚨 Incidente crítico — notifique o responsável imediatamente!</Text>
            </View>
          )}
        </View>

        {/* Dados */}
        <View style={s.card}>
          <Text style={s.label}>TÍTULO *</Text>
          <TextInput style={s.input} value={titulo} onChangeText={setTitulo} placeholder="Descrição breve do incidente" placeholderTextColor={C.textTertiary} />

          <Text style={s.label}>TIPO *</Text>
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

          <Text style={s.label}>LOCAL / OBRA *</Text>
          <TextInput style={s.input} value={local} onChangeText={setLocal} placeholder="Onde ocorreu o incidente" placeholderTextColor={C.textTertiary} />

          <Text style={s.label}>DESCRIÇÃO DETALHADA *</Text>
          <TextInput
            style={s.textArea}
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Descreva o que aconteceu, como ocorreu, quem estava envolvido..."
            placeholderTextColor={C.textTertiary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <Text style={s.label}>AÇÃO CORRETIVA IMEDIATA</Text>
          <TextInput
            style={[s.textArea, { minHeight: 80 }]}
            value={acao}
            onChangeText={setAcao}
            placeholder="Que ação foi tomada imediatamente após o incidente?"
            placeholderTextColor={C.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Registro fotográfico */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Registro Fotográfico</Text>
          <Text style={s.sectionSub}>Fotografe o local e as evidências do incidente</Text>
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
        <View style={s.card}>
          <Text style={s.sectionTitle}>Localização GPS</Text>
          <TouchableOpacity style={[s.gpsBtn, location && s.gpsBtnActive]} onPress={getGPS}>
            <Text style={s.gpsEmoji}>📍</Text>
            <Text style={[s.gpsTxt, location && { color: C.success }]}>
              {location ? `✅ ${location.lat?.toFixed(5)}, ${location.lng?.toFixed(5)}` : 'Capturar localização do incidente'}
            </Text>
          </TouchableOpacity>
        </View>

        {!isOnline && (
          <View style={s.offlineNote}>
            <Text style={s.offlineNoteTxt}>📵 Offline — incidente será salvo localmente</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.btn, { backgroundColor: sevConf.border }, loading && { opacity: 0.7 }]}
          onPress={salvar}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={C.white} />
            : <Text style={[s.btnTxt, severidade === 'baixo' && { color: C.black }]}>
                {sevConf.emoji} Registrar Incidente {sevConf.label}
              </Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: S.md, paddingBottom: 100 },
  pageTitle: { fontSize: F.xxl, fontWeight: '800', color: C.textPrimary, marginBottom: S.md },

  card: { backgroundColor: C.card, borderRadius: R.xxl, padding: S.md, marginBottom: S.md, ...Sh.xs },
  sectionTitle: { fontSize: F.md, fontWeight: '800', color: C.textPrimary, marginBottom: S.xs },
  sectionSub: { fontSize: F.xs, color: C.textTertiary, marginBottom: S.md },
  label: { fontSize: F.xs, fontWeight: '700', color: C.textTertiary, letterSpacing: 1.5, marginBottom: S.xs, marginTop: S.sm },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: S.md, fontSize: F.sm, color: C.textPrimary, backgroundColor: C.bg },
  textArea: { borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: S.md, fontSize: F.sm, color: C.textPrimary, minHeight: 120, backgroundColor: C.bg },

  sevGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  sevOption: { flex: 1, minWidth: '45%', borderRadius: R.xl, padding: S.md, alignItems: 'center', gap: 4, position: 'relative' },
  sevOptionEmoji: { fontSize: 24 },
  sevOptionTxt: { fontWeight: '800', fontSize: F.sm },
  sevCheck: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  sevCheckTxt: { color: C.white, fontSize: 10, fontWeight: '900' },
  critAlert: { backgroundColor: C.dangerBg, borderRadius: R.lg, padding: S.sm, marginTop: S.sm, borderWidth: 1, borderColor: C.dangerBorder },
  critAlertTxt: { color: C.dangerDark, fontSize: F.xs, fontWeight: '700', textAlign: 'center' },

  tipoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.xs, marginBottom: S.sm },
  tipoChip: { paddingHorizontal: S.sm, paddingVertical: S.xs + 1, borderRadius: R.full, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  tipoChipActive: { backgroundColor: C.black, borderColor: C.black },
  tipoChipTxt: { fontSize: F.xs, color: C.textSecondary, fontWeight: '600' },
  tipoChipActiveTxt: { color: C.primary },

  photoActions: { flexDirection: 'row', gap: S.sm, marginBottom: S.sm },
  photoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.xs, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: S.sm, borderStyle: 'dashed' },
  photoBtnEmoji: { fontSize: F.lg },
  photoBtnTxt: { fontSize: F.sm, color: C.textSecondary, fontWeight: '600' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  photoWrap: { position: 'relative' },
  photo: { width: 90, height: 90, borderRadius: R.md },
  photoRemove: { position: 'absolute', top: -6, right: -6, backgroundColor: C.danger, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  photoRemoveTxt: { color: C.white, fontSize: 10, fontWeight: '900' },

  gpsBtn: { flexDirection: 'row', alignItems: 'center', gap: S.sm, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: S.md },
  gpsBtnActive: { borderColor: C.success, backgroundColor: C.successBg },
  gpsEmoji: { fontSize: F.lg },
  gpsTxt: { fontSize: F.sm, color: C.textSecondary, flex: 1 },

  offlineNote: { backgroundColor: C.warningBg, borderRadius: R.lg, padding: S.md, marginBottom: S.sm, borderWidth: 1, borderColor: C.warningBorder },
  offlineNoteTxt: { fontSize: F.xs, color: C.warningDark, textAlign: 'center', fontWeight: '600' },

  btn: { borderRadius: R.xl, padding: S.md + 2, alignItems: 'center', ...Sh.md },
  btnTxt: { fontWeight: '800', fontSize: F.md, color: C.white },
});
