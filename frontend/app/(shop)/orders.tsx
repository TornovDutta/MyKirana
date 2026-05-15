import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import Toast from 'react-native-toast-message';
import { orderService } from '../../services/orders';
import { Order, OrderStatus } from '../../types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../constants/config';
import Colors from '../../constants/colors';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
};

export default function ShopOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  async function advanceStatus(order: Order) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    try {
      await orderService.updateStatus(order.id, next);
      setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
      Toast.show({ type: 'success', text1: `Order marked as ${ORDER_STATUS_LABELS[next]}` });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update order' });
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
          const statusColor = ORDER_STATUS_COLORS[item.status] ?? Colors.gray;
          const nextStatus = NEXT_STATUS[item.status];
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>#{item.id.slice(-6).toUpperCase()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>{ORDER_STATUS_LABELS[item.status]}</Text>
                </View>
              </View>
              <Text style={styles.itemsList} numberOfLines={2}>
                {item.items.map((i) => `${i.product_name} ×${i.quantity}`).join(', ')}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.total}>₹{item.total.toFixed(2)}</Text>
                {nextStatus && (
                  <TouchableOpacity
                    style={[styles.advanceBtn, { backgroundColor: statusColor }]}
                    onPress={() => advanceStatus(item)}
                  >
                    <Text style={styles.advanceBtnText}>Mark {ORDER_STATUS_LABELS[nextStatus]}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
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
  card: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { fontSize: 15, fontWeight: '700', color: Colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  itemsList: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  total: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  advanceBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  advanceBtnText: { color: Colors.white, fontWeight: '600', fontSize: 13 },
  empty: { alignItems: 'center', padding: 60 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});
