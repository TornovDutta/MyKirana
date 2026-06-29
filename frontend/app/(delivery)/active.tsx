import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { orderService } from '../../services/orders';
import { deliveryService } from '../../services/delivery';
import { useLocation } from '../../hooks/useLocation';
import { Order } from '../../types';
import Colors from '../../constants/colors';

export default function ActiveDelivery() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const { lat, lng } = useLocation();

  useEffect(() => {
    (async () => {
      try {
        const orders = await orderService.getMyOrders('picked_up');
        setOrder(orders[0] ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!order || !lat || !lng) return;
    const interval = setInterval(() => {
      deliveryService.updateLocation(order.id, [lng, lat]).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [order, lat, lng]);

  async function handleDelivered() {
    if (!order) return;
    Alert.alert('Confirm Delivery', 'Mark this order as delivered?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delivered',
        onPress: async () => {
          setMarking(true);
          try {
            await deliveryService.markDelivered(order.id);
            setOrder(null);
            Toast.show({ type: 'success', text1: 'Delivery completed!' });
          } catch {
            Toast.show({ type: 'error', text1: 'Failed to mark delivered' });
          } finally {
            setMarking(false);
          }
        },
      },
    ]);
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  if (!order) {
    return (
      <View style={styles.center}>
        <Ionicons name="checkmark-circle-outline" size={72} color={Colors.success} />
        <Text style={styles.noActiveTitle}>No active delivery</Text>
        <Text style={styles.noActiveSubtitle}>Accept an order from the Available tab</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Delivery</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>In Progress</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order #{order.id.slice(-6).toUpperCase()}</Text>
          <View style={styles.row}>
            <Ionicons name="cube-outline" size={18} color={Colors.primary} />
            <Text style={styles.rowText}>{order.items.length} items to deliver</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="location" size={18} color={Colors.error} />
            <Text style={styles.rowText} numberOfLines={2}>
              {order.delivery_address.address}, {order.delivery_address.city} – {order.delivery_address.pincode}
            </Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="cash-outline" size={18} color={Colors.success} />
            <Text style={styles.rowText}>Order value: ₹{order.total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.itemsList}>
          <Text style={styles.itemsTitle}>Items to Collect</Text>
          {order.items.map((item) => (
            <View key={item.product_id} style={styles.item}>
              <Ionicons name="checkmark-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.itemText}>{item.product_name} × {item.quantity}</Text>
            </View>
          ))}
        </View>

        <View style={styles.locationInfo}>
          <Ionicons name="navigate-outline" size={16} color={Colors.primary} />
          <Text style={styles.locationText}>{lat ? 'Tracking your location...' : 'Waiting for location...'}</Text>
        </View>

        <Pressable style={styles.deliveredBtn} onPress={handleDelivered} disabled={marking}>
          {marking ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-done-outline" size={22} color={Colors.white} />
              <Text style={styles.deliveredBtnText}>Mark as Delivered</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  noActiveTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  noActiveSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56, backgroundColor: Colors.white },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  badge: { backgroundColor: Colors.secondary + '20', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  badgeText: { color: Colors.secondary, fontWeight: '700', fontSize: 13 },
  content: { padding: 16 },
  card: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, gap: 10, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rowText: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 20 },
  itemsList: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 12 },
  itemsTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 10 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  itemText: { fontSize: 14, color: Colors.text },
  locationInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: Colors.primary + '10', borderRadius: 8, marginBottom: 16 },
  locationText: { fontSize: 13, color: Colors.primary },
  deliveredBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.success, borderRadius: 12, padding: 16 },
  deliveredBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
