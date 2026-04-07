import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, StatusBar, TextInput, Modal } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, toggleItem, setItemNota } from '../store';
import { checklistApi } from '../services/api';
import { C, S, R, F, Sh } from '../theme';

export default function ChecklistDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const dispatch = useDispatch();
  const checklist = useSelector((s: RootState) => s.checklists.items.find(c => c.id === id));
  const [loading, setLoading] = useState(false);
  const [notaModal, setNotaModal] = useState<{open:boolean;itemId:string;value:string}>({open:false,itemId:'',value:''});

  const handleToggle = useCallback((itemId: string) => {
    dispatch(toggleItem({ checklistId: id, itemId }));
  }, [id]);

  const saveNota = () => {
    dispatch(setItemNota({ checklistId: id, itemId: notaModal.itemId, nota: notaModal.value }));
    setNotaModal({ open: false, itemId: '', value: '' });
  };

  const handleConcluir = async () => {
    if (!checklist) return;
    const faltando = checklist.itens.filter(i => i.obrigatorio && !i.checked).length;
    if (faltando > 0) {
      Alert.alert('Itens obrigatórios', `Complete os ${faltando} itens obrigatórios antes de concluir.`);
      return;
    }
    Alert.alert('Concluir inspeção?', 'Gera relatório PDF automaticamente.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Concluir', onPress: async () => {
        setLoading(true);
        try {
          await checklistApi.concluir(id, { itens: checklist.itens });
          Alert.alert('✅ Inspeção concluída!', 'Disponível em Relatórios.');
          navigation.goBack();
        } catch { Alert.alert('Erro', 'Verifique a conexão.'); }
        finally { setLoading(false); }
      }},
    ]);
  };

  if (!checklist) return (
    <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:C.offWhite}}>
      <Text style={{color:C.textMuted,marginBottom:16}}>Inspeção não encontrada.</Text>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{backgroundColor:C.yellow,borderRadius:R.full,paddingHorizontal:24,paddingVertical:10}}>
        <Text style={{fontWeight:'700',color:C.black}}>← Voltar</Text>
      </TouchableOpacity>
    </View>
  );

  const done = checklist.itens.filter(i => i.checked).length;
  const faltando = checklist.itens.filter(i => i.obrigatorio && !i.checked).length;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Voltar</Text></TouchableOpacity>
        <View style={s.normaBadge}><Text style={s.normaBadgeText}>{checklist.norma}</Text></View>
        <Text style={s.headerTitle} numberOfLines={2}>{checklist.titulo}</Text>
        <Text style={s.headerSub}>🏗 {checklist.obra}  👤 {checklist.responsavel}</Text>
        <View style={s.progressWrap}>
          <View style={s.progressBar}>
            <View style={[s.progressFill, {width:`${checklist.progresso}%` as any, backgroundColor:checklist.progresso===100?C.success:C.yellow}]} />
          </View>
          <Text style={s.progressText}>{done}/{checklist.itens.length} itens · {checklist.progresso}%</Text>
          {faltando > 0 && <Text style={s.faltandoText}>{faltando} obrigatório(s) pendente(s)</Text>}
        </View>
      </View>

      <ScrollView contentContainerStyle={{padding:S.lg, paddingBottom:120}}>
        {checklist.itens.map(item => (
          <View key={item.id} style={[s.item, item.checked && s.itemDone]}>
            <View style={s.itemRow}>
              <TouchableOpacity style={[s.checkbox, item.checked && s.checkboxDone]} onPress={() => handleToggle(item.id)}>
                {item.checked && <Text style={s.checkmark}>✓</Text>}
              </TouchableOpacity>
              <View style={{flex:1}}>
                <Text style={[s.itemLabel, item.checked && s.itemLabelDone]}>{item.label}</Text>
                <View style={{flexDirection:'row',gap:4,marginTop:4,flexWrap:'wrap'}}>
                  {item.obrigatorio && <View style={s.obrigTag}><Text style={s.obrigTagText}>Obrigatório</Text></View>}
                  {item.tipo==='foto' && <View style={s.fotoTag}><Text style={s.fotoTagText}>📷 Foto</Text></View>}
                </View>
              </View>
              <TouchableOpacity onPress={() => setNotaModal({open:true,itemId:item.id,value:item.nota||''})} style={{padding:4}}>
                <Text style={{fontSize:18}}>{item.nota ? '💬' : '💭'}</Text>
              </TouchableOpacity>
            </View>
            {item.nota ? <Text style={s.notaText}>"{item.nota}"</Text> : null}
          </View>
        ))}
      </ScrollView>

      <View style={s.footer}>
        {checklist.status !== 'concluido' ? (
          <TouchableOpacity style={[s.btnConcluir, faltando>0 && s.btnDisabled]} onPress={handleConcluir} disabled={loading}>
            {loading ? <ActivityIndicator color={C.black} /> : <Text style={s.btnConcluirText}>{faltando>0?`${faltando} obrigatório(s) pendente(s)`:'✅ Concluir Inspeção'}</Text>}
          </TouchableOpacity>
        ) : (
          <View style={s.concluidoBox}><Text style={s.concluidoText}>✅ Inspeção concluída</Text></View>
        )}
      </View>

      <Modal visible={notaModal.open} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Adicionar observação</Text>
            <TextInput style={s.modalInput} value={notaModal.value} onChangeText={v => setNotaModal(p => ({...p,value:v}))} placeholder="Descreva sua observação..." placeholderTextColor={C.textMuted} multiline numberOfLines={4} textAlignVertical="top" autoFocus />
            <View style={{flexDirection:'row',gap:S.md}}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setNotaModal({open:false,itemId:'',value:''})}>
                <Text style={{color:C.textSecondary,fontWeight:'600'}}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSave} onPress={saveNota}>
                <Text style={{color:C.black,fontWeight:'700'}}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:C.offWhite},
  header:{backgroundColor:C.black,paddingTop:52,paddingHorizontal:S.xl,paddingBottom:S.xl},
  back:{color:C.yellow,fontSize:F.sm,marginBottom:S.md},
  normaBadge:{backgroundColor:C.yellow,borderRadius:R.full,paddingHorizontal:S.md,paddingVertical:3,alignSelf:'flex-start',marginBottom:S.sm},
  normaBadgeText:{fontSize:F.xs,color:C.black,fontWeight:'700'},
  headerTitle:{fontSize:F.xl,color:'#fff',fontWeight:'700',marginBottom:4},
  headerSub:{fontSize:F.sm,color:'rgba(255,255,255,0.6)',marginBottom:S.lg},
  progressWrap:{gap:S.xs},
  progressBar:{height:8,backgroundColor:'rgba(255,255,255,0.2)',borderRadius:4,overflow:'hidden'},
  progressFill:{height:8,borderRadius:4},
  progressText:{fontSize:F.xs,color:'rgba(255,255,255,0.7)'},
  faltandoText:{fontSize:F.xs,color:C.danger},
  item:{backgroundColor:C.white,borderRadius:R.md,padding:S.md,marginBottom:S.sm,borderWidth:1.5,borderColor:C.border,...Sh.sm},
  itemDone:{borderColor:'#22863A40',backgroundColor:'#E6F4EA'},
  itemRow:{flexDirection:'row',alignItems:'flex-start',gap:S.md},
  checkbox:{width:26,height:26,borderRadius:R.sm,borderWidth:2,borderColor:C.borderStrong,alignItems:'center',justifyContent:'center',marginTop:2},
  checkboxDone:{backgroundColor:C.success,borderColor:C.success},
  checkmark:{color:'#fff',fontWeight:'900',fontSize:14},
  itemLabel:{fontSize:F.sm,color:C.textPrimary,lineHeight:20},
  itemLabelDone:{textDecorationLine:'line-through',color:C.textMuted},
  obrigTag:{backgroundColor:'#FDECEA',borderRadius:R.full,paddingHorizontal:6,paddingVertical:2},
  obrigTagText:{fontSize:9,color:C.danger,fontWeight:'700'},
  fotoTag:{backgroundColor:'#E3F2FD',borderRadius:R.full,paddingHorizontal:6,paddingVertical:2},
  fotoTagText:{fontSize:9,color:C.info,fontWeight:'700'},
  notaText:{fontSize:F.xs,color:C.textSecondary,fontStyle:'italic',marginTop:S.sm,paddingLeft:42,borderTopWidth:1,borderTopColor:C.border,paddingTop:S.sm},
  footer:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:C.white,borderTopWidth:1,borderTopColor:C.border,padding:S.lg},
  btnConcluir:{backgroundColor:C.yellow,borderRadius:R.full,padding:S.lg,alignItems:'center'},
  btnDisabled:{backgroundColor:C.surfaceAlt},
  btnConcluirText:{fontSize:F.base,fontWeight:'700',color:C.black},
  concluidoBox:{backgroundColor:'#E6F4EA',borderRadius:R.full,padding:S.lg,alignItems:'center',borderWidth:1,borderColor:'#22863A40'},
  concluidoText:{fontSize:F.base,fontWeight:'700',color:C.success},
  modalOverlay:{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'flex-end'},
  modalCard:{backgroundColor:C.white,borderTopLeftRadius:R.xl,borderTopRightRadius:R.xl,padding:S.xl,paddingBottom:40},
  modalTitle:{fontSize:F.lg,fontWeight:'700',color:C.textPrimary,marginBottom:S.lg},
  modalInput:{backgroundColor:C.surfaceAlt,borderRadius:R.md,padding:S.md,fontSize:F.md,color:C.textPrimary,minHeight:100,borderWidth:1,borderColor:C.border,marginBottom:S.lg},
  modalCancel:{flex:1,padding:S.md,borderRadius:R.full,borderWidth:1,borderColor:C.border,alignItems:'center'},
  modalSave:{flex:1,padding:S.md,borderRadius:R.full,backgroundColor:C.yellow,alignItems:'center'},
});
