import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItem as CartItemType } from '../types';
import { useCartStore } from '../stores/cartStore';
import Colors from '../constants/colors';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const { product, quantity } = item;

  return (
    <View style={styles.container}>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Ionicons name="cube-outline" size={28} color={Colors.gray} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.unit}>{product.unit}</Text>
        <Text style={styles.price}>₹{product.price} × {quantity} = <Text style={styles.total}>₹{(product.price * quantity).toFixed(2)}</Text></Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => removeItem(product.id)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={Colors.error} />
        </TouchableOpacity>
        <View style={styles.qtyRow}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(product.id, quantity - 1)}>
            <Ionicons name="remove" size={14} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.qty}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(product.id, quantity + 1)}>
            <Ionicons name="add" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: Colors.surface, padding: 12, borderRadius: 10, marginBottom: 8, alignItems: 'center' },
  image: { width: 64, height: 64, borderRadius: 8 },
  imageFallback: { backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, marginHorizontal: 12 },
  name: { fontSize: 14, fontWeight: '600', color: Colors.text },
  unit: { fontSize: 12, color: Colors.gray, marginTop: 2 },
  price: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  total: { fontWeight: '700', color: Colors.text },
  controls: { alignItems: 'center', gap: 8 },
  deleteBtn: { padding: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 8 },
  qtyBtn: { padding: 5 },
  qty: { fontSize: 13, fontWeight: '700', color: Colors.primary, paddingHorizontal: 6 },
});
