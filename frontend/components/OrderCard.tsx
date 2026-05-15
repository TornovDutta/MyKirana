import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../constants/config';
import Colors from '../constants/colors';

interface OrderCardProps {
  order: Order;
  role?: 'customer' | 'shop_owner' | 'delivery_partner';
}

export default function OrderCard({ order, role = 'customer' }: OrderCardProps) {
  const statusColor = ORDER_STATUS_COLORS[order.status] ?? Colors.gray;
  const statusLabel = ORDER_STATUS_LABELS[order.status] ?? order.status;
  const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => role === 'customer' && router.push(`/(customer)/order/${order.id}` as any)}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
      <Text style={styles.date}>{date}</Text>
      <Text style={styles.items} numberOfLines={1}>
        {order.items.slice(0, 3).map((i) => i.product_name).join(', ')}
        {order.items.length > 3 && ` +${order.items.length - 3} more`}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.total}>₹{order.total.toFixed(2)}</Text>
        <View style={styles.footerMeta}>
          <Ionicons name="cube-outline" size={13} color={Colors.gray} />
          <Text style={styles.footerMetaText}>{order.items.length} items</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 15, fontWeight: '700', color: Colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  date: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  items: { fontSize: 13, color: Colors.text, marginTop: 6 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  total: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  footerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerMetaText: { fontSize: 12, color: Colors.gray },
});
