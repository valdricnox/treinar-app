import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  style?: any;
}

const sizes = { sm: 60, md: 100, lg: 140 };

export default function Logo({ size = 'md', style }: LogoProps) {
  const dim = sizes[size];
  return (
    <View style={style}>
      <Image
        source={require('../../assets/treinar_logo.png')}
        style={{ width: dim, height: dim * 0.5, resizeMode: 'contain' }}
      />
    </View>
  );
}
