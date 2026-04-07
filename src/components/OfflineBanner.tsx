import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { C, F, S } from '../theme';

export default function OfflineBanner() {
  const isOnline = useSelector((s: RootState) => s.app.isOnline);
  const pendingCount = useSelector((s: RootState) => s.checklists.pendingSync.length + s.incidents.pendingSync.length);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isOnline ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isOnline]);

  const height = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });

  return (
    <Animated.View style={[s.container, { height }]}>
      <View style={s.inner}>
        <Text style={s.dot}>●</Text>
        <Text style={s.text}>
          Modo offline{pendingCount > 0 ? ` — ${pendingCount} item(s) aguardando sync` : ''}
        </Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: C.warning,
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.xs,
    paddingHorizontal: S.md,
  },
  dot: {
    color: C.white,
    fontSize: 8,
  },
  text: {
    color: C.white,
    fontSize: F.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
