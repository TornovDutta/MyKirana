import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';

interface OrderMapViewProps {
  partnerCoord: { latitude: number; longitude: number };
  deliveryCoord?: { latitude: number; longitude: number } | null;
  partnerName?: string | null;
  style?: any;
  partnerMarkerStyle?: any;
}

export default function OrderMapView({
  partnerCoord,
  deliveryCoord,
  partnerName,
  style,
}: OrderMapViewProps) {
  return (
    <View style={[style, webStyles.container]}>
      <Ionicons name="map-outline" size={32} color={Colors.primary} />
      <Text style={webStyles.title}>Live Tracking: {partnerName ?? 'Partner on the way'}</Text>
      <Text style={webStyles.sub}>
        Partner Location: {partnerCoord.latitude.toFixed(4)}, {partnerCoord.longitude.toFixed(4)}
      </Text>
      {deliveryCoord && (
        <Text style={webStyles.sub}>
          Delivery Location: {deliveryCoord.latitude.toFixed(4)}, {deliveryCoord.longitude.toFixed(4)}
        </Text>
      )}
    </View>
  );
}

const webStyles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
  },
  sub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
