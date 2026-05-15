import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { orderService } from '../../../services/orders';
import { Order } from '../../../types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../constants/config';
import Colors from '../../../constants/colors';

const STATUS_STEPS: Order['status'][] = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered'];

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await orderService.getById(id);
        setOrder(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleCancel() {
    setCancelling(true);
    try {
      await orderService.cancel(id);
      setOrder((o) => o ? { ...o, status: 'cancelled' } : o);
      Toast.show({ type: 'success', text1: 'Order cancelled' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.detail ?? 'Cannot cancel order' });
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!order) return <View style={styles.center}><Text>Order not found</Text></View>;

  const currentStep = STATUS_STEPS.indexOf(order.status as any);
  const isCancelled = order.status === 'cancelled';
  const statusColor = ORDER_STATUS_COLORS[order.status] ?? Colors.gray;

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.id.slice(-6).toUpperCase()}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusCard, { borderLeftColor: statusColor }]}>
          <Text style={[styles.statusLabel, { color: statusColor }]}>{ORDER_STATUS_LABELS[order.status]}</Text>
          <Text style={styles.statusDate}>{new Date(order.created_at).toLocaleString('en-IN')}</Text>
        </View>

        {!isCancelled && (
          <View style={styles.timeline}>
            {STATUS_STEPS.map((step, i) => (
              <View key={step} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.dot, i <= currentStep && styles.dotActive, i === currentStep && styles.dotCurrent]}>
                    {i < currentStep && <Ionicons name="checkmark" size={12} color={Colors.white} />}
                  </View>
                  {i < STATUS_STEPS.length - 1 && <View style={[styles.line, i < currentStep && styles.lineActive]} />}
                </View>
                <Text style={[styles.stepLabel, i <= currentStep && styles.stepLabelActive]}>{ORDER_STATUS_LABELS[step]}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
        {order.items.map((item, i) => (
          <View key={i} style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              <Text style={styles.itemQty}>× {item.quantity}</Text>
            </View>
            <Text style={styles.itemTotal}>₹{item.total.toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.bill}>
          <View style={styles.billRow}><Text style={styles.billLabel}>Subtotal</Text><Text style={styles.billValue}>₹{order.subtotal.toFixed(2)}</Text></View>
          <View style={styles.billRow}><Text style={styles.billLabel}>Delivery fee</Text><Text style={styles.billValue}>₹{order.delivery_fee.toFixed(2)}</Text></View>
          <View style={[styles.billRow, styles.billTotal]}><Text style={styles.billTotalLabel}>Total</Text><Text style={styles.billTotalValue}>₹{order.total.toFixed(2)}</Text></View>
        </View>

        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <Text style={styles.address}>{order.delivery_address.address}, {order.delivery_address.city} – {order.delivery_address.pincode}</Text>

        {(order.status === 'pending' || order.status === 'confirmed') && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={cancelling}>
            <Text style={styles.cancelText}>{cancelling ? 'Cancelling...' : 'Cancel Order'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerBar: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 56, backgroundColor: Colors.white, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  content: { padding: 16, paddingBottom: 40 },
  statusCard: { backgroundColor: Colors.white, borderRadius: 10, padding: 16, borderLeftWidth: 4, marginBottom: 16 },
  statusLabel: { fontSize: 18, fontWeight: '700' },
  statusDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  timeline: { backgroundColor: Colors.white, borderRadius: 10, padding: 16, marginBottom: 16 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
  timelineLeft: { alignItems: 'center', marginRight: 12, width: 24 },
  dot: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  dotActive: { backgroundColor: Colors.primaryLight },
  dotCurrent: { backgroundColor: Colors.primary },
  line: { width: 2, height: 28, backgroundColor: Colors.border },
  lineActive: { backgroundColor: Colors.primaryLight },
  stepLabel: { fontSize: 14, color: Colors.gray, paddingVertical: 4 },
  stepLabelActive: { color: Colors.text, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 16, marginBottom: 10 },
  item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemInfo: { flexDirection: 'row', flex: 1, gap: 8 },
  itemName: { flex: 1, fontSize: 14, color: Colors.text },
  itemQty: { fontSize: 14, color: Colors.textSecondary },
  itemTotal: { fontSize: 14, fontWeight: '600', color: Colors.text },
  bill: { backgroundColor: Colors.white, borderRadius: 10, padding: 14, marginTop: 12 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  billLabel: { fontSize: 14, color: Colors.textSecondary },
  billValue: { fontSize: 14, color: Colors.text },
  billTotal: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 4 },
  billTotalLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  billTotalValue: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  address: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  cancelBtn: { marginTop: 24, padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.error, alignItems: 'center' },
  cancelText: { color: Colors.error, fontWeight: '600', fontSize: 15 },
});
