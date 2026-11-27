import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../constants/config';
import Colors from '../constants/colors';

interface OrderCardProps {
  order: Order;
  viewerRole?: 'customer' | 'shop_owner' | 'delivery_partner';
}

export default function OrderCard({ order, viewerRole = 'customer' }: OrderCardProps) {
  const statusColor = ORDER_STATUS_COLORS[order.status] ?? Colors.gray;
  const statusLabel = ORDER_STATUS_LABELS[order.status] ?? order.status;
  const date = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (viewerRole !== 'customer') return;
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true, friction: 8 }).start();
  };

  const handlePressOut = () => {
    if (viewerRole !== 'customer') return;
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && viewerRole === 'customer' && { opacity: 0.9 }]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => viewerRole === 'customer' && router.push(`/order/${order.id}` as any)}
      >
        <View style={styles.header}>
          <View style={styles.idRow}>
            <View style={styles.iconPill}>
              <Ionicons name="receipt" size={14} color={Colors.primary} />
            </View>
            <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
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
          <View style={styles.footerRight}>
            <View style={styles.footerMeta}>
              <Ionicons name="cube-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.footerMetaText}>{order.items.length} items</Text>
            </View>
            {viewerRole === 'customer' && (
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.primarySubtle,
    elevation: 3,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconPill: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderId: { fontSize: 15, fontWeight: '800', color: Colors.text },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },
  date: { fontSize: 12, color: Colors.textSecondary, marginTop: 8, fontWeight: '500' },
  items: { fontSize: 13, color: Colors.text, marginTop: 6, fontWeight: '500' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  total: { fontSize: 17, fontWeight: '800', color: Colors.primary },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerMetaText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
});
