import React, { useEffect, useReducer, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import Toast from 'react-native-toast-message';
import { orderService } from '../../../services/orders';
import { deliveryService } from '../../../services/delivery';
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

interface DeliveryTrack {
  current_location: [number, number] | null;
  status: string;
  partner_name: string | null;
  updated_at: string | null;
}

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

function secondsAgoLabel(updatedAt: string | null): string {
  if (!updatedAt) return '';
  const diff = Math.max(0, Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000));
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

interface OrderDetailState { order: Order | null; loading: boolean; cancelling: boolean; track: DeliveryTrack | null; tick: number; }
type OrderDetailAction =
  | { type: 'set_order'; value: Order | null }
  | { type: 'set_loading'; value: boolean }
  | { type: 'set_cancelling'; value: boolean }
  | { type: 'set_track'; value: DeliveryTrack | null }
  | { type: 'tick' };
function orderDetailReducer(state: OrderDetailState, action: OrderDetailAction): OrderDetailState {
  switch (action.type) {
    case 'set_order': return { ...state, order: action.value };
    case 'set_loading': return { ...state, loading: action.value };
    case 'set_cancelling': return { ...state, cancelling: action.value };
    case 'set_track': return { ...state, track: action.value };
    case 'tick': return { ...state, tick: state.tick + 1 };
  }
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [state, dispatch] = useReducer(orderDetailReducer, { order: null, loading: true, cancelling: false, track: null, tick: 0 });
  const { order, loading, cancelling, track } = state;
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      const data = await orderService.getById(id);
      dispatch({ type: 'set_order', value: data });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not load order' });
    } finally {
      dispatch({ type: 'set_loading', value: false });
    }
  }, [id]);

  const fetchTrack = useCallback(async () => {
    if (!id) return;
    try {
      const data = await deliveryService.trackDelivery(id);
      dispatch({ type: 'set_track', value: data });
    } catch {
      /* partner not assigned yet — ignore */
    }
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // Poll partner location every 15s while order is in transit
  useEffect(() => {
    if (order?.status !== 'picked_up') return;
    fetchTrack();
    pollRef.current = setInterval(fetchTrack, 15000);
    // Refresh "X seconds ago" label every second
    const tickInterval = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      clearInterval(tickInterval);
    };
  }, [order?.status, fetchTrack]);

  function confirmCancel() {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: handleCancel },
    ]);
  }

  async function handleCancel() {
    if (!id) return;
    dispatch({ type: 'set_cancelling', value: true });
    try {
      await orderService.cancel(id);
      Toast.show({ type: 'success', text1: 'Order cancelled' });
      fetchOrder();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.detail ?? 'Could not cancel order' });
    } finally {
      dispatch({ type: 'set_cancelling', value: false });
    }
  }

  const canCancel = order && (order.status === 'pending' || order.status === 'confirmed');
  const statusColor = order ? (ORDER_STATUS_COLORS[order.status] ?? Colors.gray) : Colors.gray;
  const statusLabel = order ? (ORDER_STATUS_LABELS[order.status] ?? order.status) : '';
  const date = order ? new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  const partnerCoord = track?.current_location
    ? { latitude: track.current_location[1], longitude: track.current_location[0] }
    : null;
  const deliveryCoord = order?.delivery_address?.coordinates
    ? { latitude: order.delivery_address.coordinates[1], longitude: order.delivery_address.coordinates[0] }
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Order Details</Text>
        {canCancel && (
          <Pressable onPress={confirmCancel} style={styles.cancelBtn} disabled={cancelling}>
            {cancelling
              ? <ActivityIndicator size="small" color={Colors.error} />
              : <Text style={styles.cancelText}>Cancel</Text>}
          </Pressable>
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

          {/* Live tracking — only when partner has picked up */}
          {order.status === 'picked_up' && (
            <View style={styles.card}>
              <View style={styles.trackHeader}>
                <View style={styles.trackTitleRow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.sectionTitle}>Live Tracking</Text>
                </View>
                {track?.partner_name && (
                  <Text style={styles.partnerName}>
                    <Ionicons name="bicycle-outline" size={13} color={Colors.textSecondary} /> {track.partner_name} is on the way
                  </Text>
                )}
              </View>

              {partnerCoord ? (
                <>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: partnerCoord.latitude,
                      longitude: partnerCoord.longitude,
                      latitudeDelta: 0.015,
                      longitudeDelta: 0.015,
                    }}
                  >
                    <Marker coordinate={partnerCoord} title={track?.partner_name ?? 'Delivery Partner'} description="Heading to you">
                      <View style={styles.partnerMarker}>
                        <Ionicons name="bicycle" size={18} color={Colors.white} />
                      </View>
                    </Marker>

                    {deliveryCoord && (
                      <Marker coordinate={deliveryCoord} title="Your Location" pinColor={Colors.primary} />
                    )}
                  </MapView>
                  {track?.updated_at && (
                    <Text style={styles.lastUpdated}>
                      Updated {secondsAgoLabel(track.updated_at)}
                    </Text>
                  )}
                </>
              ) : (
                <View style={styles.trackWaiting}>
                  <ActivityIndicator color={Colors.primary} size="small" />
                  <Text style={styles.trackWaitingText}>Waiting for partner location…</Text>
                </View>
              )}
            </View>
          )}

          {/* Items */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
            {order.items.map((item, idx) => (
              <View key={item.product_id} style={[styles.itemRow, idx < order.items.length - 1 && styles.itemBorder]}>
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

          <Pressable style={styles.ordersLink} onPress={() => router.replace('/(customer)/orders')}>
            <Ionicons name="receipt-outline" size={16} color={Colors.primary} />
            <Text style={styles.ordersLinkText}>View all orders</Text>
          </Pressable>
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
  card: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, boxShadow: '0px 1px 6px rgba(0,0,0,0.06)' },

  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 18, fontWeight: '800', color: Colors.text },
  orderDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 13, fontWeight: '600' },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 14 },

  // Live tracking styles
  trackHeader: { marginBottom: 12 },
  trackTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  partnerName: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  map: { width: '100%', height: 200, borderRadius: 10, overflow: 'hidden' },
  partnerMarker: {
    backgroundColor: Colors.secondary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    boxShadow: '0px 2px 4px rgba(0,0,0,0.25)',
  },
  lastUpdated: { fontSize: 11, color: Colors.textSecondary, textAlign: 'right', marginTop: 6 },
  trackWaiting: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16, justifyContent: 'center' },
  trackWaitingText: { fontSize: 13, color: Colors.textSecondary },

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
