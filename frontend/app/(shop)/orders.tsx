import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { orderService } from '../../services/orders';
import { Order } from '../../types';
import { ORDER_STATUS_COLORS } from '../../constants/config';
import Colors from '../../constants/colors';

const SHOP_STATUS_LABELS: Record<string, string> = {
  pending: 'New Order',
  confirmed: 'Confirmed',
  ready: 'Ready for Pickup',
};

const SHOP_STATUS_COLORS: Record<string, string> = {
  pending: '#FF6F00',
  confirmed: '#1976D2',
  ready: '#388E3C',
};

const SHOP_NEXT_STATUS: Record<string, 'confirmed' | 'ready'> = {
  pending: 'confirmed',
  confirmed: 'ready',
};

const SHOP_NEXT_LABEL: Record<string, string> = {
  pending: 'Confirm Order',
  confirmed: 'Mark Ready',
};

export default function ShopOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [advancing, setAdvancing] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await orderService.getMyOrders();
      setOrders(data.filter((o: Order) => o.status !== 'delivered' && o.status !== 'cancelled'));
    } catch {
      /* handled silently */
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const onRefresh = async () => { setRefreshing(true); await fetchOrders(); setRefreshing(false); };

  async function advanceShopStatus(order: Order) {
    const shopStatus = order.shop_status ?? 'pending';
    const next = SHOP_NEXT_STATUS[shopStatus];
    if (!next) return;
    setAdvancing(order.id);
    try {
      await orderService.shopConfirm(order.id, next);
      setOrders((os) =>
        os.map((o) => o.id === order.id ? { ...o, shop_status: next } : o)
      );
      Toast.show({ type: 'success', text1: next === 'confirmed' ? 'Order confirmed' : 'Marked as ready for pickup' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.detail ?? 'Failed to update order' });
    } finally {
      setAdvancing(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Orders</Text>
        <Text style={styles.count}>{orders.length} orders</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => {
          const shopStatus = item.shop_status ?? 'pending';
          const statusColor = SHOP_STATUS_COLORS[shopStatus] ?? Colors.gray;
          const nextLabel = SHOP_NEXT_LABEL[shopStatus];
          const isAdvancing = advancing === item.id;
          const isReady = shopStatus === 'ready';
          const overallColor = ORDER_STATUS_COLORS[item.status] ?? Colors.gray;

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>#{item.id.slice(-6).toUpperCase()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {SHOP_STATUS_LABELS[shopStatus] ?? shopStatus}
                  </Text>
                </View>
              </View>

              {/* Items from this shop only */}
              <View style={styles.itemsBlock}>
                {item.items.map((i, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={1}>{i.product_name}</Text>
                    <Text style={styles.itemMeta}>×{i.quantity}  ₹{i.total.toFixed(2)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.subtotalLabel}>Your subtotal</Text>
                  <Text style={styles.subtotal}>₹{(item.shop_subtotal ?? 0).toFixed(2)}</Text>
                </View>

                {isReady ? (
                  <View style={styles.readyChip}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.readyText}>
                      {item.status === 'ready' ? 'Awaiting pickup' : 'Waiting for other shops'}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.advanceBtn, { backgroundColor: statusColor }, isAdvancing && styles.advanceBtnDisabled]}
                    onPress={() => advanceShopStatus(item)}
                    disabled={isAdvancing}
                  >
                    {isAdvancing
                      ? <ActivityIndicator size="small" color={Colors.white} />
                      : <Text style={styles.advanceBtnText}>{nextLabel}</Text>}
                  </TouchableOpacity>
                )}
              </View>

              {/* Show overall order status as secondary info */}
              {item.shops_involved.length > 1 && (
                <View style={styles.overallRow}>
                  <Text style={styles.overallLabel}>Overall order: </Text>
                  <View style={[styles.overallBadge, { backgroundColor: overallColor + '20' }]}>
                    <Text style={[styles.overallStatus, { color: overallColor }]}>{item.status}</Text>
                  </View>
                  <Text style={styles.overallLabel}> • {item.shops_involved.length} shops</Text>
                </View>
              )}
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={Colors.gray} />
            <Text style={styles.emptyText}>No active orders</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56, backgroundColor: Colors.white },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  count: { fontSize: 14, color: Colors.textSecondary },
  list: { padding: 16, paddingBottom: 80 },

  card: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderId: { fontSize: 15, fontWeight: '700', color: Colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },

  itemsBlock: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, gap: 6 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 13, color: Colors.text, flex: 1 },
  itemMeta: { fontSize: 13, color: Colors.textSecondary, marginLeft: 8 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 },
  subtotalLabel: { fontSize: 11, color: Colors.textSecondary },
  subtotal: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  advanceBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, minWidth: 120, alignItems: 'center' },
  advanceBtnDisabled: { opacity: 0.6 },
  advanceBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  readyChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  readyText: { fontSize: 12, color: Colors.success, fontWeight: '600' },

  overallRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  overallLabel: { fontSize: 11, color: Colors.textSecondary },
  overallBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  overallStatus: { fontSize: 11, fontWeight: '600' },

  empty: { alignItems: 'center', padding: 60, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});
