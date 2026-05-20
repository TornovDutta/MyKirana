import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
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

  return (
    <View style={styles.card}>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Ionicons name="cube-outline" size={32} color={Colors.gray} />
        </View>
      )}
      {product.discount_percent > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{product.discount_percent.toFixed(0)}% off</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
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
            <TouchableOpacity
              style={[styles.addBtn, !shopIsOpen && styles.addBtnDisabled]}
              onPress={() => shopIsOpen && addItem(product)}
              activeOpacity={shopIsOpen ? 0.8 : 1}
            >
              <Text style={[styles.addBtnText, !shopIsOpen && styles.addBtnTextDisabled]}>
                {shopIsOpen ? 'Add' : 'Unavailable'}
              </Text>
              {shopIsOpen && <Ionicons name="add" size={16} color={Colors.primary} />}
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(product.id, qty - 1)}>
                <Ionicons name="remove" size={16} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.qty}>{qty}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => shopIsOpen && updateQuantity(product.id, qty + 1)}
                activeOpacity={shopIsOpen ? 0.8 : 1}
              >
                <Ionicons name="add" size={16} color={shopIsOpen ? Colors.primary : Colors.gray} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    width: '48%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 110 },
  imageFallback: { backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center' },
  discountBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: Colors.error, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  discountText: { fontSize: 10, color: Colors.white, fontWeight: '700' },
  body: { padding: 10 },
  name: { fontSize: 13, fontWeight: '600', color: Colors.text },
  brand: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  unit: { fontSize: 11, color: Colors.gray, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  price: { fontSize: 15, fontWeight: '700', color: Colors.text },
  mrp: { fontSize: 12, color: Colors.gray, textDecorationLine: 'line-through' },
  actions: { marginTop: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 8, paddingVertical: 6, gap: 4 },
  addBtnDisabled: { borderColor: Colors.border, backgroundColor: Colors.lightGray },
  addBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  addBtnTextDisabled: { color: Colors.gray },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 8 },
  qtyBtn: { padding: 6 },
  qty: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
