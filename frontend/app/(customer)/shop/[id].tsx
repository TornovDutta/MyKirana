import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { shopService } from '../../../services/shops';
import { productService } from '../../../services/products';
import { useCartStore } from '../../../stores/cartStore';
import ProductCard from '../../../components/ProductCard';
import { Shop, Product } from '../../../types';
import { PRODUCT_CATEGORIES } from '../../../constants/config';
import Colors from '../../../constants/colors';

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const cartCount = useCartStore((s) => s.getItemCount());

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [shopData, productsData] = await Promise.all([
          shopService.getById(id),
          productService.getByShop(id, category ?? undefined),
        ]);
        setShop(shopData);
        setProducts(productsData);
      } catch {
        /* handled silently */
      } finally {
        setLoading(false);
      }
    })();
  }, [id, category]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        {cartCount > 0 && (
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/(customer)/cart')}>
            <Ionicons name="cart" size={22} color={Colors.white} />
            <Text style={styles.cartCount}>{cartCount}</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => <ProductCard product={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {shop?.image_url ? (
              <Image source={{ uri: shop.image_url }} style={styles.coverImage} />
            ) : (
              <View style={[styles.coverImage, { backgroundColor: Colors.primary }]}>
                <Text style={styles.shopInitial}>{shop?.name[0]}</Text>
              </View>
            )}
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>{shop?.name}</Text>
              <Text style={styles.shopAddress}>{shop?.address}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={14} color={Colors.secondary} />
                  <Text style={styles.metaText}>{shop?.rating && shop.rating > 0 ? shop.rating.toFixed(1) : 'New'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: shop?.is_open ? Colors.success + '20' : Colors.error + '20' }]}>
                  <Text style={{ color: shop?.is_open ? Colors.success : Colors.error, fontSize: 12, fontWeight: '600' }}>
                    {shop?.is_open ? 'Open' : 'Closed'}
                  </Text>
                </View>
                <Text style={styles.metaText}>{shop?.opening_time} – {shop?.closing_time}</Text>
              </View>
            </View>
            <FlatList
              horizontal
              data={[null, ...PRODUCT_CATEGORIES]}
              keyExtractor={(c) => c ?? '__all__'}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catRow}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.catChip, category === item && styles.catActive]}
                  onPress={() => setCategory(item)}
                >
                  <Text style={[styles.catText, category === item && styles.catTextActive]}>{item ?? 'All'}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="cube-outline" size={48} color={Colors.gray} />
            <Text style={styles.emptyText}>No products in this category</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  headerBar: { position: 'absolute', top: 48, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  cartBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  cartCount: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  coverImage: { width: '100%', height: 200, alignItems: 'center', justifyContent: 'center' },
  shopInitial: { fontSize: 64, fontWeight: '800', color: Colors.white },
  shopInfo: { backgroundColor: Colors.white, padding: 16 },
  shopName: { fontSize: 22, fontWeight: '700', color: Colors.text },
  shopAddress: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: Colors.textSecondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  catRow: { paddingHorizontal: 16, gap: 8, paddingVertical: 12, backgroundColor: Colors.white },
  catChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  catActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { fontSize: 13, color: Colors.textSecondary },
  catTextActive: { color: Colors.white, fontWeight: '600' },
  row: { justifyContent: 'space-between', paddingHorizontal: 16, gap: 10 },
  list: { paddingBottom: 100, gap: 10 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, marginTop: 8 },
});
