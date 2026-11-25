import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { useCartStore } from '../stores/cartStore';
import Colors from '../constants/colors';

interface ProductCardProps {
  product: Product;
  shopIsOpen?: boolean;
}

export default function ProductCard({ product, shopIsOpen = true }: ProductCardProps) {
  const { addItem, updateQuantity, getItemQuantity } = useCartStore();
  const qty = getItemQuantity(product.id);
  const btnScale = useRef(new Animated.Value(1)).current;

  const triggerBounce = () => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const handleAdd = () => {
    if (!shopIsOpen) return;
    triggerBounce();
    addItem(product);
  };

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} transition={200} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Ionicons name="basket-outline" size={32} color="#94A3B8" />
          </View>
        )}
        {product.discount_percent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{product.discount_percent.toFixed(0)}% OFF</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        {product.brand && <Text style={styles.brand}>{product.brand}</Text>}
        <Text style={styles.unit}>{product.unit}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{product.price}</Text>
          {product.mrp > product.price && (
            <Text style={styles.mrp}>₹{product.mrp}</Text>
          )}
        </View>

        <View style={styles.actions}>
          {qty === 0 ? (
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <Pressable
                style={({ pressed }) => [
                  styles.addBtn,
                  !shopIsOpen && styles.addBtnDisabled,
                  pressed && shopIsOpen && { opacity: 0.8 },
                ]}
                onPress={handleAdd}
              >
                <Text style={[styles.addBtnText, !shopIsOpen && styles.addBtnTextDisabled]}>
                  {shopIsOpen ? 'ADD' : 'Unavailable'}
                </Text>
                {shopIsOpen && <Ionicons name="add" size={16} color={Colors.primary} />}
              </Pressable>
            </Animated.View>
          ) : (
            <View style={styles.qtyRow}>
              <Pressable
                style={({ pressed }) => [styles.qtyBtn, pressed && { opacity: 0.7 }]}
                onPress={() => updateQuantity(product.id, qty - 1)}
              >
                <Ionicons name="remove" size={16} color={Colors.primary} />
              </Pressable>
              <Text style={styles.qty}>{qty}</Text>
              <Pressable
                style={({ pressed }) => [styles.qtyBtn, pressed && shopIsOpen && { opacity: 0.8 }]}
                onPress={() => shopIsOpen && updateQuantity(product.id, qty + 1)}
              >
                <Ionicons name="add" size={16} color={shopIsOpen ? Colors.primary : Colors.gray} />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    backgroundColor: '#F8FAFC',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  body: {
    padding: 12,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
    minHeight: 36,
  },
  brand: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  unit: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  mrp: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  actions: {
    marginTop: 10,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    paddingVertical: 7,
    gap: 4,
  },
  addBtnDisabled: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  addBtnTextDisabled: {
    color: '#94A3B8',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  qtyBtn: {
    padding: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
});
