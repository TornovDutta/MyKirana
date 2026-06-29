import React, { useEffect, useReducer, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import RazorpayCheckout from 'react-native-razorpay';
import { useCartStore } from '../../stores/cartStore';
import { useLocation } from '../../hooks/useLocation';
import { orderService } from '../../services/orders';
import { addressService } from '../../services/addresses';
import { CartItem, SavedAddress } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Colors from '../../constants/colors';

interface CheckoutState {
  address: string; city: string; pincode: string; notes: string;
  loading: boolean; savedAddresses: SavedAddress[]; selectedId: string | null;
}
type CheckoutAction =
  | { type: 'type_address'; value: string }
  | { type: 'type_city'; value: string }
  | { type: 'type_pincode'; value: string }
  | { type: 'set_notes'; value: string }
  | { type: 'set_loading'; value: boolean }
  | { type: 'set_saved_addresses'; value: SavedAddress[] }
  | { type: 'pick_address'; value: SavedAddress };
function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case 'type_address': return { ...state, selectedId: null, address: action.value };
    case 'type_city': return { ...state, selectedId: null, city: action.value };
    case 'type_pincode': return { ...state, selectedId: null, pincode: action.value };
    case 'set_notes': return { ...state, notes: action.value };
    case 'set_loading': return { ...state, loading: action.value };
    case 'set_saved_addresses': return { ...state, savedAddresses: action.value };
    case 'pick_address': return { ...state, selectedId: action.value.id, address: action.value.address, city: action.value.city, pincode: action.value.pincode };
  }
}

export default function CheckoutScreen() {
  const { items, clearCart } = useCartStore();
  const { lat, lng } = useLocation();
  const [state, dispatch] = useReducer(checkoutReducer, { address: '', city: '', pincode: '', notes: '', loading: false, savedAddresses: [], selectedId: null });
  const { address, city, pincode, notes, loading, savedAddresses, selectedId } = state;

  useEffect(() => {
    addressService.list().then((d) => dispatch({ type: 'set_saved_addresses', value: d })).catch(() => {});
  }, []);

  const pickAddress = useCallback((addr: SavedAddress) => {
    dispatch({ type: 'pick_address', value: addr });
  }, []);

  async function handlePlaceOrder() {
    if (!address || !city || !pincode) {
      Toast.show({ type: 'error', text1: 'Please fill all address fields' });
      return;
    }
    if (!lat || !lng) {
      Toast.show({ type: 'error', text1: 'Location is required to place an order' });
      return;
    }
    dispatch({ type: 'set_loading', value: true });
    try {
      const requestedItems = items.map((i) => ({ product_id: i.product.id, quantity: i.quantity }));
      const result = await orderService.place(requestedItems, { address, city, pincode, coordinates: [lng, lat] }, notes || undefined);
      
      if (result.razorpay_order_id) {
        const options = {
          description: 'MyKirana Order Payment',
          currency: 'INR',
          key: result.razorpay_key,
          amount: result.total * 100,
          name: 'MyKirana',
          order_id: result.razorpay_order_id,
          theme: { color: Colors.primary }
        };
        try {
          const data = await RazorpayCheckout.open(options);
          await orderService.verifyPayment(result.id, {
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_signature: data.razorpay_signature
          });
          clearCart();
          Toast.show({ type: 'success', text1: 'Payment successful!', text2: `Total: ₹${result.total}` });
          router.replace(`/(customer)/order/${result.id}` as any);
        } catch (paymentError: any) {
          Toast.show({ type: 'error', text1: 'Payment failed or cancelled', text2: paymentError.description || 'Please try again' });
          clearCart();
          router.replace(`/(customer)/order/${result.id}` as any);
        }
      } else {
        clearCart();
        Toast.show({ type: 'success', text1: 'Order placed!', text2: `Total: ₹${result.total}` });
        router.replace(`/(customer)/order/${result.id}` as any);
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.detail ?? 'Failed to place order' });
    } finally {
      dispatch({ type: 'set_loading', value: false });
    }
  }

  const renderSavedChip = useCallback(({ item: addr }: { item: SavedAddress }) => (
    <Pressable
      style={({ pressed }) => [styles.savedChip, selectedId === addr.id && styles.savedChipActive, pressed && { opacity: 0.8 }]}
      onPress={() => pickAddress(addr)}
    >
      <Ionicons
        name={addr.label === 'Home' ? 'home' : addr.label === 'Work' ? 'briefcase' : 'location'}
        size={14}
        color={selectedId === addr.id ? Colors.white : Colors.primary}
      />
      <Text style={[styles.savedChipText, selectedId === addr.id && styles.savedChipTextActive]}>{addr.label}</Text>
    </Pressable>
  ), [selectedId, pickAddress]);

  const renderCartItem = useCallback(({ item: i }: { item: CartItem }) => (
    <View style={styles.item}>
      <Text style={styles.itemName} numberOfLines={1}>{i.product.name} × {i.quantity}</Text>
      <Text style={styles.itemPrice}>₹{(i.product.price * i.quantity).toFixed(2)}</Text>
    </View>
  ), []);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <FlatList
        style={styles.container}
        data={items}
        keyExtractor={(i) => i.product.id}
        renderItem={renderCartItem}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.sectionTitle}>Delivery Address</Text>

            {savedAddresses.length > 0 && (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={savedAddresses}
                keyExtractor={(addr) => addr.id}
                renderItem={renderSavedChip}
                contentContainerStyle={styles.savedRow}
                style={styles.savedScroll}
              />
            )}

            <Input
              label="Street Address"
              placeholder="House no, street, area"
              value={address}
              onChangeText={(v) => dispatch({ type: 'type_address', value: v })}
              leftIcon="home-outline"
            />
            <Input
              label="City"
              placeholder="City"
              value={city}
              onChangeText={(v) => dispatch({ type: 'type_city', value: v })}
              leftIcon="business-outline"
            />
            <Input
              label="Pincode"
              placeholder="6-digit pincode"
              value={pincode}
              onChangeText={(v) => dispatch({ type: 'type_pincode', value: v })}
              keyboardType="numeric"
              maxLength={6}
              leftIcon="location-outline"
            />
            <Input
              label="Notes (optional)"
              placeholder="e.g. Ring the bell"
              value={notes}
              onChangeText={(v) => dispatch({ type: 'set_notes', value: v })}
              leftIcon="chatbubble-outline"
              multiline
            />

            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
        }
        ListFooterComponent={
          <View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Items Total</Text>
              <Text style={styles.totalValue}>
                ₹{items.reduce((s, i) => s + i.product.price * i.quantity, 0).toFixed(2)}
              </Text>
            </View>
            <Text style={styles.note}>
              * Final total including delivery fee will be shown after smart order routing
            </Text>
          </View>
        }
      />

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
  savedScroll: { marginBottom: 14 },
  savedRow: { gap: 8, paddingRight: 4 },
  savedChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.white },
  savedChipActive: { backgroundColor: Colors.primary },
  savedChipText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  savedChipTextActive: { color: Colors.white },
});
