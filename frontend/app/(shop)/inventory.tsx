import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Switch, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { productService } from '../../services/products';
import { Product } from '../../types';
import Colors from '../../constants/colors';

export default function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await productService.getMyProducts();
      setProducts(data);
    } catch {
      /* handled silently */
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const onRefresh = useCallback(
    async () => { setRefreshing(true); await fetchProducts(); setRefreshing(false); },
    [fetchProducts]
  );

  const refreshControl = useMemo(
    () => <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />,
    [refreshing, onRefresh]
  );

  const toggleAvailability = useCallback(async (product: Product) => {
    try {
      await productService.updateProduct(product.id, { is_available: !product.is_available });
      setProducts((ps) => ps.map((p) => (p.id === product.id ? { ...p, is_available: !p.is_available } : p)));
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update product' });
    }
  }, []);

  const deleteProduct = useCallback((product: Product) => {
    Alert.alert('Delete Product', `Remove "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await productService.deleteProduct(product.id);
            setProducts((ps) => ps.filter((p) => p.id !== product.id));
            Toast.show({ type: 'success', text1: 'Product removed' });
          } catch {
            Toast.show({ type: 'error', text1: 'Failed to delete product' });
          }
        },
      },
    ]);
  }, []);

  const renderProductRow = useCallback(({ item }: { item: Product }) => (
    <View style={styles.productRow}>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productMeta}>{item.category} • {item.unit}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{item.price}</Text>
          <Text style={styles.stock}>Stock: {item.quantity_in_stock}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Switch
          value={item.is_available}
          onValueChange={() => toggleAvailability(item)}
          trackColor={{ false: Colors.border, true: Colors.primaryLight }}
          thumbColor={item.is_available ? Colors.primary : Colors.gray}
        />
        <Pressable onPress={() => deleteProduct(item)} style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}>
          <Ionicons name="trash-outline" size={18} color={Colors.error} />
        </Pressable>
      </View>
    </View>
  ), [toggleAvailability, deleteProduct]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory ({products.length})</Text>
        <Pressable style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]} onPress={() => router.push('/(shop)/add-product')}>
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        renderItem={renderProductRow}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color={Colors.gray} />
            <Text style={styles.emptyText}>No products yet. Add your first product!</Text>
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
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
  list: { padding: 16, paddingBottom: 80 },
  productRow: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 10, padding: 14, marginBottom: 8, alignItems: 'center' },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  productMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  price: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  stock: { fontSize: 12, color: Colors.textSecondary },
  actions: { alignItems: 'center', gap: 8 },
  deleteBtn: { padding: 4 },
  empty: { alignItems: 'center', padding: 60, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
