import React, { useEffect, useReducer, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shopService } from '../../services/shops';
import { useLocation } from '../../hooks/useLocation';
import { useAuthStore } from '../../stores/authStore';
import ShopCard from '../../components/ShopCard';
import { Shop } from '../../types';
import { PRODUCT_CATEGORIES } from '../../constants/config';
import Colors from '../../constants/colors';

interface HomeState { shops: Shop[]; loading: boolean; refreshing: boolean; search: string; category: string | null; }
type HomeAction =
  | { type: 'set_shops'; value: Shop[] }
  | { type: 'set_loading'; value: boolean }
  | { type: 'set_refreshing'; value: boolean }
  | { type: 'set_search'; value: string }
  | { type: 'set_category'; value: string | null };
function homeReducer(state: HomeState, action: HomeAction): HomeState {
  switch (action.type) {
    case 'set_shops': return { ...state, shops: action.value };
    case 'set_loading': return { ...state, loading: action.value };
    case 'set_refreshing': return { ...state, refreshing: action.value };
    case 'set_search': return { ...state, search: action.value };
    case 'set_category': return { ...state, category: action.value };
  }
}

export default function CustomerHome() {
  const { user } = useAuthStore();
  const { lat, lng, loading: locLoading } = useLocation();
  const [state, dispatch] = useReducer(homeReducer, { shops: [], loading: false, refreshing: false, search: '', category: null });
  const { shops, loading, refreshing, search, category } = state;

  const fetchShops = useCallback(async () => {
    if (!lat || !lng) return;
    dispatch({ type: 'set_loading', value: true });
    try {
      const data = await shopService.getNearby(lat, lng, 10);
      dispatch({ type: 'set_shops', value: data });
    } catch {
      /* handled silently */
    } finally {
      dispatch({ type: 'set_loading', value: false });
    }
  }, [lat, lng]);

  useEffect(() => { fetchShops(); }, [fetchShops]);

  const onRefresh = useCallback(async () => {
    dispatch({ type: 'set_refreshing', value: true });
    await fetchShops();
    dispatch({ type: 'set_refreshing', value: false });
  }, [fetchShops]);

  const refreshControl = useMemo(
    () => <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />,
    [refreshing, onRefresh]
  );

  const categoryData = useMemo<(string | null)[]>(() => [null, ...PRODUCT_CATEGORIES], []);

  const filtered = useMemo(() =>
    shops.filter((s) =>
      (!category || s.categories.includes(category)) &&
      (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.address.toLowerCase().includes(search.toLowerCase()))
    ),
    [shops, category, search]
  );

  const renderCategoryChip = useCallback(({ item }: { item: string | null }) => (
    <Pressable
      style={({ pressed }) => [styles.catChip, category === item && styles.catChipActive, pressed && { opacity: 0.7 }]}
      onPress={() => dispatch({ type: 'set_category', value: item })}
    >
      <Text style={[styles.catText, category === item && styles.catTextActive]}>{item ?? 'All'}</Text>
    </Pressable>
  ), [category]);

  const renderShopCard = useCallback(({ item }: { item: Shop }) => (
    <ShopCard shop={item} />
  ), []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.locationText}>{locLoading ? 'Getting location...' : lat ? 'Location found' : 'Location unavailable'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search shops..."
          value={search}
          onChangeText={(v) => dispatch({ type: 'set_search', value: v })}
          placeholderTextColor={Colors.textLight}
        />
        {search ? <Pressable onPress={() => dispatch({ type: 'set_search', value: '' })}><Ionicons name="close-circle" size={18} color={Colors.gray} /></Pressable> : null}
      </View>

      <FlatList
        horizontal
        data={categoryData}
        keyExtractor={(item) => item ?? '__all__'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        renderItem={renderCategoryChip}
        style={styles.categoryList}
      />

      {locLoading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /><Text style={styles.hint}>Detecting your location...</Text></View>
      ) : !lat ? (
        <View style={styles.center}><Ionicons name="location-outline" size={48} color={Colors.gray} /><Text style={styles.hint}>Location permission required to find nearby shops</Text></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          renderItem={renderShopCard}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          ListEmptyComponent={
            loading ? (
              <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
            ) : (
              <View style={styles.center}>
                <Ionicons name="storefront-outline" size={48} color={Colors.gray} />
                <Text style={styles.hint}>No shops found nearby</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 20 },
  greeting: { fontSize: 22, fontWeight: '700', color: Colors.white },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, margin: 16, borderRadius: 10, paddingHorizontal: 12, gap: 8, boxShadow: '0px 1px 4px rgba(0,0,0,0.06)' },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: Colors.text },
  categoryList: { maxHeight: 44 },
  categories: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { fontSize: 13, color: Colors.textSecondary },
  catTextActive: { color: Colors.white, fontWeight: '600' },
  list: { paddingTop: 8, paddingBottom: 80 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  hint: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
