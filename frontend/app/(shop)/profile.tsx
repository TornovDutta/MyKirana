import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { shopService } from '../../services/shops';
import { useAuthStore } from '../../stores/authStore';
import { Shop } from '../../types';
import Colors from '../../constants/colors';

export default function ShopProfile() {
  const { user, logout } = useAuthStore();
  const [shop, setShop] = useState<Shop | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    shopService.getMyShop().then(setShop).catch(() => {});
  }, []);

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/login'); } },
    ]);
  }

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

  function toggleOpen() {
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {shop ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop Details</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Shop Name</Text>
              <Text style={styles.cardValue}>{shop.name}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Address</Text>
              <Text style={styles.cardValue} numberOfLines={2}>{shop.address}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Phone</Text>
              <Text style={styles.cardValue}>{shop.phone}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Hours</Text>
              <Text style={styles.cardValue}>{shop.opening_time} – {shop.closing_time}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Delivery Radius</Text>
              <Text style={styles.cardValue}>{shop.delivery_radius_km} km</Text>
            </View>
            <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
              <View>
                <Text style={styles.cardLabel}>Shop Status</Text>
                <Text style={{ fontSize: 12, color: shop.is_open ? Colors.success : Colors.error, marginTop: 2 }}>
                  {toggling ? 'Updating...' : shop.is_open ? 'Open for orders' : 'Closed'}
                </Text>
              </View>
              <Switch
                value={shop.is_open}
                onValueChange={toggleOpen}
                disabled={toggling}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={shop.is_open ? Colors.primary : Colors.gray}
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.noShop}>
          <Ionicons name="storefront-outline" size={48} color={Colors.gray} />
          <Text style={styles.noShopText}>No shop registered yet</Text>
          <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/(shop)/register-shop')}>
            <Text style={styles.registerBtnText}>Register Your Shop</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, padding: 24, paddingTop: 60, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { fontSize: 28, fontWeight: '700', color: Colors.white },
  name: { fontSize: 20, fontWeight: '700', color: Colors.white },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  card: { backgroundColor: Colors.white, borderRadius: 12, overflow: 'hidden' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cardLabel: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  cardValue: { fontSize: 14, fontWeight: '500', color: Colors.text, flex: 2, textAlign: 'right' },
  noShop: { alignItems: 'center', padding: 40, gap: 12 },
  noShopText: { fontSize: 14, color: Colors.textSecondary },
  registerBtn: { marginTop: 4, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  registerBtnText: { color: Colors.white, fontWeight: '600', fontSize: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, margin: 16, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.error },
  logoutText: { fontSize: 15, fontWeight: '600', color: Colors.error },
});
