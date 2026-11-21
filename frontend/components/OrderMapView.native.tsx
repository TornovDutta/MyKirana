import React from 'react';
import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
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
  partnerMarkerStyle,
}: OrderMapViewProps) {
  return (
    <MapView
      style={style}
      initialRegion={{
        latitude: partnerCoord.latitude,
        longitude: partnerCoord.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }}
    >
      <Marker
        coordinate={partnerCoord}
        title={partnerName ?? 'Delivery Partner'}
        description="Heading to you"
      >
        <View style={partnerMarkerStyle}>
          <Ionicons name="bicycle" size={18} color={Colors.white} />
        </View>
      </Marker>

      {deliveryCoord && (
        <Marker coordinate={deliveryCoord} title="Your Location" pinColor={Colors.primary} />
      )}
    </MapView>
  );
}
