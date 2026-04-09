import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, PanResponder, PanResponderGestureState,
  TouchableOpacity, Dimensions, Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { C, S, R, F, Sh } from '../theme';

interface Props {
  onSave: (pathData: string) => void;
  onClear?: () => void;
  label?: string;
  height?: number;
}

export default function SignatureCanvas({ onSave, onClear, label, height = 180 }: Props) {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [hasSignature, setHasSignature] = useState(false);
  const canvasRef = useRef<View>(null);
  const [canvasLayout, setCanvasLayout] = useState({ x: 0, y: 0 });

  const getRelativeCoords = (gx: number, gy: number) => ({
    x: gx - canvasLayout.x,
    y: gy - canvasLayout.y,
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        setCurrentPath(`M${locationX.toFixed(1)},${locationY.toFixed(1)}`);
        setHasSignature(true);
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        setCurrentPath(prev => `${prev} L${locationX.toFixed(1)},${locationY.toFixed(1)}`);
      },
      onPanResponderRelease: () => {
        setPaths(prev => [...prev, currentPath]);
        setCurrentPath('');
      },
    })
  ).current;

  const clear = () => {
    setPaths([]);
    setCurrentPath('');
    setHasSignature(false);
    onClear?.();
  };

  const save = () => {
    if (!hasSignature) return;
    // Serialize all paths as SVG path data
    const svgData = paths.join('|');
    onSave(svgData);
  };

  return (
    <View style={st.container}>
      {label && <Text style={st.label}>{label}</Text>}

      <View
        ref={canvasRef}
        style={[st.canvas, { height }]}
        onLayout={(e) => {
          const { x, y } = e.nativeEvent.layout;
          setCanvasLayout({ x, y });
        }}
        {...panResponder.panHandlers}
      >
        <Svg width="100%" height={height} style={StyleSheet.absoluteFill}>
          {paths.map((p, i) => (
            <Path
              key={i}
              d={p}
              stroke={C.black}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          {currentPath ? (
            <Path
              d={currentPath}
              stroke={C.black}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ) : null}
        </Svg>

        {!hasSignature && (
          <View style={st.placeholder} pointerEvents="none">
            <Text style={st.placeholderTxt}>Assine aqui</Text>
          </View>
        )}
      </View>

      <View style={st.line} pointerEvents="none" />

      <View style={st.actions}>
        <TouchableOpacity style={st.clearBtn} onPress={clear}>
          <Text style={st.clearBtnTxt}>↺  Limpar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.saveBtn, !hasSignature && st.saveBtnDisabled]}
          onPress={save}
          disabled={!hasSignature}
        >
          <Text style={[st.saveBtnTxt, !hasSignature && { opacity: 0.4 }]}>
            Confirmar assinatura
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  container: { width: '100%' },
  label: { fontSize: F.xs, fontWeight: '700', color: C.textTertiary, letterSpacing: 1, marginBottom: S.sm },
  canvas: {
    backgroundColor: '#FAFAFA',
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    position: 'relative',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTxt: { fontSize: F.md, color: C.gray300, fontStyle: 'italic' },
  line: {
    height: 1,
    backgroundColor: C.gray300,
    marginHorizontal: S.xl,
    marginTop: -1,
  },
  actions: { flexDirection: 'row', gap: S.sm, marginTop: S.sm },
  clearBtn: {
    paddingVertical: S.sm,
    paddingHorizontal: S.md,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  clearBtnTxt: { fontSize: F.sm, color: C.textSecondary, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    paddingVertical: S.sm,
    borderRadius: R.lg,
    backgroundColor: C.black,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: C.gray200 },
  saveBtnTxt: { fontSize: F.sm, fontWeight: '700', color: C.white },
});
