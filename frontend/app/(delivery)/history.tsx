import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deliveryService } from '../../services/delivery';
import { Delivery } from '../../types';
import Colors from '../../constants/colors';

export default function DeliveryHistory() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await deliveryService.getMyDeliveries();
      setDeliveries(data);
    } catch {
      /* handled silently */
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const onRefresh = useCallback(
    async () => { setRefreshing(true); await fetchHistory(); setRefreshing(false); },
    [fetchHistory]
  );

  const refreshControl = useMemo(
    () => <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />,
    [refreshing, onRefresh]
  );

  const completedCount = deliveries.filter((d) => d.status === 'delivered').length;

  const renderDeliveryCard = useCallback(({ item }: { item: Delivery }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>Order #{item.order_id.slice(-6).toUpperCase()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'delivered' ? Colors.success + '20' : Colors.warning + '20' }]}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: item.status === 'delivered' ? Colors.success : Colors.warning }}>
            {item.status === 'delivered' ? 'Delivered' : item.status}
          </Text>
        </View>
      </View>
      <View style={styles.detail}>
        <Ionicons name="location-outline" size={14} color={Colors.gray} />
        <Text style={styles.detailText} numberOfLines={1}>{item.delivery_address}</Text>
      </View>
      <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
    </View>
  ), []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Delivery History</Text>
        <Text style={styles.count}>{completedCount} completed</Text>
      </View>

      <FlatList
        data={deliveries}
        keyExtractor={(d) => d.id}
        renderItem={renderDeliveryCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={48} color={Colors.gray} />
            <Text style={styles.emptyText}>No delivery history</Text>
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
  count: { fontSize: 14, color: Colors.success, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 80 },
  card: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { fontSize: 15, fontWeight: '700', color: Colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  date: { fontSize: 12, color: Colors.gray, marginTop: 6 },
  empty: { alignItems: 'center', padding: 60, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});
