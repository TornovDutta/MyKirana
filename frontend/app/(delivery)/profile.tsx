import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { deliveryService } from '../../services/delivery';
import { useAuthStore } from '../../stores/authStore';
import Colors from '../../constants/colors';

export default function DeliveryProfile() {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState({ total: 0, completed: 0 });

  useEffect(() => {
    deliveryService.getMyDeliveries().then((deliveries) => {
      setStats({ total: deliveries.length, completed: deliveries.filter((d: any) => d.status === 'delivered').length });
    }).catch(() => {});
  }, []);

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/login'); } },
    ]);
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="bicycle" size={36} color={Colors.white} />
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: Colors.success }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: Colors.secondary }]}>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</Text>
          <Text style={styles.statLabel}>Success Rate</Text>
        </View>
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    padding: 28,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: { fontSize: 22, fontWeight: '800', color: Colors.white, letterSpacing: -0.3 },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  phone: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primarySubtle,
    padding: 18,
    elevation: 3,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    margin: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.errorMuted,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.error },
});
