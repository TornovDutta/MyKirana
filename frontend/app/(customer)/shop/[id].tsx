import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, ScrollView,
} from 'react-native';
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const cartCount = useCartStore((s) => s.getItemCount());

  const fetchProducts = useCallback(async () => {
    if (!id) return;
    try {
      const data = await productService.getByShop(id, category ?? undefined, search || undefined);
      setProducts(data);
    } catch {
      /* handled silently */
    }
  }, [id, category, search]);

  useEffect(() => {
    if (!id) return;
    shopService.getById(id).then(setShop).catch(() => {});
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts().finally(() => setLoading(false));
    }, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchProducts, search]);

  const availableProducts = products.filter((p) => p.is_available);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        {cartCount > 0 && (
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/(customer)/cart')}>
            <Ionicons name="cart-outline" size={22} color={Colors.white} />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
            </View>
          </TouchableOpacity>
        )}
        {shop?.image_url ? (
          <Image source={{ uri: shop.image_url }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, styles.heroFallback]}>
            <Text style={styles.heroInitial}>{shop?.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
        <View style={styles.heroOverlay} />
        <View style={styles.shopInfo}>
          <Text style={styles.shopName} numberOfLines={1}>{shop?.name ?? '...'}</Text>
          <Text style={styles.shopAddress} numberOfLines={1}>{shop?.address}</Text>
          <View style={styles.shopMeta}>
            {shop && (
              <>
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={13} color={Colors.secondary} />
                  <Text style={styles.metaText}>{shop.rating > 0 ? shop.rating.toFixed(1) : 'New'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.metaText}>{shop.opening_time} – {shop.closing_time}</Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: shop.is_open ? Colors.success : Colors.error }]}>
                  <Text style={styles.statusText}>{shop.is_open ? 'Open' : 'Closed'}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={Colors.textLight}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.gray} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        style={styles.categoryRow}
      >
        {[null, ...PRODUCT_CATEGORIES].map((c) => (
          <TouchableOpacity
            key={c ?? '__all__'}
            style={[styles.catChip, category === c && styles.catChipActive]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.catText, category === c && styles.catTextActive]}>{c ?? 'All'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Closed banner */}
      {shop && !shop.is_open && (
        <View style={styles.closedBanner}>
          <Ionicons name="lock-closed-outline" size={16} color={Colors.white} />
          <Text style={styles.closedBannerText}>This shop is currently closed. You cannot add items to your cart.</Text>
        </View>
      )}

      {/* Products */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={availableProducts}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => <ProductCard product={item} shopIsOpen={shop?.is_open ?? true} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="cube-outline" size={48} color={Colors.gray} />
              <Text style={styles.hint}>No products found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { position: 'relative', height: 220 },
  backBtn: { position: 'absolute', top: 48, left: 16, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  cartBtn: { position: 'absolute', top: 48, right: 16, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  cartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: Colors.error, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { fontSize: 9, color: Colors.white, fontWeight: '700' },
  heroImage: { width: '100%', height: 220 },
  heroFallback: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  heroInitial: { fontSize: 72, fontWeight: '800', color: Colors.white },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)' },
  shopInfo: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  shopName: { fontSize: 22, fontWeight: '800', color: Colors.white },
  shopAddress: { fontSize: 13, color: 'rgba(255,255,255,0.82)', marginTop: 2 },
  shopMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  statusChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusText: { fontSize: 11, color: Colors.white, fontWeight: '700' },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, margin: 16, marginBottom: 8, borderRadius: 10, paddingHorizontal: 12, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: Colors.text },

  categoryRow: { maxHeight: 44 },
  categories: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { fontSize: 13, color: Colors.textSecondary },
  catTextActive: { color: Colors.white, fontWeight: '600' },

  closedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.gray, marginHorizontal: 16, marginTop: 8, marginBottom: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  closedBannerText: { flex: 1, fontSize: 13, color: Colors.white, fontWeight: '500' },

  row: { paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  list: { paddingTop: 12, paddingBottom: 100 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  hint: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
