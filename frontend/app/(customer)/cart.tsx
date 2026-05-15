import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../stores/cartStore';
import { useLocation } from '../../hooks/useLocation';
import { orderService } from '../../services/orders';
import CartItemComponent from '../../components/CartItem';
import Button from '../../components/ui/Button';
import Colors from '../../constants/colors';
import { OrderPreview } from '../../types';

export default function CartScreen() {
  const { items, getTotal, clearCart } = useCartStore();
  const { lat, lng } = useLocation();
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);

  async function handlePreview() {
    if (!lat || !lng) return;
    setPreviewing(true);
    try {
      const requestedItems = items.map((i) => ({ product_id: i.product.id, quantity: i.quantity }));
      const data = await orderService.preview(requestedItems, {
        address: 'Current Location',
        city: '',
        pincode: '',
        coordinates: [lng, lat],
      });
      setPreview(data);
    } catch {
      /* handled silently */
    } finally {
      setPreviewing(false);
    }
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="cart-outline" size={72} color={Colors.gray} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Add items from nearby shops</Text>
        <Button title="Browse Shops" onPress={() => router.push('/(customer)/')} style={styles.browseBtn} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cart ({items.length} items)</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.product.id}
        renderItem={({ item }) => <CartItemComponent item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        {preview && (
          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>Smart Order Routing</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Shops needed</Text>
              <Text style={styles.previewValue}>{preview.shops_count}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Subtotal</Text>
              <Text style={styles.previewValue}>₹{preview.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Delivery fee</Text>
              <Text style={styles.previewValue}>₹{preview.delivery_fee.toFixed(2)}</Text>
            </View>
            <View style={[styles.previewRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{preview.total.toFixed(2)}</Text>
            </View>
            {preview.unfulfilled_count > 0 && (
              <Text style={styles.warning}>{preview.unfulfilled_count} item(s) not available from nearby shops</Text>
            )}
          </View>
        )}

        <View style={styles.subtotal}>
          <Text style={styles.subtotalLabel}>Item total</Text>
          <Text style={styles.subtotalValue}>₹{getTotal().toFixed(2)}</Text>
        </View>

        <View style={styles.btnRow}>
          <Button
            title={previewing ? 'Checking...' : 'Check Availability'}
            onPress={handlePreview}
            loading={previewing}
            variant="outline"
            style={styles.previewBtn}
          />
          <Button
            title="Checkout"
            onPress={() => router.push('/(customer)/checkout')}
            style={styles.checkoutBtn}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary },
  browseBtn: { marginTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56, backgroundColor: Colors.white },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  clearText: { color: Colors.error, fontSize: 14, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 20 },
  footer: { backgroundColor: Colors.white, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 8 },
  previewBox: { backgroundColor: Colors.lightGray, borderRadius: 10, padding: 14, marginBottom: 12 },
  previewTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 8 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  previewLabel: { fontSize: 13, color: Colors.textSecondary },
  previewValue: { fontSize: 13, fontWeight: '600', color: Colors.text },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  totalValue: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  warning: { fontSize: 12, color: Colors.warning, marginTop: 6 },
  subtotal: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  subtotalLabel: { fontSize: 15, color: Colors.textSecondary },
  subtotalValue: { fontSize: 15, fontWeight: '700', color: Colors.text },
  btnRow: { flexDirection: 'row', gap: 10 },
  previewBtn: { flex: 1 },
  checkoutBtn: { flex: 1 },
});
