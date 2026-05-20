import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { shopService } from '../../services/shops';
import { orderService } from '../../services/orders';
import { useAuthStore } from '../../stores/authStore';
import OrderCard from '../../components/OrderCard';
import Card from '../../components/ui/Card';
import { Shop, Order } from '../../types';
import Colors from '../../constants/colors';

export default function ShopDashboard() {
  const { user } = useAuthStore();
  const [shop, setShop] = useState<Shop | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [shopData, ordersData] = await Promise.all([
        shopService.getMyShop().catch(() => null),
        orderService.getMyOrders(),
      ]);
      setShop(shopData);
      setOrders(ordersData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  async function performToggle() {
    if (!shop || toggling) return;
    setToggling(true);
    try {
      await shopService.updateShop({ is_open: !shop.is_open });
      setShop((s) => s ? { ...s, is_open: !s.is_open } : s);
      Toast.show({ type: 'success', text1: shop.is_open ? 'Shop is now Closed' : 'Shop is now Open' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update shop status' });
    } finally {
      setToggling(false);
    }
  }

  function handleStatusToggle() {
    if (!shop) return;
    if (shop.is_open) {
      Alert.alert(
        'Close Shop',
        'Are you sure you want to close your shop? Customers will not be able to place new orders.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Close Shop', style: 'destructive', onPress: performToggle },
        ]
      );
    } else {
      performToggle();
    }
  }

  const todaysOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
  });
  const todayRevenue = todaysOrders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
  const pendingCount = orders.filter((o) => ['pending', 'confirmed', 'preparing'].includes(o.status)).length;

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  if (!shop) {
    return (
      <View style={styles.noShop}>
        <Ionicons name="storefront-outline" size={72} color={Colors.gray} />
        <Text style={styles.noShopTitle}>No shop registered</Text>
        <Text style={styles.noShopSubtitle}>Register your shop to start selling</Text>
        <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/(shop)/register-shop')}>
          <Text style={styles.registerBtnText}>Register Shop</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.shopName}>{shop.name}</Text>
          <Text style={styles.greeting}>Good morning, {user?.name?.split(' ')[0]}</Text>
        </View>
        <TouchableOpacity
          style={[styles.statusToggle, { backgroundColor: shop.is_open ? Colors.success + '20' : Colors.error + '20', opacity: toggling ? 0.6 : 1 }]}
          onPress={handleStatusToggle}
          disabled={toggling}
        >
          {toggling
            ? <ActivityIndicator size="small" color={shop.is_open ? Colors.success : Colors.error} />
            : <View style={[styles.statusDot, { backgroundColor: shop.is_open ? Colors.success : Colors.error }]} />
          }
          <Text style={{ color: shop.is_open ? Colors.success : Colors.error, fontWeight: '600', fontSize: 13 }}>
            {toggling ? 'Updating...' : shop.is_open ? 'Open' : 'Closed'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <Card style={styles.statCard} padding={14}>
          <Ionicons name="receipt-outline" size={24} color={Colors.primary} />
          <Text style={styles.statValue}>{todaysOrders.length}</Text>
          <Text style={styles.statLabel}>Today's Orders</Text>
        </Card>
        <Card style={styles.statCard} padding={14}>
          <Ionicons name="cash-outline" size={24} color={Colors.success} />
          <Text style={[styles.statValue, { color: Colors.success }]}>₹{todayRevenue.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Today's Revenue</Text>
        </Card>
        <Card style={styles.statCard} padding={14}>
          <Ionicons name="time-outline" size={24} color={Colors.secondary} />
          <Text style={[styles.statValue, { color: Colors.secondary }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </Card>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => router.push('/(shop)/orders')}><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
        </View>
        {orders.slice(0, 5).map((o) => <OrderCard key={o.id} order={o} role="shop_owner" />)}
        {orders.length === 0 && (
          <View style={styles.emptyOrders}>
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noShop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  noShopTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  noShopSubtitle: { fontSize: 14, color: Colors.textSecondary },
  registerBtn: { marginTop: 8, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  registerBtnText: { color: Colors.white, fontWeight: '600', fontSize: 15 },
  header: { backgroundColor: Colors.primary, padding: 20, paddingTop: 56, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  shopName: { fontSize: 22, fontWeight: '700', color: Colors.white },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statusToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  stats: { flexDirection: 'row', gap: 10, padding: 16 },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 22, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  section: { paddingBottom: 80 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  seeAll: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  emptyOrders: { alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});
