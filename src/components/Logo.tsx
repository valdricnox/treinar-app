import React, { useState } from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { C, F } from '../theme';

// Logo real da Treinar no GitHub
const LOGO_URL = 'https://raw.githubusercontent.com/valdricnox/treinar-app/main/assets/treinar_logo.png';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white' | 'dark';
  style?: any;
}

const SIZES = {
  xs: { w: 80, h: 32 },
  sm: { w: 110, h: 44 },
  md: { w: 150, h: 60 },
  lg: { w: 200, h: 80 },
  xl: { w: 240, h: 96 },
};

export default function Logo({ size = 'md', variant = 'default', style }: LogoProps) {
  const [error, setError] = useState(false);
  const dim = SIZES[size];

  if (error) {
    // Fallback: texto estilizado quando imagem não carrega
    return (
      <View style={[s.fallback, { width: dim.w, height: dim.h }, style]}>
        <Text style={[s.fallbackMain, variant === 'white' && s.textWhite]}>TREINAR</Text>
        <Text style={[s.fallbackSub, variant === 'white' && s.textWhiteSub]}>ENGENHARIA</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: LOGO_URL }}
      style={[{ width: dim.w, height: dim.h, resizeMode: 'contain' }, style]}
      onError={() => setError(true)}
    />
  );
}

const s = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  fallbackMain: {
    fontSize: F.xl,
    fontWeight: '900',
    color: C.primary,
    letterSpacing: 3,
  },
  fallbackSub: {
    fontSize: F.xs,
    fontWeight: '600',
    color: C.gray400,
    letterSpacing: 2,
  },
  textWhite: {
    color: C.primary,
  },
  textWhiteSub: {
    color: 'rgba(255,255,255,0.5)',
  },
});
