import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { deliveryService } from '../../services/delivery';
import { useLocation } from '../../hooks/useLocation';
import Colors from '../../constants/colors';

interface AvailableOrder {
  id: string;
  shops_involved: string[];
  delivery_address: { address: string; city: string };
  total: number;
  items_count: number;
  created_at: string;
}

export default function AvailableDeliveries() {
  const { lat, lng, loading: locLoading } = useLocation();
  const [orders, setOrders] = useState<AvailableOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!lat || !lng) return;
    setLoading(true);
    try {
      const data = await deliveryService.getAvailable(lat, lng);
      setOrders(data);
    } catch {
      /* handled silently */
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const onRefresh = async () => { setRefreshing(true); await fetchOrders(); setRefreshing(false); };

  async function acceptOrder(orderId: string) {
    setAccepting(orderId);
    try {
      await deliveryService.accept(orderId);
      setOrders((os) => os.filter((o) => o.id !== orderId));
      Toast.show({ type: 'success', text1: 'Delivery accepted! Head to the shop.' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.detail ?? 'Failed to accept delivery' });
    } finally {
      setAccepting(null);
    }
  }

  if (locLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /><Text style={styles.hint}>Detecting location...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Orders</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
              <Text style={styles.earnings}>Earn ~₹{(20 + item.total * 0.05).toFixed(0)}</Text>
            </View>
            <View style={styles.detail}>
              <Ionicons name="location-outline" size={15} color={Colors.primary} />
              <Text style={styles.detailText} numberOfLines={1}>{item.delivery_address.address}, {item.delivery_address.city}</Text>
            </View>
            <View style={styles.detail}>
              <Ionicons name="cube-outline" size={15} color={Colors.gray} />
              <Text style={styles.detailText}>{item.items_count} items • {item.shops_involved.length} shop(s)</Text>
            </View>
            <View style={styles.detail}>
              <Ionicons name="cash-outline" size={15} color={Colors.gray} />
              <Text style={styles.detailText}>Order value: ₹{item.total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.acceptBtn, accepting === item.id && styles.acceptBtnDisabled]}
              onPress={() => acceptOrder(item.id)}
              disabled={accepting === item.id}
            >
              {accepting === item.id ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.acceptBtnText}>Accept Delivery</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
          ) : (
            <View style={styles.center}>
              <Ionicons name="bicycle-outline" size={64} color={Colors.gray} />
              <Text style={styles.hint}>No orders available right now</Text>
              <Text style={styles.subHint}>Pull down to refresh</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56, backgroundColor: Colors.white },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  refreshBtn: { padding: 8 },
  list: { padding: 16, paddingBottom: 80 },
  card: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderId: { fontSize: 16, fontWeight: '700', color: Colors.text },
  earnings: { fontSize: 14, fontWeight: '700', color: Colors.success },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  detailText: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  acceptBtn: { backgroundColor: Colors.primary, borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 10 },
  acceptBtnDisabled: { opacity: 0.6 },
  acceptBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  hint: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
  subHint: { fontSize: 13, color: Colors.gray },
});
