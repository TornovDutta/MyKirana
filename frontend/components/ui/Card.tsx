import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Colors from '../../constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export default function Card({ children, style, padding = 16 }: CardProps) {
  return <View style={[styles.card, { padding }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.06)',
  },
});
