import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Shop } from '../types';
import Colors from '../constants/colors';

interface ShopCardProps {
  shop: Shop;
}

export default function ShopCard({ shop }: ShopCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/(customer)/shop/${shop.id}` as any)} activeOpacity={0.9}>
      {shop.image_url ? (
        <Image source={{ uri: shop.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Text style={styles.shopInitial}>{shop.name[0].toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{shop.name}</Text>
          <View style={[styles.statusDot, { backgroundColor: shop.is_open ? Colors.success : Colors.error }]} />
        </View>
        <Text style={styles.address} numberOfLines={1}>{shop.address}</Text>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={13} color={Colors.secondary} />
            <Text style={styles.metaText}>{shop.rating > 0 ? shop.rating.toFixed(1) : 'New'}</Text>
          </View>
          {shop.distance_km != null && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={Colors.gray} />
              <Text style={styles.metaText}>
                {shop.distance_km < 1 ? `${(shop.distance_km * 1000).toFixed(0)}m` : `${shop.distance_km.toFixed(1)}km`}
              </Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="bicycle-outline" size={13} color={Colors.gray} />
            <Text style={styles.metaText}>{shop.delivery_radius_km}km radius</Text>
          </View>
        </View>
        {shop.categories.length > 0 && (
          <View style={styles.categories}>
            {shop.categories.slice(0, 3).map((c) => (
              <View key={c} style={styles.chip}>
                <Text style={styles.chipText}>{c}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 130 },
  imageFallback: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  shopInitial: { fontSize: 48, fontWeight: '800', color: Colors.white },
  body: { padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  address: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  meta: { flexDirection: 'row', gap: 12, marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  categories: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  chip: { backgroundColor: Colors.lightGray, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  chipText: { fontSize: 11, color: Colors.textSecondary },
});
