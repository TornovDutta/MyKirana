import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { orderService } from '../../../services/orders';
import { Order, OrderStatus } from '../../../types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../constants/config';
import Colors from '../../../constants/colors';

const STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered'];

const STATUS_ICONS: Record<string, string> = {
  pending: 'time-outline',
  confirmed: 'checkmark-circle-outline',
  preparing: 'restaurant-outline',
  ready: 'bag-check-outline',
  picked_up: 'bicycle-outline',
  delivered: 'home-outline',
  cancelled: 'close-circle-outline',
};

function StatusTimeline({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <View style={tl.cancelled}>
        <Ionicons name="close-circle" size={24} color={Colors.error} />
        <Text style={tl.cancelledText}>Order Cancelled</Text>
      </View>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(status);

  return (
    <View style={tl.container}>
      {STATUS_STEPS.map((step, idx) => {
        const done = idx <= currentIdx;
        const active = idx === currentIdx;
        const color = active ? Colors.primary : done ? Colors.success : Colors.border;
        return (
          <View key={step} style={tl.step}>
            <View style={tl.left}>
              <View style={[tl.dot, { backgroundColor: done ? color : Colors.white, borderColor: color }]}>
                {done && <Ionicons name={STATUS_ICONS[step] as any} size={12} color={Colors.white} />}
              </View>
              {idx < STATUS_STEPS.length - 1 && (
                <View style={[tl.line, { backgroundColor: idx < currentIdx ? Colors.success : Colors.border }]} />
              )}
            </View>
            <Text style={[tl.label, active && tl.labelActive]}>{ORDER_STATUS_LABELS[step]}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      const data = await orderService.getById(id);
      setOrder(data);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not load order' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  function confirmCancel() {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: handleCancel },
    ]);
  }

  async function handleCancel() {
    if (!id) return;
    setCancelling(true);
    try {
      await orderService.cancel(id);
      Toast.show({ type: 'success', text1: 'Order cancelled' });
      fetchOrder();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.detail ?? 'Could not cancel order' });
    } finally {
      setCancelling(false);
    }
  }

  const canCancel = order && (order.status === 'pending' || order.status === 'confirmed');
  const statusColor = order ? (ORDER_STATUS_COLORS[order.status] ?? Colors.gray) : Colors.gray;
  const statusLabel = order ? (ORDER_STATUS_LABELS[order.status] ?? order.status) : '';
  const date = order ? new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        {canCancel && (
          <TouchableOpacity onPress={confirmCancel} style={styles.cancelBtn} disabled={cancelling}>
            {cancelling
              ? <ActivityIndicator size="small" color={Colors.error} />
              : <Text style={styles.cancelText}>Cancel</Text>}
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : !order ? (
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={48} color={Colors.gray} />
          <Text style={styles.hint}>Order not found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Order header */}
          <View style={styles.card}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
                <Text style={styles.orderDate}>{date}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>
          </View>

          {/* Status timeline */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Order Status</Text>
            <StatusTimeline status={order.status} />
          </View>

          {/* Items */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
            {order.items.map((item, idx) => (
              <View key={idx} style={[styles.itemRow, idx < order.items.length - 1 && styles.itemBorder]}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <Text style={styles.itemQty}>× {item.quantity}</Text>
                </View>
                <Text style={styles.itemTotal}>₹{item.total.toFixed(2)}</Text>
              </View>
            ))}
          </View>

          {/* Price breakdown */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Bill Details</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Subtotal</Text>
              <Text style={styles.billValue}>₹{order.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={styles.billValue}>₹{order.delivery_fee.toFixed(2)}</Text>
            </View>
            <View style={[styles.billRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{order.total.toFixed(2)}</Text>
            </View>
          </View>

          {/* Delivery address */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={18} color={Colors.primary} style={styles.addressIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressText}>{order.delivery_address.address}</Text>
                <Text style={styles.addressSub}>{order.delivery_address.city} – {order.delivery_address.pincode}</Text>
              </View>
            </View>
          </View>

          {/* Notes */}
          {order.notes ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notes}>{order.notes}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.ordersLink} onPress={() => router.replace('/(customer)/orders')}>
            <Ionicons name="receipt-outline" size={16} color={Colors.primary} />
            <Text style={styles.ordersLinkText}>View all orders</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const tl = StyleSheet.create({
  container: { paddingTop: 4 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 0 },
  left: { alignItems: 'center', width: 24 },
  dot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  line: { width: 2, height: 28, marginTop: 2 },
  label: { fontSize: 13, color: Colors.textSecondary, paddingTop: 4, paddingBottom: 18 },
  labelActive: { color: Colors.primary, fontWeight: '700' },
  cancelled: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  cancelledText: { fontSize: 15, fontWeight: '700', color: Colors.error },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 56, backgroundColor: Colors.white, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.text },
  cancelBtn: { padding: 4 },
  cancelText: { fontSize: 14, fontWeight: '600', color: Colors.error },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  hint: { fontSize: 14, color: Colors.textSecondary },

  content: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },

  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 18, fontWeight: '800', color: Colors.text },
  orderDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 13, fontWeight: '600' },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 14 },

  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemLeft: { flex: 1, gap: 2 },
  itemName: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  itemQty: { fontSize: 12, color: Colors.textSecondary },
  itemTotal: { fontSize: 14, fontWeight: '600', color: Colors.text },

  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billLabel: { fontSize: 14, color: Colors.textSecondary },
  billValue: { fontSize: 14, color: Colors.text },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
  totalValue: { fontSize: 16, fontWeight: '700', color: Colors.primary },

  addressRow: { flexDirection: 'row', gap: 10 },
  addressIcon: { marginTop: 2 },
  addressText: { fontSize: 14, color: Colors.text },
  addressSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  notes: { fontSize: 14, color: Colors.text, lineHeight: 20 },

  ordersLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  ordersLinkText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
});
