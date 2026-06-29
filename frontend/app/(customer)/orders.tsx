import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { orderService } from '../../services/orders';
import OrderCard from '../../components/OrderCard';
import { Order, OrderStatus } from '../../types';
import Colors from '../../constants/colors';

const FILTERS: Array<{ label: string; value: OrderStatus | null }> = [
  { label: 'All', value: null },
  { label: 'Active', value: 'pending' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch {
      /* handled silently */
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const refreshControl = useMemo(
    () => <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />,
    [refreshing, onRefresh]
  );

  const visibleOrders = filter ? orders.filter((o) => o.status === filter) : orders;

  const renderFilterChip = useCallback(({ item }: { item: typeof FILTERS[number] }) => (
    <Pressable
      style={({ pressed }) => [styles.filterChip, filter === item.value && styles.filterActive, pressed && { opacity: 0.7 }]}
      onPress={() => setFilter(item.value)}
    >
      <Text style={[styles.filterText, filter === item.value && styles.filterTextActive]}>{item.label}</Text>
    </Pressable>
  ), [filter]);

  const renderOrderCard = useCallback(({ item }: { item: Order }) => (
    <OrderCard order={item} viewerRole="customer" />
  ), []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(f) => f.label}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        renderItem={renderFilterChip}
        style={styles.filterList}
      />

      <FlatList
        data={visibleOrders}
        keyExtractor={(o) => o.id}
        renderItem={renderOrderCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={Colors.gray} />
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 16, paddingTop: 56, backgroundColor: Colors.white },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  filterList: { maxHeight: 50, backgroundColor: Colors.white },
  filters: { paddingHorizontal: 16, gap: 8, paddingBottom: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  filterActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white, fontWeight: '600' },
  list: { paddingTop: 12, paddingBottom: 80 },
  empty: { alignItems: 'center', padding: 60, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
});
