import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useCartStore } from '../../stores/cartStore';
import { useLocation } from '../../hooks/useLocation';
import { orderService } from '../../services/orders';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Colors from '../../constants/colors';

export default function CheckoutScreen() {
  const { items, clearCart } = useCartStore();
  const { lat, lng } = useLocation();
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePlaceOrder() {
    if (!address || !city || !pincode) {
      Toast.show({ type: 'error', text1: 'Please fill all address fields' });
      return;
    }
    if (!lat || !lng) {
      Toast.show({ type: 'error', text1: 'Location is required to place an order' });
      return;
    }
    setLoading(true);
    try {
      const requestedItems = items.map((i) => ({ product_id: i.product.id, quantity: i.quantity }));
      const result = await orderService.place(requestedItems, { address, city, pincode, coordinates: [lng, lat] }, notes || undefined);
      clearCart();
      Toast.show({ type: 'success', text1: 'Order placed!', text2: `Total: ₹${result.total}` });
      router.replace(`/(customer)/order/${result.id}` as any);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.detail ?? 'Failed to place order' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <Input label="Street Address" placeholder="House no, street, area" value={address} onChangeText={setAddress} leftIcon="home-outline" />
        <Input label="City" placeholder="City" value={city} onChangeText={setCity} leftIcon="business-outline" />
        <Input label="Pincode" placeholder="6-digit pincode" value={pincode} onChangeText={setPincode} keyboardType="numeric" maxLength={6} leftIcon="location-outline" />
        <Input label="Notes (optional)" placeholder="e.g. Ring the bell" value={notes} onChangeText={setNotes} leftIcon="chatbubble-outline" multiline />

        <Text style={styles.sectionTitle}>Order Summary</Text>
        {items.map((i) => (
          <View key={i.product.id} style={styles.item}>
            <Text style={styles.itemName} numberOfLines={1}>{i.product.name} × {i.quantity}</Text>
            <Text style={styles.itemPrice}>₹{(i.product.price * i.quantity).toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Items Total</Text>
          <Text style={styles.totalValue}>₹{items.reduce((s, i) => s + i.product.price * i.quantity, 0).toFixed(2)}</Text>
        </View>
        <Text style={styles.note}>* Final total including delivery fee will be shown after smart order routing</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Place Order" onPress={handlePlaceOrder} loading={loading} fullWidth />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerBar: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 56, backgroundColor: Colors.white, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 8, marginBottom: 16 },
  item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  itemName: { flex: 1, fontSize: 14, color: Colors.text },
  itemPrice: { fontSize: 14, fontWeight: '600', color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  totalValue: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  note: { fontSize: 12, color: Colors.gray, marginTop: 8 },
  footer: { padding: 16, backgroundColor: Colors.white },
});
