import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Shop } from '../types';
import Colors from '../constants/colors';

interface ShopCardProps {
  shop: Shop;
}

export default function ShopCard({ shop }: ShopCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          !shop.is_open && styles.cardClosed,
          pressed && { opacity: 0.92 },
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => router.push(`/shop/${shop.id}` as any)}
      >
        <View style={styles.imageContainer}>
          {shop.image_url ? (
            <Image
              source={{ uri: shop.image_url }}
              style={[styles.image, !shop.is_open && styles.imageClosed]}
              transition={200}
            />
          ) : (
            <View style={[styles.image, styles.imageFallback, !shop.is_open && styles.imageFallbackClosed]}>
              <Text style={styles.shopInitial}>{shop.name[0]?.toUpperCase() ?? 'S'}</Text>
            </View>
          )}

          {/* Status badge in top right of image */}
          <View style={[styles.statusBadge, shop.is_open ? styles.statusOpen : styles.statusClosed]}>
            <View style={[styles.statusDot, { backgroundColor: shop.is_open ? '#10B981' : '#94A3B8' }]} />
            <Text style={[styles.statusText, { color: shop.is_open ? '#065F46' : '#475569' }]}>
              {shop.is_open ? 'Open Now' : 'Closed'}
            </Text>
          </View>
        </View>

        {!shop.is_open && (
          <View style={styles.closedBanner}>
            <Text style={styles.closedBannerText}>Currently Closed</Text>
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.row}>
            <Text style={[styles.name, !shop.is_open && styles.textClosed]} numberOfLines={1}>
              {shop.name}
            </Text>
          </View>

          <Text style={[styles.address, !shop.is_open && styles.textClosed]} numberOfLines={1}>
            {shop.address}
          </Text>

          <View style={styles.meta}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={styles.ratingText}>
                {shop.rating > 0 ? shop.rating.toFixed(1) : '4.8'}
              </Text>
            </View>

            {shop.distance_km != null && (
              <View style={styles.metaItem}>
                <Ionicons name="navigate-outline" size={13} color={Colors.primary} />
                <Text style={[styles.metaText, !shop.is_open && styles.textClosed]}>
                  {shop.distance_km < 1
                    ? `${(shop.distance_km * 1000).toFixed(0)}m`
                    : `${shop.distance_km.toFixed(1)}km`}
                </Text>
              </View>
            )}

            <View style={styles.metaItem}>
              <Ionicons name="bicycle-outline" size={13} color={Colors.gray} />
              <Text style={[styles.metaText, !shop.is_open && styles.textClosed]}>
                {shop.delivery_radius_km}km
              </Text>
            </View>
          </View>

          {shop.categories.length > 0 && (
            <View style={styles.categories}>
              {shop.categories.slice(0, 3).map((c) => (
                <View key={c} style={[styles.chip, !shop.is_open && styles.chipClosed]}>
                  <Text style={[styles.chipText, !shop.is_open && styles.textClosed]}>{c}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        }
      : {}),
  },
  cardClosed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.85,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
    backgroundColor: '#F1F5F9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageClosed: {
    opacity: 0.45,
  },
  imageFallback: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackClosed: {
    backgroundColor: '#94A3B8',
  },
  shopInitial: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
  },
  statusOpen: {
    backgroundColor: 'rgba(236, 253, 245, 0.95)',
    borderColor: '#A7F3D0',
  },
  statusClosed: {
    backgroundColor: 'rgba(241, 245, 249, 0.95)',
    borderColor: '#CBD5E1',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closedBanner: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  closedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  body: {
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
    flex: 1,
  },
  address: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  textClosed: {
    color: '#94A3B8',
  },
  categories: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  chipClosed: {
    backgroundColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
});
