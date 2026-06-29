import React, { useEffect, useReducer, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TextInput, Pressable,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { shopService } from '../../../services/shops';
import { productService } from '../../../services/products';
import { useCartStore } from '../../../stores/cartStore';
import ProductCard from '../../../components/ProductCard';
import { Shop, Product } from '../../../types';
import { PRODUCT_CATEGORIES } from '../../../constants/config';
import Colors from '../../../constants/colors';

interface ShopDetailState { shop: Shop | null; products: Product[]; loading: boolean; search: string; category: string | null; }
type ShopDetailAction =
  | { type: 'set_shop'; value: Shop | null }
  | { type: 'set_products'; value: Product[] }
  | { type: 'set_loading'; value: boolean }
  | { type: 'set_search'; value: string }
  | { type: 'set_category'; value: string | null };
function shopDetailReducer(state: ShopDetailState, action: ShopDetailAction): ShopDetailState {
  switch (action.type) {
    case 'set_shop': return { ...state, shop: action.value };
    case 'set_products': return { ...state, products: action.value };
    case 'set_loading': return { ...state, loading: action.value };
    case 'set_search': return { ...state, search: action.value };
    case 'set_category': return { ...state, category: action.value };
  }
}

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [state, dispatch] = useReducer(shopDetailReducer, { shop: null, products: [], loading: true, search: '', category: null });
  const { shop, products, loading, search, category } = state;
  const cartCount = useCartStore((s) => s.getItemCount());

  useEffect(() => {
    if (!id) return;
    shopService.getById(id).then((d) => dispatch({ type: 'set_shop', value: d })).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const timer = setTimeout(async () => {
      try {
        const data = await productService.getByShop(id, category ?? undefined, search || undefined);
        dispatch({ type: 'set_products', value: data });
      } catch {
        /* handled silently */
      } finally {
        dispatch({ type: 'set_loading', value: false });
      }
    }, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [id, category, search]);

  const categoryData = useMemo<(string | null)[]>(() => [null, ...PRODUCT_CATEGORIES], []);
  const availableProducts = useMemo(() => products.filter((p) => p.is_available), [products]);

  const renderCategoryChip = useCallback(({ item: c }: { item: string | null }) => (
    <Pressable
      style={({ pressed }) => [styles.catChip, category === c && styles.catChipActive, pressed && { opacity: 0.7 }]}
      onPress={() => dispatch({ type: 'set_category', value: c })}
    >
      <Text style={[styles.catText, category === c && styles.catTextActive]}>{c ?? 'All'}</Text>
    </Pressable>
  ), [category]);

  const renderProductCard = useCallback(({ item }: { item: Product }) => (
    <ProductCard product={item} shopIsOpen={shop?.is_open ?? true} />
  ), [shop?.is_open]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </Pressable>
        {cartCount > 0 && (
          <Pressable style={({ pressed }) => [styles.cartBtn, pressed && { opacity: 0.7 }]} onPress={() => router.push('/(customer)/cart')}>
            <Ionicons name="cart-outline" size={22} color={Colors.white} />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
            </View>
          </Pressable>
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
          onChangeText={(v) => dispatch({ type: 'set_search', value: v })}
          placeholderTextColor={Colors.textLight}
        />
        {search ? (
          <Pressable onPress={() => dispatch({ type: 'set_search', value: '' })}>
            <Ionicons name="close-circle" size={18} color={Colors.gray} />
          </Pressable>
        ) : null}
      </View>

      {/* Category chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categoryData}
        keyExtractor={(c) => c ?? '__all__'}
        renderItem={renderCategoryChip}
        contentContainerStyle={styles.categories}
        style={styles.categoryRow}
      />

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
          renderItem={renderProductCard}
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

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, margin: 16, marginBottom: 8, borderRadius: 10, paddingHorizontal: 12, gap: 8, boxShadow: '0px 1px 4px rgba(0,0,0,0.06)' },
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
